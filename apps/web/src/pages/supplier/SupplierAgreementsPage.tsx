import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useLoans } from '../../hooks/useCredify';
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
} from '../../components/ui';
import { formatEther, formatEtherNum, formatDate } from '../../lib/utils';
import { FileText, ArrowLeft, ArrowRight } from 'lucide-react';

export const SupplierAgreementsPage: React.FC = () => {
  const { address } = useIdentity();
  const { data: loans, isLoading } = useLoans();

  const authorizedLoans = useMemo(() => {
    if (!loans || !address) return [];
    const lower = address.toLowerCase();
    return loans.filter((l) =>
      l.merchants.some((m) => m.toLowerCase() === lower)
    );
  }, [loans, address]);

  // Aggregate metrics
  const { totalCeilingEth, activeCount } = useMemo(() => {
    let ceiling = 0;
    let active = 0;
    authorizedLoans.forEach((l) => {
      ceiling += formatEtherNum(l.maxSpendWei);
      if (l.status === 'ACTIVE') active++;
    });
    return { totalCeilingEth: ceiling.toFixed(2), activeCount: active };
  }, [authorizedLoans]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48 bg-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 bg-slate-200 rounded-xl" />
          <Skeleton className="h-24 bg-slate-200 rounded-xl" />
          <Skeleton className="h-24 bg-slate-200 rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="space-y-2">
        <Link
          to="/app/supplier/overview"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Corporate Overview</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Authorized Buyer Credit Facilities
        </h1>
        <p className="text-xs text-slate-600 font-medium">
          Commercial buyer credit accounts where your business is whitelisted as an authorized procurement destination.
        </p>
      </div>

      {/* Accounting Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
            Authorized Buyer Accounts
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-950">
              {authorizedLoans.length}
            </span>
            <span className="text-xs text-slate-600 font-medium">commercial accounts</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Buyer pools with active vendor whitelists
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
            Cumulative Spend Ceiling
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-800">
              {totalCeilingEth}
            </span>
            <span className="text-base font-bold text-emerald-900 font-mono">ETH</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Combined policy spending caps
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
            Active Disbursing Facilities
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-950">
              {activeCount}
            </span>
            <span className="text-xs text-slate-600 font-medium">live facilities</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Ready for instant procurement drawdowns
          </p>
        </div>
      </div>

      {/* Authorized Facilities Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {authorizedLoans.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 m-6 space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-950">No Authorized Facilities Found</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
              No active credit agreements currently whitelist your merchant address. Commercial buyers include approved vendor addresses when structuring new credit facilities.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer Corporate Entity</TableHead>
                <TableHead>Facility Pool</TableHead>
                <TableHead>Facility Status</TableHead>
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
                    <AddressBadge address={loan.address} digits={5} />
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={loan.status} />
                  </TableCell>

                  <TableCell className="font-mono text-xs font-bold text-slate-950">
                    {formatEther(loan.maxSpendWei)} ETH
                  </TableCell>

                  <TableCell className="font-mono text-xs text-slate-800 font-bold">
                    {formatEther(loan.targetWei)} ETH
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
    </div>
  );
};
export default SupplierAgreementsPage;
