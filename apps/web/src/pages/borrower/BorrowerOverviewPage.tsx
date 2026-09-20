import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useLoans, useLoanActivity, useReputation } from '../../hooks/useCredify';
import {
  Button,
  Badge,
  StatusBadge,
  AddressBadge,
  ProgressBar,
  LifecycleRail,
  ActivityItem,
  Skeleton,
  EmptyState,
  NumberTicker,
} from '../../components/ui';
import {
  formatEtherNum,
  formatApr,
  formatDate,
  timeAgo,
} from '../../lib/utils';
import {
  Send,
  TrendingUp,
  ShieldCheck,
  Coins,
  ArrowRight,
  AlertCircle,
  Clock,
  PlusCircle,
  Activity,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileText,
  ChevronDown,
} from 'lucide-react';

export const BorrowerOverviewPage: React.FC = () => {
  const { identity, address, isVerified } = useIdentity();
  const { data: loans, isLoading: loansLoading } = useLoans();
  const { data: reputation } = useReputation(address || '');

  // Filter agreements belonging to this borrower
  const borrowerLoans = React.useMemo(() => {
    if (!loans || !address) return [];
    const lower = address.toLowerCase();
    return loans.filter((l) => l.borrower.walletAddress.toLowerCase() === lower);
  }, [loans, address]);

  // Selected agreement state (default to active or funding, or first)
  const [selectedPoolAddress, setSelectedPoolAddress] = useState<string>('');

  const primaryLoan = React.useMemo(() => {
    if (borrowerLoans.length === 0) return null;
    if (selectedPoolAddress) {
      const found = borrowerLoans.find((l) => l.address.toLowerCase() === selectedPoolAddress.toLowerCase());
      if (found) return found;
    }
    // Default to ACTIVE, then FUNDING, then first available
    return (
      borrowerLoans.find((l) => l.status === 'ACTIVE') ||
      borrowerLoans.find((l) => l.status === 'FUNDING') ||
      borrowerLoans[0]
    );
  }, [borrowerLoans, selectedPoolAddress]);

  const { data: activity = [], isLoading: activityLoading } = useLoanActivity(primaryLoan?.address);

  if (loansLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  const displayName = identity?.displayName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Borrower');

  // Authoritative calculations from primary agreement
  const targetWeiNum = primaryLoan ? formatEtherNum(primaryLoan.targetWei) : 0;
  const contributedWeiNum = primaryLoan ? formatEtherNum(primaryLoan.contributedWei) : 0;
  const fundingPercent = targetWeiNum > 0 ? Math.min(100, Math.round((contributedWeiNum / targetWeiNum) * 100)) : 0;

  const maxSpendNum = primaryLoan ? formatEtherNum(primaryLoan.maxSpendWei) : 0;
  const totalSpentNum = primaryLoan ? formatEtherNum(primaryLoan.totalSpentWei) : 0;
  const remainingSpendCapacity = Math.max(0, maxSpendNum - totalSpentNum);
  const spendPercent = maxSpendNum > 0 ? Math.min(100, Math.round((totalSpentNum / maxSpendNum) * 100)) : 0;

  const totalRepayableNum = primaryLoan ? formatEtherNum(primaryLoan.totalRepayableWei) : 0;
  const totalRepaidNum = primaryLoan ? formatEtherNum(primaryLoan.totalRepaidWei) : 0;
  const remainingDebtNum = Math.max(0, totalRepayableNum - totalRepaidNum);
  const repaymentPercent = totalRepayableNum > 0 ? Math.min(100, Math.round((totalRepaidNum / totalRepayableNum) * 100)) : 0;

  // Determine action required banner state
  const getActionBanner = () => {
    if (!primaryLoan) return null;

    if (primaryLoan.status === 'FUNDING') {
      const remainingNeeded = Math.max(0, targetWeiNum - contributedWeiNum);
      return {
        type: 'info' as const,
        title: 'Syndicate Funding In Progress',
        message: `${remainingNeeded.toFixed(2)} ETH remaining to reach activation target. Facility will activate automatically upon final contribution.`,
        actionLabel: 'View Lenders',
        actionTo: `/app/loans/${primaryLoan.address}`,
      };
    }

    if (primaryLoan.status === 'ACTIVE') {
      if (remainingSpendCapacity > 0) {
        return {
          type: 'success' as const,
          title: 'Drawdown Capital Ready',
          message: `${remainingSpendCapacity.toFixed(2)} ETH available to spend across ${primaryLoan.merchants.length} authorized supplier(s).`,
          actionLabel: 'Disburse to Supplier',
          actionTo: '/app/borrower/spending',
        };
      }
      if (remainingDebtNum > 0) {
        return {
          type: 'warning' as const,
          title: 'Repayment Obligation Active',
          message: `${remainingDebtNum.toFixed(2)} ETH balance due before maturity (${formatDate(primaryLoan.maturity)}).`,
          actionLabel: 'Make Repayment',
          actionTo: '/app/borrower/repayments',
        };
      }
    }

    if (primaryLoan.status === 'REPAID') {
      return {
        type: 'success' as const,
        title: 'Facility Fully Settled',
        message: 'All obligations have been discharged. Your reputation score increased by +8 points.',
        actionLabel: 'View Provenance',
        actionTo: `/app/loans/${primaryLoan.address}`,
      };
    }

    if (primaryLoan.status === 'DEFAULTED') {
      return {
        type: 'danger' as const,
        title: 'Agreement Defaulted',
        message: 'Lender governance threshold was reached. Default penalty of −20 reputation points recorded.',
        actionLabel: 'View Governance Votes',
        actionTo: `/app/loans/${primaryLoan.address}`,
      };
    }

    return null;
  };

  const actionBanner = getActionBanner();

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Header & Borrower Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-dark-text-primary">
              Borrower Workspace
            </h1>
            {isVerified ? (
              <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED
              </span>
            ) : (
              <Link
                to="/app/verify"
                className="flex items-center gap-1 text-[11px] font-mono font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
              >
                <AlertCircle className="w-3 h-3" />
                KYC REQUIRED
              </Link>
            )}
          </div>
          <p className="text-xs text-dark-text-secondary mt-1">
            Institutional overview: Agreement status, spending capacity, and repayment obligations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {borrowerLoans.length > 1 && (
            <div className="relative">
              <select
                value={primaryLoan?.address || ''}
                onChange={(e) => setSelectedPoolAddress(e.target.value)}
                className="bg-dark-bg-2 border border-dark-border-default text-xs font-mono text-dark-text-primary rounded-lg px-3 py-2 pr-8 appearance-none hover:border-dark-border-strong focus:outline-hidden focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                {borrowerLoans.map((loan, idx) => (
                  <option key={loan.address} value={loan.address}>
                    Facility #{idx + 1} ({loan.status}) — {formatEtherNum(loan.targetWei)} ETH
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-dark-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <Link to="/app/borrower/agreements/new">
            <Button
              size="sm"
              variant="primary"
              icon={<PlusCircle className="w-3.5 h-3.5" />}
              className="text-xs font-semibold shadow-dark-xs"
            >
              New Agreement
            </Button>
          </Link>
        </div>
      </div>

      {/* Visual Anchor: Primary Agreement Master Console */}
      {primaryLoan ? (
        <div className="rounded-2xl border border-dark-border-subtle/80 bg-dark-bg-2 shadow-depth-card overflow-hidden">
          {/* Agreement Hero Header */}
          <div className="p-5 sm:p-6 border-b border-dark-border-subtle/60 bg-dark-bg-2/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-dark-text-primary truncate">
                  Academic Equipment Credit Agreement
                </h2>
                <StatusBadge status={primaryLoan.status} />
              </div>

              <div className="flex items-center gap-2.5 text-xs text-dark-text-secondary font-mono flex-wrap">
                <span className="text-dark-text-muted">Contract:</span>
                <AddressBadge address={primaryLoan.address} digits={6} />
                <span className="text-dark-border-strong">•</span>
                <span className="text-dark-text-muted">Maturity:</span>
                <span className="text-dark-text-primary font-medium">{formatDate(primaryLoan.maturity)}</span>
                <span className="text-dark-border-strong">•</span>
                <span className="text-dark-text-muted">Rate:</span>
                <span className="text-dark-text-primary font-medium">{formatApr(primaryLoan.aprBps)} fixed</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to={`/app/loans/${primaryLoan.address}`}>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs font-semibold"
                >
                  Agreement Provenance
                </Button>
              </Link>
            </div>
          </div>

          {/* Action Required Callout Banner */}
          {actionBanner && (
            <div
              className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                actionBanner.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : actionBanner.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  : actionBanner.type === 'danger'
                  ? 'bg-crimson-500/10 border-crimson-500/20 text-crimson-300'
                  : 'bg-brand-500/10 border-brand-500/20 text-brand-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {actionBanner.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : actionBanner.type === 'warning' ? (
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                ) : actionBanner.type === 'danger' ? (
                  <AlertTriangle className="w-4 h-4 text-crimson-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-brand-400 shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-dark-text-primary mr-2">
                    {actionBanner.title}:
                  </span>
                  <span>{actionBanner.message}</span>
                </div>
              </div>

              {actionBanner.actionTo && (
                <Link to={actionBanner.actionTo} className="shrink-0">
                  <button
                    type="button"
                    className="font-semibold underline hover:no-underline text-xs cursor-pointer"
                  >
                    {actionBanner.actionLabel} →
                  </button>
                </Link>
              )}
            </div>
          )}

          {/* Lifecycle & Funding Stage Visualizer */}
          <div className="p-5 sm:p-6 space-y-6">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-dark-text-muted mb-2">
                Agreement Lifecycle Status
              </div>
              <LifecycleRail currentStage={primaryLoan.status} />
            </div>

            {/* Funding State Progress Meter */}
            <div className="pt-2 border-t border-dark-border-subtle space-y-2.5">
              <div className="flex justify-between items-end text-xs">
                <div>
                  <span className="font-semibold text-dark-text-primary">Syndicate Funding Progress</span>
                  <span className="text-dark-text-muted text-[11px] ml-2 font-mono">
                    ({primaryLoan.lenders.length} lenders subscribed)
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-dark-text-primary">
                  <span className="text-brand-400">{contributedWeiNum.toFixed(2)} ETH</span>
                  <span className="text-dark-text-muted font-normal mx-1">/</span>
                  <span>{targetWeiNum.toFixed(2)} ETH</span>
                  <span className="text-dark-text-secondary ml-1.5 font-normal">({fundingPercent}%)</span>
                </div>
              </div>

              <ProgressBar
                value={fundingPercent}
                variant={primaryLoan.status === 'ACTIVE' || primaryLoan.status === 'REPAID' ? 'success' : 'brand'}
                className="h-2"
              />

              <div className="flex justify-between items-center text-[11px] text-dark-text-muted font-mono">
                <span>Duration: {Math.round(primaryLoan.durationSeconds / 86400)} days</span>
                <span>
                  {primaryLoan.status === 'FUNDING'
                    ? `${(targetWeiNum - contributedWeiNum).toFixed(2)} ETH remaining to activate`
                    : 'Target fulfilled · Contract active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-dark-text-muted" />}
          title="No Active Credit Facility Found"
          description="Deploy an academic loan pool agreement to syndicate financing from verified institutional lenders."
          action={
            <Link to="/app/borrower/agreements/new">
              <Button variant="primary" icon={<PlusCircle className="w-3.5 h-3.5" />}>
                Create Credit Agreement
              </Button>
            </Link>
          }
        />
      )}

      {/* Core Financial Engine: "What can I spend?" and "What do I owe?" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial Pillar 1: What can I spend? */}
        <div className="rounded-2xl border border-dark-border-subtle/80 bg-dark-bg-2 p-6 shadow-depth-card flex flex-col justify-between gap-6 hover:border-dark-border-strong transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border-subtle">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-dark-text-muted">
                    Drawdown Capital
                  </h3>
                  <h4 className="text-sm font-semibold text-dark-text-primary">
                    What can I spend?
                  </h4>
                </div>
              </div>

              <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">
                {primaryLoan?.merchants.length || 0} Suppliers
              </Badge>
            </div>

            {/* Large Readable Financial Value */}
            <div>
              <div className="text-3xl sm:text-4xl font-bold font-mono text-dark-text-primary tracking-tight">
                <NumberTicker value={remainingSpendCapacity} decimalPlaces={2} /> <span className="text-xl text-dark-text-muted font-normal">ETH</span>
              </div>
              <p className="text-xs text-dark-text-secondary mt-1">
                Available drawdown capacity for approved merchants
              </p>
            </div>

            {/* Spend Capacity Progress */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono text-dark-text-muted">
                <span>Disbursed: {totalSpentNum.toFixed(2)} ETH</span>
                <span>Max Cap: {maxSpendNum.toFixed(2)} ETH</span>
              </div>
              <ProgressBar value={spendPercent} variant="emerald" className="h-1.5" />
            </div>

            <div className="p-3 rounded-lg bg-dark-bg-1 border border-dark-border-subtle text-xs text-dark-text-secondary space-y-1">
              <div className="flex justify-between">
                <span>Controlled Drawdown:</span>
                <span className="font-semibold text-dark-text-primary">Verified Vendors Only</span>
              </div>
              <div className="flex justify-between">
                <span>Authorized Merchants:</span>
                <span className="font-mono text-dark-text-primary font-medium">{primaryLoan?.merchants.length || 0} Verified</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link to="/app/borrower/spending">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center text-xs font-semibold"
                disabled={!primaryLoan || primaryLoan.status !== 'ACTIVE' || remainingSpendCapacity <= 0}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Execute Controlled Spend
              </Button>
            </Link>
          </div>
        </div>

        {/* Financial Pillar 2: What do I owe? */}
        <div className="rounded-2xl border border-dark-border-subtle/80 bg-dark-bg-2 p-6 shadow-depth-card flex flex-col justify-between gap-6 hover:border-dark-border-strong transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border-subtle">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-dark-text-muted">
                    Total Debt Balance
                  </h3>
                  <h4 className="text-sm font-semibold text-dark-text-primary">
                    What do I owe?
                  </h4>
                </div>
              </div>

              <span className="font-mono text-xs text-dark-text-secondary bg-dark-bg-3 px-2 py-0.5 rounded border border-dark-border-subtle">
                {formatApr(primaryLoan?.aprBps || 800)} APR
              </span>
            </div>

            {/* Large Readable Financial Value */}
            <div>
              <div className="text-3xl sm:text-4xl font-bold font-mono text-dark-text-primary tracking-tight">
                <NumberTicker value={remainingDebtNum} decimalPlaces={2} /> <span className="text-xl text-dark-text-muted font-normal">ETH</span>
              </div>
              <p className="text-xs text-dark-text-secondary mt-1">
                Outstanding balance (Principal + Fixed Interest)
              </p>
            </div>

            {/* Repayment Progress */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono text-dark-text-muted">
                <span>Repaid: {totalRepaidNum.toFixed(2)} ETH</span>
                <span>Total Repayable: {totalRepayableNum.toFixed(2)} ETH</span>
              </div>
              <ProgressBar value={repaymentPercent} variant="amber" className="h-1.5" />
            </div>

            <div className="p-3 rounded-lg bg-dark-bg-1 border border-dark-border-subtle text-xs text-dark-text-secondary space-y-1">
              <div className="flex justify-between">
                <span>Principal Borrowed:</span>
                <span className="font-mono text-dark-text-primary font-medium">{targetWeiNum.toFixed(2)} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Maturity Deadline:</span>
                <span className="font-medium text-dark-text-primary">
                  {primaryLoan ? formatDate(primaryLoan.maturity) : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link to="/app/borrower/repayments">
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-center text-xs font-semibold"
                disabled={!primaryLoan || primaryLoan.status !== 'ACTIVE' || remainingDebtNum <= 0}
                icon={<TrendingUp className="w-3.5 h-3.5" />}
              >
                Record Debt Repayment
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activity & Reputation Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Agreement Activity (2/3 col) */}
        <div className="lg:col-span-2 rounded-2xl border border-dark-border-subtle/80 bg-dark-bg-2 p-6 shadow-depth-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-dark-border-subtle">
            <div>
              <h3 className="text-sm font-semibold text-dark-text-primary tracking-tight">
                Recent Agreement Activity
              </h3>
              <p className="text-xs text-dark-text-secondary mt-0.5">
                Cryptographically indexed transactions for this facility
              </p>
            </div>
            <Link to="/app/activity">
              <Button variant="ghost" size="sm" className="text-xs text-brand-400 hover:text-brand-300">
                View Full Audit Log →
              </Button>
            </Link>
          </div>

          {activityLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : activity.length === 0 ? (
            <div className="py-10 text-center text-dark-text-muted text-xs font-mono">
              No blockchain events recorded yet for this facility.
            </div>
          ) : (
            <div className="space-y-2.5">
              {activity.slice(0, 4).map((evt) => (
                <ActivityItem
                  key={evt.id}
                  type={evt.eventName}
                  actor={evt.actor || primaryLoan?.borrower.walletAddress || ''}
                  actorRole={evt.actorRole}
                  description={evt.summary}
                  timestamp={timeAgo(evt.timestamp)}
                  txHash={evt.transactionHash}
                  blockNumber={evt.blockNumber}
                  status={
                    evt.eventName === 'SpendExecuted'
                      ? 'info'
                      : evt.eventName === 'RepaymentReceived'
                      ? 'success'
                      : evt.eventName === 'DefaultDeclared'
                      ? 'error'
                      : 'info'
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Reputation & Standing (1/3 col) */}
        <div className="rounded-2xl border border-dark-border-subtle/80 bg-dark-bg-2 p-6 shadow-depth-card flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border-subtle">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-semibold text-dark-text-primary tracking-tight">
                  Reputation Standing
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                (reputation?.score ?? 50) >= 70
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : (reputation?.score ?? 50) >= 40
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  : 'text-crimson-400 bg-crimson-500/10 border-crimson-500/20'
              }`}>
                {(reputation?.score ?? 50) >= 70 ? 'TIER A' : (reputation?.score ?? 50) >= 40 ? 'TIER B' : 'HIGH RISK'}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-3xl font-bold text-dark-text-primary">
                  <NumberTicker value={reputation?.score ?? 50} />
                </span>
                <span className="text-xs text-dark-text-muted">/ 100</span>
              </div>
              <p className="text-[11px] text-dark-text-secondary mt-1">
                Authoritative score updated only on agreement settlement or default
              </p>
            </div>

            <div className="p-3 rounded-lg bg-dark-bg-1 border border-dark-border-subtle space-y-2 text-xs">
              <div className="flex justify-between items-center font-mono">
                <span className="text-dark-text-muted">Track Record:</span>
                <span className="text-dark-text-primary">
                  <span className="text-emerald-400 font-semibold">{reputation?.successfulLoans ?? 0}</span> Repaid /{' '}
                  <span className="text-crimson-400 font-semibold">{reputation?.defaultedLoans ?? 0}</span> Default
                </span>
              </div>

              {reputation?.latestOutcome && (
                <div className={`p-2 rounded font-mono text-[10px] flex items-center justify-between ${
                  reputation.latestOutcome.outcome === 'SUCCESS'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-crimson-500/10 text-crimson-300 border border-crimson-500/20'
                }`}>
                  <span>Latest: {reputation.latestOutcome.outcome === 'SUCCESS' ? '+8 pts (Repaid)' : '−20 pts (Default)'}</span>
                  <AddressBadge address={reputation.latestOutcome.loanId} digits={4} />
                </div>
              )}
            </div>
          </div>

          <Link to="/app/borrower/reputation" className="pt-2">
            <Button variant="secondary" size="sm" className="w-full text-xs font-medium justify-between">
              <span>View Score Provenance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
