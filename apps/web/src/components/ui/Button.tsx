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
      'inline-flex items-center justify-center font-sans font-medium transition-all duration-micro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-black disabled:opacity-40 disabled:pointer-events-none rounded-xl select-none cursor-pointer tracking-tight';

    const variants = {
      primary:
        'bg-[#ffe600] text-black hover:bg-[#facc15] active:bg-[#eab308] shadow-[0_2px_10px_rgba(250,204,21,0.35)] border border-yellow-400/80 font-bold',
      secondary:
        'bg-white text-slate-900 hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 shadow-sm font-semibold',
      outline:
        'bg-transparent text-slate-800 hover:bg-slate-100/80 active:bg-slate-200/80 border border-slate-300/90 font-medium',
      ghost:
        'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/80 font-medium',
      danger:
        'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 active:bg-rose-200 font-semibold',
      success:
        'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 active:bg-emerald-200 font-semibold',
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
