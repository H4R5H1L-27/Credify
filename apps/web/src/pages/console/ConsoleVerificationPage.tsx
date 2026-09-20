import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  TechnicalPanel,
  TechnicalValue,
  TechnicalStatus,
} from '../../components/console';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, ShieldAlert, Clock, RefreshCw, Layers } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-dark-text-primary uppercase flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            KYCRegistry &amp; Identity Attestations
          </h1>
          <p className="text-xs text-dark-text-secondary mt-0.5">
            Role-based on-chain cryptographic identity registry, hashed credential attestations, and approval queues.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          loading={isLoading}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-xs font-mono"
        >
          Refresh Queue
        </Button>
      </div>

      <TechnicalPanel
        title="Attestation Queue &amp; Registry State"
        subtitle={`${requests.length} institutional identity requests registered.`}
        badge={<span className="font-mono text-[10px] text-teal-400">KYCRegistry.sol</span>}
        isLoading={isLoading}
        isEmpty={requests.length === 0}
        emptyState={
          <div className="py-12 text-center text-xs font-mono text-dark-text-muted space-y-2">
            <Layers className="w-8 h-8 text-dark-text-muted mx-auto" />
            <div>No verification requests found in the system.</div>
            <div className="text-[11px]">Submit an institutional verification request in the application to inspect here.</div>
          </div>
        }
      >
        <div className="space-y-3 font-mono text-xs">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-3.5 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-dark-text-primary">
                    {req.profile.fullName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-dark-bg-2 border border-dark-border-default text-brand-300 uppercase">
                    {req.role}
                  </span>
                  <TechnicalStatus
                    status={req.status === 'VERIFIED' ? 'SYNCED' : req.status === 'REJECTED' ? 'DISCONNECTED' : 'DEGRADED'}
                    label={req.status}
                    size="sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {req.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleVerify(req.id)}
                      loading={reviewMutation.isPending}
                      className="text-xs h-7 font-mono"
                    >
                      Sign On-Chain Attestation
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-dark-border-subtle text-[11px]">
                <div>
                  <span className="text-dark-text-muted">Applicant Wallet: </span>
                  <TechnicalValue value={req.walletAddress} type="address" chars={5} />
                </div>

                <div>
                  <span className="text-dark-text-muted">Organization: </span>
                  <span className="text-dark-text-secondary">{req.profile.organization}</span>
                </div>

                <div>
                  <span className="text-dark-text-muted">Reference: </span>
                  <span className="text-dark-text-secondary">{req.profile.referenceId}</span>
                </div>
              </div>

              <div className="pt-1 text-[10px] text-dark-text-muted flex items-center justify-between">
                <span>Deterministic Hash: {req.credentialHash}</span>
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
