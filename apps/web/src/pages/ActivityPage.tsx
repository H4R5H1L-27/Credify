import React, { useState } from 'react';
import { useEvaluatorEvents } from '../hooks/useCredify';
import { BlockchainEvidenceCard } from '../components/evidence/BlockchainEvidenceCard';
import { Skeleton } from '../components/ui/Skeleton';
import { ShieldCheck, Filter, Layers } from 'lucide-react';

export const ActivityPage: React.FC = () => {
  const { data: events = [], isLoading } = useEvaluatorEvents();
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const eventTypes = [
    'ALL',
    'LoanCreated',
    'Funded',
    'LoanActivated',
    'SpendExecuted',
    'RepaymentReceived',
    'LoanRepaid',
    'RepaymentClaimed',
    'DefaultVoteCast',
    'LoanDefaulted',
    'ReputationUpdated',
    'VerificationUpdated',
  ];

  const filteredEvents = events.filter((evt) => {
    if (selectedType === 'ALL') return true;
    return evt.eventName === selectedType;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-dark-border-subtle pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-text-primary tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-credify-400" />
              <span>On-Chain Evidence &amp; Audit Log</span>
            </h1>
            <p className="text-xs text-dark-text-secondary mt-1 max-w-2xl">
              Deterministic, immutable audit trail of all contract state transitions emitted by the protocol.
              Every event provides a human-readable narrative along with expandable cryptographic verification proofs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              EVM Indexer Active
            </span>
            <span className="bg-dark-bg-2 text-dark-text-secondary px-2.5 py-1 rounded-full border border-dark-border-subtle">
              {events.length} Events
            </span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-xs font-semibold text-dark-text-muted uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter by Event Type</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {eventTypes.map((type) => {
            const count = type === 'ALL' ? events.length : events.filter((e) => e.eventName === type).length;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedType === type
                    ? 'bg-credify-600 text-white font-semibold shadow-xs'
                    : 'bg-dark-bg-1 border border-dark-border-subtle text-dark-text-secondary hover:bg-dark-bg-2 hover:text-dark-text-primary'
                }`}
              >
                <span>{type}</span>
                <span className={`ml-1.5 font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedType === type ? 'bg-credify-700/70 text-white' : 'bg-dark-bg-2 text-dark-text-muted'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Evidence Cards Stream */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-dark-border-subtle rounded-xl bg-dark-bg-1 space-y-2">
          <ShieldCheck className="w-10 h-10 text-dark-text-muted mx-auto" />
          <div className="text-sm font-semibold text-dark-text-primary">No events match filter</div>
          <p className="text-xs text-dark-text-secondary">
            Select a different event filter above to view indexed transactions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt, idx) => (
            <BlockchainEvidenceCard
              key={evt.id}
              event={evt}
              isExpandedDefault={idx === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};
