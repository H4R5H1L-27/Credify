import type { Address, Hash } from 'viem';
import { decodeEventLog, hexToString } from 'viem';
import { ChainClient } from '../chain/client.js';
import { ProjectionStore } from '../store/projection.js';
import { VerificationStore } from '../store/verification.js';
import { LoanService } from './loan-service.js';
import { config } from '../config.js';
import { poolAbi } from '../chain/abis.js';
import type {
  NetworkObservability,
  BlockObservability,
  TransactionObservability,
  ContractObservability,
  ContractDetailObservability,
  IndexerStateObservability,
  VerificationAttestationObservability,
  AgreementObservability,
  ActivityEvent,
  ObservabilityProvenance,
} from '@credify/shared';

function isoFromTimestamp(value: bigint | number): string {
  return new Date(Number(value) * 1000).toISOString();
}

export class ObservabilityService {
  constructor(
    private readonly chain: ChainClient,
    private readonly store: ProjectionStore,
    private readonly verificationStore: VerificationStore,
    private readonly loans: LoanService,
  ) {}

  private makeProvenance(
    origin: 'BLOCKCHAIN' | 'BACKEND_INDEXED' | 'HYBRID_PROJECTION',
    extras: Partial<ObservabilityProvenance> = {}
  ): ObservabilityProvenance {
    return {
      chain: {
        chainId: this.chain.deployment.chainId,
        network: this.chain.deployment.network,
      },
      origin,
      ...extras,
    };
  }

  async getNetwork(): Promise<NetworkObservability> {
    const publicClient = this.chain.publicClient;
    const [chainId, blockNumber, latestBlock] = await Promise.all([
      publicClient.getChainId(),
      publicClient.getBlockNumber(),
      publicClient.getBlock({ blockTag: 'latest' }),
    ]);

    let clientVersion = 'EVM / Hardhat Node';
    try {
      clientVersion = await (publicClient as any).request({ method: 'web3_clientVersion' });
    } catch {
      // Fallback if custom RPC method not available
    }

    return {
      chainId,
      network: this.chain.deployment.network,
      rpcUrl: config.rpcUrl,
      clientVersion,
      latestBlockNumber: blockNumber.toString(),
      latestBlockHash: latestBlock.hash || '',
      latestBlockTimestamp: isoFromTimestamp(latestBlock.timestamp),
      gasLimit: latestBlock.gasLimit.toString(),
      isMining: true,
      provenance: this.makeProvenance('BLOCKCHAIN', {
        block: { number: blockNumber.toString(), hash: latestBlock.hash || undefined },
      }),
    };
  }

  async getBlocks(limit = 10): Promise<BlockObservability[]> {
    const publicClient = this.chain.publicClient;
    const latestNum = await publicClient.getBlockNumber();
    const count = Math.min(Math.max(1, limit), 50);

    const blocks: BlockObservability[] = [];
    for (let i = 0; i < count; i++) {
      const blockNum = latestNum - BigInt(i);
      if (blockNum < 0n) break;
      try {
        const blk = await publicClient.getBlock({ blockNumber: blockNum });
        blocks.push({
          number: blk.number.toString(),
          hash: blk.hash || '',
          parentHash: blk.parentHash,
          timestamp: isoFromTimestamp(blk.timestamp),
          timestampUnix: Number(blk.timestamp),
          gasLimit: blk.gasLimit.toString(),
          gasUsed: blk.gasUsed.toString(),
          baseFeePerGas: blk.baseFeePerGas ? blk.baseFeePerGas.toString() : null,
          transactionCount: blk.transactions.length,
          transactions: (blk.transactions as any[]).map((t) => (typeof t === 'string' ? t : t.hash)),
          miner: blk.miner,
          size: blk.size ? blk.size.toString() : '0',
          provenance: this.makeProvenance('BLOCKCHAIN', {
            block: { number: blk.number.toString(), hash: blk.hash || undefined, timestamp: isoFromTimestamp(blk.timestamp) },
          }),
        });
      } catch {
        break;
      }
    }

    return blocks;
  }

