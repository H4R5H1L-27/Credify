import React from 'react';
import { cn } from '../../lib/utils';
import { Check, Clock, ShieldAlert } from 'lucide-react';

export interface VerificationStep {
  id: string | number;
  label: string;
  description?: string;
}

export interface VerificationStepperProps {
  steps: VerificationStep[];
  currentStepIndex: number;
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'UNREGISTERED';
  className?: string;
}

export const VerificationStepper: React.FC<VerificationStepperProps> = ({
  steps,
  currentStepIndex,
  status = 'PENDING',
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex || (idx === steps.length - 1 && status === 'VERIFIED');
          const isCurrent = idx === currentStepIndex && status !== 'VERIFIED';
          const isRejected = isCurrent && status === 'REJECTED';

          return (
            <div
              key={step.id}
              className={cn(
                'flex flex-col p-3 rounded-xl border transition-all',
                isDone && 'border-emerald-500/30 bg-emerald-500/5',
                isCurrent && !isRejected && 'border-brand-500/40 bg-brand-500/5 ring-1 ring-brand-500/20',
                isRejected && 'border-crimson-500/40 bg-crimson-500/5 ring-1 ring-crimson-500/20',
                !isDone && !isCurrent && 'border-dark-border-default bg-dark-bg-1 opacity-60'
              )}
            >
              <div className="flex items-center justify-between pb-2">
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                    isDone && 'bg-emerald-500/20 text-emerald-400',
                    isCurrent && !isRejected && 'bg-brand-500 text-white shadow-xs',
                    isRejected && 'bg-crimson-500 text-white shadow-xs',
                    !isDone && !isCurrent && 'bg-dark-bg-3 text-dark-text-muted font-mono'
                  )}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : isRejected ? (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-[11px]">{idx + 1}</span>
                  )}
                </div>

                {isCurrent && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-brand-400">
                    <Clock className="w-2.5 h-2.5 animate-spin" />
                    IN PROGRESS
                  </span>
                )}
                {isDone && (
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    DONE
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-dark-text-primary">
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-[11px] text-dark-text-muted line-clamp-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
