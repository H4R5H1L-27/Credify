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
    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3.5 font-mono min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        {/* Playback Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {isPlaying ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onPause}
              icon={<Pause className="w-3.5 h-3.5 text-yellow-900" />}
              className="text-xs font-sans font-bold border-yellow-400 bg-yellow-100 text-yellow-950 hover:bg-yellow-200"
            >
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={onPlay}
              icon={<Play className="w-3.5 h-3.5 text-black" />}
              className="text-xs font-sans font-bold bg-[#ffe600] text-black border border-yellow-400 hover:bg-yellow-400"
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
            className="text-xs font-sans bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold"
            title="Previous Stage"
          />

          <Button
            size="sm"
            variant="outline"
            onClick={onStepForward}
            disabled={currentStep >= totalSteps}
            icon={<ChevronRight className="w-3.5 h-3.5" />}
            className="text-xs font-sans bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold"
            title="Next Stage"
          />

          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs font-sans bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold"
            title="Replay from Beginning"
          >
            Replay
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

        {/* Current Stage Indicator */}
        <div className="text-right text-xs">
          <div className="text-slate-600 font-sans font-semibold text-xs uppercase">Playback State</div>
          <div className="text-slate-950 font-bold font-sans">
            Stage {currentStep} of {totalSteps}: <span className="text-yellow-950 font-mono">{stepName || 'Trace Complete'}</span>
          </div>
        </div>
      </div>

      {/* Progress Scrubber */}
      <div className="flex items-center gap-1.5">
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
