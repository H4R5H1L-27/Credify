import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { consoleApi } from '../../lib/api';
import { formatEther } from '../../lib/utils';
import {
  TechnicalPanel,
  SystemTopologyCanvas,
  TopologyNodeInspector,
  type TopologyNodeId,
  type TopologyFlowType,
} from '../../components/console';
import { Button } from '../../components/ui/Button';
import {
  Network,
  ShieldCheck,
  CheckCircle2,
  GitCommit,
  RefreshCw,
  Layers,
  ArrowRight,
  Zap,
} from 'lucide-react';

export const ConsoleArchitecturePage: React.FC = () => {
  const [activeFlow, setActiveFlow] = useState<TopologyFlowType>('ALL');
  const [selectedNode, setSelectedNode] = useState<TopologyNodeId | null>(null);

  // Fetch live indexer state
  const { data: indexerState, refetch: refetchIndexer } = useQuery({
    queryKey: ['console', 'indexer'],
    queryFn: () => consoleApi.getIndexerState(),
    refetchInterval: 5000,
  });

  // Fetch live contracts
  const { data: contracts = [], refetch: refetchContracts } = useQuery({
    queryKey: ['console', 'contracts'],
    queryFn: () => consoleApi.getContracts(),
    refetchInterval: 5000,
  });

  // Fetch live events
  const { data: events = [], refetch: refetchEvents } = useQuery({
    queryKey: ['console', 'events'],
    queryFn: () => consoleApi.getEvents({ limit: 1 }),
    refetchInterval: 5000,
  });

  const totalEscrowWei = useMemo(() => {
    return contracts
      .filter((c) => c.type === 'POOL')
      .reduce((acc, c) => {
        try {
          return acc + BigInt(c.balanceWei || '0');
        } catch {
          return acc;
        }
      }, BigInt(0));
  }, [contracts]);

  const telemetry = {
    headBlock: indexerState?.currentHeadBlock,
    indexerLag: indexerState?.blockLag,
    contractsCount: contracts.length,
    eventsCount: indexerState?.totalEventsIndexed,
    escrowBalance: `${formatEther(totalEscrowWei.toString(), 4)} ETH`,
  };

  const handleRefresh = () => {
    refetchIndexer();
    refetchContracts();
    refetchEvents();
  };

  const flowDescriptions: Record<TopologyFlowType, { title: string; narrative: string; path: string }> = {
    ALL: {
      title: 'Full Protocol Structural Topology',
      narrative: 'Complete architectural map across 5 strata: Application, Client Interfaces, Core EVM Execution, Log Emission & Ingest, and Materialized Projections.',
      path: 'Frontend ↔ Wallet & API ↔ Contracts & Blockchain ↔ Events & Indexer ↔ Projection Store',
    },
    CONTRIBUTION: {
      title: 'Lender Capital Contribution Flow',
      narrative: 'Lender commits ETH to a syndicate credit facility. The wallet signs eth_sendRawTransaction, executing contribute() on LoanPool. Emits Funded log, triggering indexer projection updates.',
      path: 'Frontend → Wallet Signer → LoanPool.contribute() → EVM Blockchain → Funded Event → Chain Indexer → Projection Store → API Gateway → Frontend',
    },
    DISBURSEMENT: {
      title: 'Controlled Supplier Disbursement Flow',
      narrative: 'Borrower initiates payment for pre-approved category invoice. Escrow transfers ETH directly to approved merchant wallet without allowing borrower diversion.',
      path: 'Frontend → Wallet Signer → LoanPool.spend() → EVM Blockchain → SpendExecuted Event → Chain Indexer → Projection Store → API Gateway → Frontend',
    },
    REPAYMENT: {
      title: 'Debt Service & Dividend Distribution Flow',
      narrative: 'Borrower satisfies principal plus interest. RepaymentReceived event increments syndicate dividends. Terminal repayment triggers ReputationUpdated (+8 pts).',
      path: 'Frontend → Wallet Signer → LoanPool.repay() → EVM Blockchain → RepaymentReceived & LoanRepaid → Chain Indexer → ReputationRegistry & Projection Store',
    },
    KYC: {
      title: 'Institutional KYC Attestation Flow',
      narrative: 'Participant submits structured credentials. Reviewer attests identity on-chain via KYCRegistry.setVerified(). Grants protocol facility authorization.',
      path: 'Frontend → API Gateway → Verification Store → Wallet Signer → KYCRegistry.setVerified() → VerificationUpdated → Chain Indexer → Projection Store',
    },
    QUERY: {
      title: 'Materialized Read Model Serving Flow',
      narrative: 'Frontend components query pre-aggregated views (loan summaries, positions, historical timelines) in < 2ms without putting RPC load on the EVM node.',
      path: 'Frontend → API Gateway (:4100) → Projection Store → API Gateway → Frontend',
    },
  };

  const currentFlow = flowDescriptions[activeFlow];

  return (
    <div className="space-y-6 sm:space-y-8 font-sans min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-yellow-950 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300 w-fit mb-1.5">
            <Network className="w-3.5 h-3.5" />
            <span>Interactive Spatial Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            System Architecture Topology
          </h1>
          <p className="text-xs text-slate-700 font-sans font-medium mt-1">
            Spatial representation of Credify&apos;s 5 architectural strata, component boundaries, and live data flow vectors.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-xs font-sans shrink-0 bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold"
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* Flow Path Selector Toolbar */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 min-w-0">
        <div className="flex items-center justify-between min-w-0">
          <span className="text-xs font-bold uppercase text-slate-800 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-yellow-900" />
            <span>Active Protocol Flow Highlighting</span>
          </span>
          <span className="text-xs text-slate-600 font-medium">
            Click any stratum node to inspect invariants
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Strata' },
            { id: 'CONTRIBUTION', label: 'Lender Funding' },
            { id: 'DISBURSEMENT', label: 'Supplier Spending' },
            { id: 'REPAYMENT', label: 'Debt Service' },
            { id: 'KYC', label: 'Identity Attestation' },
            { id: 'QUERY', label: 'Read Model Queries' },
          ].map((flow) => (
            <button
              key={flow.id}
              type="button"
              onClick={() => setActiveFlow(flow.id as TopologyFlowType)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-micro cursor-pointer ${
                activeFlow === flow.id
                  ? 'bg-[#ffe600] text-black border border-yellow-400 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:text-black hover:bg-slate-100'
              }`}
            >
              {flow.label}
            </button>
          ))}
        </div>

        {/* Narrative Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <span className="text-sm font-bold text-slate-950 truncate">
              {currentFlow.title}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-100 border border-yellow-300 text-yellow-950 font-mono shrink-0">
              Active Path
            </span>
          </div>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {currentFlow.narrative}
          </p>
          <div className="text-xs font-mono text-slate-600 pt-1.5 border-t border-slate-200 truncate font-semibold">
            {currentFlow.path}
          </div>
        </div>
      </div>

      {/* Spatial Canvas Container */}
      <SystemTopologyCanvas
        activeFlow={activeFlow}
        onSelectNode={(id) => setSelectedNode(id)}
        telemetry={telemetry}
      />

      {/* Security Invariants Reference Matrix */}
      <TechnicalPanel
        title="Protocol Security Invariants & Guarantees"
        subtitle="Immutable non-custodial constraints enforced cryptographically by smart contract bytecode."
        badge={
          <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold">
            ENFORCED ON-CHAIN
          </span>
        }
      >
        <div className="rounded-xl divide-y divide-slate-200 bg-white border border-slate-200 text-xs shadow-xs">
          <div className="p-4 flex items-start gap-3.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-slate-950">Controlled Disbursement Constraint</div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Funds deposited into a <code className="bg-yellow-50 px-1 py-0.5 rounded border border-yellow-300 text-yellow-950 font-bold">LoanPool</code> can never be withdrawn directly to the borrower wallet. Capital can only flow to pre-authorized merchant addresses up to the specified spending cap.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-slate-950">Deterministic Pro-Rata Dividend Entitlement</div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Repayments are distributed mathematically based on contribution share basis points (<code className="bg-slate-100 px-1 py-0.5 rounded border border-slate-300 text-slate-900 font-bold font-mono">shareBps</code>). Lenders execute pull-based withdrawals, preventing gas exhaustion denial of service.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-slate-950">Decentralized Default Consensus Protocol</div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Default declarations require democratic majority vote by capital contributors (<code className="bg-slate-100 px-1 py-0.5 rounded border border-slate-300 text-slate-900 font-bold font-mono">&gt; 50% contributedWei</code>). Defaults permanently penalize the borrower&apos;s authoritative on-chain reputation score by -30 points.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-slate-950">Institutional Attestation Prerequisite</div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                All pool instantiation, capital contributions, and supplier disbursements require active verification in the <code className="bg-yellow-50 px-1 py-0.5 rounded border border-yellow-300 text-yellow-950 font-bold">KYCRegistry</code>, preventing unauthorized state manipulation.
              </p>
            </div>
          </div>
        </div>
      </TechnicalPanel>

      {/* Node Inspector Modal */}
      <TopologyNodeInspector
        nodeId={selectedNode}
        isOpen={Boolean(selectedNode)}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
};
