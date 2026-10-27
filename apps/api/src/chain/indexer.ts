import { decodeEventLog, hexToString, type Address } from 'viem';
import { factoryAbi, kycAbi, poolAbi, reputationAbi } from './abis.js';
import { ChainClient } from './client.js';
import { ProjectionStore } from '../store/projection.js';
import { principalForAddress } from '../services/principals.js';
import { config } from '../config.js';
import type { ActivityEvent } from '@credify/shared';

function isoFromTimestamp(value: bigint | number) {
  return new Date(Number(value) * 1000).toISOString();
}

async function resolveActor(chain: ChainClient, address?: string) {
  if (!address || !address.startsWith('0x')) return { actorName: undefined, actorRole: undefined };
  try {
    const p = await principalForAddress(chain, address as Address);
    return { actorName: p?.displayName, actorRole: p?.role };
  } catch {
    return { actorName: undefined, actorRole: undefined };
  }
}

export function summaryFor(eventName: string, args: any) {
  switch (eventName) {
    case 'Funded': return `Lender contributed ${args.amount?.toString()} wei to the pool.`;
    case 'LoanActivated': {
      const maturityDate = args.maturity ? ` Maturity set to ${isoFromTimestamp(args.maturity)}.` : '';
      return `Funding target reached; the loan is now active.${maturityDate}`;
    }
    case 'SpendExecuted': {
      let categoryText = '';
      try {
        if (args.category) {
          categoryText = hexToString(args.category).replace(/\0/g, '').trim();
        }
      } catch {}
      const ethAmount = args.amount ? `${(Number(args.amount) / 1e18).toFixed(2)} ETH` : '';
      return categoryText
        ? `Disbursed ${ethAmount} to approved supplier for ${categoryText}.`
        : `Disbursed ${ethAmount} to approved supplier.`;
    }
    case 'RepaymentReceived': {
      const ethAmount = args.amount ? `${(Number(args.amount) / 1e18).toFixed(4)} ETH` : '';
      const totalEth = args.totalRepaid ? `${(Number(args.totalRepaid) / 1e18).toFixed(4)} ETH` : '';
      return totalEth
        ? `Repayment of ${ethAmount} received (${args.amount?.toString()} wei). Total repaid to date: ${totalEth}.`
        : `Repayment of ${ethAmount} received (${args.amount?.toString()} wei).`;
    }
    case 'RepaymentClaimed': {
      const ethAmount = args.amount ? `${(Number(args.amount) / 1e18).toFixed(4)} ETH` : '';
      return ethAmount
        ? `Lender claimed pro-rata repayment share of ${ethAmount} (${args.amount?.toString()} wei).`
        : `Lender claimed ${args.amount?.toString()} wei from repayments.`;
    }
    case 'DefaultVoteCast': {
      const ethWeight = args.weight ? `${(Number(args.weight) / 1e18).toFixed(4)} ETH` : '';
      const totalEth = args.totalVoteWeight ? `${(Number(args.totalVoteWeight) / 1e18).toFixed(4)} ETH` : '';
      return totalEth
        ? `Lender cast default vote with ${ethWeight} voting weight (${args.weight?.toString()} wei). Cumulative votes: ${totalEth}.`
        : `Lender cast default vote with ${ethWeight} voting weight (${args.weight?.toString()} wei).`;
    }
    case 'DefaultThresholdReached':
    case 'LoanDefaulted': {
      const totalEth = args.totalVoteWeight ? `${(Number(args.totalVoteWeight) / 1e18).toFixed(4)} ETH` : '';
      return totalEth
        ? `Consensus threshold reached with ${totalEth} votes. Agreement declared DEFAULTED on-chain; borrower reputation penalized.`
        : 'Consensus threshold reached. Agreement declared DEFAULTED on-chain; borrower reputation penalized.';
    }
    case 'FundingCancelled': return 'The funding window expired before the target was reached; refunds are available.';
    case 'FundingRefunded': return `Lender reclaimed ${args.amount?.toString()} wei from the cancelled pool.`;
    case 'LoanRepaid': {
      const totalEth = args.totalRepaid ? `${(Number(args.totalRepaid) / 1e18).toFixed(4)} ETH` : '';
      return `Credit agreement fully repaid (${totalEth}). Repayment completed and positive borrower outcome recorded on-chain.`;
    }
    case 'LoanCreated': return 'A new parameterized loan pool was deployed.';
    case 'ReputationUpdated': {
      const outcome = args.successful === true || String(args.successful) === 'true' ? 'Successful repayment' : 'Default';
      const delta = args.successful === true || String(args.successful) === 'true' ? '+8' : '−20';
      return `${outcome} recorded on-chain. Reputation score updated to ${args.score?.toString()}/100 (${delta} pts). Repayments: ${args.successes?.toString()}, Defaults: ${args.defaults?.toString()}.`;
    }
    case 'VerificationUpdated': return args.verified ? `On-chain identity verified for ${args.account}.` : `On-chain identity verification revoked for ${args.account}.`;
    case 'VerificationRevoked': return `On-chain identity verification revoked for ${args.account}.`;
    default: return `Blockchain event: ${eventName}`;
  }
}

