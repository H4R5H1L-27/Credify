import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { TechnicalValue } from './TechnicalValue';
import { EventBadge } from './EventBadge';
import { ChevronDown, ChevronRight, FileCode } from 'lucide-react';

export interface EvidenceRowProps {
  blockNumber: number | string;
  txHash: string;
  eventName?: string;
  contractName?: string;
  contractAddress?: string;
  actorAddress?: string;
  actorRole?: string;
  timestamp: string;
  summary: string;
  details?: Record<string, any>;
  className?: string;
}

export const EvidenceRow: React.FC<EvidenceRowProps> = ({
  blockNumber,
  txHash,
  eventName,
  contractName,
  contractAddress,
  actorAddress,
  actorRole,
  timestamp,
  summary,
  details,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-micro overflow-hidden',
        isExpanded
          ? 'bg-dark-bg-3/60 border border-dark-border-subtle/80 shadow-depth-subtle'
          : 'bg-dark-bg-2/70 hover:bg-dark-bg-3/50 border border-dark-border-subtle/40 hover:border-dark-border-subtle/80',
        className
      )}
    >
      <div
        className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => details && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start md:items-center gap-2.5 flex-wrap">
          {/* Block height */}
          <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-dark-bg-3/80 text-dark-text-secondary font-semibold border border-dark-border-subtle/60">
            #{blockNumber}
          </span>

          {/* Event or Contract Badge */}
          {eventName && <EventBadge eventName={eventName} size="sm" />}

          {contractName && (
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-dark-bg-3/80 text-brand-300 border border-brand-500/20">
              {contractName}
            </span>
          )}

          {/* Human Readable Summary */}
          <span className="text-xs font-sans font-medium text-dark-text-primary leading-normal">
            {summary}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs self-end md:self-auto shrink-0 font-sans">
          {/* Actor */}
          {actorAddress && (
            <div className="flex items-center gap-1.5">
              <span className="text-dark-text-muted text-xs">Actor:</span>
              <TechnicalValue value={actorAddress} type="address" chars={4} copyable={false} />
              {actorRole && (
                <span className="text-xs font-sans px-1.5 py-0.5 rounded bg-dark-bg-3 text-dark-text-secondary border border-dark-border-subtle/60">
                  {actorRole}
                </span>
              )}
            </div>
          )}

          {/* Tx Hash */}
          <TechnicalValue value={txHash} type="hash" chars={5} />

          {/* Expand toggle if details exist */}
          {details && (
            <button
              type="button"
              className="p-1 text-dark-text-muted hover:text-dark-text-primary transition-colors cursor-pointer"
              aria-label={isExpanded ? 'Collapse row details' : 'Expand row details'}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expanded payload */}
      {isExpanded && details && (
        <div className="p-4 bg-dark-bg-1/90 border-t border-dark-border-subtle/60 text-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs font-sans text-dark-text-secondary">
            <span className="flex items-center gap-1.5 font-medium text-dark-text-primary">
              <FileCode className="w-3.5 h-3.5 text-brand-400" />
              Decoded Parameters &amp; EVM State
            </span>
            <span className="font-mono text-dark-text-muted">{timestamp}</span>
          </div>

          <pre className="p-3 rounded-lg bg-dark-bg-0/90 border border-dark-border-subtle/70 text-brand-300 font-mono text-xs overflow-x-auto max-h-56 leading-relaxed">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