  async getBlock(numberOrHash: string): Promise<BlockObservability | null> {
    const publicClient = this.chain.publicClient;
    try {
      let blk: any;
      if (numberOrHash === 'latest') {
        blk = await publicClient.getBlock({ blockTag: 'latest' });
      } else if (numberOrHash.startsWith('0x')) {
        blk = await publicClient.getBlock({ blockHash: numberOrHash as Hash });
      } else {
        const num = BigInt(numberOrHash);
        blk = await publicClient.getBlock({ blockNumber: num });
      }

      if (!blk) return null;

      return {
        number: blk.number.toString(),
        hash: blk.hash || '',
        parentHash: blk.parentHash,
        timestamp: isoFromTimestamp(blk.timestamp),
        timestampUnix: Number(blk.timestamp),
        gasLimit: blk.gasLimit.toString(),
        gasUsed: blk.gasUsed.toString(),
        baseFeePerGas: blk.baseFeePerGas ? blk.baseFeePerGas.toString() : null,
        transactionCount: blk.transactions.length,
        transactions: (blk.transactions as any[]).map((t) => (typeof t === 'string' ? t : t.hash)),
        miner: blk.miner,
        size: blk.size ? blk.size.toString() : '0',
        provenance: this.makeProvenance('BLOCKCHAIN', {
          block: { number: blk.number.toString(), hash: blk.hash || undefined, timestamp: isoFromTimestamp(blk.timestamp) },
        }),
      };
    } catch {
      return null;
    }
  }

  async getTransactions(limit = 20, address?: string, pool?: string): Promise<TransactionObservability[]> {
    const allEvents = this.store.allEvents();
    const targetAddress = address?.toLowerCase();
    const targetPool = pool?.toLowerCase();

    // Collect distinct transaction hashes from indexed events
    const txMap = new Map<string, ActivityEvent>();
    for (const evt of allEvents) {
      if (targetPool && evt.loanId.toLowerCase() !== targetPool) continue;
      if (targetAddress && evt.actor?.toLowerCase() !== targetAddress) continue;
      if (!txMap.has(evt.transactionHash.toLowerCase())) {
        txMap.set(evt.transactionHash.toLowerCase(), evt);
      }
    }

    const hashes = Array.from(txMap.keys()).slice(0, Math.min(Math.max(1, limit), 50));
    const txs: TransactionObservability[] = [];

    for (const h of hashes) {
      const full = await this.getTransaction(h);
      if (full) txs.push(full);
    }

    return txs;
  }

  async getTransaction(hash: string): Promise<TransactionObservability | null> {
    const publicClient = this.chain.publicClient;
    try {
      const formattedHash = (hash.startsWith('0x') ? hash : `0x${hash}`) as Hash;
      const [tx, receipt] = await Promise.all([
        publicClient.getTransaction({ hash: formattedHash }),
        publicClient.getTransactionReceipt({ hash: formattedHash }).catch(() => null),
      ]);

      if (!tx) return null;

      const eventsOnTx = this.store.allEvents().filter(
        (e) => e.transactionHash.toLowerCase() === hash.toLowerCase()
      );

      const decodedEvents = eventsOnTx.map((e) => ({
        eventName: e.eventName,
        contractAddress: e.contractAddress || '',
        args: e.data,
      }));

      return {
        hash: tx.hash,
        blockNumber: tx.blockNumber ? tx.blockNumber.toString() : '0',
        blockHash: tx.blockHash || '',
        from: tx.from,
        to: tx.to || null,
        valueWei: tx.value.toString(),
        gas: tx.gas.toString(),
        gasPriceWei: tx.gasPrice ? tx.gasPrice.toString() : null,
        nonce: tx.nonce,
        input: tx.input,
        status: receipt ? (receipt.status === 'success' ? 'SUCCESS' : 'REVERTED') : 'PENDING',
        gasUsed: receipt ? receipt.gasUsed.toString() : '0',
        effectiveGasPriceWei: receipt?.effectiveGasPrice ? receipt.effectiveGasPrice.toString() : null,
        contractAddress: receipt?.contractAddress || null,
        logsCount: receipt?.logs?.length ?? 0,
        decodedEvents,
        provenance: this.makeProvenance('BLOCKCHAIN', {
          block: { number: tx.blockNumber?.toString() || '0', hash: tx.blockHash || undefined },
          transaction: { hash: tx.hash, index: tx.transactionIndex },
        }),
      };
    } catch {
      return null;
    }
  }

