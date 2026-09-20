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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-dark-text-primary uppercase flex items-center gap-2">
            <Server className="w-5 h-5 text-brand-400" />
            Backend Runtime &amp; Indexer Diagnostics
          </h1>
          <p className="text-xs text-dark-text-secondary mt-0.5">
            Internal daemon health, read-model projections, and asynchronous EVM sync loop performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            loading={isLoading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
          >
            Poll Runtime
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={handleResetIndexer}
            loading={resetDemo.isPending}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
          >
            Reset &amp; Reindex
          </Button>
        </div>
      </div>

      {/* Backend Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        badge={<span className="font-mono text-[10px] text-brand-400">GET /health</span>}
      >
        <div className="border border-dark-border-subtle rounded-lg divide-y divide-dark-border-subtle bg-dark-bg-3 font-mono text-xs">
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-dark-text-muted">Process Status:</span>
            <span className={health?.ok ? 'text-emerald-400 font-bold' : 'text-crimson-400 font-bold'}>
              {health?.ok ? 'HEALTHY' : 'DEGRADED'}
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-dark-text-muted">Node Connection:</span>
            <span className={health?.ok ? 'text-emerald-400 font-bold' : 'text-crimson-400 font-bold'}>
              {health?.ok ? 'CONNECTED (127.0.0.1:8545)' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-dark-text-muted">Chain ID Detected:</span>
            <span className="text-dark-text-primary font-bold">{health?.chainId || 31337}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-dark-text-muted">Current Head Block:</span>
            <span className="text-dark-text-primary font-bold">#{currentBlock}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-dark-text-muted">Indexer Polling State:</span>
            <span className={health?.ok ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {health?.ok ? 'RUNNING (Synchronized with node)' : 'STOPPED'}
            </span>
          </div>
        </div>
      </TechnicalPanel>
    </div>
  );
};
