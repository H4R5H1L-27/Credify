import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  id?: string;
  type?: ToastType;
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-xl surface-glass shadow-glass max-w-sm w-full transition-all animate-in slide-in-from-bottom-2 duration-fast',
        type === 'info' && 'border-brand-500/30 text-brand-400',
        type === 'success' && 'border-emerald-500/30 text-emerald-400',
        type === 'warning' && 'border-amber-500/30 text-amber-400',
        type === 'error' && 'border-rose-500/30 text-rose-400',
        className
      )}
    >
      <div className="mt-0.5 shrink-0">
        {type === 'info' && <Info className="w-4 h-4" />}
        {type === 'success' && <CheckCircle2 className="w-4 h-4" />}
        {type === 'warning' && <AlertTriangle className="w-4 h-4" />}
        {type === 'error' && <AlertCircle className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <h5 className="text-xs font-semibold text-dark-text-primary">
          {title}
        </h5>
        {message && (
          <p className="text-[11px] text-dark-text-secondary leading-relaxed">
            {message}
          </p>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-dark-text-muted hover:text-dark-text-primary rounded p-0.5 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
