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
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider text-brand-400 mb-1">
            <Network className="w-4 h-4" />
            <span>Interactive Spatial Model</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-dark-text-primary">
            System Architecture Topology
          </h1>
          <p className="text-xs text-dark-text-secondary mt-1">
            Spatial representation of Credify&apos;s 5 architectural strata, component boundaries, and live data flow vectors.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-xs font-sans shrink-0"
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* Flow Path Selector Toolbar */}
      <div className="p-5 bg-dark-bg-2 border border-dark-border-subtle/80 rounded-2xl shadow-depth-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-dark-text-muted flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-brand-400" />
            <span>Active Protocol Flow Highlighting</span>
          </span>
          <span className="text-xs text-dark-text-secondary">
            Click any stratum node to inspect invariants
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-micro cursor-pointer ${
                activeFlow === flow.id
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 font-semibold shadow-depth-subtle'
                  : 'bg-dark-bg-3/60 text-dark-text-secondary border border-dark-border-subtle/60 hover:text-dark-text-primary'
              }`}
            >
              {flow.label}
            </button>
          ))}
        </div>

        {/* Narrative Box */}
        <div className="p-4 rounded-xl bg-dark-bg-3/60 border border-dark-border-subtle/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-dark-text-primary">
              {currentFlow.title}
            </span>
            <span className="text-xs font-mono text-brand-400">Active Path</span>
          </div>
          <p className="text-xs text-dark-text-secondary leading-relaxed">
            {currentFlow.narrative}
          </p>
          <div className="text-xs font-mono text-dark-text-muted pt-1 border-t border-dark-border-subtle/40 truncate">
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
          <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
            ENFORCED ON-CHAIN
          </span>
        }
      >
        <div className="rounded-xl divide-y divide-dark-border-subtle/50 bg-dark-bg-3/40 border border-dark-border-subtle/60 text-xs">
          <div className="p-4 flex items-start gap-3.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-dark-text-primary">Controlled Disbursement Constraint</div>
              <p className="text-xs text-dark-text-secondary leading-relaxed">
                Funds deposited into a <code className="text-brand-300">LoanPool</code> can never be withdrawn directly to the borrower wallet. Capital can only flow to pre-authorized merchant addresses up to the specified spending cap.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-dark-text-primary">Pull-Claim Distribution Engine</div>
              <p className="text-xs text-dark-text-secondary leading-relaxed">
                Borrower repayments do not push transfers to lenders (avoiding denial-of-service vectors). Lenders independently invoke <code className="text-brand-300">claimRepayment()</code> to withdraw their pro-rata share.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-dark-text-primary">Capital-Weighted Governance Quorum</div>
              <p className="text-xs text-dark-text-secondary leading-relaxed">
                Default consensus requires voting weight exceeding the contract&apos;s quorum threshold (&gt;50.01% of contributed funds). Only verified syndicate participants with active capital at risk may cast votes.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-dark-text-primary">Authoritative Non-Decorative Reputation</div>
              <p className="text-xs text-dark-text-secondary leading-relaxed">
                Reputation score updates can never be arbitrarily set. Increments (+8 pts) and penalties (−20 pts) require verifiable emission of <code className="text-brand-300">LoanRepaid</code> or <code className="text-brand-300">LoanDefaulted</code> contract events.
              </p>
            </div>
          </div>
        </div>
      </TechnicalPanel>

      {/* Node Inspector Drawer */}
      <TopologyNodeInspector
        nodeId={selectedNode}
        isOpen={Boolean(selectedNode)}
        onClose={() => setSelectedNode(null)}
        telemetry={telemetry}
      />
    </div>
  );
};
