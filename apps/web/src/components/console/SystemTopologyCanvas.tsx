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
    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-sans">
      <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
        {title}
      </span>
      <span className="text-xs text-slate-600 font-medium">
        {subtitle}
      </span>
    </div>
  );

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6 relative overflow-hidden min-w-0">
      {/* Background Depth Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-100/30 via-transparent to-slate-100/40 pointer-events-none" />

      {/* STRATUM 1: APPLICATION LAYER */}
      <div className="space-y-3 relative z-10 min-w-0">
        {getStratumHeader('Stratum 1 — Application Layer', 'Institutional Client Experience & Technical Console')}

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => onSelectNode('frontend')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer ${
              isNodeActive('frontend')
                ? 'bg-slate-50 border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/50 shadow-xs'
                : 'bg-slate-50/50 border-slate-200 opacity-50'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-lg bg-yellow-100 border border-yellow-300 text-black group-hover:scale-105 transition-transform shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-slate-950 group-hover:text-black transition-colors flex items-center gap-2">
                  <span>Web Frontend UI</span>
                  <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-950">
                    React 18 SPA
                  </span>
                </div>
                <div className="text-xs text-slate-700 font-sans mt-0.5 font-medium truncate">
                  Institutional financial consoles (Borrower, Lender, Supplier) + Complete /console Observability Suite.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-700 self-end sm:self-auto shrink-0 font-sans font-semibold">
              <span className="group-hover:text-black transition-colors">Inspect Architecture →</span>
            </div>
          </button>
        </div>
      </div>

      {/* Dynamic Animated Beam Connections: Stratum 1 to Stratum 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 my-1">
        <AnimatedBeam
          active={isNodeActive('wallet')}
          pulseColor="#ca8a04"
          duration={2.2}
          label="EIP-1193 Intent Signing"
        />
        <AnimatedBeam
          active={isNodeActive('api')}
          pulseColor="#16a34a"
          duration={2.4}
          delay={0.2}
          label="REST Queries & Verification Requests"
        />
      </div>

      {/* STRATUM 2: CLIENT INTERFACE LAYER */}
      <div className="space-y-3 relative z-10 min-w-0">
        {getStratumHeader('Stratum 2 — Client Interface Layer', 'Non-Custodial Key Manager & Authoritative REST Server')}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 min-w-0">
          {/* Node: Wallet Signer */}
          <button
            type="button"
            onClick={() => onSelectNode('wallet')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 font-mono space-y-2 group cursor-pointer min-w-0 ${
              isNodeActive('wallet')
                ? 'bg-slate-50 border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/50 shadow-xs'
                : 'bg-slate-50/50 border-slate-200 opacity-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-950 group-hover:scale-105 transition-transform shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-950 group-hover:text-black transition-colors truncate">
                    Wallet Signer &amp; Custody
                  </div>
                  <div className="text-xs text-slate-600 font-sans font-medium truncate">
                    secp256k1 EIP-1193 / Demo Principals
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-950 font-bold shrink-0 font-sans">
                CLIENT SIGNER
              </span>
            </div>
            <p className="text-xs text-slate-700 font-sans font-medium leading-relaxed">
              Constructs and cryptographically signs state-mutating transactions. Private keys remain strictly client-side.
            </p>
          </button>

          {/* Node: API Gateway */}
          <button
            type="button"
            onClick={() => onSelectNode('api')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 font-mono space-y-2 group cursor-pointer min-w-0 ${
              isNodeActive('api')
                ? 'bg-slate-50 border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/50 shadow-xs'
                : 'bg-slate-50/50 border-slate-200 opacity-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 group-hover:scale-105 transition-transform shrink-0">
                  <Server className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-950 group-hover:text-black transition-colors truncate">
                    Fastify API Gateway (:4100)
                  </div>
                  <div className="text-xs text-slate-600 font-sans font-medium truncate">
                    REST Read Models &amp; Institutional Intake
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold shrink-0 font-sans">
                ACTIVE :4100
              </span>
            </div>
            <p className="text-xs text-slate-700 font-sans font-medium leading-relaxed">
              Authoritative query server and off-chain KYC verification intake coordinator. Synchronizes indexer on demand.
            </p>
          </button>
        </div>
      </div>

      {/* Dynamic Animated Beam Connections: Stratum 2 to Stratum 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 my-1">
        <AnimatedBeam
          active={isNodeActive('contracts') && isNodeActive('wallet')}
          pulseColor="#ca8a04"
          duration={2.2}
          delay={0.4}
          label="eth_sendRawTransaction"
        />
        <AnimatedBeam
          active={isNodeActive('blockchain') && isNodeActive('api')}
          pulseColor="#0284c7"
          duration={2.5}
          delay={0.6}
          label="JSON-RPC Consensus & Query Checks"
        />
      </div>

      {/* STRATUM 3: CORE EXECUTION LAYER */}
      <div className="space-y-3 relative z-10 min-w-0">
        {getStratumHeader('Stratum 3 — Core Execution Layer', 'Deterministic EVM State Machines & Localhost Consensus Engine')}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 min-w-0">
          {/* Node: Smart Contracts */}
          <button
            type="button"
            onClick={() => onSelectNode('contracts')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 font-mono space-y-2.5 group cursor-pointer min-w-0 ${
              isNodeActive('contracts')
                ? 'bg-slate-50 border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/50 shadow-xs'
                : 'bg-slate-50/50 border-slate-200 opacity-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-300 text-blue-800 group-hover:scale-105 transition-transform shrink-0">
                  <FileCode2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-950 group-hover:text-black transition-colors truncate">
                    Protocol Smart Contracts
                  </div>
                  <div className="text-xs text-slate-600 font-sans font-medium truncate">
                    KYC, Factory, Reputation &amp; LoanPool Escrows
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-300 font-bold shrink-0 font-sans">
                {telemetry?.contractsCount ?? 4} CONTRACTS
              </span>
            </div>
            <p className="text-xs text-slate-700 font-sans font-medium leading-relaxed">
              Enforces non-custodial invariants: controlled disbursements to approved suppliers, pull claims, and consensus defaults.
            </p>
          </button>

          {/* Node: EVM Blockchain Node */}
          <button
            type="button"
            onClick={() => onSelectNode('blockchain')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 font-mono space-y-2.5 group cursor-pointer min-w-0 ${
              isNodeActive('blockchain')
                ? 'bg-slate-50 border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/50 shadow-xs'
                : 'bg-slate-50/50 border-slate-200 opacity-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-950 group-hover:scale-105 transition-transform shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-950 group-hover:text-black transition-colors truncate">
                    EVM Blockchain Node
                  </div>
                  <div className="text-xs text-slate-600 font-sans font-medium truncate">
                    Hardhat Network (Chain ID 31337)
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-950 border border-yellow-400 font-bold shrink-0 font-sans">
                BLOCK #{telemetry?.headBlock || '0'}
              </span>
            </div>
            <p className="text-xs text-slate-700 font-sans font-medium leading-relaxed">
              Executes deterministic EVM bytecode, mints block header proofs, and persists the immutable state trie and transaction receipts.
            </p>
          </button>
        </div>
      </div>

      {/* Dynamic Animated Beam Connections: Stratum 3 to Stratum 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 my-1">
        <AnimatedBeam
          active={isNodeActive('events')}
          pulseColor="#9333ea"
          duration={2.0}
          delay={0.8}
          label="EVM Log Topic Receipts"
        />
        <AnimatedBeam
          active={isNodeActive('indexer')}
          pulseColor="#9333ea"
          duration={2.0}
          delay={1.0}
          label="Sequential Block Log Ingestion"
        />
      </div>

      {/* STRATUM 4: LOG EMISSION & INGESTION LAYER */}
      <div className="space-y-3 relative z-10 min-w-0">
        {getStratumHeader('Stratum 4 — Log Emission & Ingestion', 'Tamper-Evident Receipts & Ingestion Worker')}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 min-w-0">
          {/* Node: EVM Events */}
          <button
            type="button"
            onClick={() => onSelectNode('events')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 font-mono space-y-2.5 group cursor-pointer min-w-0 ${
              isNodeActive('events')
                ? 'bg-slate-50 border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/50 shadow-xs'
                : 'bg-slate-50/50 border-slate-200 opacity-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-purple-50 border border-purple-300 text-purple-800 group-hover:scale-105 transition-transform shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-950 group-hover:text-black transition-colors truncate">
                    EVM Log Emissions
                  </div>
                  <div className="text-xs text-slate-600 font-sans font-medium truncate">
                    Funded, Spend, Repayment, Reputation, KYC
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-300 font-bold shrink-0 font-sans">
                {telemetry?.eventsCount ?? 0} LOGS
              </span>
            </div>
            <p className="text-xs text-slate-700 font-sans font-medium leading-relaxed">
              Cryptographically verified event receipts emitted during contract execution. Serves as the authoritative source of truth.
            </p>
          </button>

          {/* Node: Chain Indexer */}
          <button
            type="button"
            onClick={() => onSelectNode('indexer')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 font-mono space-y-2.5 group cursor-pointer min-w-0 ${
              isNodeActive('indexer')
                ? 'bg-slate-50 border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/50 shadow-xs'
                : 'bg-slate-50/50 border-slate-200 opacity-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-purple-50 border border-purple-300 text-purple-800 group-hover:scale-105 transition-transform shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-950 group-hover:text-black transition-colors truncate">
                    Chain Indexer Worker
                  </div>
                  <div className="text-xs text-slate-600 font-sans font-medium truncate">
                    apps/api/src/chain/indexer.ts
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold shrink-0 font-sans">
                LAG: {telemetry?.indexerLag ?? 0} BLOCKS
              </span>
            </div>
            <p className="text-xs text-slate-700 font-sans font-medium leading-relaxed">
              Sequential log parser decoding contract parameters against ABIs and updating projections with guaranteed idempotence.
            </p>
          </button>
        </div>
      </div>

      {/* Dynamic Animated Beam Connections: Stratum 4 to Stratum 5 */}
      <div className="max-w-md mx-auto w-full px-6 my-1">
        <AnimatedBeam
          active={isNodeActive('projection')}
          pulseColor="#4f46e5"
          duration={1.8}
          delay={1.2}
          label="Transactional State Projection Mutation"
        />
      </div>

      {/* STRATUM 5: MATERIALIZED READ MODEL LAYER */}
      <div className="space-y-3 relative z-10 min-w-0">
        {getStratumHeader('Stratum 5 — Materialized Read Model', 'In-Memory & Persisted Query Projections')}

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => onSelectNode('projection')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer ${
              isNodeActive('projection')
                ? 'bg-slate-50 border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/50 shadow-xs'
                : 'bg-slate-50/50 border-slate-200 opacity-50'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-300 text-indigo-800 group-hover:scale-105 transition-transform shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-slate-950 group-hover:text-black transition-colors flex items-center gap-2">
                  <span>Materialized Projection Store</span>
                  <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-300 text-indigo-900">
                    In-Memory + JSON Backing
                  </span>
                </div>
                <div className="text-xs text-slate-700 font-sans mt-0.5 font-medium truncate">
                  Pre-aggregated read models for credit facilities, lender equity positions, supplier disbursements, and borrower scores.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-700 self-end sm:self-auto shrink-0 font-sans font-semibold">
              <span className="group-hover:text-black transition-colors">Inspect Storage →</span>
            </div>
          </button>
        </div>
      </div>

      {/* Dynamic CQRS Read Serving Return Loop: Stratum 5 to Stratum 2/1 */}
      <div className="max-w-lg mx-auto w-full px-6 pt-3">
        <AnimatedBeam
          active={isNodeActive('projection') && isNodeActive('api')}
          pulseColor="#16a34a"
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
