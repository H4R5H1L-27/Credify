import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

/**
 * Animated Checkmark with stroke draw-in and radiant bloom ring.
 * Inspired by Lordicon micro-interactions, implemented with pure code-native SVG & CSS.
 */
export const AnimatedCheckmark: React.FC<{
  size?: number;
  className?: string;
  color?: string;
}> = ({ size = 48, className, color = '#10B981' }) => {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDrawn(true), 40);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center select-none', className)}
      style={{ width: size, height: size }}
    >
      {/* Radiant Aura Bloom Ring */}
      <div
        className="absolute inset-0 rounded-full animate-ping opacity-25"
        style={{ backgroundColor: color, animationDuration: '1.8s' }}
      />
      <div
        className="absolute -inset-1 rounded-full blur-sm opacity-40"
        style={{ backgroundColor: color }}
      />

      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
        fill="none"
        className="relative z-10"
      >
        {/* Outer Circle Ring */}
        <circle
          cx="26"
          cy="26"
          r="24"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{
            strokeDasharray: 151,
            strokeDashoffset: drawn ? 0 : 151,
            transition: 'stroke-dashoffset 450ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="opacity-90"
        />

        {/* Dynamic Center Fill Glow */}
        <circle
          cx="26"
          cy="26"
          r="22"
          fill={color}
          fillOpacity={drawn ? 0.12 : 0}
          style={{ transition: 'fill-opacity 400ms ease-out 200ms' }}
        />

        {/* Checkmark Polyline Draw */}
        <path
          d="M15 27.5L22.5 35L37 19"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 36,
            strokeDashoffset: drawn ? 0 : 36,
            transition: 'stroke-dashoffset 380ms cubic-bezier(0.16, 1, 0.3, 1) 220ms',
          }}
        />
      </svg>
    </div>
  );
};

/**
 * Animated Institutional Shield with scanner gleam and verification lock.
 */
export const AnimatedShield: React.FC<{
  size?: number;
  className?: string;
  verified?: boolean;
}> = ({ size = 48, className, verified = true }) => {
  const strokeColor = verified ? '#10B981' : '#F59E0B';

  return (
    <div
      className={cn('relative inline-flex items-center justify-center select-none', className)}
      style={{ width: size, height: size }}
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 rounded-2xl blur-md opacity-35"
        style={{ backgroundColor: strokeColor }}
      />

      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        className="relative z-10"
      >
        <defs>
          <linearGradient id="shieldGleam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Shield Contour */}
        <path
          d="M24 4L9 10V22C9 32.5 15.5 41.5 24 44C32.5 41.5 39 32.5 39 22V10L24 4Z"
          fill={verified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)'}
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Center Checkmark or Lock */}
        {verified ? (
          <path
            d="M17 23.5L22 28.5L31 19.5"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <g transform="translate(18, 18)">
            <rect x="1" y="5" width="10" height="8" rx="2" stroke="#FFFFFF" strokeWidth="2" fill="none" />
            <path d="M3 5V3C3 1.9 3.9 1 5 1h2c1.1 0 2 1.9 2 3v2" stroke="#FFFFFF" strokeWidth="2" fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
};

/**
 * Animated Coin with gleam sweep and floating micro-motion for payments & disbursements.
 */
export const AnimatedCoin: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 48, className }) => {
  return (
    <div
      className={cn('relative inline-flex items-center justify-center select-none', className)}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full bg-amber-400/25 blur-md" />
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        className="relative z-10"
      >
        <circle cx="24" cy="24" r="21" fill="rgba(245, 166, 35, 0.15)" stroke="#F5A623" strokeWidth="2.5" />
        <circle cx="24" cy="24" r="16.5" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* Diamond Monogram */}
        <path
          d="M24 13L31 24L24 35L17 24Z"
          fill="none"
          stroke="#FCD34D"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M17 24H31M24 13V35"
          stroke="#F5A623"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

/**
 * Animated Sync Pulse for real-time node & indexer telemetry.
 */
export const AnimatedSyncPulse: React.FC<{
  active?: boolean;
  color?: 'emerald' | 'cobalt' | 'amber';
  className?: string;
}> = ({ active = true, color = 'emerald', className }) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      ring: 'rgba(16, 185, 129, 0.4)',
    },
    cobalt: {
      bg: 'bg-brand-500',
      text: 'text-brand-400',
      border: 'border-brand-500/30',
      ring: 'rgba(79, 107, 245, 0.4)',
    },
    amber: {
      bg: 'bg-amber-500',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      ring: 'rgba(245, 158, 11, 0.4)',
    },
  }[color];

  return (
    <span className={cn('relative inline-flex items-center justify-center w-3 h-3', className)}>
      {active && (
        <span
          className="absolute w-full h-full rounded-full animate-ping opacity-75"
          style={{ backgroundColor: colorMap.ring }}
        />
      )}
      <span className={cn('relative inline-flex rounded-full w-2 h-2', colorMap.bg)} />
    </span>
  );
};
