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
          <div className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider text-brand-400 mb-1">
            <Cpu className="w-4 h-4" />
            <span>Consensus &amp; State Trie</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-dark-text-primary">
            Blockchain &amp; Node Observability
          </h1>
          <p className="text-xs text-dark-text-secondary font-sans mt-1">
            Real-time EVM block propagation, authoritative JSON-RPC telemetry, and cryptographic block header proofs.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          loading={isRefreshing}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-xs font-sans shrink-0"
        >
          Refresh Blocks
        </Button>
      </div>

      {/* Unified Elevated Telemetry Strip + 3D Cryptographic Block Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Telemetry Matrix (2/3 col) */}
        <div className="lg:col-span-2 p-6 sm:p-7 rounded-2xl bg-dark-bg-2 border border-dark-border-subtle/80 shadow-depth-card flex flex-col justify-between space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-xs font-sans text-dark-text-secondary block">
                EXECUTION CLIENT
              </span>
              <div className="text-sm font-bold font-sans text-dark-text-primary truncate" title={network?.clientVersion}>
                {network?.clientVersion?.split('/')[0] || 'Hardhat Network'}
              </div>
              <div className="text-xs font-mono text-dark-text-muted">Local In-Memory EVM</div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-sans text-dark-text-secondary block">
                CHAIN ID
              </span>
              <div className="text-sm font-bold font-mono text-dark-text-primary">
                {activeChainId}
              </div>
              <div className="text-xs font-mono text-dark-text-muted">0x{activeChainId.toString(16)} (Hex)</div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-sans text-dark-text-secondary block">
                HEAD BLOCK HEIGHT
              </span>
              <div className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                <span>#<NumberTicker value={Number(currentBlockNum) || 0} /></span>
                <AnimatedSyncPulse color="emerald" />
              </div>
              <div className="text-xs font-mono text-dark-text-muted truncate">
                {network?.latestBlockHash ? `${network.latestBlockHash.slice(0, 12)}...` : 'Deterministic block head'}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-sans text-dark-text-secondary block">
                RPC NODE STATUS
              </span>
              <div className="pt-0.5">
                <TechnicalStatus status={network ? 'ACTIVE' : 'DISCONNECTED'} size="sm" />
              </div>
              <div className="text-xs font-mono text-dark-text-muted">http://127.0.0.1:8545</div>
            </div>
          </div>

          <div className="pt-4 border-t border-dark-border-subtle/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-dark-text-secondary">
            <div className="flex items-center gap-2">
              <span className="text-dark-text-muted">Consensus Engine:</span>
              <span className="text-dark-text-primary font-semibold">Proof of Authority (Instant Finality)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dark-text-muted">Block Target:</span>
              <span className="text-emerald-400 font-semibold">0.0s Mining Delay</span>
            </div>
          </div>
        </div>

        {/* 3D Cryptographic Block Cube (1/3 col) */}
        <div className="rounded-2xl bg-dark-bg-2 border border-dark-border-subtle/80 shadow-depth-card p-4 flex flex-col items-center justify-center overflow-hidden relative">
          <div className="absolute top-3 left-4 text-[10px] font-mono text-dark-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-brand-400" />
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
          <div className="text-[10px] font-mono text-dark-text-muted/70 -mt-2">
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
          <div className="py-16 text-center text-xs font-sans text-dark-text-muted space-y-2">
            <Box className="w-8 h-8 text-dark-text-muted mx-auto" />
            <div>No blocks produced by local node yet.</div>
          </div>
        }
      >
        {feedMode === '3D' ? (
          <div className="p-2 rounded-xl bg-dark-bg-1/40 border border-dark-border-subtle/50">
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
                  className="p-5 rounded-2xl bg-dark-bg-3/50 border border-dark-border-subtle/60 hover:border-brand-500/40 hover:bg-dark-bg-3/80 transition-all duration-micro space-y-3.5 cursor-pointer group shadow-depth-subtle"
                  onClick={() => setSelectedBlock(blk.number)}
                >
                  {/* Block Number & Tx Count Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-dark-text-primary text-base group-hover:text-brand-400 transition-colors">
                        #{blk.number}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-mono font-bold ${
                          hasTxs
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-dark-bg-2 border border-dark-border-subtle text-dark-text-muted'
                        }`}
                      >
                        {blk.transactionCount} {blk.transactionCount === 1 ? 'tx' : 'txs'}
                      </span>
                    </div>

                    <span className="text-xs font-sans text-dark-text-muted flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(blk.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Hashes Provenance */}
                  <div className="space-y-1.5 text-xs font-sans">
                    <div className="flex items-center justify-between text-dark-text-muted">
                      <span className="text-xs text-dark-text-secondary">Hash:</span>
                      <TechnicalValue value={blk.hash} type="hash" chars={8} />
                    </div>
                    <div className="flex items-center justify-between text-dark-text-muted">
                      <span className="text-xs text-dark-text-secondary">Parent:</span>
                      <TechnicalValue value={blk.parentHash} type="hash" chars={8} />
                    </div>
                  </div>

                  {/* Gas Utilization Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-dark-border-subtle/50 font-sans">
                    <div className="flex items-center justify-between text-xs text-dark-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-dark-text-muted" /> Gas Utilized:
                      </span>
                      <span className="font-mono font-medium">{gasPercent}% ({Number(blk.gasUsed).toLocaleString()})</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-dark-bg-1 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-state ${
                          gasPercent > 80
                            ? 'bg-crimson-400'
                            : gasPercent > 40
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.max(4, gasPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-1 flex justify-end">
                    <span className="text-xs font-sans text-brand-400 group-hover:text-brand-300 font-semibold inline-flex items-center gap-1 transition-colors">
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
          <div className="p-4 rounded-xl bg-dark-bg-3/50 border border-dark-border-subtle/60 space-y-2">
            <div className="font-bold text-sm text-dark-text-primary">Automining Engine</div>
            <p className="text-xs text-dark-text-secondary leading-relaxed">
              Mining mode is set to instant automine. Every valid transaction broadcast triggers an immediate block production event with 0 latency.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-bg-3/50 border border-dark-border-subtle/60 space-y-2">
            <div className="font-bold text-sm text-dark-text-primary">EVM Hardfork Target</div>
            <p className="text-xs text-dark-text-secondary leading-relaxed">
              Running Shanghai / Cancun EVM specifications with EIP-1559 base fee calculation, transient storage (EIP-1153), and beacon root hash validation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-bg-3/50 border border-dark-border-subtle/60 space-y-2">
            <div className="font-bold text-sm text-dark-text-primary">Deterministic State Root</div>
            <p className="text-xs text-dark-text-secondary leading-relaxed">
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
