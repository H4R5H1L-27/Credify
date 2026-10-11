import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { summaryFor, ChainIndexer } from './chain/indexer.js';
import { ProjectionStore } from './store/projection.js';
import type { ActivityEvent } from '@credify/shared';

test('Indexer: summaryFor generates clear descriptions for all 14 state-changing events', () => {
  // 1. LoanCreated
  const sLoanCreated = summaryFor('LoanCreated', { targetWei: 10000000000000000000n });
  assert.ok(sLoanCreated.includes('parameterized loan pool was deployed'));

  // 2. Funded
  const sFunded = summaryFor('Funded', { amount: 1000000000000000000n });
  assert.ok(sFunded.includes('1000000000000000000 wei'));

  // 3. LoanActivated
  const sActivated = summaryFor('LoanActivated', { maturity: 1800000000n });
  assert.ok(sActivated.includes('active') || sActivated.includes('reached'));

  // 4. SpendExecuted
  const sSpend = summaryFor('SpendExecuted', { amount: 500000000000000000n });
  assert.ok(sSpend.includes('Disbursed'));

  // 5. RepaymentReceived
  const sRepay = summaryFor('RepaymentReceived', { amount: 1000000000000000000n, totalRepaid: 1000000000000000000n });
  assert.ok(sRepay.includes('Repayment'));

  // 6. RepaymentClaimed
  const sClaim = summaryFor('RepaymentClaimed', { amount: 600000000000000000n });
  assert.ok(sClaim.includes('claimed') && sClaim.includes('repayment'));

  // 7. DefaultVoteCast
  const sVote = summaryFor('DefaultVoteCast', { weight: 4000000000000000000n, totalVoteWeight: 4000000000000000000n });
  assert.ok(sVote.includes('default vote'));

  // 8. LoanDefaulted
  const sDefault = summaryFor('LoanDefaulted', { totalVoteWeight: 6000000000000000000n });
  assert.ok(sDefault.includes('DEFAULTED') || sDefault.includes('Consensus threshold reached'));

  // 9. LoanRepaid
  const sRepaid = summaryFor('LoanRepaid', { totalRepaid: 10800000000000000000n });
  assert.ok(sRepaid.includes('repaid'));

  // 10. FundingCancelled
  const sCancelled = summaryFor('FundingCancelled', { timestamp: 1700000000n });
  assert.ok(sCancelled.includes('expired') || sCancelled.includes('cancelled'));

  // 11. FundingRefunded
  const sRefunded = summaryFor('FundingRefunded', { amount: 2000000000000000000n });
  assert.ok(sRefunded.includes('reclaimed') || sRefunded.includes('refund'));

  // 12. ReputationUpdated (positive)
  const sRepSuccess = summaryFor('ReputationUpdated', { successful: true, score: 58, successes: 1, defaults: 0 });
  assert.ok(sRepSuccess.includes('Successful repayment') && sRepSuccess.includes('58/100'));

  // 13. ReputationUpdated (default)
  const sRepDefault = summaryFor('ReputationUpdated', { successful: false, score: 30, successes: 0, defaults: 1 });
  assert.ok(sRepDefault.includes('Default') && sRepDefault.includes('30/100'));

  // 14. VerificationUpdated and VerificationRevoked
  const sKycVerified = summaryFor('VerificationUpdated', { verified: true, account: '0x123' });
  assert.ok(sKycVerified.includes('verified'));

  const sKycRevoked = summaryFor('VerificationRevoked', { account: '0x123' });
  assert.ok(sKycRevoked.includes('revoked'));
});

test('Indexer Polling Lifecycle: startPolling and stopPolling manage worker state', async () => {
  const testFile = 'test-indexer-lifecycle.json';
  const testFilePath = resolve(process.cwd(), 'data', testFile);
  try { await rm(testFilePath, { force: true }); } catch {}

  const store = new ProjectionStore(testFile);
  await store.load();

  // Create a minimal mock ChainClient
  let queryCount = 0;
  const mockChain: any = {
    deployment: {
      network: 'localhost',
      chainId: 31337,
      contracts: {
        loanFactory: '0x0000000000000000000000000000000000000001',
        kycRegistry: '0x0000000000000000000000000000000000000002',
        reputationRegistry: '0x0000000000000000000000000000000000000003',
      }
    },
    blockNumber: async () => {
      queryCount++;
      return 10n;
    },
    getPools: async () => [],
    publicClient: {
      getBlock: async () => ({ timestamp: 1700000000n, hash: '0xblock10' }),
      getLogs: async () => []
    }
  };

  const indexer = new ChainIndexer(mockChain, store);
  assert.equal(indexer.isPolling(), false);

  // Start polling with short 50ms interval for testing
  indexer.startPolling(50);
  assert.equal(indexer.isPolling(), true);

  // Wait for at least 2 ticks
  await new Promise((r) => setTimeout(r, 140));

  assert.ok(queryCount >= 2, `Expected queryCount >= 2, got ${queryCount}`);
  assert.equal(store.lastIndexedBlock, 10n);

  // Stop polling
  indexer.stopPolling();
  assert.equal(indexer.isPolling(), false);

  const previousCount = queryCount;
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(queryCount, previousCount, 'Expected no further queries after stopPolling');

  try { await rm(testFilePath, { force: true }); } catch {}
});

test('Indexer Reorg Recovery: detects head reset or hash mismatch and rewinds projection', async () => {
  const testFile = 'test-indexer-reorg.json';
  const testFilePath = resolve(process.cwd(), 'data', testFile);
  try { await rm(testFilePath, { force: true }); } catch {}

  const store = new ProjectionStore(testFile);
  await store.load();
  store.setLastIndexedBlock(20n);
  store.setBlockHash(20n, '0xold_hash_20');

  const reorgEvent: ActivityEvent = {
    id: '0xreorg-tx',
    loanId: '0xpool',
    eventName: 'Funded',
    transactionHash: '0xreorg-tx',
    blockNumber: '20',
    summary: 'Old contribution',
    timestamp: '2026-10-11T11:00:00Z',
    data: {}
  };
  store.addEvents([reorgEvent]);
  await store.save();

  // Mock chain at block 15 (simulating a node reset / hard rewind to block 15)
  const mockChain: any = {
    deployment: {
      network: 'localhost',
      chainId: 31337,
      contracts: {
        loanFactory: '0x0000000000000000000000000000000000000001',
        kycRegistry: '0x0000000000000000000000000000000000000002',
        reputationRegistry: '0x0000000000000000000000000000000000000003',
      }
    },
    blockNumber: async () => 15n,
    getPools: async () => [],
    publicClient: {
      getBlock: async () => ({ timestamp: 1700000000n, hash: '0xnew_hash_15' }),
      getLogs: async () => []
    }
  };

  const indexer = new ChainIndexer(mockChain, store);
  await indexer.indexOnce();

  // Indexer must have detected head (15) < lastIndexed (20), rewound store to 15, and purged block 20 event
  assert.equal(store.lastIndexedBlock, 15n);
  assert.equal(store.allEvents().length, 0);

  try { await rm(testFilePath, { force: true }); } catch {}
});
