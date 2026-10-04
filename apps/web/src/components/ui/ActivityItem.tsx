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
        'group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/70 transition-colors shadow-xs',
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={cn(
            'mt-1 h-2 w-2 rounded-full shrink-0',
            status === 'success' && 'bg-emerald-500',
            status === 'warning' && 'bg-amber-500',
            status === 'error' && 'bg-rose-500',
            status === 'info' && 'bg-yellow-500'
          )}
        />

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] uppercase font-mono px-2 py-0.5 font-bold">
              {type}
            </Badge>
            <span className="text-xs font-bold text-slate-950">
              {description}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap font-medium">
            <span>By:</span>
            <AddressBadge address={actor} digits={5} />
            {actorRole && (
              <span className="text-slate-600 font-semibold">({actorRole})</span>
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

      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-[11px] font-mono text-slate-500 shrink-0 font-medium">
        <span>{timestamp}</span>
        {txHash && (
          <AddressBadge
            address={txHash}
            digits={6}
            variant="mono"
            className="text-[10px] bg-slate-50 border border-slate-200 text-slate-700"
          />
        )}
      </div>
    </div>
  );
};
