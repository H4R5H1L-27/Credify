import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Copy, Check, ExternalLink } from 'lucide-react';

export interface TechnicalValueProps {
  value: string;
  label?: string;
  type?: 'address' | 'hash' | 'number' | 'text' | 'timestamp' | 'bytes';
  chars?: number;
  copyable?: boolean;
  href?: string;
  className?: string;
}

export const TechnicalValue: React.FC<TechnicalValueProps> = ({
  value,
  label,
  type = 'text',
  chars,
  copyable = true,
  href,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  let displayValue = value;
  if (type === 'address' && value.startsWith('0x') && value.length === 42) {
    const c = chars || 4;
    displayValue = `${value.slice(0, c + 2)}...${value.slice(-c)}`;
  } else if (type === 'hash' && value.startsWith('0x') && value.length === 66) {
    const c = chars || 6;
    displayValue = `${value.slice(0, c + 2)}...${value.slice(-c)}`;
  }

  const content = (
    <span className="font-mono text-dark-text-primary tracking-tight font-medium">
      {displayValue}
    </span>
  );

  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
      {label && <span className="text-dark-text-muted text-[11px] font-sans">{label}:</span>}

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 hover:underline transition-colors"
        >
          {content}
          <ExternalLink className="w-3 h-3 opacity-70" />
        </a>
      ) : (
        content
      )}

      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          title={`Copy ${value}`}
          className="p-1 rounded text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-bg-3 transition-colors cursor-pointer"
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
};
