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
    <div className="p-4 rounded-xl bg-dark-bg-2 border border-dark-border-subtle space-y-3.5 font-mono">
      {/* Top Banner: Read-Only Replay Certification */}
      <div className="flex items-center justify-between pb-2 border-b border-dark-border-subtle/50 text-[11px]">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-bold uppercase tracking-wider text-[10px]">
            Read-Only Deterministic Replay
          </span>
        </div>
        <span className="text-dark-text-muted text-[10px]">
          Synthesizes recorded blockchain evidence • Never executes transactions
        </span>
      </div>

      {/* Control Buttons and Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {isPlaying ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onPause}
              icon={<Pause className="w-3.5 h-3.5 text-amber-400" />}
              className="text-xs font-mono border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              Pause Replay
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onPlay}
              icon={<Play className="w-3.5 h-3.5 text-brand-400" />}
              className="text-xs font-mono border-brand-500/40 text-brand-400 hover:bg-brand-500/10"
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
            className="text-xs font-mono"
            title="Step Backward"
          />

          <Button
            size="sm"
            variant="outline"
            onClick={onStepForward}
            disabled={currentStep >= totalSteps}
            icon={<ChevronRight className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
            title="Step Forward"
          >
            Step Forward
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onRestart}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
            title="Restart Replay"
          >
            Restart
          </Button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 ml-2 border-l border-dark-border-subtle pl-2">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChangeSpeed(s)}
                className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                  speed === s
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40 font-bold'
                    : 'text-dark-text-muted hover:text-dark-text-primary'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Milestone Indicator */}
        <div className="text-right text-xs">
          <div className="text-dark-text-muted text-[10px] uppercase">Replay Progress</div>
          <div className="text-dark-text-primary font-bold">
            Milestone {currentStep} / {totalSteps}:{' '}
            <span className="text-brand-400">{activeStageName || 'Completed'}</span>
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
              className={`h-2 flex-1 rounded-full transition-all duration-300 cursor-pointer ${
                isCurrent
                  ? 'bg-brand-500 ring-2 ring-brand-500/60 scale-y-125'
                  : isCompleted
                  ? 'bg-emerald-500/60 hover:bg-emerald-400'
                  : 'bg-dark-bg-3 hover:bg-dark-border-default'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
