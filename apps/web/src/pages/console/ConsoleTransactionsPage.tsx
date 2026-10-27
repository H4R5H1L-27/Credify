import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePublicClient } from 'wagmi';
import { consoleApi } from '../../lib/api';
import { trackConfirmedTx } from '../../lib/clientTxTracker';
import {
  TechnicalPanel,
  TechnicalValue,
  TransactionStatus,
  EventBadge,
  TransactionDetailModal,
  BlockDetailModal,
} from '../../components/console';
import { Button } from '../../components/ui/Button';
import {
  ArrowLeftRight,
  RefreshCw,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Fuel,
  FileCode2,
  RotateCcw,
  Zap,
  Sparkles,
} from 'lucide-react';

export const ConsoleTransactionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTx = searchParams.get('tx');

  const [selectedTx, setSelectedTx] = useState<string | null>(initialTx);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'REVERTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const publicClient = usePublicClient();

  // Sync URL search param when selectedTx changes
  useEffect(() => {
    if (selectedTx) {
      setSearchParams({ tx: selectedTx }, { replace: true });
    } else if (searchParams.has('tx')) {
      searchParams.delete('tx');
      setSearchParams(searchParams, { replace: true });
    }
  }, [selectedTx, searchParams, setSearchParams]);

  const {
    data: transactions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['console', 'transactions'],
    queryFn: () => consoleApi.getTransactions({ limit: 50 }),
    refetchInterval: 3000,
  });

  // Active RPC polling for any pending MetaMask transactions (resolves blockchain mining latency)
  useEffect(() => {
    if (!publicClient) return;
    const pendingTxs = transactions.filter((t) => t.status === 'PENDING');
    if (pendingTxs.length === 0) return;

    let cancelled = false;
    for (const p of pendingTxs) {
      publicClient.getTransactionReceipt({ hash: p.hash as `0x${string}` })
        .then((receipt) => {
          if (!cancelled && receipt) {
            trackConfirmedTx(p.hash, receipt);
            refetch();
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [transactions, publicClient, refetch]);

  // Calculate counts for filters
  const confirmedCount = transactions.filter((t) => t.status === 'SUCCESS').length;
  const revertedCount = transactions.filter((t) => t.status === 'REVERTED').length;
  const pendingCount = transactions.filter((t) => t.status === 'PENDING').length;

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Status filter
      if (statusFilter === 'CONFIRMED' && tx.status !== 'SUCCESS') return false;
      if (statusFilter === 'REVERTED' && tx.status !== 'REVERTED') return false;
      if (statusFilter === 'PENDING' && tx.status !== 'PENDING') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesHash = tx.hash.toLowerCase().includes(q);
        const matchesBlock = tx.blockNumber.includes(q);
        const matchesFrom = tx.from.toLowerCase().includes(q);
        const matchesTo = tx.to?.toLowerCase().includes(q);
        const matchesEvents = tx.decodedEvents.some((e) => e.eventName.toLowerCase().includes(q));
        if (!matchesHash && !matchesBlock && !matchesFrom && !matchesTo && !matchesEvents) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, statusFilter, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-yellow-950 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300 w-fit mb-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Mined Receipts &amp; Logs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-slate-950">
            EVM Transactions &amp; Receipts
          </h1>
          <p className="text-xs text-slate-700 font-sans font-medium mt-1">
            Authoritative on-chain execution receipts, gas telemetry, and complete event evidence chains.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          loading={isLoading}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-xs font-sans shrink-0 bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold"
        >
          Refresh Feed
        </Button>
      </div>

      {/* Control Strip: Filters & Search */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 font-sans text-xs flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all duration-micro cursor-pointer font-bold ${
              statusFilter === 'ALL'
                ? 'bg-[#ffe600] text-black border-yellow-400 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:text-black hover:bg-slate-100'
            }`}
          >
            All Receipts ({transactions.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all duration-micro cursor-pointer font-bold flex items-center gap-1.5 ${
              statusFilter === 'CONFIRMED'
                ? 'bg-emerald-100 text-emerald-950 border-emerald-400 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:text-black hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Confirmed ({confirmedCount})</span>
          </button>

          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl border transition-all duration-micro cursor-pointer font-bold flex items-center gap-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:text-black hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
              <span>Pending ({pendingCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setStatusFilter('REVERTED')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all duration-micro cursor-pointer font-bold flex items-center gap-1.5 ${
              statusFilter === 'REVERTED'
                ? 'bg-rose-100 text-rose-950 border-rose-400 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:text-black hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
            <span>Reverted ({revertedCount})</span>
          </button>
        </div>

        {/* Real-time Search Input */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-yellow-400 focus-within:ring-1 focus-within:ring-yellow-400 w-full md:w-80 transition-colors">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tx, block, address, event..."
            className="bg-transparent border-none text-xs text-slate-950 placeholder:text-slate-500 focus:outline-none w-full font-sans font-medium"
          />
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-700 shrink-0 animate-spin" />
            <div>
              <span className="font-bold">Mining in Progress ({pendingCount} pending transaction{pendingCount > 1 ? 's' : ''}):</span>{' '}
              <span className="text-amber-900">
                MetaMask broadcast confirmed. Active RPC client is monitoring block inclusion in real-time.
              </span>
            </div>
          </div>
          <Button
            size="xs"
            variant="outline"
            onClick={() => refetch()}
            loading={isLoading}
            className="text-xs bg-white border-amber-300 text-amber-950 hover:bg-amber-100 font-bold shrink-0"
          >
            Check Receipts
          </Button>
        </div>
      )}

      {/* Transaction Feed Panel */}
      <TechnicalPanel
        title="Authoritative Transaction Ledger"
        subtitle={`Showing ${filteredTransactions.length} recorded on-chain transactions.`}
        badge={
          <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-950 font-bold">
            {filteredTransactions.length} / {transactions.length} MATCHING
          </span>
        }
        isLoading={isLoading}
        isEmpty={filteredTransactions.length === 0}
        emptyState={
          <div className="py-16 text-center text-xs font-sans text-slate-600 space-y-2">
            <Layers className="w-8 h-8 text-slate-400 mx-auto" />
            <div>No transactions match the selected filter or search query.</div>
          </div>
        }
      >
        <div className="space-y-3.5 min-w-0">
          {filteredTransactions.map((tx) => {
            const isConfirmed = tx.status === 'SUCCESS';
            const isReverted = tx.status === 'REVERTED';
            const valueEth = tx.valueWei !== '0' ? (Number(tx.valueWei) / 1e18).toFixed(4) : null;
            const gasUsed = Number(tx.gasUsed).toLocaleString();
            const effectiveGasPriceGwei = tx.effectiveGasPriceWei ? (Number(tx.effectiveGasPriceWei) / 1e9).toFixed(2) : '0.00';

            return (
              <div
                key={tx.hash}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-yellow-400 hover:shadow-md transition-all space-y-3.5 min-w-0"
              >
                {/* Header Row: Status, Block, Time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <TransactionStatus
                      status={isConfirmed ? 'CONFIRMED' : isReverted ? 'REVERTED' : 'PENDING'}
                      size="sm"
                    />

                    <span className="font-mono text-xs font-bold text-slate-950">
                      Block #{tx.blockNumber}
                    </span>

                    {/* Emitted Events Pills */}
                    {tx.decodedEvents.map((evt, idx) => (
                      <EventBadge key={idx} eventName={evt.eventName} size="sm" />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-sans self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/console/replay?tx=${tx.hash}`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-800 hover:text-black border border-slate-200 hover:bg-yellow-50 hover:border-yellow-400 font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title="Replay Transaction"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-900" />
                      <span>Replay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/console/trace?tx=${tx.hash}`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-800 hover:text-black border border-slate-200 hover:bg-yellow-50 hover:border-yellow-400 font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title="Action Trace"
                    >
                      <Zap className="w-3 h-3 text-slate-900" />
                      <span>Trace</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTx(tx.hash)}
                      className="px-3 py-1 rounded-lg bg-[#ffe600] text-black hover:bg-yellow-400 border border-yellow-400 font-bold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-xs ml-1"
                      title="Explain transaction operation & inspect on-chain receipt"
                    >
                      <Sparkles className="w-3 h-3 text-yellow-950" />
                      <span>Explain &amp; Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Routing Row: From -> To */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2.5 border-t border-slate-200 text-xs font-sans">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-slate-700 font-medium">From (Caller):</span>
                    <TechnicalValue value={tx.from} type="address" chars={6} />
                  </div>

                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-slate-700 font-medium">To (Target Contract):</span>
                    {tx.to ? (
                      <TechnicalValue value={tx.to} type="address" chars={6} />
                    ) : (
                      <span className="text-slate-500 font-mono">Contract Creation</span>
                    )}
                  </div>
                </div>

                {/* Value & Gas Telemetry Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2.5 border-t border-slate-200 text-xs font-mono">
                  <div>
                    <span className="text-slate-700 font-sans font-semibold text-xs block">Value Transferred</span>
                    <span className="font-bold text-slate-950">
                      {valueEth ? `${valueEth} ETH` : '0 ETH'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-700 font-sans font-semibold text-xs block">Gas Utilized</span>
                    <span className="font-bold text-slate-950">{gasUsed}</span>
                  </div>

                  <div>
                    <span className="text-slate-700 font-sans font-semibold text-xs block">Gas Price</span>
                    <span className="font-bold text-slate-950">{effectiveGasPriceGwei} Gwei</span>
                  </div>

                  <div className="text-right sm:text-left">
                    <span className="text-slate-700 font-sans font-semibold text-xs block">Tx Hash</span>
                    <TechnicalValue value={tx.hash} type="hash" chars={4} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </TechnicalPanel>

      {/* Modals for Deep Inspection */}
      <TransactionDetailModal
        txHash={selectedTx}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        onSelectBlock={(b) => setSelectedBlock(b)}
      />

      <BlockDetailModal
        blockNumberOrHash={selectedBlock}
        isOpen={Boolean(selectedBlock)}
        onClose={() => setSelectedBlock(null)}
        onSelectTx={(txHash) => setSelectedTx(txHash)}
      />
    </div>
  );
};