  async getContracts(): Promise<ContractObservability[]> {
    const publicClient = this.chain.publicClient;
    const deployment = this.chain.deployment;

    const baseContracts: Array<{ address: Address; name: string; type: 'REGISTRY' | 'FACTORY' | 'POOL'; role: string }> = [
      {
        address: deployment.contracts.kycRegistry,
        name: 'KYCRegistry',
        type: 'REGISTRY',
        role: 'On-chain institutional identity attestations & role-based credentials',
      },
      {
        address: deployment.contracts.reputationRegistry,
        name: 'ReputationRegistry',
        type: 'REGISTRY',
        role: 'Deterministic credit track-record scoring based on agreement settlement outcomes',
      },
      {
        address: deployment.contracts.loanFactory,
        name: 'LoanFactory',
        type: 'FACTORY',
        role: 'Deployment factory for parameterized syndicate loan pool credit agreements',
      },
    ];

    const dynamicPools = await this.chain.getPools();
    for (const pool of dynamicPools) {
      if (!baseContracts.some((c) => c.address.toLowerCase() === pool.toLowerCase())) {
        baseContracts.push({
          address: pool,
          name: 'LoanPool',
          type: 'POOL',
          role: 'Smart credit facility with locked escrow, multi-lender funding & programmable spend',
        });
      }
    }

    const contracts: ContractObservability[] = [];
    for (const c of baseContracts) {
      const [balance, bytecode] = await Promise.all([
        publicClient.getBalance({ address: c.address }).catch(() => 0n),
        publicClient.getBytecode({ address: c.address }).catch(() => null),
      ]);

      contracts.push({
        address: c.address,
        name: c.name,
        type: c.type,
        role: c.role,
        balanceWei: balance.toString(),
        hasBytecode: Boolean(bytecode && bytecode.length > 2),
        provenance: this.makeProvenance('BLOCKCHAIN', {
          contract: { address: c.address, name: c.name },
        }),
      });
    }

    return contracts;
  }

  async getContractDetail(address: string): Promise<ContractDetailObservability | null> {
    const publicClient = this.chain.publicClient;
    const formattedAddr = address as Address;
    const contracts = await this.getContracts();
    const found = contracts.find((c) => c.address.toLowerCase() === address.toLowerCase());

    const [balance, bytecode] = await Promise.all([
      publicClient.getBalance({ address: formattedAddr }).catch(() => 0n),
      publicClient.getBytecode({ address: formattedAddr }).catch(() => null),
    ]);

    const eventsEmitted = this.store.allEvents().filter(
      (e) => e.contractAddress?.toLowerCase() === address.toLowerCase() || e.loanId.toLowerCase() === address.toLowerCase()
    );

    let poolState: any = undefined;
    if (found?.type === 'POOL' || (!found && eventsEmitted.length > 0)) {
      try {
        const poolInfo = await this.chain.readLoan(formattedAddr);
        poolState = {
          borrower: poolInfo.borrower,
          status: ['FUNDING', 'ACTIVE', 'REPAID', 'DEFAULTED', 'CANCELLED'][Number(poolInfo.summary[4])] || 'UNKNOWN',
          targetWei: poolInfo.summary[0].toString(),
          contributedWei: poolInfo.summary[1].toString(),
          totalRepaidWei: poolInfo.summary[2].toString(),
          totalSpentWei: poolInfo.summary[3].toString(),
          maturity: isoFromTimestamp(poolInfo.summary[6]),
          merchants: poolInfo.merchants,
        };
      } catch {
        // Not an accessible loan pool contract
      }
    }

    return {
      address: formattedAddr,
      name: found?.name || 'SmartContract',
      type: found?.type || 'POOL',
      role: found?.role || 'Deployed on-chain bytecode',
      balanceWei: balance.toString(),
      hasBytecode: Boolean(bytecode && bytecode.length > 2),
      bytecodeSize: bytecode ? (bytecode.length - 2) / 2 : 0,
      eventsEmitted,
      poolState,
      provenance: this.makeProvenance('BLOCKCHAIN', {
        contract: { address: formattedAddr, name: found?.name },
      }),
    };
  }

