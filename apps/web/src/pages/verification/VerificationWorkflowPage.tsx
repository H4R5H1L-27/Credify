import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import { kycAbi } from '@credify/shared';
import { useIdentity } from '../../context/IdentityContext';
import { useWallet } from '../../context/WalletContext';
import { useEvaluatorContracts } from '../../hooks/useCredify';
import { useContractAction } from '../../hooks/useContractAction';
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
  KeyRound,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const VerificationWorkflowPage: React.FC = () => {
  const { address, identity, isVerified: localVerified, verificationStatus, refetchIdentity, isGuidedMode } = useIdentity();
  const { targetChainId } = useWallet();
  const { data: evaluatorContracts } = useEvaluatorContracts();
  const { executeAttestOnChain, isExecuting } = useContractAction();
  const queryClient = useQueryClient();

  const isSepolia = targetChainId === 11155111 || evaluatorContracts?.network === 'sepolia';
  const kycAddress = (evaluatorContracts?.contracts?.kycRegistry || '0xdf8d6C4b9a982a4c7a557686cb0A6dF6ECab0236') as `0x${string}`;

  const [fullName, setFullName] = useState(identity?.displayName && identity.displayName !== 'Institutional Actor' ? identity.displayName : '');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<'BORROWER' | 'LENDER' | 'MERCHANT'>('BORROWER');
  const [referenceId, setReferenceId] = useState(`CRD-${Date.now().toString().slice(-4)}`);
  const [businessCategory, setBusinessCategory] = useState('Laboratory & Scientific Hardware');
  const [showMilestone, setShowMilestone] = useState(false);
  const [customAttestAddress, setCustomAttestAddress] = useState('');
  const [customAttestRole, setCustomAttestRole] = useState<number>(1); // 1 = Borrower, 2 = Lender, 3 = Supplier
  const [attestStatusMessage, setAttestStatusMessage] = useState<string | null>(null);

  // Read on-chain verification from KYCRegistry (Role 1 = Borrower)
  const { data: onChainBorrowerVerified, refetch: refetchOnChainKyc } = useReadContract({
    address: kycAddress,
    abi: kycAbi as any,
    functionName: 'isVerified',
    args: address ? [address as `0x${string}`, 1] : undefined,
    query: {
      enabled: Boolean(address && kycAddress),
    }
  });

  // Check if active wallet has VERIFIER_ROLE
  const { data: isVerifierOnChain } = useReadContract({
    address: kycAddress,
    abi: kycAbi as any,
    functionName: 'hasRole',
    args: address ? ['0x0ce23c3e399818cfee81a7ab0880f714e53d7672b08df0fa62f2843416e1ea09' as `0x${string}`, address as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(address && kycAddress),
    }
  });

  const isVerifier = Boolean(isVerifierOnChain || address?.toLowerCase() === '0x448920c465158b78a694460e96e022b82b35c6e2');
  const isActuallyVerifiedOnChain = Boolean(onChainBorrowerVerified);

  const { data: request } = useQuery({
    queryKey: ['verificationRequest', address],
    queryFn: () => (address ? api.getVerificationRequestByAddress(address).catch(() => null) : null),
    enabled: Boolean(address),
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.createVerificationRequest(data),
    onSuccess: async () => {
      if (address && typeof window !== 'undefined') {
        const lower = address.toLowerCase();
        localStorage.setItem(`credify_verified_${lower}`, 'true');
        localStorage.setItem('credify_verified_status', 'VERIFIED');
        localStorage.setItem(`credify_role_${lower}`, role);
        if (fullName) localStorage.setItem(`credify_name_${lower}`, fullName);
      }
      await queryClient.invalidateQueries({ queryKey: ['verificationRequest', address] });
      await queryClient.invalidateQueries({ queryKey: ['identity'] });
      await queryClient.invalidateQueries({ queryKey: ['identity', address] });
      await queryClient.invalidateQueries({ queryKey: ['verification', 'all-requests'] });
      await refetchIdentity();
      await refetchOnChainKyc();
      setShowMilestone(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    submitMutation.mutate({
      walletAddress: address,
      role,
      profile: {
        fullName: fullName || 'Institutional Actor',
        organization: organization || 'Academic Labs',
        role,
        referenceId,
        businessCategory: role === 'MERCHANT' ? businessCategory : undefined,
      },
    });
  };

  // Verifier self-attestation or target attestation on Sepolia via MetaMask
  const handleOnChainAttest = async (targetAccount: `0x${string}`, roleType: number = 1) => {
    setAttestStatusMessage(null);
    try {
      setAttestStatusMessage('Please confirm the on-chain attestation in MetaMask...');
      const res = await executeAttestOnChain(targetAccount, roleType);
      setAttestStatusMessage(`Transaction submitted: ${res.hash.slice(0, 10)}... Mining on Sepolia.`);
      
      if (typeof window !== 'undefined') {
        const lower = targetAccount.toLowerCase();
        localStorage.setItem(`credify_verified_${lower}`, 'true');
        localStorage.setItem('credify_verified_status', 'VERIFIED');
        if (roleType === 1) localStorage.setItem(`credify_role_${lower}`, 'BORROWER');
        if (roleType === 2) localStorage.setItem(`credify_role_${lower}`, 'LENDER');
        if (roleType === 3) localStorage.setItem(`credify_role_${lower}`, 'MERCHANT');
      }

      await refetchOnChainKyc();
      await queryClient.invalidateQueries({ queryKey: ['verificationRequest', targetAccount] });
      await queryClient.invalidateQueries({ queryKey: ['identity'] });
      await refetchIdentity();
      setAttestStatusMessage('✅ Account successfully attested on Sepolia KYCRegistry!');
      setShowMilestone(true);
    } catch (err: any) {
      setAttestStatusMessage(`Attestation failed: ${err?.message || 'Transaction rejected'}`);
    }
  };

  const handleResetCache = async () => {
    if (typeof window !== 'undefined' && address) {
      const lower = address.toLowerCase();
      localStorage.removeItem(`credify_verified_${lower}`);
      localStorage.removeItem(`credify_role_${lower}`);
      localStorage.removeItem(`credify_name_${lower}`);
    }
    await refetchOnChainKyc();
    await refetchIdentity();
    await queryClient.invalidateQueries();
    setAttestStatusMessage('Local cache reset. Checked blockchain state.');
  };

  // Determine effective status: on-chain takes ultimate priority on live network
  const effectiveVerified = isGuidedMode ? true : isActuallyVerifiedOnChain || localVerified;
  const status = effectiveVerified ? 'VERIFIED' : request?.status || verificationStatus || 'NOT_STARTED';

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in pb-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 font-sans">
            Institutional Identity &amp; Verification Lifecycle
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Credify protocol enforces <code className="text-yellow-900 bg-yellow-100 font-mono px-1.5 py-0.5 rounded font-bold">KYCRegistry</code> verification before granting permission to deploy agreements, contribute capital, or receive merchant disbursements.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleResetCache}
          className="text-xs font-semibold text-slate-600 bg-white border-slate-300 hover:bg-slate-50"
          icon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Reset Cache
        </Button>
      </div>

      {/* AUTHORIZED VERIFIER CALLOUT (When connected as 0x4489... or verifier) */}
      {isVerifier && (
        <Card className="bg-amber-50/60 border-amber-300 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-amber-950 font-bold text-base">
                  Sepolia KYC Verifier Authority Active
                </CardTitle>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-200 border border-amber-400 text-amber-950 text-[11px] font-mono font-bold">
                VERIFIER_ROLE
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-amber-950">
            <p className="leading-relaxed font-medium">
              Your connected wallet (<code className="bg-amber-100 font-bold px-1 rounded">{address}</code>) holds the cryptographic <code className="font-bold">VERIFIER_ROLE</code> on the Sepolia <code className="font-bold">KYCRegistry</code> contract. You have direct authority to sign on-chain attestations in MetaMask.
            </p>

            {/* Self-Attestation Action */}
            <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-950 text-sm">
                  Active Wallet Borrower Attestation Status
                </div>
                {isActuallyVerifiedOnChain ? (
                  <span className="flex items-center gap-1 text-emerald-800 font-bold font-mono text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Borrower on Sepolia
                  </span>
                ) : (
                  <span className="text-amber-800 font-bold font-mono text-xs bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                    Not Attested as Borrower On-Chain
                  </span>
                )}
              </div>

              {!isActuallyVerifiedOnChain ? (
                <div className="space-y-2">
                  <p className="text-slate-700 text-xs font-medium">
                    To deploy loan agreements with this wallet without MetaMask simulation errors (<code className="font-mono bg-slate-100 px-1 rounded font-bold">BorrowerNotVerified()</code>), sign a 1-click self-attestation on the blockchain:
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    loading={isExecuting}
                    onClick={() => address && handleOnChainAttest(address as `0x${string}`, 1)}
                    className="w-full sm:w-auto font-bold bg-[#ffe600] text-black border border-yellow-400 hover:bg-yellow-400"
                    icon={<Sparkles className="w-4 h-4" />}
                  >
                    ⚡ Attest Myself as Borrower on Sepolia (MetaMask)
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-emerald-800 font-medium">
                    Your wallet is fully verified to create and deploy loan pools on Sepolia.
                  </span>
                  <Link to="/app/borrower/agreements/new">
                    <Button size="sm" variant="primary" className="font-bold text-xs">
                      Create Loan Agreement →
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Attest Any Address Action */}
            <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-3">
              <div className="font-bold text-slate-950 text-sm">
                Attest Any External Wallet on Sepolia
              </div>
              <p className="text-slate-700 text-xs font-medium">
                Enter any Ethereum address to attest and activate it directly on the Sepolia smart contract:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customAttestAddress}
                  onChange={(e) => setCustomAttestAddress(e.target.value)}
                  placeholder="Target address 0x..."
                  className="flex-1 font-mono text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-950 focus:border-yellow-400 focus:outline-none"
                />
                <select
                  value={customAttestRole}
                  onChange={(e) => setCustomAttestRole(Number(e.target.value))}
                  className="font-sans text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-950 font-bold focus:border-yellow-400 focus:outline-none"
                >
                  <option value={1}>Borrower (Role 1)</option>
                  <option value={2}>Lender (Role 2)</option>
                  <option value={3}>Supplier (Role 3)</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  loading={isExecuting}
                  onClick={() => {
                    const target = customAttestAddress.trim() as `0x${string}`;
                    if (target && target.startsWith('0x')) {
                      handleOnChainAttest(target, customAttestRole);
                    }
                  }}
                  className="font-bold text-xs bg-slate-900 text-white hover:bg-slate-800"
                >
                  Attest on Sepolia
                </Button>
              </div>
            </div>

            {attestStatusMessage && (
              <div className="p-3 rounded-lg bg-amber-100/70 border border-amber-300 text-amber-950 font-mono text-xs font-semibold">
                {attestStatusMessage}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lifecycle Status Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-slate-950 font-bold">Verification Lifecycle Status</CardTitle>
            {isActuallyVerifiedOnChain ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified On Sepolia Blockchain
              </span>
            ) : status === 'VERIFIED' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Identity Verified (Local / Sim)
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
          {(isActuallyVerifiedOnChain || status === 'VERIFIED') && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-4 text-xs animate-milestone-enter">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-950 text-sm">
                      {isActuallyVerifiedOnChain ? 'Cryptographic Attestation Active on Sepolia' : 'Attestation Active'}
                    </div>
                    <p className="text-slate-800 leading-relaxed text-xs font-medium">
                      The connected address is confirmed in the KYCRegistry smart contract. Protocol permissions associated with your role are fully unlocked.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowMilestone(true)}
                    className="text-xs font-bold bg-white border-slate-300 text-slate-900 hover:bg-slate-50"
                  >
                    View Attestation
                  </Button>
                  <Link to="/app/borrower/agreements/new">
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-xs font-bold bg-[#ffe600] text-black border border-yellow-400 hover:bg-yellow-400"
                    >
                      Create Loan Agreement →
                    </Button>
                  </Link>
                </div>
              </div>

              {request && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-emerald-200 text-xs font-mono">
                  <div>
                    <span className="text-slate-600 font-sans font-medium">Verified Role:</span>
                    <div className="font-bold text-slate-950 font-sans">{request.role}</div>
                  </div>
                  <div>
                    <span className="text-slate-600 font-sans font-medium">Organization:</span>
                    <div className="font-bold text-slate-950">{request.profile?.organization || 'Credify Labs'}</div>
                  </div>
                  <div>
                    <span className="text-slate-600 font-sans font-medium">Credential Reference:</span>
                    <div className="font-bold text-slate-950">{request.profile?.referenceId || 'CRD-ACTIVE'}</div>
                  </div>
                  <div>
                    <span className="text-slate-600 font-sans font-medium">Approver Address:</span>
                    <div className="font-bold text-slate-950">
                      {request.reviewedBy ? <AddressBadge address={request.reviewedBy} chars={6} /> : 'On-Chain Verifier'}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-600 font-sans font-medium">Salted Credential Hash:</span>
                    <div className="truncate text-slate-800 font-semibold" title={request.credentialHash}>{request.credentialHash}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submission / Resubmission Form (Always available if not yet on-chain verified) */}
          {!isActuallyVerifiedOnChain && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-200">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-950 text-sm">
                  {status === 'REJECTED' ? 'Resubmit Updated Credentials' : 'Submit Institutional Credentials'}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Enter credentials representing your institution, lab, or merchant facility to register for protocol evaluation.
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

              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-bold bg-[#ffe600] text-black border border-yellow-400 hover:bg-yellow-400"
                  loading={submitMutation.isPending}
                  icon={<FileCheck2 className="w-4 h-4" />}
                >
                  {status === 'REJECTED' ? 'Resubmit Verification' : 'Submit & Register Verification'}
                </Button>
                <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center font-medium">
                  {isVerifier ? (
                    <span>
                      ⚡ <strong>Instant On-Chain Verifier:</strong> As an authorized verifier on Sepolia, you can also use the control panel above to sign the on-chain attestation directly in MetaMask.
                    </span>
                  ) : (
                    <span>
                      ⚡ <strong>Sepolia Verification Note:</strong> Submitting registers your profile. For live on-chain evaluation without simulated demo mode, an authorized verifier wallet (<code className="font-mono font-bold">0x4489...</code>) signs the on-chain record in MetaMask.
                    </span>
                  )}
                </div>
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
          label: 'Create Loan Agreement',
          onClick: () => {
            setShowMilestone(false);
          },
        }}
      />
    </div>
  );
};
