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
  Terminal,
  RefreshCw,
  CheckCircle2,
  Wallet,
  Key,
  PlusCircle,
  Check,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
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

  const filteredRequests = queueFilter === 'ALL'
    ? verificationRequests
    : verificationRequests.filter((r) => r.status === queueFilter);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="border-b border-white/10 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#0071e3]/15 text-[#2997ff] border border-blue-500/25">
                <Terminal className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Evaluator & Academic Console</h1>
            </div>
            <p className="text-xs text-[#86868b] mt-1.5">
              Independent examination tools: review credential verification queue, inspect on-chain contracts, and test using pre-funded deterministic accounts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                refetchHealth();
                refetchRequests();
              }}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <Alert variant="success" title="On-Chain Action Successful">
          {successMessage}
        </Alert>
      )}

      {/* Chain Connectivity Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-dark-bg-1 border-dark-border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-dark-text-muted uppercase tracking-wider">EVM Status</span>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{health?.ok ? 'Connected' : 'Offline'}</span>
            </div>
          </div>
          <div className="text-base font-bold text-dark-text-primary mt-1">
            {healthLoading ? <Skeleton className="h-5 w-20" /> : (health?.ok ? 'Local Node Active' : 'Disconnected')}
          </div>
          <span className="text-xs text-dark-text-muted font-mono truncate block">{HARDHAT_RPC_URL}</span>
        </Card>

        <Card className="p-4 bg-dark-bg-1 border-dark-border-subtle">
          <span className="text-xs font-semibold text-dark-text-muted uppercase tracking-wider">Latest Block</span>
          <div className="text-base font-bold text-dark-text-primary mt-1 font-mono">
            {healthLoading ? <Skeleton className="h-5 w-20" /> : `#${health?.blockNumber || '0'}`}
          </div>
          <span className="text-xs text-dark-text-muted">Deterministic local mining</span>
        </Card>

        <Card className="p-4 bg-dark-bg-1 border-dark-border-subtle">
          <span className="text-xs font-semibold text-dark-text-muted uppercase tracking-wider">Deployed Loan Pools</span>
          <div className="text-base font-bold text-dark-text-primary mt-1 font-mono">
            {healthLoading ? <Skeleton className="h-5 w-12" /> : `${health?.poolCount || 0} pools`}
          </div>
          <span className="text-xs text-dark-text-muted">Indexed from LoanFactory</span>
        </Card>

        <Card className="p-4 bg-dark-bg-1 border-dark-border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-dark-text-muted uppercase tracking-wider">Verification Queue</span>
            {pendingCount > 0 && (
              <Badge variant="warning" className="text-xs px-1.5 py-0.5">
                {pendingCount} Pending
              </Badge>
            )}
          </div>
          <div className="text-base font-bold text-dark-text-primary mt-1 font-mono">
            {requestsLoading ? <Skeleton className="h-5 w-12" /> : `${verificationRequests.length} total`}
          </div>
          <span className="text-xs text-dark-text-muted">KYCRegistry attestations</span>
        </Card>
      </div>

      {/* Main Tab Navigation with Animated Sliding Glider */}
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
          onChange={(id) => setActiveTab(id as 'queue' | 'accounts' | 'contracts' | 'reset')}
        />
      </div>

      {/* TAB 1: VERIFICATION QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Verification Requests & Attestations</h2>
              <p className="text-xs text-[#86868b] mt-0.5">
                Evaluator verifier queue. Approving a request executes a live transaction on the <code className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/10">KYCRegistry</code> smart contract.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchRequests()}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Refresh Queue
            </Button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-dark-bg-2 border border-dark-border-subtle rounded-lg p-1">
            {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((filter) => {
              const count = filter === 'ALL'
                ? verificationRequests.length
                : verificationRequests.filter((r) => r.status === filter).length;
              return (
                <button
                  key={filter}
                  onClick={() => setQueueFilter(filter)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    queueFilter === filter
                      ? 'bg-dark-bg-3 text-dark-text-primary shadow-xs font-semibold'
                      : 'text-dark-text-secondary hover:text-dark-text-primary'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter === 'PENDING' ? 'Pending Review' : filter === 'VERIFIED' ? 'Verified' : 'Rejected'}
                  <span className="ml-1.5 text-xs font-mono text-dark-text-muted">{count}</span>
                </button>
              );
            })}
          </div>

          <Card className="p-0 overflow-hidden bg-dark-bg-1 border-dark-border-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-bg-2 text-dark-text-muted uppercase tracking-wider font-semibold border-b border-dark-border-subtle">
                  <tr>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Wallet Address</th>
                    <th className="py-3 px-4">Credential Hash</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Attestation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border-subtle font-sans">
                  {requestsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-dark-text-muted">
                        Loading verification queue...
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-dark-text-secondary">
                        {queueFilter === 'ALL' ? 'No verification requests found in the system.' : `No ${queueFilter.toLowerCase()} requests.`}
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const isPending = req.status === 'PENDING';
                      const isVerified = req.status === 'VERIFIED';
                      const isCurrentAction = reviewingId === req.id;

                      return (
                        <tr key={req.id} className="hover:bg-dark-bg-2/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-dark-text-primary">{req.profile?.fullName || 'Unknown Subject'}</div>
                            <div className="text-xs text-dark-text-muted">{req.profile?.organization || req.profile?.businessCategory || 'N/A'}</div>
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
                          <td className="py-3 px-4 font-mono text-xs text-dark-text-muted">
                            <span title={req.credentialHash}>{req.credentialHash.slice(0, 10)}...</span>
                          </td>
                          <td className="py-3 px-4">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Pending Review
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded text-xs">
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
                                  className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                                >
                                  Approve On-Chain
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isCurrentAction}
                                  onClick={() => { setShowRejectDialog(req.id); setRejectionReason(''); }}
                                  className="text-xs h-7 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : isVerified ? (
                              <div className="text-xs font-mono text-dark-text-muted flex items-center justify-end gap-1">
                                <span>Attested in block #{req.attestationBlock || '—'}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-dark-text-muted">Rejected</span>
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
            <div className="fixed inset-0 bg-dark-bg-0/75 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="surface-glass rounded-xl shadow-glass max-w-md w-full mx-4 p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-dark-text-primary">Reject Verification Request</h3>
                  <p className="text-xs text-dark-text-secondary">Provide a reason for rejection. The applicant will see this and can resubmit with updated credentials.</p>
                </div>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Institutional affiliation could not be verified. Please provide a valid department reference."
                  className="w-full text-xs p-3 rounded-lg border border-dark-border-default bg-dark-bg-2 text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder:text-dark-text-muted"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowRejectDialog(null)}
                    className="text-xs"
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
                    className="text-xs bg-rose-600 hover:bg-rose-700"
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
            <h2 className="text-sm font-semibold text-white">Deterministic Hardhat Test Accounts</h2>
            <p className="text-xs text-[#86868b] mt-0.5">
              These deterministic accounts are funded with local test ETH on the running Hardhat node. Copy a private key to import it into your browser MetaMask extension.
            </p>
          </div>

          <Card className="p-0 overflow-hidden bg-dark-bg-1 border-white/10">
            <div className="divide-y divide-white/10 text-xs">
              {DEMO_ACCOUNTS.map((acc, index) => {
                const isCurrentInWallet =
                  currentWalletAddress && currentWalletAddress.toLowerCase() === acc.address.toLowerCase();

                return (
                  <div
                    key={acc.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors ${
                      isCurrentInWallet ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold text-xs text-white shrink-0">
                        {acc.displayName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
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
                        <div className="text-[11px] text-[#86868b] flex flex-wrap items-center gap-2 mt-1">
                          <AddressBadge address={acc.address} chars={6} />
                          <span>·</span>
                          <span className="text-[#86868b]">{acc.description}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Alert variant="info" title="How to import into MetaMask">
            <ol className="list-decimal list-inside space-y-1 text-xs text-dark-text-secondary mt-1">
              <li>Click "Copy Private Key" for any account above.</li>
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
            <h2 className="text-sm font-semibold text-white">Deployed Contracts & EVM Parameters</h2>
            <p className="text-xs text-[#86868b] mt-0.5">
              Live smart contract addresses deployed by the initialization migration script on the local EVM network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Core Contracts */}
            <Card className="bg-dark-bg-1 border-white/10">
              <CardHeader>
                <CardTitle className="text-sm text-white">Protocol Core Contracts</CardTitle>
                <CardDescription className="text-[#86868b]">Deployed factory and registry singletons</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/10 text-xs">
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">LoanFactory</div>
                      <div className="text-[11px] text-[#86868b]">Deploys new isolated LoanPool contracts</div>
                    </div>
                    <AddressBadge address={evaluatorData?.contracts.loanFactory || '0x'} chars={6} />
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">KYCRegistry</div>
                      <div className="text-[11px] text-[#86868b]">On-chain credential attestation store</div>
                    </div>
                    <AddressBadge address={evaluatorData?.contracts.kycRegistry || '0x'} chars={6} />
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">ReputationRegistry</div>
                      <div className="text-[11px] text-[#86868b]">Borrower repayment scoring engine</div>
                    </div>
                    <AddressBadge address={evaluatorData?.contracts.reputationRegistry || '0x'} chars={6} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Parameters */}
            <Card className="bg-dark-bg-1 border-white/10">
              <CardHeader>
                <CardTitle className="text-sm text-white">EVM Node Configuration</CardTitle>
                <CardDescription className="text-[#86868b]">Local development node settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/10">
                  <span className="text-[#86868b]">Network Name:</span>
                  <span className="font-mono font-medium text-white">Hardhat Localhost</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/10">
                  <span className="text-[#86868b]">RPC Endpoint:</span>
                  <span className="font-mono font-medium text-white">{HARDHAT_RPC_URL}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/10">
                  <span className="text-[#86868b]">Chain ID:</span>
                  <span className="font-mono font-medium text-white">{HARDHAT_CHAIN_ID}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/10">
                  <span className="text-[#86868b]">Currency Symbol:</span>
                  <span className="font-mono font-medium text-white">ETH</span>
                </div>
                <div className="pt-2">
                  <Button size="sm" variant="secondary" onClick={handleAddNetwork} className="w-full text-xs">
                    <PlusCircle className="mr-1.5 h-3.5 w-3.5 text-blue-400" />
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
          <Card className="border-amber-500/30 bg-amber-500/10">
            <CardHeader>
              <CardTitle className="text-amber-400 flex items-center gap-2 text-sm">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>Event Projection Store Reset</span>
              </CardTitle>
              <CardDescription className="text-[#86868b]">
                Resets the Fastify API indexer database and re-indexes all on-chain events from block 0 of the running node.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-[#a1a1a6] leading-relaxed">
                This operation resets the read projection database (<code className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/10">apps/api/data/projection.json</code>) without resetting the underlying EVM node.
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
                  icon={<RefreshCw className="w-4 h-4" />}
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
