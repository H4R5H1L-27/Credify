import React, { CSSProperties } from 'react';
import { cn } from '../../lib/utils';

export interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Magic UI inspired ShimmerButton component.
 * Features a perimeter light sheen rotation and tactile active micro-interaction.
 */
export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = '#ffffff',
      shimmerSize = '0.075em',
      shimmerDuration = '3s',
      borderRadius = '0.75rem',
      background = 'rgba(79, 107, 245, 1)',
      className,
      children,
      icon,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        style={
          {
            '--spread': '90deg',
            '--shimmer-color': shimmerColor,
            '--radius': borderRadius,
            '--speed': shimmerDuration,
            '--cut': shimmerSize,
            '--bg': background,
          } as CSSProperties
        }
        disabled={disabled}
        className={cn(
          'group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-5 py-2.5 font-medium text-white transition-all duration-140',
          'transform-gpu active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50',
          '[background:var(--bg)] [border-radius:var(--radius)] shadow-depth-card hover:shadow-depth-elevated',
          className
        )}
        {...props}
      >
        {/* Perimeter Conic Light Sweep */}
        <div
          aria-hidden="true"
          className={cn(
            '-z-30 blur-[2px]',
            'absolute inset-0 overflow-visible [container-type:size]'
          )}
        >
          <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
            {/* Rotating light beam */}
            <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
          </div>
        </div>

        {/* Content layer */}
        <span className="relative z-10 flex items-center gap-2 text-sm font-semibold tracking-wide">
          {children}
          {icon && <span className="transition-transform group-hover:translate-x-0.5">{icon}</span>}
        </span>

        {/* Inner shadow & highlight backdrop */}
        <div
          className={cn(
            'insert-0 absolute size-full',
            'rounded-[inherit] px-4 py-1.5 text-sm font-medium',
            'transform-gpu transition-all duration-140 ease-in-out',
            'group-hover:shadow-[inset_0_-4px_16px_rgba(255,255,255,0.15)]',
            'group-active:shadow-[inset_0_-8px_20px_rgba(0,0,0,0.3)]'
          )}
        />

        {/* Mask to ensure sheen stays on border rim */}
        <div
          className={cn(
            'absolute inset-0 size-full -z-20 [border-radius:var(--radius)] [background:var(--bg)]',
            'p-[1.5px]'
          )}
        />
      </button>
    );
  }
);

ShimmerButton.displayName = 'ShimmerButton';
