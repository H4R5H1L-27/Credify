import React from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button, AddressBadge, Skeleton } from '../../components/ui';
import { ShieldCheck, AlertCircle, ArrowLeft, Building, Tag, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react';

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
        <Skeleton className="h-8 w-48 bg-slate-200" />
        <Skeleton className="h-96 w-full rounded-2xl bg-slate-200" />
      </div>
    );
  }

  const businessName = supplier?.businessName || identity?.displayName || 'Authorized Commercial Vendor';
  const category = supplier?.category || 'Laboratory Equipment & Hardware';

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="space-y-2">
        <Link
          to="/app/supplier/overview"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Corporate Overview</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Corporate Vendor Profile
        </h1>
        <p className="text-xs text-slate-600 font-medium">
          Verified business identity, on-chain KYCRegistry attestation, and direct payment destination configuration.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-950 tracking-tight">
              {businessName}
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Verified Commercial Merchant · Credify Multi-Lender Credit Protocol
            </p>
          </div>

          <div>
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                KYCRegistry Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                {verificationStatus === 'PENDING' ? 'Verification Pending' : 'Unverified Merchant'}
              </span>
            )}
          </div>
        </div>

        {/* Business Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-bold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              Registered Commercial Entity
            </span>
            <div className="font-bold text-slate-950 text-sm font-sans">{businessName}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-bold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              Approved Procurement Category
            </span>
            <div className="font-bold text-yellow-950 text-sm font-mono">{category}</div>
          </div>
        </div>

        {/* Direct Remittance Wallet */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="font-bold text-slate-950 flex items-center justify-between">
            <span>Direct Remittance Destination Wallet</span>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded font-bold border border-emerald-300">
              NON-CUSTODIAL
            </span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
            When commercial buyers execute spending transactions under authorized credit facilities, the smart contract transfers funds directly to this destination without intermediate custody.
          </p>
          <div className="pt-2">
            <AddressBadge address={address || ''} digits={10} className="text-xs" />
          </div>
        </div>

        {/* KYCRegistry Status Banner */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
          <div className="font-bold text-slate-950 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            KYCRegistry On-Chain Attestation
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
            {isVerified
              ? 'Your merchant address holds an active cryptographic attestation recorded in the KYCRegistry smart contract. Commercial buyers are authorized to include your business on agreement spending policies.'
              : 'Your merchant address has not yet completed on-chain attestation in KYCRegistry. Submit your corporate verification request to become eligible as a direct procurement destination.'}
          </p>
          {!isVerified && (
            <div className="pt-1">
              <Link to="/app/verify">
                <Button size="sm" variant="primary" icon={<ArrowUpRight className="w-3.5 h-3.5" />} className="font-bold">
                  Submit Corporate Verification
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Settlement Protocol Architecture Note */}
        <div className="p-4 rounded-xl bg-yellow-50/70 border border-yellow-300 flex items-start gap-3 text-xs text-slate-800">
          <Lock className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-950">Payment Security Guarantee</span>
            <p className="text-[11px] leading-relaxed font-medium">
              All disbursements are settled atomically via smart contract call <code className="text-[10px] font-mono text-black bg-yellow-200/80 px-1 py-0.5 rounded font-bold">LoanPool.spend()</code>. Funds cannot be routed to unauthorized third parties or frozen by intermediaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SupplierProfilePage;
