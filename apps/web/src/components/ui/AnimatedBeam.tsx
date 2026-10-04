import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface AnimatedBeamProps {
  className?: string;
  active?: boolean;
  startX?: number | string;
  startY?: number | string;
  endX?: number | string;
  endY?: number | string;
  curvature?: number;
  duration?: number;
  delay?: number;
  reverse?: boolean;
  color?: string;
  pulseColor?: string;
  label?: string;
  direction?: 'down' | 'up' | 'horizontal';
}

/**
 * Magic UI & Aceternity UI inspired AnimatedBeam component.
 * Renders an animated SVG vector track with travelling glowing light pulses.
 */
export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  className,
  active = true,
  startX = '50%',
  startY = 0,
  endX = '50%',
  endY = 48,
  curvature = 0,
  duration = 2,
  delay = 0,
  reverse = false,
  color = 'rgba(255, 255, 255, 0.12)',
  pulseColor = '#4f6bf5',
  label,
  direction = 'down',
}) => {
  const id = useId();
  const gradientId = `beam-grad-${id}`;
  const filterId = `beam-glow-${id}`;

  return (
    <div className={cn('relative flex flex-col items-center justify-center my-1', className)}>
      <svg
        className="w-full h-12 overflow-visible"
        viewBox="0 0 100 48"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={reverse ? '100%' : '0%'}
            x2="0"
            y2={reverse ? '0%' : '100%'}
          >
            <stop offset="0%" stopColor={pulseColor} stopOpacity="0" />
            <stop offset="50%" stopColor={pulseColor} stopOpacity={active ? '1' : '0.3'} />
            <stop offset="100%" stopColor={pulseColor} stopOpacity="0" />
            {active && (
              <animate
                attributeName={direction === 'horizontal' ? 'x1' : 'y1'}
                from={reverse ? '100%' : '-100%'}
                to={reverse ? '-100%' : '100%'}
                dur={`${duration}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            )}
            {active && (
              <animate
                attributeName={direction === 'horizontal' ? 'x2' : 'y2'}
                from={reverse ? '200%' : '0%'}
                to={reverse ? '0%' : '200%'}
                dur={`${duration}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            )}
          </linearGradient>
        </defs>

        {/* Base Static Track */}
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* Dynamic Animated Pulse Beam */}
        {active && (
          <>
            {/* Glow Aura */}
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={pulseColor}
              strokeWidth="4"
              strokeOpacity="0.4"
              filter={`url(#${filterId})`}
            />
            {/* Travelling Light Core */}
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>

      {/* Narrative Micro-Label */}
      {label && (
        <span
          className={cn(
            'absolute px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider transition-all duration-300 border shadow-depth-subtle',
            active
              ? 'bg-white text-slate-950 font-bold border-yellow-400 shadow-sm'
              : 'bg-white/80 text-slate-400 border-slate-200 opacity-60'
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
};
