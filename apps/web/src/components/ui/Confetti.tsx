import React, { useEffect, useRef } from 'react';

export interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: 'rect' | 'circle' | 'star';
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
  decay: number;
}

export interface ConfettiOptions {
  particleCount?: number;
  origin?: { x: number; y: number }; // normalized 0..1 coordinates (e.g. 0.5, 0.4)
  colors?: string[];
  spread?: number; // spread angle in degrees (e.g. 70)
  startVelocity?: number;
  gravity?: number;
  shapes?: Array<'rect' | 'circle' | 'star'>;
}

const DEFAULT_COLORS = [
  '#F5A623', // Gold
  '#FBBF24', // Amber
  '#4F6BF5', // Cobalt Brand
  '#6884F8', // Luminous Brand
  '#10B981', // Emerald Settlement
  '#34D399', // Mint
  '#06B6D4', // Cyan
  '#FFFFFF', // Pearl Sparkle
];

/**
 * Triggers an imperative high-performance canvas confetti starburst.
 * Creates an ephemeral, pointer-events-none full-screen canvas that auto-cleans.
 */
export function triggerConfetti(options: ConfettiOptions = {}): void {
  if (typeof window === 'undefined') return;

  // Respect user preference for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const {
    particleCount = 100,
    origin = { x: 0.5, y: 0.4 },
    colors = DEFAULT_COLORS,
    spread = 80,
    startVelocity = 38,
    gravity = 0.35,
    shapes = ['rect', 'circle', 'star'],
  } = options;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = (canvas.width = window.innerWidth * dpr);
  let height = (canvas.height = window.innerHeight * dpr);

  const startX = origin.x * width;
  const startY = origin.y * height;

  const particles: ConfettiParticle[] = [];

  for (let i = 0; i < particleCount; i++) {
    // Dispersion angle centered upwards (-90deg = -PI/2)
    const angle =
      -Math.PI / 2 +
      ((Math.random() - 0.5) * (spread * Math.PI)) / 180;
    const velocity = (startVelocity * (0.6 + Math.random() * 0.8)) * dpr;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      size: (5 + Math.random() * 6) * dpr,
      color,
      shape,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.1 + Math.random() * 0.1,
      opacity: 1,
      decay: 0.007 + Math.random() * 0.008,
    });
  }

  let animationFrameId: number;

  const render = () => {
    ctx.clearRect(0, 0, width, height);

    let activeCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity <= 0) continue;

      activeCount++;

      // Physical dynamics
      p.x += p.vx;
      p.y += p.vy;
      p.vy += gravity * dpr;
      p.vx *= 0.97; // aerodynamic drag
      p.vy *= 0.97;

      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;
      p.opacity = Math.max(0, p.opacity - p.decay);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      const wobbleScale = Math.sin(p.wobble);

      if (p.shape === 'rect') {
        ctx.fillRect(
          -p.size / 2,
          (-p.size / 2) * wobbleScale,
          p.size,
          p.size * wobbleScale
        );
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size / 2, (p.size / 2) * Math.abs(wobbleScale), 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'star') {
        // 4-point sparkle star
        const r = p.size;
        ctx.beginPath();
        for (let s = 0; s < 8; s++) {
          const rad = (s * Math.PI) / 4;
          const dist = s % 2 === 0 ? r : r * 0.35;
          const sx = Math.cos(rad) * dist;
          const sy = Math.sin(rad) * dist * wobbleScale;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    if (activeCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      // Clean up DOM canvas when animation completes
      if (canvas.parentNode) {
        document.body.removeChild(canvas);
      }
    }
  };

  animationFrameId = requestAnimationFrame(render);
}

/**
 * Declarative Confetti component that triggers bursts whenever `active` transitions to true.
 */
export const Confetti: React.FC<{
  active?: boolean;
  options?: ConfettiOptions;
}> = ({ active = false, options }) => {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (active && !hasTriggeredRef.current) {
      triggerConfetti(options);
      hasTriggeredRef.current = true;
    } else if (!active) {
      hasTriggeredRef.current = false;
    }
  }, [active, options]);

  return null;
};
