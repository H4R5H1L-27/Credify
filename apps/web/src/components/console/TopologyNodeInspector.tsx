import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TechnicalValue } from './TechnicalValue';
import { Link } from 'react-router-dom';
import {
  FileCode2,
  Cpu,
  Layers,
  ExternalLink,
  ShieldCheck,
  Database,
  Radio,
  Server,
  Wallet,
  Activity,
  ArrowRight,
  GitCommit,
  CheckCircle2,
} from 'lucide-react';

export type TopologyNodeId =
  | 'frontend'
  | 'wallet'
  | 'api'
  | 'contracts'
  | 'blockchain'
  | 'events'
  | 'indexer'
  | 'projection';

export interface TopologyNodeDetails {
  id: TopologyNodeId;
  name: string;
  layer: string;
  role: string;
  techStack: string;
  sourcePath: string;
  responsibilities: string[];
  invariants: string[];
  runtimeTelemetry?: Array<{ label: string; value: string }>;
  consoleRoute?: string;
  consoleRouteLabel?: string;
}

export interface TopologyNodeInspectorProps {
  nodeId: TopologyNodeId | null;
  isOpen: boolean;
  onClose: () => void;
  telemetry?: {
    headBlock?: string;
    indexerLag?: number;
    contractsCount?: number;
    eventsCount?: number;
    escrowBalance?: string;
  };
}

