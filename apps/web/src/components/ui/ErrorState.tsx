import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string | number;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message = 'Unable to complete this request or load data.',
  code,
  onRetry,
  retryLabel = 'Try Again',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-rose-200 bg-rose-50/60 shadow-xs',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 border border-rose-200 text-rose-700 mb-3 shadow-xs">
        <AlertCircle className="h-6 w-6" />
      </div>

      <div className="space-y-1 max-w-md">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-sm font-bold text-slate-950 tracking-tight">
            {title}
          </h3>
          {code && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white text-rose-700 border border-rose-200 font-bold">
              ERR {code}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          {message}
        </p>
      </div>

      {onRetry && (
        <div className="mt-4">
          <Button
            size="sm"
            variant="secondary"
            onClick={onRetry}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
