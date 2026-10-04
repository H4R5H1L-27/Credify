import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useLoans, useSupplierDisbursements } from '../../hooks/useCredify';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Button,
  StatusBadge,
  AddressBadge,
  Skeleton,
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
  Download,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Search,
  Tag,
  Building,
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
        <Skeleton className="h-8 w-64 bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 bg-slate-200 rounded-xl" />
          <Skeleton className="h-24 bg-slate-200 rounded-xl" />
          <Skeleton className="h-24 bg-slate-200 rounded-xl" />
          <Skeleton className="h-24 bg-slate-200 rounded-xl" />
        </div>
        <Skeleton className="h-96 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  const businessName =
    supplierProfile?.businessName || identity?.displayName || 'Authorized Commercial Vendor';
  const categoryName = supplierProfile?.category || 'Laboratory Equipment & Hardware';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Corporate Vendor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {businessName}
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-950 font-bold">
              <Tag className="w-3 h-3 text-yellow-700" />
              {categoryName}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 font-medium">
            <span>Settlement Destination:</span>
            <AddressBadge address={address || ''} digits={6} />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isVerified ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              KYCRegistry Verified
            </span>
          ) : (
            <Link
              to="/app/verify"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold hover:bg-amber-200 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
              Verification Pending
            </Link>
          )}

          <Link to="/app/supplier/profile">
            <Button size="sm" variant="secondary" icon={<Building className="w-3.5 h-3.5" />} className="font-bold">
              Corporate Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Commercial Payments Accounting Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
            Gross Settled Revenue
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-800">
              <NumberTicker value={parseFloat(totalEth) || 0} decimalPlaces={2} />
            </span>
            <span className="text-base font-bold text-emerald-900 font-mono">ETH</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Settled directly from pool escrows
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
            Authorized Buyer Facilities
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-950">
              <NumberTicker value={authorizedLoans.length} />
            </span>
            <span className="text-xs text-slate-600 font-medium">active accounts</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Credit facilities whitelisting vendor
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
            Remittance Transactions
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-950">
              <NumberTicker value={disbursements.length} />
            </span>
            <span className="text-xs text-slate-600 font-medium">settlements</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Cryptographically verified proofs
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
            Average Settlement
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-950">
              <NumberTicker value={parseFloat(avgSettlementEth) || 0} decimalPlaces={2} />
            </span>
            <span className="text-base font-bold text-slate-900 font-mono">ETH</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Per verified procurement drawdown
          </p>
        </div>
      </div>

      {/* Recent Disbursements Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-950 tracking-tight">
              Incoming Business Disbursements
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Direct on-chain settlements executed under authorized buyer credit facilities.
            </p>
          </div>
          <Link to="/app/supplier/disbursements">
            <Button variant="secondary" size="sm" className="text-xs font-bold">
              View Full Remittance Ledger →
            </Button>
          </Link>
        </div>

        {disbursements.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 space-y-3">
            <Download className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-950">No Disbursements Received Yet</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
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
                      <div className="font-bold text-xs text-slate-950">
                        {d.borrowerName || 'Commercial Buyer'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 font-medium">
                        <span>Facility:</span>
                        <AddressBadge address={d.loanId} digits={4} />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-yellow-100 border border-yellow-300 text-yellow-950 text-[10px] font-mono font-bold">
                      <Tag className="w-2.5 h-2.5 text-yellow-700" />
                      {d.categoryText || 'Procurement'}
                    </span>
                  </TableCell>

                  <TableCell className="font-mono">
                    <div className="font-bold text-emerald-800 text-xs">
                      {parseFloat(d.amountEth).toFixed(4)} ETH
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {d.amountWei} Wei
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs">
                    <div className="text-slate-950 font-bold">Block #{d.blockNumber}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                      <span>Tx:</span>
                      <AddressBadge address={d.transactionHash} digits={4} />
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-slate-800 font-medium">
                    <div className="font-bold">{timeAgo(d.timestamp)}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {formatDate(String(d.timestamp))}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={<Search className="w-3 h-3" />}
                      className="font-bold"
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-950 tracking-tight">
              Authorized Buyer Credit Facilities
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Commercial buyers whose smart contract policies explicitly whitelist your business for direct disbursement.
            </p>
          </div>
          <Link to="/app/supplier/agreements">
            <Button variant="secondary" size="sm" className="text-xs font-bold">
              View All Buyer Accounts →
            </Button>
          </Link>
        </div>

        {authorizedLoans.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-mono font-medium">
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
                    <div className="font-bold text-xs text-slate-950">
                      {loan.borrower.displayName}
                    </div>
                  </TableCell>

                  <TableCell>
                    <AddressBadge address={loan.address} digits={4} />
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={loan.status} />
                  </TableCell>

                  <TableCell className="font-mono text-xs font-bold text-slate-950">
                    {formatEther(loan.maxSpendWei)}
                  </TableCell>

                  <TableCell className="font-mono text-xs text-slate-800 font-bold">
                    {formatEther(loan.targetWei)}
                  </TableCell>

                  <TableCell className="text-xs text-slate-800 font-mono font-medium">
                    {formatDate(loan.maturity)}
                  </TableCell>

                  <TableCell className="text-right">
                    <Link to={`/app/loans/${loan.address}`}>
                      <Button variant="secondary" size="xs" icon={<ArrowRight className="w-3 h-3" />} className="font-bold">
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