export const TOPOLOGY_NODES_MAP: Record<TopologyNodeId, (telemetry?: any) => TopologyNodeDetails> = {
  frontend: () => ({
    id: 'frontend',
    name: 'Web Application Frontend',
    layer: 'Stratum 1: Application Layer',
    role: 'Institutional participant interfaces & technical observability console',
    techStack: 'Vite, React 18, Tailwind CSS, TanStack Query, Lucide Icons',
    sourcePath: 'apps/web/src/',
    responsibilities: [
      'Renders role-specialized consoles for Borrowers, Lenders, and Suppliers.',
      'Integrates the Technical Console at /console for real-time auditability.',
      'Submits cryptographically signed intent through EIP-1193 wallet connectors.',
      'Refetches materialized read models via REST API with background polling.',
    ],
    invariants: [
      'Normal user navigation strictly separates financial participant views from evaluator tools.',
      'Never fabricates state; renders authoritative backend projections.',
    ],
    runtimeTelemetry: [
      { label: 'Environment', value: 'Vite SPA (Client)' },
      { label: 'HTTP Dev Port', value: ':5173' },
      { label: 'Routing Mode', value: 'Client-side React Router DOM v7' },
    ],
  }),

  wallet: () => ({
    id: 'wallet',
    name: 'Wallet Signer & Key Custody',
    layer: 'Stratum 2: Client Interface Layer',
    role: 'Client-side secp256k1 private key manager & transaction signer',
    techStack: 'Wagmi, Viem, Injected EIP-1193 / Hardhat Demo Principals',
    sourcePath: 'apps/web/src/components/wallet/',
    responsibilities: [
      'Manages deterministic keypairs for institutional demo principals (Borrower, Lenders, Suppliers, Operator).',
      'Constructs and signs EIP-1559 Ethereum transactions with gas estimates.',
      'Maintains non-custodial authorization; private keys never leave the client.',
    ],
    invariants: [
      'All state-mutating actions require valid secp256k1 cryptographic signatures.',
      'Technical Console cannot execute state mutations without authorized wallet signatures.',
    ],
    runtimeTelemetry: [
      { label: 'Signing Standard', value: 'ECDSA secp256k1' },
      { label: 'Chain ID Target', value: '31337 (0x7a69)' },
    ],
  }),

  api: () => ({
    id: 'api',
    name: 'Fastify API Gateway & Coordinator',
    layer: 'Stratum 2: Client Interface Layer',
    role: 'Authoritative REST read model server & off-chain verification orchestrator',
    techStack: 'Fastify v5, TypeScript, Zod, Viem client',
    sourcePath: 'apps/api/src/server.ts',
    responsibilities: [
      'Serves query read models and historical snapshots to frontend clients.',
      'Coordinates institutional KYC verification intake and approval lifecycle.',
      'Triggers synchronous log indexer synchronization on state transitions.',
      'Provides Technical Console observability endpoints at /api/v1/console/*.',
    ],
    invariants: [
      'Does not invent blockchain state; serves projections indexed strictly from verified EVM logs.',
      'Synchronizes indexer head prior to serving loan and agreement states.',
    ],
    runtimeTelemetry: [
      { label: 'Port', value: ':4100' },
      { label: 'Runtime', value: 'Node.js / Fastify' },
      { label: 'CORS Configuration', value: 'Enabled with credentials' },
    ],
  }),

  contracts: (telemetry) => ({
    id: 'contracts',
    name: 'Protocol Smart Contracts',
    layer: 'Stratum 3: Core Execution Layer',
    role: 'Deterministic Solidity state machines enforcing non-custodial financial invariants',
    techStack: 'Solidity ^0.8.28, Hardhat, OpenZeppelin primitives',
    sourcePath: 'contracts/contracts/',
    responsibilities: [
      'KYCRegistry: Maintains on-chain identity attestations.',
      'LoanFactory: Deterministically instantiates parameterized LoanPool escrow contracts.',
      'LoanPool: Custodies syndicate capital, enforces controlled disbursements to approved suppliers, and collects debt repayments.',
      'ReputationRegistry: Calculates and persists authoritative borrower credit scores based strictly on settlement outcomes.',
    ],
    invariants: [
      'Controlled Disbursement: Escrow funds can only flow to approved suppliers, never directly to the borrower.',
      'Pull-Claim Distributions: Lenders independently claim pro-rata shares (no push DOS vectors).',
      'Capital-Weighted Governance: Consensual defaults require >50.01% capital-weighted quorum.',
    ],
    runtimeTelemetry: [
      { label: 'Deployed Contracts', value: `${telemetry?.contractsCount ?? 4} Contracts` },
      { label: 'Total Escrow Balance', value: telemetry?.escrowBalance ?? 'Authoritative ETH' },
    ],
    consoleRoute: '/console/contracts',
    consoleRouteLabel: 'View Contracts Registry',
  }),

  blockchain: (telemetry) => ({
    id: 'blockchain',
    name: 'EVM Blockchain Node',
    layer: 'Stratum 3: Core Execution Layer',
    role: 'Authoritative consensus engine, gas accounting, and immutable ledger',
    techStack: 'Hardhat Network, JSON-RPC 2.0, EVM (Cancun hardfork)',
    sourcePath: 'hardhat.config.ts',
    responsibilities: [
      'Executes EVM bytecode deterministically across transactions.',
      'Mints blocks and generates cryptographic block header hashes and receipts.',
      'Maintains the global world state trie and emits log event receipts.',
    ],
    invariants: [
      'Transaction atomicity: execution either succeeds completely (0x1) or reverts cleanly (0x0).',
      'Cryptographic provenance: all state transitions are bound to block receipts and tx hashes.',
    ],
    runtimeTelemetry: [
      { label: 'Chain ID', value: '31337 (Localhost)' },
      { label: 'Current Block Height', value: telemetry?.headBlock ? `#${telemetry.headBlock}` : 'Querying...' },
      { label: 'RPC Endpoint', value: 'http://127.0.0.1:8545' },
    ],
    consoleRoute: '/console/blockchain',
    consoleRouteLabel: 'Open Blockchain Explorer',
  }),

  events: (telemetry) => ({
    id: 'events',
    name: 'EVM Log Receipts & Emissions',
    layer: 'Stratum 4: Log Emission & Ingestion',
    role: 'Immutable event log topics emitted by contract state transitions',
    techStack: 'Solidity indexed events, Keccak-256 topic hashes',
    sourcePath: 'contracts/contracts/*.sol',
    responsibilities: [
      'Emits real-time state change signals into block transaction receipts.',
      'Carries indexed topics (borrower, lender, merchant) and encoded data payloads.',
      'Serves as the tamper-evident boundary between smart contract state and backend projections.',
    ],
    invariants: [
      'Only contracts actually deployed emit events; zero synthetic logs.',
      'Events are permanent once confirmed in mined blocks.',
    ],
    runtimeTelemetry: [
      { label: 'Total Indexed Events', value: `${telemetry?.eventsCount ?? 0} Emissions` },
      { label: 'Decoded Events', value: 'Funded, SpendExecuted, Repayment, Reputation, KYC' },
    ],
    consoleRoute: '/console/events',
    consoleRouteLabel: 'View Live Event Stream',
  }),

  indexer: (telemetry) => ({
    id: 'indexer',
    name: 'Chain Indexer & Log Ingest Worker',
    layer: 'Stratum 4: Log Emission & Ingestion',
    role: 'Deterministic log scanner, ABI event decoder, and read-model materializer',
    techStack: 'TypeScript, Viem decodeEventLog, polling engine',
    sourcePath: 'apps/api/src/chain/indexer.ts',
    responsibilities: [
      'Scans blocks sequentially from lastIndexedBlock to chain head.',
      'Decodes event topics and parameters against contract ABIs.',
      'Transforms raw EVM logs into structured ActivityEvent records with actor roles.',
      'Synchronizes projections transactionally into the ProjectionStore.',
    ],
    invariants: [
      'Strictly idempotent: re-indexing historical blocks yields identical projection state.',
      'Zero synthetic event insertion: every indexed event corresponds to a verified on-chain log.',
    ],
    runtimeTelemetry: [
      { label: 'Synchronization Lag', value: `${telemetry?.indexerLag ?? 0} Blocks` },
      { label: 'Sync Status', value: (telemetry?.indexerLag ?? 0) === 0 ? 'SYNCED' : 'CATCHING UP' },
    ],
    consoleRoute: '/console/events',
    consoleRouteLabel: 'Check Indexer Telemetry',
  }),

  projection: () => ({
    id: 'projection',
    name: 'Materialized Projection Store',
    layer: 'Stratum 5: Materialized Read Model',
    role: 'Fast in-memory & file-persisted read model serving client queries',
    techStack: 'In-memory maps, JSON persistence, projection service',
    sourcePath: 'apps/api/src/store/projection.ts',
    responsibilities: [
      'Maintains pre-aggregated views for Loans, Positions, Disbursements, and Reputation.',
      'Enables sub-millisecond query responses without burdening the EVM RPC node.',
      'Serves authoritative historical outcome timelines and track records.',
    ],
    invariants: [
      'Subservient to the blockchain: projection can be completely wiped and re-derived from genesis.',
      'Never serves stale state when queries trigger indexer catchup.',
    ],
    runtimeTelemetry: [
      { label: 'Storage Engine', value: 'In-Memory + JSON Backing' },
      { label: 'Query Latency', value: '< 2ms' },
    ],
  }),
};

