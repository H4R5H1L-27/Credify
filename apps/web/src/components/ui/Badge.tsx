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
    default: 'bg-[#ffe600] text-black border border-yellow-400 font-bold',
    secondary: 'bg-slate-100 text-slate-800 border border-slate-200 font-semibold',
    outline: 'border border-slate-300 text-slate-900 bg-white font-semibold',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold',
    warning: 'bg-amber-50 text-amber-900 border border-amber-300 font-bold',
    danger: 'bg-rose-50 text-rose-800 border border-rose-300 font-bold',
    info: 'bg-sky-50 text-sky-900 border border-sky-300 font-bold',
  };

  return (
    <div className={cn(baseStyles, sizes[size], variants[variant], className)} {...props}>
      {children}
    </div>
  );
};
