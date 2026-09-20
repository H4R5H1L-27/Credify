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
} from '../../components/ui';
import {
  formatEther,
  formatEtherNum,
  formatApr,
  formatDuration,
  formatDate,
} from '../../lib/utils';
import {
  PlusCircle,
  Coins,
  ArrowRight,
  ShieldCheck,
  Clock,
  Filter,
} from 'lucide-react';

export const BorrowerAgreementsPage: React.FC = () => {
  const { address } = useIdentity();
  const { data: loans, isLoading } = useLoans();
  const [filter, setFilter] = useState<'ALL' | 'FUNDING' | 'ACTIVE' | 'REPAID'>('ALL');

  const borrowerLoans = React.useMemo(() => {
    if (!loans) return [];
    if (!address) return loans;
    const lower = address.toLowerCase();
    const list = loans.filter((l) => l.borrower.walletAddress.toLowerCase() === lower);
    return list.length > 0 ? list : loans;
  }, [loans, address]);

  const filteredLoans = borrowerLoans.filter((l) => {
    if (filter === 'ALL') return true;
    return l.status === filter;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-dark-text-primary">
            My Credit Agreements
          </h1>
          <p className="text-xs text-dark-text-secondary mt-1">
            Directory of all on-chain credit facilities deployed under your borrower identity.
          </p>
        </div>

        <Link to="/app/borrower/agreements/new">
          <Button
            variant="primary"
            icon={<PlusCircle className="w-3.5 h-3.5" />}
            className="text-xs font-semibold shadow-dark-xs"
          >
            Create New Agreement
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-dark-border-subtle pb-2 text-xs font-mono">
        {(['ALL', 'FUNDING', 'ACTIVE', 'REPAID'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === tab
                ? 'bg-brand-500/10 text-brand-400 font-semibold border border-brand-500/20'
                : 'text-dark-text-secondary hover:bg-dark-bg-2 hover:text-dark-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Agreements List */}
      {filteredLoans.length === 0 ? (
        <EmptyState
          icon={<Coins className="w-8 h-8 text-dark-text-muted" />}
          title="No Agreements Found"
          description="No agreements match the selected filter. Create an agreement to begin funding from syndicate lenders."
          action={
            <Link to="/app/borrower/agreements/new">
              <Button variant="primary" icon={<PlusCircle className="w-3.5 h-3.5" />}>
                Create Agreement
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => {
            const targetWeiNum = formatEtherNum(loan.targetWei);
            const contributedWeiNum = formatEtherNum(loan.contributedWei);
            const fundingPercent = targetWeiNum > 0 ? Math.min(100, Math.round((contributedWeiNum / targetWeiNum) * 100)) : 0;

            return (
              <div
                key={loan.address}
                className="p-5 rounded-2xl border border-dark-border-default bg-dark-bg-2 hover:border-dark-border-strong transition-all shadow-dark-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold text-dark-text-primary">
                        Academic Equipment Credit Facility
                      </h3>
                      <StatusBadge status={loan.status} />
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-dark-text-secondary font-mono flex-wrap">
                      <span className="text-dark-text-muted">Contract:</span>
                      <AddressBadge address={loan.address} digits={6} />
                      <span className="text-dark-border-strong">•</span>
                      <span className="text-dark-text-muted">Matures:</span>
                      <span className="text-dark-text-primary">{formatDate(loan.maturity)}</span>
                    </div>
                  </div>

                  <Link to={`/app/loans/${loan.address}`} className="shrink-0">
                    <Button variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />} className="text-xs">
                      View Provenance
                    </Button>
                  </Link>
                </div>

                {/* Progress & Metrics */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-dark-text-secondary">Syndicate Funding</span>
                    <span className="text-dark-text-primary font-bold">
                      {contributedWeiNum.toFixed(2)} / {targetWeiNum.toFixed(2)} ETH ({fundingPercent}%)
                    </span>
                  </div>
                  <ProgressBar
                    value={fundingPercent}
                    variant={loan.status === 'ACTIVE' || loan.status === 'REPAID' ? 'success' : 'brand'}
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-dark-border-subtle text-xs">
                  <div>
                    <span className="text-dark-text-muted text-[10px] font-mono uppercase block">Interest Rate</span>
                    <div className="font-mono font-semibold text-dark-text-primary">{formatApr(loan.aprBps)} fixed</div>
                  </div>
                  <div>
                    <span className="text-dark-text-muted text-[10px] font-mono uppercase block">Duration</span>
                    <div className="font-mono font-semibold text-dark-text-primary">{formatDuration(loan.durationSeconds)}</div>
                  </div>
                  <div>
                    <span className="text-dark-text-muted text-[10px] font-mono uppercase block">Spend Ceiling</span>
                    <div className="font-mono font-semibold text-emerald-400">{formatEther(loan.maxSpendWei)} ETH</div>
                  </div>
                  <div>
                    <span className="text-dark-text-muted text-[10px] font-mono uppercase block">Approved Suppliers</span>
                    <div className="font-mono font-semibold text-dark-text-primary">{loan.merchants.length} vendors</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
