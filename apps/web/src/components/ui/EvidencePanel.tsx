import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, ChevronRight, ShieldCheck, Code2, Copy, Check } from 'lucide-react';
import { AddressBadge } from './AddressBadge';

export interface EvidenceData {
  title: string;
  description: string;
  timestamp?: string;
  actor?: string;
  actorRole?: string;
  txHash?: string;
  blockNumber?: number | string;
  contractAddress?: string;
  eventType?: string;
  rawPayload?: Record<string, any> | string;
}

export interface EvidencePanelProps {
  evidence: EvidenceData;
  defaultExpanded?: boolean;
  className?: string;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  evidence,
  defaultExpanded = false,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const payloadString =
    typeof evidence.rawPayload === 'string'
      ? evidence.rawPayload
      : evidence.rawPayload
      ? JSON.stringify(evidence.rawPayload, null, 2)
      : null;

  const copyPayload = () => {
    if (!payloadString) return;
    navigator.clipboard.writeText(payloadString);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all',
        className
      )}
    >
      {/* Tier 1: Primary Presentation — "What happened?" */}
      <div className="p-5 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-yellow-700" />
            </div>
            <h4 className="text-sm font-bold text-slate-950 tracking-tight">
              {evidence.title}
            </h4>
            {evidence.eventType && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200">
                {evidence.eventType}
              </span>
            )}
          </div>

          {evidence.timestamp && (
            <span className="font-mono text-[11px] text-slate-500 font-medium shrink-0">
              {evidence.timestamp}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          {evidence.description}
        </p>

        {evidence.actor && (
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 font-medium">
            <span>Executed by:</span>
            <AddressBadge address={evidence.actor} digits={6} />
            {evidence.actorRole && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 font-bold border border-slate-200">
                {evidence.actorRole}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tier 2: Expandable Secondary Presentation — "How can I verify it?" */}
      <div className="border-t border-slate-100 bg-slate-50/70">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-5 py-2.5 flex items-center justify-between text-xs text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-bold">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
            <span>How can I verify it?</span>
          </span>
          <span className="font-mono text-[11px] font-bold text-yellow-800 bg-yellow-100/70 px-2 py-0.5 rounded border border-yellow-200">
            {isExpanded ? 'Hide Technical Proof' : 'View On-Chain Proof'}
          </span>
        </button>

        {isExpanded && (
          <div className="p-5 pt-3 space-y-3.5 text-xs border-t border-slate-200 bg-white animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {evidence.contractAddress && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
                    Contract Reference
                  </div>
                  <AddressBadge address={evidence.contractAddress} digits={8} />
                </div>
              )}

              {evidence.txHash && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
                    Transaction Hash
                  </div>
                  <AddressBadge address={evidence.txHash} digits={8} variant="mono" />
                </div>
              )}

              {evidence.blockNumber !== undefined && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
                    Block Height
                  </div>
                  <div className="font-mono text-xs text-slate-950 font-bold">
                    #{evidence.blockNumber}
                  </div>
                </div>
              )}
            </div>

            {payloadString && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5" />
                    Technical Event Payload
                  </span>
                  <button
                    type="button"
                    onClick={copyPayload}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-black transition-colors cursor-pointer"
                  >
                    {copiedPayload ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto max-h-48 shadow-inner">
                  {payloadString}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
