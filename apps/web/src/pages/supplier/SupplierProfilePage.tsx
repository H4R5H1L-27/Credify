import React from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button, AddressBadge, Skeleton } from '../../components/ui';
import { Store, ShieldCheck, AlertCircle, ArrowLeft, Building, Tag, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react';

export const SupplierProfilePage: React.FC = () => {
  const { identity, address, isVerified, verificationStatus } = useIdentity();
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.getSuppliers(),
  });

  const supplier = suppliers?.find(
    (s) => s.address.toLowerCase() === address?.toLowerCase()
  );

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48 bg-dark-bg-2" />
        <Skeleton className="h-96 w-full rounded-2xl bg-dark-bg-2" />
      </div>
    );
  }

  const businessName = supplier?.businessName || identity?.displayName || 'Authorized Commercial Vendor';
  const category = supplier?.category || 'Laboratory Equipment & Hardware';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2">
        <Link
          to="/app/supplier/overview"
          className="inline-flex items-center gap-1.5 text-xs text-dark-text-secondary hover:text-dark-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Corporate Overview</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-dark-text-primary">
          Corporate Vendor Profile
        </h1>
        <p className="text-xs text-dark-text-secondary">
          Verified business identity, on-chain KYCRegistry attestation, and direct payment destination configuration.
        </p>
      </div>

      <div className="rounded-2xl border border-dark-border-default bg-dark-bg-2 p-6 sm:p-8 shadow-dark-md space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-dark-border-subtle">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-dark-text-primary tracking-tight">
              {businessName}
            </h2>
            <p className="text-xs text-dark-text-secondary">
              Verified Commercial Merchant · Credify Multi-Lender Credit Protocol
            </p>
          </div>

          <div>
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                KYCRegistry Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                {verificationStatus === 'PENDING' ? 'Verification Pending' : 'Unverified Merchant'}
              </span>
            )}
          </div>
        </div>

        {/* Business Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-dark-bg-1 border border-dark-border-subtle space-y-1">
            <span className="text-dark-text-muted flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-dark-text-muted" />
              Registered Commercial Entity
            </span>
            <div className="font-semibold text-dark-text-primary text-sm font-sans">{businessName}</div>
          </div>

          <div className="p-4 rounded-xl bg-dark-bg-1 border border-dark-border-subtle space-y-1">
            <span className="text-dark-text-muted flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-dark-text-muted" />
              Approved Procurement Category
            </span>
            <div className="font-semibold text-brand-300 text-sm font-mono">{category}</div>
          </div>
        </div>

        {/* Direct Remittance Wallet */}
        <div className="p-5 rounded-xl bg-dark-bg-1 border border-dark-border-subtle space-y-2 text-xs">
          <div className="font-semibold text-dark-text-primary flex items-center justify-between">
            <span>Direct Remittance Destination Wallet</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              NON-CUSTODIAL
            </span>
          </div>
          <p className="text-dark-text-secondary text-[11px] leading-relaxed">
            When commercial buyers execute spending transactions under authorized credit facilities, the smart contract transfers funds directly to this destination without intermediate custody.
          </p>
          <div className="pt-2">
            <AddressBadge address={address || ''} digits={10} className="text-xs" />
          </div>
        </div>

        {/* KYCRegistry Status Banner */}
        <div className="p-5 rounded-xl border border-dark-border-subtle bg-dark-bg-1 space-y-3 text-xs">
          <div className="font-semibold text-dark-text-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            KYCRegistry On-Chain Attestation
          </div>
          <p className="text-dark-text-secondary text-[11px] leading-relaxed">
            {isVerified
              ? 'Your merchant address holds an active cryptographic attestation recorded in the KYCRegistry smart contract. Commercial buyers are authorized to include your business on agreement spending policies.'
              : 'Your merchant address has not yet completed on-chain attestation in KYCRegistry. Submit your corporate verification request to become eligible as a direct procurement destination.'}
          </p>
          {!isVerified && (
            <div className="pt-1">
              <Link to="/app/verify">
                <Button size="sm" variant="primary" icon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                  Submit Corporate Verification
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Settlement Protocol Architecture Note */}
        <div className="p-4 rounded-xl bg-dark-bg-0 border border-dark-border-subtle flex items-start gap-3 text-xs text-dark-text-secondary">
          <Lock className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-dark-text-primary">Payment Security Guarantee</span>
            <p className="text-[11px] leading-relaxed">
              All disbursements are settled atomically via smart contract call <code className="text-[10px] font-mono text-brand-300">LoanPool.spend()</code>. Funds cannot be routed to unauthorized third parties or frozen by intermediaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SupplierProfilePage;
