import React, { useRef, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Box, ShieldCheck, Cpu, Layers, Hash, Fuel, Terminal } from 'lucide-react';

export interface CryptoBlock3DProps {
  blockNumber?: number | string;
  blockHash?: string;
  parentHash?: string;
  txCount?: number;
  gasPercent?: number;
  stateRoot?: string;
  size?: number; // size in pixels (e.g. 220)
  className?: string;
}

/**
 * Pure Code-Native Interactive 3D Cryptographic Block Cube.
 * Features 6 facets of authoritative EVM blockchain telemetry,
 * interactive 3D cursor perspective rotation, and luminous holographic hairline edges.
 */
export const CryptoBlock3D: React.FC<CryptoBlock3DProps> = ({
  blockNumber = 42,
  blockHash = '0x8f3c...b12a',
  parentHash = '0x1a7b...9e4d',
  txCount = 3,
  gasPercent = 38,
  stateRoot = '0x5c42...ee19',
  size = 200,
  className,
}) => {
  const cubeRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState<{ x: number; y: number }>({ x: -18, y: 32 });
  const [isHovered, setIsHovered] = useState(false);
  const half = size / 2;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

    // Limit rotation range between -45 and 45 degrees
    setRotation({
      x: -y * 35 - 15,
      y: x * 45 + 30,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: -18, y: 32 });
  };

  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    backfaceVisibility: 'visible',
  };

  return (
    <div
      className={cn('relative flex items-center justify-center select-none', className)}
      style={{
        width: `${size + 100}px`,
        height: `${size + 100}px`,
        perspective: '900px',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ambient Floor Shadow */}
      <div
        className="absolute rounded-full bg-brand-500/10 blur-2xl pointer-events-none transition-all duration-300"
        style={{
          width: `${size * 1.4}px`,
          height: `${size * 0.4}px`,
          bottom: '20px',
          opacity: isHovered ? 0.7 : 0.4,
        }}
      />

      {/* 3D Cube Rigid Body */}
      <div
        ref={cubeRef}
        className="relative transition-transform duration-150 ease-out"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* 1. FRONT FACE — Head Block & Core Status */}
        <div
          style={{
            ...faceStyle,
            transform: `translateZ(${half}px)`,
          }}
          className="p-4 rounded-xl bg-dark-bg-1/90 border border-brand-500/40 backdrop-blur-md flex flex-col justify-between shadow-[0_0_20px_rgba(79,107,245,0.25)]"
        >
          <div className="flex items-center justify-between border-b border-dark-border-subtle pb-2">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-[10px] font-mono font-bold text-brand-300">BLOCK HEADER</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="text-center my-auto space-y-1 font-mono">
            <div className="text-3xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              #{blockNumber}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold">
              {txCount} {txCount === 1 ? 'TRANSACTION' : 'TRANSACTIONS'}
            </div>
          </div>

          <div className="text-[9px] font-mono text-dark-text-muted flex justify-between border-t border-dark-border-subtle pt-2">
            <span>CHAIN: 31337</span>
            <span>EVM HARDHAT</span>
          </div>
        </div>

        {/* 2. BACK FACE — Merkle & State Trie Roots */}
        <div
          style={{
            ...faceStyle,
            transform: `rotateY(180deg) translateZ(${half}px)`,
          }}
          className="p-4 rounded-xl bg-dark-bg-1/90 border border-emerald-500/30 backdrop-blur-md flex flex-col justify-between shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          <div className="flex items-center justify-between border-b border-dark-border-subtle pb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-mono font-bold text-emerald-400">STATE TRIE</span>
            </div>
            <span className="text-[9px] font-mono text-dark-text-muted">KECCAK256</span>
          </div>

          <div className="space-y-2 font-mono text-[10px] my-auto">
            <div>
              <span className="text-dark-text-muted block text-[9px]">STATE ROOT:</span>
              <span className="text-dark-text-primary truncate block font-bold">{stateRoot}</span>
            </div>
            <div>
              <span className="text-dark-text-muted block text-[9px]">CONSENSUS:</span>
              <span className="text-emerald-400 font-semibold">PoA INSTANT FINALITY</span>
            </div>
          </div>

          <div className="text-[9px] font-mono text-dark-text-muted border-t border-dark-border-subtle pt-2 text-right">
            CRYPTOGRAPHIC PROOF ✓
          </div>
        </div>

        {/* 3. RIGHT FACE — Hashes & Lineage */}
        <div
          style={{
            ...faceStyle,
            transform: `rotateY(90deg) translateZ(${half}px)`,
          }}
          className="p-4 rounded-xl bg-dark-bg-2/95 border border-brand-400/30 backdrop-blur-md flex flex-col justify-between shadow-[0_0_15px_rgba(79,107,245,0.15)]"
        >
          <div className="flex items-center gap-1.5 border-b border-dark-border-subtle pb-2">
            <Hash className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[10px] font-mono font-bold text-dark-text-primary">LINEAGE HASH</span>
          </div>

          <div className="space-y-2.5 font-mono text-[10px] my-auto">
            <div>
              <span className="text-dark-text-muted block text-[9px]">BLOCK HASH:</span>
              <span className="text-brand-300 font-bold break-all text-[9.5px]">{blockHash}</span>
            </div>
            <div>
              <span className="text-dark-text-muted block text-[9px]">PARENT HASH:</span>
              <span className="text-dark-text-secondary break-all text-[9.5px]">{parentHash}</span>
            </div>
          </div>

          <div className="text-[9px] font-mono text-dark-text-muted border-t border-dark-border-subtle pt-2">
            HEX PROVENANCE
          </div>
        </div>

        {/* 4. LEFT FACE — Gas Dynamics & Workload */}
        <div
          style={{
            ...faceStyle,
            transform: `rotateY(-90deg) translateZ(${half}px)`,
          }}
          className="p-4 rounded-xl bg-dark-bg-2/95 border border-amber-500/30 backdrop-blur-md flex flex-col justify-between shadow-[0_0_15px_rgba(245,158,11,0.15)]"
        >
          <div className="flex items-center gap-1.5 border-b border-dark-border-subtle pb-2">
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-mono font-bold text-amber-300">GAS UTILIZATION</span>
          </div>

          <div className="my-auto space-y-2 font-mono text-center">
            <div className="text-2xl font-bold text-dark-text-primary">
              {gasPercent}%
            </div>
            {/* 3D Gas Meter Bar */}
            <div className="w-full h-2 rounded-full bg-dark-bg-3 overflow-hidden border border-dark-border-subtle">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-amber-400"
                style={{ width: `${Math.max(5, gasPercent)}%` }}
              />
            </div>
            <div className="text-[9px] text-dark-text-muted">60,000,000 GAS LIMIT</div>
          </div>

          <div className="text-[9px] font-mono text-dark-text-muted border-t border-dark-border-subtle pt-2">
            EIP-1559 BASE FEE 0
          </div>
        </div>

        {/* 5. TOP FACE — Hardhat Consensus Monogram */}
        <div
          style={{
            ...faceStyle,
            transform: `rotateX(90deg) translateZ(${half}px)`,
          }}
          className="p-4 rounded-xl bg-brand-500/20 border border-brand-400/50 backdrop-blur-md flex flex-col items-center justify-center text-center shadow-[inset_0_0_25px_rgba(79,107,245,0.4)]"
        >
          <div className="w-12 h-12 rounded-xl bg-dark-bg-0/60 border border-brand-400/40 flex items-center justify-center text-brand-400 mb-2 shadow-depth-subtle">
            <Layers className="w-6 h-6" />
          </div>
          <div className="text-xs font-mono font-black text-brand-300 tracking-wider uppercase">
            CREDIFY NODE
          </div>
          <div className="text-[9px] font-mono text-brand-200/80 mt-0.5">
            LOCAL EVM RUNTIME
          </div>
        </div>

        {/* 6. BOTTOM FACE — Cryptographic Seal */}
        <div
          style={{
            ...faceStyle,
            transform: `rotateX(-90deg) translateZ(${half}px)`,
          }}
          className="p-4 rounded-xl bg-dark-bg-0/90 border border-dark-border-subtle flex flex-col items-center justify-center text-center"
        >
          <Terminal className="w-8 h-8 text-dark-text-muted mb-1" />
          <span className="text-[9px] font-mono text-dark-text-muted">IMMUTABLE HEAD</span>
        </div>
      </div>
    </div>
  );
};
