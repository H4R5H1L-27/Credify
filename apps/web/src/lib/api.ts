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
} from '@credify/shared';


const API_BASE = '/api/v1';

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(path, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    const code = data?.code || 'HTTP_ERROR';
    const requestId = data?.requestId || '';
    throw new ApiError(message, code, requestId);
  }

  return data as T;
}

export type HealthResponse = {
  ok: boolean;
  network: string;
  chainId: number;
  blockNumber: string;
  poolCount: number;
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
  getHealth: () => request<HealthResponse>('/health'),

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
  reviewVerificationRequest: (id: string, data: ReviewVerificationRequestInput) =>
    request<VerificationRequest>(`${API_BASE}/verification/requests/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

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
    getVerifications: () => request<VerificationAttestationObservability[]>(`${API_BASE}/console/verification`),
    getAgreements: () => request<AgreementObservability[]>(`${API_BASE}/console/agreements`),
  },
};

export const consoleApi = api.console;

