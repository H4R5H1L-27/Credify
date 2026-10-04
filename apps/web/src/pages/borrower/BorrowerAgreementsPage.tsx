import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useLoans } from '../../hooks/useCredify';
import {
  Button,
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
        <Skeleton className="h-8 w-48 bg-slate-200" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl bg-slate-200" />
          <Skeleton className="h-32 w-full rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
            My Credit Agreements
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Directory of all on-chain credit facilities deployed under your borrower identity.
          </p>
        </div>

        <Link to="/app/borrower/agreements/new">
          <Button
            variant="primary"
            icon={<PlusCircle className="w-3.5 h-3.5" />}
            className="text-xs font-bold shadow-xs"
          >
            Create New Agreement
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-mono">
        {(['ALL', 'FUNDING', 'ACTIVE', 'REPAID'] as const).map((tab) => {
          const isSelected = filter === tab;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                isSelected
                  ? 'bg-[#ffe600] text-black border border-yellow-400 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 border border-slate-200'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Agreements List */}
      {filteredLoans.length === 0 ? (
        <EmptyState
          icon={<Coins className="w-8 h-8 text-yellow-600" />}
          title="No Agreements Found"
          description="No agreements match the selected filter. Create an agreement to begin funding from syndicate lenders."
          action={
            <Link to="/app/borrower/agreements/new">
              <Button variant="primary" icon={<PlusCircle className="w-3.5 h-3.5" />} className="font-bold">
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
                className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-yellow-400 hover:shadow-md transition-all shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold text-slate-950">
                        Academic Equipment Credit Facility
                      </h3>
                      <StatusBadge status={loan.status} />
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-700 font-mono flex-wrap font-medium">
                      <span className="text-slate-500">Contract:</span>
                      <AddressBadge address={loan.address} digits={6} />
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">Matures:</span>
                      <span className="text-slate-950 font-bold">{formatDate(loan.maturity)}</span>
                    </div>
                  </div>

                  <Link to={`/app/loans/${loan.address}`} className="shrink-0">
                    <Button variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />} className="text-xs font-bold">
                      View Provenance
                    </Button>
                  </Link>
                </div>

                {/* Progress & Metrics */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-slate-700">Syndicate Funding</span>
                    <span className="text-slate-950">
                      {contributedWeiNum.toFixed(2)} / {targetWeiNum.toFixed(2)} ETH ({fundingPercent}%)
                    </span>
                  </div>
                  <ProgressBar
                    value={fundingPercent}
                    variant={loan.status === 'ACTIVE' || loan.status === 'REPAID' ? 'success' : 'primary'}
                    className="h-2.5"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono font-bold uppercase block">Interest Rate</span>
                    <div className="font-mono font-bold text-emerald-800">{formatApr(loan.aprBps)} fixed</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono font-bold uppercase block">Duration</span>
                    <div className="font-mono font-bold text-slate-950">{formatDuration(loan.durationSeconds)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono font-bold uppercase block">Spend Ceiling</span>
                    <div className="font-mono font-bold text-emerald-800">{formatEther(loan.maxSpendWei)} ETH</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono font-bold uppercase block">Approved Suppliers</span>
                    <div className="font-mono font-bold text-slate-950">{loan.merchants.length} vendors</div>
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
