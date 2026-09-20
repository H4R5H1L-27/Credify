import React from 'react';
import { cn } from '../../lib/utils';
import { Check, Clock, AlertCircle } from 'lucide-react';

export interface TimelineItem {
  id: string | number;
  title: string;
  description?: string;
  timestamp?: string;
  actor?: React.ReactNode;
  status?: 'completed' | 'active' | 'upcoming' | 'error';
  icon?: React.ReactNode;
  content?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
  return (
    <div className={cn('relative space-y-6', className)}>
      {/* Vertical Rail */}
      <div className="absolute left-3.5 top-3 bottom-3 w-px bg-dark-border-default" />

      {items.map((item, idx) => {
        const isCompleted = item.status === 'completed';
        const isActive = item.status === 'active';
        const isError = item.status === 'error';

        return (
          <div key={item.id} className="relative flex items-start gap-4">
            {/* Node Icon/Indicator */}
            <div
              className={cn(
                'relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold shrink-0 transition-colors',
                isCompleted && 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-xs',
                isActive && 'border-brand-500 bg-brand-500/20 text-brand-400 ring-4 ring-brand-500/10 shadow-xs',
                isError && 'border-crimson-500 bg-crimson-500/20 text-crimson-400',
                !isCompleted && !isActive && !isError && 'border-dark-border-subtle bg-dark-bg-2 text-dark-text-muted'
              )}
            >
              {item.icon ? (
                item.icon
              ) : isCompleted ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : isActive ? (
                <div className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
              ) : isError ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : (
                <span className="font-mono text-[10px]">{idx + 1}</span>
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-0 pt-0.5 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-semibold text-dark-text-primary">
                    {item.title}
                  </h4>
                  {item.actor}
                </div>
                {item.timestamp && (
                  <span className="font-mono text-[11px] text-dark-text-muted shrink-0">
                    {item.timestamp}
                  </span>
                )}
              </div>

              {item.description && (
                <p className="text-xs text-dark-text-secondary leading-relaxed">
                  {item.description}
                </p>
              )}

              {item.content && (
                <div className="pt-2">
                  {item.content}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
