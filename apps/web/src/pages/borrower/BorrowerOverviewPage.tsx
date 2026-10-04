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
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              Borrower Workspace
            </h1>
            {isVerified ? (
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED
              </span>
            ) : (
              <Link
                to="/app/verify"
                className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 hover:bg-amber-100 transition-colors"
              >
                <AlertCircle className="w-3 h-3" />
                KYC REQUIRED
              </Link>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Institutional overview: Agreement status, spending capacity, and repayment obligations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {borrowerLoans.length > 1 && (
            <div className="relative">
              <select
                value={primaryLoan?.address || ''}
                onChange={(e) => setSelectedPoolAddress(e.target.value)}
                className="bg-white border border-slate-300 text-xs font-mono text-slate-900 font-semibold rounded-lg px-3 py-2 pr-8 appearance-none hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer shadow-xs"
              >
                {borrowerLoans.map((loan, idx) => (
                  <option key={loan.address} value={loan.address}>
                    Facility #{idx + 1} ({loan.status}) — {formatEtherNum(loan.targetWei)} ETH
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <Link to="/app/borrower/agreements/new">
            <Button
              size="sm"
              variant="primary"
              icon={<PlusCircle className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              New Agreement
            </Button>
          </Link>
        </div>
      </div>

      {/* Visual Anchor: Primary Agreement Master Console */}
      {primaryLoan ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Agreement Hero Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-950 truncate">
                  Academic Equipment Credit Agreement
                </h2>
                <StatusBadge status={primaryLoan.status} />
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-mono flex-wrap">
                <span className="font-semibold text-slate-500">Contract:</span>
                <AddressBadge address={primaryLoan.address} digits={6} />
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-500">Maturity:</span>
                <span className="text-slate-900 font-bold">{formatDate(primaryLoan.maturity)}</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-500">Rate:</span>
                <span className="text-slate-900 font-bold">{formatApr(primaryLoan.aprBps)} fixed</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to={`/app/loans/${primaryLoan.address}`}>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs font-semibold bg-white border border-slate-200 text-slate-900 hover:bg-slate-50"
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
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                  : actionBanner.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900 font-medium'
                  : actionBanner.type === 'danger'
                  ? 'bg-rose-50 border-rose-200 text-rose-900 font-medium'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-950 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {actionBanner.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : actionBanner.type === 'warning' ? (
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                ) : actionBanner.type === 'danger' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-700 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-slate-950 mr-2">
                    {actionBanner.title}:
                  </span>
                  <span className="text-slate-800">{actionBanner.message}</span>
                </div>
              </div>

              {actionBanner.actionTo && (
                <Link to={actionBanner.actionTo} className="shrink-0">
                  <button
                    type="button"
                    className="font-bold underline hover:no-underline text-xs cursor-pointer text-slate-950"
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
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Agreement Lifecycle Status
              </div>
              <LifecycleRail currentStage={primaryLoan.status} />
            </div>

            {/* Funding State Progress Meter */}
            <div className="pt-2 border-t border-slate-200 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-950 text-sm">Syndicate Funding Progress</span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-yellow-100 border border-yellow-300 text-yellow-950 font-mono">
                    {primaryLoan.lenders.length} Lenders Subscribed
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-950 flex items-center gap-1.5">
                  <span className="bg-[#ffe600] px-2 py-0.5 rounded text-black font-bold border border-yellow-400">
                    {contributedWeiNum.toFixed(2)} ETH
                  </span>
                  <span className="text-slate-700 font-bold">of {targetWeiNum.toFixed(2)} ETH</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs">
                    {fundingPercent}%
                  </span>
                </div>
              </div>

              <ProgressBar
                value={fundingPercent}
                variant={primaryLoan.status === 'ACTIVE' || primaryLoan.status === 'REPAID' ? 'success' : 'brand'}
                className="h-2.5"
              />

              <div className="flex justify-between items-center text-xs text-slate-700 font-bold font-mono">
                <span>Duration: {Math.round(primaryLoan.durationSeconds / 86400)} days</span>
                <span className="font-bold text-slate-950">
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
          icon={<FileText className="w-8 h-8 text-slate-400" />}
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

      {/* Core Financial Engine: Spending Capacity & Debt Balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial Pillar 1: Drawdown Capital Capacity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between gap-6 hover:border-yellow-400 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">
                    Drawdown Capital Capacity
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Available capital for authorized purchases</p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                {primaryLoan?.merchants.length || 0} Suppliers
              </span>
            </div>

            {/* High-Contrast Financial Value */}
            <div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-slate-950 tracking-tight flex items-baseline gap-2">
                <NumberTicker value={remainingSpendCapacity} decimalPlaces={2} />
                <span className="text-2xl font-bold font-mono text-slate-900">ETH</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Available drawdown capacity for approved merchants
              </p>
            </div>

            {/* Spend Capacity Progress */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono font-semibold text-slate-600">
                <span>Disbursed: {totalSpentNum.toFixed(2)} ETH</span>
                <span>Max Cap: {maxSpendNum.toFixed(2)} ETH</span>
              </div>
              <ProgressBar value={spendPercent} variant="emerald" className="h-2" />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="font-medium text-slate-600">Controlled Drawdown:</span>
                <span className="font-bold text-slate-950">Verified Vendors Only</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-600">Authorized Merchants:</span>
                <span className="font-mono text-slate-950 font-bold">{primaryLoan?.merchants.length || 0} Verified</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link to="/app/borrower/spending">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center text-xs font-bold"
                disabled={!primaryLoan || primaryLoan.status !== 'ACTIVE' || remainingSpendCapacity <= 0}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Execute Controlled Spend
              </Button>
            </Link>
          </div>
        </div>

        {/* Financial Pillar 2: Total Debt Balance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between gap-6 hover:border-yellow-400 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-yellow-50 border border-yellow-300 flex items-center justify-center text-yellow-800 shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">
                    Total Debt Balance
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Outstanding principal and fixed interest</p>
                </div>
              </div>

              <span className="font-mono text-xs font-bold text-slate-900 bg-yellow-100 px-2 py-0.5 rounded-full border border-yellow-300">
                {formatApr(primaryLoan?.aprBps || 800)} APR
              </span>
            </div>

            {/* High-Contrast Financial Value */}
            <div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-slate-950 tracking-tight flex items-baseline gap-2">
                <NumberTicker value={remainingDebtNum} decimalPlaces={2} />
                <span className="text-2xl font-bold font-mono text-slate-900">ETH</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Outstanding balance (Principal + Fixed Interest)
              </p>
            </div>

            {/* Repayment Progress */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono font-semibold text-slate-600">
                <span>Repaid: {totalRepaidNum.toFixed(2)} ETH</span>
                <span>Total Repayable: {totalRepayableNum.toFixed(2)} ETH</span>
              </div>
              <ProgressBar value={repaymentPercent} variant="amber" className="h-2" />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="font-medium text-slate-600">Principal Borrowed:</span>
                <span className="font-mono text-slate-950 font-bold">{targetWeiNum.toFixed(2)} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-600">Maturity Deadline:</span>
                <span className="font-bold text-slate-950">
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
                className="w-full justify-center text-xs font-bold bg-white border border-slate-200 text-slate-900 hover:bg-slate-50"
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
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-950 tracking-tight">
                Recent Agreement Activity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Cryptographically indexed transactions for this facility
              </p>
            </div>
            <Link to="/app/activity">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-yellow-800 hover:text-black">
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
            <div className="py-10 text-center text-slate-500 text-xs font-mono font-medium">
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-yellow-600" />
                <h3 className="text-base font-bold text-slate-950 tracking-tight">
                  Reputation Standing
                </h3>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                (reputation?.score ?? 50) >= 70
                  ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
                  : (reputation?.score ?? 50) >= 40
                  ? 'text-amber-800 bg-amber-50 border-amber-300'
                  : 'text-rose-800 bg-rose-50 border-rose-300'
              }`}>
                {(reputation?.score ?? 50) >= 70 ? 'TIER A' : (reputation?.score ?? 50) >= 40 ? 'TIER B' : 'HIGH RISK'}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-3xl font-black text-slate-950">
                  <NumberTicker value={reputation?.score ?? 50} />
                </span>
                <span className="text-sm font-bold text-slate-800">/ 100</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Authoritative score updated on agreement settlement or default
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center font-mono">
                <span className="text-slate-600 font-semibold">Track Record:</span>
                <span className="text-slate-900 font-bold">
                  <span className="text-emerald-700 font-bold">{reputation?.successfulLoans ?? 0}</span> Repaid /{' '}
                  <span className="text-rose-700 font-bold">{reputation?.defaultedLoans ?? 0}</span> Default
                </span>
              </div>

              {reputation?.latestOutcome && (
                <div className={`p-2 rounded-lg font-mono text-[11px] font-bold flex items-center justify-between ${
                  reputation.latestOutcome.outcome === 'SUCCESS'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-300'
                }`}>
                  <span>Latest: {reputation.latestOutcome.outcome === 'SUCCESS' ? '+8 pts (Repaid)' : '−20 pts (Default)'}</span>
                  <AddressBadge address={reputation.latestOutcome.loanId} digits={4} />
                </div>
              )}
            </div>
          </div>

          <Link to="/app/borrower/reputation" className="pt-2">
            <Button variant="secondary" size="sm" className="w-full text-xs font-bold justify-between bg-white border border-slate-200 text-slate-900 hover:bg-slate-50">
              <span>View Score Provenance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
