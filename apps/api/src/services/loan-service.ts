import type { LoanSummary, ReputationSnapshot } from '@credify/shared';
import type { Address } from 'viem';
import { ChainClient } from '../chain/client.js';
import { ProjectionStore } from '../store/projection.js';
import { principalById, principalForAddress } from './principals.js';
import { createAgreementParser } from './llm-terms.js';
import { canonicalizeAgreementText, computeAgreementHash } from '@credify/shared';
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
    const [status, target, contributed, repaid, repayable, spent, maturity, voteWeight, threshold, fundingDeadline, gracePeriodSeconds, agreementHash] = raw.summary as readonly any[];
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
      fundingDeadline: fundingDeadline ? new Date(Number(fundingDeadline) * 1000).toISOString() : undefined,
      maturity: maturity && Number(maturity) > 0 ? new Date(Number(maturity) * 1000).toISOString() : '',
      totalRepaidWei: repaid.toString(),
      totalRepayableWei: repayable.toString(),
      totalSpentWei: spent.toString(),
      maxSpendWei: (await this.chain.publicClient.readContract({ address: pool, abi: [{ type: 'function', name: 'maxSpendWei', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }] as const, functionName: 'maxSpendWei' })).toString(),
      defaultVoteWeightWei: voteWeight.toString(),
      defaultThresholdWei: threshold.toString(),
      gracePeriodSeconds: gracePeriodSeconds !== undefined ? Number(gracePeriodSeconds) : undefined,
      agreementHash: agreementHash ? String(agreementHash) : undefined,
      lenders,
      merchants: (raw.merchants as Address[]).map((x) => x)
    };
  }

  async create(input: CreateLoanInput) {
    const borrower = principalById(this.chain, input.borrowerId);
    if (!borrower) throw new Error('UNKNOWN_PRINCIPAL');
    const merchants = this.chain.deployment.accounts.merchants;
    let termsToUse: any = input.parsedTerms;
    let agreementHash: `0x${string}` = '0x0000000000000000000000000000000000000000000000000000000000000000';

    if (input.naturalLanguageAgreement) {
      const canonical = canonicalizeAgreementText(input.naturalLanguageAgreement);
      agreementHash = computeAgreementHash(canonical);
    }

    if (!termsToUse) {
      const parsed = await createAgreementParser().parse(input.naturalLanguageAgreement);
      if (!parsed.terms) {
        throw new Error(`INCOMPLETE_TERMS: missing [${parsed.missingFields.join(', ')}]`);
      }
      termsToUse = parsed.terms;
      agreementHash = parsed.agreementHash;
    } else if (termsToUse.agreementHash) {
      agreementHash = termsToUse.agreementHash as `0x${string}`;
    }

    const requestedMerchants = termsToUse.merchants as Address[];
    const allowed = new Set(merchants.map((x) => x.toLowerCase()));
    if (requestedMerchants.some((m) => !allowed.has(m.toLowerCase()))) throw new Error('UNKNOWN_MERCHANT');

    const defaultFundingDuration = 7 * 24 * 60 * 60;
    const defaultGracePeriod = 3 * 24 * 60 * 60;
    const fundingDurationSeconds = termsToUse.fundingDurationSeconds ?? defaultFundingDuration;
    const gracePeriodSeconds = termsToUse.gracePeriodSeconds ?? defaultGracePeriod;
    const maxSpendWei = BigInt(termsToUse.maxSpendWei);
    const count = requestedMerchants.length || 1;
    const merchantCapsWei = termsToUse.merchantCapsWei
      ? termsToUse.merchantCapsWei.map((c: any) => BigInt(c))
      : requestedMerchants.map(() => maxSpendWei / BigInt(count));

    const tx = await this.chain.createLoan(input.borrowerId, {
      borrower: borrower.walletAddress as Address,
      targetWei: BigInt(termsToUse.targetWei),
      durationSeconds: termsToUse.durationSeconds,
      fundingDurationSeconds,
      aprBps: termsToUse.aprBps,
      maxSpendWei,
      defaultQuorumBps: termsToUse.defaultQuorumBps,
      gracePeriodSeconds,
      agreementHash,
      merchants: requestedMerchants,
      merchantCapsWei
    });
    const pools = await this.chain.getPools();
    const address = pools[pools.length - 1];
    return { loanId: address, transactionHash: tx.hash, parsed: { terms: termsToUse, agreementHash } };
  }

  principal(id: string) { return principalById(this.chain, id); }

  async contribute(pool: Address, input: ContributeInput) {
    const principal = principalById(this.chain, input.lenderId);
    if (!principal) throw new Error('UNKNOWN_PRINCIPAL');
    const raw = await this.chain.readLoan(pool);
    if (raw.borrower && (raw.borrower as string).toLowerCase() === principal.walletAddress.toLowerCase()) {
      throw new Error('BORROWER_CANNOT_CONTRIBUTE');
    }
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
