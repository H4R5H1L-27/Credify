import React from 'react';
import { cn } from '../../lib/utils';

export type TechnicalStatusType =
  | 'SYNCED'
  | 'INDEXING'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'OFFLINE'
  | 'ACTIVE'
  | 'IDLE';

export interface TechnicalStatusProps {
  status: TechnicalStatusType;
  label?: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  TechnicalStatusType,
  { bg: string; text: string; border: string; dot: string; defaultLabel: string }
> = {
  SYNCED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
    defaultLabel: 'SYNCED',
  },
  INDEXING: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-900',
    border: 'border-yellow-400',
    dot: 'bg-yellow-500',
    defaultLabel: 'INDEXING',
  },
  DEGRADED: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-300',
    dot: 'bg-amber-600',
    defaultLabel: 'DEGRADED',
  },
  DISCONNECTED: {
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    border: 'border-rose-300',
    dot: 'bg-rose-600',
    defaultLabel: 'DISCONNECTED',
  },
  OFFLINE: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
    defaultLabel: 'OFFLINE',
  },
  ACTIVE: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
    defaultLabel: 'ACTIVE',
  },
  IDLE: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
    defaultLabel: 'IDLE',
  },
};

export const TechnicalStatus: React.FC<TechnicalStatusProps> = ({
  status,
  label,
  size = 'sm',
  showDot = true,
  className,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.OFFLINE;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-medium rounded-md border uppercase tracking-wider',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs font-semibold' : 'px-2.5 py-1 text-xs font-bold',
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full shrink-0',
            config.dot,
            size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
          )}
        />
      )}
      <span>{label || config.defaultLabel}</span>
    </span>
  );
};