export const TopologyNodeInspector: React.FC<TopologyNodeInspectorProps> = ({
  nodeId,
  isOpen,
  onClose,
  telemetry,
}) => {
  if (!isOpen || !nodeId) return null;

  const nodeFactory = TOPOLOGY_NODES_MAP[nodeId];
  const node = nodeFactory ? nodeFactory(telemetry) : null;
  if (!node) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={node.name}
      description={node.layer}
      maxWidth="lg"
    >
      <div className="space-y-5 font-mono">
        {/* Role Banner */}
        <div className="p-3.5 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-2">
          <div className="text-[10px] text-dark-text-muted uppercase">Architectural Role</div>
          <div className="text-xs font-bold text-dark-text-primary font-sans leading-relaxed">
            {node.role}
          </div>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-dark-text-secondary">
            <span className="text-dark-text-muted">Tech Stack:</span>
            <span className="text-brand-400">{node.techStack}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-dark-text-secondary">
            <span className="text-dark-text-muted">Code Path:</span>
            <code className="text-dark-text-primary px-1.5 py-0.5 rounded bg-dark-bg-2 border border-dark-border-default text-[10px]">
              {node.sourcePath}
            </code>
          </div>
        </div>

        {/* Runtime Telemetry (if available) */}
        {node.runtimeTelemetry && node.runtimeTelemetry.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase text-dark-text-primary flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-brand-400" />
              Live Runtime Telemetry
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {node.runtimeTelemetry.map((metric) => (
                <div key={metric.label} className="p-2.5 rounded-md bg-dark-bg-2 border border-dark-border-subtle space-y-0.5">
                  <div className="text-[10px] text-dark-text-muted uppercase">{metric.label}</div>
                  <div className="text-dark-text-primary font-bold">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Responsibilities */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase text-dark-text-primary flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Core Technical Responsibilities
          </span>
          <ul className="space-y-1.5 font-sans text-xs text-dark-text-secondary">
            {node.responsibilities.map((resp, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-brand-400 font-bold shrink-0 font-mono">•</span>
                <span>{resp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Architectural Invariants */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase text-dark-text-primary flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Formal Architectural Invariants
          </span>
          <ul className="space-y-1.5 font-sans text-xs text-dark-text-secondary">
            {node.invariants.map((inv, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 font-bold shrink-0 font-mono">✓</span>
                <span>{inv}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer & Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-dark-border-subtle">
          {node.consoleRoute ? (
            <Link
              to={node.consoleRoute}
              className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-bold transition-colors"
            >
              <span>{node.consoleRouteLabel || 'Inspect in Console'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div />
          )}

          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Inspector
          </Button>
        </div>
      </div>
    </Modal>
  );
};
