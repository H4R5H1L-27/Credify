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
      <div className="absolute left-3.5 top-3 bottom-3 w-px bg-slate-200" />

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
                isCompleted && 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold shadow-xs',
                isActive && 'border-yellow-400 bg-yellow-100 text-yellow-950 ring-4 ring-yellow-400/20 font-bold shadow-xs',
                isError && 'border-rose-300 bg-rose-50 text-rose-800 font-bold',
                !isCompleted && !isActive && !isError && 'border-slate-200 bg-slate-50 text-slate-500 font-mono'
              )}
            >
              {item.icon ? (
                item.icon
              ) : isCompleted ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : isActive ? (
                <div className="h-2 w-2 rounded-full bg-yellow-600 animate-pulse" />
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
                  <h4 className="text-xs font-bold text-slate-950">
                    {item.title}
                  </h4>
                  {item.actor}
                </div>
                {item.timestamp && (
                  <span className="font-mono text-[11px] text-slate-500 shrink-0 font-medium">
                    {item.timestamp}
                  </span>
                )}
              </div>

              {item.description && (
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
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
