import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
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
} from 'lucide-react';

export const VerificationWorkflowPage: React.FC = () => {
  const { address, identity, isVerified, verificationStatus, refetchIdentity } = useIdentity();
  const queryClient = useQueryClient();

  const { data: request } = useQuery({
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
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in pb-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 font-sans">
          Institutional Identity &amp; Verification Lifecycle
        </h1>
        <p className="text-xs text-slate-600 font-medium">
          Credify protocol enforces <code className="text-yellow-900 bg-yellow-100 font-mono px-1.5 py-0.5 rounded font-bold">KYCRegistry</code> verification before granting permission to deploy agreements, contribute capital, or receive merchant disbursements.
        </p>
      </div>

      {/* Lifecycle Status Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-slate-950 font-bold">Verification Lifecycle Status</CardTitle>
            {status === 'VERIFIED' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Identity Verified On-Chain
              </span>
            ) : status === 'PENDING' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-50 border border-yellow-300 text-yellow-950 text-xs font-bold font-mono">
                <Clock className="w-4 h-4 text-yellow-700" />
                Attestation Review Pending
              </span>
            ) : status === 'REJECTED' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold font-mono">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Verification Rejected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold font-mono">
                <AlertCircle className="w-4 h-4 text-slate-500" />
                Not Verified
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Identity & Address Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 font-bold text-[10px] uppercase">Active Wallet Identity:</span>
              <div className="font-bold text-slate-950 font-mono">
                <AddressBadge address={address || ''} chars={6} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 font-bold text-[10px] uppercase">Registered Actor:</span>
              <div className="font-bold text-slate-950">
                {identity?.displayName || 'Unregistered Account'} ({identity?.role || 'None'})
              </div>
            </div>
          </div>

          {/* VERIFIED State Certificate */}
          {status === 'VERIFIED' && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-4 text-xs animate-milestone-enter">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-950 text-sm">
                      Cryptographic Attestation Active
                    </div>
                    <p className="text-slate-800 leading-relaxed text-xs font-medium">
                      The connected address has been formally verified in the KYCRegistry smart contract. Protocol permissions associated with your role are fully unlocked.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowMilestone(true)}
                  className="text-xs shrink-0 font-bold bg-white border-slate-300 text-slate-900 hover:bg-slate-50"
                >
                  View Attestation
                </Button>
              </div>

              {request && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-emerald-200 text-xs font-mono">
                  <div>
                    <span className="text-slate-600 font-sans font-medium">Credential Reference:</span>
                    <div className="font-bold text-slate-950">{request.profile.referenceId}</div>
                  </div>
                  <div>
                    <span className="text-slate-600 font-sans font-medium">Organization:</span>
                    <div className="font-bold text-slate-950">{request.profile.organization}</div>
                  </div>
                  <div>
                    <span className="text-slate-600 font-sans font-medium">Credential Hash:</span>
                    <div className="truncate text-slate-800 font-semibold">{request.credentialHash}</div>
                  </div>
                  {request.attestationTxHash && (
                    <div>
                      <span className="text-slate-600 font-sans font-medium">Attestation Tx:</span>
                      <AddressBadge address={request.attestationTxHash} chars={5} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PENDING State View */}
          {status === 'PENDING' && (
            <div className="p-5 rounded-2xl bg-yellow-50 border border-yellow-300 space-y-4 text-xs animate-milestone-enter">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-yellow-950 text-sm">
                    Awaiting Verifier Attestation
                  </div>
                  <p className="text-slate-800 leading-relaxed text-xs font-medium">
                    Your credential has been submitted and hashed. The authorized verifier must sign an on-chain transaction calling <code className="text-yellow-950 font-bold">KYCRegistry.setVerified()</code> to activate your account.
                  </p>
                </div>
              </div>

              {request && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Applicant:</span>
                    <span className="font-bold text-slate-950">{request.profile.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Reference:</span>
                    <span className="font-bold text-slate-950">{request.profile.referenceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Deterministic Hash:</span>
                    <span className="text-slate-800 font-semibold truncate max-w-[180px]">{request.credentialHash}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-600 text-xs font-medium">Authorized verifier or testing in console?</span>
                <Link to="/app/evaluator">
                  <Button size="sm" variant="outline" className="text-xs font-bold bg-white border-slate-300 text-slate-900 hover:bg-slate-50">
                    Open Verifier Queue in Evaluator Console →
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* NOT_STARTED or REJECTED: Submission Form */}
          {(status === 'NOT_STARTED' || status === 'REJECTED') && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-200">
              {status === 'REJECTED' && (
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-900 space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-rose-950">Previous Application Rejected</div>
                      <p className="text-rose-900 leading-relaxed font-medium">
                        {request?.rejectionReason || 'Requirements not met. Please resubmit updated institutional credentials.'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-rose-200 text-xs text-rose-800 font-medium">
                    You may resubmit with corrected or additional evidence below. Your previous submission details have been preserved.
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <h3 className="font-bold text-slate-950 text-sm">
                  {status === 'REJECTED' ? 'Resubmit Updated Credentials' : 'Submit Institutional Credentials'}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Enter credentials representing your institution, fund, or merchant facility to request on-chain attestation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Full Legal / Academic Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Menon"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-950 font-bold focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Participant Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-950 font-bold focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="BORROWER">Borrower (Academic Lab / Researcher)</option>
                    <option value="LENDER">Lender (Endowment / Syndicate Fund)</option>
                    <option value="MERCHANT">Supplier / Merchant (Equipment Vendor)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Organization / Institution
                  </label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Dept of Computing, University Lab"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-950 font-bold focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Reference ID Code
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="e.g. CRD-BRW-001"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-950 font-mono font-bold focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                {role === 'MERCHANT' && (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">
                      Business Procurement Category
                    </label>
                    <input
                      type="text"
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value)}
                      placeholder="e.g. Laboratory Materials & Sensors"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-950 font-bold focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-bold"
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
