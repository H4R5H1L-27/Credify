import type { Role, VerificationStatus, StructuredCredential, ActivityEvent } from './index.js';

export type ObservabilitySourceTier = 'BLOCKCHAIN' | 'BACKEND_INDEXED' | 'HYBRID_PROJECTION';

export interface ObservabilityProvenance {
  chain: {
    chainId: number;
    network: string;
  };
  block?: {
    number: string;
    hash?: string;
    timestamp?: string;
  };
  transaction?: {
    hash: string;
    index?: number;
  };
  contract?: {
    address: string;
    name?: string;
  };
  event?: {
    name: string;
    id?: string;
  };
  indexed?: {
    at: string;
  };
  origin: ObservabilitySourceTier;
}

export interface NetworkObservability {
  chainId: number;
  network: string;
  rpcUrl: string;
  clientVersion: string;
  latestBlockNumber: string;
  latestBlockHash: string;
  latestBlockTimestamp: string;
  gasLimit: string;
  isMining: boolean;
  provenance: ObservabilityProvenance;
}

export interface BlockObservability {
  number: string;
  hash: string;
  parentHash: string;
  timestamp: string; // ISO 8601
  timestampUnix: number;
  gasLimit: string;
  gasUsed: string;
  baseFeePerGas: string | null;
  transactionCount: number;
  transactions: string[]; // transaction hashes
  miner: string;
  size: string;
  provenance: ObservabilityProvenance;
}

export interface TransactionObservability {
  hash: string;
  blockNumber: string;
  blockHash: string;
  from: string;
  to: string | null;
  valueWei: string;
  gas: string;
  gasPriceWei: string | null;
  nonce: number;
  input: string;
  status: 'SUCCESS' | 'REVERTED' | 'PENDING';
  gasUsed: string;
  effectiveGasPriceWei: string | null;
  contractAddress: string | null;
  logsCount: number;
  decodedEvents: Array<{
    eventName: string;
    contractAddress: string;
    args: Record<string, string>;
  }>;
  provenance: ObservabilityProvenance;
}

export interface ContractObservability {
  address: string;
  name: string;
  type: 'REGISTRY' | 'FACTORY' | 'POOL';
  role: string;
  balanceWei: string;
  hasBytecode: boolean;
  provenance: ObservabilityProvenance;
}

export interface ContractDetailObservability extends ContractObservability {
  bytecodeSize: number;
  eventsEmitted: ActivityEvent[];
  poolState?: {
    borrower: string;
    status: string;
    targetWei: string;
    contributedWei: string;
    totalRepaidWei: string;
    totalSpentWei: string;
    maturity: string;
    merchants: string[];
  };
  provenance: ObservabilityProvenance;
}

export interface IndexerStateObservability {
  running: boolean;
  lastIndexedBlock: string;
  currentHeadBlock: string;
  blockLag: number;
  totalEventsIndexed: number;
  trackedPoolsCount: number;
  contractsMonitored: Array<{
    address: string;
    name: string;
  }>;
  lastIndexedAt: string;
  provenance: ObservabilityProvenance;
}

export interface VerificationAttestationObservability {
  id: string;
  walletAddress: string;
  role: Role;
  profile: StructuredCredential;
  credentialHash: string;
  submittedAt: string;
  status: VerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  attestationTxHash?: string;
  attestationBlock?: string;
  provenance: ObservabilityProvenance;
}

export interface AgreementObservability {
  poolAddress: string;
  borrowerAddress: string;
  borrowerName: string;
  status: string;
  targetWei: string;
  contributedWei: string;
  totalRepaidWei: string;
  totalSpentWei: string;
  lendersCount: number;
  merchantsCount: number;
  defaultVoteWeightWei: string;
  maturity: string;
  aprBps: number;
  provenance: ObservabilityProvenance;
}
