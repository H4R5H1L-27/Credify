import { z } from 'zod';

export const loanStatusSchema = z.enum(['FUNDING', 'ACTIVE', 'REPAID', 'DEFAULTED', 'CANCELLED']);
export type LoanStatus = z.infer<typeof loanStatusSchema>;

export const roleSchema = z.enum(['BORROWER', 'LENDER', 'MERCHANT', 'EVALUATOR', 'DEMO_OPERATOR']);
export type Role = z.infer<typeof roleSchema>;

export const termSheetSchema = z.object({
  targetWei: z.string().regex(/^\d+$/),
  durationSeconds: z.number().int().positive(),
  aprBps: z.number().int().min(0).max(5000),
  maxSpendWei: z.string().regex(/^\d+$/),
  defaultQuorumBps: z.number().int().min(5001).max(10000).default(5001),
  merchants: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).min(1)
});
export type TermSheet = z.infer<typeof termSheetSchema>;

export const createLoanSchema = z.object({
  borrowerId: z.string().min(1),
  naturalLanguageAgreement: z.string().min(20).max(4000),
  parsedTerms: termSheetSchema.optional()
});
export type CreateLoanInput = z.infer<typeof createLoanSchema>;

export const contributeSchema = z.object({
  lenderId: z.string().min(1),
  amountWei: z.string().regex(/^\d+$/)
});
export type ContributeInput = z.infer<typeof contributeSchema>;

export const spendSchema = z.object({
  borrowerId: z.string().min(1),
  merchant: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amountWei: z.string().regex(/^\d+$/),
  category: z.string().min(1).max(80)
});

export const repaySchema = z.object({
  borrowerId: z.string().min(1),
  amountWei: z.string().regex(/^\d+$/)
});

export const defaultVoteSchema = z.object({ lenderId: z.string().min(1) });

export type DemoPrincipal = {
  id: string;
  displayName: string;
  role: Role;
  walletAddress: string;
  verified: boolean;
};

export type ActivityEvent = {
  id: string;
  loanId: string;
  eventName: string;
  transactionHash: string;
  blockNumber: string;
  actor?: string;
  actorName?: string;
  actorRole?: Role;
  summary: string;
  timestamp: string;
  contractAddress?: string;
  contractName?: string;
  data: Record<string, string>;
};


export type LoanSummary = {
  id: string;
  address: string;
  borrower: DemoPrincipal;
  status: LoanStatus;
  targetWei: string;
  contributedWei: string;
  fundedBps: number;
  aprBps: number;
  durationSeconds: number;
  maturity: string;
  totalRepaidWei: string;
  totalRepayableWei: string;
  totalSpentWei: string;
  maxSpendWei: string;
  defaultVoteWeightWei: string;
  defaultThresholdWei: string;
  lenders: Array<{
    id: string;
    displayName: string;
    walletAddress: string;
    contributedWei: string;
    shareBps: number;
    claimableWei?: string;
    claimedWei?: string;
    hasVoted?: boolean;
  }>;
  merchants: string[];
};

export type ReputationOutcomeSummary = {
  outcome: 'SUCCESS' | 'DEFAULT';
  loanId: string;
  scoreAfter: number;
  delta: number;
  timestamp: string;
  transactionHash: string;
  summary: string;
};

export type ReputationSnapshot = {
  borrowerAddress: string;
  score: number;
  successfulLoans: number;
  defaultedLoans: number;
  lastUpdatedAt: string;
  latestOutcome?: ReputationOutcomeSummary;
  successfulAgreements?: string[];
  defaultedAgreements?: string[];
};

export type ReputationHistoryEntry = {
  id: string;
  loanId: string;
  outcome: 'SUCCESS' | 'DEFAULT';
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
  successfulLoans: number;
  defaultedLoans: number;
  blockNumber: string;
  transactionHash: string;
  timestamp: string;
  summary: string;
  agreementStatus?: string;
  agreementTargetWei?: string;
};


export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
};

// Verification & Identity Domain Model
export const verificationStatusSchema = z.enum(['NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED']);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

export const structuredCredentialSchema = z.object({
  fullName: z.string().min(2).max(100),
  organization: z.string().min(2).max(100),
  role: z.enum(['BORROWER', 'LENDER', 'MERCHANT']),
  referenceId: z.string().min(2).max(50),
  businessCategory: z.string().optional(),
  details: z.record(z.string(), z.string()).optional(),
});
export type StructuredCredential = z.infer<typeof structuredCredentialSchema>;

export const verificationRequestSchema = z.object({
  id: z.string(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  role: z.enum(['BORROWER', 'LENDER', 'MERCHANT']),
  profile: structuredCredentialSchema,
  credentialHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  submittedAt: z.string(),
  status: verificationStatusSchema,
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  attestationTxHash: z.string().optional(),
  attestationBlock: z.string().optional(),
});
export type VerificationRequest = z.infer<typeof verificationRequestSchema>;

export const createVerificationRequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  role: z.enum(['BORROWER', 'LENDER', 'MERCHANT']),
  profile: structuredCredentialSchema,
});
export type CreateVerificationRequestInput = z.infer<typeof createVerificationRequestSchema>;

export const reviewVerificationRequestSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  reviewedBy: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  rejectionReason: z.string().optional(),
  attestationTxHash: z.string().optional(),
  attestationBlock: z.string().optional(),
});
export type ReviewVerificationRequestInput = z.infer<typeof reviewVerificationRequestSchema>;

export const registerIdentitySchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  displayName: z.string().min(2).max(100),
  role: z.enum(['BORROWER', 'LENDER', 'MERCHANT']),
  organization: z.string().min(2).max(100),
  businessCategory: z.string().optional(),
});
export type RegisterIdentityInput = z.infer<typeof registerIdentitySchema>;

export interface WalletIdentity {
  address: string;
  displayName: string;
  role: Role | 'UNREGISTERED';
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  activeRequest?: VerificationRequest;
  reputationScore?: number;
  balanceWei?: string;
}

export interface SupplierProfile {
  address: string;
  businessName: string;
  category: string;
  verified: boolean;
  authorizedLoansCount: number;
  totalDisbursedWei: string;
}

export * from './abis.js';
export * from './observability.js';


