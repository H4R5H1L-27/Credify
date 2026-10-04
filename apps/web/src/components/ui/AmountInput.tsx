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
          {label && <label className="font-semibold text-slate-700">{label}</label>}
          {balance !== undefined && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Wallet className="w-3.5 h-3.5" />
              <span>Balance:</span>
              <span className="font-mono text-slate-950 font-bold">{balance} {symbol}</span>
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          'relative flex items-center rounded-xl border bg-white transition-all shadow-xs',
          'focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-300/40',
          error
            ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-200'
            : 'border-slate-300 hover:border-slate-400',
          disabled && 'opacity-50 cursor-not-allowed bg-slate-100'
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
            'w-full bg-transparent px-3.5 py-2.5 font-mono text-base font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none',
            disabled && 'cursor-not-allowed'
          )}
        />

        <div className="flex items-center gap-2 pr-3 shrink-0">
          {(maxAmount !== undefined || onMaxClick) && (
            <button
              type="button"
              onClick={handleMax}
              disabled={disabled}
              className="rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-black bg-[#ffe600] border border-yellow-400 hover:bg-[#facc15] transition-colors uppercase cursor-pointer disabled:opacity-40"
            >
              MAX
            </button>
          )}

          <div className="h-4 w-px bg-slate-200" />

          <span className="font-mono text-xs font-bold text-slate-900">
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
