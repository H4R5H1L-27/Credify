import React from 'react';
import { cn } from '../../lib/utils';
import { ShieldCheck } from 'lucide-react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  role?: string;
  verified?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  role,
  verified = false,
  size = 'md',
  className,
  ...props
}) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
  };

  const ringClasses = role === 'BORROWER'
    ? 'ring-brand-500/30'
    : role === 'LENDER'
    ? 'ring-emerald-500/30'
    : role === 'MERCHANT'
    ? 'ring-purple-500/30'
    : 'ring-dark-border-default';

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={cn(
          'rounded-full bg-dark-bg-3 border border-dark-border-default text-dark-text-primary font-bold font-mono flex items-center justify-center select-none ring-2',
          ringClasses,
          sizeClasses[size],
          className
        )}
        title={`${name} (${role || 'User'})`}
        {...props}
      >
        <span>{initials}</span>
      </div>
      {verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 bg-dark-bg-1 text-emerald-400 rounded-full p-0.5 border border-dark-border-subtle"
          title="On-chain Verified Identity"
        >
          <ShieldCheck className="w-3 h-3" />
        </span>
      )}
    </div>
  );
};
