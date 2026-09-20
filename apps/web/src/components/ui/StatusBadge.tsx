import React from 'react';
import type { LoanStatus } from '@credify/shared';
import { cn } from '../../lib/utils';
import { CircleDot, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export const StatusBadge: React.FC<{ status: LoanStatus; className?: string; size?: 'sm' | 'md' }> = ({
  status,
  className,
  size = 'md',
}) => {
  const config = {
    FUNDING: {
      label: 'Funding Syndicate',
      icon: Clock,
      style: 'bg-amber-950/40 text-amber-300 border-amber-800/40'
    },
    ACTIVE: {
      label: 'Active Agreement',
      icon: CircleDot,
      style: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
    },
    REPAID: {
      label: 'Fully Settled',
      icon: CheckCircle2,
      style: 'bg-brand-950/50 text-brand-300 border-brand-800/40'
    },
    DEFAULTED: {
      label: 'Consensus Default',
      icon: AlertTriangle,
      style: 'bg-rose-950/40 text-rose-300 border-rose-800/40'
    },
    CANCELLED: {
      label: 'Cancelled',
      icon: XCircle,
      style: 'bg-dark-bg-3 text-dark-text-muted border-dark-border-default'
    }
  }[status] || {
    label: status,
    icon: CircleDot,
    style: 'bg-dark-bg-3 text-dark-text-muted border-dark-border-default'
  };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-mono font-bold tracking-wide border select-none',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        config.style,
        className
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
};
