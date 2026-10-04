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
      style: 'bg-yellow-100 text-yellow-900 border-yellow-300 font-bold'
    },
    ACTIVE: {
      label: 'Active Agreement',
      icon: CircleDot,
      style: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
    },
    REPAID: {
      label: 'Fully Settled',
      icon: CheckCircle2,
      style: 'bg-[#ffe600] text-black border-yellow-400 font-bold shadow-xs'
    },
    DEFAULTED: {
      label: 'Consensus Default',
      icon: AlertTriangle,
      style: 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
    },
    CANCELLED: {
      label: 'Cancelled',
      icon: XCircle,
      style: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold'
    }
  }[status] || {
    label: status,
    icon: CircleDot,
    style: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold'
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
