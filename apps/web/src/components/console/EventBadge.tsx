import React from 'react';
import { cn } from '../../lib/utils';
import {
  FileText,
  Coins,
  CheckCircle2,
  Send,
  ArrowUpRight,
  Sparkles,
  Vote,
  AlertTriangle,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export interface EventBadgeProps {
  eventName: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const EVENT_CONFIG: Record<
  string,
  { label: string; text: string; bg: string; border: string; icon: React.ReactNode }
> = {
  LoanCreated: {
    label: 'LoanCreated',
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    icon: <FileText className="w-3 h-3 text-indigo-400" />,
  },
  LoanPoolCreated: {
    label: 'LoanPoolCreated',
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    icon: <FileText className="w-3 h-3 text-indigo-400" />,
  },
  Funded: {
    label: 'Funded',
    text: 'text-brand-400',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/30',
    icon: <Coins className="w-3 h-3 text-brand-400" />,
  },
  LoanActivated: {
    label: 'LoanActivated',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
  },
  SpendExecuted: {
    label: 'SpendExecuted',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: <Send className="w-3 h-3 text-purple-400" />,
  },
  RepaymentReceived: {
    label: 'RepaymentReceived',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: <ArrowUpRight className="w-3 h-3 text-emerald-400" />,
  },
  LoanRepaid: {
    label: 'LoanRepaid',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: <Sparkles className="w-3 h-3 text-emerald-400" />,
  },
  DefaultVoteCast: {
    label: 'DefaultVoteCast',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: <Vote className="w-3 h-3 text-amber-400" />,
  },
  LoanDefaulted: {
    label: 'LoanDefaulted',
    text: 'text-crimson-400',
    bg: 'bg-crimson-500/10',
    border: 'border-crimson-500/30',
    icon: <AlertTriangle className="w-3 h-3 text-crimson-400" />,
  },
  ReputationUpdated: {
    label: 'ReputationUpdated',
    text: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    icon: <ShieldCheck className="w-3 h-3 text-teal-400" />,
  },
  VerificationUpdated: {
    label: 'VerificationUpdated',
    text: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    icon: <ShieldCheck className="w-3 h-3 text-teal-400" />,
  },
};

export const EventBadge: React.FC<EventBadgeProps> = ({
  eventName,
  size = 'sm',
  showIcon = true,
  className,
}) => {
  const config = EVENT_CONFIG[eventName] || {
    label: eventName,
    text: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    icon: <Layers className="w-3 h-3 text-slate-500" />,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-semibold rounded-md border',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-bold',
        className
      )}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
