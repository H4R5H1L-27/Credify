import React from 'react';
import type { IndexerStateObservability } from '@credify/shared';
import { Button } from '../ui/Button';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Layers,
  Database,
  Cpu,
} from 'lucide-react';

export interface IndexerStatusIndicatorProps {
  indexerState?: IndexerStateObservability;
  isLoading?: boolean;
  isError?: boolean;
  onReindex?: () => void;
  isReindexing?: boolean;
}

export const IndexerStatusIndicator: React.FC<IndexerStatusIndicatorProps> = ({
  indexerState,
  isLoading,
  isError,
  onReindex,
  isReindexing,
}) => {
  // Determine authoritative synchronization status based on actual data
  let syncStatus: 'SYNCED' | 'CATCHING UP' | 'STALE' | 'ERROR' = 'SYNCED';
  let statusBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  let statusLabel = 'SYNCED';
  let statusDescription = 'EVM log projections are fully synchronized with chain head.';

  if (isError || (indexerState && !indexerState.running)) {
    syncStatus = 'ERROR';
    statusBadgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    statusIcon = <XCircle className="w-3.5 h-3.5 text-rose-400" />;
    statusLabel = 'ERROR';
    statusDescription = 'RPC synchronization offline or event decoding failed.';
  } else if (indexerState) {
    if (indexerState.blockLag === 0) {
      syncStatus = 'SYNCED';
      statusBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      statusLabel = 'SYNCED';
      statusDescription = 'Projections in lockstep with blockchain head.';
    } else if (indexerState.blockLag > 0 && indexerState.blockLag <= 5) {
      syncStatus = 'CATCHING UP';
      statusBadgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      statusIcon = <Clock className="w-3.5 h-3.5 text-amber-400" />;
      statusLabel = `CATCHING UP (-${indexerState.blockLag} BLOCKS)`;
      statusDescription = `Processing newly mined blocks ${indexerState.lastIndexedBlock} → ${indexerState.currentHeadBlock}.`;
    } else {
      syncStatus = 'STALE';
      statusBadgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      statusLabel = `STALE (-${indexerState.blockLag} BLOCKS)`;
      statusDescription = 'Block lag exceeds tolerance threshold. Reindex recommended.';
    }
  }

  return (
    <div className="p-4 rounded-xl bg-dark-bg-2 border border-dark-border-subtle space-y-3.5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-400" />
          <span className="font-mono text-xs font-bold uppercase text-dark-text-primary">
            Indexer Synchronization Telemetry
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border uppercase font-semibold ${statusBadgeColor}`}
          >
            {statusIcon}
            {statusLabel}
          </span>
        </div>

        {onReindex && (
          <Button
            size="sm"
            variant="outline"
            onClick={onReindex}
            loading={isReindexing}
            icon={<RefreshCw className="w-3 h-3" />}
            className="text-[11px] font-mono py-1 px-2.5 h-auto"
          >
            Force Reindex
          </Button>
        )}
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Blockchain Head */}
        <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle">
          <div className="text-[10px] font-mono text-dark-text-muted flex items-center gap-1 uppercase">
            <Cpu className="w-3 h-3 text-brand-400" />
            Blockchain Head
          </div>
          <div className="mt-1 font-mono text-base font-bold text-dark-text-primary">
            {isLoading ? '...' : `#${indexerState?.currentHeadBlock || '0'}`}
          </div>
          <div className="text-[10px] text-dark-text-secondary font-mono">
            Latest EVM Block Height
          </div>
        </div>

        {/* Indexer Head */}
        <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle">
          <div className="text-[10px] font-mono text-dark-text-muted flex items-center gap-1 uppercase">
            <Activity className="w-3 h-3 text-blue-400" />
            Indexer Head
          </div>
          <div className="mt-1 font-mono text-base font-bold text-blue-400">
            {isLoading ? '...' : `#${indexerState?.lastIndexedBlock || '0'}`}
          </div>
          <div className="text-[10px] text-dark-text-secondary font-mono">
            Synchronized Through
          </div>
        </div>

        {/* Block Lag */}
        <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle">
          <div className="text-[10px] font-mono text-dark-text-muted flex items-center gap-1 uppercase">
            <Clock className="w-3 h-3 text-amber-400" />
            Sync Lag
          </div>
          <div
            className={`mt-1 font-mono text-base font-bold ${
              (indexerState?.blockLag || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {isLoading ? '...' : `${indexerState?.blockLag ?? 0} BLOCKS`}
          </div>
          <div className="text-[10px] text-dark-text-secondary font-mono">
            {syncStatus === 'SYNCED' ? 'Zero Block Delay' : 'Pending Ingestion'}
          </div>
        </div>

        {/* Monitored Contracts */}
        <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle">
          <div className="text-[10px] font-mono text-dark-text-muted flex items-center gap-1 uppercase">
            <Layers className="w-3 h-3 text-purple-400" />
            Monitored Contracts
          </div>
          <div className="mt-1 font-mono text-base font-bold text-purple-400">
            {isLoading ? '...' : `${indexerState?.contractsMonitored?.length || 0} CONTRACTS`}
          </div>
          <div className="text-[10px] text-dark-text-secondary font-mono">
            {indexerState?.trackedPoolsCount || 0} Pools + 3 Singletons
          </div>
        </div>
      </div>

      {/* Status explanation */}
      <div className="text-[11px] text-dark-text-secondary font-mono flex items-center justify-between border-t border-dark-border-subtle/50 pt-2">
        <span>{statusDescription}</span>
        <span className="text-dark-text-muted text-[10px]">
          Total Indexed Events: <span className="text-dark-text-primary font-bold">{indexerState?.totalEventsIndexed ?? 0}</span>
        </span>
      </div>
    </div>
  );
};
