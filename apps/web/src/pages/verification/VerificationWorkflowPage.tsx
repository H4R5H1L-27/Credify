import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AddressBadge } from '../../components/ui/AddressBadge';
import { MilestoneCelebration } from '../../components/ui/MilestoneCelebration';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
  Building,
  User,
  Hash,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const VerificationWorkflowPage: React.FC = () => {
  const { address, identity, isVerified, verificationStatus, refetchIdentity } = useIdentity();
  const queryClient = useQueryClient();

  const { data: request, isLoading } = useQuery({
    queryKey: ['verificationRequest', address],
    queryFn: () => (address ? api.getVerificationRequestByAddress(address).catch(() => null) : null),
    enabled: Boolean(address),
  });

  const [fullName, setFullName] = useState(identity?.displayName || '');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<'BORROWER' | 'LENDER' | 'MERCHANT'>('BORROWER');
  const [referenceId, setReferenceId] = useState(`CRD-${Date.now().toString().slice(-4)}`);
  const [businessCategory, setBusinessCategory] = useState('Laboratory & Scientific Hardware');
  const [showMilestone, setShowMilestone] = useState(false);

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.createVerificationRequest(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['verificationRequest', address] });
      await refetchIdentity();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    submitMutation.mutate({
      walletAddress: address,
      role,
      profile: {
        fullName,
        organization,
        role,
        referenceId,
        businessCategory: role === 'MERCHANT' ? businessCategory : undefined,
      },
    });
  };

  const status = isVerified ? 'VERIFIED' : request?.status || verificationStatus || 'NOT_STARTED';

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-dark-text-primary">
          Institutional Identity &amp; Verification Lifecycle
        </h1>
        <p className="text-xs text-dark-text-secondary">
          Credify protocol enforces <code className="text-brand-400 font-mono">KYCRegistry</code> verification before granting permission to deploy agreements, contribute capital, or receive merchant disbursements.
        </p>
      </div>

      {/* Lifecycle Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Verification Lifecycle Status</CardTitle>
            {status === 'VERIFIED' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Identity Verified On-Chain
              </span>
            ) : status === 'PENDING' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <Clock className="w-4 h-4 text-amber-400" />
                Attestation Review Pending
              </span>
            ) : status === 'REJECTED' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4 text-crimson-400" />
                Verification Rejected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark-bg-3 border border-dark-border-subtle text-dark-text-muted text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-dark-text-muted" />
                Not Verified
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Identity & Address Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-dark-text-muted">Active Wallet Identity:</span>
              <div className="font-semibold text-dark-text-primary font-mono">
                <AddressBadge address={address || ''} chars={6} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-dark-text-muted">Registered Actor:</span>
              <div className="font-semibold text-dark-text-primary">
                {identity?.displayName || 'Unregistered Account'} ({identity?.role || 'None'})
              </div>
            </div>
          </div>

          {/* VERIFIED State Certificate */}
          {status === 'VERIFIED' && (
            <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-4 text-xs animate-milestone-enter">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-dark-text-primary text-sm">
                      Cryptographic Attestation Active
                    </div>
                    <p className="text-dark-text-secondary leading-relaxed text-[11px]">
                      The connected address has been formally verified in the KYCRegistry smart contract. Protocol permissions associated with your role are fully unlocked.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowMilestone(true)}
                  className="text-xs shrink-0"
                >
                  View Attestation
                </Button>
              </div>

              {request && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-500/20 text-[11px] font-mono">
                  <div>
                    <span className="text-dark-text-muted">Credential Reference:</span>
                    <div className="font-semibold text-dark-text-primary">{request.profile.referenceId}</div>
                  </div>
                  <div>
                    <span className="text-dark-text-muted">Organization:</span>
                    <div className="font-semibold text-dark-text-primary">{request.profile.organization}</div>
                  </div>
                  <div>
                    <span className="text-dark-text-muted">Credential Hash:</span>
                    <div className="truncate text-dark-text-secondary">{request.credentialHash}</div>
                  </div>
                  {request.attestationTxHash && (
                    <div>
                      <span className="text-dark-text-muted">Attestation Tx:</span>
                      <AddressBadge address={request.attestationTxHash} chars={5} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PENDING State View */}
          {status === 'PENDING' && (
            <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-4 text-xs animate-milestone-enter">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-dark-text-primary text-sm">
                    Awaiting Verifier Attestation
                  </div>
                  <p className="text-dark-text-secondary leading-relaxed text-[11px]">
                    Your credential has been submitted and hashed. The authorized verifier must sign an on-chain transaction calling <code className="text-amber-300">KYCRegistry.setVerified()</code> to activate your account.
                  </p>
                </div>
              </div>

              {request && (
                <div className="p-3 bg-dark-bg-3 rounded-lg border border-dark-border-subtle space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-dark-text-muted">Applicant:</span>
                    <span className="font-semibold text-dark-text-primary">{request.profile.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-text-muted">Reference:</span>
                    <span className="font-semibold text-dark-text-primary">{request.profile.referenceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-text-muted">Deterministic Hash:</span>
                    <span className="text-dark-text-secondary truncate max-w-[180px]">{request.credentialHash}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center">
                <span className="text-dark-text-muted text-[11px]">Authorized verifier or testing in console?</span>
                <Link to="/app/evaluator">
                  <Button size="sm" variant="outline" className="text-xs">
                    Open Verifier Queue in Evaluator Console →
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* NOT_STARTED or REJECTED: Submission Form */}
          {(status === 'NOT_STARTED' || status === 'REJECTED') && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-dark-border-subtle">
              {status === 'REJECTED' && (
                <div className="p-4 bg-crimson-500/10 border border-crimson-500/20 rounded-xl text-xs text-crimson-300 space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-crimson-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-crimson-200">Previous Application Rejected</div>
                      <p className="text-crimson-300 leading-relaxed">
                        {request?.rejectionReason || 'Requirements not met. Please resubmit updated institutional credentials.'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-crimson-500/20 text-[11px] text-crimson-400">
                    You may resubmit with corrected or additional evidence below. Your previous submission details have been preserved.
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <h3 className="font-semibold text-dark-text-primary text-sm">
                  {status === 'REJECTED' ? 'Resubmit Updated Credentials' : 'Submit Institutional Credentials'}
                </h3>
                <p className="text-xs text-dark-text-secondary">
                  Enter credentials representing your institution, fund, or merchant facility to request on-chain attestation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-dark-text-secondary mb-1">
                    Full Legal / Academic Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Menon"
                    className="w-full text-xs p-2.5 rounded-lg border border-dark-border-default bg-dark-bg-3 text-dark-text-primary focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-dark-text-secondary mb-1">
                    Participant Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-dark-border-default bg-dark-bg-3 text-dark-text-primary focus:border-brand-500 focus:outline-none"
                  >
                    <option value="BORROWER">Borrower (Academic Lab / Researcher)</option>
                    <option value="LENDER">Lender (Endowment / Syndicate Fund)</option>
                    <option value="MERCHANT">Supplier / Merchant (Equipment Vendor)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-dark-text-secondary mb-1">
                    Organization / Institution
                  </label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Dept of Computing, University Lab"
                    className="w-full text-xs p-2.5 rounded-lg border border-dark-border-default bg-dark-bg-3 text-dark-text-primary focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-dark-text-secondary mb-1">
                    Reference ID Code
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="e.g. CRD-BRW-001"
                    className="w-full text-xs p-2.5 rounded-lg border border-dark-border-default bg-dark-bg-3 text-dark-text-primary font-mono focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {role === 'MERCHANT' && (
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-dark-text-secondary mb-1">
                      Business Procurement Category
                    </label>
                    <input
                      type="text"
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value)}
                      placeholder="e.g. Laboratory Materials & Sensors"
                      className="w-full text-xs p-2.5 rounded-lg border border-dark-border-default bg-dark-bg-3 text-dark-text-primary focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={submitMutation.isPending}
                  icon={<FileCheck2 className="w-4 h-4" />}
                >
                  {status === 'REJECTED' ? 'Resubmit Verification Request' : 'Submit Verification Request & Generate Credential Hash'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Milestone Celebration Modal */}
      <MilestoneCelebration
        open={showMilestone}
        onClose={() => setShowMilestone(false)}
        type="IDENTITY_VERIFIED"
        contractAddress={address || ''}
        txHash={request?.attestationTxHash}
        reputationDelta={0}
        primaryAction={{
          label: 'Dismiss',
          onClick: () => setShowMilestone(false),
        }}
      />
    </div>
  );
};
