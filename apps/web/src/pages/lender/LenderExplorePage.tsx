import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useLoans, useReputation } from '../../hooks/useCredify';
import {
  Button,
  Badge,
  StatusBadge,
  AddressBadge,
  ProgressBar,
  Skeleton,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/ui';
import type { LoanSummary } from '@credify/shared';
import {
  formatEther,
  formatEtherNum,
  formatApr,
  formatDuration,
  formatDate,
  timeAgo,
} from '../../lib/utils';
import {
  Coins,
  ArrowRight,
  ShieldCheck,
  Clock,
  Briefcase,
  AlertCircle,
  Filter,
  LayoutGrid,
  List,
  Store,
  Calendar,
  Layers,
} from 'lucide-react';

/* ─── score badge sub-component ─── */
function ReputationBadge({ address }: { address: string }) {
  const { data: rep, isLoading } = useReputation(address);
  if (isLoading) return <span className="inline-block w-16 h-4 bg-dark-bg-3 animate-pulse rounded" />;
  const score = rep?.score ?? 50;
  const colorClass = score >= 70
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : score >= 40
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${colorClass}`}>
      <ShieldCheck className="w-3 h-3" />
      Score {score}
    </span>
  );
}

/* ─── reputation detail row ─── */
function ReputationRow({ address }: { address: string }) {
  const { data: rep } = useReputation(address);
  const score = rep?.score ?? 50;
  const successes = rep?.successfulLoans ?? 0;
  const defaults = rep?.defaultedLoans ?? 0;
  const tier = score >= 70 ? 'Tier A · Prime' : score >= 40 ? 'Tier B · Standard' : 'Tier C · High Risk';
  const tierColor = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-rose-400';
  const latestOutcome = rep?.latestOutcome;

  return (
    <div className="space-y-1 pt-1">
      <div className="flex items-center justify-between text-[11px] text-dark-text-muted">
        <span className={`font-medium ${tierColor}`}>{tier}</span>
        <span className="font-mono">
          <span className="text-emerald-400 font-bold">{successes} repaid</span>
          {' · '}
          <span className="text-rose-400 font-bold">{defaults} defaulted</span>
          {' · '}
          <span className="text-dark-text-secondary">{score}/100</span>
        </span>
      </div>
      {latestOutcome && (
        <div className={`text-[10px] px-2 py-0.5 rounded font-mono flex items-center justify-between ${
          latestOutcome.outcome === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
        }`}>
          <span>Latest: {latestOutcome.outcome === 'SUCCESS' ? 'Repaid (+8 pts)' : 'Defaulted (−20 pts)'}</span>
          <span className="text-dark-text-muted">{timeAgo(latestOutcome.timestamp)}</span>
        </div>
      )}
    </div>
  );
}


export const LenderExplorePage: React.FC = () => {
  const { isVerified } = useIdentity();
  const { data: loans, isLoading } = useLoans();
  const [filter, setFilter] = useState<'FUNDING' | 'ACTIVE' | 'REPAID' | 'DEFAULTED' | 'ALL'>('FUNDING');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredLoans = useMemo(() => {
    if (!loans) return [];
    if (filter === 'ALL') return loans;
    return loans.filter((l) => l.status === filter);
  }, [loans, filter]);

  // Market metrics calculations
  const metrics = useMemo(() => {
    if (!loans) return { openCount: 0, openCapacity: 0, avgApr: 0 };
    const open = loans.filter((l) => l.status === 'FUNDING');
    const openCap = open.reduce((acc, l) => {
      const target = formatEtherNum(l.targetWei);
      const funded = formatEtherNum(l.contributedWei);
      return acc + Math.max(0, target - funded);
    }, 0);
    const avgRate = open.length > 0
      ? open.reduce((acc, l) => acc + l.aprBps, 0) / open.length
      : 0;
    return {
      openCount: open.length,
      openCapacity: openCap,
      avgApr: avgRate,
    };
  }, [loans]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64 bg-dark-bg-2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-20 bg-dark-bg-2 rounded-xl" />
          <Skeleton className="h-20 bg-dark-bg-2 rounded-xl" />
          <Skeleton className="h-20 bg-dark-bg-2 rounded-xl" />
        </div>
        <Skeleton className="h-96 bg-dark-bg-2 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark-text-primary">
            Find Credit Agreements
          </h1>
          <p className="text-xs text-dark-text-secondary mt-1">
            Discover verified borrower agreements, inspect spending policies, interest rates, and on-chain borrower reputation before deploying capital.
          </p>
        </div>

        {!isVerified && (
          <Link to="/app/verify">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-colors">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Verification Required to Deploy Capital
            </span>
          </Link>
        )}
      </div>

      {/* Market Discovery Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-dark-border-default bg-dark-bg-2 p-4">
          <span className="text-[11px] uppercase tracking-wider text-dark-text-muted font-medium">
            Open Funding Facilities
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-dark-text-primary">
              {metrics.openCount}
            </span>
            <span className="text-xs text-dark-text-secondary">active syndicates</span>
          </div>
        </div>

        <div className="rounded-xl border border-dark-border-default bg-dark-bg-2 p-4">
          <span className="text-[11px] uppercase tracking-wider text-dark-text-muted font-medium">
            Available Capital Capacity
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-brand-400">
              {metrics.openCapacity.toFixed(2)} ETH
            </span>
            <span className="text-xs text-dark-text-secondary">open to fund</span>
          </div>
        </div>

        <div className="rounded-xl border border-dark-border-default bg-dark-bg-2 p-4">
          <span className="text-[11px] uppercase tracking-wider text-dark-text-muted font-medium">
            Average Fixed APR
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {formatApr(metrics.avgApr)}
            </span>
            <span className="text-xs text-dark-text-secondary">syndicate average</span>
          </div>
        </div>
      </div>

      {/* Filters & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border-default pb-3">
        {/* Status Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto text-xs font-medium">
          {(['FUNDING', 'ACTIVE', 'REPAID', 'DEFAULTED', 'ALL'] as const).map((tab) => {
            const count = loans
              ? tab === 'ALL'
                ? loans.length
                : loans.filter((l) => l.status === tab).length
              : 0;

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filter === tab
                    ? 'bg-dark-bg-3 text-dark-text-primary font-semibold border border-dark-border-subtle'
                    : 'text-dark-text-secondary hover:bg-dark-bg-2 hover:text-dark-text-primary'
                }`}
              >
                <span>{tab === 'FUNDING' ? 'Open for Funding' : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  filter === tab ? 'bg-brand-500/20 text-brand-300' : 'bg-dark-bg-1 text-dark-text-muted'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-dark-bg-1 p-1 rounded-lg border border-dark-border-default self-start sm:self-auto">
          <button
            onClick={() => setViewMode('table')}
            title="Sophisticated Table View"
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              viewMode === 'table'
                ? 'bg-dark-bg-3 text-dark-text-primary shadow-xs'
                : 'text-dark-text-muted hover:text-dark-text-primary'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            title="Card Grid View"
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              viewMode === 'cards'
                ? 'bg-dark-bg-3 text-dark-text-primary shadow-xs'
                : 'text-dark-text-muted hover:text-dark-text-primary'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Directory Content */}
      {filteredLoans.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-dark-border-default rounded-2xl bg-dark-bg-2 space-y-3">
          <Coins className="w-10 h-10 text-dark-text-muted mx-auto" />
          <h3 className="text-sm font-semibold text-dark-text-primary">No Credit Agreements Found</h3>
          <p className="text-xs text-dark-text-secondary max-w-sm mx-auto">
            There are no credit agreements matching the selected filter state ({filter}).
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* ─── Sophisticated Financial Ledger Table ─── */
        <div className="rounded-2xl border border-dark-border-default bg-dark-bg-2 overflow-hidden shadow-dark-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Borrower & Reputation</TableHead>
                <TableHead>Agreement / Status</TableHead>
                <TableHead>Target Facility</TableHead>
                <TableHead>Subscription Progress</TableHead>
                <TableHead>Fixed APR</TableHead>
                <TableHead>Tenor</TableHead>
                <TableHead>Spend Policy</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.map((loan) => {
                const target = formatEtherNum(loan.targetWei);
                const funded = formatEtherNum(loan.contributedWei);
                const remaining = Math.max(0, target - funded);
                const pct = target > 0 ? Math.min(100, Math.round((funded / target) * 100)) : 0;

                return (
                  <TableRow key={loan.address}>
                    {/* Borrower & Reputation */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-dark-text-primary">
                            {loan.borrower.displayName}
                          </span>
                          {loan.borrower.verified && (
                            <span className="flex items-center gap-0.5 text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              KYC
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <AddressBadge address={loan.borrower.walletAddress} digits={4} />
                          <ReputationBadge address={loan.borrower.walletAddress} />
                        </div>
                      </div>
                    </TableCell>

                    {/* Agreement & Status */}
                    <TableCell>
                      <div className="space-y-1">
                        <StatusBadge status={loan.status} />
                        <div className="text-[10px] text-dark-text-muted font-mono">
                          Pool <AddressBadge address={loan.address} digits={4} />
                        </div>
                      </div>
                    </TableCell>

                    {/* Target Facility */}
                    <TableCell className="font-mono">
                      <div className="font-bold text-dark-text-primary text-xs">
                        {target.toFixed(2)} ETH
                      </div>
                      <div className="text-[10px] text-dark-text-muted">
                        {loan.status === 'FUNDING'
                          ? `${remaining.toFixed(2)} ETH remaining`
                          : 'Target reached'}
                      </div>
                    </TableCell>

                    {/* Subscription Progress */}
                    <TableCell>
                      <div className="w-32 space-y-1 font-mono text-xs">
                        <div className="flex justify-between text-[10px] text-dark-text-secondary">
                          <span>{funded.toFixed(2)} ETH</span>
                          <span className="font-bold text-dark-text-primary">{pct}%</span>
                        </div>
                        <ProgressBar
                          value={pct}
                          variant={pct >= 100 ? 'success' : 'brand'}
                          className="h-1.5"
                        />
                        <div className="text-[10px] text-dark-text-muted">
                          {loan.lenders.length} lenders
                        </div>
                      </div>
                    </TableCell>

                    {/* Fixed APR */}
                    <TableCell className="font-mono text-xs font-semibold text-emerald-400">
                      {formatApr(loan.aprBps)} fixed
                    </TableCell>

                    {/* Tenor */}
                    <TableCell className="text-xs text-dark-text-secondary">
                      <div>{formatDuration(loan.durationSeconds)}</div>
                      <div className="text-[10px] text-dark-text-muted font-mono">
                        Due {formatDate(loan.maturity)}
                      </div>
                    </TableCell>

                    {/* Spend Policy */}
                    <TableCell className="text-xs text-dark-text-secondary">
                      <div className="flex items-center gap-1">
                        <Store className="w-3 h-3 text-dark-text-muted" />
                        <span>{loan.merchants.length} suppliers</span>
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Link to={`/app/loans/${loan.address}`}>
                        <Button
                          size="xs"
                          variant={loan.status === 'FUNDING' ? 'primary' : 'outline'}
                          icon={<ArrowRight className="w-3 h-3" />}
                        >
                          {loan.status === 'FUNDING' ? 'Contribute' : 'Inspect'}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* ─── Sophisticated Card Grid View ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLoans.map((loan) => {
            const target = formatEtherNum(loan.targetWei);
            const funded = formatEtherNum(loan.contributedWei);
            const remaining = Math.max(0, target - funded);
            const percent = target > 0 ? Math.round((funded / target) * 100) : 0;

            return (
              <div
                key={loan.address}
                className="p-5 rounded-2xl border border-dark-border-default bg-dark-bg-2 hover:border-dark-border-subtle transition-all shadow-dark-md space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-dark-text-primary text-sm">
                          {loan.borrower.displayName}
                        </span>
                        {loan.borrower.verified && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            KYC Verified
                          </span>
                        )}
                        <ReputationBadge address={loan.borrower.walletAddress} />
                      </div>
                      <div className="text-[11px] text-dark-text-muted font-mono">
                        Pool <AddressBadge address={loan.address} digits={5} />
                      </div>
                    </div>
                    <StatusBadge status={loan.status} />
                  </div>

                  {/* Borrower Reputation Detail Row */}
                  <ReputationRow address={loan.borrower.walletAddress} />

                  {/* Progress Meter */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-dark-text-secondary font-medium">Syndicate Subscription</span>
                      <span className="font-mono text-dark-text-primary font-bold">
                        {funded.toFixed(2)} / {target.toFixed(2)} ETH ({percent}%)
                      </span>
                    </div>
                    <ProgressBar
                      value={percent}
                      variant={percent >= 100 ? 'success' : 'brand'}
                      className="h-2"
                    />
                    <div className="flex justify-between text-[11px] text-dark-text-muted font-mono">
                      <span>{loan.lenders.length} lenders participating</span>
                      <span>
                        {loan.status === 'FUNDING'
                          ? `${remaining.toFixed(2)} ETH capacity`
                          : 'Fully Subscribed'}
                      </span>
                    </div>
                  </div>

                  {/* Key Loan Terms */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-dark-bg-1 rounded-xl text-xs border border-dark-border-subtle">
                    <div>
                      <span className="text-dark-text-muted text-[11px]">Interest Rate:</span>
                      <div className="font-bold text-emerald-400 font-mono">{formatApr(loan.aprBps)} fixed</div>
                    </div>
                    <div>
                      <span className="text-dark-text-muted text-[11px]">Duration:</span>
                      <div className="font-bold text-dark-text-primary">{formatDuration(loan.durationSeconds)}</div>
                    </div>
                    <div>
                      <span className="text-dark-text-muted text-[11px]">Spend Policy:</span>
                      <div className="font-medium text-dark-text-secondary">{loan.merchants.length} approved suppliers</div>
                    </div>
                    <div>
                      <span className="text-dark-text-muted text-[11px]">Maturity:</span>
                      <div className="font-medium text-dark-text-secondary font-mono">{formatDate(loan.maturity)}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-dark-border-subtle flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-dark-text-muted">Available Allocation:</span>
                    <span className="font-mono font-bold text-dark-text-primary ml-1">
                      {remaining.toFixed(2)} ETH
                    </span>
                  </div>

                  <Link to={`/app/loans/${loan.address}`}>
                    <Button
                      variant={loan.status === 'FUNDING' ? 'primary' : 'outline'}
                      size="sm"
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {loan.status === 'FUNDING' ? 'Contribute Capital' : 'Inspect Ledger'}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
