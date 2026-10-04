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
    <span className="font-mono text-slate-900 tracking-tight font-bold">
      {displayValue}
    </span>
  );

  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
      {label && <span className="text-slate-600 text-xs font-sans font-medium">{label}:</span>}

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-yellow-800 hover:text-black hover:underline transition-colors font-bold"
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
          className="p-1 rounded text-slate-500 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-600" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
};
