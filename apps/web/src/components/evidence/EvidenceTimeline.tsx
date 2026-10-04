import React, { useState } from 'react';
import type { ActivityEvent } from '@credify/shared';
import { BlockchainEvidenceCard } from './BlockchainEvidenceCard';
import { Skeleton } from '../ui/Skeleton';
import { Layers, ShieldCheck } from 'lucide-react';

interface EvidenceTimelineProps {
  events: ActivityEvent[];
  isLoading?: boolean;
  poolAddress?: string;
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({
  events = [],
  isLoading = false,
  poolAddress,
}) => {
  const [filter, setFilter] = useState<string>('ALL');

  // Filter groups
  const filterCategories: { id: string; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Lifecycle Events', count: events.length },
    {
      id: 'FUNDING',
      label: 'Syndicate Funding',
      count: events.filter((e) => e.eventName === 'Funded' || e.eventName === 'LoanActivated' || e.eventName === 'LoanCreated').length,
    },
    {
      id: 'SPENDING',
      label: 'Supplier Spending',
      count: events.filter((e) => e.eventName === 'SpendExecuted').length,
    },
    {
      id: 'REPAYMENTS',
      label: 'Repayments & Claims',
      count: events.filter((e) => e.eventName === 'RepaymentReceived' || e.eventName === 'LoanRepaid' || e.eventName === 'RepaymentClaimed').length,
    },
    {
      id: 'GOVERNANCE',
      label: 'Governance & Default',
      count: events.filter((e) => e.eventName === 'DefaultVoteCast' || e.eventName === 'LoanDefaulted').length,
    },
    {
      id: 'REPUTATION',
      label: 'Reputation Proofs',
      count: events.filter((e) => e.eventName === 'ReputationUpdated').length,
    },
  ];

  const filteredEvents = events.filter((evt) => {
    if (filter === 'ALL') return true;
    if (filter === 'FUNDING') return evt.eventName === 'Funded' || evt.eventName === 'LoanActivated' || evt.eventName === 'LoanCreated';
    if (filter === 'SPENDING') return evt.eventName === 'SpendExecuted';
    if (filter === 'REPAYMENTS') return evt.eventName === 'RepaymentReceived' || evt.eventName === 'LoanRepaid' || evt.eventName === 'RepaymentClaimed';
    if (filter === 'GOVERNANCE') return evt.eventName === 'DefaultVoteCast' || evt.eventName === 'LoanDefaulted';
    if (filter === 'REPUTATION') return evt.eventName === 'ReputationUpdated';
    return true;
  });

  // Lifecycle detection
  const hasCreated = events.some((e) => e.eventName === 'LoanCreated' || e.eventName === 'LoanPoolCreated');
  const hasFunded = events.some((e) => e.eventName === 'Funded');
  const hasActivated = events.some((e) => e.eventName === 'LoanActivated');
  const hasSpent = events.some((e) => e.eventName === 'SpendExecuted');
  const hasRepaid = events.some((e) => e.eventName === 'LoanRepaid');
  const hasDefaulted = events.some((e) => e.eventName === 'LoanDefaulted');
  const hasReputation = events.some((e) => e.eventName === 'ReputationUpdated');

  return (
    <div className="space-y-5">
      {/* ─── Lifecycle Reconstruction Tracker ─── */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-950">
            <Layers className="w-4 h-4 text-yellow-700" />
            <span>Authoritative Lifecycle Reconstruction</span>
          </div>
          <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {events.length} Verified EVM Events Recorded
          </span>
        </div>

        {/* Milestone Steps Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          <div className={`p-3 rounded-xl border transition-colors duration-normal ${
            hasCreated
              ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-500 font-medium'
          }`}>
            <div className="font-bold flex items-center gap-1">
              {hasCreated ? '✓ 1. Initialized' : '1. Initialized'}
            </div>
            <div className="text-[10px] opacity-80">Pool Deployed</div>
          </div>

          <div className={`p-3 rounded-xl border transition-colors duration-normal ${
            hasActivated
              ? 'bg-yellow-100 border-yellow-300 text-yellow-950 font-bold'
              : hasFunded
              ? 'bg-yellow-50 border-yellow-200 text-yellow-900 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-500 font-medium'
          }`}>
            <div className="font-bold flex items-center gap-1">
              {hasActivated ? '✓ 2. Funded' : hasFunded ? '⋯ 2. Funding' : '2. Funding'}
            </div>
            <div className="text-[10px] opacity-80">{hasActivated ? 'Target Met' : 'Syndicate Active'}</div>
          </div>

          <div className={`p-3 rounded-xl border transition-colors duration-normal ${
            hasSpent
              ? 'bg-purple-50 border-purple-200 text-purple-950 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-500 font-medium'
          }`}>
            <div className="font-bold flex items-center gap-1">
              {hasSpent ? '✓ 3. Disbursed' : '3. Drawdown'}
            </div>
            <div className="text-[10px] opacity-80">Supplier Paid</div>
          </div>

          <div className={`p-3 rounded-xl border transition-colors duration-normal ${
            hasRepaid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold'
              : hasDefaulted
              ? 'bg-rose-50 border-rose-200 text-rose-950 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-500 font-medium'
          }`}>
            <div className="font-bold flex items-center gap-1">
              {hasRepaid ? '✓ 4. Repaid' : hasDefaulted ? '✗ 4. Defaulted' : '4. Settlement'}
            </div>
            <div className="text-[10px] opacity-80">{hasRepaid ? 'Full Repayment' : hasDefaulted ? 'Consensus Default' : 'Pending Term'}</div>
          </div>

          <div className={`p-3 rounded-xl border transition-colors duration-normal ${
            hasReputation
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-500 font-medium'
          }`}>
            <div className="font-bold flex items-center gap-1">
              {hasReputation ? '✓ 5. Provenance' : '5. Provenance'}
            </div>
            <div className="text-[10px] opacity-80">Reputation Updated</div>
          </div>
        </div>
      </div>

      {/* ─── Filter Tabs ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {filterCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter(cat.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-fast cursor-pointer ${
              filter === cat.id
                ? 'bg-[#ffe600] text-black border border-yellow-400 font-bold shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold'
            }`}
          >
            <span>{cat.label}</span>
            <span className={`ml-1.5 font-mono text-[11px] px-1.5 py-0.5 rounded-full ${
              filter === cat.id ? 'bg-black text-[#ffe600] font-bold' : 'bg-slate-100 text-slate-700 font-semibold'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Events Stream ─── */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-slate-300 bg-white space-y-2">
          <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-xs font-bold text-slate-950">No events found in this category</div>
          <div className="text-xs text-slate-500 font-medium">
            Switch back to "All Lifecycle Events" to inspect the full timeline.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt, idx) => (
            <BlockchainEvidenceCard
              key={evt.id}
              event={evt}
              isExpandedDefault={idx === filteredEvents.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
