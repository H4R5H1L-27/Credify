import React from 'react';
import { cn } from '../../lib/utils';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white shadow-xs',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 mb-3 shadow-xs">
        {icon || <Inbox className="h-6 w-6 text-yellow-700" />}
      </div>
      <h3 className="text-sm font-bold text-slate-950 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-600 max-w-sm mt-1 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
