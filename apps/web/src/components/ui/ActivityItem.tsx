import React from 'react';
import { cn } from '../../lib/utils';
import { AddressBadge } from './AddressBadge';
import { Badge } from './Badge';

export interface ActivityItemProps {
  type: string;
  actor: string;
  actorRole?: string;
  description: string;
  timestamp: string;
  txHash?: string;
  blockNumber?: number | string;
  status?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  type,
  actor,
  actorRole,
  description,
  timestamp,
  txHash,
  blockNumber,
  status = 'info',
  className,
}) => {
  return (
    <div
      className={cn(
        'group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-dark-border-default bg-dark-bg-2 hover:bg-dark-bg-3/40 transition-colors',
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={cn(
            'mt-0.5 h-2 w-2 rounded-full shrink-0',
            status === 'success' && 'bg-emerald-400',
            status === 'warning' && 'bg-amber-400',
            status === 'error' && 'bg-crimson-400',
            status === 'info' && 'bg-brand-400'
          )}
        />

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
              {type}
            </Badge>
            <span className="text-xs font-semibold text-dark-text-primary">
              {description}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-dark-text-muted flex-wrap">
            <span>By:</span>
            <AddressBadge address={actor} digits={5} />
            {actorRole && (
              <span className="text-dark-text-secondary">({actorRole})</span>
            )}
            {blockNumber && (
              <>
                <span>•</span>
                <span className="font-mono">Block #{blockNumber}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-[11px] font-mono text-dark-text-muted shrink-0">
        <span>{timestamp}</span>
        {txHash && (
          <AddressBadge
            address={txHash}
            digits={6}
            variant="mono"
            className="text-[10px] bg-dark-bg-1"
          />
        )}
      </div>
    </div>
  );
};
