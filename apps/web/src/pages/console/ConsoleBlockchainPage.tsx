import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { consoleApi } from '../../lib/api';
import type { ActivityEvent } from '@credify/shared';
import {
  TechnicalPanel,
  TechnicalValue,
  TechnicalStatus,
  BlockDetailModal,
  TransactionDetailModal,
  EventBadge,
} from '../../components/console';
import {
  Cpu,
  Layers,
  RefreshCw,
  Box,
  ArrowRight,
  Clock,
  Fuel,
  Search,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  CryptoBlock3D,
  IsometricBlockStream,
  Tabs,
  NumberTicker,
  AnimatedSyncPulse,
} from '../../components/ui';

function formatTimeAgo(isoString: string): string {
  try {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return '';
  }
}

export const ConsoleBlockchainPage: React.FC = () => {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [feedMode, setFeedMode] = useState<'GRID' | 'TABLE' | '3D'>('GRID');
  const [searchQuery, setSearchQuery] = useState('');
  const [txOnlyFilter, setTxOnlyFilter] = useState(false);

  const {
    data: network,
    isLoading: networkLoading,
    refetch: refetchNetwork,
  } = useQuery({
    queryKey: ['console', 'network'],
    queryFn: () => consoleApi.getNetwork(),
    refetchInterval: 3000,
  });

  const {
    data: blocks = [],
    isLoading: blocksLoading,
    refetch: refetchBlocks,
  } = useQuery({
    queryKey: ['console', 'blocks'],
    queryFn: () => consoleApi.getBlocks(24),
    refetchInterval: 3000,
  });

  const {
    data: events = [],
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ['console', 'events'],
    queryFn: () => consoleApi.getEvents({ limit: 100 }),
    refetchInterval: 3000,
  });

  const isRefreshing = networkLoading || blocksLoading || eventsLoading;

  const handleRefresh = () => {
    refetchNetwork();
    refetchBlocks();
    refetchEvents();
  };

  const eventsByBlock = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    for (const evt of events) {
      const arr = map.get(evt.blockNumber) || [];
      arr.push(evt);
      map.set(evt.blockNumber, arr);
    }
    return map;
  }, [events]);

  const filteredBlocks = useMemo(() => {
    return blocks.filter((blk) => {
      if (txOnlyFilter && blk.transactionCount === 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = blk.number.includes(q);
        const matchHash = blk.hash.toLowerCase().includes(q);
        const blkEvents = eventsByBlock.get(blk.number) || [];
        const matchEvent = blkEvents.some(
          (e) =>
            e.eventName.toLowerCase().includes(q) ||
            e.summary.toLowerCase().includes(q) ||
            e.actorName?.toLowerCase().includes(q) ||
            e.contractName?.toLowerCase().includes(q)
        );
        if (!matchNum && !matchHash && !matchEvent) return false;
      }
      return true;
    });
  }, [blocks, txOnlyFilter, searchQuery, eventsByBlock]);

  const currentBlockNum = network?.latestBlockNumber ?? (blocks[0]?.number || '0');
  const activeChainId = network?.chainId ?? 31337;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-yellow-900 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300 w-fit mb-2">
            <Cpu className="w-4 h-4 text-yellow-700" />
            <span>Consensus &amp; State Trie</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-slate-950">
            Blockchain &amp; Node Observability
          </h1>
          <p className="text-xs text-slate-600 font-sans mt-1 font-medium">
            Real-time EVM block propagation, authoritative JSON-RPC telemetry, and cryptographic block header proofs.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          loading={isRefreshing}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-xs font-sans shrink-0 bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold cursor-pointer"
        >
          Refresh Blocks
        </Button>
      </div>

      {/* Unified Elevated Telemetry Strip + 3D Cryptographic Block Hero */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch min-w-0">
        {/* Telemetry Matrix (2/3 col) */}
        <div className="xl:col-span-2 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-6 min-w-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 min-w-0">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-sans font-bold text-slate-700 block">
                EXECUTION CLIENT
              </span>
              <div className="text-sm font-bold font-sans text-slate-950 truncate" title={network?.clientVersion}>
                {network?.clientVersion?.split('/')[0] || 'Hardhat Network'}
              </div>
              <div className="text-xs font-mono text-slate-500 font-medium">Local In-Memory EVM</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-sans font-bold text-slate-700 block">
                CHAIN ID
              </span>
              <div className="text-sm font-bold font-mono text-slate-950">
                {activeChainId}
              </div>
              <div className="text-xs font-mono text-slate-500 font-medium">0x{activeChainId.toString(16)} (Hex)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-sans font-bold text-slate-700 block">
                HEAD BLOCK HEIGHT
              </span>
              <div className="text-sm font-bold font-mono text-slate-950 flex items-center gap-1.5">
                <span>#<NumberTicker value={Number(currentBlockNum) || 0} /></span>
                <AnimatedSyncPulse color="emerald" />
              </div>
              <div className="text-xs font-mono text-slate-500 truncate font-medium">
                {network?.latestBlockHash ? `${network.latestBlockHash.slice(0, 12)}...` : 'Deterministic block head'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-sans font-bold text-slate-700 block">
                RPC NODE STATUS
              </span>
              <div className="pt-0.5">
                <TechnicalStatus status={network ? 'ACTIVE' : 'DISCONNECTED'} size="sm" />
              </div>
              <div className="text-xs font-mono text-slate-500 font-medium">http://127.0.0.1:8545</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Consensus Engine:</span>
              <span className="text-slate-950 font-bold">Proof of Authority (Instant Finality)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Mining Engine:</span>
              <span className="text-emerald-700 font-bold">Automine Active (1 Block per Tx)</span>
            </div>
          </div>
        </div>

        {/* 3D Cryptographic Block Cube (1/3 col) */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col items-center justify-center overflow-hidden relative">
          <div className="absolute top-3 left-4 text-[11px] font-mono text-slate-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-yellow-600" />
            <span>Interactive 3D EVM Block</span>
          </div>
          <CryptoBlock3D
            blockNumber={currentBlockNum}
            blockHash={network?.latestBlockHash || (blocks[0]?.hash ? `${blocks[0].hash.slice(0, 16)}...` : '0x8f3c...b12a')}
            parentHash={blocks[0]?.parentHash ? `${blocks[0].parentHash.slice(0, 16)}...` : '0x0000...0000'}
            txCount={blocks[0]?.transactionCount || 0}
            gasPercent={blocks[0] ? Math.round(Number((BigInt(blocks[0].gasUsed) * 100n) / BigInt(blocks[0].gasLimit || '1'))) : 0}
            size={160}
          />
          <div className="text-[11px] font-mono text-slate-500 font-medium -mt-2">
            Hover &amp; move cursor to rotate perspective
          </div>
        </div>
      </div>

      {/* Visual Blocks Feed */}
      <TechnicalPanel
        title="Authoritative Blocks Feed"
        subtitle={`Showing recent confirmed blocks (${filteredBlocks.length} of ${blocks.length}) mined on execution node.`}
        badge={
          <div className="flex items-center gap-2">
            <Tabs
              variant="pill"
              tabs={[
                { id: 'GRID', label: '2D CARDS GRID' },
                { id: 'TABLE', label: 'EXPLORER TABLE' },
                { id: '3D', label: '3D ISOMETRIC CHAIN' },
              ]}
              activeTab={feedMode}
              onChange={(id) => setFeedMode(id as any)}
            />
          </div>
        }
        isLoading={blocksLoading}
        isEmpty={blocks.length === 0}
        emptyState={
          <div className="py-16 text-center text-xs font-sans text-slate-500 font-medium space-y-2">
            <Box className="w-8 h-8 text-slate-400 mx-auto" />
            <div>No blocks produced by local node yet.</div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Quick Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by block #, tx hash, or event keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-yellow-400 font-sans"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTxOnlyFilter(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  !txOnlyFilter
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Blocks ({blocks.length})
              </button>
              <button
                type="button"
                onClick={() => setTxOnlyFilter(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  txOnlyFilter
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                With Transactions ({blocks.filter((b) => b.transactionCount > 0).length})
              </button>
            </div>
          </div>

          {filteredBlocks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-medium bg-slate-50 rounded-xl border border-slate-200">
              No blocks match your search query.
            </div>
          ) : feedMode === '3D' ? (
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <IsometricBlockStream blocks={filteredBlocks} onSelectBlock={setSelectedBlock} />
            </div>
          ) : feedMode === 'TABLE' ? (
            /* Streamlined Explorer Table View */
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Height</th>
                    <th className="py-3 px-4">Age / Timestamp</th>
                    <th className="py-3 px-4">Txns</th>
                    <th className="py-3 px-4">On-Chain Activity / Execution</th>
                    <th className="py-3 px-4">Gas Consumed</th>
                    <th className="py-3 px-4">Block Hash</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBlocks.map((blk) => {
                    const blkEvents = eventsByBlock.get(blk.number) || [];
                    const primaryEvent = blkEvents[0];
                    const hasTxs = blk.transactionCount > 0;
                    const gasUsedNum = Number(blk.gasUsed);

                    return (
                      <tr
                        key={blk.hash || blk.number}
                        className="hover:bg-yellow-50/40 transition-colors cursor-pointer group"
                        onClick={() => setSelectedBlock(blk.number)}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-950 group-hover:text-yellow-900 transition-colors">
                          #{blk.number}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          <span className="font-semibold text-slate-900">{formatTimeAgo(blk.timestamp)}</span>
                          <span className="text-slate-400 text-[11px] block">{new Date(blk.timestamp).toLocaleTimeString()}</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-mono font-bold ${
                              hasTxs
                                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                                : 'bg-slate-100 border border-slate-200 text-slate-500'
                            }`}
                          >
                            {blk.transactionCount} tx
                          </span>
                        </td>
                        <td className="py-3.5 px-4 min-w-[280px]">
                          {primaryEvent ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <EventBadge eventName={primaryEvent.eventName} size="sm" />
                                {primaryEvent.contractName && (
                                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    {primaryEvent.contractName}
                                  </span>
                                )}
                                {primaryEvent.actorName && (
                                  <span className="text-xs font-bold text-slate-800">
                                    · {primaryEvent.actorName}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-1 font-medium">
                                {primaryEvent.summary}
                              </p>
                            </div>
                          ) : hasTxs ? (
                            <div className="space-y-0.5">
                              <span className="text-slate-800 font-semibold text-xs flex items-center gap-1">
                                <Layers className="w-3 h-3 text-slate-500" />
                                EVM Contract Interaction
                              </span>
                              {blk.transactions[0] && (
                                <span className="text-[10px] font-mono text-slate-400 block truncate max-w-xs">
                                  Tx: {blk.transactions[0]}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Empty State Tick</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-800 font-medium">
                          {gasUsedNum.toLocaleString()} gas
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <TechnicalValue value={blk.hash} type="hash" chars={8} />
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="text-xs font-bold text-yellow-900 group-hover:text-black inline-flex items-center gap-1">
                            <span>Inspect</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* High-Readability 2D Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans text-xs">
              {filteredBlocks.map((blk) => {
                const blkEvents = eventsByBlock.get(blk.number) || [];
                const primaryEvent = blkEvents[0];
                const hasTxs = blk.transactionCount > 0;
                const gasUsedNum = Number(blk.gasUsed);

                return (
                  <div
                    key={blk.hash || blk.number}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-yellow-400 hover:shadow-md transition-all duration-micro space-y-3.5 cursor-pointer group shadow-xs relative flex flex-col justify-between"
                    onClick={() => setSelectedBlock(blk.number)}
                  >
                    {/* Top Row: Block Height, Tx Badge, Timestamp */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-950 text-base group-hover:text-yellow-800 transition-colors">
                          #{blk.number}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-mono font-bold ${
                            hasTxs
                              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                              : 'bg-slate-100 border border-slate-200 text-slate-500'
                          }`}
                        >
                          {blk.transactionCount} {blk.transactionCount === 1 ? 'tx' : 'txs'}
                        </span>
                      </div>

                      <span
                        className="text-xs font-sans text-slate-500 flex items-center gap-1 font-medium"
                        title={new Date(blk.timestamp).toLocaleString()}
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatTimeAgo(blk.timestamp)}
                      </span>
                    </div>

                    {/* Contextual Action / Activity Box */}
                    {primaryEvent ? (
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-1.5">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <EventBadge eventName={primaryEvent.eventName} size="sm" />
                          {primaryEvent.contractName && (
                            <span className="text-[10px] font-mono font-bold text-slate-600 bg-white/90 px-1.5 py-0.5 rounded border border-slate-200">
                              {primaryEvent.contractName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-sans text-slate-900 font-semibold line-clamp-2 leading-relaxed">
                          {primaryEvent.summary}
                        </p>
                        {primaryEvent.actorName && (
                          <div className="text-[11px] font-sans text-slate-600 flex items-center gap-1.5 pt-0.5">
                            <span className="text-slate-400 font-medium">Actor:</span>
                            <span className="font-bold text-slate-800">{primaryEvent.actorName}</span>
                            {primaryEvent.actorRole && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono font-bold uppercase">
                                {primaryEvent.actorRole}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : hasTxs ? (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1.5">
                            <Layers className="w-3 h-3 text-slate-500" />
                            On-Chain Contract Execution
                          </span>
                        </div>
                        <p className="text-xs font-sans text-slate-600 font-medium">
                          State transaction permanently confirmed in block state.
                        </p>
                        {blk.transactions[0] && (
                          <div className="text-[11px] font-mono text-slate-500 truncate pt-0.5">
                            Tx: {blk.transactions[0].slice(0, 10)}...{blk.transactions[0].slice(-8)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-200/60 text-slate-400 text-xs font-sans flex items-center gap-2">
                        <Box className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium">Consensus epoch tick (No state transactions)</span>
                      </div>
                    )}

                    {/* Block Hash & Gas Details */}
                    <div className="space-y-1.5 text-xs font-sans pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-500 font-medium">Block Hash:</span>
                        <TechnicalValue value={blk.hash} type="hash" chars={8} />
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Fuel className="w-3.5 h-3.5 text-slate-400" /> Gas Consumed:
                        </span>
                        <span className="font-mono font-semibold text-slate-900">
                          {gasUsedNum.toLocaleString()} gas
                        </span>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-1 flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Parent: {blk.parentHash ? `${blk.parentHash.slice(0, 6)}...` : '0x0000...'}</span>
                      <span className="text-xs font-sans text-yellow-900 group-hover:text-black font-bold inline-flex items-center gap-1 transition-colors">
                        <span>Inspect Header</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </TechnicalPanel>

      {/* Consensus & Execution Architecture Panel */}
      <TechnicalPanel
        title="Local EVM Node Consensus Topology"
        subtitle="Cryptographic assumptions and Hardhat mining engine configuration."
        badge={<TechnicalStatus status="ACTIVE" size="sm" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-sans text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-sm text-slate-950">Automining Engine</div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Mining mode is set to instant automine. Every valid transaction broadcast triggers an immediate block production event with 0 latency.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              Seeding Mines Real Blocks
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              When seeding demo data or registering identities, each operation executes a real on-chain transaction. With automine active, each transaction instantly seals into its own block (1 tx per block).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-sm text-slate-950">EVM Hardfork Target</div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Running Shanghai / Cancun EVM specifications with EIP-1559 base fee calculation, transient storage (EIP-1153), and beacon root hash validation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-sm text-slate-950">Deterministic State Root</div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Merkle Patricia Trie computes cryptographic state roots for every block header, providing verifiable execution proofs for all credit facilities.
            </p>
          </div>
        </div>
      </TechnicalPanel>

      {/* Modals for Deep Inspection */}
      <BlockDetailModal
        blockNumberOrHash={selectedBlock}
        isOpen={Boolean(selectedBlock)}
        onClose={() => setSelectedBlock(null)}
        onSelectTx={(txHash) => setSelectedTx(txHash)}
      />

      <TransactionDetailModal
        txHash={selectedTx}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        onSelectBlock={(b) => setSelectedBlock(b)}
      />
    </div>
  );
};
