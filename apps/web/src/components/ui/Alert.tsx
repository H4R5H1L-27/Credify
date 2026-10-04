import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const Alert: React.FC<{
  variant?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ variant = 'info', title, className, children }) => {
  const configs = {
    info: {
      bg: 'bg-yellow-50 text-slate-900 border-yellow-300',
      icon: Info,
      iconColor: 'text-yellow-700',
    },
    warning: {
      bg: 'bg-amber-50 text-slate-900 border-amber-300',
      icon: AlertTriangle,
      iconColor: 'text-amber-700',
    },
    error: {
      bg: 'bg-rose-50 text-slate-900 border-rose-300',
      icon: AlertCircle,
      iconColor: 'text-rose-700',
    },
    success: {
      bg: 'bg-emerald-50 text-slate-900 border-emerald-300',
      icon: CheckCircle,
      iconColor: 'text-emerald-700',
    },
  };

  const config = configs[variant];
  const Icon = config.icon;

  return (
    <div className={cn('p-3.5 rounded-xl border flex gap-3 text-xs leading-relaxed shadow-xs', config.bg, className)}>
      <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-bold mb-1 text-xs tracking-tight text-slate-950">{title}</h5>}
        <div className="text-xs text-slate-800 font-medium">{children}</div>
      </div>
    </div>
  );
};
