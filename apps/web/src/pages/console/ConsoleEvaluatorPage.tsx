import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useHealth, useEvaluatorContracts } from '../../hooks/useCredify';
import {
  TechnicalPanel,
  TechnicalValue,
  TechnicalStatus,
} from '../../components/console';
import { Button } from '../../components/ui/Button';
import { DEMO_ACCOUNTS } from '@credify/shared';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldCheck,
  Key,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Coins,
  FileText,
  Send,
  TrendingUp,
  Download,
  AlertTriangle,
  RefreshCw,
  Binary,
  Layers,
  Cpu,
  Lock,
  Eye,
  EyeOff,
  Wrench,
  Activity,
  Check,
} from 'lucide-react';

export const ConsoleEvaluatorPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: health, refetch: refetchHealth } = useHealth();
  const { data: evaluatorData } = useEvaluatorContracts();

  // Queries
  const { data: wallets = [], isLoading: walletsLoading, refetch: refetchWallets } = useQuery({
    queryKey: ['evaluatorWallets'],
    queryFn: () => api.getEvaluatorWallets(),
    refetchInterval: 5000,
  });

  const { data: agreements = [], refetch: refetchAgreements } = useQuery({
    queryKey: ['consoleAgreements'],
    queryFn: () => api.console.getAgreements(),
    refetchInterval: 5000,
  });

  // State
  const [warpDays, setWarpDays] = useState('15');
  const [isWarping, setIsWarping] = useState(false);
  const [warpFeedback, setWarpFeedback] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState(false);
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState<{
    message: string;
    completedPool?: string;
    activePool?: string;
    fundingPool?: string;
  } | null>(null);

  // Mutations
  const seedScenarioMutation = useMutation({
    mutationFn: () => api.seedScenario(),
    onSuccess: (res) => {
      setSeedFeedback({
        message: res.message,
        completedPool: res.agreements.completedPool,
        activePool: res.agreements.activePool,
        fundingPool: res.agreements.fundingPool,
      });
      queryClient.invalidateQueries();
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetDemoProjection(),
    onSuccess: () => {
      setShowResetConfirm(false);
      queryClient.invalidateQueries();
    },
  });

  const handleTimeWarp = async () => {
    const days = Number(warpDays);
    if (isNaN(days) || days <= 0) return;
    setIsWarping(true);
    setWarpFeedback(null);
    try {
      const res = await api.timeWarp(days * 86400);
      setWarpFeedback(`EVM clock advanced by ${days} days (${res.warpedSeconds}s). Node timestamp: ${res.currentTimestamp}`);
      await refetchHealth();
    } catch (err: any) {
      setWarpFeedback(`Failed to warp time: ${err.message}`);
    } finally {
      setIsWarping(false);
    }
  };

  const handleCopyKey = (key: string, index: number) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyIndex(index);
    setTimeout(() => setCopiedKeyIndex(null), 2000);
  };

  const sampleCompletedPool = agreements.find((a) => a.status === 'REPAID')?.poolAddress || evaluatorData?.contracts.sampleLoanPool;
  const sampleActivePool = agreements.find((a) => a.status === 'ACTIVE')?.poolAddress;
  const sampleFundingPool = agreements.find((a) => a.status === 'FUNDING')?.poolAddress;

  // 9-Stage Evaluator Workflow Guide Definition
  const WORKFLOW_STAGES = [
    {
      step: 1,
      title: 'Borrower Verification',
      contract: 'KYCRegistry.sol',
      method: 'setVerified(borrower, true, credentialHash)',
      actor: 'Operator / Verifier (0xf39F...)',
      role: 'DEMO_OPERATOR',
      description:
        'Borrower identity and institutional credentials are cryptographically attested on-chain. Unverified wallets cannot deploy or interact with credit agreements.',
      appLink: '/app/verify',
      appLabel: 'Launch Verification',
      evidenceLink: '/console/verification',
      evidenceLabel: 'Inspect Attestations',
      icon: ShieldCheck,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    },
    {
      step: 2,
      title: 'Agreement Parameterization',
      contract: 'LoanFactory.sol',
      method: 'createLoan(borrower, target, duration, aprBps, maxSpend, quorum, merchants)',
      actor: 'Borrower (0x7099...)',
      role: 'BORROWER',
      description:
        'Natural-language credit terms are parsed into deterministic parameters. The factory deploys a dedicated, isolated escrow contract (`LoanPool.sol`).',
      appLink: '/app/borrower/agreements/new',
      appLabel: 'Create Agreement',
      evidenceLink: '/console/events?eventName=AgreementCreated',
      evidenceLabel: 'View Creation Events',
      icon: FileText,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    },
    {
      step: 3,
      title: 'Multi-Lender Syndication',
      contract: 'LoanPool.sol',
      method: 'contribute() [payable]',
      actor: 'Meera Capital (0x3C44...) & Northstar Labs (0x90F7...)',
      role: 'LENDER',
      description:
        'Syndicate lenders deposit ETH directly into the smart contract escrow. Capital is held securely until the 100% funding threshold is reached.',
      appLink: '/app/lender/explore',
      appLabel: 'Explore & Fund Pools',
      evidenceLink: '/console/events?eventName=ContributionReceived',
      evidenceLabel: 'View Funding Events',
      icon: Coins,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      step: 4,
      title: 'Escrow Threshold Activation',
      contract: 'LoanPool.sol',
      method: 'Internal status transition: FUNDING → ACTIVE',
      actor: 'Smart Contract Consensus',
      role: 'CONTRACT',
      description:
        'When cumulative contributions reach 100% of the target amount, the contract automatically locks funding and activates the credit facility.',
      appLink: sampleActivePool ? `/app/agreements/${sampleActivePool}` : '/app/borrower/agreements',
      appLabel: 'Inspect Active Loan',
      evidenceLink: sampleActivePool ? `/console/contracts/${sampleActivePool}` : '/console/contracts',
      evidenceLabel: 'Inspect Escrow Contract',
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      step: 5,
      title: 'Policy-Restricted Supplier Spending',
      contract: 'LoanPool.sol',
      method: 'spend(merchant, amount, categoryHash)',
      actor: 'Borrower (0x7099...)',
      role: 'BORROWER',
      description:
        'Guarded disbursements: Borrower cannot withdraw liquid funds. Capital is disbursed directly to allowlisted vendor addresses for authorized categories.',
      appLink: '/app/borrower/spending',
      appLabel: 'Execute Supplier Spend',
      evidenceLink: '/console/events?eventName=SpendExecuted',
      evidenceLabel: 'Inspect Spend Proofs',
      icon: Send,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
    {
      step: 6,
      title: 'Pro-Rata Loan Repayment',
      contract: 'LoanPool.sol',
      method: 'repay() [payable]',
      actor: 'Borrower (0x7099...)',
      role: 'BORROWER',
      description:
        'Borrower deposits principal plus fixed-rate accrued interest. Contract transitions to `REPAID` and calculates pro-rata allocations for all syndicate lenders.',
      appLink: '/app/borrower/repayments',
      appLabel: 'Execute Repayment',
      evidenceLink: '/console/events?eventName=RepaymentReceived',
      evidenceLabel: 'Inspect Repayment Log',
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      step: 7,
      title: 'Pull-Based Lender Claims',
      contract: 'LoanPool.sol',
      method: 'claimRepayment()',
      actor: 'Lenders (0x3C44..., 0x90F7...)',
      role: 'LENDER',
      description:
        'Non-blocking pull payment architecture prevents gas denial-of-service. Each lender withdraws their exact share of principal and interest yield on demand.',
      appLink: '/app/lender/claims',
      appLabel: 'Claim Yield in App',
      evidenceLink: '/console/events?eventName=RepaymentClaimed',
      evidenceLabel: 'View Claim Events',
      icon: Download,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      step: 8,
      title: 'On-Chain Reputation Feedback',
      contract: 'ReputationRegistry.sol',
      method: 'recordRepayment(borrower) → score += 8',
      actor: 'ReputationRegistry Consensus',
      role: 'CONTRACT',
      description:
        'Verified repayment emits `ReputationUpdated`. Borrower credit score increments on-chain (50 → 58), permanently recording verifiable repayment history.',
      appLink: '/app/borrower/reputation',
      appLabel: 'View Borrower Score',
      evidenceLink: evaluatorData ? `/console/contracts/${evaluatorData.contracts.reputationRegistry}` : '/console/contracts',
      evidenceLabel: 'Inspect Registry',
      icon: ShieldCheck,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    },
    {
      step: 9,
      title: 'Action Trace & Execution Replay',
      contract: 'End-to-End Cryptographic Trace',
      method: 'UI Action → Wallet → Mempool → EVM Block → Event → Indexer → Read Model',
      actor: 'Full-Stack Observability',
      role: 'OBSERVABILITY',
      description:
        'Every business action is cryptographically proven. Evaluators can inspect the exact sequence of events, mined blocks, gas consumed, and CQRS projection updates.',
      appLink: '/console/trace',
      appLabel: 'Open Trace Engine',
      evidenceLink: '/console/replay',
      evidenceLabel: 'Open Replay Engine',
      icon: Binary,
      color: 'text-brand-400 bg-brand-500/10 border-brand-500/30',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Academic Orientation Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-bg-2 via-dark-bg-2 to-dark-bg-3 border border-dark-border-subtle/80 p-6 sm:p-8 shadow-depth-elevated">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-xs font-semibold text-brand-300">
              <GraduationCap className="w-4 h-4 text-brand-400" />
              <span>Academic Demonstration &amp; Evaluator Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-dark-text-primary">
              Credify Multi-Lender Credit Protocol
            </h1>
            <p className="text-sm text-dark-text-secondary leading-relaxed">
              This controlled evaluator environment demonstrates the complete Credify architecture without requiring technical blockchain setup.
              Every contract, transaction, and event log is real and executed on the local EVM node.
            </p>
          </div>

          {/* Quick Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-dark-bg-1/80 border border-dark-border-subtle/60">
              <div className="text-[11px] font-medium text-dark-text-muted">Node Status</div>
              <div className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Operational</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-dark-bg-1/80 border border-dark-border-subtle/60">
              <div className="text-[11px] font-medium text-dark-text-muted">Current Block</div>
              <div className="text-sm font-bold font-mono text-dark-text-primary mt-0.5">
                #{health?.blockNumber || '0'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-dark-bg-1/80 border border-dark-border-subtle/60">
              <div className="text-[11px] font-medium text-dark-text-muted">Active Agreements</div>
              <div className="text-sm font-bold font-mono text-brand-400 mt-0.5">
                {agreements.length} Pools
              </div>
            </div>

            <div className="p-3 rounded-xl bg-dark-bg-1/80 border border-dark-border-subtle/60">
              <div className="text-[11px] font-medium text-dark-text-muted">Test Wallets</div>
              <div className="text-sm font-bold font-mono text-dark-text-primary mt-0.5">
                7 Pre-Funded
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controlled Scenario Seeding Banner */}
      <TechnicalPanel
        title="Automated Scenario Seeder"
        subtitle="Seed complete, realistic multi-agreement scenarios across every lifecycle state using local Hardhat signers."
        badge={<TechnicalStatus status="ACTIVE" size="sm" />}
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-dark-bg-1 border border-dark-border-subtle">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-dark-text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Seed Standard Academic Scenarios</span>
              </div>
              <p className="text-xs text-dark-text-secondary">
                Deterministically deploys 3 realistic loan pools: (1) <strong>Completed Lifecycle</strong> (repaid, claimed, score 58), (2) <strong>Active with Spending</strong> (partial spend to merchant), and (3) <strong>Funding Stage</strong> (open for lender contribution).
              </p>
            </div>

            <Button
              size="sm"
              variant="primary"
              loading={seedScenarioMutation.isPending}
              onClick={() => seedScenarioMutation.mutate()}
              icon={<Sparkles className="w-3.5 h-3.5" />}
              className="shrink-0 text-xs font-semibold"
            >
              Seed Scenarios on EVM
            </Button>
          </div>

          {seedFeedback && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{seedFeedback.message}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                <div className="p-2 rounded bg-dark-bg-2/80 border border-dark-border-subtle">
                  <span className="text-dark-text-muted block text-[10px] font-sans">Completed &amp; Repaid:</span>
                  <Link to={`/console/contracts/${seedFeedback.completedPool}`} className="text-brand-300 hover:underline">
                    {seedFeedback.completedPool?.slice(0, 8)}...{seedFeedback.completedPool?.slice(-6)}
                  </Link>
                </div>
                <div className="p-2 rounded bg-dark-bg-2/80 border border-dark-border-subtle">
                  <span className="text-dark-text-muted block text-[10px] font-sans">Active with Spending:</span>
                  <Link to={`/console/contracts/${seedFeedback.activePool}`} className="text-brand-300 hover:underline">
                    {seedFeedback.activePool?.slice(0, 8)}...{seedFeedback.activePool?.slice(-6)}
                  </Link>
                </div>
                <div className="p-2 rounded bg-dark-bg-2/80 border border-dark-border-subtle">
                  <span className="text-dark-text-muted block text-[10px] font-sans">Open Funding Pool:</span>
                  <Link to={`/console/contracts/${seedFeedback.fundingPool}`} className="text-brand-300 hover:underline">
                    {seedFeedback.fundingPool?.slice(0, 8)}...{seedFeedback.fundingPool?.slice(-6)}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </TechnicalPanel>

      {/* 9-Stage End-to-End Credify Scenario Guide */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold font-sans text-dark-text-primary tracking-tight flex items-center gap-2">
              <span>9-Stage Protocol Lifecycle Guide</span>
            </h2>
            <p className="text-xs text-dark-text-secondary">
              Follow each milestone to test the live contracts or inspect the underlying cryptographic evidence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/console/architecture"
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
            >
              <span>View Interactive Architecture Topology</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WORKFLOW_STAGES.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.step}
                className="rounded-2xl bg-dark-bg-2 border border-dark-border-subtle/80 p-5 flex flex-col justify-between space-y-4 hover:border-dark-border-strong transition-colors shadow-depth-card"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-dark-bg-3 border border-dark-border-default flex items-center justify-center font-mono text-xs font-bold text-dark-text-primary">
                        {stage.step}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${stage.color}`}>
                        {stage.role}
                      </span>
                    </div>
                    <Icon className="w-4 h-4 text-dark-text-muted" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-dark-text-primary tracking-tight">
                      {stage.title}
                    </h3>
                    <div className="font-mono text-[11px] text-brand-400 truncate mt-0.5" title={stage.method}>
                      {stage.contract}
                    </div>
                  </div>

                  <p className="text-xs text-dark-text-secondary leading-relaxed">
                    {stage.description}
                  </p>

                  <div className="p-2 rounded-lg bg-dark-bg-1 border border-dark-border-subtle text-[11px] space-y-1">
                    <div className="text-[10px] font-semibold text-dark-text-muted uppercase">EVM Execution:</div>
                    <div className="font-mono text-[10px] text-dark-text-secondary truncate" title={stage.method}>
                      {stage.method}
                    </div>
                  </div>
                </div>

                {/* Direct Action Links */}
                <div className="pt-2 border-t border-dark-border-subtle/60 flex items-center justify-between gap-2">
                  <Link
                    to={stage.appLink}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <span>{stage.appLabel}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <Link
                    to={stage.evidenceLink}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-dark-text-muted hover:text-dark-text-primary transition-colors"
                  >
                    <span>{stage.evidenceLabel}</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controlled Evaluator Utilities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time-Warp Simulation */}
        <TechnicalPanel
          title="EVM Block Time Simulator"
          subtitle="Advance the local node clock (`evm_increaseTime`) to test maturity deadlines and default governance voting."
          badge={<span className="font-mono text-[10px] text-brand-400">HARDHAT RPC</span>}
        >
          <div className="space-y-4">
            <div className="space-y-2 font-mono text-xs">
              <label className="text-dark-text-secondary block">
                Advance Node Clock by (Days):
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={warpDays}
                  onChange={(e) => setWarpDays(e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-lg bg-dark-bg-3 border border-dark-border-default font-mono text-xs text-dark-text-primary focus:outline-none focus:border-brand-500"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleTimeWarp}
                  loading={isWarping}
                  icon={<Clock className="w-3.5 h-3.5" />}
                  className="text-xs font-mono"
                >
                  Advance Time
                </Button>
              </div>
            </div>

            {warpFeedback && (
              <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle font-mono text-[11px] text-emerald-400">
                {warpFeedback}
              </div>
            )}

            <div className="text-[11px] text-dark-text-muted font-sans leading-relaxed">
              Advancing time allows testing loan maturity expiration without waiting days. Once maturity expires on an active loan with outstanding debt, syndicate lenders can cast capital-weighted default votes.
            </div>
          </div>
        </TechnicalPanel>

        {/* State Reset & Reindex */}
        <TechnicalPanel
          title="Projection Reset &amp; Reindex"
          subtitle="Re-index events from Genesis (Block #0) through the current node head."
          badge={<TechnicalStatus status="ACTIVE" size="sm" />}
        >
          <div className="space-y-4 text-xs">
            <p className="text-[11px] text-dark-text-secondary leading-relaxed">
              Replays every event log from the Hardhat node to reconstruct loans, repayments, reputation, and KYC registries deterministically.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => api.reindex().then(() => queryClient.invalidateQueries())}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Re-Index Events
              </Button>

              <Button
                size="sm"
                variant="danger"
                onClick={() => setShowResetConfirm(true)}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Reset Projection Store
              </Button>
            </div>

            {showResetConfirm && (
              <div className="p-4 rounded-xl bg-crimson-500/10 border border-crimson-500/30 space-y-2">
                <div className="flex items-center gap-1.5 text-crimson-400 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Destructive Action Confirmation</span>
                </div>
                <p className="text-[11px] text-dark-text-secondary">
                  This will clear the backend CQRS projection database and re-scan blocks from #0. Deployed smart contracts on Hardhat will remain untouched.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="danger"
                    loading={resetMutation.isPending}
                    onClick={() => resetMutation.mutate()}
                    className="text-xs"
                  >
                    Confirm Wipe
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowResetConfirm(false)}
                    className="text-xs text-dark-text-muted"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TechnicalPanel>
      </div>

      {/* Deterministic Local Test Accounts & MetaMask Import Guide */}
      <TechnicalPanel
        title="Deterministic Test Accounts &amp; MetaMask Guide"
        subtitle="Pre-funded local test accounts derived from the deterministic academic mnemonic."
        badge={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowKeys(!showKeys)}
              className="text-xs text-dark-text-muted hover:text-dark-text-primary flex items-center gap-1 transition-colors cursor-pointer"
            >
              {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showKeys ? 'Hide Private Keys' : 'Reveal Test Keys'}</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Security Alert: Strictly confined to Technical Console */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Academic Localnet Only (Never Mainnet)</span>
              <span className="text-[11px] text-amber-200/90 leading-relaxed block">
                These deterministic test accounts are for local evaluator demonstration only. Private keys are never exposed in the normal product UI (`/app/*`). Use them to import accounts into MetaMask to test specific roles.
              </span>
            </div>
          </div>

          {/* Test Wallets Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="text-[11px] text-dark-text-muted uppercase border-b border-dark-border-subtle font-semibold">
                <tr>
                  <th className="pb-2.5 px-3">Role &amp; Name</th>
                  <th className="pb-2.5 px-3">On-Chain Address</th>
                  <th className="pb-2.5 px-3 text-right">Balance</th>
                  <th className="pb-2.5 px-3 text-center">KYC Status</th>
                  <th className="pb-2.5 px-3 text-right">{showKeys ? 'Test Private Key' : 'MetaMask Import'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border-subtle/50">
                {wallets.map((acc, idx) => {
                  const demoAcc = DEMO_ACCOUNTS.find((d) => d.id === acc.id);
                  return (
                    <tr key={acc.address} className="hover:bg-dark-bg-3/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-dark-text-primary">{acc.displayName}</div>
                        <div className="text-[10px] text-dark-text-muted flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-dark-bg-3 border border-dark-border-subtle text-brand-300 font-mono text-[9px] uppercase">
                            {acc.role}
                          </span>
                          <span>{acc.description}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <TechnicalValue value={acc.address} type="address" chars={6} />
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-dark-text-primary">
                        {acc.balanceEth} ETH
                      </td>

                      <td className="py-3 px-3 text-center">
                        {acc.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <Check className="w-3 h-3" />
                            VERIFIED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-dark-text-muted bg-dark-bg-1 px-2 py-0.5 rounded border border-dark-border-subtle">
                            UNVERIFIED
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {showKeys && demoAcc ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono text-[10px] text-dark-text-muted">
                              {demoAcc.privateKey.slice(0, 10)}...{demoAcc.privateKey.slice(-8)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyKey(demoAcc.privateKey, idx)}
                              className="h-7 text-xs font-mono"
                            >
                              {copiedKeyIndex === idx ? (
                                <span className="text-emerald-400">Copied</span>
                              ) : (
                                <span>Copy Key</span>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowKeys(true)}
                            className="text-[11px] text-brand-400 hover:text-brand-300 underline font-medium cursor-pointer"
                          >
                            Reveal Key
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Collapsible MetaMask Setup Guide */}
          <div className="p-4 rounded-xl bg-dark-bg-1 border border-dark-border-subtle space-y-2 text-xs">
            <div className="font-semibold text-dark-text-primary flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-400" />
              <span>How an Evaluator Connects MetaMask</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-dark-text-secondary text-[11px] leading-relaxed">
              <li>Add a custom network in MetaMask: RPC URL = <code className="font-mono text-dark-text-primary">http://127.0.0.1:8545</code>, Chain ID = <code className="font-mono text-dark-text-primary">31337</code>, Currency Symbol = <code className="font-mono text-dark-text-primary">ETH</code>.</li>
              <li>Click <strong>Reveal Test Keys</strong> above and copy the private key for the desired role (e.g. <strong>Aarav Menon</strong> for Borrower, <strong>Meera Capital</strong> for Lender).</li>
              <li>In MetaMask, select <strong>Add Account</strong> &rarr; <strong>Import Account</strong> and paste the private key.</li>
              <li>Navigate to <Link to="/app" className="text-brand-400 hover:underline">/app</Link> and test full user workflows with explicit wallet authorization.</li>
            </ol>
          </div>
        </div>
      </TechnicalPanel>
    </div>
  );
};
