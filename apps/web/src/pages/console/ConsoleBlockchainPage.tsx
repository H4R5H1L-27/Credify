import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { consoleApi } from '../../lib/api';
import {
  TechnicalPanel,
  TechnicalValue,
  TechnicalStatus,
  BlockDetailModal,
  TransactionDetailModal,
} from '../../components/console';
import { Cpu, Terminal, Layers, RefreshCw, Box, ArrowRight, Clock, Fuel, Hash, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  CryptoBlock3D,
  IsometricBlockStream,
  Tabs,
  NumberTicker,
  AnimatedSyncPulse,
} from '../../components/ui';

export const ConsoleBlockchainPage: React.FC = () => {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [feedMode, setFeedMode] = useState<'3D' | 'GRID'>('3D');

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
    queryFn: () => consoleApi.getBlocks(12),
    refetchInterval: 3000,
  });

  const isRefreshing = networkLoading || blocksLoading;

  const handleRefresh = () => {
    refetchNetwork();
    refetchBlocks();
  };

  const currentBlockNum = network?.latestBlockNumber ?? (blocks[0]?.number || '0');
  const activeChainId = network?.chainId ?? 31337;
  const gasLimit = network?.gasLimit ?? '60000000';

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
          className="text-xs font-sans shrink-0 bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold"
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
              <span className="text-slate-500 font-medium">Block Target:</span>
              <span className="text-emerald-700 font-bold">0.0s Mining Delay</span>
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

      {/* Visual Blocks Feed with 3D Isometric View */}
      <TechnicalPanel
        title="Authoritative Blocks Feed"
        subtitle={`Showing most recent confirmed blocks (${blocks.length}) mined on local execution node.`}
        badge={
          <div className="flex items-center gap-2">
            <Tabs
              variant="pill"
              tabs={[
                { id: '3D', label: '3D ISOMETRIC CHAIN' },
                { id: 'GRID', label: '2D CARDS GRID' },
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
        {feedMode === '3D' ? (
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
            <IsometricBlockStream blocks={blocks} onSelectBlock={setSelectedBlock} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans text-xs">
            {blocks.map((blk) => {
              const gasUsed = BigInt(blk.gasUsed);
              const gasLimitVal = BigInt(blk.gasLimit);
              const gasPercent = gasLimitVal > 0n ? Math.min(100, Number((gasUsed * 100n) / gasLimitVal)) : 0;
              const hasTxs = blk.transactionCount > 0;

              return (
                <div
                  key={blk.hash || blk.number}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-yellow-400 hover:shadow-md transition-all duration-micro space-y-3.5 cursor-pointer group shadow-xs"
                  onClick={() => setSelectedBlock(blk.number)}
                >
                  {/* Block Number & Tx Count Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-slate-950 text-base group-hover:text-yellow-800 transition-colors">
                        #{blk.number}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-mono font-bold ${
                          hasTxs
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                            : 'bg-slate-100 border border-slate-200 text-slate-600'
                        }`}
                      >
                        {blk.transactionCount} {blk.transactionCount === 1 ? 'tx' : 'txs'}
                      </span>
                    </div>

                    <span className="text-xs font-sans text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(blk.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Hashes Provenance */}
                  <div className="space-y-1.5 text-xs font-sans">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-xs text-slate-600 font-medium">Hash:</span>
                      <TechnicalValue value={blk.hash} type="hash" chars={8} />
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-xs text-slate-600 font-medium">Parent:</span>
                      <TechnicalValue value={blk.parentHash} type="hash" chars={8} />
                    </div>
                  </div>

                  {/* Gas Utilization Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 font-sans">
                    <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-slate-500" /> Gas Utilized:
                      </span>
                      <span className="font-mono font-medium">{gasPercent}% ({Number(blk.gasUsed).toLocaleString()})</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        className={`h-full transition-all duration-state ${
                          gasPercent > 80
                            ? 'bg-rose-500'
                            : gasPercent > 40
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.max(4, gasPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-1 flex justify-end">
                    <span className="text-xs font-sans text-yellow-900 group-hover:text-black font-bold inline-flex items-center gap-1 transition-colors">
                      <span>Inspect Header Proof</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TechnicalPanel>

      {/* Consensus & Execution Architecture Panel */}
      <TechnicalPanel
        title="Local EVM Node Consensus Topology"
        subtitle="Cryptographic assumptions and Hardhat mining engine configuration."
        badge={<TechnicalStatus status="ACTIVE" size="sm" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-sm text-slate-950">Automining Engine</div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Mining mode is set to instant automine. Every valid transaction broadcast triggers an immediate block production event with 0 latency.
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
