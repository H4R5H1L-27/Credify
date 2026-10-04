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
  let cardBorder = 'border-slate-200 bg-white/60 opacity-60';
  let badgeColor = 'text-slate-600 bg-slate-100 border-slate-200';
  let statusIcon = <Clock className="w-3.5 h-3.5 text-slate-500" />;
  let labelText = 'PENDING';

  if (stage.state === 'COMPLETED') {
    cardBorder = 'border-slate-200 bg-white hover:border-yellow-400 shadow-xs hover:shadow-md opacity-100';
    badgeColor = 'text-emerald-900 bg-emerald-50 border-emerald-300 font-bold';
    statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />;
    labelText = 'CONFIRMED';
  } else if (stage.state === 'ACTIVE') {
    cardBorder = 'border-yellow-400 bg-yellow-50/50 shadow-md ring-2 ring-yellow-400/50 opacity-100';
    badgeColor = 'text-yellow-950 bg-yellow-100 border-yellow-400 font-bold';
    statusIcon = <Zap className="w-3.5 h-3.5 text-yellow-900 motion-safe:animate-pulse" />;
    labelText = 'REPLAYING...';
  } else if (stage.state === 'REVERTED') {
    cardBorder = 'border-rose-300 bg-rose-50/50 shadow-sm opacity-100';
    badgeColor = 'text-rose-900 bg-rose-50 border-rose-300 font-bold';
    statusIcon = <XCircle className="w-3.5 h-3.5 text-rose-700" />;
    labelText = 'REVERTED';
  }

  const getCategoryIcon = () => {
    switch (stage.step) {
      case 1:
        return <Monitor className="w-4 h-4 text-black" />;
      case 2:
        return <Wallet className="w-4 h-4 text-yellow-900" />;
      case 3:
      case 4:
        return <ArrowRight className="w-4 h-4 text-blue-800" />;
      case 5:
        return <Cpu className="w-4 h-4 text-slate-950" />;
      case 6:
        return <Layers className="w-4 h-4 text-purple-800" />;
      case 7:
        return <Radio className="w-4 h-4 text-purple-800" />;
      case 8:
        return <Database className="w-4 h-4 text-indigo-800" />;
      case 9:
        return <CheckCircle2 className="w-4 h-4 text-emerald-800" />;
      default:
        return <FileCode2 className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <div
      className={`p-5 rounded-xl border transition-all duration-200 font-mono space-y-3.5 ${cardBorder}`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              stage.state === 'ACTIVE'
                ? 'bg-[#ffe600] text-black border border-yellow-400 shadow-xs'
                : stage.state === 'COMPLETED'
                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                : stage.state === 'REVERTED'
                ? 'bg-rose-100 text-rose-950 border border-rose-300'
                : 'bg-slate-100 border border-slate-300 text-slate-700'
            }`}
          >
            {stage.step}
          </div>

          <div className="p-1.5 rounded-lg bg-yellow-50 border border-yellow-300">
            {getCategoryIcon()}
          </div>

          <div>
            <div className="font-bold text-sm text-slate-950 flex items-center gap-2">
              <span>{stage.name}</span>
            </div>
            <div className="text-xs text-slate-600 font-sans font-medium">
              {stage.category}
            </div>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs uppercase font-bold border ${badgeColor} self-start sm:self-auto font-sans`}
        >
          {statusIcon}
          <span>{labelText}</span>
        </span>
      </div>

      {/* Summary Narrative */}
      <div className="text-xs text-slate-700 font-sans font-medium leading-relaxed sm:pl-10">
        {stage.summary}
      </div>

      {/* Captured Evidence Table */}
      {stage.details && Object.keys(stage.details).length > 0 && stage.state !== 'PENDING' && (
        <div className="sm:ml-10 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
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
      {onInspect && stage.state !== 'PENDING' && (
        <div className="pt-2 sm:pl-10 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={() => onInspect(stage)}
            className="inline-flex items-center gap-1.5 text-xs text-yellow-900 hover:text-black font-bold transition-colors cursor-pointer"
          >
            <span>Inspect Evidence Proof</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-900" />
          </button>
        </div>
      )}
    </div>
  );
};
