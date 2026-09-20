import React from 'react';
import { cn } from '../../lib/utils';
import { Store, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { AddressBadge } from './AddressBadge';
import { Badge } from './Badge';
import { Button } from './Button';

export interface MerchantCardProps {
  name: string;
  address: string;
  category: string;
  isVerified?: boolean;
  disbursementVolume?: string;
  activeAgreementsCount?: number;
  onSelect?: () => void;
  actionLabel?: string;
  className?: string;
}

export const MerchantCard: React.FC<MerchantCardProps> = ({
  name,
  address,
  category,
  isVerified = true,
  disbursementVolume,
  activeAgreementsCount,
  onSelect,
  actionLabel = 'Select Supplier',
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-dark-border-default bg-dark-bg-2 p-4 transition-all hover:border-dark-border-strong hover:bg-dark-bg-2/90 flex flex-col justify-between gap-4',
        className
      )}
    >
      <div className="space-y-3">
        {/* Header: Name + Verified Pill */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-dark-bg-3 border border-dark-border-subtle flex items-center justify-center text-dark-text-secondary">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-semibold text-dark-text-primary">
                  {name}
                </h4>
                {isVerified && (
                  <span title="Verified Supplier">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </span>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 mt-0.5">
                {category}
              </Badge>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="pt-1">
          <AddressBadge address={address} digits={6} />
        </div>

        {/* Financial Metrics */}
        {(disbursementVolume !== undefined || activeAgreementsCount !== undefined) && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dark-border-subtle text-xs">
            {disbursementVolume !== undefined && (
              <div>
                <span className="text-[10px] text-dark-text-muted uppercase tracking-wider block">Disbursed</span>
                <span className="font-mono text-dark-text-primary font-medium">{disbursementVolume}</span>
              </div>
            )}
            {activeAgreementsCount !== undefined && (
              <div>
                <span className="text-[10px] text-dark-text-muted uppercase tracking-wider block">Agreements</span>
                <span className="font-mono text-dark-text-primary font-medium">{activeAgreementsCount} Active</span>
              </div>
            )}
          </div>
        )}
      </div>

      {onSelect && (
        <div className="pt-2 border-t border-dark-border-subtle">
          <Button
            size="sm"
            variant="secondary"
            onClick={onSelect}
            className="w-full text-xs flex items-center justify-center gap-1.5"
          >
            <span>{actionLabel}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};
