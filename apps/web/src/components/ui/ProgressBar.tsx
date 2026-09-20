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
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantClasses: Record<ProgressVariant, string> = {
    primary: 'bg-brand-500',
    brand: 'bg-brand-500',
    success: 'bg-emerald-500',
    emerald: 'bg-emerald-500',
    warning: 'bg-amber-500',
    amber: 'bg-amber-500',
    danger: 'bg-crimson-500',
    crimson: 'bg-crimson-500',
  };

  return (
    <div className="w-full space-y-1">
      <div className={cn('relative w-full bg-dark-bg-3 border border-dark-border-subtle rounded-full overflow-hidden', heightClasses[size], className)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', variantClasses[variant], barClassName)}
          style={{ width: `${percentage}%` }}
        />
        {thresholdPct !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-dark-text-primary z-10 opacity-80"
            style={{ left: `${thresholdPct}%` }}
            title={`Threshold: ${thresholdPct.toFixed(1)}%`}
          />
        )}
      </div>
      {showLabel && (
        <div className="flex justify-between items-center text-[11px] font-mono text-dark-text-secondary">
          <span>{percentage.toFixed(1)}% completed</span>
          {thresholdPct !== undefined && (
            <span className="text-dark-text-muted">Threshold: {thresholdPct.toFixed(1)}%</span>
          )}
        </div>
      )}
    </div>
  );
};

export const Progress = ProgressBar;
