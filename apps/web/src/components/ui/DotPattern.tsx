import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

export interface DotPatternProps extends React.HTMLAttributes<HTMLCanvasElement> {
  spacing?: number;
  dotSize?: number;
  glow?: boolean;
  interactive?: boolean;
  ambientWave?: boolean;
  className?: string;
}

/**
 * Magic UI & Aceternity inspired Interactive Animated Dot Grid Matrix.
 * Features:
 * - Ambient sine-wave light sweeps traveling across the matrix
 * - Interactive cursor proximity glow (dots illuminate and expand on hover)
 * - High-DPI retina display scaling
 * - 60fps canvas performance with reduced-motion awareness
 */
export const DotPattern: React.FC<DotPatternProps> = ({
  spacing = 28,
  dotSize = 1.6,
  glow = true,
  interactive = true,
  ambientWave = true,
  className,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let startTime = performance.now();

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const elapsed = (time - startTime) * 0.001;
      const mouse = mouseRef.current;
      const interactionRadius = 140;

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;

          // Distance from hero focal point (50% width, 250px height) for radial falloff
          const dxCenter = x - width / 2;
          const dyCenter = y - 250;
          const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
          const centerFalloff = Math.max(0, 1 - distCenter / 650);

          if (centerFalloff <= 0) continue;

          // Base dot brightness
          let alpha = 0.18 * centerFalloff;
          let radius = dotSize;
          let isGlow = false;

          // Ambient traveling sine-wave sweep (Magic UI wave)
          if (ambientWave && !prefersReducedMotion) {
            const wave = Math.sin(x * 0.008 + y * 0.008 - elapsed * 1.8);
            if (wave > 0.4) {
              const waveIntensity = (wave - 0.4) / 0.6;
              alpha += 0.28 * waveIntensity * centerFalloff;
              radius += 0.5 * waveIntensity;
              isGlow = true;
            }
          }

          // Interactive cursor proximity (Aceternity interactive glow)
          if (interactive && mouse.active) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < interactionRadius) {
              const proximity = 1 - dist / interactionRadius;
              alpha = Math.min(1, alpha + proximity * 0.75);
              radius = Math.min(3.5, radius + proximity * 1.8);
              isGlow = true;
            }
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);

          if (isGlow && glow) {
            ctx.fillStyle = `rgba(104, 132, 248, ${alpha})`;
            ctx.shadowColor = 'rgba(104, 132, 248, 0.45)';
            ctx.shadowBlur = 6;
          } else {
            ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }

          ctx.fill();
        }
      }

      // Reset shadow for next frame
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [spacing, dotSize, glow, interactive, ambientWave]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 w-full h-[1200px] z-0',
        className
      )}
      {...props}
    />
  );
};
