import React, { useState } from 'react';
import { cn, truncateAddress } from '../../lib/utils';
import { Copy, Check } from 'lucide-react';

export interface AddressBadgeProps {
  address: string;
  truncate?: boolean;
  chars?: number;
  digits?: number;
  variant?: 'default' | 'mono';
  className?: string;
  showIcon?: boolean;
}

export const AddressBadge: React.FC<AddressBadgeProps> = ({
  address,
  truncate = true,
  chars = 4,
  digits,
  variant = 'default',
  className,
  showIcon = true,
}) => {
  const [copied, setCopied] = useState(false);
  const length = digits !== undefined ? digits : chars;

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={`Click to copy: ${address}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-xs text-slate-800 bg-slate-100 hover:bg-yellow-50 hover:text-black border border-slate-200 hover:border-yellow-400 font-semibold transition-colors group cursor-pointer select-none',
        variant === 'mono' && 'text-[11px]',
        className
      )}
    >
      <span>{truncate ? truncateAddress(address, length) : address}</span>
      {showIcon && (
        <span className="text-slate-500 group-hover:text-black transition-colors">
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        </span>
      )}
    </button>
  );
};
