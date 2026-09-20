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
      bg: 'bg-brand-500/10 text-dark-text-primary border-brand-500/30',
      icon: Info,
      iconColor: 'text-brand-400',
    },
    warning: {
      bg: 'bg-amber-500/10 text-dark-text-primary border-amber-500/30',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    error: {
      bg: 'bg-crimson-500/10 text-dark-text-primary border-crimson-500/30',
      icon: AlertCircle,
      iconColor: 'text-crimson-400',
    },
    success: {
      bg: 'bg-emerald-500/10 text-dark-text-primary border-emerald-500/30',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
    },
  };

  const config = configs[variant];
  const Icon = config.icon;

  return (
    <div className={cn('p-3.5 rounded-xl border flex gap-3 text-xs leading-relaxed', config.bg, className)}>
      <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-semibold mb-1 text-xs tracking-tight text-dark-text-primary">{title}</h5>}
        <div className="text-xs text-dark-text-secondary">{children}</div>
      </div>
    </div>
  );
};
