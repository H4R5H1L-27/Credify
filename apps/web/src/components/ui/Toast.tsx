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
        'flex items-start gap-3 p-3.5 rounded-2xl bg-white border shadow-lg max-w-sm w-full transition-all animate-in slide-in-from-bottom-2 duration-fast',
        type === 'info' && 'border-yellow-300 text-yellow-800',
        type === 'success' && 'border-emerald-300 text-emerald-700',
        type === 'warning' && 'border-amber-300 text-amber-700',
        type === 'error' && 'border-rose-300 text-rose-700',
        className
      )}
    >
      <div className="mt-0.5 shrink-0">
        {type === 'info' && <Info className="w-4 h-4 text-yellow-600" />}
        {type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        {type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
        {type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <h5 className="text-xs font-bold text-slate-950">
          {title}
        </h5>
        {message && (
          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
            {message}
          </p>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-900 rounded p-0.5 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
