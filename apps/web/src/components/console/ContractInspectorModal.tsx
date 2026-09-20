import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { consoleApi, api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { TechnicalValue } from './TechnicalValue';
import { EventBadge } from './EventBadge';
import {
  FileCode2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Fuel,
  ExternalLink,
  Search,
  Lock,
  Eye,
  Edit3,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ContractInspectorModalProps {
  address: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTx?: (txHash: string) => void;
}

export const ContractInspectorModal: React.FC<ContractInspectorModalProps> = ({
  address,
  isOpen,
  onClose,
  onSelectTx,
}) => {
  const [activeTab, setActiveTab] = useState<'STATE' | 'INTERFACE' | 'EVENTS'>('STATE');

  // Query contract details from backend
  const { data: contract, isLoading } = useQuery({
    queryKey: ['console', 'contract', address],
    queryFn: () => (address ? consoleApi.getContract(address) : null),
    enabled: Boolean(address && isOpen),
  });

  // Query pool details if contract is a pool
  const { data: poolDetails } = useQuery({
    queryKey: ['loan', address],
    queryFn: () => (address ? api.getLoan(address) : null),
    enabled: Boolean(address && isOpen && (contract?.type === 'POOL' || contract?.poolState)),
  });

  // Interactive tester states for KYC and Reputation
  const [testAccount, setTestAccount] = useState('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen || !address) return null;

  const balanceEth = contract ? (Number(contract.balanceWei) / 1e18).toFixed(4) : '0.0000';
  const hasPoolData = Boolean(poolDetails || contract?.poolState);
  const borrowerAddress = poolDetails?.borrower?.walletAddress || (typeof contract?.poolState?.borrower === 'string' ? contract.poolState.borrower : '');
  const borrowerName = poolDetails?.borrower?.displayName || 'Borrower Principal';
  const targetWei = poolDetails?.targetWei || contract?.poolState?.targetWei || '0';
  const contributedWei = poolDetails?.contributedWei || contract?.poolState?.contributedWei || '0';
  const totalSpentWei = poolDetails?.totalSpentWei || contract?.poolState?.totalSpentWei || '0';
  const maxSpendWei = poolDetails?.maxSpendWei || contract?.poolState?.targetWei || '0';
  const totalRepaidWei = poolDetails?.totalRepaidWei || contract?.poolState?.totalRepaidWei || '0';
  const totalRepayableWei = poolDetails?.totalRepayableWei || targetWei;
  const poolMaturity = poolDetails?.maturity || contract?.poolState?.maturity || 'N/A';
  const poolStatus = poolDetails?.status || contract?.poolState?.status || 'UNKNOWN';
  const merchantsList = poolDetails?.merchants || contract?.poolState?.merchants || [];
  const fundedBps = poolDetails?.fundedBps ?? (Number(targetWei) > 0 ? Math.round((Number(contributedWei) / Number(targetWei)) * 10000) : 0);
  const aprBps = poolDetails?.aprBps ?? 800;
  const defaultThresholdWei = poolDetails?.defaultThresholdWei || '0';

  const handleTestKYC = async () => {
    if (!testAccount.startsWith('0x') || testAccount.length !== 42) {
      setTestResult('Invalid Ethereum address format');
      return;
    }
    try {
      const identity = await api.getIdentity(testAccount);
      setTestResult(identity.isVerified ? 'VERIFIED (true)' : 'NOT_VERIFIED (false)');
    } catch {
      setTestResult('Query failed');
    }
  };

  const handleTestReputation = async () => {
    if (!testAccount.startsWith('0x') || testAccount.length !== 42) {
      setTestResult('Invalid Ethereum address format');
      return;
    }
    try {
      const rep = await api.getReputation(testAccount);
      setTestResult(`Score: ${rep.score}/100 | Repaid: ${rep.successfulLoans} | Defaulted: ${rep.defaultedLoans}`);
    } catch {
      setTestResult('Query failed');
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={contract?.name || 'Smart Contract'}
      description="Deep on-chain contract state inspection and interface documentation"
      maxWidth="xl"
    >
      {isLoading ? (
        <div className="py-16 text-center text-xs font-mono text-dark-text-muted space-y-3">
          <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Inspecting on-chain contract bytecode and storage slots...</div>
        </div>
      ) : !contract ? (
        <div className="py-12 text-center text-xs font-mono text-dark-text-muted space-y-2">
          <Layers className="w-8 h-8 mx-auto text-dark-text-muted" />
          <div>Contract not found or not deployed on local chain.</div>
        </div>
      ) : (
        <div className="space-y-6 font-mono text-xs">
          {/* Contract Identity Header */}
          <div className="p-4 rounded-xl bg-dark-bg-3 border border-dark-border-subtle space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-dark-text-primary flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-brand-400" />
                  {contract.name}
                </span>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    contract.type === 'POOL'
                      ? 'bg-brand-500/15 border border-brand-500/30 text-brand-400'
                      : contract.type === 'FACTORY'
                      ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                      : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {contract.type}
                </span>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                  BYTECODE VERIFIED
                </span>
              </div>
            </div>

            {/* Address & Description */}
            <div className="space-y-1 pt-1 border-t border-dark-border-subtle text-[11px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-dark-text-muted">Contract Address:</span>
                <TechnicalValue value={contract.address} type="address" chars={12} />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
                <span className="text-dark-text-muted">Purpose / Architecture:</span>
                <span className="text-dark-text-secondary font-sans text-xs">{contract.role}</span>
              </div>
            </div>

            {/* Balances & Size Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-dark-border-subtle text-[10px]">
              <div>
                <span className="text-dark-text-muted">On-Chain Escrow:</span>
                <div className="font-bold text-dark-text-primary text-xs">{balanceEth} ETH</div>
              </div>
              <div>
                <span className="text-dark-text-muted">Bytecode Size:</span>
                <div className="font-bold text-dark-text-primary text-xs">
                  {contract.bytecodeSize.toLocaleString()} bytes
                </div>
              </div>
              <div>
                <span className="text-dark-text-muted">Events Emitted:</span>
                <div className="font-bold text-brand-400 text-xs">{contract.eventsEmitted.length} recorded</div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-4 pt-2 border-t border-dark-border-subtle text-[10px]">
              <Link
                to={`/console/transactions?address=${contract.address}`}
                onClick={onClose}
                className="text-brand-400 hover:underline flex items-center gap-1"
              >
                <span>View Related Transactions</span>
                <ArrowRight className="w-3 h-3" />
              </Link>

              <Link
                to={`/console/events?contract=${contract.address}`}
                onClick={onClose}
                className="text-brand-400 hover:underline flex items-center gap-1"
              >
                <span>View Event Stream</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Navigation Tabs with Animated Glider */}
          <Tabs
            variant="pill"
            tabs={[
              {
                id: 'STATE',
                label: 'READ STATE',
                icon: <Eye className="w-3.5 h-3.5" />,
              },
              {
                id: 'INTERFACE',
                label: 'INTERFACE CAPABILITIES',
                icon: <FileCode2 className="w-3.5 h-3.5" />,
              },
              {
                id: 'EVENTS',
                label: `EMITTED EVENTS (${contract.eventsEmitted.length})`,
                icon: <Layers className="w-3.5 h-3.5" />,
              },
            ]}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as 'STATE' | 'INTERFACE' | 'EVENTS')}
          />

          {/* TAB 1: READ STATE */}
          {activeTab === 'STATE' && (
            <div className="space-y-4">
              {(contract.name === 'LoanPool' || contract.type === 'POOL') && hasPoolData ? (
                <div className="p-4 rounded-xl bg-dark-bg-3 border border-dark-border-subtle space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-dark-text-primary text-xs">
                      Authoritative Credit Facility State
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/15 border border-brand-500/30 text-brand-400 font-bold uppercase">
                      Status: {poolStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-3 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-1">
                      <span className="text-[10px] text-dark-text-muted uppercase">Borrower Identity</span>
                      <div className="text-dark-text-primary font-bold">{borrowerName}</div>
                      <TechnicalValue value={borrowerAddress} type="address" chars={8} />
                    </div>

                    <div className="p-3 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-1">
                      <span className="text-[10px] text-dark-text-muted uppercase">Funding Target &amp; Progress</span>
                      <div className="text-dark-text-primary font-bold">
                        {(Number(contributedWei) / 1e18).toFixed(4)} / {(Number(targetWei) / 1e18).toFixed(4)} ETH
                      </div>
                      <div className="text-[10px] text-dark-text-muted">{(fundedBps / 100).toFixed(1)}% subscribed</div>
                    </div>

                    <div className="p-3 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-1">
                      <span className="text-[10px] text-dark-text-muted uppercase">Controlled Supplier Spending</span>
                      <div className="text-dark-text-primary font-bold">
                        {(Number(totalSpentWei) / 1e18).toFixed(4)} / {(Number(maxSpendWei) / 1e18).toFixed(4)} ETH
                      </div>
                      <div className="text-[10px] text-dark-text-muted">{merchantsList.length} authorized suppliers</div>
                    </div>

                    <div className="p-3 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-1">
                      <span className="text-[10px] text-dark-text-muted uppercase">Repayments &amp; Debt Service</span>
                      <div className="text-dark-text-primary font-bold">
                        {(Number(totalRepaidWei) / 1e18).toFixed(4)} / {(Number(totalRepayableWei) / 1e18).toFixed(4)} ETH
                      </div>
                      <div className="text-[10px] text-dark-text-muted">Fixed APR: {(aprBps / 100).toFixed(2)}%</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-dark-text-muted">Maturity Timestamp:</span>
                      <span className="text-dark-text-primary font-bold">{poolMaturity}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-dark-text-muted">Default Governance Quorum:</span>
                      <span className="text-dark-text-primary font-bold">
                        66.00% ({((Number(defaultThresholdWei || '0') / 1e18)).toFixed(4)} ETH)
                      </span>
                    </div>
                  </div>
                </div>
              ) : contract.name === 'KYCRegistry' ? (
                <div className="p-4 rounded-xl bg-dark-bg-3 border border-dark-border-subtle space-y-4">
                  <div className="space-y-1">
                    <span className="font-bold text-dark-text-primary text-xs">KYCRegistry On-Chain State</span>
                    <p className="text-[11px] text-dark-text-muted font-sans">
                      Maintains mapping of Ethereum addresses to cryptographically attested verification status.
                    </p>
                  </div>

                  {/* Interactive Query Tester */}
                  <div className="p-3.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-2.5">
                    <span className="text-[11px] font-bold text-brand-400">
                      Query isVerified(address)
                    </span>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={testAccount}
                        onChange={(e) => setTestAccount(e.target.value)}
                        placeholder="0x..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-dark-bg-3 border border-dark-border-default text-xs font-mono text-dark-text-primary focus:outline-none focus:border-brand-500"
                      />
                      <Button size="sm" variant="primary" onClick={handleTestKYC} className="text-xs font-mono">
                        Call isVerified
                      </Button>
                    </div>

                    {testResult && (
                      <div className="p-2 rounded bg-dark-bg-1 border border-dark-border-subtle text-[11px] text-emerald-400 font-bold">
                        Result: {testResult}
                      </div>
                    )}
                  </div>
                </div>
              ) : contract.name === 'ReputationRegistry' ? (
                <div className="p-4 rounded-xl bg-dark-bg-3 border border-dark-border-subtle space-y-4">
                  <div className="space-y-1">
                    <span className="font-bold text-dark-text-primary text-xs">
                      ReputationRegistry On-Chain State
                    </span>
                    <p className="text-[11px] text-dark-text-muted font-sans">
                      Tracks non-decorative track records with authoritative score progression (+8 on repayment, -20 on default).
                    </p>
                  </div>

                  {/* Interactive Query Tester */}
                  <div className="p-3.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-2.5">
                    <span className="text-[11px] font-bold text-brand-400">
                      Query getScore(address)
                    </span>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={testAccount}
                        onChange={(e) => setTestAccount(e.target.value)}
                        placeholder="0x..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-dark-bg-3 border border-dark-border-default text-xs font-mono text-dark-text-primary focus:outline-none focus:border-brand-500"
                      />
                      <Button size="sm" variant="primary" onClick={handleTestReputation} className="text-xs font-mono">
                        Call getScore
                      </Button>
                    </div>

                    {testResult && (
                      <div className="p-2 rounded bg-dark-bg-1 border border-dark-border-subtle text-[11px] text-brand-300 font-bold">
                        Result: {testResult}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-dark-bg-3 border border-dark-border-subtle space-y-3">
                  <span className="font-bold text-dark-text-primary text-xs">
                    Contract State Overview
                  </span>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-dark-text-muted">Bytecode Status:</span>
                      <span className="text-emerald-400 font-bold">ACTIVE &amp; EXECUTABLE</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-dark-text-muted">Balance:</span>
                      <span className="text-dark-text-primary font-bold">{balanceEth} ETH</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERFACE CAPABILITIES (READ VS WRITE) */}
          {activeTab === 'INTERFACE' && (
            <div className="space-y-4">
              {/* READ FUNCTIONS */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-dark-text-primary font-bold text-xs uppercase tracking-wider">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Read State Functions (View / Pure)</span>
                </div>

                <div className="border border-dark-border-subtle rounded-lg divide-y divide-dark-border-subtle bg-dark-bg-3">
                  {contract.name === 'LoanPool' ? (
                    <>
                      <div className="p-3 space-y-1">
                        <div className="text-brand-400 font-bold">getSummary() → (uint256[4], uint8, uint256[2], address, uint256[3])</div>
                        <div className="text-[10px] text-dark-text-muted">Returns target, contributed, repaid, spent, lifecycle status, APR, and maturity.</div>
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="text-brand-400 font-bold">getLenderInfo(address lender) → (uint256, uint256, bool)</div>
                        <div className="text-[10px] text-dark-text-muted">Returns lender capital contribution, pro-rata pool share in basis points, and default vote status.</div>
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="text-brand-400 font-bold">getApprovedMerchants() → address[]</div>
                        <div className="text-[10px] text-dark-text-muted">Returns whitelist array of approved suppliers authorized for disbursements.</div>
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="text-brand-400 font-bold">claimed(address lender) → uint256</div>
                        <div className="text-[10px] text-dark-text-muted">Returns cumulative ETH repayments already claimed by a given syndicate lender.</div>
                      </div>
                    </>
                  ) : contract.name === 'KYCRegistry' ? (
                    <div className="p-3 space-y-1">
                      <div className="text-brand-400 font-bold">isVerified(address account) → bool</div>
                      <div className="text-[10px] text-dark-text-muted">Returns true if target account holds a valid on-chain institutional identity attestation.</div>
                    </div>
                  ) : contract.name === 'ReputationRegistry' ? (
                    <div className="p-3 space-y-1">
                      <div className="text-brand-400 font-bold">getScore(address borrower) → (uint16 score, uint16 successes, uint16 defaults)</div>
                      <div className="text-[10px] text-dark-text-muted">Returns current 0-100 score, lifetime successful repayments count, and default count.</div>
                    </div>
                  ) : (
                    <div className="p-3 space-y-1">
                      <div className="text-brand-400 font-bold">getPools() → address[]</div>
                      <div className="text-[10px] text-dark-text-muted">Returns array of all instantiated LoanPool contract addresses.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* WRITE METHODS */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-dark-text-primary font-bold text-xs uppercase tracking-wider">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Write Transactions (State Mutations)</span>
                </div>

                <div className="border border-dark-border-subtle rounded-lg divide-y divide-dark-border-subtle bg-dark-bg-3">
                  {contract.name === 'LoanPool' ? (
                    <>
                      <div className="p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-bold">contribute() [payable]</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-dark-bg-1 text-dark-text-muted">LENDER</span>
                        </div>
                        <div className="text-[10px] text-dark-text-muted">Supplies capital into escrow during FUNDING window; mints contribution share.</div>
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-bold">spend(address merchant, uint256 amount, bytes32 category)</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-dark-bg-1 text-dark-text-muted">BORROWER</span>
                        </div>
                        <div className="text-[10px] text-dark-text-muted">Disburses funds from escrow directly to approved supplier for procurement.</div>
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-bold">repay() [payable]</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-dark-bg-1 text-dark-text-muted">BORROWER</span>
                        </div>
                        <div className="text-[10px] text-dark-text-muted">Services debt; unlocks pro-rata lender claims and records positive outcome.</div>
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-bold">voteDefault()</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-dark-bg-1 text-dark-text-muted">LENDER</span>
                        </div>
                        <div className="text-[10px] text-dark-text-muted">Casts contributed voting weight toward 66% supermajority default declaration.</div>
                      </div>
                    </>
                  ) : contract.name === 'KYCRegistry' ? (
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400 font-bold">setVerified(address account, bool isVerified, bytes32 ref)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-dark-bg-1 text-dark-text-muted">OPERATOR</span>
                      </div>
                      <div className="text-[10px] text-dark-text-muted">Authoritatively attests or revokes institutional KYC verification with deterministic hash.</div>
                    </div>
                  ) : (
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400 font-bold">createLoan(...) → address pool</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-dark-bg-1 text-dark-text-muted">BORROWER</span>
                      </div>
                      <div className="text-[10px] text-dark-text-muted">Deploys and initializes a new isolated LoanPool credit facility contract.</div>
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-dark-bg-1 border border-dark-border-subtle/50 text-[10px] text-dark-text-muted flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    State mutations require ECDSA signature verification by authorized caller accounts. Arbitrary execution through the console is prevented to protect protocol invariants.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMITTED EVENTS */}
          {activeTab === 'EVENTS' && (
            <div className="space-y-3">
              {contract.eventsEmitted.length === 0 ? (
                <div className="p-8 rounded-lg bg-dark-bg-3 border border-dark-border-subtle text-center text-dark-text-muted text-[11px]">
                  No events have been emitted by this contract instance yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {contract.eventsEmitted.map((evt, idx) => (
                    <div
                      key={evt.id || idx}
                      className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-2 hover:bg-dark-bg-2 transition-colors cursor-pointer group"
                      onClick={() => {
                        if (onSelectTx) {
                          onSelectTx(evt.transactionHash);
                          onClose();
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <EventBadge eventName={evt.eventName} size="sm" />
                          <span className="text-[10px] text-dark-text-muted">Block #{evt.blockNumber}</span>
                        </div>
                        <span className="text-[10px] text-dark-text-muted flex items-center gap-1 group-hover:text-brand-400 transition-colors">
                          Inspect Tx <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>

                      <div className="text-[11px] text-dark-text-secondary font-sans">
                        {evt.summary}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-dark-text-muted pt-1 border-t border-dark-border-subtle/50">
                        <span>Tx: {evt.transactionHash.slice(0, 14)}...</span>
                        <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
