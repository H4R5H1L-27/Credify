import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, icon, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-sans font-medium transition-all duration-micro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-dark-bg-0 disabled:opacity-40 disabled:pointer-events-none rounded-lg select-none cursor-pointer';

    const variants = {
      primary:
        'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-depth-subtle border border-brand-400/30',
      secondary:
        'bg-dark-bg-2 text-dark-text-primary hover:bg-dark-bg-3 active:bg-dark-bg-4 border border-dark-border-subtle/80 hover:border-dark-border-default',
      outline:
        'bg-transparent text-dark-text-primary hover:bg-dark-bg-2 active:bg-dark-bg-3 border border-dark-border-subtle/80 hover:border-dark-border-default',
      ghost:
        'bg-transparent text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-bg-3/60 active:bg-dark-bg-4',
      danger:
        'bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 border border-rose-800/30 active:bg-rose-900/70',
      success:
        'bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-800/30 active:bg-emerald-900/70',
    };

    const sizes = {
      xs: 'h-7 px-2.5 text-xs gap-1.5',
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-xs font-semibold gap-2',
      lg: 'h-10 px-5 text-sm font-semibold gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-current" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
