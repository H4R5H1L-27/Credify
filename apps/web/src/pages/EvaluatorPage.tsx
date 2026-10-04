import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useHealth, useEvaluatorContracts, useResetDemo } from '../hooks/useCredify';
import { useWallet } from '../context/WalletContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AddressBadge } from '../components/ui/AddressBadge';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import { Tabs } from '../components/ui/Tabs';
import { DEMO_ACCOUNTS, HARDHAT_CHAIN_ID, HARDHAT_RPC_URL } from '@credify/shared';
import {
  RefreshCw,
  CheckCircle2,
  Key,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  XCircle,
  Layers,
} from 'lucide-react';

export const EvaluatorPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useHealth();
  const { data: evaluatorData } = useEvaluatorContracts();
  const {
    address: currentWalletAddress,
    addHardhatNetwork,
  } = useWallet();

  const resetDemoMutation = useResetDemo();

  const [activeTab, setActiveTab] = useState<'queue' | 'accounts' | 'contracts' | 'reset'>('queue');
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [networkAdded, setNetworkAdded] = useState(false);

  // Fetch Verification Requests Queue
  const {
    data: verificationRequests = [],
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['verificationRequests'],
    queryFn: () => api.getVerificationRequests(),
    refetchInterval: 5000,
  });

  // Review Verification Mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: 'VERIFIED' | 'REJECTED'; rejectionReason?: string }) => {
      return api.reviewVerificationRequest(id, { status, rejectionReason });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['verificationRequests'] });
      queryClient.invalidateQueries({ queryKey: ['identity'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setSuccessMessage(
        updated.status === 'VERIFIED'
          ? `Attestation confirmed on-chain! Tx: ${updated.attestationTxHash?.slice(0, 10)}... (Account: ${updated.walletAddress.slice(0, 8)}...)`
          : `Application rejected.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
      setReviewingId(null);
    },
  });

  const handleReview = async (id: string, status: 'VERIFIED' | 'REJECTED', reason?: string) => {
    setReviewingId(id);
    try {
      await reviewMutation.mutateAsync({ id, status, rejectionReason: reason });
    } catch {
      setReviewingId(null);
    }
  };

  const handleCopyKey = (key: string, index: number) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyIndex(index);
    setTimeout(() => setCopiedKeyIndex(null), 2000);
  };

  const handleAddNetwork = async () => {
    await addHardhatNetwork();
    setNetworkAdded(true);
    setTimeout(() => setNetworkAdded(false), 3000);
  };

  const pendingCount = verificationRequests.filter((r) => r.status === 'PENDING').length;
  const filteredRequests = verificationRequests.filter((r) => {
    if (queueFilter === 'ALL') return true;
    return r.status === queueFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 font-sans">Evaluator Console</h1>
            <span className="text-xs font-mono font-bold text-yellow-950 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300">
              KYC &amp; RPC ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Administrative console to inspect EVM node health, approve on-chain KYC attestations, and view pre-funded test accounts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetchHealth(); refetchRequests(); }}
          loading={healthLoading || requestsLoading}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-xs shrink-0 self-start sm:self-auto bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-bold"
        >
          Refresh State
        </Button>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <Alert variant="success" title="On-Chain Action Successful">
          {successMessage}
        </Alert>
      )}

      {/* Chain Connectivity Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">EVM Status</span>
            <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{health?.ok ? 'Connected' : 'Offline'}</span>
            </div>
          </div>
          <div className="text-base font-black text-slate-950 mt-1">
            {healthLoading ? <Skeleton className="h-5 w-20" /> : (health?.ok ? 'Local Node Active' : 'Disconnected')}
          </div>
          <span className="text-xs text-slate-500 font-mono truncate block font-medium">{HARDHAT_RPC_URL}</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Latest Block</span>
          <div className="text-base font-black text-slate-950 mt-1 font-mono">
            {healthLoading ? <Skeleton className="h-5 w-20" /> : `#${health?.blockNumber || '0'}`}
          </div>
          <span className="text-xs text-slate-500 font-medium">Deterministic local mining</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deployed Loan Pools</span>
          <div className="text-base font-black text-slate-950 mt-1 font-mono">
            {healthLoading ? <Skeleton className="h-5 w-12" /> : `${health?.poolCount || 0} pools`}
          </div>
          <span className="text-xs text-slate-500 font-medium">Indexed from LoanFactory</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verification Queue</span>
            {pendingCount > 0 && (
              <Badge variant="warning" className="text-xs px-2 py-0.5">
                {pendingCount} Pending
              </Badge>
            )}
          </div>
          <div className="text-base font-black text-slate-950 mt-1 font-mono">
            {requestsLoading ? <Skeleton className="h-5 w-12" /> : `${verificationRequests.length} total`}
          </div>
          <span className="text-xs text-slate-500 font-medium">KYCRegistry attestations</span>
        </Card>
      </div>

      {/* Main Tab Navigation */}
      <div>
        <Tabs
          variant="pill"
          tabs={[
            {
              id: 'queue',
              label: 'Verification Queue',
              icon: <UserCheck className="w-3.5 h-3.5" />,
              count: pendingCount > 0 ? pendingCount : undefined,
            },
            {
              id: 'accounts',
              label: 'Test Accounts & Keys',
              icon: <Key className="w-3.5 h-3.5" />,
            },
            {
              id: 'contracts',
              label: 'Contracts & Health',
              icon: <Layers className="w-3.5 h-3.5" />,
            },
            {
              id: 'reset',
              label: 'Reset Projections',
              icon: <RefreshCw className="w-3.5 h-3.5" />,
            },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />
      </div>

      {/* TAB 1: VERIFICATION QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Header & Sub-filter pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">Attestation Processing Queue</h2>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Pending institutional identity requests waiting for authorized operator signing on <code className="font-mono text-yellow-950 bg-yellow-100 px-1 py-0.5 rounded font-bold">KYCRegistry.sol</code>.
              </p>
            </div>

            {/* Sub-filter pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
              {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((f) => {
                const isActive = queueFilter === f;
                const count =
                  f === 'ALL'
                    ? verificationRequests.length
                    : verificationRequests.filter((r) => r.status === f).length;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setQueueFilter(f)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ffe600] text-black border border-yellow-400 shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <span>{f.charAt(0) + f.slice(1).toLowerCase()}</span>
                    <span className={`ml-1 text-[10px] font-mono px-1 py-0.2 rounded-full ${
                      isActive ? 'bg-black text-[#ffe600]' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Subject &amp; Org</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Wallet Address</th>
                    <th className="py-3 px-4">Credential Hash</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {requestsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                        Loading attestation queue...
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                        No requests found in this filter category.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const isPending = req.status === 'PENDING';
                      const isVerified = req.status === 'VERIFIED';
                      const isCurrentAction = reviewingId === req.id;

                      return (
                        <tr key={req.id} className="hover:bg-yellow-50/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-950">{req.profile?.fullName || 'Unknown Subject'}</div>
                            <div className="text-xs text-slate-600 font-medium">{req.profile?.organization || req.profile?.businessCategory || 'N/A'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                req.role === 'BORROWER'
                                  ? 'default'
                                  : req.role === 'LENDER'
                                  ? 'success'
                                  : req.role === 'MERCHANT'
                                  ? 'warning'
                                  : 'secondary'
                              }
                            >
                              {req.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <AddressBadge address={req.walletAddress} chars={4} />
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-500">
                            <span title={req.credentialHash}>{req.credentialHash.slice(0, 10)}...</span>
                          </td>
                          <td className="py-3 px-4">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded text-xs font-mono">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 font-bold text-yellow-950 bg-yellow-50 border border-yellow-300 px-2 py-0.5 rounded text-xs font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                Pending Review
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded text-xs font-mono">
                                <XCircle className="w-3.5 h-3.5" />
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  loading={isCurrentAction}
                                  onClick={() => handleReview(req.id, 'VERIFIED')}
                                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                  className="text-xs h-7 font-bold"
                                >
                                  Approve On-Chain
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isCurrentAction}
                                  onClick={() => { setShowRejectDialog(req.id); setRejectionReason(''); }}
                                  className="text-xs h-7 font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50"
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : isVerified ? (
                              <div className="text-xs font-mono text-slate-500 flex items-center justify-end gap-1 font-medium">
                                <span>Attested in block #{req.attestationBlock || '—'}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 font-medium">Rejected</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Rejection Reason Dialog */}
          {showRejectDialog && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-4 border border-slate-200">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-950">Reject Verification Request</h3>
                  <p className="text-xs text-slate-600 font-medium">Provide a reason for rejection. The applicant will see this and can resubmit with updated credentials.</p>
                </div>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Institutional affiliation could not be verified. Please provide a valid department reference."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white text-slate-950 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder:text-slate-400 font-medium"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowRejectDialog(null)}
                    className="text-xs font-bold bg-white border-slate-300 text-slate-900 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    loading={reviewingId === showRejectDialog}
                    onClick={() => {
                      handleReview(showRejectDialog, 'REJECTED', rejectionReason || undefined);
                      setShowRejectDialog(null);
                    }}
                    className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEST ACCOUNTS & KEYS */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-950">Deterministic Hardhat Test Accounts</h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              These deterministic accounts are funded with local test ETH on the running Hardhat node. Copy a private key to import it into your browser MetaMask extension.
            </p>
          </div>

          <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm">
            <div className="divide-y divide-slate-200 text-xs">
              {DEMO_ACCOUNTS.map((acc, index) => {
                const isCurrentInWallet =
                  currentWalletAddress && currentWalletAddress.toLowerCase() === acc.address.toLowerCase();

                return (
                  <div
                    key={acc.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-yellow-50/40 transition-colors ${
                      isCurrentInWallet ? 'bg-yellow-50/70 border-l-4 border-l-[#ffe600]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-900 shrink-0">
                        {acc.displayName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-950 flex items-center gap-2">
                          <span>{acc.displayName}</span>
                          <Badge
                            variant={
                              acc.role === 'BORROWER'
                                ? 'default'
                                : acc.role === 'LENDER'
                                ? 'success'
                                : acc.role === 'MERCHANT'
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {acc.role}
                          </Badge>
                          {isCurrentInWallet && (
                            <Badge variant="warning" className="text-[10px]">
                              Connected in MetaMask
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 mt-1 font-medium">
                          <AddressBadge address={acc.address} chars={6} />
                          <span>·</span>
                          <span className="text-slate-600">{acc.description}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyKey(acc.privateKey, index)}
                        className="text-xs font-mono font-bold bg-white border-slate-300 text-slate-900 hover:bg-slate-50"
                      >
                        {copiedKeyIndex === index ? 'Copied!' : 'Copy Key'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Alert variant="info" title="How to import into MetaMask">
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 mt-1 font-medium">
              <li>Click "Copy Key" for any account above.</li>
              <li>Open your MetaMask browser extension and click the account selector at the top.</li>
              <li>Click <strong>Add account or hardware wallet</strong> &rarr; <strong>Import account</strong>.</li>
              <li>Paste the private key string and click <strong>Import</strong>.</li>
              <li>Ensure MetaMask is connected to <strong>Hardhat Localhost</strong> (RPC: http://127.0.0.1:8545).</li>
            </ol>
          </Alert>
        </div>
      )}

      {/* TAB 3: CONTRACTS & HEALTH */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-950">Deployed Contracts &amp; EVM Parameters</h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Live smart contract addresses deployed by the initialization migration script on the local EVM network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Core Contracts */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-950">Protocol Core Contracts</CardTitle>
                <CardDescription className="text-slate-600 font-medium">Deployed factory and registry singletons</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200 text-xs">
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-950">LoanFactory</div>
                      <div className="text-xs text-slate-600 font-medium">Deploys new isolated LoanPool contracts</div>
                    </div>
                    <AddressBadge address={evaluatorData?.contracts.loanFactory || '0x'} chars={6} />
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-950">KYCRegistry</div>
                      <div className="text-xs text-slate-600 font-medium">On-chain credential attestation store</div>
                    </div>
                    <AddressBadge address={evaluatorData?.contracts.kycRegistry || '0x'} chars={6} />
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-950">ReputationRegistry</div>
                      <div className="text-xs text-slate-600 font-medium">Borrower repayment scoring engine</div>
                    </div>
                    <AddressBadge address={evaluatorData?.contracts.reputationRegistry || '0x'} chars={6} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Parameters */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-950">EVM Node Configuration</CardTitle>
                <CardDescription className="text-slate-600 font-medium">Local development node settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Network Name:</span>
                  <span className="font-mono font-bold text-slate-950">Hardhat Localhost</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">RPC Endpoint:</span>
                  <span className="font-mono font-bold text-slate-950">{HARDHAT_RPC_URL}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Chain ID:</span>
                  <span className="font-mono font-bold text-slate-950">{HARDHAT_CHAIN_ID}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Currency Symbol:</span>
                  <span className="font-mono font-bold text-slate-950">ETH</span>
                </div>
                <div className="pt-2">
                  <Button size="sm" variant="secondary" onClick={handleAddNetwork} className="w-full text-xs font-bold">
                    <PlusCircle className="mr-1.5 h-3.5 w-3.5 text-yellow-700" />
                    {networkAdded ? 'Request Sent to MetaMask' : 'Add / Switch Network in MetaMask'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: RESET PROJECTIONS */}
      {activeTab === 'reset' && (
        <div className="space-y-4">
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-950 flex items-center gap-2 text-sm font-bold">
                <RefreshCw className="w-4 h-4 text-amber-700" />
                <span>Event Projection Store Reset</span>
              </CardTitle>
              <CardDescription className="text-amber-900 font-medium">
                Resets the Fastify API indexer database and re-indexes all on-chain events from block 0 of the running node.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                This operation resets the read projection database (<code className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold">apps/api/data/projection.json</code>) without resetting the underlying EVM node.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={async () => {
                    await resetDemoMutation.mutateAsync();
                    setSuccessMessage('Event projection successfully reset and re-indexed from block 0!');
                    setTimeout(() => setSuccessMessage(null), 4000);
                  }}
                  loading={resetDemoMutation.isPending}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="bg-white border-amber-300 text-amber-950 font-bold hover:bg-amber-100"
                >
                  Re-Index Event Projection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
