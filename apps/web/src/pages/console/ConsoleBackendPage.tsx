import React from 'react';
import { useHealth, useResetDemo } from '../../hooks/useCredify';
import {
  TechnicalPanel,
  TechnicalStatus,
  SystemNode,
} from '../../components/console';
import { Button } from '../../components/ui/Button';
import { Server, Radio, Database, RotateCcw, RefreshCw } from 'lucide-react';

export const ConsoleBackendPage: React.FC = () => {
  const { data: health, isLoading, refetch } = useHealth();
  const resetDemo = useResetDemo();

  const currentBlock = health?.blockNumber ? Number(health.blockNumber) : 0;

  const handleResetIndexer = async () => {
    await resetDemo.mutateAsync();
    refetch();
  };

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-yellow-950 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300 w-fit mb-1.5">
            <Server className="w-3.5 h-3.5" />
            <span>Process &amp; In-Memory Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-slate-950">
            Backend Runtime &amp; Indexer Diagnostics
          </h1>
          <p className="text-xs text-slate-700 font-sans font-medium mt-1">
            Internal daemon health, read-model projections, and asynchronous EVM sync loop performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            loading={isLoading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-sans bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold"
          >
            Poll Runtime
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={handleResetIndexer}
            loading={resetDemo.isPending}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs font-sans font-bold"
          >
            Reset &amp; Reindex
          </Button>
        </div>
      </div>

      {/* Backend Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 min-w-0">
        <SystemNode
          name="Fastify REST Engine"
          type="api-server"
          endpoint="localhost:4100"
          status={health?.ok ? 'ACTIVE' : 'DEGRADED'}
          statusLabel={health?.ok ? 'HEALTHY' : 'OFFLINE'}
          metrics={[
            { label: 'Protocol Network', value: health?.network ?? 'hardhat' },
            { label: 'Environment', value: 'Local Academic Node' },
          ]}
        />

        <SystemNode
          name="EVM Log Polling Worker"
          type="indexer"
          endpoint="lib/indexer.ts"
          status={health?.ok ? 'SYNCED' : 'OFFLINE'}
          statusLabel={health?.ok ? 'WORKER ACTIVE' : 'STOPPED'}
          metrics={[
            { label: 'Indexed Head', value: `#${currentBlock}` },
            { label: 'Indexed Pools', value: health?.poolCount ?? 0 },
          ]}
        />

        <SystemNode
          name="In-Memory Projection Store"
          type="registry"
          endpoint="lib/store.ts"
          status={health?.ok ? 'ACTIVE' : 'DEGRADED'}
          statusLabel={health?.ok ? 'MEMORY SYNCED' : 'DEGRADED'}
          metrics={[
            { label: 'Demo Mode', value: health?.demoMode ? 'ENABLED' : 'DISABLED' },
            { label: 'Consistency Mode', value: 'Deterministic Event Sourced' },
          ]}
        />
      </div>

      {/* Detailed Diagnostics Table */}
      <TechnicalPanel
        title="Runtime Daemon Telemetry"
        subtitle="Internal metrics captured by health inspection endpoint."
        badge={
          <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-950 font-bold">
            GET /health
          </span>
        }
      >
        <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 bg-white font-mono text-xs shadow-xs">
          <div className="p-4 flex items-center justify-between">
            <span className="text-slate-700 font-sans font-semibold">Process Status:</span>
            <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${health?.ok ? 'text-emerald-900 bg-emerald-50 border border-emerald-300' : 'text-rose-900 bg-rose-50 border border-rose-300'}`}>
              {health?.ok ? 'HEALTHY' : 'DEGRADED'}
            </span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <span className="text-slate-700 font-sans font-semibold">Node Connection:</span>
            <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${health?.ok ? 'text-emerald-900 bg-emerald-50 border border-emerald-300' : 'text-rose-900 bg-rose-50 border border-rose-300'}`}>
              {health?.ok ? 'CONNECTED (127.0.0.1:8545)' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <span className="text-slate-700 font-sans font-semibold">Chain ID Detected:</span>
            <span className="text-slate-950 font-bold font-mono text-sm">{health?.chainId || 31337}</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <span className="text-slate-700 font-sans font-semibold">Current Head Block:</span>
            <span className="text-slate-950 font-bold font-mono text-sm">#{currentBlock}</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <span className="text-slate-700 font-sans font-semibold">Indexer Polling State:</span>
            <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${health?.ok ? 'text-emerald-900 bg-emerald-50 border border-emerald-300' : 'text-amber-900 bg-yellow-100 border border-yellow-300'}`}>
              {health?.ok ? 'RUNNING (Synchronized with node)' : 'STOPPED'}
            </span>
          </div>
        </div>
      </TechnicalPanel>
    </div>
  );
};
