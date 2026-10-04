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
        'rounded-2xl border p-4 transition-all shadow-xs',
        status === 'broadcasting' && 'border-yellow-300 bg-yellow-50 text-yellow-950',
        status === 'confirming' && 'border-amber-300 bg-amber-50 text-amber-950',
        status === 'confirmed' && 'border-emerald-300 bg-emerald-50 text-emerald-950',
        status === 'error' && 'border-rose-300 bg-rose-50 text-rose-950',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {status === 'broadcasting' && (
            <Loader2 className="w-5 h-5 animate-spin text-yellow-700" />
          )}
          {status === 'confirming' && (
            <Clock className="w-5 h-5 animate-pulse text-amber-700" />
          )}
          {status === 'confirmed' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          )}
          {status === 'error' && (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
        </div>

        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-slate-950">
              {title ||
                (status === 'broadcasting' && 'Broadcasting Transaction') ||
                (status === 'confirming' && 'Confirming on Blockchain') ||
                (status === 'confirmed' && 'Transaction Confirmed') ||
                (status === 'error' && 'Transaction Failed')}
            </h4>
            {status === 'confirming' && (
              <span className="font-mono text-[11px] text-amber-800 font-bold">
                {confirmations}/{requiredConfirmations} blocks
              </span>
            )}
          </div>

          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {description ||
              (status === 'broadcasting' && 'Waiting for local node to accept transaction broadcast...') ||
              (status === 'confirming' && 'Waiting for block inclusion and receipt confirmation...') ||
              (status === 'confirmed' && 'Transaction has been successfully committed to the ledger.') ||
              (errorMessage || 'An error occurred while executing the transaction.')}
          </p>

          {hash && (
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">TX Hash</span>
              <AddressBadge
                address={hash}
                digits={8}
                variant="mono"
                className="bg-white border-slate-200 text-slate-900"
              />
            </div>
          )}

          {status === 'error' && onReset && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
