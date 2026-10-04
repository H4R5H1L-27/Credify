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
    card: 'p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5 transition-all hover:border-slate-300 hover:shadow-md duration-normal',
    flat: 'p-3 rounded-xl bg-transparent border-0 space-y-2',
    hero: 'p-6 rounded-2xl bg-white border-2 border-yellow-400 shadow-md space-y-3.5 relative overflow-hidden',
  };

  return (
    <div
      className={cn(containerVariants[variant], className)}
      {...props}
    >
      {variant === 'hero' && (
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#ffe600]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-xs text-slate-700 tracking-wide uppercase">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {badge}
          {icon && <span className="text-slate-600">{icon}</span>}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 flex-wrap">
        <div
          className={cn(
            'font-bold font-mono tracking-tight text-slate-950',
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
          <span className="text-base font-mono font-bold text-slate-800">
            {unit}
          </span>
        )}
      </div>

      {(trend || subtext) && (
        <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
          {trend ? (
            <div
              className={`flex items-center gap-1 font-mono text-xs font-bold ${
                trend.positive !== false ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {trend.positive !== false ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trend.value}</span>
              {trend.label && (
                <span className="text-xs font-medium text-slate-600 ml-0.5">
                  {trend.label}
                </span>
              )}
            </div>
          ) : (
            <span />
          )}
          {subtext && (
            <span className="text-xs font-medium text-slate-700 truncate">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
