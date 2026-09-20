import React from 'react';
import type { TraceStageStatus } from './ActionTraceEngine';
import { ArrowDown, AlertTriangle } from 'lucide-react';

export interface TraceConnectionProps {
  fromStatus: TraceStageStatus;
  toStatus: TraceStageStatus;
  label?: string;
  isFailureBranch?: boolean;
}

export const TraceConnection: React.FC<TraceConnectionProps> = ({
  fromStatus,
  toStatus,
  label,
  isFailureBranch,
}) => {
  let lineColor = 'border-dark-border-subtle';
  let arrowColor = 'text-dark-text-muted';
  let isDashed = false;
  let isPulsing = false;

  if (isFailureBranch || fromStatus === 'FAILED') {
    lineColor = 'border-rose-500/60';
    arrowColor = 'text-rose-400';
    isDashed = true;
  } else if (toStatus === 'SKIPPED') {
    lineColor = 'border-dark-border-subtle';
    arrowColor = 'text-dark-text-muted';
    isDashed = true;
  } else if (fromStatus === 'COMPLETED' && toStatus === 'COMPLETED') {
    lineColor = 'border-emerald-500/50';
    arrowColor = 'text-emerald-400';
  } else if (fromStatus === 'COMPLETED' && toStatus === 'ACTIVE') {
    lineColor = 'border-brand-500/80';
    arrowColor = 'text-brand-400';
    isPulsing = true;
  }

  return (
    <div className="flex flex-col items-center justify-center my-1 relative py-1 font-mono text-[10px]">
      {/* Connecting Vector */}
      <div
        className={`w-0.5 h-6 border-l-2 ${lineColor} ${
          isDashed ? 'border-dashed' : ''
        } ${isPulsing ? 'motion-safe:animate-pulse' : ''}`}
      />

      <div className="flex items-center gap-1.5 my-0.5">
        <ArrowDown className={`w-3.5 h-3.5 ${arrowColor}`} />
        {label && (
          <span
            className={`px-2 py-0.5 rounded bg-dark-bg-2 border border-dark-border-subtle text-[10px] ${
              isFailureBranch ? 'text-rose-400 border-rose-500/30 font-bold' : 'text-dark-text-muted'
            }`}
          >
            {label}
          </span>
        )}
      </div>

      <div
        className={`w-0.5 h-3 border-l-2 ${lineColor} ${
          isDashed ? 'border-dashed' : ''
        } ${isPulsing ? 'motion-safe:animate-pulse' : ''}`}
      />
    </div>
  );
};
