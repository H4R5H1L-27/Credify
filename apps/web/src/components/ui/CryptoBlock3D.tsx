import React, { useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { ShieldCheck, Cpu, Layers, Hash, Fuel, Terminal } from 'lucide-react';

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
 * interactive 3D cursor perspective rotation, and high-contrast yellow & white edges.
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
        className="absolute rounded-full bg-yellow-400/20 blur-2xl pointer-events-none transition-all duration-300"
        style={{
          width: `${size * 1.4}px`,
          height: `${size * 0.4}px`,
          bottom: '20px',
          opacity: isHovered ? 0.8 : 0.5,
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
          className="p-4 rounded-2xl bg-white/95 border-2 border-yellow-400 backdrop-blur-md flex flex-col justify-between shadow-[0_10px_30px_rgba(255,230,0,0.35)]"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-yellow-600" />
              <span className="text-[10px] font-mono font-bold text-yellow-900 uppercase">BLOCK HEADER</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="text-center my-auto space-y-1 font-mono">
            <div className="text-3xl font-black tracking-tight text-slate-950">
              #{blockNumber}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold">
              {txCount} {txCount === 1 ? 'TRANSACTION' : 'TRANSACTIONS'}
            </div>
          </div>

          <div className="text-[9px] font-mono text-slate-500 font-bold flex justify-between border-t border-slate-200 pt-2">
            <span>CONSENSUS VERIFIED</span>
            <span>EVM ACTIVE</span>
          </div>
        </div>

        {/* 2. BACK FACE — Merkle & State Trie Roots */}
        <div
          style={{
            ...faceStyle,
            transform: `rotateY(180deg) translateZ(${half}px)`,
          }}
          className="p-4 rounded-2xl bg-white/95 border-2 border-emerald-400 backdrop-blur-md flex flex-col justify-between shadow-[0_10px_30px_rgba(16,185,129,0.25)]"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-mono font-bold text-emerald-800">STATE TRIE</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 font-semibold">KECCAK256</span>
          </div>

          <div className="space-y-2 font-mono text-[10px] my-auto">
            <div>
              <span className="text-slate-500 block text-[9px] font-semibold">STATE ROOT:</span>
              <span className="text-slate-950 truncate block font-bold">{stateRoot}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] font-semibold">CONSENSUS:</span>
              <span className="text-emerald-700 font-bold">PoA INSTANT FINALITY</span>
            </div>
          </div>

          <div className="text-[9px] font-mono text-slate-500 font-bold border-t border-slate-200 pt-2 text-right">
            CRYPTOGRAPHIC PROOF ✓
          </div>
        </div>

        {/* 3. RIGHT FACE — Hashes & Lineage */}
        <div
          style={{
            ...faceStyle,
            transform: `rotateY(90deg) translateZ(${half}px)`,
          }}
          className="p-4 rounded-2xl bg-white/95 border-2 border-slate-300 backdrop-blur-md flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <Hash className="w-3.5 h-3.5 text-yellow-600" />
            <span className="text-[10px] font-mono font-bold text-slate-950">LINEAGE HASH</span>
          </div>

          <div className="space-y-2.5 font-mono text-[10px] my-auto">
            <div>
              <span className="text-slate-500 block text-[9px] font-semibold">BLOCK HASH:</span>
              <span className="text-slate-950 font-bold break-all text-[9.5px]">{blockHash}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] font-semibold">PARENT HASH:</span>
              <span className="text-slate-600 font-medium break-all text-[9.5px]">{parentHash}</span>
            </div>
          </div>

          <div className="text-[9px] font-mono text-slate-500 font-bold border-t border-slate-200 pt-2">
            HEX PROVENANCE
          </div>
        </div>

        {/* 4. LEFT FACE — Gas Dynamics & Workload */}
        <div
          style={{
            ...faceStyle,
            transform: `rotateY(-90deg) translateZ(${half}px)`,
          }}
          className="p-4 rounded-2xl bg-white/95 border-2 border-amber-300 backdrop-blur-md flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <Fuel className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-mono font-bold text-amber-900">GAS UTILIZATION</span>
          </div>

          <div className="my-auto space-y-2 font-mono text-center">
            <div className="text-2xl font-black text-slate-950">
              {gasPercent}%
            </div>
            {/* 3D Gas Meter Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-[#ffe600] to-amber-500"
                style={{ width: `${Math.max(5, gasPercent)}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-500 font-bold">60,000,000 GAS LIMIT</div>
          </div>

          <div className="text-[9px] font-mono text-slate-500 font-bold border-t border-slate-200 pt-2">
            EIP-1559 BASE FEE 0
          </div>
        </div>

        {/* 5. TOP FACE — Hardhat Consensus Monogram */}
        <div
          style={{
            ...faceStyle,
            transform: `rotateX(90deg) translateZ(${half}px)`,
          }}
          className="p-4 rounded-2xl bg-yellow-50 border-2 border-yellow-400 backdrop-blur-md flex flex-col items-center justify-center text-center shadow-[inset_0_0_25px_rgba(255,230,0,0.4)]"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#ffe600] border border-yellow-500 flex items-center justify-center text-black font-black mb-2 shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <div className="text-xs font-mono font-black text-slate-950 tracking-wider uppercase">
            CREDIFY NODE
          </div>
          <div className="text-[9px] font-mono text-yellow-950 font-bold mt-0.5">
            LOCAL EVM RUNTIME
          </div>
        </div>

        {/* 6. BOTTOM FACE — Cryptographic Seal */}
        <div
          style={{
            ...faceStyle,
            transform: `rotateX(-90deg) translateZ(${half}px)`,
          }}
          className="p-4 rounded-2xl bg-slate-100 border-2 border-slate-300 flex flex-col items-center justify-center text-center"
        >
          <Terminal className="w-8 h-8 text-slate-400 mb-1" />
          <span className="text-[9px] font-mono text-slate-600 font-bold">IMMUTABLE HEAD</span>
        </div>
      </div>
    </div>
  );
};
