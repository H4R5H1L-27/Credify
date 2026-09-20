import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Box, ArrowRight, Hash, Clock, Fuel, ShieldCheck } from 'lucide-react';

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
      <div className="p-8 text-center text-xs font-mono text-dark-text-muted">
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
                          stopColor={isLatest ? '#4F6BF5' : isHovered ? '#3B82F6' : '#1F2432'}
                          stopOpacity={isLatest ? '0.6' : '0.8'}
                        />
                        <stop
                          offset="100%"
                          stopColor={isLatest ? '#202F8F' : isHovered ? '#1E3A8A' : '#141721'}
                          stopOpacity="0.9"
                        />
                      </linearGradient>

                      {/* Front face gradient */}
                      <linearGradient id={`frontGrad-${blk.number}`} x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={isLatest ? '#3B54D6' : '#171B26'}
                        />
                        <stop
                          offset="100%"
                          stopColor={isLatest ? '#182269' : '#0F1219'}
                        />
                      </linearGradient>

                      {/* Right face gradient */}
                      <linearGradient id={`rightGrad-${blk.number}`} x1="0" y1="0" x2="1" y2="0">
                        <stop
                          offset="0%"
                          stopColor={isLatest ? '#2C3FB5' : '#12151E'}
                        />
                        <stop
                          offset="100%"
                          stopColor={isLatest ? '#12173F' : '#0B0D13'}
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
                      fill="black"
                      fillOpacity={isHovered ? '0.55' : '0.35'}
                      className="transition-all duration-300"
                    />

                    {/* Luminous Core Glow on Latest or Hovered Block */}
                    {(isLatest || isHovered) && (
                      <ellipse
                        cx="65"
                        cy="60"
                        rx="55"
                        ry="45"
                        fill={isLatest ? 'rgba(79, 107, 245, 0.25)' : 'rgba(16, 185, 129, 0.25)'}
                        filter={`url(#glow-${blk.number})`}
                        className="animate-pulse-subtle pointer-events-none"
                      />
                    )}

                    {/* 1. TOP FACE (Rhombus in 30° Axonometric Projection) */}
                    {/* Points: (65, 15) -> (115, 42) -> (65, 68) -> (15, 42) */}
                    <polygon
                      points="65,15 115,42 65,68 15,42"
                      fill={`url(#topGrad-${blk.number})`}
                      stroke={
                        isLatest
                          ? 'rgba(104, 132, 248, 0.8)'
                          : isHovered
                          ? 'rgba(59, 130, 246, 0.6)'
                          : 'rgba(255, 255, 255, 0.12)'
                      }
                      strokeWidth="1.5"
                    />

                    {/* Top Face Gas Volume Indicator Grid */}
                    <polygon
                      points="65,25 100,43 65,60 30,43"
                      fill={gasPercent > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)'}
                      stroke={gasPercent > 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.08)'}
                      strokeWidth="1"
                    />

                    {/* 2. LEFT / FRONT FACE */}
                    {/* Points: (15, 42) -> (65, 68) -> (65, 118) -> (15, 92) */}
                    <polygon
                      points="15,42 65,68 65,118 15,92"
                      fill={`url(#frontGrad-${blk.number})`}
                      stroke={
                        isLatest
                          ? 'rgba(104, 132, 248, 0.7)'
                          : isHovered
                          ? 'rgba(59, 130, 246, 0.5)'
                          : 'rgba(255, 255, 255, 0.1)'
                      }
                      strokeWidth="1.5"
                    />

                    {/* 3. RIGHT FACE */}
                    {/* Points: (65, 68) -> (115, 42) -> (115, 92) -> (65, 118) */}
                    <polygon
                      points="65,68 115,42 115,92 65,118"
                      fill={`url(#rightGrad-${blk.number})`}
                      stroke={
                        isLatest
                          ? 'rgba(104, 132, 248, 0.7)'
                          : isHovered
                          ? 'rgba(59, 130, 246, 0.5)'
                          : 'rgba(255, 255, 255, 0.08)'
                      }
                      strokeWidth="1.5"
                    />

                    {/* Wireframe Accents along Vertices */}
                    <line
                      x1="65"
                      y1="68"
                      x2="65"
                      y2="118"
                      stroke={isLatest ? '#6884F8' : 'rgba(255, 255, 255, 0.2)'}
                      strokeWidth="1.5"
                    />

                    {/* Typography: Block Height on Front Face */}
                    <text
                      x="38"
                      y="82"
                      fill="#FFFFFF"
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
                      <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/40 text-[9px] font-bold">
                        HEAD BLOCK
                      </span>
                    ) : (
                      <span className="text-dark-text-muted text-[10px]">#{blk.number}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-dark-text-secondary">
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded font-semibold',
                        hasTxs ? 'text-emerald-400 bg-emerald-500/10' : 'text-dark-text-muted bg-dark-bg-3'
                      )}
                    >
                      {blk.transactionCount} {blk.transactionCount === 1 ? 'tx' : 'txs'}
                    </span>
                    <span className="text-dark-text-muted truncate max-w-[65px]">
                      {blk.hash.slice(0, 6)}…
                    </span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Parent Hash Link Beam connecting Blocks */}
              {idx < displayBlocks.length - 1 && (
                <div className="flex-1 flex flex-col items-center justify-center px-1 mb-8 relative">
                  {/* Glowing Vector Connection Beam */}
                  <div className="w-full h-0.5 bg-dark-border-default relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-500 via-emerald-400 to-brand-400 animate-shimmer-slide opacity-75" />
                  </div>
                  {/* Arrow Indicator */}
                  <div className="mt-1 flex items-center gap-0.5 text-[9px] font-mono text-dark-text-muted">
                    <span>parentHash</span>
                    <ArrowRight className="w-2.5 h-2.5 text-brand-400" />
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
