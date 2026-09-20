import { decodeEventLog, hexToString, type Address } from 'viem';
import { factoryAbi, kycAbi, poolAbi, reputationAbi } from './abis.js';
import { ChainClient } from './client.js';
import { ProjectionStore } from '../store/projection.js';
import { principalForAddress } from '../services/principals.js';
import type { ActivityEvent } from '@credify/shared';

function isoFromTimestamp(value: bigint) {
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


function summaryFor(eventName: string, args: any) {
  switch (eventName) {
    case 'Funded': return `Lender contributed ${args.amount?.toString()} wei to the pool.`;
    case 'LoanActivated': return 'Funding target reached; the loan is now active.';
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
    default: return `Blockchain event: ${eventName}`;
  }
}

export class ChainIndexer {
  private indexPromise: Promise<number> = Promise.resolve(0);
  constructor(private readonly chain: ChainClient, private readonly store: ProjectionStore) {}

  async indexOnce(): Promise<number> {
    this.indexPromise = this.indexPromise.then(
      () => this.doIndexOnce(),
      () => this.doIndexOnce()
    );
    return this.indexPromise;
  }

  private async doIndexOnce(): Promise<number> {
    await this.store.load();
    const latest = await this.chain.blockNumber();
    if (latest < this.store.lastIndexedBlock) {
      await this.store.reset();
    }
    const to = latest;
    const from = this.store.lastIndexedBlock + 1n;
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


    const factoryLogs = await this.chain.publicClient.getLogs({
      address: this.chain.deployment.contracts.loanFactory,
      event: factoryAbi[2],
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
          maturity: args.maturity?.toString(),
          aprBps: args.aprBps?.toString()
        }
      });
    }

    const pools = await this.chain.getPools();
    for (const pool of pools) {
      const logs = await this.chain.publicClient.getLogs({ address: pool, fromBlock: from, toBlock: to });
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

    const reputationLogs = await this.chain.publicClient.getLogs({
      address: this.chain.deployment.contracts.reputationRegistry,
      event: reputationAbi[1],
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

    const kycLogs = await this.chain.publicClient.getLogs({
      address: this.chain.deployment.contracts.kycRegistry,
      event: kycAbi[2],
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


    this.store.addEvents(out);
    this.store.setLastIndexedBlock(to);
    await this.store.save();
    return out.length;
  }
}
