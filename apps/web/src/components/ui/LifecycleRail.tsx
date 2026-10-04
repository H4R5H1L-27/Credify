import React from 'react';
import { cn } from '../../lib/utils';
import { Check, AlertTriangle } from 'lucide-react';

export type LifecycleStage = 'CREATED' | 'FUNDED' | 'DISBURSED' | 'REPAID' | 'DEFAULTED';

export interface LifecycleRailProps {
  currentStage: LifecycleStage | string;
  isDefaulted?: boolean;
  className?: string;
}

const STAGES = [
  { key: 'CREATED', label: 'Initialized', sub: 'Contract Created' },
  { key: 'FUNDED', label: 'Funded', sub: 'Pool Filled' },
  { key: 'DISBURSED', label: 'Disbursed', sub: 'Supplier Paid' },
  { key: 'REPAID', label: 'Repaid', sub: 'Debt Settled' },
];

export const LifecycleRail: React.FC<LifecycleRailProps> = ({
  currentStage,
  isDefaulted = false,
  className,
}) => {
  const getStageIndex = (stage: string) => {
    const s = stage.toUpperCase();
    if (s === 'PENDING' || s === 'CREATED' || s === 'INITIALIZED') return 0;
    if (s === 'FUNDING' || s === 'FUNDED') return 1;
    if (s === 'ACTIVE' || s === 'DISBURSED') return 2;
    if (s === 'REPAID' || s === 'SETTLED') return 3;
    if (s === 'DEFAULTED') return 3;
    return 0;
  };

  const currentIndex = getStageIndex(currentStage);
  const defaulted = isDefaulted || currentStage.toUpperCase() === 'DEFAULTED';

  return (
    <div className={cn('w-full py-2', className)}>
      <div className="relative w-full px-4 sm:px-8">
        <div className="relative flex items-center justify-between">
          {/* Continuous rail track spanning from center of first node (14px) to center of last node (14px) */}
          <div className="absolute left-3.5 right-3.5 top-1/2 -translate-y-1/2 h-1.5 bg-slate-200/80 rounded-full z-0 overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                defaulted ? 'bg-rose-500' : 'bg-[#ffe600]'
              )}
              style={{
                width: `${Math.min(100, Math.max(0, (currentIndex / (STAGES.length - 1)) * 100))}%`,
              }}
            />
          </div>

          {STAGES.map((stage, idx) => {
            const isPassed = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isLast = idx === STAGES.length - 1;
            const isFirst = idx === 0;
            const isDefaultNode = isLast && defaulted;

            return (
              <div key={stage.key} className="relative z-10 flex flex-col items-center">
                {/* Node Circle */}
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-all shadow-xs',
                    isPassed && 'border-yellow-500 bg-[#ffe600] text-black font-black',
                    isCurrent && !defaulted && 'border-yellow-500 bg-[#ffe600] text-black ring-4 ring-yellow-300/60 font-black shadow-sm',
                    isCurrent && isDefaultNode && 'border-rose-500 bg-rose-500 text-white ring-4 ring-rose-200 font-bold',
                    !isPassed && !isCurrent && 'border-slate-300 bg-white text-slate-400 font-bold'
                  )}
                >
                  {isPassed ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : isDefaultNode ? (
                    <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <span className="font-mono text-[10px] font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Node Labels - positioned so they NEVER clip on container edges */}
                <div
                  className={cn(
                    'absolute top-8 flex flex-col whitespace-nowrap',
                    isFirst && 'items-start text-left left-0',
                    isLast && 'items-end text-right right-0',
                    !isFirst && !isLast && 'items-center text-center left-1/2 -translate-x-1/2'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs tracking-tight',
                      isCurrent && !defaulted && 'text-slate-950 font-black',
                      isCurrent && isDefaultNode && 'text-rose-700 font-black',
                      isPassed && 'text-slate-950 font-bold',
                      !isPassed && !isCurrent && 'text-slate-500 font-semibold'
                    )}
                  >
                    {isDefaultNode ? 'Defaulted' : stage.label}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-semibold hidden sm:inline',
                      isCurrent || isPassed ? 'text-slate-700' : 'text-slate-400'
                    )}
                  >
                    {isDefaultNode ? 'Governance Action' : stage.sub}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {/* Spacer for absolute positioned labels */}
        <div className="h-7" />
      </div>
    </div>
  );
};
