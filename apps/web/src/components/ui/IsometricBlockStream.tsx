import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { ArrowRight } from 'lucide-react';

export interface IsometricBlockData {
  number: string;
  hash: string;
  parentHash?: string;
  gasUsed: string;
  gasLimit: string;
  transactionCount: number;
  timestamp: number | string;
}

export interface IsometricBlockStreamProps {
  blocks: IsometricBlockData[];
  onSelectBlock?: (blockNumber: string) => void;
  className?: string;
}

/**
 * High-Fidelity 3D Isometric Chained Block Stream.
 * Visualizes EVM blocks linked together with cryptographic parent-hash beams in 3D isometric projection.
 */
export const IsometricBlockStream: React.FC<IsometricBlockStreamProps> = ({
  blocks,
  onSelectBlock,
  className,
}) => {
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  // Take the most recent 5 blocks for clear isometric presentation
  const displayBlocks = blocks.slice(0, 5);

  if (displayBlocks.length === 0) {
    return (
      <div className="p-8 text-center text-xs font-mono text-slate-500 font-medium">
        Waiting for initial EVM blocks...
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-x-auto no-scrollbar py-6 select-none', className)}>
      <div className="min-w-[780px] flex items-center justify-between px-6 gap-3">
        {displayBlocks.map((blk, idx) => {
          const isLatest = idx === 0;
          const isHovered = hoveredBlock === blk.number;
          const gasUsed = BigInt(blk.gasUsed || '0');
          const gasLimit = BigInt(blk.gasLimit || '1');
          const gasPercent =
            gasLimit > 0n ? Math.min(100, Math.round(Number((gasUsed * 100n) / gasLimit))) : 0;
          const hasTxs = blk.transactionCount > 0;

          return (
            <React.Fragment key={blk.hash || blk.number}>
              {/* Isometric 3D Block Prism */}
              <div
                className="relative cursor-pointer group flex flex-col items-center"
                onMouseEnter={() => setHoveredBlock(blk.number)}
                onMouseLeave={() => setHoveredBlock(null)}
                onClick={() => onSelectBlock?.(blk.number)}
              >
                {/* 3D Isometric Prism Container */}
                <div
                  className={cn(
                    'relative transition-all duration-300 ease-out',
                    isHovered ? '-translate-y-3 scale-105' : 'translate-y-0'
                  )}
                  style={{ width: '130px', height: '140px' }}
                >
                  <svg
                    width="130"
                    height="140"
                    viewBox="0 0 130 140"
                    fill="none"
                    className="overflow-visible"
                  >
                    <defs>
                      {/* Top face gradient */}
                      <linearGradient id={`topGrad-${blk.number}`} x1="0" y1="0" x2="1" y2="1">
                        <stop
                          offset="0%"
                          stopColor={isLatest ? '#ffe600' : isHovered ? '#fef08a' : '#ffffff'}
                          stopOpacity="1"
                        />
                        <stop
                          offset="100%"
                          stopColor={isLatest ? '#facc15' : isHovered ? '#fde047' : '#f1f5f9'}
                          stopOpacity="1"
                        />
                      </linearGradient>

                      {/* Front face gradient */}
                      <linearGradient id={`frontGrad-${blk.number}`} x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={isLatest ? '#facc15' : '#f8fafc'}
                        />
                        <stop
                          offset="100%"
                          stopColor={isLatest ? '#eab308' : '#e2e8f0'}
                        />
                      </linearGradient>

                      {/* Right face gradient */}
                      <linearGradient id={`rightGrad-${blk.number}`} x1="0" y1="0" x2="1" y2="0">
                        <stop
                          offset="0%"
                          stopColor={isLatest ? '#eab308' : '#e2e8f0'}
                        />
                        <stop
                          offset="100%"
                          stopColor={isLatest ? '#ca8a04' : '#cbd5e1'}
                        />
                      </linearGradient>

                      {/* Isometric Bloom Aura */}
                      <filter id={`glow-${blk.number}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Ambient Radial Ground Shadow */}
                    <ellipse
                      cx="65"
                      cy="125"
                      rx="48"
                      ry="12"
                      fill="#0f172a"
                      fillOpacity={isHovered ? '0.15' : '0.08'}
                      className="transition-all duration-300"
                    />

                    {/* Luminous Core Glow on Latest or Hovered Block */}
                    {(isLatest || isHovered) && (
                      <ellipse
                        cx="65"
                        cy="60"
                        rx="55"
                        ry="45"
                        fill={isLatest ? 'rgba(255, 230, 0, 0.3)' : 'rgba(16, 185, 129, 0.2)'}
                        filter={`url(#glow-${blk.number})`}
                        className="animate-pulse-subtle pointer-events-none"
                      />
                    )}

                    {/* 1. TOP FACE (Rhombus in 30° Axonometric Projection) */}
                    <polygon
                      points="65,15 115,42 65,68 15,42"
                      fill={`url(#topGrad-${blk.number})`}
                      stroke={
                        isLatest
                          ? '#ca8a04'
                          : isHovered
                          ? '#eab308'
                          : '#cbd5e1'
                      }
                      strokeWidth="1.5"
                    />

                    {/* Top Face Gas Volume Indicator Grid */}
                    <polygon
                      points="65,25 100,43 65,60 30,43"
                      fill={gasPercent > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0, 0, 0, 0.04)'}
                      stroke={gasPercent > 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(0, 0, 0, 0.08)'}
                      strokeWidth="1"
                    />

                    {/* 2. LEFT / FRONT FACE */}
                    <polygon
                      points="15,42 65,68 65,118 15,92"
                      fill={`url(#frontGrad-${blk.number})`}
                      stroke={
                        isLatest
                          ? '#ca8a04'
                          : isHovered
                          ? '#eab308'
                          : '#cbd5e1'
                      }
                      strokeWidth="1.5"
                    />

                    {/* 3. RIGHT FACE */}
                    <polygon
                      points="65,68 115,42 115,92 65,118"
                      fill={`url(#rightGrad-${blk.number})`}
                      stroke={
                        isLatest
                          ? '#ca8a04'
                          : isHovered
                          ? '#eab308'
                          : '#cbd5e1'
                      }
                      strokeWidth="1.5"
                    />

                    {/* Wireframe Accents along Vertices */}
                    <line
                      x1="65"
                      y1="68"
                      x2="65"
                      y2="118"
                      stroke={isLatest ? '#a16207' : '#94a3b8'}
                      strokeWidth="1.5"
                    />

                    {/* Typography: Block Height on Front Face */}
                    <text
                      x="38"
                      y="82"
                      fill="#0f172a"
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                      transform="rotate(26, 38, 82) skewY(-2)"
                    >
                      #{blk.number}
                    </text>
                  </svg>
                </div>

                {/* Subtitle Telemetry Pill */}
                <div className="mt-2 text-center space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-center gap-1.5">
                    {isLatest ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ffe600] text-black border border-yellow-400 text-[9px] font-black shadow-xs">
                        HEAD BLOCK
                      </span>
                    ) : (
                      <span className="text-slate-700 font-bold text-[10px]">#{blk.number}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 font-medium">
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded font-bold',
                        hasTxs ? 'text-emerald-800 bg-emerald-100 border border-emerald-300' : 'text-slate-500 bg-slate-100'
                      )}
                    >
                      {blk.transactionCount} {blk.transactionCount === 1 ? 'tx' : 'txs'}
                    </span>
                    <span className="text-slate-500 font-medium truncate max-w-[65px]">
                      {blk.hash.slice(0, 6)}…
                    </span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Parent Hash Link Beam connecting Blocks */}
              {idx < displayBlocks.length - 1 && (
                <div className="flex-1 flex flex-col items-center justify-center px-1 mb-8 relative">
                  {/* Glowing Vector Connection Beam */}
                  <div className="w-full h-0.5 bg-slate-200 relative overflow-hidden rounded-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-emerald-400 to-yellow-500 animate-shimmer-slide opacity-85" />
                  </div>
                  {/* Arrow Indicator */}
                  <div className="mt-1 flex items-center gap-0.5 text-[9px] font-mono text-slate-500 font-semibold">
                    <span>parentHash</span>
                    <ArrowRight className="w-2.5 h-2.5 text-yellow-600" />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
