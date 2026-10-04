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
          ? 'bg-yellow-50/30 border border-yellow-300 shadow-sm'
          : 'bg-white hover:bg-slate-50 border border-slate-200',
        className
      )}
    >
      <div
        className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => details && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start md:items-center gap-2.5 flex-wrap">
          {/* Block height */}
          <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200">
            #{blockNumber}
          </span>

          {/* Event or Contract Badge */}
          {eventName && <EventBadge eventName={eventName} size="sm" />}

          {contractName && (
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-950 font-bold border border-yellow-300">
              {contractName}
            </span>
          )}

          {/* Human Readable Summary */}
          <span className="text-xs font-sans font-semibold text-slate-900 leading-normal">
            {summary}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs self-end md:self-auto shrink-0 font-sans">
          {/* Actor */}
          {actorAddress && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-xs font-medium">Actor:</span>
              <TechnicalValue value={actorAddress} type="address" chars={4} copyable={false} />
              {actorRole && (
                <span className="text-xs font-sans px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200">
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
              className="p-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs font-sans text-slate-700">
            <span className="flex items-center gap-1.5 font-bold text-slate-950">
              <FileCode className="w-3.5 h-3.5 text-yellow-700" />
              Decoded Parameters &amp; EVM State
            </span>
            <span className="font-mono text-slate-500 font-medium">{timestamp}</span>
          </div>

          <pre className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-mono text-xs overflow-x-auto max-h-56 leading-relaxed">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
