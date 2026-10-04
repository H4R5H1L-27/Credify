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
        'rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-yellow-400 hover:shadow-md flex flex-col justify-between gap-4 shadow-xs',
        className
      )}
    >
      <div className="space-y-3">
        {/* Header: Name + Verified Pill */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center justify-center text-yellow-800 shadow-xs">
              <Store className="w-5 h-5 text-yellow-700" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-slate-950">
                  {name}
                </h4>
                {isVerified && (
                  <span title="Verified Supplier">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </span>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 mt-0.5 border-slate-300 text-slate-700 font-bold">
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
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
            {disbursementVolume !== undefined && (
              <div>
                <span className="text-[10px] text-slate-600 uppercase tracking-wider block font-bold">Disbursed</span>
                <span className="font-mono text-slate-950 font-bold text-sm">{disbursementVolume}</span>
              </div>
            )}
            {activeAgreementsCount !== undefined && (
              <div>
                <span className="text-[10px] text-slate-600 uppercase tracking-wider block font-bold">Agreements</span>
                <span className="font-mono text-slate-950 font-bold text-sm">{activeAgreementsCount} Active</span>
              </div>
            )}
          </div>
        )}
      </div>

      {onSelect && (
        <div className="pt-2 border-t border-slate-100">
          <Button
            size="sm"
            variant="primary"
            onClick={onSelect}
            className="w-full text-xs flex items-center justify-center gap-1.5 font-bold"
          >
            <span>{actionLabel}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};
