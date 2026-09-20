import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type CreateLoanResponse } from '../lib/api';
import type { CreateLoanInput } from '@credify/shared';

// Query Keys
export const queryKeys = {
  health: ['health'] as const,
  principals: ['principals'] as const,
  loans: ['loans'] as const,
  loan: (id: string) => ['loans', id] as const,
  loanActivity: (id: string) => ['loans', id, 'activity'] as const,
  reputation: (address: string) => ['reputation', address] as const,
  evaluatorContracts: ['evaluator', 'contracts'] as const,
  evaluatorEvents: ['evaluator', 'events'] as const,
};

// Queries
export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.getHealth(),
    refetchInterval: 5000,
  });
}

export function useLoans() {
  return useQuery({
    queryKey: queryKeys.loans,
    queryFn: () => api.getLoans(),
    refetchInterval: 3000,
  });
}

export function useLoan(poolAddress?: string) {
  return useQuery({
    queryKey: poolAddress ? queryKeys.loan(poolAddress) : ['loans', 'null'],
    queryFn: () => (poolAddress ? api.getLoan(poolAddress) : null),
    enabled: Boolean(poolAddress),
    refetchInterval: 2500,
  });
}

export function useLoanActivity(poolAddress?: string) {
  return useQuery({
    queryKey: poolAddress ? queryKeys.loanActivity(poolAddress) : ['loans', 'null', 'activity'],
    queryFn: () => (poolAddress ? api.getLoanActivity(poolAddress) : []),
    enabled: Boolean(poolAddress),
    refetchInterval: 2500,
  });
}

export function useReputation(address?: string) {
  return useQuery({
    queryKey: address ? queryKeys.reputation(address) : ['reputation', 'null'],
    queryFn: () => (address ? api.getReputation(address) : null),
    enabled: Boolean(address),
    refetchInterval: 4000,
  });
}

export function useReputationHistory(address?: string) {
  return useQuery({
    queryKey: address ? ['reputation', address, 'history'] : ['reputation', 'null', 'history'],
    queryFn: () => (address ? api.getReputationHistory(address) : []),
    enabled: Boolean(address),
    refetchInterval: 4000,
  });
}


export function useEvaluatorContracts() {
  return useQuery({
    queryKey: queryKeys.evaluatorContracts,
    queryFn: () => api.getEvaluatorContracts(),
  });
}

export function useEvaluatorEvents() {
  return useQuery({
    queryKey: queryKeys.evaluatorEvents,
    queryFn: () => api.getEvaluatorEvents(),
    refetchInterval: 3000,
  });
}

export function useSupplierDisbursements(address?: string) {
  return useQuery({
    queryKey: ['supplier-disbursements', address?.toLowerCase()],
    queryFn: () => (address ? api.getSupplierDisbursements(address) : null),
    enabled: Boolean(address),
    refetchInterval: 2500,
  });
}

// Mutations
export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLoanInput) => api.createLoan(input),
    onSuccess: (data: CreateLoanResponse) => {
      qc.invalidateQueries({ queryKey: queryKeys.loans });
      qc.invalidateQueries({ queryKey: queryKeys.evaluatorEvents });
      if (data?.loanId) {
        qc.invalidateQueries({ queryKey: queryKeys.loan(data.loanId) });
        qc.invalidateQueries({ queryKey: queryKeys.loanActivity(data.loanId) });
      }
    },
  });
}

export function useContribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pool, lenderId, amountWei }: { pool: string; lenderId: string; amountWei: string }) =>
      api.contribute(pool, lenderId, amountWei),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.loans });
      qc.invalidateQueries({ queryKey: queryKeys.loan(vars.pool) });
      qc.invalidateQueries({ queryKey: queryKeys.loanActivity(vars.pool) });
      qc.invalidateQueries({ queryKey: queryKeys.evaluatorEvents });
    },
  });
}

export function useSpend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      pool,
      borrowerId,
      merchant,
      amountWei,
      category,
    }: {
      pool: string;
      borrowerId: string;
      merchant: string;
      amountWei: string;
      category: string;
    }) => api.spend(pool, borrowerId, merchant, amountWei, category),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.loans });
      qc.invalidateQueries({ queryKey: queryKeys.loan(vars.pool) });
      qc.invalidateQueries({ queryKey: queryKeys.loanActivity(vars.pool) });
      qc.invalidateQueries({ queryKey: queryKeys.evaluatorEvents });
    },
  });
}

export function useRepay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pool, borrowerId, amountWei }: { pool: string; borrowerId: string; amountWei: string }) =>
      api.repay(pool, borrowerId, amountWei),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.loans });
      qc.invalidateQueries({ queryKey: queryKeys.loan(vars.pool) });
      qc.invalidateQueries({ queryKey: queryKeys.loanActivity(vars.pool) });
      qc.invalidateQueries({ queryKey: queryKeys.evaluatorEvents });
    },
  });
}

export function useClaimRepayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pool, lenderId }: { pool: string; lenderId: string }) =>
      api.claimRepayment(pool, lenderId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.loans });
      qc.invalidateQueries({ queryKey: queryKeys.loan(vars.pool) });
      qc.invalidateQueries({ queryKey: queryKeys.loanActivity(vars.pool) });
      qc.invalidateQueries({ queryKey: queryKeys.evaluatorEvents });
    },
  });
}

export function useVoteDefault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pool, lenderId }: { pool: string; lenderId: string }) =>
      api.voteDefault(pool, lenderId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.loans });
      qc.invalidateQueries({ queryKey: queryKeys.loan(vars.pool) });
      qc.invalidateQueries({ queryKey: queryKeys.loanActivity(vars.pool) });
      qc.invalidateQueries({ queryKey: queryKeys.evaluatorEvents });
    },
  });
}

export function useResetDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.resetDemoProjection(),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}
