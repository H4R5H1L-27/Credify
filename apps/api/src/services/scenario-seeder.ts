import type { Address } from 'viem';
import { keccak256, toHex } from 'viem';
import { ChainClient } from '../chain/client.js';
import { LoanService } from './loan-service.js';
import { ProjectionStore } from '../store/projection.js';
import { VerificationStore } from '../store/verification.js';
import { ChainIndexer } from '../chain/indexer.js';
import { DEMO_ACCOUNTS } from '@credify/shared';

export interface SeedScenarioResult {
  ok: boolean;
  message: string;
  agreements: {
    completedPool: string;
    activePool: string;
    fundingPool: string;
  };
  identitiesVerifiedCount: number;
}

export class ScenarioSeeder {
  constructor(
    private readonly chain: ChainClient,
    private readonly loans: LoanService,
    private readonly store: ProjectionStore,
    private readonly verificationStore: VerificationStore,
    private readonly indexer: ChainIndexer
  ) {}

  async seedAll(): Promise<SeedScenarioResult> {
    const deployment = this.chain.deployment;

    // 1. Ensure all demo identities are registered & verified on-chain
    let identitiesVerifiedCount = 0;
    for (const acc of DEMO_ACCOUNTS) {
      if (acc.role === 'DEMO_OPERATOR') continue;

      const address = acc.address as Address;
      const isAlreadyVerified = await this.chain.verified(address).catch(() => false);

      const existingReq = this.verificationStore.getByAddress(address);
      if (!existingReq) {
        this.verificationStore.register({
          walletAddress: address,
          role: acc.role as any,
          profile: {
            fullName: acc.displayName,
            organization:
              acc.role === 'BORROWER'
                ? 'Apex Precision Tech'
                : acc.role === 'LENDER'
                ? `${acc.displayName} Syndicate`
                : `${acc.displayName} Ltd`,
            role: acc.role as any,
            referenceId: `SEED-${acc.id.toUpperCase()}-${Date.now().toString().slice(-4)}`,
            businessCategory:
              acc.id === 'merchant-a'
                ? 'Laboratory Materials & Sensors'
                : acc.id === 'merchant-b'
                ? 'Precision Optical & Computing Gear'
                : undefined,
          },
        });
      }

      if (!isAlreadyVerified) {
        const credentialHash = keccak256(toHex(`credify-academic-credential:${acc.id}:${address}`));
        const attestation = await this.chain.setVerified('operator', address, true, credentialHash);
        const req = this.verificationStore.getByAddress(address);
        if (req) {
          req.status = 'VERIFIED';
          req.attestationTxHash = attestation.hash;
          req.attestationBlock = attestation.receiptBlock;
          req.reviewedBy = deployment.accounts.deployer;
          req.reviewedAt = new Date().toISOString();
        }
        identitiesVerifiedCount++;
      } else {
        const req = this.verificationStore.getByAddress(address);
        if (req && req.status !== 'VERIFIED') {
          req.status = 'VERIFIED';
          req.reviewedBy = deployment.accounts.deployer;
          req.reviewedAt = new Date().toISOString();
        }
      }
    }
    await this.verificationStore.save();
    await this.indexer.indexOnce();

    const borrowerAddr = deployment.accounts.borrower;
    const merchants = deployment.accounts.merchants as Address[];

    // 2. Scenario 1: Completed Full Lifecycle Agreement (Repaid + Claimed + Reputation +8)
    const target1 = 10_000_000_000_000_000_000n; // 10 ETH
    const duration1 = 14 * 86400; // 14 days
    const apr1 = 800; // 8% APR
    const maxSpend1 = 8_000_000_000_000_000_000n; // 8 ETH max spend
    const quorum1 = 5001;

    await this.chain.createLoan('borrower', {
      borrower: borrowerAddr,
      targetWei: target1,
      durationSeconds: duration1,
      aprBps: apr1,
      maxSpendWei: maxSpend1,
      defaultQuorumBps: quorum1,
      merchants,
    });

    let pools = await this.chain.getPools();
    const pool1 = pools[pools.length - 1];

    // Lender contributions: 6 ETH (Alpha) + 4 ETH (Beta) = 10 ETH (Target Met -> ACTIVE)
    await this.chain.contribute('lender-alpha', pool1, 6_000_000_000_000_000_000n);
    await this.chain.contribute('lender-beta', pool1, 4_000_000_000_000_000_000n);

    // Borrower spending: 2.5 ETH to Merchant A for Laboratory Materials & Sensors
    await this.chain.spend(
      'borrower',
      pool1,
      merchants[0],
      2_500_000_000_000_000_000n,
      'Laboratory Materials & Sensors'
    );

    // Read exact total repayable amount from contract
    const pool1Detail = await this.loans.detail(pool1);
    const repayable1 = BigInt(pool1Detail.totalRepayableWei);

    // Borrower full repayment -> triggers LoanRepaid & ReputationRegistry.recordRepayment
    await this.chain.repay('borrower', pool1, repayable1);

    // Lenders claim their pro-rata principal + interest yield via pull payment
    await this.chain.claim('lender-alpha', pool1);
    await this.chain.claim('lender-beta', pool1);

    // 3. Scenario 2: Active Agreement with In-Progress Spending
    const target2 = 5_000_000_000_000_000_000n; // 5 ETH
    const duration2 = 30 * 86400; // 30 days
    const apr2 = 1000; // 10% APR
    const maxSpend2 = 4_000_000_000_000_000_000n; // 4 ETH max spend

    await this.chain.createLoan('borrower', {
      borrower: borrowerAddr,
      targetWei: target2,
      durationSeconds: duration2,
      aprBps: apr2,
      maxSpendWei: maxSpend2,
      defaultQuorumBps: 5001,
      merchants,
    });

    pools = await this.chain.getPools();
    const pool2 = pools[pools.length - 1];

    await this.chain.contribute('lender-alpha', pool2, 3_000_000_000_000_000_000n);
    await this.chain.contribute('lender-beta', pool2, 2_000_000_000_000_000_000n);

    // Partial spend to Merchant B
    await this.chain.spend(
      'borrower',
      pool2,
      merchants[1],
      1_500_000_000_000_000_000n,
      'Precision Computing Hardware'
    );

    // 4. Scenario 3: In-Progress Funding Agreement
    const target3 = 8_000_000_000_000_000_000n; // 8 ETH
    const duration3 = 21 * 86400; // 21 days
    const apr3 = 750; // 7.5% APR
    const maxSpend3 = 6_000_000_000_000_000_000n;

    await this.chain.createLoan('borrower', {
      borrower: borrowerAddr,
      targetWei: target3,
      durationSeconds: duration3,
      aprBps: apr3,
      maxSpendWei: maxSpend3,
      defaultQuorumBps: 5001,
      merchants,
    });

    pools = await this.chain.getPools();
    const pool3 = pools[pools.length - 1];

    // Lender Alpha contributes 3 ETH, 5 ETH remains unfunded
    await this.chain.contribute('lender-alpha', pool3, 3_000_000_000_000_000_000n);

    // Index all newly mined blocks and events
    await this.indexer.indexOnce();

    return {
      ok: true,
      message: 'Successfully seeded 3 realistic academic scenarios across all lifecycle states on local EVM.',
      agreements: {
        completedPool: pool1,
        activePool: pool2,
        fundingPool: pool3,
      },
      identitiesVerifiedCount,
    };
  }
}
