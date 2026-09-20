import React from 'react';
import { Button } from '../ui/Button';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Gauge,
  FastForward,
} from 'lucide-react';

export interface TracePlaybackProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onJumpToStep: (stepIndex: number) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  stepName?: string;
}

export const TracePlayback: React.FC<TracePlaybackProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  onJumpToStep,
  speed,
  onChangeSpeed,
  stepName,
}) => {
  return (
    <div className="p-3.5 rounded-xl bg-dark-bg-2 border border-dark-border-subtle space-y-3 font-mono">
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
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onPlay}
              icon={<Play className="w-3.5 h-3.5 text-brand-400" />}
              className="text-xs font-mono border-brand-500/40 text-brand-400 hover:bg-brand-500/10"
            >
              Play Trace
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={onStepBack}
            disabled={currentStep <= 1}
            icon={<ChevronLeft className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
            title="Previous Stage"
          />

          <Button
            size="sm"
            variant="outline"
            onClick={onStepForward}
            disabled={currentStep >= totalSteps}
            icon={<ChevronRight className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
            title="Next Stage"
          />

          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
            title="Replay from Beginning"
          >
            Replay
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

        {/* Current Stage Indicator */}
        <div className="text-right text-xs">
          <div className="text-dark-text-muted text-[10px] uppercase">Playback State</div>
          <div className="text-dark-text-primary font-bold">
            Stage {currentStep} of {totalSteps}: <span className="text-brand-400">{stepName || 'Trace Complete'}</span>
          </div>
        </div>
      </div>

      {/* Progress Scrubber */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <button
              key={stepNum}
              type="button"
              onClick={() => onJumpToStep(stepNum)}
              title={`Jump to Stage ${stepNum}`}
              className={`h-2 flex-1 rounded-full transition-all duration-300 cursor-pointer ${
                isCurrent
                  ? 'bg-brand-500 ring-2 ring-brand-500/50 scale-y-125'
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
