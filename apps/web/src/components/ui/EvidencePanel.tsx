import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, ChevronRight, ShieldCheck, ExternalLink, Code2, Copy, Check } from 'lucide-react';
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
        'rounded-xl border border-dark-border-default bg-dark-bg-2 overflow-hidden transition-all',
        className
      )}
    >
      {/* Tier 1: Primary Presentation — "What happened?" */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-sm font-semibold text-dark-text-primary tracking-tight">
              {evidence.title}
            </h4>
            {evidence.eventType && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-dark-bg-3 text-dark-text-muted border border-dark-border-subtle">
                {evidence.eventType}
              </span>
            )}
          </div>

          {evidence.timestamp && (
            <span className="font-mono text-[11px] text-dark-text-muted shrink-0">
              {evidence.timestamp}
            </span>
          )}
        </div>

        <p className="text-xs text-dark-text-secondary leading-relaxed">
          {evidence.description}
        </p>

        {evidence.actor && (
          <div className="flex items-center gap-2 pt-1 text-[11px] text-dark-text-muted">
            <span>Executed by:</span>
            <AddressBadge address={evidence.actor} digits={6} />
            {evidence.actorRole && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-dark-bg-3 text-dark-text-secondary">
                {evidence.actorRole}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tier 2: Expandable Secondary Presentation — "How can I verify it?" */}
      <div className="border-t border-dark-border-subtle bg-dark-bg-1/60">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 flex items-center justify-between text-xs text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-bg-3/30 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-medium">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>How can I verify it?</span>
          </span>
          <span className="font-mono text-[10px] text-dark-text-muted">
            {isExpanded ? 'Hide Technical Proof' : 'View On-Chain Proof'}
          </span>
        </button>

        {isExpanded && (
          <div className="p-4 pt-2 space-y-3 text-xs border-t border-dark-border-subtle/50 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {evidence.contractAddress && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-dark-text-muted">
                    Contract Reference
                  </div>
                  <AddressBadge address={evidence.contractAddress} digits={8} />
                </div>
              )}

              {evidence.txHash && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-dark-text-muted">
                    Transaction Hash
                  </div>
                  <AddressBadge address={evidence.txHash} digits={8} variant="mono" />
                </div>
              )}

              {evidence.blockNumber !== undefined && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-dark-text-muted">
                    Block Height
                  </div>
                  <div className="font-mono text-xs text-dark-text-primary font-medium">
                    #{evidence.blockNumber}
                  </div>
                </div>
              )}
            </div>

            {payloadString && (
              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-dark-text-muted flex items-center gap-1">
                    <Code2 className="w-3 h-3" />
                    Technical Event Payload
                  </span>
                  <button
                    type="button"
                    onClick={copyPayload}
                    className="flex items-center gap-1 text-[10px] text-dark-text-muted hover:text-dark-text-primary transition-colors cursor-pointer"
                  >
                    {copiedPayload ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-dark-bg-0 border border-dark-border-subtle font-mono text-[11px] text-dark-text-secondary overflow-x-auto max-h-48">
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
