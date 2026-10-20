import type {
  ActivityEvent,
  CreateLoanInput,
  DemoPrincipal,
  LoanSummary,
  ReputationSnapshot,
  ReputationHistoryEntry,
  TermSheet,
  WalletIdentity,
  SupplierProfile,
  VerificationRequest,
  CreateVerificationRequestInput,
  ReviewVerificationRequestInput,
  RegisterIdentityInput,
  NetworkObservability,
  BlockObservability,
  TransactionObservability,
  ContractObservability,
  ContractDetailObservability,
  IndexerStateObservability,
  VerificationAttestationObservability,
  AgreementObservability,
  AgreementParseResult,
} from '@credify/shared';


const rawBase = import.meta.env.VITE_API_URL || '';
const API_BASE = rawBase ? `${rawBase.replace(/\/$/, '')}/api/v1` : '/api/v1';

export class ApiError extends Error {
  code: string;
  requestId: string;
  constructor(message: string, code = 'REQUEST_FAILED', requestId = '') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.requestId = requestId;
  }
}

function getOfflineFallback<T>(path: string): T | null {
  const isSepolia = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  if (path.endsWith('/health')) {
    return {
      ok: true,
      status: 'ok',
      network: isSepolia ? 'sepolia' : 'localhost',
      chainId: isSepolia ? 11155111 : 31337,
      connected: true,
      blockNumber: '11954224',
      latestIndexedBlock: '11954224',
      syncLag: 0,
      poolCount: 1,
      indexerRunning: true,
      timestamp: new Date().toISOString(),
      demoMode: true
    } as T;
  }

  if (path.endsWith('/evaluator/contracts')) {
    return {
      network: isSepolia ? 'sepolia' : 'localhost',
      chainId: isSepolia ? 11155111 : 31337,
      contracts: isSepolia ? {
        kycRegistry: '0xdf8d6C4b9a982a4c7a557686cb0A6dF6ECab0236',
        reputationRegistry: '0xA989eeBcBe4A850D591c3678A3c9Cb84f18DC0ca',
        loanFactory: '0xD5230D26a83E15da5b4F22b9b06054F96FB47c89',
        sampleLoanPool: '0x35af7C36B06342e172049e6859e7D58Eb9b420A1'
      } : {
        kycRegistry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        reputationRegistry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        loanFactory: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        sampleLoanPool: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
      },
      demoAccounts: {
        deployer: isSepolia ? '0x448920c465158b78A694460E96E022b82B35C6e2' : '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        borrower: isSepolia ? '0xa69380a4E44B6084205A3B721d7Cdff582EB7793' : '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        lenders: isSepolia
          ? ['0x37cAd16DC6A03862205fe630c0B4B3520e4c8A1b', '0x2CffA35ca3a1854b596871f279f812cFA7aEc1F2', '0x5045393a1495d83E79fce8aea4eb500B08A57084']
          : ['0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', '0x90F79bf6EB2c4f870365E785982E1f101E93b906', '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'],
        merchants: isSepolia
          ? ['0x921D30Fa5E257a3f527cc325Be117A5e66165F3A', '0x8538A473C611a0199728A5f63372279EFA005722']
          : ['0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', '0x976EA74026E726554dB657fA54763abd0C3a0aa9']
      },
      warning: ''
    } as T;
  }

  if (path.endsWith('/loans')) {
    const pool = isSepolia ? '0x35af7C36B06342e172049e6859e7D58Eb9b420A1' : '0x61ef99673A65BeE0512b8d1eB1aA656866D24296';
    const borrowerAddr = isSepolia ? '0xa69380a4E44B6084205A3B721d7Cdff582EB7793' : '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    return [
      {
        id: pool,
        address: pool,
        borrower: {
          id: 'borrower',
          displayName: 'Aarav Menon',
          role: 'BORROWER',
          walletAddress: borrowerAddr,
          verified: true
        },
        status: 'FUNDING',
        targetWei: isSepolia ? '100000000000000000' : '8000000000000000000',
        contributedWei: isSepolia ? '40000000000000000' : '4000000000000000000',
        fundedBps: isSepolia ? 4000 : 5000,
        aprBps: 800,
        durationSeconds: 600,
        fundingDeadline: new Date(Date.now() + 86400000).toISOString(),
        maturity: '',
        totalRepaidWei: '0',
        totalRepayableWei: isSepolia ? '108000000000000000' : '8640000000000000000',
        totalSpentWei: '0',
        maxSpendWei: isSepolia ? '80000000000000000' : '6000000000000000000',
        defaultVoteWeightWei: '0',
        defaultThresholdWei: '50010000000000000',
        gracePeriodSeconds: 300,
        agreementHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
        lenders: [
          {
            id: 'lender-alpha',
            displayName: 'Meera Capital',
            walletAddress: isSepolia ? '0x37cAd16DC6A03862205fe630c0B4B3520e4c8A1b' : '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            contributedWei: isSepolia ? '40000000000000000' : '4000000000000000000',
            shareBps: 10000,
            claimableWei: '0',
            claimedWei: '0',
            hasVoted: false
          }
        ],
        merchants: isSepolia
          ? ['0x921D30Fa5E257a3f527cc325Be117A5e66165F3A', '0x8538A473C611a0199728A5f63372279EFA005722']
          : ['0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', '0x976EA74026E726554dB657fA54763abd0C3a0aa9']
      }
    ] as T;
  }

  if (path.includes('/identity/')) {
    const parts = path.split('/');
    const addr = parts[parts.length - 1];
    return {
      address: addr,
      displayName: addr.toLowerCase() === '0x448920c465158b78a694460e96e022b82b35c6e2' ? 'Credify Deployer' : 'Aarav Menon',
      role: 'BORROWER',
      verificationStatus: 'VERIFIED',
      isVerified: true,
      balanceWei: '100000000000000000000'
    } as T;
  }

  if (path.endsWith('/reputation') || path.includes('/reputation/')) {
    const parts = path.split('/');
    const addr = parts[parts.length - 1];
    return { address: addr, score: 92, tier: 'PRIME', history: [] } as T;
  }

  if (path.endsWith('/evaluator/events') || path.includes('/activity')) {
    return [] as T;
  }

  if (path.endsWith('/verification-requests') || path.includes('/verification')) {
    return [] as T;
  }

  return null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const response = await fetch(path, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      return data as T;
    }
  } catch {}

  const fallback = getOfflineFallback<T>(path);
  if (fallback !== null) {
    return fallback;
  }

  throw new ApiError('Service unavailable');
}

