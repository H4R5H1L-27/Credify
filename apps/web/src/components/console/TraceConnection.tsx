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
  let lineColor = 'border-slate-300';
  let arrowColor = 'text-slate-400';
  let isDashed = false;
  let isPulsing = false;

  if (isFailureBranch || fromStatus === 'FAILED') {
    lineColor = 'border-rose-400';
    arrowColor = 'text-rose-600';
    isDashed = true;
  } else if (toStatus === 'SKIPPED') {
    lineColor = 'border-slate-300';
    arrowColor = 'text-slate-400';
    isDashed = true;
  } else if (fromStatus === 'COMPLETED' && toStatus === 'COMPLETED') {
    lineColor = 'border-emerald-400';
    arrowColor = 'text-emerald-600';
  } else if (fromStatus === 'COMPLETED' && toStatus === 'ACTIVE') {
    lineColor = 'border-yellow-400';
    arrowColor = 'text-yellow-600';
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
            className={`px-2 py-0.5 rounded text-[10px] ${
              isFailureBranch
                ? 'text-rose-800 bg-rose-50 border border-rose-300 font-bold'
                : 'text-slate-600 bg-white border border-slate-200 font-semibold'
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
