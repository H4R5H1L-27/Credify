import React, { CSSProperties } from 'react';
import { cn } from '../../lib/utils';

export interface AnimatedShinyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  shimmerWidth?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Magic UI inspired AnimatedShinyText component.
 * Produces an institutional horizontal light reflection passing across typography.
 */
export const AnimatedShinyText: React.FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
  ...props
}) => {
  return (
    <span
      style={
        {
          '--shiny-width': `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        'mx-auto max-w-md text-dark-text-secondary/90 animate-shiny-text bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shiny-width)_100%] [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]',
        'bg-gradient-to-r from-transparent via-white/80 via-50% to-transparent dark:via-white/90',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
