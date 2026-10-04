import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useLoans, useReputation } from '../../hooks/useCredify';
import {
  Button,
  StatusBadge,
  AddressBadge,
  ProgressBar,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/ui';
import {
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
  AlertCircle,
  LayoutGrid,
  List,
  Store,
} from 'lucide-react';

/* ─── score badge sub-component ─── */
function ReputationBadge({ address }: { address: string }) {
  const { data: rep, isLoading } = useReputation(address);
  if (isLoading) return <span className="inline-block w-16 h-4 bg-slate-200 animate-pulse rounded" />;
  const score = rep?.score ?? 50;
  const colorClass = score >= 70
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : score >= 40
    ? 'bg-amber-100 text-amber-900 border-amber-300'
    : 'bg-rose-100 text-rose-900 border-rose-300';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${colorClass}`}>
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
  const tierColor = score >= 70 ? 'text-emerald-700' : score >= 40 ? 'text-amber-700' : 'text-rose-700';
  const latestOutcome = rep?.latestOutcome;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-[11px] text-slate-600">
        <span className={`font-bold ${tierColor}`}>{tier}</span>
        <span className="font-mono flex items-center gap-1.5">
          <span className="text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">{successes} repaid</span>
          <span className="text-rose-800 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[10px]">{defaults} defaulted</span>
          <span className="text-slate-900 font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">{score} / 100</span>
        </span>
      </div>
      {latestOutcome && (
        <div className={`text-[10px] px-2 py-1 rounded font-mono flex items-center justify-between ${
          latestOutcome.outcome === 'SUCCESS' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <span className="font-bold">Latest: {latestOutcome.outcome === 'SUCCESS' ? 'Repaid (+8 pts)' : 'Defaulted (−20 pts)'}</span>
          <span className="text-slate-600 font-medium">{timeAgo(latestOutcome.timestamp)}</span>
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
        <Skeleton className="h-8 w-64 bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-20 bg-slate-200 rounded-xl" />
          <Skeleton className="h-20 bg-slate-200 rounded-xl" />
          <Skeleton className="h-20 bg-slate-200 rounded-xl" />
        </div>
        <Skeleton className="h-96 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Find Credit Agreements
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Discover verified borrower agreements, inspect spending policies, interest rates, and on-chain borrower reputation before deploying capital.
          </p>
        </div>

        {!isVerified && (
          <Link to="/app/verify">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold hover:bg-amber-200 transition-colors">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
              Verification Required to Deploy Capital
            </span>
          </Link>
        )}
      </div>

      {/* Market Discovery Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
            Open Funding Facilities
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-950">
              {metrics.openCount}
            </span>
            <span className="text-xs text-slate-600 font-medium">active syndicates</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
            Available Capital Capacity
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-950">
              {metrics.openCapacity.toFixed(2)} ETH
            </span>
            <span className="text-xs text-slate-600 font-medium">open to fund</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
            Average Fixed APR
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-800">
              {formatApr(metrics.avgApr)}
            </span>
            <span className="text-xs text-slate-600 font-medium">syndicate average</span>
          </div>
        </div>
      </div>

      {/* Filters & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto text-xs font-medium">
          {(['FUNDING', 'ACTIVE', 'REPAID', 'DEFAULTED', 'ALL'] as const).map((tab) => {
            const count = loans
              ? tab === 'ALL'
                ? loans.length
                : loans.filter((l) => l.status === tab).length
              : 0;

            const isSelected = filter === tab;

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#ffe600] text-black font-bold border border-yellow-400 shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 border border-slate-200 font-medium'
                }`}
              >
                <span>{tab === 'FUNDING' ? 'Open for Funding' : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-black text-[#ffe600]' : 'bg-slate-100 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setViewMode('table')}
            title="Sophisticated Table View"
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              viewMode === 'table'
                ? 'bg-[#ffe600] text-black shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-950'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            title="Card Grid View"
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              viewMode === 'cards'
                ? 'bg-[#ffe600] text-black shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-950'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Directory Content */}
      {filteredLoans.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3 shadow-xs">
          <Coins className="w-10 h-10 text-yellow-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-950">No Credit Agreements Found</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
            There are no credit agreements matching the selected filter state ({filter}).
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* ─── Sophisticated Financial Ledger Table ─── */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
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
                          <span className="font-bold text-xs text-slate-950">
                            {loan.borrower.displayName}
                          </span>
                          {loan.borrower.verified && (
                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
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
                        <div className="text-[10px] text-slate-500 font-mono font-bold">
                          Pool <AddressBadge address={loan.address} digits={4} />
                        </div>
                      </div>
                    </TableCell>

                    {/* Target Facility */}
                    <TableCell className="font-mono">
                      <div className="font-bold text-slate-950 text-xs">
                        {target.toFixed(2)} ETH
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium">
                        {loan.status === 'FUNDING'
                          ? `${remaining.toFixed(2)} ETH remaining`
                          : 'Target reached'}
                      </div>
                    </TableCell>

                    {/* Subscription Progress */}
                    <TableCell>
                      <div className="w-32 space-y-1 font-mono text-xs">
                        <div className="flex justify-between text-[10px] text-slate-700 font-bold">
                          <span>{funded.toFixed(2)} ETH</span>
                          <span className="font-bold text-slate-950">{pct}%</span>
                        </div>
                        <ProgressBar
                          value={pct}
                          variant={pct >= 100 ? 'success' : 'primary'}
                          className="h-2"
                        />
                        <div className="text-[10px] text-slate-500 font-medium">
                          {loan.lenders.length} lenders
                        </div>
                      </div>
                    </TableCell>

                    {/* Fixed APR */}
                    <TableCell className="font-mono text-xs font-bold text-emerald-800">
                      {formatApr(loan.aprBps)} fixed
                    </TableCell>

                    {/* Tenor */}
                    <TableCell className="text-xs text-slate-800 font-bold">
                      <div>{formatDuration(loan.durationSeconds)}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium">
                        Due {formatDate(loan.maturity)}
                      </div>
                    </TableCell>

                    {/* Spend Policy */}
                    <TableCell className="text-xs text-slate-700 font-medium">
                      <div className="flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-slate-500" />
                        <span>{loan.merchants.length} suppliers</span>
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Link to={`/app/loans/${loan.address}`}>
                        <Button
                          size="xs"
                          variant={loan.status === 'FUNDING' ? 'primary' : 'secondary'}
                          icon={<ArrowRight className="w-3 h-3" />}
                          className="font-bold"
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
                className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-yellow-400 hover:shadow-md transition-all shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-950 text-sm">
                          {loan.borrower.displayName}
                        </span>
                        {loan.borrower.verified && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                            <ShieldCheck className="w-3 h-3" />
                            KYC Verified
                          </span>
                        )}
                        <ReputationBadge address={loan.borrower.walletAddress} />
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono font-medium">
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
                      <span className="text-slate-700 font-bold">Syndicate Subscription</span>
                      <span className="font-mono text-slate-950 font-bold">
                        {funded.toFixed(2)} / {target.toFixed(2)} ETH ({percent}%)
                      </span>
                    </div>
                    <ProgressBar
                      value={percent}
                      variant={percent >= 100 ? 'success' : 'primary'}
                      className="h-2.5"
                    />
                    <div className="flex justify-between text-[11px] text-slate-600 font-mono font-medium">
                      <span>{loan.lenders.length} lenders participating</span>
                      <span className="font-bold text-slate-900">
                        {loan.status === 'FUNDING'
                          ? `${remaining.toFixed(2)} ETH capacity`
                          : 'Fully Subscribed'}
                      </span>
                    </div>
                  </div>

                  {/* Key Loan Terms */}
                  <div className="grid grid-cols-2 gap-2 p-3.5 bg-slate-50 rounded-xl text-xs border border-slate-200">
                    <div>
                      <span className="text-slate-600 text-[11px] font-medium">Interest Rate:</span>
                      <div className="font-bold text-emerald-800 font-mono">{formatApr(loan.aprBps)} fixed</div>
                    </div>
                    <div>
                      <span className="text-slate-600 text-[11px] font-medium">Duration:</span>
                      <div className="font-bold text-slate-950">{formatDuration(loan.durationSeconds)}</div>
                    </div>
                    <div>
                      <span className="text-slate-600 text-[11px] font-medium">Spend Policy:</span>
                      <div className="font-bold text-slate-900">{loan.merchants.length} approved suppliers</div>
                    </div>
                    <div>
                      <span className="text-slate-600 text-[11px] font-medium">Maturity:</span>
                      <div className="font-bold text-slate-900 font-mono">{formatDate(loan.maturity)}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-600 font-medium">Available Allocation:</span>
                    <span className="font-mono font-bold text-slate-950 ml-1">
                      {remaining.toFixed(2)} ETH
                    </span>
                  </div>

                  <Link to={`/app/loans/${loan.address}`}>
                    <Button
                      variant={loan.status === 'FUNDING' ? 'primary' : 'secondary'}
                      size="sm"
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                      className="font-bold"
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