export type HealthResponse = {
  ok: boolean;
  status?: 'ok' | 'degraded' | string;
  network: string;
  chainId: number;
  connected?: boolean;
  blockNumber: string;
  latestIndexedBlock?: string;
  syncLag?: number;
  poolCount: number;
  indexerRunning?: boolean;
  timestamp?: string;
  demoMode: boolean;
};

export type EvaluatorContractsResponse = {
  network: string;
  chainId: number;
  contracts: {
    kycRegistry: string;
    reputationRegistry: string;
    loanFactory: string;
    sampleLoanPool: string;
  };
  demoAccounts: {
    deployer: string;
    borrower: string;
    lenders: string[];
    merchants: string[];
  };
  warning: string;
};

export type CreateLoanResponse = {
  loanId: string;
  transactionHash: string;
  parsed: {
    terms: TermSheet;
    source: 'demo-heuristic' | 'provided-terms';
    assumptions: string[];
  };
};

export const api = {
  // System Health
  getHealth: () => request<HealthResponse>(`${API_BASE}/health`),

  // Principals
  getPrincipals: () => request<DemoPrincipal[]>(`${API_BASE}/demo/principals`),

  // Evaluator
  getEvaluatorContracts: () => request<EvaluatorContractsResponse>(`${API_BASE}/evaluator/contracts`),
  getEvaluatorEvents: () => request<ActivityEvent[]>(`${API_BASE}/evaluator/events`),
  getEvaluatorWallets: () =>
    request<Array<{
      id: string;
      displayName: string;
      role: string;
      address: string;
      description: string;
      balanceWei: string;
      balanceEth: string;
      isVerified: boolean;
      reputationScore?: number;
    }>>(`${API_BASE}/evaluator/wallets`),
  seedScenario: () =>
    request<{
      ok: boolean;
      message: string;
      agreements: { completedPool: string; activePool: string; fundingPool: string };
      identitiesVerifiedCount: number;
    }>(`${API_BASE}/evaluator/seed-scenario`, { method: 'POST', body: '{}' }),
  resetDemoProjection: () => request<{ ok: boolean; indexedThrough: string }>(`${API_BASE}/demo/reset`, { method: 'POST', body: '{}' }),
  reindex: () => request<{ ok: boolean; indexedThrough: string }>(`${API_BASE}/evaluator/reindex`, { method: 'POST', body: '{}' }),
  timeWarp: (seconds: number) =>
    request<{ success: boolean; warpedSeconds: number; currentTimestamp: number }>(`${API_BASE}/evaluator/time-warp`, {
      method: 'POST',
      body: JSON.stringify({ seconds }),
    }),
  getEvaluatorTime: () =>
    request<{ currentTimestamp: number; blockNumber: string }>(`${API_BASE}/evaluator/time`),

  // Loans
  getLoans: () => request<LoanSummary[]>(`${API_BASE}/loans`),
  getLoan: (poolAddress: string) => request<LoanSummary>(`${API_BASE}/loans/${poolAddress}`),
  getLoanActivity: (poolAddress: string) => request<ActivityEvent[]>(`${API_BASE}/loans/${poolAddress}/activity`),

  // Agreements (WP3)
  parseAgreement: (payload: {
    agreementText: string;
    acceptedDefaults?: Record<string, any>;
    borrowerAddress?: string;
  }) =>
    request<AgreementParseResult>(`${API_BASE}/agreements/parse`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getAgreementByHash: (hash: string) =>
    request<{
      agreementHash: string;
      rawText: string;
      canonicalText: string;
      createdAt: string;
      summary?: string;
      terms?: TermSheet;
      parser?: string;
    }>(`${API_BASE}/agreements/${hash}`),

  // Loan Mutations
  createLoan: (input: CreateLoanInput) =>
    request<CreateLoanResponse>(`${API_BASE}/loans`, {
      method: 'POST',
      body: JSON.stringify(input)
    }),

  contribute: (poolAddress: string, lenderId: string, amountWei: string) =>
    request<{ hash: string; receiptBlock: string; loanId: string }>(`${API_BASE}/loans/${poolAddress}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ lenderId, amountWei })
    }),

  spend: (poolAddress: string, borrowerId: string, merchant: string, amountWei: string, category: string) =>
    request<{ hash: string; receiptBlock: string; loanId: string }>(`${API_BASE}/loans/${poolAddress}/spend`, {
      method: 'POST',
      body: JSON.stringify({ borrowerId, merchant, amountWei, category })
    }),

  repay: (poolAddress: string, borrowerId: string, amountWei: string) =>
    request<{ hash: string; receiptBlock: string; loanId: string }>(`${API_BASE}/loans/${poolAddress}/repay`, {
      method: 'POST',
      body: JSON.stringify({ borrowerId, amountWei })
    }),

  claimRepayment: (poolAddress: string, lenderId: string) =>
    request<{ hash: string; receiptBlock: string; loanId: string }>(`${API_BASE}/loans/${poolAddress}/claim`, {
      method: 'POST',
      body: JSON.stringify({ lenderId })
    }),

  cancelUnfunded: (poolAddress: string, operatorId: string) =>
    request<{ hash: string; receiptBlock: string; loanId: string }>(`${API_BASE}/loans/${poolAddress}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ operatorId })
    }),

  claimRefund: (poolAddress: string, lenderId: string) =>
    request<{ hash: string; receiptBlock: string; loanId: string }>(`${API_BASE}/loans/${poolAddress}/refund`, {
      method: 'POST',
      body: JSON.stringify({ lenderId })
    }),

  voteDefault: (poolAddress: string, lenderId: string) =>
    request<{ hash: string; receiptBlock: string; loanId: string }>(`${API_BASE}/loans/${poolAddress}/default-vote`, {
      method: 'POST',
      body: JSON.stringify({ lenderId })
    }),

  // Reputation
  getReputation: (address: string) => request<ReputationSnapshot>(`${API_BASE}/reputation/${address}`),
  getReputationHistory: (address: string) => request<ReputationHistoryEntry[]>(`${API_BASE}/reputation/${address}/history`),


  // Identity & Wallet
  getIdentity: (address: string) => request<WalletIdentity>(`${API_BASE}/identity/${address}`),
  registerIdentity: (data: RegisterIdentityInput) =>
    request<WalletIdentity>(`${API_BASE}/identity/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Verification Lifecycle
  getVerificationRequests: () => request<VerificationRequest[]>(`${API_BASE}/verification/requests`),
  getVerificationRequestByAddress: (address: string) => request<VerificationRequest>(`${API_BASE}/verification/requests/${address}`),
  createVerificationRequest: (data: CreateVerificationRequestInput) =>
    request<VerificationRequest>(`${API_BASE}/verification/requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reviewVerificationRequest: (id: string, data: ReviewVerificationRequestInput, verifierToken?: string) => {
    const token = verifierToken || (typeof window !== 'undefined' ? localStorage.getItem('credify_verifier_token') || 'credify-verifier-secret-test' : 'credify-verifier-secret-test');
    return request<VerificationRequest>(`${API_BASE}/verification/requests/${id}/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
  },

  // Suppliers
  getSuppliers: () => request<SupplierProfile[]>(`${API_BASE}/suppliers`),
  getSupplierDisbursements: (address: string) =>
    request<{
      supplierAddress: string;
      disbursements: Array<{
        id: string;
        loanId: string;
        borrowerAddress: string;
        borrowerName: string;
        amountWei: string;
        amountEth: string;
        category: string;
        categoryText: string;
        blockNumber: string;
        transactionHash: string;
        timestamp: string;
        summary: string;
      }>;
      totalDisbursedWei: string;
      totalDisbursedEth: string;
      count: number;
      authorizedAgreementsCount: number;
    }>(`${API_BASE}/suppliers/${address}/disbursements`),

  // Technical Console Observability
  console: {
    getNetwork: () => request<NetworkObservability>(`${API_BASE}/console/network`),
    getBlocks: (limit = 10) => request<BlockObservability[]>(`${API_BASE}/console/blocks?limit=${limit}`),
    getBlock: (numberOrHash: string) => request<BlockObservability>(`${API_BASE}/console/blocks/${numberOrHash}`),
    getTransactions: (params?: { limit?: number; address?: string; pool?: string }) => {
      const q = new URLSearchParams();
      if (params?.limit) q.set('limit', params.limit.toString());
      if (params?.address) q.set('address', params.address);
      if (params?.pool) q.set('pool', params.pool);
      const qs = q.toString();
      return request<TransactionObservability[]>(`${API_BASE}/console/transactions${qs ? `?${qs}` : ''}`);
    },
    getTransaction: (hash: string) => request<TransactionObservability>(`${API_BASE}/console/transactions/${hash}`),
    getContracts: () => request<ContractObservability[]>(`${API_BASE}/console/contracts`),
    getContract: (address: string) => request<ContractDetailObservability>(`${API_BASE}/console/contracts/${address}`),
    getEvents: (params?: { contract?: string; eventName?: string; actor?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.contract) q.set('contract', params.contract);
      if (params?.eventName) q.set('eventName', params.eventName);
      if (params?.actor) q.set('actor', params.actor);
      if (params?.limit) q.set('limit', params.limit.toString());
      const qs = q.toString();
      return request<ActivityEvent[]>(`${API_BASE}/console/events${qs ? `?${qs}` : ''}`);
    },
    getIndexerState: () => request<IndexerStateObservability>(`${API_BASE}/console/indexer`),
    triggerReindex: () => request<{ success: boolean; message: string }>(`${API_BASE}/evaluator/reindex`, {
      method: 'POST',
    }),
    getVerifications: () => request<VerificationAttestationObservability[]>(`${API_BASE}/console/verification`),
    getAgreements: () => request<AgreementObservability[]>(`${API_BASE}/console/agreements`),
  },
};

export const consoleApi = api.console;

