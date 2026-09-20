import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { consoleApi } from '../../lib/api';
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
} from 'lucide-react';

export const ConsoleTransactionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTx = searchParams.get('tx');

  const [selectedTx, setSelectedTx] = useState<string | null>(initialTx);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'REVERTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Calculate counts for filters
  const confirmedCount = transactions.filter((t) => t.status === 'SUCCESS').length;
  const revertedCount = transactions.filter((t) => t.status === 'REVERTED').length;

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Status filter
      if (statusFilter === 'CONFIRMED' && tx.status !== 'SUCCESS') return false;
      if (statusFilter === 'REVERTED' && tx.status !== 'REVERTED') return false;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider text-brand-400 mb-1">
            <ArrowLeftRight className="w-4 h-4" />
            <span>Mined Receipts &amp; Logs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-dark-text-primary">
            EVM Transactions &amp; Receipts
          </h1>
          <p className="text-xs text-dark-text-secondary font-sans mt-1">
            Authoritative on-chain execution receipts, gas telemetry, and complete event evidence chains.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          loading={isLoading}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-xs font-sans shrink-0"
        >
          Refresh Feed
        </Button>
      </div>

      {/* Control Strip: Filters & Search */}
      <div className="p-4 sm:p-5 rounded-2xl bg-dark-bg-2 border border-dark-border-subtle/80 shadow-depth-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 font-sans text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all duration-micro cursor-pointer font-medium ${
              statusFilter === 'ALL'
                ? 'bg-brand-500/15 text-brand-400 border-brand-500/30 font-semibold shadow-depth-subtle'
                : 'bg-dark-bg-3/60 text-dark-text-secondary border-dark-border-subtle/60 hover:text-dark-text-primary'
            }`}
          >
            All Receipts ({transactions.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all duration-micro cursor-pointer font-medium flex items-center gap-1.5 ${
              statusFilter === 'CONFIRMED'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold shadow-depth-subtle'
                : 'bg-dark-bg-3/60 text-dark-text-secondary border-dark-border-subtle/60 hover:text-dark-text-primary'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Confirmed ({confirmedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('REVERTED')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all duration-micro cursor-pointer font-medium flex items-center gap-1.5 ${
              statusFilter === 'REVERTED'
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold shadow-depth-subtle'
                : 'bg-dark-bg-3/60 text-dark-text-secondary border-dark-border-subtle/60 hover:text-dark-text-primary'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Reverted ({revertedCount})</span>
          </button>
        </div>

        {/* Real-time Search Input */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-bg-3/70 border border-dark-border-subtle/60 focus-within:border-brand-500/50 w-full md:w-80 transition-colors">
          <Search className="w-4 h-4 text-dark-text-muted shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tx, block, address, event..."
            className="bg-transparent border-none text-xs text-dark-text-primary placeholder:text-dark-text-muted focus:outline-none w-full font-sans"
          />
        </div>
      </div>

      {/* Transaction Feed Panel */}
      <TechnicalPanel
        title="Authoritative Transaction Ledger"
        subtitle={`Showing ${filteredTransactions.length} recorded on-chain transactions.`}
        badge={
          <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-dark-bg-3 text-dark-text-secondary border border-dark-border-subtle font-medium">
            {filteredTransactions.length} / {transactions.length} MATCHING
          </span>
        }
        isLoading={isLoading}
        isEmpty={filteredTransactions.length === 0}
        emptyState={
          <div className="py-16 text-center text-xs font-sans text-dark-text-muted space-y-2">
            <Layers className="w-8 h-8 text-dark-text-muted mx-auto" />
            <div>No transactions match the selected filter or search query.</div>
          </div>
        }
      >
        <div className="space-y-3.5">
          {filteredTransactions.map((tx) => {
            const isConfirmed = tx.status === 'SUCCESS';
            const isReverted = tx.status === 'REVERTED';
            const valueEth = tx.valueWei !== '0' ? (Number(tx.valueWei) / 1e18).toFixed(4) : null;
            const gasUsed = Number(tx.gasUsed).toLocaleString();

            return (
              <div
                key={tx.hash}
                className="p-5 rounded-2xl bg-dark-bg-3/50 border border-dark-border-subtle/60 hover:border-brand-500/40 hover:bg-dark-bg-3/80 transition-all duration-micro space-y-3 shadow-depth-subtle"
              >
                {/* Header Row: Status, Block, Time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <TransactionStatus
                      status={isConfirmed ? 'CONFIRMED' : isReverted ? 'REVERTED' : 'PENDING'}
                      size="sm"
                    />

                    <span className="font-mono text-xs font-bold text-dark-text-primary">
                      Block #{tx.blockNumber}
                    </span>

                    {/* Emitted Events Pills */}
                    {tx.decodedEvents.map((evt, idx) => (
                      <EventBadge key={idx} eventName={evt.eventName} size="sm" />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-sans self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => navigate(`/console/replay?tx=${tx.hash}`)}
                      className="px-2.5 py-1 rounded-lg bg-dark-bg-2 text-brand-400 hover:text-brand-300 border border-dark-border-subtle hover:border-brand-500/40 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title="Replay Transaction"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Replay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/console/trace?tx=${tx.hash}`)}
                      className="px-2.5 py-1 rounded-lg bg-dark-bg-2 text-brand-400 hover:text-brand-300 border border-dark-border-subtle hover:border-brand-500/40 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title="Action Trace"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Trace</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTx(tx.hash)}
                      className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/30 font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ml-1"
                    >
                      <span>Inspect Receipt</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Routing Row: From -> To */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-dark-border-subtle/50 text-xs font-sans">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-dark-text-secondary">From (Caller):</span>
                    <TechnicalValue value={tx.from} type="address" chars={6} />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-dark-text-secondary">To (Target Contract):</span>
                    <TechnicalValue value={tx.to || tx.contractAddress || 'Contract Deployer'} type="address" chars={6} />
                  </div>
                </div>

                {/* Telemetry Footer: Hash, Gas, Value */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-dark-border-subtle/40 text-xs font-sans text-dark-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <span>Tx:</span>
                    <TechnicalValue value={tx.hash} type="hash" chars={8} />
                  </div>

                  <div className="flex items-center gap-1 font-mono">
                    <Fuel className="w-3.5 h-3.5 text-dark-text-muted" />
                    <span>{gasUsed} gas</span>
                  </div>

                  <div className="flex items-center justify-start sm:justify-end gap-1 font-mono text-dark-text-primary">
                    {valueEth ? (
                      <span className="text-brand-400 font-bold">{valueEth} ETH</span>
                    ) : (
                      <span className="text-dark-text-muted">0.0000 ETH</span>
                    )}
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
