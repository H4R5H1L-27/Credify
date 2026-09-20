import React from 'react';
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
  NumberTicker,
} from '../../components/ui';
import {
  formatEther,
  formatEtherNum,
  formatApr,
  formatDuration,
  formatDate,
  timeAgo,
} from '../../lib/utils';
import {
  Briefcase,
  Coins,
  Download,
  Vote,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const LenderPortfolioPage: React.FC = () => {
  const { identity, address, isVerified } = useIdentity();
  const { data: loans, isLoading } = useLoans();

  const lenderStats = React.useMemo(() => {
    if (!loans || !address) {
      return {
        totalSuppliedWei: 0n,
        totalClaimableWei: 0n,
        totalClaimedWei: 0n,
        positionsCount: 0,
        activePositions: [],
        governanceCount: 0,
      };
    }
    const lower = address.toLowerCase();
    let totalSuppliedWei = 0n;
    let totalClaimableWei = 0n;
    let totalClaimedWei = 0n;
    const positions: Array<{
      loan: any;
      contributedWei: bigint;
      shareBps: number;
      claimableWei: bigint;
      claimedWei: bigint;
      totalRepaidWei: bigint;
    }> = [];
    let governanceCount = 0;

    for (const loan of loans) {
      const lenderRecord = loan.lenders.find((l) => l.walletAddress.toLowerCase() === lower);
      if (lenderRecord && BigInt(lenderRecord.contributedWei) > 0n) {
        const cWei = BigInt(lenderRecord.contributedWei);
        totalSuppliedWei += cWei;

        const totalRepaid = BigInt(loan.totalRepaidWei || '0');
        const poolContributed = BigInt(loan.contributedWei || '1');
        const entitledTotal = poolContributed > 0n ? (totalRepaid * cWei) / poolContributed : 0n;
        const claimable = lenderRecord.claimableWei !== undefined ? BigInt(lenderRecord.claimableWei) : entitledTotal;
        const claimed = lenderRecord.claimedWei !== undefined ? BigInt(lenderRecord.claimedWei) : 0n;

        totalClaimableWei += claimable;
        totalClaimedWei += claimed;

        if (loan.status === 'ACTIVE' || loan.status === 'DEFAULTED') {
          governanceCount++;
        }

        positions.push({
          loan,
          contributedWei: cWei,
          shareBps: lenderRecord.shareBps,
          claimableWei: claimable,
          claimedWei: claimed,
          totalRepaidWei: totalRepaid,
        });
      }
    }

    return {
      totalSuppliedWei,
      totalClaimableWei,
      totalClaimedWei,
      positionsCount: positions.length,
      activePositions: positions,
      governanceCount,
    };
  }, [loans, address]);

  // Open syndicate opportunities
  const openOpportunities = React.useMemo(() => {
    if (!loans) return [];
    return loans.filter((l) => l.status === 'FUNDING');
  }, [loans]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const displayName = identity?.displayName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Institutional Lender');

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Lender Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-dark-text-primary">
              Capital Management — {displayName}
            </h1>
            {isVerified ? (
              <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED LENDER
              </span>
            ) : (
              <Link
                to="/app/verify"
                className="flex items-center gap-1 text-[11px] font-mono font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
              >
                <AlertCircle className="w-3 h-3" />
                VERIFICATION REQUIRED
              </Link>
            )}
          </div>
          <p className="text-xs text-dark-text-secondary mt-1">
            Authoritative ledger: deployed capital, pro-rata repayment entitlements, and governance consensus.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/app/lender/claims">
            <Button
              size="sm"
              variant="secondary"
              icon={<Download className="w-3.5 h-3.5" />}
              className="text-xs font-semibold"
            >
              Claims Ledger
            </Button>
          </Link>
          <Link to="/app/lender/explore">
            <Button
              size="sm"
              variant="primary"
              icon={<Coins className="w-3.5 h-3.5" />}
              className="text-xs font-semibold shadow-dark-xs"
            >
              Find Agreements
            </Button>
          </Link>
        </div>
      </div>

      {/* Capital Management Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Supplied Capital */}
        <div className="p-5 rounded-2xl border border-dark-border-subtle/80 bg-dark-bg-2 space-y-2 shadow-depth-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-medium text-dark-text-secondary">
              Supplied Capital
            </span>
            <Layers className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-dark-text-primary">
            <NumberTicker value={formatEtherNum(lenderStats.totalSuppliedWei)} decimalPlaces={2} /> <span className="text-sm font-normal text-dark-text-muted">ETH</span>
          </div>
          <p className="text-xs font-sans text-dark-text-secondary">Across {lenderStats.positionsCount} active loan syndicates</p>
        </div>

        {/* 2. Active Positions */}
        <div className="p-5 rounded-2xl border border-dark-border-subtle/80 bg-dark-bg-2 space-y-2 shadow-depth-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-medium text-dark-text-secondary">
              Active Positions
            </span>
            <Briefcase className="w-4 h-4 text-dark-text-muted" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-dark-text-primary">
            <NumberTicker value={lenderStats.positionsCount} />
          </div>
          <Link to="/app/lender/positions" className="text-xs font-sans text-brand-400 hover:text-brand-300 transition-colors inline-flex items-center gap-1 font-medium">
            <span>View Positions Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3. Claimable Repayments */}
        <div className="p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 space-y-2 shadow-depth-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-medium text-emerald-400">
              Claimable Repayments
            </span>
            <Download className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
            <NumberTicker value={formatEtherNum(lenderStats.totalClaimableWei)} decimalPlaces={2} /> <span className="text-sm font-normal text-emerald-400/70">ETH</span>
          </div>
          <Link to="/app/lender/claims" className="text-xs font-sans text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1">
            <span>Claim Pro-Rata Entitlement</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4. Funding Opportunities */}
        <div className="p-5 rounded-2xl border border-dark-border-subtle/80 bg-dark-bg-2 space-y-2 shadow-depth-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-medium text-dark-text-secondary">
              Open Opportunities
            </span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-dark-text-primary">
            <NumberTicker value={openOpportunities.length} />
          </div>
          <Link to="/app/lender/explore" className="text-xs font-sans text-brand-400 hover:text-brand-300 transition-colors inline-flex items-center gap-1 font-medium">
            <span>Browse Open Pools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Visual Anchor: Master Capital Allocation Table */}
      <div className="rounded-2xl border border-dark-border-subtle/80 bg-dark-bg-2 overflow-hidden shadow-depth-card">
        <div className="p-6 border-b border-dark-border-subtle/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold font-sans text-dark-text-primary tracking-tight">
              Capital Allocation Ledger
            </h3>
            <p className="text-xs text-dark-text-secondary mt-0.5">
              Exact smart contract escrow locations, contribution shares, and current status for all capital deployed.
            </p>
          </div>

          <Link to="/app/lender/positions">
            <Button variant="ghost" size="sm" className="text-xs text-brand-400 hover:text-brand-300">
              Full Positions View →
            </Button>
          </Link>
        </div>

        {lenderStats.activePositions.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              icon={<Briefcase className="w-8 h-8 text-dark-text-muted" />}
              title="No Capital Deployed Yet"
              description="You have not participated in any credit syndicates. Review verified academic equipment agreements to deploy capital."
              action={
                <Link to="/app/lender/explore">
                  <Button variant="primary" icon={<Coins className="w-3.5 h-3.5" />}>
                    Find Opportunities to Fund
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agreement / Pool</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Capital Supplied</TableHead>
                <TableHead>Syndicate Share</TableHead>
                <TableHead>Pool Status</TableHead>
                <TableHead>Entitled / Claimable</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lenderStats.activePositions.map(({ loan, contributedWei, shareBps, claimableWei }) => {
                const claimableNum = formatEtherNum(claimableWei);
                const hasClaimable = claimableNum > 0;

                return (
                  <TableRow key={loan.address}>
                    <TableCell className="font-mono">
                      <div className="space-y-0.5">
                        <AddressBadge address={loan.address} digits={5} />
                        <div className="text-[10px] text-dark-text-muted">LoanPool.sol</div>
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
                      <div className="text-[10px] text-dark-text-muted">
                        of {formatEther(loan.targetWei)} pool
                      </div>
                    </TableCell>

                    <TableCell className="font-mono">
                      <span className="font-semibold text-brand-400">
                        {(shareBps / 100).toFixed(1)}%
                      </span>
                      <div className="text-[10px] text-dark-text-muted">
                        {formatApr(loan.aprBps)} fixed APR
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

      {/* Open Funding Opportunities Section */}
      <div className="rounded-2xl border border-dark-border-default bg-dark-bg-2 p-6 shadow-dark-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-dark-border-subtle">
          <div>
            <h3 className="text-base font-semibold text-dark-text-primary tracking-tight">
              Open Syndicate Funding Opportunities
            </h3>
            <p className="text-xs text-dark-text-secondary mt-0.5">
              Verified borrower credit agreements currently accepting institutional capital contributions.
            </p>
          </div>
          <Link to="/app/lender/explore">
            <Button variant="ghost" size="sm" className="text-xs text-brand-400 hover:text-brand-300">
              Explore All Agreements →
            </Button>
          </Link>
        </div>

        {openOpportunities.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-dark-text-muted">
            No agreements currently in syndicate funding. Check back soon.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Borrower</TableHead>
                <TableHead>Target Facility</TableHead>
                <TableHead>Subscribed %</TableHead>
                <TableHead>Fixed Interest</TableHead>
                <TableHead>Maturity Duration</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openOpportunities.slice(0, 4).map((loan) => {
                const target = formatEtherNum(loan.targetWei);
                const contributed = formatEtherNum(loan.contributedWei);
                const pct = target > 0 ? Math.min(100, Math.round((contributed / target) * 100)) : 0;

                return (
                  <TableRow key={loan.address}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-dark-text-primary">
                          {loan.borrower.displayName}
                        </div>
                        <AddressBadge address={loan.borrower.walletAddress} digits={4} />
                      </div>
                    </TableCell>

                    <TableCell className="font-mono">
                      <div className="font-bold text-dark-text-primary">
                        {target.toFixed(2)} ETH
                      </div>
                      <div className="text-[10px] text-dark-text-muted">
                        {(target - contributed).toFixed(2)} ETH remaining
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="w-32 space-y-1 font-mono text-xs">
                        <div className="flex justify-between text-[11px] text-dark-text-secondary">
                          <span>{contributed.toFixed(2)} ETH</span>
                          <span className="font-bold text-dark-text-primary">{pct}%</span>
                        </div>
                        <ProgressBar value={pct} variant="brand" className="h-1.5" />
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs font-semibold text-emerald-400">
                      {formatApr(loan.aprBps)} fixed
                    </TableCell>

                    <TableCell className="text-xs text-dark-text-secondary">
                      {formatDuration(loan.durationSeconds)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Link to={`/app/loans/${loan.address}`}>
                        <Button size="xs" variant="primary" icon={<Coins className="w-3 h-3" />}>
                          Contribute
                        </Button>
                      </Link>
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
