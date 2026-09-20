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
        'bg-[#0071e3] text-white hover:bg-[#0077ed] active:bg-[#0062c4] shadow-[0_2px_8px_rgba(0,113,227,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] border border-blue-400/30',
      secondary:
        'bg-white/[0.08] text-white hover:bg-white/[0.12] active:bg-white/[0.16] border border-white/10 backdrop-blur-md shadow-sm',
      outline:
        'bg-transparent text-white hover:bg-white/[0.06] active:bg-white/[0.10] border border-white/15',
      ghost:
        'bg-transparent text-dark-text-secondary hover:text-white hover:bg-white/[0.06] active:bg-white/[0.10]',
      danger:
        'bg-[#ff453a]/15 text-[#ff453a] hover:bg-[#ff453a]/25 border border-[#ff453a]/30 active:bg-[#ff453a]/35',
      success:
        'bg-[#30d158]/15 text-[#30d158] hover:bg-[#30d158]/25 border border-[#30d158]/30 active:bg-[#30d158]/35',
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
