import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  spotlightSize?: number;
  borderGlow?: boolean;
}

/**
 * Aceternity UI / React Bits inspired SpotlightCard component.
 * Dynamically tracks cursor coordinates to project an ambient radial highlight over dark surfaces.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className,
  spotlightColor = 'rgba(79, 107, 245, 0.14)',
  spotlightSize = 340,
  borderGlow = true,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [opacity, setOpacity] = useState<number>(0);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setOpacity(1);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setOpacity(0);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-dark-bg-1 border border-dark-border-subtle p-6 transition-all duration-200',
        'hover:border-dark-border-default/80 hover:shadow-depth-card',
        className
      )}
      {...props}
    >
      {/* Radial Spotlight Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(${spotlightSize}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />

      {/* Hairline Rim Glow on cursor vicinity */}
      {borderGlow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300 border border-brand-400/30"
          style={{
            opacity,
            maskImage: `radial-gradient(${spotlightSize * 0.75}px circle at ${position.x}px ${position.y}px, black, transparent 80%)`,
            WebkitMaskImage: `radial-gradient(${spotlightSize * 0.75}px circle at ${position.x}px ${position.y}px, black, transparent 80%)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
