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
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-dark-border-default bg-dark-bg-1/50',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dark-bg-2 border border-dark-border-subtle text-dark-text-muted mb-3">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-semibold text-dark-text-primary tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-dark-text-secondary max-w-sm mt-1 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
