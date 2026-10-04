import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { AddressBadge } from './AddressBadge';
import { triggerConfetti } from './Confetti';
import { AnimatedCheckmark } from './MicroInteractions';
import { Clock, AlertCircle, Loader2, Key, XCircle, ShieldAlert, WifiOff } from 'lucide-react';

export type TxLifecycleStep =
  | 'preparing'
  | 'awaiting_wallet'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'failed'
  | 'rejected';

export type TxErrorCategory =
  | 'user_rejected'        // user rejected wallet request
  | 'contract_reverted'     // contract reverted
  | 'network_error'         // network error
  | 'confirmation_failure'; // confirmation failure

export interface TxState {
  step: TxLifecycleStep;
  title: string;
  description?: string;
  txHash?: string;
  blockNumber?: string | number;
  error?: string;
  errorCode?: string;
  errorCategory?: TxErrorCategory;
  isMetaMask?: boolean;
}

export const TransactionLifecycle: React.FC<{
  state: TxState;
  className?: string;
}> = ({ state, className }) => {
  const prevStepRef = useRef<TxLifecycleStep | null>(null);

  // Trigger confetti burst on confirmed milestone
  useEffect(() => {
    if (state.step === 'confirmed' && prevStepRef.current !== 'confirmed') {
      triggerConfetti({
        particleCount: 90,
        origin: { x: 0.5, y: 0.42 },
        spread: 75,
        startVelocity: 35,
      });
    }
    prevStepRef.current = state.step;
  }, [state.step]);

  const normalSteps: { id: TxLifecycleStep; label: string }[] = [
    { id: 'preparing', label: '1. Preparing' },
    { id: 'awaiting_wallet', label: '2. Sign in Wallet' },
    { id: 'submitted', label: '3. Submitted to EVM' },
    { id: 'confirming', label: '4. Confirming Block' },
    { id: 'confirmed', label: '5. Confirmed & Synced' },
  ];

  const getStepStatus = (stepId: TxLifecycleStep) => {
    if (state.step === 'failed' || state.step === 'rejected') return 'terminal';
    const order: TxLifecycleStep[] = [
      'preparing',
      'awaiting_wallet',
      'submitted',
      'confirming',
      'confirmed',
    ];
    const currentIndex = order.indexOf(state.step);
    const stepIndex = order.indexOf(stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getErrorCategoryBadge = () => {
    switch (state.errorCategory) {
      case 'user_rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            User Rejected Wallet Request
          </span>
        );
      case 'contract_reverted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Contract Reverted
          </span>
        );
      case 'network_error':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-300">
            <WifiOff className="w-3 h-3 text-orange-600" />
            Network Error
          </span>
        );
      case 'confirmation_failure':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            Confirmation Failure
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {state.step === 'confirmed' ? (
            <AnimatedCheckmark size={24} color="#059669" />
          ) : state.step === 'rejected' ? (
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          ) : state.step === 'failed' ? (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          ) : (
            <Loader2 className="w-5 h-5 animate-spin text-yellow-600" />
          )}
          <span className="font-black text-sm text-slate-950 tracking-tight">
            {state.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-300 text-yellow-950 flex items-center gap-1">
            <Key className="w-2.5 h-2.5" />
            MetaMask
          </span>
        </div>
      </div>

      {state.description && (
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {state.description}
        </p>
      )}

      {/* Progress steps */}
      {state.step !== 'rejected' && (
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {normalSteps.map((s) => {
            const status = getStepStatus(s.id);
            return (
              <div key={s.id} className="flex flex-col gap-1">
                <div
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    status === 'completed' && 'bg-emerald-500',
                    status === 'active' && 'bg-[#ffe600] animate-pulse border border-yellow-400',
                    status === 'pending' && 'bg-slate-100 border border-slate-200',
                    status === 'terminal' && 'bg-slate-100 border border-slate-200'
                  )}
                />
                <span
                  className={cn(
                    'text-[9px] truncate',
                    status === 'completed' && 'text-emerald-700 font-bold',
                    status === 'active' && 'text-slate-950 font-black',
                    status === 'pending' && 'text-slate-400 font-medium',
                    status === 'terminal' && 'text-slate-400 font-medium'
                  )}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Blockchain Evidence metadata */}
      {(state.txHash || state.blockNumber) && (
        <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 font-medium">
          {state.blockNumber && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Block #{state.blockNumber}</span>
            </div>
          )}
          {state.txHash && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Tx:</span>
              <AddressBadge address={state.txHash} digits={6} />
            </div>
          )}
        </div>
      )}

      {/* Rejected display */}
      {state.step === 'rejected' && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-950">Signature Request Denied</span>
            {getErrorCategoryBadge()}
          </div>
          <div className="font-medium text-amber-900">{state.error || 'The transaction was cancelled or rejected by the user in MetaMask.'}</div>
          <div className="text-[11px] text-amber-800 font-medium">
            No funds or gas were spent. You can adjust transaction parameters and try again whenever ready.
          </div>
        </div>
      )}

      {/* Failed display */}
      {state.step === 'failed' && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-950">
              {state.errorCode ? `Error: ${state.errorCode}` : 'Transaction Execution Failed'}
            </span>
            {getErrorCategoryBadge()}
          </div>
          <div className="text-rose-900 leading-relaxed font-mono text-[11px] font-medium">
            {state.error || 'The smart contract transaction reverted or failed execution.'}
          </div>
        </div>
      )}
    </div>
  );
};
