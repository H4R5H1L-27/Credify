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

  // Fetch live events stream (poll every 3s)
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

  // Reindex mutation
  const reindexMutation = useMutation({
    mutationFn: () => api.reindex(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['console', 'indexer'] });
      queryClient.invalidateQueries({ queryKey: ['console', 'events'] });
    },
  });

  // Detect newly arrived events without animating the entire page
  useEffect(() => {
    if (!events || events.length === 0) return;

    // First load: register existing events so initial page load does not trigger new arrival animation
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-dark-text-primary uppercase flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-400" />
            Live EVM Event Stream &amp; Sync
          </h1>
          <p className="text-xs text-dark-text-secondary mt-0.5">
            Deterministic EVM logs parsed and indexed from smart contracts with real-time synchronization telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-dark-bg-2 border border-dark-border-subtle text-[11px] font-mono text-dark-text-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Polling (3s)</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            loading={eventsLoading || isRefetching}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
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
      <div className="space-y-3 p-3.5 bg-dark-bg-2 border border-dark-border-subtle rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-dark-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tx, block, contract, actor, parameters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-dark-bg-3 border border-dark-border-subtle rounded-md text-dark-text-primary placeholder:text-dark-text-muted focus:outline-none focus:border-brand-500/50"
            />
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-brand-400 text-xs font-mono hover:underline self-end sm:self-auto"
            >
              Clear search filter
            </button>
          )}
        </div>

        {/* Real Contract Event Types Tabs */}
        {uniqueEventTypes.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono pt-1 border-t border-dark-border-subtle/50">
            <button
              type="button"
              onClick={() => setSelectedEventType('ALL')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                selectedEventType === 'ALL'
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40 font-bold'
                  : 'bg-dark-bg-3 border border-dark-border-subtle text-dark-text-secondary hover:text-dark-text-primary'
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
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    selectedEventType === type
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40 font-bold'
                      : 'bg-dark-bg-3 border border-dark-border-subtle text-dark-text-secondary hover:text-dark-text-primary'
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
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-dark-bg-3 border border-dark-border-subtle text-dark-text-secondary">
            {filteredEvents.length} / {events.length} EVENTS
          </span>
        }
        isLoading={eventsLoading}
        isEmpty={filteredEvents.length === 0}
        emptyState={
          <div className="py-12 text-center text-xs font-mono text-dark-text-muted space-y-2">
            <Layers className="w-8 h-8 text-dark-text-muted mx-auto" />
            <div>No smart contract events match your current filter criteria.</div>
            {selectedEventType !== 'ALL' && (
              <button
                onClick={() => setSelectedEventType('ALL')}
                className="text-brand-400 underline hover:text-brand-300 text-[11px]"
              >
                Reset to all events
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-3">
          {filteredEvents.map((evt) => {
            const isNewlyArrived = newlyArrivedIds.has(evt.id);

            return (
              <div
                key={evt.id}
                className={`p-4 rounded-xl border transition-all duration-500 space-y-3 ${
                  isNewlyArrived
                    ? 'bg-brand-500/10 border-brand-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)] motion-safe:animate-pulse'
                    : 'bg-dark-bg-3 border-dark-border-subtle hover:border-dark-border-default'
                }`}
              >
                {/* Event Card Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-mono text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <EventBadge eventName={evt.eventName} />

                    {isNewlyArrived && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-500 text-white tracking-wider motion-safe:animate-bounce">
                        NEW
                      </span>
                    )}

                    {/* Block Height Link */}
                    <button
                      onClick={() => setSelectedBlock(evt.blockNumber)}
                      className="inline-flex items-center gap-1 text-[11px] text-dark-text-secondary hover:text-brand-400 transition-colors"
                      title="Inspect Block Proof"
                    >
                      <Cpu className="w-3 h-3 text-dark-text-muted" />
                      #{evt.blockNumber}
                    </button>

                    {/* Transaction Link */}
                    <button
                      onClick={() => setSelectedTx(evt.transactionHash)}
                      className="inline-flex items-center gap-1 text-[11px] text-dark-text-secondary hover:text-brand-400 transition-colors"
                      title="Inspect Transaction"
                    >
                      <ArrowLeftRight className="w-3 h-3 text-dark-text-muted" />
                      {evt.transactionHash.slice(0, 8)}...
                    </button>

                    {/* Contract Link */}
                    {(evt.contractAddress || evt.loanId) && (
                      <button
                        onClick={() => setSelectedContract(evt.contractAddress || evt.loanId)}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                        title="Inspect Contract"
                      >
                        <FileCode2 className="w-3 h-3 text-blue-400" />
                        {evt.contractName || 'Contract'}
                      </button>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-[11px] text-dark-text-muted flex items-center gap-1.5 self-start sm:self-auto">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    <span className="text-[10px] text-dark-text-muted hidden md:inline">
                      ({new Date(evt.timestamp).toISOString().split('T')[0]})
                    </span>
                  </div>
                </div>

                {/* Narrative Summary */}
                <div className="text-xs text-dark-text-primary font-sans leading-relaxed">
                  {evt.summary}
                </div>

                {/* Parameters & Trace Trigger Row */}
                <div className="pt-2 border-t border-dark-border-subtle/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Parameter Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
                    {Object.entries(evt.data || {})
                      .slice(0, 4)
                      .map(([key, val]) => {
                        const isWeiAmount = /amount|total|weight|target/i.test(key) && !isNaN(Number(val)) && Number(val) > 1000000;
                        const isAddr = typeof val === 'string' && val.startsWith('0x') && val.length === 42;

                        return (
                          <span
                            key={key}
                            className="px-2 py-0.5 rounded bg-dark-bg-2 border border-dark-border-subtle text-dark-text-secondary inline-flex items-center gap-1"
                          >
                            <span className="text-dark-text-muted text-[10px]">{key}:</span>
                            {isWeiAmount ? (
                              <span className="text-brand-400 font-bold">{formatEther(val, 2)}</span>
                            ) : isAddr ? (
                              <span className="text-dark-text-primary">{val.slice(0, 6)}...{val.slice(-4)}</span>
                            ) : (
                              <span className="text-dark-text-primary">{String(val)}</span>
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
                    className="text-xs font-mono shrink-0 self-end md:self-auto hover:border-brand-500/40"
                    icon={<ArrowRight className="w-3.5 h-3.5 text-brand-400" />}
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
