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
    elevated: 'bg-dark-bg-2 border border-dark-border-subtle/70 shadow-depth-card',
    flat: 'bg-dark-bg-2/60 border-0 shadow-none',
    ghost: 'bg-transparent border border-dark-border-subtle/50 shadow-none',
    glass: 'surface-glass shadow-glass',
    interactive:
      'bg-dark-bg-2 border border-dark-border-subtle/70 hover:border-brand-500/40 hover:bg-dark-bg-3/50 hover:shadow-depth-elevated cursor-pointer',
  };

  return (
    <div
      className={cn(
        'rounded-2xl text-dark-text-primary transition-all duration-normal',
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
      'p-5 sm:p-6 border-b border-dark-border-subtle/60 flex flex-col gap-1.5',
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
      'text-base font-bold font-sans text-dark-text-primary tracking-tight flex items-center gap-2',
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
      'text-xs text-dark-text-secondary leading-relaxed font-sans',
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
