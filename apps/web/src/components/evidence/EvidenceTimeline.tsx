import React, { useState } from 'react';
import type { ActivityEvent } from '@credify/shared';
import { BlockchainEvidenceCard } from './BlockchainEvidenceCard';
import { Skeleton } from '../ui/Skeleton';
import { Layers, ShieldCheck, CheckCircle2, AlertTriangle, Filter, Terminal, Sparkles } from 'lucide-react';

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
      <div className="p-4 rounded-xl bg-dark-bg-2 border border-dark-border-default text-dark-text-primary space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Authoritative Lifecycle Reconstruction</span>
          </div>
          <span className="font-mono text-[11px] text-dark-text-muted">
            {events.length} Verified EVM Events Recorded
          </span>
        </div>

        {/* Milestone Steps Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className={`p-2.5 rounded-lg border transition-colors duration-normal ${
            hasCreated
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              : 'bg-dark-bg-3 border-dark-border-subtle text-dark-text-muted'
          }`}>
            <div className="font-bold flex items-center gap-1">
              {hasCreated ? '✓ 1. Initialized' : '1. Initialized'}
            </div>
            <div className="text-[10px] opacity-75">Pool Deployed</div>
          </div>

          <div className={`p-2.5 rounded-lg border transition-colors duration-normal ${
            hasActivated
              ? 'bg-brand-500/10 border-brand-500/30 text-brand-300'
              : hasFunded
              ? 'bg-brand-500/5 border-brand-500/20 text-brand-400'
              : 'bg-dark-bg-3 border-dark-border-subtle text-dark-text-muted'
          }`}>
            <div className="font-bold flex items-center gap-1">
              {hasActivated ? '✓ 2. Funded' : hasFunded ? '⋯ 2. Funding' : '2. Funding'}
            </div>
            <div className="text-[10px] opacity-75">{hasActivated ? 'Target Met' : 'Syndicate Active'}</div>
          </div>

          <div className={`p-2.5 rounded-lg border transition-colors duration-normal ${
            hasSpent
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
              : 'bg-dark-bg-3 border-dark-border-subtle text-dark-text-muted'
          }`}>
            <div className="font-bold flex items-center gap-1">
              {hasSpent ? '✓ 3. Disbursed' : '3. Drawdown'}
            </div>
            <div className="text-[10px] opacity-75">Supplier Paid</div>
          </div>

          <div className={`p-2.5 rounded-lg border transition-colors duration-normal ${
            hasRepaid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : hasDefaulted
              ? 'bg-crimson-500/10 border-crimson-500/30 text-crimson-300'
              : 'bg-dark-bg-3 border-dark-border-subtle text-dark-text-muted'
          }`}>
            <div className="font-bold flex items-center gap-1">
              {hasRepaid ? '✓ 4. Repaid' : hasDefaulted ? '✗ 4. Defaulted' : '4. Settlement'}
            </div>
            <div className="text-[10px] opacity-75">{hasRepaid ? 'Full Repayment' : hasDefaulted ? 'Consensus Default' : 'Pending Term'}</div>
          </div>

          <div className={`p-2.5 rounded-lg border transition-colors duration-normal ${
            hasReputation
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-dark-bg-3 border-dark-border-subtle text-dark-text-muted'
          }`}>
            <div className="font-bold flex items-center gap-1">
              {hasReputation ? '✓ 5. Provenance' : '5. Provenance'}
            </div>
            <div className="text-[10px] opacity-75">Reputation Updated</div>
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
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-fast cursor-pointer ${
              filter === cat.id
                ? 'bg-brand-500 text-white font-semibold shadow-xs'
                : 'bg-dark-bg-2 border border-dark-border-default text-dark-text-secondary hover:text-dark-text-primary hover:border-dark-border-strong'
            }`}
          >
            <span>{cat.label}</span>
            <span className={`ml-1.5 font-mono text-[11px] px-1.5 py-0.5 rounded-full ${
              filter === cat.id ? 'bg-brand-700 text-white' : 'bg-dark-bg-3 text-dark-text-muted'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Events Stream ─── */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-dark-border-default bg-dark-bg-2/40 space-y-2">
          <ShieldCheck className="w-8 h-8 text-dark-text-muted mx-auto" />
          <div className="text-xs font-semibold text-dark-text-primary">No events found in this category</div>
          <div className="text-[11px] text-dark-text-muted">
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
