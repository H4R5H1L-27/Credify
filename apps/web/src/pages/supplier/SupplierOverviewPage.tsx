import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useLoans, useSupplierDisbursements } from '../../hooks/useCredify';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Button,
  Badge,
  StatusBadge,
  AddressBadge,
  Skeleton,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  NumberTicker,
} from '../../components/ui';
import { TransactionInspectModal, DisbursementDetail } from '../../components/supplier/TransactionInspectModal';
import { formatEther, formatEtherNum, timeAgo, formatDate } from '../../lib/utils';
import {
  Store,
  Download,
  ShieldCheck,
  FileText,
  ArrowRight,
  AlertCircle,
  Clock,
  Search,
  Tag,
  Building,
  CreditCard,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const SupplierOverviewPage: React.FC = () => {
  const { identity, address, isVerified } = useIdentity();
  const { data: loans, isLoading: loansLoading } = useLoans();
  const { data: disbursementData, isLoading: disbursementsLoading } = useSupplierDisbursements(address);
  const [selectedDisbursement, setSelectedDisbursement] = useState<DisbursementDetail | null>(null);
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.getSuppliers(),
  });

  const supplierProfile = suppliers?.find(
    (s) => s.address.toLowerCase() === address?.toLowerCase()
  );

  const disbursements = disbursementData?.disbursements || [];
  const totalEth = disbursementData?.totalDisbursedEth || '0.00';

  // Agreements where this merchant is approved
  const authorizedLoans = useMemo(() => {
    if (!loans || !address) return [];
    const lower = address.toLowerCase();
    return loans.filter((l) =>
      l.merchants.some((m) => m.toLowerCase() === lower)
    );
  }, [loans, address]);

  // Average settlement amount
  const avgSettlementEth = useMemo(() => {
    if (disbursements.length === 0) return '0.00';
    const total = parseFloat(totalEth);
    return (total / disbursements.length).toFixed(3);
  }, [disbursements, totalEth]);

  if (loansLoading || disbursementsLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64 bg-dark-bg-2" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 bg-dark-bg-2 rounded-xl" />
          <Skeleton className="h-24 bg-dark-bg-2 rounded-xl" />
          <Skeleton className="h-24 bg-dark-bg-2 rounded-xl" />
          <Skeleton className="h-24 bg-dark-bg-2 rounded-xl" />
        </div>
        <Skeleton className="h-96 bg-dark-bg-2 rounded-2xl" />
      </div>
    );
  }

  const businessName =
    supplierProfile?.businessName || identity?.displayName || 'Authorized Commercial Vendor';
  const categoryName = supplierProfile?.category || 'Laboratory Equipment & Hardware';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Corporate Vendor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-dark-text-primary">
              {businessName}
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-300">
              <Tag className="w-3 h-3 text-brand-400" />
              {categoryName}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-dark-text-secondary">
            <span>Settlement Destination:</span>
            <AddressBadge address={address || ''} digits={6} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              KYCRegistry Verified
            </span>
          ) : (
            <Link
              to="/app/verify"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Verification Pending
            </Link>
          )}

          <Link to="/app/supplier/profile">
            <Button size="sm" variant="outline" icon={<Building className="w-3.5 h-3.5" />}>
              Corporate Profile
            </Button>
          </Link>
        </div>
      </div>
      {/* Commercial Payments Accounting Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-dark-border-default bg-dark-bg-2 p-4">
          <span className="text-[11px] uppercase tracking-wider text-dark-text-muted font-medium">
            Gross Settled Revenue
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              <NumberTicker value={parseFloat(totalEth) || 0} decimalPlaces={2} /> ETH
            </span>
          </div>
          <p className="text-xs text-dark-text-secondary mt-1">
            Settled directly from pool escrows
          </p>
        </div>

        <div className="rounded-xl border border-dark-border-default bg-dark-bg-2 p-4">
          <span className="text-[11px] uppercase tracking-wider text-dark-text-muted font-medium">
            Authorized Buyer Facilities
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-dark-text-primary">
              <NumberTicker value={authorizedLoans.length} />
            </span>
            <span className="text-xs text-dark-text-secondary">active accounts</span>
          </div>
          <p className="text-xs text-dark-text-secondary mt-1">
            Credit facilities whitelisting vendor
          </p>
        </div>

        <div className="rounded-xl border border-dark-border-default bg-dark-bg-2 p-4">
          <span className="text-[11px] uppercase tracking-wider text-dark-text-muted font-medium">
            Remittance Transactions
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-dark-text-primary">
              <NumberTicker value={disbursements.length} />
            </span>
            <span className="text-xs text-dark-text-secondary">settlements</span>
          </div>
          <p className="text-xs text-dark-text-secondary mt-1">
            Cryptographically verified proofs
          </p>
        </div>

        <div className="rounded-xl border border-dark-border-default bg-dark-bg-2 p-4">
          <span className="text-[11px] uppercase tracking-wider text-dark-text-muted font-medium">
            Average Settlement
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-brand-400">
              <NumberTicker value={parseFloat(avgSettlementEth) || 0} decimalPlaces={2} /> ETH
            </span>
          </div>
          <p className="text-xs text-dark-text-secondary mt-1">
            Per verified procurement drawdown
          </p>
        </div>
      </div>

      {/* Recent Disbursements Table */}
      <div className="rounded-2xl border border-dark-border-default bg-dark-bg-2 p-6 shadow-dark-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-dark-border-subtle">
          <div>
            <h3 className="text-base font-semibold text-dark-text-primary tracking-tight">
              Incoming Business Disbursements
            </h3>
            <p className="text-xs text-dark-text-secondary mt-0.5">
              Direct on-chain settlements executed under authorized buyer credit facilities.
            </p>
          </div>
          <Link to="/app/supplier/disbursements">
            <Button variant="ghost" size="sm" className="text-xs text-brand-400 hover:text-brand-300">
              View Full Remittance Ledger →
            </Button>
          </Link>
        </div>

        {disbursements.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-dark-border-subtle rounded-xl bg-dark-bg-1 space-y-3">
            <Download className="w-10 h-10 text-dark-text-muted mx-auto" />
            <h4 className="text-sm font-semibold text-dark-text-primary">No Disbursements Received Yet</h4>
            <p className="text-xs text-dark-text-secondary max-w-sm mx-auto">
              When authorized buyers execute procurement spend transactions under active credit facilities, disbursements settle directly to your destination wallet.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commercial Buyer & Facility</TableHead>
                <TableHead>Procurement Category</TableHead>
                <TableHead>Remittance Amount</TableHead>
                <TableHead>Blockchain Confirmation</TableHead>
                <TableHead>Settlement Time</TableHead>
                <TableHead className="text-right">Remittance Proof</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disbursements.slice(0, 5).map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs text-dark-text-primary">
                        {d.borrowerName || 'Commercial Buyer'}
                      </div>
                      <div className="text-[10px] text-dark-text-muted font-mono flex items-center gap-1">
                        <span>Facility:</span>
                        <AddressBadge address={d.loanId} digits={4} />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[10px] font-mono">
                      <Tag className="w-2.5 h-2.5 text-brand-400" />
                      {d.categoryText || 'Procurement'}
                    </span>
                  </TableCell>

                  <TableCell className="font-mono">
                    <div className="font-bold text-emerald-400 text-xs">
                      {parseFloat(d.amountEth).toFixed(4)} ETH
                    </div>
                    <div className="text-[10px] text-dark-text-muted">
                      {d.amountWei} Wei
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs">
                    <div className="text-dark-text-secondary">Block #{d.blockNumber}</div>
                    <div className="text-[10px] text-dark-text-muted flex items-center gap-1">
                      <span>Tx:</span>
                      <AddressBadge address={d.transactionHash} digits={4} />
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-dark-text-secondary">
                    <div>{timeAgo(d.timestamp)}</div>
                    <div className="text-[10px] text-dark-text-muted font-mono">
                      {formatDate(String(d.timestamp))}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={<Search className="w-3 h-3" />}
                      onClick={() =>
                        setSelectedDisbursement({
                          ...d,
                          supplierAddress: address,
                        })
                      }
                    >
                      Inspect Proof
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Authorized Agreements Table */}
      <div className="rounded-2xl border border-dark-border-default bg-dark-bg-2 p-6 shadow-dark-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-dark-border-subtle">
          <div>
            <h3 className="text-base font-semibold text-dark-text-primary tracking-tight">
              Authorized Buyer Credit Facilities
            </h3>
            <p className="text-xs text-dark-text-secondary mt-0.5">
              Commercial buyers whose smart contract policies explicitly whitelist your business for direct disbursement.
            </p>
          </div>
          <Link to="/app/supplier/agreements">
            <Button variant="ghost" size="sm" className="text-xs text-brand-400 hover:text-brand-300">
              View All Buyer Accounts →
            </Button>
          </Link>
        </div>

        {authorizedLoans.length === 0 ? (
          <div className="py-8 text-center text-dark-text-muted text-xs font-mono">
            No credit facilities currently list this vendor address.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer Entity</TableHead>
                <TableHead>Facility Pool</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved Spend Ceiling</TableHead>
                <TableHead>Facility Target</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authorizedLoans.map((loan) => (
                <TableRow key={loan.address}>
                  <TableCell>
                    <div className="font-semibold text-xs text-dark-text-primary">
                      {loan.borrower.displayName}
                    </div>
                  </TableCell>

                  <TableCell>
                    <AddressBadge address={loan.address} digits={4} />
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={loan.status} />
                  </TableCell>

                  <TableCell className="font-mono text-xs font-bold text-dark-text-primary">
                    {formatEther(loan.maxSpendWei)}
                  </TableCell>

                  <TableCell className="font-mono text-xs text-dark-text-secondary">
                    {formatEther(loan.targetWei)}
                  </TableCell>

                  <TableCell className="text-xs text-dark-text-secondary font-mono">
                    {formatDate(loan.maturity)}
                  </TableCell>

                  <TableCell className="text-right">
                    <Link to={`/app/loans/${loan.address}`}>
                      <Button variant="outline" size="xs" icon={<ArrowRight className="w-3 h-3" />}>
                        View Facility
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Transaction Inspection Modal */}
      <TransactionInspectModal
        open={Boolean(selectedDisbursement)}
        onClose={() => setSelectedDisbursement(null)}
        disbursement={selectedDisbursement}
      />
    </div>
  );
};
export default SupplierOverviewPage;
