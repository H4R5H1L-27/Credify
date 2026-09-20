import type { LoanSummary, ReputationSnapshot } from '@credify/shared';
import type { Address } from 'viem';
import { ChainClient } from '../chain/client.js';
import { ProjectionStore } from '../store/projection.js';
import { principalById, principalForAddress } from './principals.js';
import { agreementParser } from './llm-terms.js';
import type { CreateLoanInput, ContributeInput } from '@credify/shared';

const statusMap = ['FUNDING', 'ACTIVE', 'REPAID', 'DEFAULTED', 'CANCELLED'] as const;

export class LoanService {
  constructor(private readonly chain: ChainClient, private readonly store?: ProjectionStore) {}

  async list(): Promise<LoanSummary[]> {
    const pools = await this.chain.getPools();
    return Promise.all(pools.map((pool) => this.detail(pool)));
  }

  async detail(pool: Address): Promise<LoanSummary> {
    const raw = await this.chain.readLoan(pool);
    const [status, target, contributed, repaid, repayable, spent, maturity, voteWeight, threshold] = raw.summary as readonly bigint[];
    const borrower = (await principalForAddress(this.chain, raw.borrower as Address)) ?? {
      id: raw.borrower, displayName: 'External borrower', role: 'BORROWER' as const, walletAddress: raw.borrower, verified: await this.chain.verified(raw.borrower as Address)
    };

    const lenderMap = new Map<string, { id: string; displayName: string; walletAddress: string }>();

    // 1. Include known demo principals
    const principals = ['lender-alpha', 'lender-beta', 'lender-gamma']
      .map((id) => principalById(this.chain, id))
      .filter(Boolean) as any[];
    for (const p of principals) {
      lenderMap.set(p.walletAddress.toLowerCase(), {
        id: p.id,
        displayName: p.displayName,
        walletAddress: p.walletAddress,
      });
    }

    // 2. Discover any additional lenders who contributed to this pool from indexed events
    if (this.store) {
      const events = this.store.eventsForLoan(pool);
      for (const evt of events) {
        if (evt.eventName === 'Funded' && evt.actor) {
          const lower = evt.actor.toLowerCase();
          if (!lenderMap.has(lower)) {
            const p = await principalForAddress(this.chain, evt.actor as Address);
            lenderMap.set(lower, {
              id: p?.id ?? evt.actor,
              displayName: p?.displayName ?? `Lender (${evt.actor.slice(0, 6)}...${evt.actor.slice(-4)})`,
              walletAddress: evt.actor,
            });
          }
        }
      }
    }

    const lenders = [];
    for (const info of lenderMap.values()) {
      const [amount, claimable, voted] = await this.chain.readLenderInfo(pool, info.walletAddress as Address);
      let claimed = 0n;
      try {
        claimed = await this.chain.readLenderClaimed(pool, info.walletAddress as Address);
      } catch {
        claimed = 0n;
      }
      const shareBps = contributed === 0n ? 0 : Number((amount * 10000n) / contributed);
      if (amount > 0n || principals.some((p) => p.walletAddress.toLowerCase() === info.walletAddress.toLowerCase())) {
        lenders.push({
          id: info.id,
          displayName: info.displayName,
          walletAddress: info.walletAddress,
          contributedWei: amount.toString(),
          shareBps,
          claimableWei: claimable.toString(),
          claimedWei: claimed.toString(),
          hasVoted: Boolean(voted)
        });
      }
    }

    return {
      id: pool,
      address: pool,
      borrower,
      status: statusMap[Number(status)],
      targetWei: target.toString(),
      contributedWei: contributed.toString(),
      fundedBps: target === 0n ? 0 : Number((contributed * 10000n) / target),
      aprBps: Number(await this.chain.publicClient.readContract({ address: pool, abi: [{ type: 'function', name: 'aprBps', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }] as const, functionName: 'aprBps' })),
      durationSeconds: Number(await this.chain.publicClient.readContract({ address: pool, abi: [{ type: 'function', name: 'durationSeconds', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }] as const, functionName: 'durationSeconds' })),
      maturity: new Date(Number(maturity) * 1000).toISOString(),
      totalRepaidWei: repaid.toString(),
      totalRepayableWei: repayable.toString(),
      totalSpentWei: spent.toString(),
      maxSpendWei: (await this.chain.publicClient.readContract({ address: pool, abi: [{ type: 'function', name: 'maxSpendWei', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }] as const, functionName: 'maxSpendWei' })).toString(),
      defaultVoteWeightWei: voteWeight.toString(),
      defaultThresholdWei: threshold.toString(),
      lenders,
      merchants: (raw.merchants as Address[]).map((x) => x)
    };
  }

  async create(input: CreateLoanInput) {
    const borrower = principalById(this.chain, input.borrowerId);
    if (!borrower) throw new Error('UNKNOWN_PRINCIPAL');
    const merchants = this.chain.deployment.accounts.merchants;
    const parsed = input.parsedTerms
      ? { terms: input.parsedTerms, source: 'provided-terms' as const, assumptions: [] as string[] }
      : await agreementParser().parse(input.naturalLanguageAgreement, merchants);
    const requestedMerchants = parsed.terms.merchants as Address[];
    const allowed = new Set(merchants.map((x) => x.toLowerCase()));
    if (requestedMerchants.some((m) => !allowed.has(m.toLowerCase()))) throw new Error('UNKNOWN_MERCHANT');
    const tx = await this.chain.createLoan(input.borrowerId, {
      borrower: borrower.walletAddress,
      targetWei: BigInt(parsed.terms.targetWei),
      durationSeconds: parsed.terms.durationSeconds,
      aprBps: parsed.terms.aprBps,
      maxSpendWei: BigInt(parsed.terms.maxSpendWei),
      defaultQuorumBps: parsed.terms.defaultQuorumBps,
      merchants: requestedMerchants
    });
    const pools = await this.chain.getPools();
    const address = pools[pools.length - 1];
    return { loanId: address, transactionHash: tx.hash, parsed };
  }

  principal(id: string) { return principalById(this.chain, id); }

  async contribute(pool: Address, input: ContributeInput) {
    if (!principalById(this.chain, input.lenderId)) throw new Error('UNKNOWN_PRINCIPAL');
    return this.chain.contribute(input.lenderId, pool, BigInt(input.amountWei));
  }

  async spend(pool: Address, borrowerId: string, merchant: Address, amountWei: bigint, category: string) {
    return this.chain.spend(borrowerId, pool, merchant, amountWei, category);
  }

  async repay(pool: Address, borrowerId: string, amountWei: bigint) {
    return this.chain.repay(borrowerId, pool, amountWei);
  }

  async claim(pool: Address, lenderId: string) { return this.chain.claim(lenderId, pool); }
  async cancelUnfunded(pool: Address, operatorId: string) { return this.chain.cancelUnfunded(operatorId, pool); }
  async refund(pool: Address, lenderId: string) { return this.chain.refund(lenderId, pool); }
  async voteDefault(pool: Address, lenderId: string) { return this.chain.voteDefault(lenderId, pool); }

  async reputation(address: Address): Promise<ReputationSnapshot> {
    const [score, successes, defaults] = await this.chain.reputation(address);
    return { borrowerAddress: address, score: Number(score), successfulLoans: Number(successes), defaultedLoans: Number(defaults), lastUpdatedAt: new Date().toISOString() };
  }
}
