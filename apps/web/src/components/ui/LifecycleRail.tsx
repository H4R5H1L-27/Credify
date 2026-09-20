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
      <div className="relative flex items-center justify-between">
        {/* Continuous background rail line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-dark-border-default z-0" />

        {/* Progress fill line */}
        <div
          className={cn(
            'absolute left-6 top-1/2 -translate-y-1/2 h-0.5 z-0 transition-all duration-300',
            defaulted ? 'bg-crimson-500' : 'bg-brand-500'
          )}
          style={{
            width: `${Math.min(100, Math.max(0, (currentIndex / (STAGES.length - 1)) * 100))}%`,
          }}
        />

        {STAGES.map((stage, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isLast = idx === STAGES.length - 1;
          const isDefaultNode = isLast && defaulted;

          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center">
              {/* Node Circle */}
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-all',
                  isPassed && 'border-brand-500 bg-brand-500 text-white shadow-xs',
                  isCurrent && !defaulted && 'border-brand-500 bg-dark-bg-1 text-brand-400 ring-4 ring-brand-500/20 font-bold',
                  isCurrent && isDefaultNode && 'border-crimson-500 bg-crimson-500/20 text-crimson-400 ring-4 ring-crimson-500/20 font-bold',
                  !isPassed && !isCurrent && 'border-dark-border-strong bg-dark-bg-2 text-dark-text-muted'
                )}
              >
                {isPassed ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : isDefaultNode ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <span className="font-mono text-[10px]">{idx + 1}</span>
                )}
              </div>

              {/* Node Labels */}
              <div className="absolute top-8 flex flex-col items-center text-center whitespace-nowrap">
                <span
                  className={cn(
                    'text-[11px] font-semibold tracking-tight',
                    isCurrent && !defaulted && 'text-brand-400',
                    isCurrent && isDefaultNode && 'text-crimson-400',
                    isPassed && 'text-dark-text-primary',
                    !isPassed && !isCurrent && 'text-dark-text-muted'
                  )}
                >
                  {isDefaultNode ? 'Defaulted' : stage.label}
                </span>
                <span className="text-[10px] text-dark-text-muted font-normal hidden sm:inline">
                  {isDefaultNode ? 'Governance Action' : stage.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {/* Bottom spacer for absolute positioned labels */}
      <div className="h-6" />
    </div>
  );
};
