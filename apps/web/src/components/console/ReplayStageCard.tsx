import React from 'react';
import { formatEther } from '../../lib/utils';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCode2,
  Cpu,
  Layers,
  Radio,
  Database,
  Monitor,
  Wallet,
  XCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export type ReplayStageState = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'REVERTED';

export interface ReplayStageInfo {
  step: number;
  id: string;
  name: string;
  category: string;
  summary: string;
  details: Record<string, string | number | boolean>;
  timestamp: string;
  state: ReplayStageState;
  evidenceRef?: {
    type: 'TRANSACTION' | 'BLOCK' | 'CONTRACT' | 'EVENT' | 'PROJECTION';
    value: string;
  };
}

export interface ReplayStageCardProps {
  stage: ReplayStageInfo;
  isActive: boolean;
  onInspect?: (stage: ReplayStageInfo) => void;
}

export const ReplayStageCard: React.FC<ReplayStageCardProps> = ({
  stage,
  isActive,
  onInspect,
}) => {
  // Determine card visual styling based on state
  let cardBorder = 'border-dark-border-subtle bg-dark-bg-3/50 opacity-50';
  let badgeColor = 'text-dark-text-muted bg-dark-bg-2 border-dark-border-subtle';
  let statusIcon = <Clock className="w-3 h-3 text-dark-text-muted" />;
  let labelText = 'PENDING';

  if (stage.state === 'COMPLETED') {
    cardBorder = 'border-dark-border-default bg-dark-bg-3 hover:border-emerald-500/40 opacity-100';
    badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    statusIcon = <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
    labelText = 'CONFIRMED';
  } else if (stage.state === 'ACTIVE') {
    cardBorder = 'border-brand-500 bg-dark-bg-3 shadow-[0_0_20px_rgba(99,102,241,0.25)] opacity-100 ring-2 ring-brand-500/50';
    badgeColor = 'text-brand-400 bg-brand-500/20 border-brand-500/50 font-bold';
    statusIcon = <Zap className="w-3 h-3 text-brand-400 motion-safe:animate-pulse" />;
    labelText = 'REPLAYING...';
  } else if (stage.state === 'REVERTED') {
    cardBorder = 'border-rose-500/60 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.2)] opacity-100';
    badgeColor = 'text-rose-400 bg-rose-500/20 border-rose-500/40 font-bold';
    statusIcon = <XCircle className="w-3 h-3 text-rose-400" />;
    labelText = 'REVERTED';
  }

  const getCategoryIcon = () => {
    switch (stage.step) {
      case 1:
        return <Monitor className="w-4 h-4 text-brand-400" />;
      case 2:
        return <Wallet className="w-4 h-4 text-amber-400" />;
      case 3:
      case 4:
        return <ArrowRight className="w-4 h-4 text-blue-400" />;
      case 5:
        return <Cpu className="w-4 h-4 text-brand-400" />;
      case 6:
        return <Layers className="w-4 h-4 text-purple-400" />;
      case 7:
        return <Radio className="w-4 h-4 text-purple-400" />;
      case 8:
        return <Database className="w-4 h-4 text-indigo-400" />;
      case 9:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileCode2 className="w-4 h-4 text-dark-text-muted" />;
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-500 font-mono space-y-3 ${cardBorder}`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              stage.state === 'ACTIVE'
                ? 'bg-brand-500 text-white shadow-sm'
                : stage.state === 'COMPLETED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : stage.state === 'REVERTED'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-dark-bg-2 border border-dark-border-subtle text-dark-text-muted'
            }`}
          >
            {stage.step}
          </div>

          <div className="p-1.5 rounded-md bg-dark-bg-2 border border-dark-border-subtle">
            {getCategoryIcon()}
          </div>

          <div>
            <div className="font-bold text-xs text-dark-text-primary flex items-center gap-2">
              <span>{stage.name}</span>
            </div>
            <div className="text-[10px] text-dark-text-muted">
              {stage.category}
            </div>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] uppercase font-semibold border ${badgeColor} self-start sm:self-auto`}
        >
          {statusIcon}
          <span>{labelText}</span>
        </span>
      </div>

      {/* Summary Narrative */}
      <div className="text-xs text-dark-text-secondary font-sans leading-relaxed pl-8">
        {stage.summary}
      </div>

      {/* Captured Evidence Table */}
      {stage.details && Object.keys(stage.details).length > 0 && stage.state !== 'PENDING' && (
        <div className="ml-8 p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle/80 space-y-1 text-[11px]">
          {Object.entries(stage.details).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <span className="text-dark-text-muted text-[10px]">{k}:</span>
              <span className="text-dark-text-primary font-bold truncate max-w-[280px]">
                {String(v)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      {onInspect && stage.state !== 'PENDING' && (
        <div className="pt-2 pl-8 border-t border-dark-border-subtle/50 flex justify-end">
          <button
            type="button"
            onClick={() => onInspect(stage)}
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-bold transition-colors cursor-pointer"
          >
            <span>Inspect Evidence Proof</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
