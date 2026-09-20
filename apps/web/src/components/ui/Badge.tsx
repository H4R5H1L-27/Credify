import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-mono font-semibold tracking-tight select-none rounded';

  const sizes = {
    sm: 'px-1.5 py-0.2 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
  };

  const variants = {
    default: 'bg-brand-950/50 text-brand-300 border border-brand-800/40',
    secondary: 'bg-dark-bg-3 text-dark-text-secondary border border-dark-border-default',
    outline: 'border border-dark-border-default text-dark-text-primary bg-transparent',
    success: 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40',
    warning: 'bg-amber-950/40 text-amber-300 border border-amber-800/40',
    danger: 'bg-rose-950/40 text-rose-300 border border-rose-800/40',
    info: 'bg-sky-950/40 text-sky-300 border border-sky-800/40',
  };

  return (
    <div className={cn(baseStyles, sizes[size], variants[variant], className)} {...props}>
      {children}
    </div>
  );
};
