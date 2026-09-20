import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Clock } from 'lucide-react';
import { AddressBadge } from './AddressBadge';

export type TxStatus = 'idle' | 'broadcasting' | 'confirming' | 'confirmed' | 'error';

export interface TransactionStateProps {
  status: TxStatus;
  hash?: string;
  confirmations?: number;
  requiredConfirmations?: number;
  title?: string;
  description?: string;
  errorMessage?: string;
  onReset?: () => void;
  className?: string;
}

export const TransactionState: React.FC<TransactionStateProps> = ({
  status,
  hash,
  confirmations = 0,
  requiredConfirmations = 1,
  title,
  description,
  errorMessage,
  onReset,
  className,
}) => {
  if (status === 'idle') return null;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all',
        status === 'broadcasting' && 'border-brand-500/30 bg-brand-500/5',
        status === 'confirming' && 'border-amber-500/30 bg-amber-500/5',
        status === 'confirmed' && 'border-emerald-500/30 bg-emerald-500/5',
        status === 'error' && 'border-crimson-500/30 bg-crimson-500/5',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {status === 'broadcasting' && (
            <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
          )}
          {status === 'confirming' && (
            <Clock className="w-5 h-5 animate-pulse text-amber-400" />
          )}
          {status === 'confirmed' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
          {status === 'error' && (
            <AlertCircle className="w-5 h-5 text-crimson-400" />
          )}
        </div>

        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-dark-text-primary">
              {title ||
                (status === 'broadcasting' && 'Broadcasting Transaction') ||
                (status === 'confirming' && 'Confirming on Blockchain') ||
                (status === 'confirmed' && 'Transaction Confirmed') ||
                (status === 'error' && 'Transaction Failed')}
            </h4>
            {status === 'confirming' && (
              <span className="font-mono text-[11px] text-amber-400 font-medium">
                {confirmations}/{requiredConfirmations} blocks
              </span>
            )}
          </div>

          <p className="text-xs text-dark-text-secondary leading-relaxed">
            {description ||
              (status === 'broadcasting' && 'Waiting for local node to accept transaction broadcast...') ||
              (status === 'confirming' && 'Waiting for block inclusion and receipt confirmation...') ||
              (status === 'confirmed' && 'Transaction has been successfully committed to the ledger.') ||
              (errorMessage || 'An error occurred while executing the transaction.')}
          </p>

          {hash && (
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-dark-border-subtle/50">
              <span className="text-[11px] text-dark-text-muted">TX Hash</span>
              <AddressBadge
                address={hash}
                digits={8}
                variant="mono"
                className="bg-dark-bg-1/80 border-dark-border-subtle"
              />
            </div>
          )}

          {status === 'error' && onReset && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-semibold text-crimson-400 hover:text-crimson-300 underline cursor-pointer"
              >
                Dismiss & Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
