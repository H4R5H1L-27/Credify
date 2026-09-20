import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { AddressBadge } from './AddressBadge';
import {
  ShieldCheck,
  FileText,
  Coins,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  X,
} from 'lucide-react';

import { triggerConfetti } from './Confetti';
import { AnimatedCheckmark, AnimatedShield, AnimatedCoin } from './MicroInteractions';

export type MilestoneType =
  | 'IDENTITY_VERIFIED'
  | 'AGREEMENT_CREATED'
  | 'AGREEMENT_ACTIVATED'
  | 'PAYMENT_CONFIRMED'
  | 'REPAYMENT_COMPLETED'
  | 'AGREEMENT_DEFAULTED';

export interface MilestoneCelebrationProps {
  open: boolean;
  onClose: () => void;
  type: MilestoneType;
  txHash?: string;
  contractAddress?: string;
  blockNumber?: number | string;
  amountEth?: string;
  reputationDelta?: number;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const MILESTONE_CONFIGS: Record<
  MilestoneType,
  {
    title: string;
    subtitle: string;
    badgeLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    glowColor: string;
    ringColor: string;
    textColor: string;
  }
> = {
  IDENTITY_VERIFIED: {
    title: 'Corporate Identity Verified',
    subtitle: 'KYCRegistry on-chain cryptographic attestation confirmed. Account authorized for protocol operations.',
    badgeLabel: 'KYC REGISTRY ATTESTATION',
    icon: ShieldCheck,
    accentColor: 'bg-emerald-500',
    glowColor: 'shadow-emerald-500/20',
    ringColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
  },
  AGREEMENT_CREATED: {
    title: 'Credit Facility Deployed',
    subtitle: 'Smart contract credit pool agreement committed to blockchain. Open for institutional syndicate funding.',
    badgeLabel: 'SMART CONTRACT DEPLOYMENT',
    icon: FileText,
    accentColor: 'bg-brand-500',
    glowColor: 'shadow-brand-500/20',
    ringColor: 'border-brand-500/30',
    textColor: 'text-brand-400',
  },
  AGREEMENT_ACTIVATED: {
    title: 'Syndicate Fully Subscribed',
    subtitle: '100% funding target reached by participating lenders. Controlled procurement drawdowns unlocked.',
    badgeLabel: 'LIFECYCLE ACTIVATION',
    icon: Coins,
    accentColor: 'bg-brand-500',
    glowColor: 'shadow-brand-500/20',
    ringColor: 'border-brand-500/30',
    textColor: 'text-brand-400',
  },
  PAYMENT_CONFIRMED: {
    title: 'Procurement Payment Settled',
    subtitle: 'Direct drawdown from escrow settled atomically to verified merchant wallet without intermediate custody.',
    badgeLabel: 'ATOMIC DISBURSEMENT',
    icon: CheckCircle2,
    accentColor: 'bg-emerald-500',
    glowColor: 'shadow-emerald-500/20',
    ringColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
  },
  REPAYMENT_COMPLETED: {
    title: 'Credit Facility Fully Settled',
    subtitle: 'All principal and fixed interest obligations fulfilled. Institutional credit track record upgraded.',
    badgeLabel: 'TERMINAL SETTLEMENT',
    icon: Sparkles,
    accentColor: 'bg-emerald-500',
    glowColor: 'shadow-emerald-500/20',
    ringColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
  },
  AGREEMENT_DEFAULTED: {
    title: 'Consensus Default Finalized',
    subtitle: 'Lender consensus threshold crossed. Agreement transitioned to default with on-chain penalty.',
    badgeLabel: 'GOVERNANCE RESOLUTION',
    icon: AlertTriangle,
    accentColor: 'bg-rose-500',
    glowColor: 'shadow-rose-500/20',
    ringColor: 'border-rose-500/30',
    textColor: 'text-rose-400',
  },
};

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
  open,
  onClose,
  type,
  txHash,
  contractAddress,
  blockNumber,
  amountEth,
  reputationDelta,
  primaryAction,
}) => {
  useEffect(() => {
    if (open && type !== 'AGREEMENT_DEFAULTED') {
      // Trigger celebratory particle starburst
      triggerConfetti({
        particleCount: 110,
        origin: { x: 0.5, y: 0.38 },
        spread: 85,
        startVelocity: 42,
      });
    }
  }, [open, type]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const config = MILESTONE_CONFIGS[type];
  const Icon = config.icon;

  const renderAnimatedMicroIcon = () => {
    if (type === 'IDENTITY_VERIFIED') {
      return <AnimatedShield size={44} verified={true} />;
    }
    if (type === 'PAYMENT_CONFIRMED' || type === 'AGREEMENT_ACTIVATED') {
      return <AnimatedCoin size={44} />;
    }
    if (type === 'REPAYMENT_COMPLETED' || type === 'AGREEMENT_CREATED') {
      return <AnimatedCheckmark size={44} color="#10B981" />;
    }
    return <Icon className="w-7 h-7 text-white" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Ambient Backdrop */}
      <div
        className="fixed inset-0 bg-dark-bg-0/85 backdrop-blur-sm transition-opacity duration-normal"
        onClick={onClose}
      />

      {/* Milestone Modal Card */}
      <div
        className={cn(
          'relative z-50 surface-glass shadow-depth-elevated rounded-2xl max-w-md w-full p-6 sm:p-8 text-center overflow-hidden animate-milestone-enter'
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-bg-3 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Milestone Icon Ring with Single-Shot Expansion Pulse */}
        <div className="relative mx-auto w-16 h-16 mb-5 flex items-center justify-center">
          <div
            className={cn(
              'absolute inset-0 rounded-full border-2 animate-milestone-ring pointer-events-none',
              config.ringColor
            )}
          />
          <div
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center shadow-lg',
              config.accentColor,
              config.glowColor
            )}
          >
            {renderAnimatedMicroIcon()}
          </div>
        </div>

        {/* Badge */}
        <div className="mb-2">
          <span
            className={cn(
              'inline-flex items-center text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border bg-dark-bg-1',
              config.ringColor,
              config.textColor
            )}
          >
            {config.badgeLabel}
          </span>
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-xl font-bold tracking-tight text-dark-text-primary">
          {config.title}
        </h3>
        <p className="text-xs text-dark-text-secondary mt-1.5 leading-relaxed">
          {config.subtitle}
        </p>

        {/* Milestone Attributes Grid */}
        <div className="mt-5 rounded-xl border border-dark-border-subtle bg-dark-bg-1 p-3.5 space-y-2 text-left text-xs font-mono">
          {amountEth && (
            <div className="flex items-center justify-between">
              <span className="text-dark-text-muted">Settlement Volume</span>
              <span className="font-bold text-emerald-400">{amountEth} ETH</span>
            </div>
          )}

          {reputationDelta !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-dark-text-muted">Reputation Score Impact</span>
              <span
                className={cn(
                  'font-bold',
                  reputationDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {reputationDelta >= 0 ? `+${reputationDelta} pts` : `${reputationDelta} pts`}
              </span>
            </div>
          )}

          {contractAddress && (
            <div className="flex items-center justify-between">
              <span className="text-dark-text-muted">Contract Pool</span>
              <AddressBadge address={contractAddress} digits={5} />
            </div>
          )}

          {blockNumber && (
            <div className="flex items-center justify-between">
              <span className="text-dark-text-muted">Block Height</span>
              <span className="text-dark-text-primary">#{blockNumber}</span>
            </div>
          )}

          {txHash && (
            <div className="flex items-center justify-between">
              <span className="text-dark-text-muted">Transaction</span>
              <AddressBadge address={txHash} digits={6} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          {primaryAction && (
            <Button
              variant="primary"
              className="w-full sm:w-auto"
              onClick={() => {
                primaryAction.onClick();
                onClose();
              }}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {primaryAction.label}
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};
export default MilestoneCelebration;
