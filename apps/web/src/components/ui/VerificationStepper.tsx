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
                'flex flex-col p-3.5 rounded-2xl border transition-all',
                isDone && 'border-emerald-300 bg-emerald-50/70 text-emerald-950 shadow-xs',
                isCurrent && !isRejected && 'border-yellow-400 bg-yellow-50/70 ring-1 ring-yellow-400/50 shadow-xs',
                isRejected && 'border-rose-300 bg-rose-50 ring-1 ring-rose-300 text-rose-950 shadow-xs',
                !isDone && !isCurrent && 'border-slate-200 bg-white opacity-60'
              )}
            >
              <div className="flex items-center justify-between pb-2">
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                    isDone && 'bg-emerald-100 text-emerald-800 font-bold',
                    isCurrent && !isRejected && 'bg-[#ffe600] text-black font-black shadow-xs border border-yellow-400',
                    isRejected && 'bg-rose-500 text-white font-bold shadow-xs',
                    !isDone && !isCurrent && 'bg-slate-100 text-slate-500 font-mono'
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
                  <span className="flex items-center gap-1 text-[10px] font-mono text-yellow-800 font-bold">
                    <Clock className="w-2.5 h-2.5 animate-spin" />
                    IN PROGRESS
                  </span>
                )}
                {isDone && (
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                    DONE
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-950">
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-[11px] text-slate-500 line-clamp-1 font-medium">
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