export class ChainIndexer {
  private indexPromise: Promise<number> = Promise.resolve(0);
  private polling = false;
  private timer: NodeJS.Timeout | null = null;
  private lastError: string | null = null;
  private lastIndexedAt: string | null = null;

  constructor(private readonly chain: ChainClient, private readonly store: ProjectionStore) {}

  /**
   * Starts continuous background polling worker.
   */
  startPolling(intervalMs?: number) {
    if (this.polling) return;
    this.polling = true;
    const interval = intervalMs || config.indexerPollIntervalMs || 2000;

    const poll = async () => {
      if (!this.polling) return;
      try {
        await this.indexOnce();
        this.lastError = null;
      } catch (err: any) {
        this.lastError = err?.message || String(err);
      }
      if (this.polling) {
        this.timer = setTimeout(poll, interval);
      }
    };

    void poll();
  }

  /**
   * Stops continuous background polling worker cleanly.
   */
  stopPolling() {
    this.polling = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  isPolling(): boolean {
    return this.polling;
  }

  getStatus() {
    return {
      running: this.polling,
      lastIndexedBlock: this.store.lastIndexedBlock.toString(),
      lastIndexedAt: this.lastIndexedAt || this.store.allEvents()[0]?.timestamp || null,
      lastError: this.lastError
    };
  }

  async indexOnce(): Promise<number> {
    this.indexPromise = this.indexPromise.then(
      () => this.doIndexOnce().catch((err) => {
        this.lastError = err?.message || String(err);
        console.warn('[indexer] Index cycle failed:', this.lastError);
        return 0;
      }),
      () => this.doIndexOnce().catch((err) => {
        this.lastError = err?.message || String(err);
        console.warn('[indexer] Index cycle failed:', this.lastError);
        return 0;
      })
    );
    return this.indexPromise;
  }

  private async safeGetLogs(params: {
    address?: Address | Address[];
    event?: any;
    fromBlock: bigint;
    toBlock: bigint;
  }): Promise<any[]> {
    if (params.fromBlock > params.toBlock) return [];
    const MAX_CHUNK = 20000n;
    if (params.toBlock - params.fromBlock <= MAX_CHUNK) {
      try {
        return (await this.chain.publicClient.getLogs(params as any)) || [];
      } catch (err: any) {
        if (
          (err?.message?.includes('block range') || err?.shortMessage?.includes('block range')) &&
          params.toBlock > params.fromBlock
        ) {
          const mid = params.fromBlock + (params.toBlock - params.fromBlock) / 2n;
          const left = await this.safeGetLogs({ ...params, toBlock: mid });
          const right = await this.safeGetLogs({ ...params, fromBlock: mid + 1n });
          return [...left, ...right];
        }
        console.warn(`[indexer] safeGetLogs failed for range ${params.fromBlock}..${params.toBlock}:`, err?.shortMessage || err?.message || err);
        return [];
      }
    }

    const allLogs: any[] = [];
    let curFrom = params.fromBlock;
    while (curFrom <= params.toBlock) {
      const curTo = curFrom + MAX_CHUNK - 1n < params.toBlock ? curFrom + MAX_CHUNK - 1n : params.toBlock;
      try {
        const chunkLogs = await this.chain.publicClient.getLogs({
          ...params,
          fromBlock: curFrom,
          toBlock: curTo
        } as any);
        if (chunkLogs && chunkLogs.length > 0) {
          allLogs.push(...chunkLogs);
        }
      } catch (err: any) {
        if (
          (err?.message?.includes('block range') || err?.shortMessage?.includes('block range')) &&
          curTo > curFrom
        ) {
          const subLogs = await this.safeGetLogs({ ...params, fromBlock: curFrom, toBlock: curTo });
          allLogs.push(...subLogs);
        } else {
          console.warn(`[indexer] safeGetLogs chunk ${curFrom}..${curTo} failed:`, err?.shortMessage || err?.message || err);
        }
      }
      curFrom = curTo + 1n;
    }
    return allLogs;
  }

  private async doIndexOnce(): Promise<number> {
    await this.store.load();
    const latest = await this.chain.blockNumber();

    // Reorg Check 1: Chain reset / node rewind past lastIndexedBlock
    if (latest < this.store.lastIndexedBlock) {
      await this.store.rewindTo(latest);
    }

    // Reorg Check 2: Block hash mismatch at boundary (detects shallow chain reorganizations)
    if (this.store.lastIndexedBlock > 0n) {
      const storedHash = this.store.getBlockHash(this.store.lastIndexedBlock);
      if (storedHash) {
        try {
          const currentBoundaryBlock = await this.chain.publicClient.getBlock({ blockNumber: this.store.lastIndexedBlock });
          if (currentBoundaryBlock?.hash && currentBoundaryBlock.hash.toLowerCase() !== storedHash.toLowerCase()) {
            // Reorg detected at last indexed block!
            // Search backwards up to indexerReorgDepth to find the last valid common ancestor
            let reorgPoint = this.store.lastIndexedBlock;
            const depth = BigInt(config.indexerReorgDepth || 3);
            const minBlock = this.store.lastIndexedBlock > depth ? this.store.lastIndexedBlock - depth : 0n;

            for (let b = this.store.lastIndexedBlock - 1n; b >= minBlock; b--) {
              const bStored = this.store.getBlockHash(b);
              if (!bStored) { reorgPoint = b; break; }
              const bCurrent = await this.chain.publicClient.getBlock({ blockNumber: b });
              if (bCurrent?.hash && bCurrent.hash.toLowerCase() === bStored.toLowerCase()) {
                reorgPoint = b + 1n; // Reorg began at block b + 1
                break;
              }
              reorgPoint = b;
            }

            await this.store.rewindTo(reorgPoint);
          }
        } catch {
          // If RPC fails during block lookup, continue with normal query
        }
      }
    }

    const to = latest;
    const rawDepBlock = this.chain.deployment.deploymentBlock;
    const deploymentBlock = rawDepBlock ? BigInt(rawDepBlock) : 0n;

    let from: bigint;
    if (this.store.lastIndexedBlock > 0n) {
      from = this.store.lastIndexedBlock + 1n;
    } else if (deploymentBlock > 0n) {
      from = deploymentBlock;
    } else if (this.chain.deployment.chainId === 11155111) {
      from = 11954224n;
    } else {
      from = 1n;
    }

    if (deploymentBlock > 0n && from < deploymentBlock) {
      from = deploymentBlock;
    }

    if (from > latest) return 0;

    const out: ActivityEvent[] = [];
    const blockTimestamp = new Map<string, string>();

    const timestampFor = async (blockNumber: bigint) => {
      const key = blockNumber.toString();
      const cached = blockTimestamp.get(key);
      if (cached) return cached;
      const block = await this.chain.publicClient.getBlock({ blockNumber });
      const value = isoFromTimestamp(block.timestamp);
      blockTimestamp.set(key, value);
      if (block.hash) {
        this.store.setBlockHash(blockNumber, block.hash);
      }
      return value;
    };

    const txSender = new Map<string, Address>();
    const senderFor = async (hash: `0x${string}`) => {
      const cached = txSender.get(hash);
      if (cached) return cached;
      try {
        const tx = await this.chain.publicClient.getTransaction({ hash });
        if (tx && tx.from) {
          txSender.set(hash, tx.from);
          return tx.from;
        }
      } catch {}
      return undefined;
    };

    // 1. LoanFactory: LoanCreated
    const loanCreatedEvent = factoryAbi.find((x) => x.type === 'event' && x.name === 'LoanCreated')!;
    const factoryLogs = await this.safeGetLogs({
      address: this.chain.deployment.contracts.loanFactory,
      event: loanCreatedEvent as any,
      fromBlock: from,
      toBlock: to
    });

    for (const log of factoryLogs as any[]) {
      const args = log.args ?? {};
      const pool = args.pool as Address;
      const { actorName, actorRole } = await resolveActor(this.chain, args.borrower);
      out.push({
        id: `${log.transactionHash}-${log.logIndex}`,
        loanId: pool,
        eventName: 'LoanCreated',
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber.toString(),
        contractAddress: this.chain.deployment.contracts.loanFactory,
        contractName: 'LoanFactory',
        actor: args.borrower,
        actorName,
        actorRole,
        summary: summaryFor('LoanCreated', args),
        timestamp: await timestampFor(log.blockNumber),
        data: {
          borrower: args.borrower,
          targetWei: args.targetWei?.toString(),
          aprBps: args.aprBps?.toString(),
          agreementHash: args.agreementHash?.toString()
        }
      });
    }

    // 2. LoanPool: All pool events
    const pools = await this.chain.getPools();
    for (const pool of pools) {
      const logs = await this.safeGetLogs({ address: pool, fromBlock: from, toBlock: to });
      for (const log of logs as any[]) {
        let decoded: any;
        try {
          decoded = decodeEventLog({ abi: poolAbi as any, data: log.data, topics: log.topics });
        } catch {
          continue;
        }
        const args = (decoded.args ?? {}) as Record<string, any>;
        const timestamp = await timestampFor(log.blockNumber);
        const eventData = Object.fromEntries(Object.entries(args).map(([k, v]) => [k, typeof v === 'bigint' ? v.toString() : String(v)]));

        if (decoded.eventName === 'SpendExecuted' && args.category) {
          try {
            let str = '';
            const hex = String(args.category);
            for (let i = 2; i < hex.length; i += 2) {
              const code = parseInt(hex.slice(i, i + 2), 16);
              if (code >= 32 && code <= 126) str += String.fromCharCode(code);
            }
            eventData.categoryText = str.trim() || 'General Procurement';
          } catch {
            eventData.categoryText = 'General Procurement';
          }
        }

        const actorAddress = args.lender ?? args.borrower ?? args.merchant ?? (await senderFor(log.transactionHash));
        const { actorName, actorRole } = await resolveActor(this.chain, actorAddress);

        out.push({
          id: `${log.transactionHash}-${log.logIndex}`,
          loanId: pool,
          eventName: decoded.eventName,
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber.toString(),
          contractAddress: pool,
          contractName: 'LoanPool',
          actor: actorAddress,
          actorName,
          actorRole,
          summary: summaryFor(decoded.eventName, args),
          timestamp,
          data: eventData
        });
      }
    }

    // 3. ReputationRegistry: ReputationUpdated
    const reputationUpdatedEvent = reputationAbi.find((x) => x.type === 'event' && x.name === 'ReputationUpdated')!;
    const reputationLogs = await this.safeGetLogs({
      address: this.chain.deployment.contracts.reputationRegistry,
      event: reputationUpdatedEvent as any,
      fromBlock: from,
      toBlock: to
    });
    for (const log of reputationLogs as any[]) {
      const args = log.args ?? {};
      const { actorName, actorRole } = await resolveActor(this.chain, args.borrower);
      out.push({
        id: `${log.transactionHash}-${log.logIndex}`,
        loanId: 'reputation',
        eventName: 'ReputationUpdated',
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber.toString(),
        contractAddress: this.chain.deployment.contracts.reputationRegistry,
        contractName: 'ReputationRegistry',
        actor: args.borrower,
        actorName,
        actorRole,
        summary: summaryFor('ReputationUpdated', args),
        timestamp: await timestampFor(log.blockNumber),
        data: Object.fromEntries(Object.entries(args).map(([k, v]) => [k, typeof v === 'bigint' ? v.toString() : String(v)]))
      });
    }

    // 4. KYCRegistry: VerificationUpdated
    const verificationUpdatedEvent = kycAbi.find((x) => x.type === 'event' && x.name === 'VerificationUpdated');
    if (verificationUpdatedEvent) {
      const kycLogs = await this.safeGetLogs({
        address: this.chain.deployment.contracts.kycRegistry,
        event: verificationUpdatedEvent as any,
        fromBlock: from,
        toBlock: to
      });
      for (const log of kycLogs as any[]) {
        const args = log.args ?? {};
        const { actorName, actorRole } = await resolveActor(this.chain, args.account);
        out.push({
          id: `${log.transactionHash}-${log.logIndex}`,
          loanId: 'kyc',
          eventName: 'VerificationUpdated',
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber.toString(),
          contractAddress: this.chain.deployment.contracts.kycRegistry,
          contractName: 'KYCRegistry',
          actor: args.account,
          actorName,
          actorRole,
          summary: summaryFor('VerificationUpdated', args),
          timestamp: await timestampFor(log.blockNumber),
          data: Object.fromEntries(Object.entries(args).map(([k, v]) => [k, typeof v === 'bigint' ? v.toString() : String(v)]))
        });
      }
    }

    // 5. KYCRegistry: VerificationRevoked
    const verificationRevokedEvent = kycAbi.find((x) => x.type === 'event' && x.name === 'VerificationRevoked');
    if (verificationRevokedEvent) {
      const revokeLogs = await this.safeGetLogs({
        address: this.chain.deployment.contracts.kycRegistry,
        event: verificationRevokedEvent as any,
        fromBlock: from,
        toBlock: to
      });
      for (const log of revokeLogs as any[]) {
        const args = log.args ?? {};
        const { actorName, actorRole } = await resolveActor(this.chain, args.account);
        out.push({
          id: `${log.transactionHash}-${log.logIndex}`,
          loanId: 'kyc',
          eventName: 'VerificationRevoked',
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber.toString(),
          contractAddress: this.chain.deployment.contracts.kycRegistry,
          contractName: 'KYCRegistry',
          actor: args.account,
          actorName,
          actorRole,
          summary: summaryFor('VerificationRevoked', args),
          timestamp: await timestampFor(log.blockNumber),
          data: Object.fromEntries(Object.entries(args).map(([k, v]) => [k, typeof v === 'bigint' ? v.toString() : String(v)]))
        });
      }
    }

    // Record block hash for head block 'to'
    try {
      const headBlk = await this.chain.publicClient.getBlock({ blockNumber: to });
      if (headBlk?.hash) {
        this.store.setBlockHash(to, headBlk.hash);
      }
    } catch {}

    this.store.addEvents(out);
    this.store.setLastIndexedBlock(to);
    this.lastIndexedAt = new Date().toISOString();
    await this.store.save();
    return out.length;
  }
}
