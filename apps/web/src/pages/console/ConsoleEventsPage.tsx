import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { consoleApi, api } from '../../lib/api';
import type { ActivityEvent } from '@credify/shared';
import {
  TechnicalPanel,
  TechnicalValue,
  EventBadge,
  IndexerStatusIndicator,
  EventTraceModal,
  TransactionDetailModal,
  BlockDetailModal,
  ContractInspectorModal,
} from '../../components/console';
import { Button } from '../../components/ui/Button';
import { formatEther } from '../../lib/utils';
import {
  Layers,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Clock,
  CheckCircle2,
  Cpu,
  ArrowLeftRight,
  FileCode2,
  Activity,
  Zap,
} from 'lucide-react';

export const ConsoleEventsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected filters
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedEventForTrace, setSelectedEventForTrace] = useState<ActivityEvent | null>(null);
  const [selectedTx, setSelectedTx] = useState<string | null>(searchParams.get('tx'));
  const [selectedBlock, setSelectedBlock] = useState<string | null>(searchParams.get('block'));
  const [selectedContract, setSelectedContract] = useState<string | null>(searchParams.get('contract'));

  // Track newly arrived events for subtle motion
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const [newlyArrivedIds, setNewlyArrivedIds] = useState<Set<string>>(new Set());

  // Fetch live indexer state (poll every 3s)
  const {
    data: indexerState,
    isLoading: indexerLoading,
    isError: indexerError,
    refetch: refetchIndexer,
  } = useQuery({
    queryKey: ['console', 'indexer'],
    queryFn: () => consoleApi.getIndexerState(),
    refetchInterval: 3000,
  });

  // Reindex mutation for administrator control
  const reindexMutation = useMutation({
    mutationFn: () => consoleApi.triggerReindex(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['console', 'indexer'] });
      queryClient.invalidateQueries({ queryKey: ['console', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['console', 'transactions'] });
    },
  });

  // Fetch live event log stream (poll every 3s)
  const {
    data: events = [],
    isLoading: eventsLoading,
    refetch: refetchEvents,
    isRefetching,
  } = useQuery({
    queryKey: ['console', 'events'],
    queryFn: () => consoleApi.getEvents({ limit: 100 }),
    refetchInterval: 3000,
  });

  // Track event arrivals for transient visual highlight
  useEffect(() => {
    if (!events.length) return;

    if (seenEventIdsRef.current.size === 0) {
      events.forEach((e) => seenEventIdsRef.current.add(e.id));
      return;
    }

    // Identify newly discovered event IDs
    const freshIds = new Set<string>();
    for (const e of events) {
      if (!seenEventIdsRef.current.has(e.id)) {
        freshIds.add(e.id);
        seenEventIdsRef.current.add(e.id);
      }
    }

    if (freshIds.size > 0) {
      setNewlyArrivedIds((prev) => new Set([...prev, ...freshIds]));

      // Clear the "new" badge and motion highlight after 4 seconds
      const timer = setTimeout(() => {
        setNewlyArrivedIds((prev) => {
          const next = new Set(prev);
          freshIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [events]);

  // Distinct real event types currently in log history
  const uniqueEventTypes = useMemo(() => {
    return Array.from(new Set(events.map((e) => e.eventName))).sort();
  }, [events]);

  // Filtered events based on tab and search
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Event name filter
      if (selectedEventType !== 'ALL' && evt.eventName !== selectedEventType) {
        return false;
      }

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = evt.eventName.toLowerCase().includes(q);
        const matchesContract = (evt.contractName || '').toLowerCase().includes(q) || (evt.contractAddress || '').toLowerCase().includes(q);
        const matchesTx = evt.transactionHash.toLowerCase().includes(q);
        const matchesBlock = evt.blockNumber.includes(q);
        const matchesSummary = evt.summary.toLowerCase().includes(q);
        const matchesActor = (evt.actor || '').toLowerCase().includes(q) || (evt.actorName || '').toLowerCase().includes(q);

        // Search in parameters
        const matchesData = Object.values(evt.data || {}).some((v) =>
          String(v).toLowerCase().includes(q)
        );

        return matchesName || matchesContract || matchesTx || matchesBlock || matchesSummary || matchesActor || matchesData;
      }

      return true;
    });
  }, [events, selectedEventType, searchQuery]);

  const handleRefresh = () => {
    refetchIndexer();
    refetchEvents();
  };

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-yellow-950 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300 w-fit mb-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Decoded Contract Logs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-slate-950">
            Live EVM Event Stream &amp; Sync
          </h1>
          <p className="text-xs text-slate-700 font-sans font-medium mt-1">
            Deterministic EVM logs parsed and indexed from smart contracts with real-time synchronization telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-sans text-slate-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">Polling (3s)</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            loading={eventsLoading || isRefetching}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-sans bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold"
          >
            Refresh Stream
          </Button>
        </div>
      </div>

      {/* Indexer Status Indicator Panel */}
      <IndexerStatusIndicator
        indexerState={indexerState}
        isLoading={indexerLoading}
        isError={indexerError}
        onReindex={() => reindexMutation.mutate()}
        isReindexing={reindexMutation.isPending}
      />

      {/* Filter and Search Bar */}
      <div className="space-y-3 p-4 bg-white border border-slate-200 shadow-sm rounded-xl min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          {/* Quick Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tx, block, contract, actor, parameters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-950 placeholder:text-slate-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 font-medium"
            />
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-yellow-800 text-xs font-sans font-bold hover:underline self-end sm:self-auto"
            >
              Clear search filter
            </button>
          )}
        </div>

        {/* Real Contract Event Types Tabs */}
        {uniqueEventTypes.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-sans pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedEventType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-bold cursor-pointer ${
                selectedEventType === 'ALL'
                  ? 'bg-[#ffe600] text-black border border-yellow-400 shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:text-black hover:bg-slate-100'
              }`}
            >
              ALL EMISSIONS ({events.length})
            </button>

            {uniqueEventTypes.map((type) => {
              const count = events.filter((e) => e.eventName === type).length;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedEventType(type)}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-bold cursor-pointer ${
                    selectedEventType === type
                      ? 'bg-[#ffe600] text-black border border-yellow-400 shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:text-black hover:bg-slate-100'
                  }`}
                >
                  {type} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-Time Events Stream */}
      <TechnicalPanel
        title="Authoritative Contract Event Stream"
        subtitle="Chronological EVM emissions indexed from target chain contracts. Newly mined events highlight smoothly on arrival."
        badge={
          <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-950 font-bold">
            {filteredEvents.length} / {events.length} EVENTS
          </span>
        }
        isLoading={eventsLoading}
        isEmpty={filteredEvents.length === 0}
        emptyState={
          <div className="py-12 text-center text-xs font-sans text-slate-600 space-y-2">
            <Layers className="w-8 h-8 text-slate-400 mx-auto" />
            <div>No smart contract events match your current filter criteria.</div>
            {selectedEventType !== 'ALL' && (
              <button
                onClick={() => setSelectedEventType('ALL')}
                className="text-yellow-800 underline hover:text-black font-semibold text-xs"
              >
                Reset to all events
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-3.5 min-w-0">
          {filteredEvents.map((evt) => {
            const isNewlyArrived = newlyArrivedIds.has(evt.id);

            return (
              <div
                key={evt.id}
                className={`p-5 rounded-xl border transition-all duration-300 space-y-3.5 min-w-0 ${
                  isNewlyArrived
                    ? 'bg-yellow-50/70 border-yellow-400 shadow-md ring-2 ring-yellow-400/40'
                    : 'bg-white border-slate-200 hover:border-yellow-400 hover:shadow-md'
                }`}
              >
                {/* Event Card Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-mono text-xs min-w-0">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <EventBadge eventName={evt.eventName} />

                    {isNewlyArrived && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffe600] text-black border border-yellow-400 tracking-wider">
                        NEW
                      </span>
                    )}

                    {/* Block Height Link */}
                    <button
                      onClick={() => setSelectedBlock(evt.blockNumber)}
                      className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-black font-bold transition-colors"
                      title="Inspect Block Proof"
                    >
                      <Cpu className="w-3.5 h-3.5 text-slate-900" />
                      #{evt.blockNumber}
                    </button>

                    {/* Transaction Link */}
                    <button
                      onClick={() => setSelectedTx(evt.transactionHash)}
                      className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-black font-semibold transition-colors"
                      title="Inspect Transaction"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-slate-900" />
                      {evt.transactionHash.slice(0, 8)}...
                    </button>

                    {/* Contract Link */}
                    {(evt.contractAddress || evt.loanId) && (
                      <button
                        onClick={() => setSelectedContract(evt.contractAddress || evt.loanId)}
                        className="inline-flex items-center gap-1 text-xs text-blue-800 hover:text-blue-950 font-bold transition-colors"
                        title="Inspect Contract"
                      >
                        <FileCode2 className="w-3.5 h-3.5 text-blue-800" />
                        {evt.contractName || 'Contract'}
                      </button>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-slate-600 font-sans font-medium flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    <span className="hidden md:inline">
                      ({new Date(evt.timestamp).toISOString().split('T')[0]})
                    </span>
                  </div>
                </div>

                {/* Narrative Summary */}
                <div className="text-xs text-slate-950 font-sans font-medium leading-relaxed">
                  {evt.summary}
                </div>

                {/* Parameters & Trace Trigger Row */}
                <div className="pt-2.5 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
                  {/* Parameter Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs min-w-0">
                    {Object.entries(evt.data || {})
                      .slice(0, 4)
                      .map(([key, val]) => {
                        const isWeiAmount = /amount|total|weight|target/i.test(key) && !isNaN(Number(val)) && Number(val) > 1000000;
                        const isAddr = typeof val === 'string' && val.startsWith('0x') && val.length === 42;

                        return (
                          <span
                            key={key}
                            className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-900 inline-flex items-center gap-1"
                          >
                            <span className="text-slate-600 font-sans font-semibold text-[11px]">{key}:</span>
                            {isWeiAmount ? (
                              <span className="text-slate-950 font-bold">{formatEther(val, 2)} ETH</span>
                            ) : isAddr ? (
                              <span className="text-slate-950 font-bold">{val.slice(0, 6)}...{val.slice(-4)}</span>
                            ) : (
                              <span className="text-slate-950 font-bold">{String(val)}</span>
                            )}
                          </span>
                        );
                      })}
                  </div>

                  {/* Trace Lineage Action */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedEventForTrace(evt)}
                    className="text-xs font-sans shrink-0 self-end md:self-auto bg-white border-slate-300 text-slate-900 hover:bg-yellow-50 hover:border-yellow-400 font-semibold"
                    icon={<ArrowRight className="w-3.5 h-3.5 text-slate-900" />}
                  >
                    Trace Lineage
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </TechnicalPanel>

      {/* Event Trace Modal */}
      <EventTraceModal
        event={selectedEventForTrace}
        isOpen={Boolean(selectedEventForTrace)}
        onClose={() => setSelectedEventForTrace(null)}
        onSelectTx={(txHash) => setSelectedTx(txHash)}
        onSelectBlock={(blockNum) => setSelectedBlock(blockNum)}
        onSelectContract={(addr) => setSelectedContract(addr)}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        txHash={selectedTx}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        onSelectBlock={(blockNum) => setSelectedBlock(blockNum)}
      />

      {/* Block Detail Modal */}
      <BlockDetailModal
        blockNumberOrHash={selectedBlock}
        isOpen={Boolean(selectedBlock)}
        onClose={() => setSelectedBlock(null)}
        onSelectTx={(txHash) => setSelectedTx(txHash)}
      />

      {/* Contract Inspector Modal */}
      <ContractInspectorModal
        address={selectedContract}
        isOpen={Boolean(selectedContract)}
        onClose={() => setSelectedContract(null)}
        onSelectTx={(txHash) => setSelectedTx(txHash)}
      />
    </div>
  );
};
