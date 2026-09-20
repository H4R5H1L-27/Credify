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
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    defaultLabel: 'SYNCED',
  },
  INDEXING: {
    bg: 'bg-brand-500/10',
    text: 'text-brand-400',
    border: 'border-brand-500/30',
    dot: 'bg-brand-400',
    defaultLabel: 'INDEXING',
  },
  DEGRADED: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    defaultLabel: 'DEGRADED',
  },
  DISCONNECTED: {
    bg: 'bg-crimson-500/10',
    text: 'text-crimson-400',
    border: 'border-crimson-500/30',
    dot: 'bg-crimson-400',
    defaultLabel: 'DISCONNECTED',
  },
  OFFLINE: {
    bg: 'bg-dark-bg-3',
    text: 'text-dark-text-muted',
    border: 'border-dark-border-subtle',
    dot: 'bg-dark-text-muted',
    defaultLabel: 'OFFLINE',
  },
  ACTIVE: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    defaultLabel: 'ACTIVE',
  },
  IDLE: {
    bg: 'bg-dark-bg-3',
    text: 'text-dark-text-secondary',
    border: 'border-dark-border-subtle',
    dot: 'bg-dark-text-muted',
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
