import React from 'react';
import { Button } from '../ui/Button';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface ReplayControllerProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onJumpToStep: (step: number) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  activeStageName?: string;
}

export const ReplayController: React.FC<ReplayControllerProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  onPlay,
  onPause,
  onRestart,
  onStepForward,
  onStepBack,
  onJumpToStep,
  speed,
  onChangeSpeed,
  activeStageName,
}) => {
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3.5 font-mono min-w-0">
      {/* Top Banner: Read-Only Replay Certification */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider text-[11px]">
            Read-Only Deterministic Replay
          </span>
        </div>
        <span className="text-slate-600 text-xs font-sans font-medium">
          Synthesizes recorded blockchain evidence • Never executes transactions
        </span>
      </div>

      {/* Control Buttons and Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        {/* Playback Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {isPlaying ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onPause}
              icon={<Pause className="w-3.5 h-3.5 text-yellow-950" />}
              className="text-xs font-sans font-bold border-yellow-400 bg-yellow-100 text-yellow-950 hover:bg-yellow-200"
            >
              Pause Replay
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={onPlay}
              icon={<Play className="w-3.5 h-3.5 text-black" />}
              className="text-xs font-sans font-bold bg-[#ffe600] text-black border border-yellow-400 hover:bg-yellow-400"
            >
              Play Replay
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={onStepBack}
            disabled={currentStep <= 1}
            icon={<ChevronLeft className="w-3.5 h-3.5" />}
            className="text-xs font-sans bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold"
            title="Step Backward"
          />

          <Button
            size="sm"
            variant="outline"
            onClick={onStepForward}
            disabled={currentStep >= totalSteps}
            icon={<ChevronRight className="w-3.5 h-3.5" />}
            className="text-xs font-sans bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold"
            title="Step Forward"
          >
            Step Forward
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onRestart}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs font-sans bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold"
            title="Restart Replay"
          >
            Restart
          </Button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 ml-2 border-l border-slate-200 pl-2">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChangeSpeed(s)}
                className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer font-bold ${
                  speed === s
                    ? 'bg-[#ffe600] text-black border border-yellow-400 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Milestone Indicator */}
        <div className="text-right text-xs">
          <div className="text-slate-600 font-sans font-semibold text-xs uppercase">Replay Progress</div>
          <div className="text-slate-950 font-bold font-sans">
            Milestone {currentStep} / {totalSteps}:{' '}
            <span className="text-yellow-950 font-mono font-bold">{activeStageName || 'Completed'}</span>
          </div>
        </div>
      </div>

      {/* Scrubber Progress Bar */}
      <div className="flex items-center gap-1.5 pt-1">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <button
              key={stepNum}
              type="button"
              onClick={() => onJumpToStep(stepNum)}
              title={`Jump to Milestone ${stepNum}`}
              className={`h-2.5 flex-1 rounded-full transition-all duration-200 cursor-pointer ${
                isCurrent
                  ? 'bg-[#ffe600] ring-2 ring-yellow-400/60 scale-y-125'
                  : isCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-200 hover:bg-slate-300'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
