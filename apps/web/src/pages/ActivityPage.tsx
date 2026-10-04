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
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-yellow-600" />
              <span>On-Chain Evidence &amp; Audit Log</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
              Deterministic, immutable audit trail of all contract state transitions emitted by the protocol.
              Every event provides a human-readable narrative along with expandable cryptographic verification proofs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              EVM Indexer Active
            </span>
            <span className="bg-white text-slate-800 px-2.5 py-1 rounded-full border border-slate-200 font-bold">
              {events.length} Events
            </span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-yellow-600" />
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
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                  selectedType === type
                    ? 'bg-[#ffe600] text-black shadow-sm border border-yellow-400'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{type}</span>
                <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedType === type ? 'bg-black text-[#ffe600]' : 'bg-slate-100 text-slate-700'
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
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-950">No events match filter</div>
          <p className="text-xs text-slate-500 font-medium">
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
