import React from 'react';
import { cn } from '../../lib/utils';
import { Wallet } from 'lucide-react';

export interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  maxAmount?: string;
  balance?: string;
  symbol?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  onMaxClick?: () => void;
  className?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  maxAmount,
  balance,
  symbol = 'ETH',
  placeholder = '0.00',
  disabled = false,
  error,
  label,
  onMaxClick,
  className,
}) => {
  const handleMax = () => {
    if (onMaxClick) {
      onMaxClick();
    } else if (maxAmount) {
      onChange(maxAmount);
    }
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || balance) && (
        <div className="flex items-center justify-between text-xs">
          {label && <label className="font-medium text-dark-text-secondary">{label}</label>}
          {balance !== undefined && (
            <div className="flex items-center gap-1.5 text-dark-text-muted">
              <Wallet className="w-3 h-3" />
              <span>Balance:</span>
              <span className="font-mono text-dark-text-primary font-medium">{balance} {symbol}</span>
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          'relative flex items-center rounded-lg border bg-dark-bg-1 transition-all',
          'focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/30',
          error
            ? 'border-crimson-500/80 focus-within:border-crimson-500 focus-within:ring-crimson-500/20'
            : 'border-dark-border-default hover:border-dark-border-strong',
          disabled && 'opacity-50 cursor-not-allowed bg-dark-bg-0'
        )}
      >
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            // Allow numbers and single decimal point
            if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
              onChange(val);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full bg-transparent px-3.5 py-2.5 font-mono text-base font-medium text-dark-text-primary placeholder:text-dark-text-muted focus:outline-hidden',
            disabled && 'cursor-not-allowed'
          )}
        />

        <div className="flex items-center gap-2 pr-3 shrink-0">
          {(maxAmount !== undefined || onMaxClick) && (
            <button
              type="button"
              onClick={handleMax}
              disabled={disabled}
              className="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-brand-400 bg-brand-500/10 border border-brand-500/30 hover:bg-brand-500/20 hover:text-brand-300 transition-colors uppercase cursor-pointer disabled:opacity-40"
            >
              MAX
            </button>
          )}

          <div className="h-4 w-px bg-dark-border-subtle" />

          <span className="font-mono text-xs font-semibold text-dark-text-secondary">
            {symbol}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-[11px] font-medium text-crimson-400">{error}</p>
      )}
    </div>
  );
};
