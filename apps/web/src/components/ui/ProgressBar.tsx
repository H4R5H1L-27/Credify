import React from 'react';
import { cn } from '../../lib/utils';

export type ProgressVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'brand'
  | 'emerald'
  | 'amber'
  | 'crimson';

export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  threshold?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'primary',
  threshold,
  className,
  barClassName,
  showLabel = false,
  size = 'md',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const thresholdPct = threshold !== undefined ? Math.min(100, Math.max(0, (threshold / max) * 100)) : undefined;

  const heightClasses = {
    sm: 'h-2',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const variantClasses: Record<ProgressVariant, string> = {
    primary: 'bg-[#ffe600] border border-yellow-400',
    brand: 'bg-[#ffe600] border border-yellow-400',
    success: 'bg-emerald-500',
    emerald: 'bg-emerald-500',
    warning: 'bg-amber-500',
    amber: 'bg-amber-500',
    danger: 'bg-rose-500',
    crimson: 'bg-rose-500',
  };

  return (
    <div className="w-full space-y-1.5">
      <div className={cn('relative w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden shadow-inner', heightClasses[size], className)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', variantClasses[variant], barClassName)}
          style={{ width: `${percentage}%` }}
        />
        {thresholdPct !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10 opacity-80"
            style={{ left: `${thresholdPct}%` }}
            title={`Threshold: ${thresholdPct.toFixed(1)}%`}
          />
        )}
      </div>
      {showLabel && (
        <div className="flex justify-between items-center text-[11px] font-mono font-bold text-slate-800">
          <span>{percentage.toFixed(1)}% completed</span>
          {thresholdPct !== undefined && (
            <span className="text-slate-600 font-medium">Threshold: {thresholdPct.toFixed(1)}%</span>
          )}
        </div>
      )}
    </div>
  );
};

export const Progress = ProgressBar;
