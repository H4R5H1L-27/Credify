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
  let statusBadgeColor = 'text-slate-700 bg-slate-100 border-slate-200';
  let statusIcon = <Clock className="w-3.5 h-3.5 text-slate-500" />;
  let cardBorderColor = 'border-slate-200 bg-white';

  if (stage.status === 'COMPLETED') {
    statusBadgeColor = 'text-emerald-900 bg-emerald-50 border-emerald-300';
    statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />;
    cardBorderColor = 'border-slate-200 bg-white hover:border-yellow-400 shadow-xs hover:shadow-md';
  } else if (stage.status === 'ACTIVE') {
    statusBadgeColor = 'text-yellow-950 bg-yellow-100 border-yellow-400 font-bold';
    statusIcon = <Clock className="w-3.5 h-3.5 text-yellow-900 motion-safe:animate-spin" />;
    cardBorderColor = 'border-yellow-400 bg-yellow-50/50 shadow-md ring-2 ring-yellow-400/50';
  } else if (stage.status === 'FAILED') {
    statusBadgeColor = 'text-rose-900 bg-rose-50 border-rose-300 font-bold';
    statusIcon = <XCircle className="w-3.5 h-3.5 text-rose-700" />;
    cardBorderColor = 'border-rose-300 bg-rose-50/50 shadow-sm';
  } else if (stage.status === 'SKIPPED') {
    statusBadgeColor = 'text-slate-600 bg-slate-100 border-slate-200';
    statusIcon = <HelpCircle className="w-3.5 h-3.5 text-slate-500" />;
    cardBorderColor = 'border-dashed border-slate-300 bg-slate-50/60 opacity-60';
  }

  // Layer icon
  const getLayerIcon = () => {
    switch (stage.evidenceType) {
      case 'USER_ACTION':
      case 'FRONTEND':
      case 'UI_UPDATE':
        return <Monitor className="w-4 h-4 text-black" />;
      case 'WALLET':
        return <Wallet className="w-4 h-4 text-yellow-900" />;
      case 'TRANSACTION':
        return <ArrowRight className="w-4 h-4 text-blue-800" />;
      case 'SMART_CONTRACT':
        return <FileCode2 className="w-4 h-4 text-blue-800" />;
      case 'BLOCK':
        return <Cpu className="w-4 h-4 text-slate-950" />;
      case 'EVENT':
        return <Layers className="w-4 h-4 text-purple-800" />;
      case 'INDEXER':
        return <Radio className="w-4 h-4 text-purple-800" />;
      case 'READ_MODEL':
        return <Database className="w-4 h-4 text-indigo-800" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <div
      className={`p-5 rounded-xl border transition-all duration-200 font-mono space-y-3.5 ${cardBorderColor} ${
        isCurrentStep ? 'ring-2 ring-yellow-400' : ''
      }`}
    >
      {/* Node Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-950 shrink-0">
            {stage.stageNumber}
          </div>

          <div className="p-1.5 rounded-lg bg-yellow-50 border border-yellow-300 shrink-0">
            {getLayerIcon()}
          </div>

          <div>
            <div className="font-bold text-sm text-slate-950 flex items-center gap-2">
              <span>{stage.name}</span>
            </div>
            <div className="text-xs text-slate-600 font-sans font-medium">
              {stage.layer}
            </div>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-sans uppercase font-bold border ${statusBadgeColor} self-start sm:self-auto`}
        >
          {statusIcon}
          <span>{stage.status}</span>
        </span>
      </div>

      {/* Summary Narrative */}
      <div className="text-xs text-slate-700 font-sans font-medium leading-relaxed sm:pl-10">
        {stage.summary}
      </div>

      {/* Details Box */}
      {stage.details && Object.keys(stage.details).length > 0 && (
        <div className="sm:ml-10 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono">
          {Object.entries(stage.details).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <span className="text-slate-600 font-sans font-semibold text-xs">{k}:</span>
              <span className="text-slate-950 font-bold truncate max-w-[280px]">
                {String(v)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      {onInspectEvidence && stage.status !== 'SKIPPED' && (
        <div className="pt-2 sm:pl-10 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={() => onInspectEvidence(stage)}
            className="inline-flex items-center gap-1.5 text-xs text-yellow-900 hover:text-black font-bold transition-colors cursor-pointer"
          >
            <span>Inspect Underlying Evidence</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-900" />
          </button>
        </div>
      )}
    </div>
  );
};
