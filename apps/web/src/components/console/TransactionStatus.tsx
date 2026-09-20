import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

export type TxExecutionStatus = 'CONFIRMED' | 'PENDING' | 'FAILED' | 'REVERTED';

export interface TransactionStatusProps {
  status: TxExecutionStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const TX_CONFIG: Record<
  TxExecutionStatus,
  { label: string; text: string; bg: string; border: string; icon: React.ReactNode }
> = {
  CONFIRMED: {
    label: 'SUCCESS (0x1)',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
  },
  PENDING: {
    label: 'MEMPOOL',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: <Clock className="w-3 h-3 text-amber-400" />,
  },
  FAILED: {
    label: 'FAILED (0x0)',
    text: 'text-crimson-400',
    bg: 'bg-crimson-500/10',
    border: 'border-crimson-500/30',
    icon: <XCircle className="w-3 h-3 text-crimson-400" />,
  },
  REVERTED: {
    label: 'REVERTED',
    text: 'text-crimson-400',
    bg: 'bg-crimson-500/10',
    border: 'border-crimson-500/30',
    icon: <AlertTriangle className="w-3 h-3 text-crimson-400" />,
  },
};

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  size = 'sm',
  className,
}) => {
  const config = TX_CONFIG[status] || TX_CONFIG.CONFIRMED;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-semibold rounded border uppercase tracking-wider',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
