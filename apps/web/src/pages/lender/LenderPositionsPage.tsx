import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useLoans } from '../../hooks/useCredify';
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
  Tabs,
  NumberTicker,
} from '../../components/ui';
import {
  formatEther,
  formatEtherNum,
  formatDate,
  formatApr,
  timeAgo,
} from '../../lib/utils';
import {
  Briefcase,
  ArrowRight,
  Download,
  Coins,
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const LenderPositionsPage: React.FC = () => {
  const { address } = useIdentity();
  const { data: loans, isLoading } = useLoans();
  const [filter, setFilter] = useState<'ALL' | 'FUNDING' | 'ACTIVE' | 'REPAID' | 'DEFAULTED'>('ALL');

  const myPositions = React.useMemo(() => {
    if (!loans || !address) return [];
    const lower = address.toLowerCase();
    const result: Array<{
      loan: any;
      lenderRecord: any;
      contributedWei: bigint;
      claimableWei: bigint;
      claimedWei: bigint;
      entitledWei: bigint;
    }> = [];

    for (const loan of loans) {
      const rec = loan.lenders.find((l: any) => l.walletAddress.toLowerCase() === lower);
      if (rec && BigInt(rec.contributedWei) > 0n) {
        const cWei = BigInt(rec.contributedWei);
        const totalRepaid = BigInt(loan.totalRepaidWei || '0');
        const poolContributed = BigInt(loan.contributedWei || '1');
        const entitled = poolContributed > 0n ? (totalRepaid * cWei) / poolContributed : 0n;
        const claimable = rec.claimableWei !== undefined ? BigInt(rec.claimableWei) : entitled;
        const claimed = rec.claimedWei !== undefined ? BigInt(rec.claimedWei) : 0n;

        result.push({
          loan,
          lenderRecord: rec,
          contributedWei: cWei,
          claimableWei: claimable,
          claimedWei: claimed,
          entitledWei: entitled,
        });
      }
    }
    return result;
  }, [loans, address]);

  const filteredPositions = React.useMemo(() => {
    if (filter === 'ALL') return myPositions;
    return myPositions.filter((p) => p.loan.status === filter);
  }, [myPositions, filter]);

  const totalCapitalSupplied = myPositions.reduce((acc, p) => acc + p.contributedWei, 0n);
  const totalClaimableAll = myPositions.reduce((acc, p) => acc + p.claimableWei, 0n);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/app/lender/portfolio" className="inline-flex items-center gap-1.5 text-xs text-dark-text-muted hover:text-dark-text-primary transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portfolio</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-dark-text-primary">
            Syndicate Position Ledger
          </h1>
          <p className="text-xs text-dark-text-secondary mt-1">
            Authoritative on-chain record of your supplied capital, syndicate equity shares, and voting weight.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/app/lender/claims">
            <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} className="text-xs font-semibold">
              Claims Ledger
            </Button>
          </Link>
          <Link to="/app/lender/explore">
            <Button variant="primary" size="sm" icon={<Coins className="w-3.5 h-3.5" />} className="text-xs font-semibold shadow-dark-xs">
              Find New Pools
            </Button>
          </Link>
        </div>
      </div>

      {/* High-Level Accounting Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-dark-border-default bg-dark-bg-2 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-dark-text-muted">Total Capital Supplied</span>
          <div className="text-2xl font-bold font-mono text-dark-text-primary">
            <NumberTicker value={formatEtherNum(totalCapitalSupplied)} decimalPlaces={2} /> <span className="text-sm font-normal text-dark-text-muted">ETH</span>
          </div>
          <p className="text-[11px] text-dark-text-secondary">Across {myPositions.length} syndicated positions</p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Total Claimable Entitlement</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            <NumberTicker value={formatEtherNum(totalClaimableAll)} decimalPlaces={2} /> <span className="text-sm font-normal text-emerald-400/70">ETH</span>
          </div>
          <p className="text-[11px] text-dark-text-secondary">Repayments available to pull</p>
        </div>

        <div className="p-4 rounded-xl border border-dark-border-default bg-dark-bg-2 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-dark-text-muted">Active Syndicates</span>
          <div className="text-2xl font-bold font-mono text-dark-text-primary">
            <NumberTicker value={myPositions.filter((p) => p.loan.status === 'ACTIVE' || p.loan.status === 'FUNDING').length} />
          </div>
          <p className="text-[11px] text-dark-text-secondary">Open and performing loans</p>
        </div>
      </div>

      {/* Filter Tabs with Sliding Pill Glider */}
      <div>
        <Tabs
          variant="pill"
          tabs={[
            { id: 'ALL', label: 'ALL', count: myPositions.length },
            { id: 'FUNDING', label: 'FUNDING', count: myPositions.filter(p => p.loan.status === 'FUNDING').length },
            { id: 'ACTIVE', label: 'ACTIVE', count: myPositions.filter(p => p.loan.status === 'ACTIVE').length },
            { id: 'REPAID', label: 'REPAID', count: myPositions.filter(p => p.loan.status === 'REPAID').length },
            { id: 'DEFAULTED', label: 'DEFAULTED', count: myPositions.filter(p => p.loan.status === 'DEFAULTED').length },
          ]}
          activeTab={filter}
          onChange={(id) => setFilter(id as any)}
        />
      </div>

      {/* Positions Master Table */}
      <div className="rounded-2xl border border-dark-border-default bg-dark-bg-2 overflow-hidden shadow-dark-md">
        <div className="p-5 border-b border-dark-border-subtle">
          <h3 className="text-sm font-semibold text-dark-text-primary">
            Position Details ({filteredPositions.length})
          </h3>
          <p className="text-xs text-dark-text-muted mt-0.5">
            Smart contract accounts recording your capital contribution, voting power, and pro-rata returns.
          </p>
        </div>

        {filteredPositions.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              icon={<Briefcase className="w-8 h-8 text-dark-text-muted" />}
              title="No Positions Matching Filter"
              description="You do not currently hold any positions under this status filter."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agreement / Pool</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Contributed</TableHead>
                <TableHead>Syndicate Share</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Claimable</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPositions.map(({ loan, lenderRecord, contributedWei, claimableWei }) => {
                const claimableNum = formatEtherNum(claimableWei);
                const hasClaimable = claimableNum > 0;

                return (
                  <TableRow key={loan.address}>
                    <TableCell className="font-mono">
                      <div className="space-y-0.5">
                        <AddressBadge address={loan.address} digits={6} />
                        <div className="text-[10px] text-dark-text-muted">Target: {formatEther(loan.targetWei)} ETH</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium text-dark-text-primary text-xs">
                          {loan.borrower.displayName}
                        </div>
                        <AddressBadge address={loan.borrower.walletAddress} digits={4} />
                      </div>
                    </TableCell>

                    <TableCell className="font-mono">
                      <div className="font-bold text-dark-text-primary">
                        {formatEtherNum(contributedWei).toFixed(2)} ETH
                      </div>
                      <div className="text-[10px] text-dark-text-muted font-sans">
                        Voting Weight: {formatEtherNum(contributedWei).toFixed(2)}
                      </div>
                    </TableCell>

                    <TableCell className="font-mono">
                      <div className="font-bold text-brand-400">
                        {(lenderRecord.shareBps / 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-dark-text-muted">
                        {formatApr(loan.aprBps)} APR
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={loan.status} />
                    </TableCell>

                    <TableCell className="font-mono">
                      {hasClaimable ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-emerald-400">
                            {claimableNum.toFixed(2)} ETH
                          </span>
                          <div className="text-[10px] text-emerald-400/80 font-sans">Ready to pull</div>
                        </div>
                      ) : (
                        <span className="text-dark-text-muted text-xs">0.00 ETH</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-dark-text-secondary">
                      {formatDate(loan.maturity)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasClaimable && (
                          <Link to="/app/lender/claims">
                            <Button size="xs" variant="success" className="font-semibold">
                              Claim
                            </Button>
                          </Link>
                        )}
                        <Link to={`/app/loans/${loan.address}`}>
                          <Button size="xs" variant="secondary" icon={<ArrowRight className="w-3 h-3" />}>
                            Inspect
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
