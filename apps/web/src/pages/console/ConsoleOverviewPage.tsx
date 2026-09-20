import React from 'react';
import { useHealth, useEvaluatorContracts, useLoans } from '../../hooks/useCredify';
import {
  TechnicalPanel,
  SystemNode,
  TechnicalStatus,
  TechnicalValue,
} from '../../components/console';
import { Button } from '../../components/ui/Button';
import { NumberTicker, AnimatedSyncPulse } from '../../components/ui';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Radio,
  Server,
  ArrowRight,
  RefreshCw,
  Layers,
  ShieldCheck,
  Activity,
  Binary,
  RotateCcw,
  Zap,
} from 'lucide-react';

export const ConsoleOverviewPage: React.FC = () => {
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useHealth();
  const { data: evaluatorData, isLoading: contractsLoading, refetch: refetchContracts } = useEvaluatorContracts();
  const { data: loans = [], isLoading: loansLoading } = useLoans();

  const isRefreshing = healthLoading || contractsLoading;

  const handleRefresh = () => {
    refetchHealth();
    refetchContracts();
  };

  const currentBlock = health?.blockNumber ? Number(health.blockNumber) : null;
  const chainId = health?.chainId ?? 31337;
  const nodeConnected = Boolean(health?.ok);
  const poolCount = health?.poolCount ?? loans.length;
  const networkName = health?.network ?? 'hardhat';

  return (
    <div className="space-y-8">
      {/* Asymmetric Hero Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left 2/3: Dominant Node Telemetry Stage */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-2xl bg-dark-bg-2 border border-dark-border-subtle/80 shadow-depth-card relative overflow-hidden flex flex-col justify-between space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/25">
                  <Activity className="w-4 h-4" />
                </span>
                <span className="text-xs font-sans font-semibold uppercase tracking-wider text-brand-400">
                  EVM Runtime &amp; Protocol Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-dark-text-primary">
                Technical Console Overview
              </h1>
              <p className="text-xs text-dark-text-secondary font-sans leading-relaxed max-w-xl">
                Real-time protocol runtime inspection, authoritative state trees, and cryptographic verification evidence.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              loading={isRefreshing}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs font-sans shrink-0 self-start sm:self-auto"
            >
              Poll EVM Node
            </Button>
          </div>

          {/* Core Metrics Band */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-dark-border-subtle/50 relative z-10">
            <div className="space-y-1">
              <span className="text-xs font-sans text-dark-text-secondary block">LATEST BLOCK</span>
              <div className="font-mono font-black text-2xl text-dark-text-primary flex items-center gap-1.5">
                {currentBlock !== null ? (
                  <>
                    <span>#<NumberTicker value={currentBlock} /></span>
                    <AnimatedSyncPulse color="emerald" />
                  </>
                ) : (
                  <span className="text-dark-text-muted">#...</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-sans text-dark-text-secondary block">CHAIN ID</span>
              <div className="font-mono font-bold text-2xl text-dark-text-primary">
                {chainId}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-sans text-dark-text-secondary block">SYNCHRONIZATION</span>
              <div className="pt-1">
                <TechnicalStatus status={nodeConnected ? 'SYNCED' : 'OFFLINE'} size="sm" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-sans text-dark-text-secondary block">ACTIVE FACILITIES</span>
              <div className="font-mono font-bold text-2xl text-brand-400">
                <NumberTicker value={poolCount} />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1/3: Quick Diagnostic Action Hub */}
        <div className="p-6 sm:p-8 rounded-2xl bg-dark-bg-2 border border-dark-border-subtle/80 shadow-depth-card flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-sans text-dark-text-primary tracking-tight">
              Diagnostic Shortcuts
            </h2>
            <p className="text-xs text-dark-text-secondary font-sans leading-relaxed">
              Direct telemetry inspection routes for system auditors.
            </p>
          </div>

          <div className="space-y-2.5">
            <Link
              to="/console/architecture"
              className="flex items-center justify-between p-3 rounded-xl bg-dark-bg-3/60 hover:bg-dark-bg-3 border border-dark-border-subtle/60 hover:border-dark-border-default transition-all duration-micro group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-dark-bg-2 text-brand-400 group-hover:text-brand-300">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-sans font-semibold text-dark-text-primary group-hover:text-brand-300 transition-colors">
                    Interactive System Topology
                  </div>
                  <div className="text-xs font-sans text-dark-text-muted">Spatial architecture diagram</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-dark-text-muted group-hover:text-brand-400 transition-colors" />
            </Link>

            <Link
              to="/console/trace"
              className="flex items-center justify-between p-3 rounded-xl bg-dark-bg-3/60 hover:bg-dark-bg-3 border border-dark-border-subtle/60 hover:border-dark-border-default transition-all duration-micro group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-dark-bg-2 text-purple-400 group-hover:text-purple-300">
                  <Binary className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-sans font-semibold text-dark-text-primary group-hover:text-purple-300 transition-colors">
                    Action Trace Engine
                  </div>
                  <div className="text-xs font-sans text-dark-text-muted">10-stage execution trace</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-dark-text-muted group-hover:text-purple-400 transition-colors" />
            </Link>

            <Link
              to="/console/replay"
              className="flex items-center justify-between p-3 rounded-xl bg-dark-bg-3/60 hover:bg-dark-bg-3 border border-dark-border-subtle/60 hover:border-dark-border-default transition-all duration-micro group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-dark-bg-2 text-emerald-400 group-hover:text-emerald-300">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-sans font-semibold text-dark-text-primary group-hover:text-emerald-300 transition-colors">
                    Transaction Replay
                  </div>
                  <div className="text-xs font-sans text-dark-text-muted">9-stage state reconstruction</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-dark-text-muted group-hover:text-emerald-400 transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      {/* System Topology Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* EVM Node */}
        <SystemNode
          name="Local EVM Execution Node"
          type="evm-node"
          endpoint="http://127.0.0.1:8545"
          status={nodeConnected ? 'ACTIVE' : 'DISCONNECTED'}
          statusLabel={nodeConnected ? 'RPC ONLINE' : 'OFFLINE'}
          metrics={[
            { label: 'Chain ID', value: chainId },
            { label: 'Block Height', value: currentBlock !== null ? `#${currentBlock}` : '...' },
          ]}
        />

        {/* Indexer Daemon */}
        <SystemNode
          name="Deterministic Event Indexer"
          type="indexer"
          endpoint="Fastify Polling Worker"
          status={health?.ok ? 'SYNCED' : 'OFFLINE'}
          statusLabel={health?.ok ? 'ACTIVE' : 'STOPPED'}
          metrics={[
            { label: 'Network', value: networkName },
            { label: 'Sync Head', value: currentBlock !== null ? `#${currentBlock}` : '...' },
          ]}
        />

        {/* API Gateway */}
        <SystemNode
          name="Core REST &amp; Projection API"
          type="api-server"
          endpoint="http://localhost:4100"
          status={health?.ok ? 'ACTIVE' : 'DISCONNECTED'}
          statusLabel={health?.ok ? 'HEALTHY' : 'DEGRADED'}
          metrics={[
            { label: 'Tracked Pools', value: poolCount },
            { label: 'Demo Mode', value: health?.demoMode ? 'ACTIVE' : 'INACTIVE' },
          ]}
        />
      </div>

      {/* Protocol Architecture Summary Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Protocol Contracts */}
        <TechnicalPanel
          title="Authoritative Protocol Contracts"
          subtitle="Immutable smart contract instances registered on local chain."
          badge={
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-dark-bg-3 border border-dark-border-subtle/80 text-dark-text-secondary font-medium">
              EVM DEPLOYMENTS
            </span>
          }
          action={
            <Link to="/console/contracts">
              <Button size="sm" variant="outline" className="text-xs font-sans">
                Inspect All →
              </Button>
            </Link>
          }
          isLoading={contractsLoading}
        >
          {evaluatorData?.contracts ? (
            <div className="space-y-3 font-sans text-xs">
              <div className="p-3.5 rounded-xl bg-dark-bg-3/50 border border-dark-border-subtle/60 flex items-center justify-between hover:border-dark-border-subtle transition-colors">
                <div>
                  <span className="font-bold text-sm text-dark-text-primary block">KYCRegistry</span>
                  <div className="text-xs text-dark-text-secondary">Identity Attestation Registry</div>
                </div>
                <TechnicalValue value={evaluatorData.contracts.kycRegistry} type="address" chars={5} />
              </div>

              <div className="p-3.5 rounded-xl bg-dark-bg-3/50 border border-dark-border-subtle/60 flex items-center justify-between hover:border-dark-border-subtle transition-colors">
                <div>
                  <span className="font-bold text-sm text-dark-text-primary block">LoanFactory</span>
                  <div className="text-xs text-dark-text-secondary">Pool Instantiation Factory</div>
                </div>
                <TechnicalValue value={evaluatorData.contracts.loanFactory} type="address" chars={5} />
              </div>

              <div className="p-3.5 rounded-xl bg-dark-bg-3/50 border border-dark-border-subtle/60 flex items-center justify-between hover:border-dark-border-subtle transition-colors">
                <div>
                  <span className="font-bold text-sm text-dark-text-primary block">ReputationRegistry</span>
                  <div className="text-xs text-dark-text-secondary">Authoritative Outcomes &amp; Scores</div>
                </div>
                <TechnicalValue value={evaluatorData.contracts.reputationRegistry} type="address" chars={5} />
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-sans text-dark-text-muted">
              Connecting to contract registry...
            </div>
          )}
        </TechnicalPanel>

        {/* Live Observability Subsystems Navigation */}
        <TechnicalPanel
          title="Observability Subsystems"
          subtitle="Verification telemetry and inspection routes."
          badge={<TechnicalStatus status="ACTIVE" size="sm" />}
        >
          <div className="grid grid-cols-2 gap-3 text-xs font-sans">
            <Link
              to="/console/blockchain"
              className="p-4 rounded-xl bg-dark-bg-3/50 border border-dark-border-subtle/60 hover:border-dark-border-default hover:bg-dark-bg-3 transition-all duration-micro flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-sm text-dark-text-primary group-hover:text-brand-300 transition-colors">
                  Blockchain
                </div>
                <div className="text-xs text-dark-text-muted mt-0.5">Node RPC &amp; Mined Blocks</div>
              </div>
              <ArrowRight className="w-4 h-4 text-dark-text-muted group-hover:text-brand-400 transition-colors" />
            </Link>

            <Link
              to="/console/transactions"
              className="p-4 rounded-xl bg-dark-bg-3/50 border border-dark-border-subtle/60 hover:border-dark-border-default hover:bg-dark-bg-3 transition-all duration-micro flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-sm text-dark-text-primary group-hover:text-brand-300 transition-colors">
                  Transactions
                </div>
                <div className="text-xs text-dark-text-muted mt-0.5">Indexed EVM Receipts</div>
              </div>
              <ArrowRight className="w-4 h-4 text-dark-text-muted group-hover:text-brand-400 transition-colors" />
            </Link>

            <Link
              to="/console/events"
              className="p-4 rounded-xl bg-dark-bg-3/50 border border-dark-border-subtle/60 hover:border-dark-border-default hover:bg-dark-bg-3 transition-all duration-micro flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-sm text-dark-text-primary group-hover:text-brand-300 transition-colors">
                  Live Events
                </div>
                <div className="text-xs text-dark-text-muted mt-0.5">Decoded Contract Logs</div>
              </div>
              <ArrowRight className="w-4 h-4 text-dark-text-muted group-hover:text-brand-400 transition-colors" />
            </Link>

            <Link
              to="/console/evaluator-tools"
              className="p-4 rounded-xl bg-dark-bg-3/50 border border-dark-border-subtle/60 hover:border-dark-border-default hover:bg-dark-bg-3 transition-all duration-micro flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-sm text-dark-text-primary group-hover:text-brand-300 transition-colors">
                  Evaluator Tools
                </div>
                <div className="text-xs text-dark-text-muted mt-0.5">Time-Warp &amp; Test Actions</div>
              </div>
              <ArrowRight className="w-4 h-4 text-dark-text-muted group-hover:text-brand-400 transition-colors" />
            </Link>
          </div>
        </TechnicalPanel>
      </div>
    </div>
  );
};
