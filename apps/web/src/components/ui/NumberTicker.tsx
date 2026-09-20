import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export interface NumberTickerProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Magic UI / React Bits inspired NumberTicker component.
 * Automatically triggers an ease-out numerical countup when scrolled into view.
 */
export const NumberTicker: React.FC<NumberTickerProps> = ({
  value,
  direction = 'up',
  delay = 0,
  duration = 1200,
  decimalPlaces = 0,
  prefix = '',
  suffix = '',
  className,
  ...props
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState<number>(direction === 'down' ? value : 0);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const frameRef = useRef<number | null>(null);

  // Trigger when in viewport
  useEffect(() => {
    if (!spanRef.current) return;

    if (typeof IntersectionObserver === 'undefined') {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(spanRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let timeoutId: NodeJS.Timeout;
    let startTime: number | null = null;

    const startValue = direction === 'down' ? value : 0;
    const endValue = direction === 'down' ? 0 : value;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out expo: 1 - 2^(-10 * t)
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    timeoutId = setTimeout(() => {
      frameRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [hasStarted, value, direction, delay, duration]);

  const formatted = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return (
    <span
      ref={spanRef}
      className={cn('inline-block tabular-nums font-mono', className)}
      {...props}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
