import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  TechnicalPanel,
  TechnicalValue,
  TechnicalStatus,
} from '../../components/console';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, RefreshCw, Layers } from 'lucide-react';

export const ConsoleVerificationPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['verification', 'all-requests'],
    queryFn: () => api.getVerificationRequests(),
    refetchInterval: 3000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'VERIFIED' | 'REJECTED' }) => {
      return api.reviewVerificationRequest(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification'] });
      queryClient.invalidateQueries({ queryKey: ['verificationRequests'] });
      refetch();
    },
  });

  const handleVerify = async (requestId: string) => {
    try {
      await reviewMutation.mutateAsync({ id: requestId, status: 'VERIFIED' });
    } catch {
      // Error handled
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-yellow-950 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300 w-fit mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>On-Chain Attestation Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-slate-950">
            KYCRegistry &amp; Identity Attestations
          </h1>
          <p className="text-xs text-slate-700 font-sans font-medium mt-1">
            Role-based on-chain cryptographic identity registry, hashed credential attestations, and approval queues.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          loading={isLoading}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-xs font-sans bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold shrink-0"
        >
          Refresh Queue
        </Button>
      </div>

      <TechnicalPanel
        title="Attestation Queue &amp; Registry State"
        subtitle={`${requests.length} institutional identity requests registered.`}
        badge={
          <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-950 font-bold">
            KYCRegistry.sol
          </span>
        }
        isLoading={isLoading}
        isEmpty={requests.length === 0}
        emptyState={
          <div className="py-12 text-center text-xs font-sans text-slate-600 space-y-2">
            <Layers className="w-8 h-8 text-slate-400 mx-auto" />
            <div>No verification requests found in the system.</div>
            <div className="text-xs text-slate-500 font-medium">Submit an institutional verification request in the application to inspect here.</div>
          </div>
        }
      >
        <div className="space-y-3.5 font-sans text-xs min-w-0">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-yellow-400 hover:shadow-md transition-all space-y-3 min-w-0"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <span className="font-bold text-sm text-slate-950">
                    {req.profile.fullName}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-950 uppercase font-bold">
                    {req.role}
                  </span>
                  <TechnicalStatus
                    status={req.status === 'VERIFIED' ? 'SYNCED' : req.status === 'REJECTED' ? 'DISCONNECTED' : 'DEGRADED'}
                    label={req.status}
                    size="sm"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {req.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleVerify(req.id)}
                      loading={reviewMutation.isPending}
                      className="text-xs font-bold bg-[#ffe600] text-black border border-yellow-400 hover:bg-yellow-400"
                    >
                      Sign On-Chain Attestation
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-slate-200 text-xs font-sans">
                <div className="min-w-0">
                  <span className="text-slate-700 font-semibold">Applicant Wallet: </span>
                  <TechnicalValue value={req.walletAddress} type="address" chars={5} />
                </div>

                <div className="min-w-0">
                  <span className="text-slate-700 font-semibold">Organization: </span>
                  <span className="text-slate-950 font-bold">{req.profile.organization}</span>
                </div>

                <div className="min-w-0">
                  <span className="text-slate-700 font-semibold">Reference: </span>
                  <span className="text-slate-950 font-bold font-mono">{req.profile.referenceId}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs text-slate-700 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="truncate">Deterministic Hash: {req.credentialHash}</span>
                {req.attestationTxHash && (
                  <TechnicalValue value={req.attestationTxHash} type="hash" chars={6} label="Tx" />
                )}
              </div>
            </div>
          ))}
        </div>
      </TechnicalPanel>
    </div>
  );
};
