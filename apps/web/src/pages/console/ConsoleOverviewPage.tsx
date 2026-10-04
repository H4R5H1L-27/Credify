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
    <div className="space-y-6 sm:space-y-8 min-w-0">
      {/* Asymmetric Hero Header */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch min-w-0">
        {/* Left 2/3: Dominant Node Telemetry Stage */}
        <div className="xl:col-span-2 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-6 min-w-0">
          <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 min-w-0">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-[#ffe600] text-black border border-yellow-400 font-bold shadow-xs">
                  <Activity className="w-4 h-4" />
                </span>
                <span className="text-xs font-sans font-bold uppercase tracking-wider text-yellow-950 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300">
                  EVM Runtime &amp; Protocol Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-slate-950">
                Technical Console Overview
              </h1>
              <p className="text-xs text-slate-700 font-sans leading-relaxed max-w-xl font-medium">
                Real-time protocol runtime inspection, authoritative state trees, and cryptographic verification evidence.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              loading={isRefreshing}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs font-sans shrink-0 self-start sm:self-auto bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold"
            >
              Poll EVM Node
            </Button>
          </div>

          {/* Core Metrics Band */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-slate-200 relative z-10 min-w-0">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 min-w-0">
              <span className="text-xs font-sans font-bold text-slate-700 block truncate">LATEST BLOCK</span>
              <div className="font-mono font-black text-2xl text-slate-950 flex items-center gap-1.5 truncate">
                {currentBlock !== null ? (
                  <>
                    <span>#<NumberTicker value={currentBlock} /></span>
                    <AnimatedSyncPulse color="emerald" />
                  </>
                ) : (
                  <span className="text-slate-400">#...</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 min-w-0">
              <span className="text-xs font-sans font-bold text-slate-700 block truncate">CHAIN ID</span>
              <div className="font-mono font-black text-2xl text-slate-950 truncate">
                {chainId}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 min-w-0">
              <span className="text-xs font-sans font-bold text-slate-700 block truncate">SYNCHRONIZATION</span>
              <div className="pt-1">
                <TechnicalStatus status={nodeConnected ? 'SYNCED' : 'OFFLINE'} size="sm" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 min-w-0">
              <span className="text-xs font-sans font-bold text-slate-700 block truncate">ACTIVE FACILITIES</span>
              <div className="font-mono font-black text-2xl text-slate-950 truncate">
                <NumberTicker value={poolCount} />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1/3: Quick Diagnostic Action Hub */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 min-w-0">
          <div className="space-y-1 min-w-0">
            <h2 className="text-base font-bold font-sans text-slate-950 tracking-tight">
              Diagnostic Shortcuts
            </h2>
            <p className="text-xs text-slate-700 font-sans leading-relaxed font-medium">
              Direct telemetry inspection routes for system auditors.
            </p>
          </div>

          <div className="space-y-2.5 min-w-0">
            <Link
              to="/console/architecture"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-yellow-50/70 border border-slate-200 hover:border-yellow-400 transition-all duration-micro group min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-900 group-hover:bg-[#ffe600] group-hover:border-yellow-400 transition-colors shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-sans font-bold text-slate-950 group-hover:text-black transition-colors truncate">
                    Interactive System Topology
                  </div>
                  <div className="text-xs font-sans text-slate-700 font-medium truncate">Spatial architecture diagram</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-black transition-colors shrink-0" />
            </Link>

            <Link
              to="/console/trace"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-yellow-50/70 border border-slate-200 hover:border-yellow-400 transition-all duration-micro group min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-900 group-hover:bg-[#ffe600] group-hover:border-yellow-400 transition-colors shrink-0">
                  <Binary className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-sans font-bold text-slate-950 group-hover:text-black transition-colors truncate">
                    Action Trace Engine
                  </div>
                  <div className="text-xs font-sans text-slate-700 font-medium truncate">10-stage execution trace</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-black transition-colors shrink-0" />
            </Link>

            <Link
              to="/console/replay"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-yellow-50/70 border border-slate-200 hover:border-yellow-400 transition-all duration-micro group min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-900 group-hover:bg-[#ffe600] group-hover:border-yellow-400 transition-colors shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-sans font-bold text-slate-950 group-hover:text-black transition-colors truncate">
                    Transaction Replay
                  </div>
                  <div className="text-xs font-sans text-slate-700 font-medium truncate">9-stage state reconstruction</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-black transition-colors shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* System Topology Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 min-w-0">
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
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-950 font-bold">
              EVM DEPLOYMENTS
            </span>
          }
          action={
            <Link to="/console/contracts">
              <Button size="sm" variant="outline" className="text-xs font-sans bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold">
                Inspect All →
              </Button>
            </Link>
          }
          isLoading={contractsLoading}
        >
          {evaluatorData?.contracts ? (
            <div className="space-y-3 font-sans text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-yellow-400 transition-colors">
                <div>
                  <span className="font-bold text-sm text-slate-950 block">KYCRegistry</span>
                  <div className="text-xs text-slate-600 font-medium">Identity Attestation Registry</div>
                </div>
                <TechnicalValue value={evaluatorData.contracts.kycRegistry} type="address" chars={5} />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-yellow-400 transition-colors">
                <div>
                  <span className="font-bold text-sm text-slate-950 block">LoanFactory</span>
                  <div className="text-xs text-slate-600 font-medium">Pool Instantiation Factory</div>
                </div>
                <TechnicalValue value={evaluatorData.contracts.loanFactory} type="address" chars={5} />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-yellow-400 transition-colors">
                <div>
                  <span className="font-bold text-sm text-slate-950 block">ReputationRegistry</span>
                  <div className="text-xs text-slate-600 font-medium">Authoritative Outcomes &amp; Scores</div>
                </div>
                <TechnicalValue value={evaluatorData.contracts.reputationRegistry} type="address" chars={5} />
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-sans text-slate-500 font-medium">
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
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/50 transition-all duration-micro flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-sm text-slate-950 group-hover:text-black transition-colors">
                  Blockchain
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">Node RPC &amp; Mined Blocks</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-black transition-colors" />
            </Link>

            <Link
              to="/console/transactions"
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/50 transition-all duration-micro flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-sm text-slate-950 group-hover:text-black transition-colors">
                  Transactions
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">Indexed EVM Receipts</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-black transition-colors" />
            </Link>

            <Link
              to="/console/events"
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/50 transition-all duration-micro flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-sm text-slate-950 group-hover:text-black transition-colors">
                  Live Events
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">Decoded Contract Logs</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-black transition-colors" />
            </Link>

            <Link
              to="/console/evaluator-tools"
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/50 transition-all duration-micro flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-sm text-slate-950 group-hover:text-black transition-colors">
                  Evaluator Tools
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">Time-Warp &amp; Test Actions</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-black transition-colors" />
            </Link>
          </div>
        </TechnicalPanel>
      </div>
    </div>
  );
};
