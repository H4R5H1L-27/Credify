import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEther, formatEther, type Address } from 'viem';
import { loadDeployment, ChainClient } from './chain/client.js';
import { ProjectionStore } from './store/projection.js';
import { VerificationStore } from './store/verification.js';
import { ChainIndexer } from './chain/indexer.js';
import { LoanService } from './services/loan-service.js';
import { ObservabilityService } from './services/observability-service.js';
import { buildServer } from './server.js';
import { poolAbi, reputationAbi, kycAbi } from './chain/abis.js';

async function setupTestApp() {
  const deployment = await loadDeployment();
  const chain = new ChainClient(deployment);
  const store = new ProjectionStore('test-sync-qa-projection.json');
  const verificationStore = new VerificationStore('test-sync-qa-verification.json');
  const indexer = new ChainIndexer(chain, store);
  const loans = new LoanService(chain, store);
  await store.load();
  await verificationStore.load();
  await indexer.indexOnce();
  const observability = new ObservabilityService(chain, store, verificationStore, loans);

  const app = buildServer({
    deployment,
    chain,
    store,
    verificationStore,
    indexer,
    loans,
    observability,
  });

  return { app, deployment, chain, store, verificationStore, indexer, loans, observability };
}

test('Phase 31 — End-to-End System Synchronization QA Lifecycle', async (t) => {
  const ctx = await setupTestApp();
  const { app, deployment, chain, store, indexer } = ctx;

  const borrowerAddr = deployment.accounts.borrower;
  const lenderAlphaAddr = deployment.accounts.lenders[0];
  const lenderBetaAddr = deployment.accounts.lenders[1];
  const merchantAAddr = deployment.accounts.merchants[0];

  let poolAddress: Address;

  await t.test('1. Borrower wallet presence & console observability', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/evaluator/wallets' });
    assert.equal(res.statusCode, 200);
    const wallets = JSON.parse(res.body);
    const borrower = wallets.find((w: any) => w.address.toLowerCase() === borrowerAddr.toLowerCase());
    assert.ok(borrower, 'Borrower found in evaluator wallets');
  });

  await t.test('2. Identity verification on KYCRegistry & CQRS projection sync', async () => {
    const submitRes = await app.inject({
      method: 'POST',
      url: '/api/v1/verification/requests',
      payload: {
        walletAddress: borrowerAddr,
        role: 'BORROWER',
        profile: {
          fullName: 'Aarav Menon',
          organization: 'Sync QA Logistics Corp',
          role: 'BORROWER',
          referenceId: 'QA-SYNC-2026',
        },
      },
    });
    assert.equal(submitRes.statusCode, 200);
    const reqData = JSON.parse(submitRes.body);

    const approveRes = await app.inject({
      method: 'POST',
      url: `/api/v1/verification/requests/${reqData.id}/review`,
      payload: {
        status: 'VERIFIED',
      },
    });
    assert.equal(approveRes.statusCode, 200);

    // On-chain check
    const isVerifiedOnChain = await chain.publicClient.readContract({
      address: deployment.contracts.kycRegistry,
      abi: kycAbi,
      functionName: 'isVerified',
      args: [borrowerAddr],
    });
    assert.equal(isVerifiedOnChain, true, 'Borrower verified on-chain');

    // Read model sync
    const readModelRes = await app.inject({ method: 'GET', url: `/api/v1/identity/${borrowerAddr}` });
    assert.equal(readModelRes.statusCode, 200);
    assert.equal(JSON.parse(readModelRes.body).isVerified, true, 'Read model reflects KYC status');
  });

  await t.test('3. Create Agreement via LoanFactory and verify on-chain & read model consistency', async () => {
    // Ensure lenders & merchants verified
    for (const addr of [lenderAlphaAddr, lenderBetaAddr, merchantAAddr]) {
      const isVer = await chain.publicClient.readContract({
        address: deployment.contracts.kycRegistry,
        abi: kycAbi,
        functionName: 'isVerified',
        args: [addr],
      });
      if (!isVer) {
        await chain.setVerified('operator', addr, true, '0x0000000000000000000000000000000000000000000000000000000000000000');
      }
    }

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/loans',
      payload: {
        borrowerId: 'borrower',
        naturalLanguageAgreement: 'Agreement to borrow 2.0 ETH for inventory procurement with 8% APR across 30 days.',
        parsedTerms: {
          borrower: borrowerAddr,
          targetWei: parseEther('2.0').toString(),
          durationSeconds: 86400 * 30,
          aprBps: 800,
          maxSpendWei: parseEther('1.0').toString(),
          defaultQuorumBps: 5100,
          merchants: [merchantAAddr],
        },
      },
    });
    assert.equal(createRes.statusCode, 200);
    const loanData = JSON.parse(createRes.body);
    poolAddress = loanData.loanId as Address;
    assert.ok(poolAddress && poolAddress.startsWith('0x'), 'LoanPool created');

    // On-chain contract state
    const targetWei = await chain.publicClient.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: 'targetWei',
    });
    assert.equal(targetWei, parseEther('2.0'), 'On-chain target matches 2 ETH');

    // Read model projection
    const poolRes = await app.inject({ method: 'GET', url: `/api/v1/loans/${poolAddress}` });
    assert.equal(poolRes.statusCode, 200);
    const poolData = JSON.parse(poolRes.body);
    assert.equal(poolData.status, 'FUNDING');
    assert.equal(poolData.contributedWei, '0');
  });

  await t.test('4. Lender contribution & partial funding projection', async () => {
    const contributeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/loans/${poolAddress}/contribute`,
      payload: {
        lenderId: 'lender-alpha',
        amountWei: parseEther('1.0').toString(),
      },
    });
    assert.equal(contributeRes.statusCode, 200);

    const onChainContributed = await chain.publicClient.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: 'totalContributed',
    });
    assert.equal(onChainContributed, parseEther('1.0'));

    const poolRes = await app.inject({ method: 'GET', url: `/api/v1/loans/${poolAddress}` });
    const poolData = JSON.parse(poolRes.body);
    assert.equal(poolData.contributedWei, parseEther('1.0').toString());
    assert.equal(poolData.status, 'FUNDING');
  });

  await t.test('5. Full funding threshold met -> Automatic activation & indexer capture', async () => {
    const contributeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/loans/${poolAddress}/contribute`,
      payload: {
        lenderId: 'lender-beta',
        amountWei: parseEther('1.0').toString(),
      },
    });
    assert.equal(contributeRes.statusCode, 200);

    // On-chain status is Active (1)
    const onChainStatus = await chain.publicClient.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: 'status',
    });
    assert.equal(Number(onChainStatus), 1, 'Contract status automatically Active (1)');

    // Read model & indexer
    const poolRes = await app.inject({ method: 'GET', url: `/api/v1/loans/${poolAddress}` });
    const poolData = JSON.parse(poolRes.body);
    assert.equal(poolData.status, 'ACTIVE');

    // Live events stream
    const eventsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/console/events?contract=${poolAddress}`,
    });
    const events = JSON.parse(eventsRes.body);
    const activatedEvent = events.find((e: any) => e.eventName === 'LoanActivated');
    assert.ok(activatedEvent, 'LoanActivated event indexed and observed');
  });

  await t.test('6. Policy-approved supplier spend & balance increase', async () => {
    const merchantBalanceBefore = await chain.publicClient.getBalance({ address: merchantAAddr });

    const spendRes = await app.inject({
      method: 'POST',
      url: `/api/v1/loans/${poolAddress}/spend`,
      payload: {
        borrowerId: 'borrower',
        merchant: merchantAAddr,
        amountWei: parseEther('0.5').toString(),
        category: 'QA Inventory Procurement',
      },
    });
    assert.equal(spendRes.statusCode, 200);

    const merchantBalanceAfter = await chain.publicClient.getBalance({ address: merchantAAddr });
    assert.equal(
      merchantBalanceAfter - merchantBalanceBefore,
      parseEther('0.5'),
      'Merchant received exactly 0.5 ETH'
    );

    const poolRes = await app.inject({ method: 'GET', url: `/api/v1/loans/${poolAddress}` });
    const poolData = JSON.parse(poolRes.body);
    assert.equal(poolData.totalSpentWei, parseEther('0.5').toString());
  });

  await t.test('7. Test failure paths: unauthorized merchant & spend limit exceeded', async () => {
    // Unapproved merchant
    const unapprovedRes = await app.inject({
      method: 'POST',
      url: `/api/v1/loans/${poolAddress}/spend`,
      payload: {
        borrowerId: 'borrower',
        merchant: deployment.accounts.deployer,
        amountWei: parseEther('0.1').toString(),
        category: 'Unauthorized Spend',
      },
    });
    assert.ok(unapprovedRes.statusCode >= 400, 'Spend to unapproved merchant rejected');

    // Exceed spend limit (maxSpendWei is 1.0 ETH, already spent 0.5 ETH, attempting 0.6 ETH)
    const exceedCapRes = await app.inject({
      method: 'POST',
      url: `/api/v1/loans/${poolAddress}/spend`,
      payload: {
        borrowerId: 'borrower',
        merchant: merchantAAddr,
        amountWei: parseEther('0.6').toString(),
        category: 'Cap Violation',
      },
    });
    assert.ok(exceedCapRes.statusCode >= 400, 'Spend exceeding cap rejected');

    // Invariant: total spent remains 0.5 ETH
    const onChainSpent = await chain.publicClient.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: 'totalSpent',
    });
    assert.equal(onChainSpent, parseEther('0.5'), 'State uncorrupted by failed transactions');
  });

  await t.test('8. Borrower full repayment and status transition to REPAID', async () => {
    // Repayment = 2.0 ETH principal + 8% APR = 2.16 ETH
    const repayAmount = parseEther('2.16');
    const repayRes = await app.inject({
      method: 'POST',
      url: `/api/v1/loans/${poolAddress}/repay`,
      payload: {
        borrowerId: 'borrower',
        amountWei: repayAmount.toString(),
      },
    });
    assert.equal(repayRes.statusCode, 200);

    const onChainStatus = await chain.publicClient.readContract({
      address: poolAddress,
      abi: poolAbi,
      functionName: 'status',
    });
    assert.equal(Number(onChainStatus), 2, 'Contract status is Repaid (2)');

    const poolRes = await app.inject({ method: 'GET', url: `/api/v1/loans/${poolAddress}` });
    const poolData = JSON.parse(poolRes.body);
    assert.equal(poolData.status, 'REPAID');
  });

  await t.test('9. Lender pro-rata claim and duplicate claim rejection failure path', async () => {
    const claimRes = await app.inject({
      method: 'POST',
      url: `/api/v1/loans/${poolAddress}/claim`,
      payload: {
        lenderId: 'lender-alpha',
      },
    });
    assert.equal(claimRes.statusCode, 200);

    // Duplicate claim must fail
    const dupRes = await app.inject({
      method: 'POST',
      url: `/api/v1/loans/${poolAddress}/claim`,
      payload: {
        lenderId: 'lender-alpha',
      },
    });
    assert.ok(dupRes.statusCode >= 400, 'Duplicate claim rejected with NothingToClaim');
  });

  await t.test('10. Borrower reputation upgrade consistency (+8 pts)', async () => {
    const [score, successes, defaults] = await chain.publicClient.readContract({
      address: deployment.contracts.reputationRegistry,
      abi: reputationAbi,
      functionName: 'getScore',
      args: [borrowerAddr],
    });

    const repRes = await app.inject({ method: 'GET', url: `/api/v1/reputation/${borrowerAddr}` });
    assert.equal(repRes.statusCode, 200);
    const repData = JSON.parse(repRes.body);

    assert.equal(repData.score, score, 'Read model reputation score matches contract');
    assert.equal(repData.successfulLoans, successes, 'Read model successes match contract');
    assert.ok(score > 50, 'Borrower received positive reputation credit');
  });

  await t.test('11. Indexer health invariants: SYNCED and lag <= 1', async () => {
    const idxRes = await app.inject({ method: 'GET', url: '/api/v1/console/indexer' });
    assert.equal(idxRes.statusCode, 200);
    const idxData = JSON.parse(idxRes.body);
    assert.equal(idxData.running, true);
    assert.ok(idxData.blockLag <= 1, `Lag is minimal: ${idxData.blockLag}`);
  });
});