  getEvents(filters: { contract?: string; eventName?: string; actor?: string; limit?: number } = {}): ActivityEvent[] {
    let events = this.store.allEvents();

    if (filters.contract) {
      const c = filters.contract.toLowerCase();
      events = events.filter((e) => e.contractAddress?.toLowerCase() === c || e.loanId.toLowerCase() === c);
    }
    if (filters.eventName) {
      events = events.filter((e) => e.eventName.toLowerCase() === filters.eventName!.toLowerCase());
    }
    if (filters.actor) {
      const a = filters.actor.toLowerCase();
      events = events.filter((e) => e.actor?.toLowerCase() === a);
    }

    const limit = Math.min(Math.max(1, filters.limit || 50), 200);
    return events.slice(0, limit);
  }

  async getIndexerState(): Promise<IndexerStateObservability> {
    const latestBlock = await this.chain.blockNumber();
    const lastIndexed = this.store.lastIndexedBlock;
    const blockLag = Number(latestBlock > lastIndexed ? latestBlock - lastIndexed : 0n);
    const pools = await this.chain.getPools();
    const deployment = this.chain.deployment;

    const monitored = [
      { address: deployment.contracts.loanFactory, name: 'LoanFactory' },
      { address: deployment.contracts.kycRegistry, name: 'KYCRegistry' },
      { address: deployment.contracts.reputationRegistry, name: 'ReputationRegistry' },
      ...pools.map((p) => ({ address: p, name: 'LoanPool' })),
    ];

    const all = this.store.allEvents();
    const lastEvent = all[0];

    return {
      running: true,
      lastIndexedBlock: lastIndexed.toString(),
      currentHeadBlock: latestBlock.toString(),
      blockLag,
      totalEventsIndexed: all.length,
      trackedPoolsCount: pools.length,
      contractsMonitored: monitored,
      lastIndexedAt: lastEvent ? lastEvent.timestamp : new Date().toISOString(),
      provenance: this.makeProvenance('BACKEND_INDEXED', {
        block: { number: lastIndexed.toString() },
      }),
    };
  }

  getVerifications(): VerificationAttestationObservability[] {
    const requests = this.verificationStore.getAll();
    return requests.map((req) => ({
      id: req.id,
      walletAddress: req.walletAddress,
      role: req.role,
      profile: req.profile,
      credentialHash: req.credentialHash,
      submittedAt: req.submittedAt,
      status: req.status,
      reviewedBy: req.reviewedBy,
      reviewedAt: req.reviewedAt,
      rejectionReason: req.rejectionReason,
      attestationTxHash: req.attestationTxHash,
      attestationBlock: req.attestationBlock,
      provenance: this.makeProvenance('BACKEND_INDEXED', {
        transaction: req.attestationTxHash ? { hash: req.attestationTxHash } : undefined,
        block: req.attestationBlock ? { number: req.attestationBlock } : undefined,
      }),
    }));
  }

  async getAgreements(): Promise<AgreementObservability[]> {
    const loansList = await this.loans.list();
    return loansList.map((loan) => ({
      poolAddress: loan.address,
      borrowerAddress: loan.borrower.walletAddress,
      borrowerName: loan.borrower.displayName,
      status: loan.status,
      targetWei: loan.targetWei,
      contributedWei: loan.contributedWei,
      totalRepaidWei: loan.totalRepaidWei,
      totalSpentWei: loan.totalSpentWei,
      lendersCount: loan.lenders.length,
      merchantsCount: loan.merchants.length,
      defaultVoteWeightWei: loan.defaultVoteWeightWei,
      maturity: loan.maturity,
      aprBps: loan.aprBps,
      provenance: this.makeProvenance('HYBRID_PROJECTION', {
        contract: { address: loan.address, name: 'LoanPool' },
      }),
    }));
  }
}
