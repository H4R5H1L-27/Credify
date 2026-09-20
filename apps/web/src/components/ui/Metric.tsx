import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { NumberTicker } from './NumberTicker';

export interface MetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  unit?: string;
  variant?: 'card' | 'flat' | 'hero';
  ticker?: boolean;
  decimalPlaces?: number;
  trend?: {
    value: string | number;
    positive?: boolean;
    label?: string;
  };
  subtext?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  unit,
  variant = 'card',
  ticker,
  decimalPlaces,
  trend,
  subtext,
  badge,
  icon,
  className,
  ...props
}) => {
  const containerVariants = {
    card: 'p-5 rounded-2xl bg-dark-bg-2 border border-dark-border-subtle/70 shadow-depth-card space-y-2.5 transition-all hover:border-dark-border-strong/80 duration-normal',
    flat: 'p-3 rounded-xl bg-transparent border-0 space-y-2',
    hero: 'p-6 rounded-2xl bg-dark-bg-2 border border-brand-500/20 shadow-depth-card space-y-3.5 relative overflow-hidden',
  };

  return (
    <div
      className={cn(containerVariants[variant], className)}
      {...props}
    >
      {variant === 'hero' && (
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
      )}

      <div className="flex items-center justify-between text-dark-text-secondary text-xs">
        <span className="font-sans font-medium text-xs text-dark-text-secondary tracking-normal">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {badge}
          {icon && <span className="text-dark-text-muted">{icon}</span>}
        </div>
      </div>

      <div className="flex items-baseline gap-2 flex-wrap">
        <div
          className={cn(
            'font-black font-mono tracking-tight text-dark-text-primary',
            variant === 'hero' ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
          )}
        >
          {ticker !== false && typeof value === 'number' ? (
            <NumberTicker
              value={value}
              decimalPlaces={decimalPlaces ?? (Number.isInteger(value) ? 0 : 2)}
            />
          ) : (
            value
          )}
        </div>
        {unit && (
          <span className="text-xs font-mono font-medium text-dark-text-muted">
            {unit}
          </span>
        )}
      </div>

      {(trend || subtext) && (
        <div className="pt-2 flex items-center justify-between text-xs text-dark-text-muted border-t border-dark-border-subtle/50">
          {trend ? (
            <div
              className={`flex items-center gap-1 font-mono text-xs font-semibold ${
                trend.positive !== false ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend.positive !== false ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trend.value}</span>
              {trend.label && (
                <span className="text-xs font-normal text-dark-text-muted ml-0.5">
                  {trend.label}
                </span>
              )}
            </div>
          ) : (
            <span />
          )}
          {subtext && (
            <span className="text-xs text-dark-text-secondary truncate">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
