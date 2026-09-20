import React from 'react';
import type { TraceStage } from './ActionTraceEngine';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileCode2,
  Cpu,
  Layers,
  Radio,
  Database,
  Monitor,
  Wallet,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export interface TraceNodeProps {
  stage: TraceStage;
  isCurrentStep?: boolean;
  onInspectEvidence?: (stage: TraceStage) => void;
}

export const TraceNode: React.FC<TraceNodeProps> = ({
  stage,
  isCurrentStep,
  onInspectEvidence,
}) => {
  // Status styling
  let statusBadgeColor = 'text-dark-text-muted bg-dark-bg-3 border-dark-border-subtle';
  let statusIcon = <Clock className="w-3 h-3 text-dark-text-muted" />;
  let cardBorderColor = 'border-dark-border-subtle bg-dark-bg-3';

  if (stage.status === 'COMPLETED') {
    statusBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    statusIcon = <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
    cardBorderColor = 'border-dark-border-default bg-dark-bg-3 hover:border-emerald-500/40';
  } else if (stage.status === 'ACTIVE') {
    statusBadgeColor = 'text-brand-400 bg-brand-500/15 border-brand-500/40 font-bold';
    statusIcon = <Clock className="w-3 h-3 text-brand-400 motion-safe:animate-spin" />;
    cardBorderColor = 'border-brand-500/80 bg-brand-500/5 shadow-[0_0_15px_rgba(99,102,241,0.2)] motion-safe:animate-pulse';
  } else if (stage.status === 'FAILED') {
    statusBadgeColor = 'text-rose-400 bg-rose-500/15 border-rose-500/40 font-bold';
    statusIcon = <XCircle className="w-3 h-3 text-rose-400" />;
    cardBorderColor = 'border-rose-500/60 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
  } else if (stage.status === 'SKIPPED') {
    statusBadgeColor = 'text-dark-text-muted bg-dark-bg-2 border-dark-border-subtle';
    statusIcon = <HelpCircle className="w-3 h-3 text-dark-text-muted" />;
    cardBorderColor = 'border-dashed border-dark-border-subtle bg-dark-bg-3/50 opacity-60';
  }

  // Layer icon
  const getLayerIcon = () => {
    switch (stage.evidenceType) {
      case 'USER_ACTION':
      case 'FRONTEND':
      case 'UI_UPDATE':
        return <Monitor className="w-4 h-4 text-brand-400" />;
      case 'WALLET':
        return <Wallet className="w-4 h-4 text-amber-400" />;
      case 'TRANSACTION':
        return <ArrowRight className="w-4 h-4 text-blue-400" />;
      case 'SMART_CONTRACT':
        return <FileCode2 className="w-4 h-4 text-blue-400" />;
      case 'BLOCK':
        return <Cpu className="w-4 h-4 text-brand-400" />;
      case 'EVENT':
        return <Layers className="w-4 h-4 text-purple-400" />;
      case 'INDEXER':
        return <Radio className="w-4 h-4 text-purple-400" />;
      case 'READ_MODEL':
        return <Database className="w-4 h-4 text-indigo-400" />;
      default:
        return <Cpu className="w-4 h-4 text-dark-text-muted" />;
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-300 font-mono space-y-3 ${cardBorderColor} ${
        isCurrentStep ? 'ring-2 ring-brand-500/50' : ''
      }`}
    >
      {/* Node Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-dark-bg-2 border border-dark-border-default flex items-center justify-center text-xs font-bold text-dark-text-primary">
            {stage.stageNumber}
          </div>

          <div className="p-1.5 rounded-md bg-dark-bg-2 border border-dark-border-subtle">
            {getLayerIcon()}
          </div>

          <div>
            <div className="font-bold text-xs text-dark-text-primary flex items-center gap-2">
              <span>{stage.name}</span>
            </div>
            <div className="text-[10px] text-dark-text-muted">
              {stage.layer}
            </div>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] uppercase font-semibold border ${statusBadgeColor} self-start sm:self-auto`}
        >
          {statusIcon}
          <span>{stage.status}</span>
        </span>
      </div>

      {/* Summary Narrative */}
      <div className="text-xs text-dark-text-secondary font-sans leading-relaxed pl-8">
        {stage.summary}
      </div>

      {/* Details Box */}
      {stage.details && Object.keys(stage.details).length > 0 && (
        <div className="ml-8 p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle/80 space-y-1 text-[11px]">
          {Object.entries(stage.details).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <span className="text-dark-text-muted text-[10px]">{k}:</span>
              <span className="text-dark-text-primary font-bold truncate max-w-[260px]">
                {String(v)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      {onInspectEvidence && stage.status !== 'SKIPPED' && (
        <div className="pt-2 pl-8 border-t border-dark-border-subtle/50 flex justify-end">
          <button
            type="button"
            onClick={() => onInspectEvidence(stage)}
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-bold transition-colors cursor-pointer"
          >
            <span>Inspect Underlying Evidence</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
