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
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-xs text-dark-text-secondary bg-dark-bg-3 hover:bg-dark-bg-4 hover:text-dark-text-primary border border-dark-border-default hover:border-dark-border-strong transition-colors group cursor-pointer select-none',
        variant === 'mono' && 'text-[11px]',
        className
      )}
    >
      <span>{truncate ? truncateAddress(address, length) : address}</span>
      {showIcon && (
        <span className="text-dark-text-muted group-hover:text-dark-text-secondary transition-colors">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </span>
      )}
    </button>
  );
};
