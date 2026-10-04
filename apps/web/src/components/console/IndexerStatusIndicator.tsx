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
  let statusBadgeColor = 'text-emerald-900 bg-emerald-50 border-emerald-300';
  let statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />;
  let statusLabel = 'SYNCED';
  let statusDescription = 'EVM log projections are fully synchronized with chain head.';

  if (isError || (indexerState && !indexerState.running)) {
    syncStatus = 'ERROR';
    statusBadgeColor = 'text-rose-900 bg-rose-50 border-rose-300';
    statusIcon = <XCircle className="w-3.5 h-3.5 text-rose-700" />;
    statusLabel = 'ERROR';
    statusDescription = 'RPC synchronization offline or event decoding failed.';
  } else if (indexerState) {
    if (indexerState.blockLag === 0) {
      syncStatus = 'SYNCED';
      statusBadgeColor = 'text-emerald-900 bg-emerald-50 border-emerald-300';
      statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />;
      statusLabel = 'SYNCED';
      statusDescription = 'Projections in lockstep with blockchain head.';
    } else if (indexerState.blockLag > 0 && indexerState.blockLag <= 5) {
      syncStatus = 'CATCHING UP';
      statusBadgeColor = 'text-yellow-950 bg-yellow-100 border-yellow-400';
      statusIcon = <Clock className="w-3.5 h-3.5 text-yellow-900" />;
      statusLabel = `CATCHING UP (-${indexerState.blockLag} BLOCKS)`;
      statusDescription = `Processing newly mined blocks ${indexerState.lastIndexedBlock} → ${indexerState.currentHeadBlock}.`;
    } else {
      syncStatus = 'STALE';
      statusBadgeColor = 'text-rose-900 bg-rose-50 border-rose-300';
      statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />;
      statusLabel = `STALE (-${indexerState.blockLag} BLOCKS)`;
      statusDescription = 'Block lag exceeds tolerance threshold. Reindex recommended.';
    }
  }

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 min-w-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="p-1.5 rounded-lg bg-[#ffe600] text-black border border-yellow-400 shadow-xs">
            <Database className="w-4 h-4" />
          </div>
          <span className="font-sans text-xs font-bold uppercase text-slate-950 tracking-wider">
            Indexer Synchronization Telemetry
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-sans border uppercase font-bold ${statusBadgeColor}`}
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
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-sans bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold"
          >
            Force Reindex
          </Button>
        )}
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 min-w-0">
        {/* Blockchain Head */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 min-w-0">
          <div className="text-xs font-sans font-bold text-slate-700 flex items-center gap-1.5 uppercase truncate">
            <Cpu className="w-3.5 h-3.5 text-slate-900" />
            <span>Blockchain Head</span>
          </div>
          <div className="font-mono text-xl font-black text-slate-950">
            {isLoading ? '...' : `#${indexerState?.currentHeadBlock || '0'}`}
          </div>
          <div className="text-xs text-slate-600 font-sans font-medium">
            Latest EVM Block Height
          </div>
        </div>

        {/* Indexer Head */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 min-w-0">
          <div className="text-xs font-sans font-bold text-slate-700 flex items-center gap-1.5 uppercase truncate">
            <Activity className="w-3.5 h-3.5 text-blue-800" />
            <span>Indexer Head</span>
          </div>
          <div className="font-mono text-xl font-black text-blue-950">
            {isLoading ? '...' : `#${indexerState?.lastIndexedBlock || '0'}`}
          </div>
          <div className="text-xs text-slate-600 font-sans font-medium">
            Synchronized Through
          </div>
        </div>

        {/* Block Lag */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 min-w-0">
          <div className="text-xs font-sans font-bold text-slate-700 flex items-center gap-1.5 uppercase truncate">
            <Clock className="w-3.5 h-3.5 text-slate-900" />
            <span>Sync Lag</span>
          </div>
          <div
            className={`font-mono text-xl font-black ${
              (indexerState?.blockLag || 0) > 0 ? 'text-amber-900' : 'text-emerald-900'
            }`}
          >
            {isLoading ? '...' : `${indexerState?.blockLag ?? 0} BLOCKS`}
          </div>
          <div className="text-xs text-slate-600 font-sans font-medium">
            {syncStatus === 'SYNCED' ? 'Zero Block Delay' : 'Pending Ingestion'}
          </div>
        </div>

        {/* Monitored Contracts */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 min-w-0">
          <div className="text-xs font-sans font-bold text-slate-700 flex items-center gap-1.5 uppercase truncate">
            <Layers className="w-3.5 h-3.5 text-purple-800" />
            <span>Monitored Contracts</span>
          </div>
          <div className="font-mono text-xl font-black text-purple-950">
            {isLoading ? '...' : `${indexerState?.contractsMonitored?.length || 0} CONTRACTS`}
          </div>
          <div className="text-xs text-slate-600 font-sans font-medium">
            {indexerState?.trackedPoolsCount || 0} Pools + 3 Singletons
          </div>
        </div>
      </div>

      {/* Status explanation */}
      <div className="text-xs text-slate-700 font-sans font-medium flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-200 pt-3 gap-1">
        <span>{statusDescription}</span>
        <span className="text-slate-600">
          Total Indexed Events: <span className="text-slate-950 font-bold font-mono">{indexerState?.totalEventsIndexed ?? 0}</span>
        </span>
      </div>
    </div>
  );
};
