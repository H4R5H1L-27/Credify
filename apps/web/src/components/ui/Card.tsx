import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'ghost' | 'interactive' | 'glass';
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'elevated',
  ...props
}) => {
  const variants = {
    elevated: 'bg-white border border-slate-200 shadow-sm',
    flat: 'bg-slate-50 border-0 shadow-none',
    ghost: 'bg-transparent border border-slate-200 shadow-none',
    glass: 'bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm',
    interactive:
      'bg-white border border-slate-200 hover:border-yellow-400 hover:shadow-md transition-all cursor-pointer',
  };

  return (
    <div
      className={cn(
        'rounded-2xl text-slate-950 transition-all duration-normal',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'p-5 sm:p-6 border-b border-slate-200 flex flex-col gap-1.5',
      className
    )}
    {...props}
  />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3
    className={cn(
      'text-base font-bold font-sans text-slate-950 tracking-tight flex items-center gap-2',
      className
    )}
    {...props}
  />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p
    className={cn(
      'text-xs text-slate-600 leading-relaxed font-sans font-medium',
      className
    )}
    {...props}
  />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div className={cn('p-5 sm:p-6', className)} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn('p-5 sm:p-6 pt-0 flex items-center gap-2', className)}
    {...props}
  />
);
