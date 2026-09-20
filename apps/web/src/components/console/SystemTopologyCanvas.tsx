import React from 'react';
import type { TopologyNodeId } from './TopologyNodeInspector';
import { AnimatedBeam } from '../ui';
import {
  Monitor,
  Wallet,
  Server,
  FileCode2,
  Cpu,
  Layers,
  Radio,
  Database,
  ArrowDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export type TopologyFlowType =
  | 'ALL'
  | 'CONTRIBUTION'
  | 'DISBURSEMENT'
  | 'REPAYMENT'
  | 'KYC'
  | 'QUERY';

export interface SystemTopologyCanvasProps {
  activeFlow: TopologyFlowType;
  onSelectNode: (nodeId: TopologyNodeId) => void;
  telemetry?: {
    headBlock?: string;
    indexerLag?: number;
    contractsCount?: number;
    eventsCount?: number;
    escrowBalance?: string;
  };
}

export const SystemTopologyCanvas: React.FC<SystemTopologyCanvasProps> = ({
  activeFlow,
  onSelectNode,
  telemetry,
}) => {
  // Determine which nodes and connections are active for the selected flow
  const isNodeActive = (id: TopologyNodeId): boolean => {
    if (activeFlow === 'ALL') return true;
    switch (activeFlow) {
      case 'CONTRIBUTION':
      case 'DISBURSEMENT':
      case 'REPAYMENT':
        // Full on-chain transaction lifecycle
        return ['frontend', 'wallet', 'contracts', 'blockchain', 'events', 'indexer', 'projection', 'api'].includes(id);
      case 'KYC':
        // Institutional KYC attestation flow
        return ['frontend', 'api', 'wallet', 'contracts', 'blockchain', 'events', 'indexer', 'projection'].includes(id);
      case 'QUERY':
        // Read-only state query serving
        return ['frontend', 'api', 'projection'].includes(id);
      default:
        return true;
    }
  };

  const getStratumHeader = (title: string, subtitle: string) => (
    <div className="flex items-center justify-between pb-2.5 border-b border-dark-border-subtle/60 text-xs font-sans">
      <span className="font-semibold text-dark-text-muted uppercase tracking-wider text-xs">
        {title}
      </span>
      <span className="text-xs text-dark-text-secondary font-medium">
        {subtitle}
      </span>
    </div>
  );

  return (
    <div className="p-5 rounded-2xl bg-dark-bg-2 border border-dark-border-subtle space-y-6 relative overflow-hidden">
      {/* Background Depth Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-blue-500/5 pointer-events-none" />

      {/* STRATUM 1: APPLICATION LAYER */}
      <div className="space-y-3 relative z-10">
        {getStratumHeader('Stratum 1 — Application Layer', 'Institutional Client Experience & Technical Console')}

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => onSelectNode('frontend')}
            className={`p-4 rounded-xl border text-left transition-all duration-300 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer ${
              isNodeActive('frontend')
                ? 'bg-dark-bg-3 border-dark-border-default hover:border-brand-500/60 shadow-sm'
                : 'bg-dark-bg-3/40 border-dark-border-subtle/50 opacity-40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 group-hover:scale-105 transition-transform">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-dark-text-primary group-hover:text-brand-400 transition-colors flex items-center gap-2">
                  <span>Web Frontend UI</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-brand-500/15 border border-brand-500/30 text-brand-400">
                    Vite / React 18 SPA
                  </span>
                </div>
                <div className="text-xs text-dark-text-secondary font-sans mt-0.5">
                  Institutional financial consoles (Borrower, Lender, Supplier) + Complete /console Observability Suite.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-dark-text-muted self-end sm:self-auto shrink-0">
              <span className="group-hover:text-brand-400 transition-colors text-[11px]">Inspect Architecture →</span>
            </div>
          </button>
        </div>
      </div>

      {/* Dynamic Animated Beam Connections: Stratum 1 to Stratum 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 my-1">
        <AnimatedBeam
          active={isNodeActive('wallet')}
          pulseColor="#f59e0b"
          duration={2.2}
          label="EIP-1193 Intent Signing"
        />
        <AnimatedBeam
          active={isNodeActive('api')}
          pulseColor="#10b981"
          duration={2.4}
          delay={0.2}
          label="REST Queries & Verification Requests"
        />
      </div>

      {/* STRATUM 2: CLIENT INTERFACE LAYER */}
      <div className="space-y-3 relative z-10">
        {getStratumHeader('Stratum 2 — Client Interface Layer', 'Non-Custodial Key Manager & Authoritative REST Server')}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Node: Wallet Signer */}
          <button
            type="button"
            onClick={() => onSelectNode('wallet')}
            className={`p-4 rounded-xl border text-left transition-all duration-300 font-mono space-y-2 group cursor-pointer ${
              isNodeActive('wallet')
                ? 'bg-dark-bg-3 border-dark-border-default hover:border-amber-500/60 shadow-sm'
                : 'bg-dark-bg-3/40 border-dark-border-subtle/50 opacity-40'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:scale-105 transition-transform">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-dark-text-primary group-hover:text-amber-400 transition-colors">
                    Wallet Signer &amp; Custody
                  </div>
                  <div className="text-[10px] text-dark-text-muted">
                    secp256k1 EIP-1193 / Demo Principals
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-dark-bg-2 border border-dark-border-subtle text-amber-400">
                CLIENT SIGNER
              </span>
            </div>
            <p className="text-[11px] text-dark-text-secondary font-sans leading-relaxed">
              Constructs and cryptographically signs state-mutating transactions. Private keys remain strictly client-side.
            </p>
          </button>

          {/* Node: API Gateway */}
          <button
            type="button"
            onClick={() => onSelectNode('api')}
            className={`p-4 rounded-xl border text-left transition-all duration-300 font-mono space-y-2 group cursor-pointer ${
              isNodeActive('api')
                ? 'bg-dark-bg-3 border-dark-border-default hover:border-emerald-500/60 shadow-sm'
                : 'bg-dark-bg-3/40 border-dark-border-subtle/50 opacity-40'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition-transform">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-dark-text-primary group-hover:text-emerald-400 transition-colors">
                    Fastify API Gateway (:4100)
                  </div>
                  <div className="text-[10px] text-dark-text-muted">
                    REST Read Models &amp; Institutional Intake
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-dark-bg-2 border border-dark-border-subtle text-emerald-400">
                ACTIVE :4100
              </span>
            </div>
            <p className="text-[11px] text-dark-text-secondary font-sans leading-relaxed">
              Authoritative query server and off-chain KYC verification intake coordinator. Synchronizes indexer on demand.
            </p>
          </button>
        </div>
      </div>

      {/* Dynamic Animated Beam Connections: Stratum 2 to Stratum 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 my-1">
        <AnimatedBeam
          active={isNodeActive('contracts') && isNodeActive('wallet')}
          pulseColor="#f59e0b"
          duration={2.2}
          delay={0.4}
          label="eth_sendRawTransaction"
        />
        <AnimatedBeam
          active={isNodeActive('blockchain') && isNodeActive('api')}
          pulseColor="#38bdf8"
          duration={2.5}
          delay={0.6}
          label="JSON-RPC Consensus & Query Checks"
        />
      </div>

      {/* STRATUM 3: CORE EXECUTION LAYER */}
      <div className="space-y-3 relative z-10">
        {getStratumHeader('Stratum 3 — Core Execution Layer', 'Deterministic EVM State Machines & Localhost Consensus Engine')}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Node: Smart Contracts */}
          <button
            type="button"
            onClick={() => onSelectNode('contracts')}
            className={`p-4 rounded-xl border text-left transition-all duration-300 font-mono space-y-2.5 group cursor-pointer ${
              isNodeActive('contracts')
                ? 'bg-dark-bg-3 border-dark-border-default hover:border-blue-500/60 shadow-sm'
                : 'bg-dark-bg-3/40 border-dark-border-subtle/50 opacity-40'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 group-hover:scale-105 transition-transform">
                  <FileCode2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-dark-text-primary group-hover:text-blue-400 transition-colors">
                    Protocol Smart Contracts
                  </div>
                  <div className="text-[10px] text-dark-text-muted">
                    KYC, Factory, Reputation &amp; LoanPool Escrows
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                {telemetry?.contractsCount ?? 4} CONTRACTS
              </span>
            </div>
            <p className="text-[11px] text-dark-text-secondary font-sans leading-relaxed">
              Enforces non-custodial invariants: controlled disbursements to approved suppliers, pull claims, and consensus defaults.
            </p>
          </button>

          {/* Node: EVM Blockchain Node */}
          <button
            type="button"
            onClick={() => onSelectNode('blockchain')}
            className={`p-4 rounded-xl border text-left transition-all duration-300 font-mono space-y-2.5 group cursor-pointer ${
              isNodeActive('blockchain')
                ? 'bg-dark-bg-3 border-dark-border-default hover:border-brand-500/60 shadow-sm'
                : 'bg-dark-bg-3/40 border-dark-border-subtle/50 opacity-40'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 group-hover:scale-105 transition-transform">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-dark-text-primary group-hover:text-brand-400 transition-colors">
                    EVM Blockchain Node
                  </div>
                  <div className="text-[10px] text-dark-text-muted">
                    Hardhat Network (Chain ID 31337)
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-400 border border-brand-500/30">
                BLOCK #{telemetry?.headBlock || '0'}
              </span>
            </div>
            <p className="text-[11px] text-dark-text-secondary font-sans leading-relaxed">
              Executes deterministic EVM bytecode, mints block header proofs, and persists the immutable state trie and transaction receipts.
            </p>
          </button>
        </div>
      </div>

      {/* Dynamic Animated Beam Connections: Stratum 3 to Stratum 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 my-1">
        <AnimatedBeam
          active={isNodeActive('events')}
          pulseColor="#a855f7"
          duration={2.0}
          delay={0.8}
          label="EVM Log Topic Receipts"
        />
        <AnimatedBeam
          active={isNodeActive('indexer')}
          pulseColor="#a855f7"
          duration={2.0}
          delay={1.0}
          label="Sequential Block Log Ingestion"
        />
      </div>

      {/* STRATUM 4: LOG EMISSION & INGESTION LAYER */}
      <div className="space-y-3 relative z-10">
        {getStratumHeader('Stratum 4 — Log Emission & Ingestion', 'Tamper-Evident Receipts & Ingestion Worker')}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Node: EVM Events */}
          <button
            type="button"
            onClick={() => onSelectNode('events')}
            className={`p-4 rounded-xl border text-left transition-all duration-300 font-mono space-y-2.5 group cursor-pointer ${
              isNodeActive('events')
                ? 'bg-dark-bg-3 border-dark-border-default hover:border-purple-500/60 shadow-sm'
                : 'bg-dark-bg-3/40 border-dark-border-subtle/50 opacity-40'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-dark-text-primary group-hover:text-purple-400 transition-colors">
                    EVM Log Emissions
                  </div>
                  <div className="text-[10px] text-dark-text-muted">
                    Funded, Spend, Repayment, Reputation, KYC
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                {telemetry?.eventsCount ?? 0} LOGS
              </span>
            </div>
            <p className="text-[11px] text-dark-text-secondary font-sans leading-relaxed">
              Cryptographically verified event receipts emitted during contract execution. Serves as the authoritative source of truth.
            </p>
          </button>

          {/* Node: Chain Indexer */}
          <button
            type="button"
            onClick={() => onSelectNode('indexer')}
            className={`p-4 rounded-xl border text-left transition-all duration-300 font-mono space-y-2.5 group cursor-pointer ${
              isNodeActive('indexer')
                ? 'bg-dark-bg-3 border-dark-border-default hover:border-purple-500/60 shadow-sm'
                : 'bg-dark-bg-3/40 border-dark-border-subtle/50 opacity-40'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 group-hover:scale-105 transition-transform">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-dark-text-primary group-hover:text-purple-400 transition-colors">
                    Chain Indexer Worker
                  </div>
                  <div className="text-[10px] text-dark-text-muted">
                    apps/api/src/chain/indexer.ts
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                LAG: {telemetry?.indexerLag ?? 0} BLOCKS
              </span>
            </div>
            <p className="text-[11px] text-dark-text-secondary font-sans leading-relaxed">
              Sequential log parser decoding contract parameters against ABIs and updating projections with guaranteed idempotence.
            </p>
          </button>
        </div>
      </div>

      {/* Dynamic Animated Beam Connections: Stratum 4 to Stratum 5 */}
      <div className="max-w-md mx-auto w-full px-6 my-1">
        <AnimatedBeam
          active={isNodeActive('projection')}
          pulseColor="#6366f1"
          duration={1.8}
          delay={1.2}
          label="Transactional State Projection Mutation"
        />
      </div>

      {/* STRATUM 5: MATERIALIZED READ MODEL LAYER */}
      <div className="space-y-3 relative z-10">
        {getStratumHeader('Stratum 5 — Materialized Read Model', 'In-Memory & Persisted Query Projections')}

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => onSelectNode('projection')}
            className={`p-4 rounded-xl border text-left transition-all duration-300 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer ${
              isNodeActive('projection')
                ? 'bg-dark-bg-3 border-dark-border-default hover:border-indigo-500/60 shadow-sm'
                : 'bg-dark-bg-3/40 border-dark-border-subtle/50 opacity-40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 group-hover:scale-105 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-dark-text-primary group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                  <span>Materialized Projection Store</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                    In-Memory + JSON Backing
                  </span>
                </div>
                <div className="text-xs text-dark-text-secondary font-sans mt-0.5">
                  Pre-aggregated read models for credit facilities, lender equity positions, supplier disbursements, and borrower scores.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-dark-text-muted self-end sm:self-auto shrink-0">
              <span className="group-hover:text-indigo-400 transition-colors text-[11px]">Inspect Storage →</span>
            </div>
          </button>
        </div>
      </div>

      {/* Dynamic CQRS Read Serving Return Loop: Stratum 5 to Stratum 2/1 */}
      <div className="max-w-lg mx-auto w-full px-6 pt-3">
        <AnimatedBeam
          active={isNodeActive('projection') && isNodeActive('api')}
          pulseColor="#10b981"
          reverse
          direction="up"
          duration={2.2}
          delay={1.4}
          label="CQRS High-Speed Read Serving → Fastify API Gateway (:4100) & Web UI"
        />
      </div>
    </div>
  );
};
