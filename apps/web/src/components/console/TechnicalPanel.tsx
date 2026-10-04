import React from 'react';
import { cn } from '../../lib/utils';
import { Skeleton } from '../ui/Skeleton';

export interface TechnicalPanelProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
}

export const TechnicalPanel: React.FC<TechnicalPanelProps> = ({
  title,
  subtitle,
  badge,
  action,
  isLoading = false,
  emptyState,
  isEmpty = false,
  className,
  bodyClassName,
  children,
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-normal',
        className
      )}
    >
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base font-bold font-sans text-slate-900 tracking-tight">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-600 font-sans leading-relaxed font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </div>

      {/* Body */}
      <div className={cn('p-5 sm:p-6', bodyClassName)}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3 rounded-lg" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : isEmpty && emptyState ? (
          emptyState
        ) : (
          children
        )}
      </div>
    </div>
  );
};
