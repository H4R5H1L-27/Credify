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
import { FileText, ArrowLeft, ArrowRight, ShieldCheck, Building, CreditCard } from 'lucide-react';

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
        <Skeleton className="h-8 w-48 bg-dark-bg-2" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 bg-dark-bg-2 rounded-xl" />
          <Skeleton className="h-24 bg-dark-bg-2 rounded-xl" />
          <Skeleton className="h-24 bg-dark-bg-2 rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl bg-dark-bg-2" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <Link
          to="/app/supplier/overview"
          className="inline-flex items-center gap-1.5 text-xs text-dark-text-secondary hover:text-dark-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Corporate Overview</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-dark-text-primary">
          Authorized Buyer Credit Facilities
        </h1>
        <p className="text-xs text-dark-text-secondary">
          Commercial buyer credit accounts where your business is whitelisted as an authorized procurement destination.
        </p>
      </div>

      {/* Accounting Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-dark-border-default bg-dark-bg-2 p-4">
          <span className="text-[11px] uppercase tracking-wider text-dark-text-muted font-medium">
            Authorized Buyer Accounts
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-dark-text-primary">
              {authorizedLoans.length}
            </span>
            <span className="text-xs text-dark-text-secondary">commercial accounts</span>
          </div>
          <p className="text-xs text-dark-text-secondary mt-1">
            Buyer pools with active vendor whitelists
          </p>
        </div>

        <div className="rounded-xl border border-dark-border-default bg-dark-bg-2 p-4">
          <span className="text-[11px] uppercase tracking-wider text-dark-text-muted font-medium">
            Cumulative Spend Ceiling
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {totalCeilingEth} ETH
            </span>
            <span className="text-xs text-dark-text-secondary">maximum allocation</span>
          </div>
          <p className="text-xs text-dark-text-secondary mt-1">
            Combined policy spending caps
          </p>
        </div>

        <div className="rounded-xl border border-dark-border-default bg-dark-bg-2 p-4">
          <span className="text-[11px] uppercase tracking-wider text-dark-text-muted font-medium">
            Active Disbursing Facilities
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-brand-400">
              {activeCount}
            </span>
            <span className="text-xs text-dark-text-secondary">live facilities</span>
          </div>
          <p className="text-xs text-dark-text-secondary mt-1">
            Ready for instant procurement drawdowns
          </p>
        </div>
      </div>

      {/* Authorized Facilities Table */}
      <div className="rounded-2xl border border-dark-border-default bg-dark-bg-2 overflow-hidden shadow-dark-md">
        {authorizedLoans.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-dark-border-subtle rounded-xl bg-dark-bg-1 m-6 space-y-3">
            <FileText className="w-10 h-10 text-dark-text-muted mx-auto" />
            <h4 className="text-sm font-semibold text-dark-text-primary">No Authorized Facilities Found</h4>
            <p className="text-xs text-dark-text-secondary max-w-sm mx-auto">
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
                <TableHead>Facility Maturity</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authorizedLoans.map((loan) => (
                <TableRow key={loan.address}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-dark-text-primary">
                          {loan.borrower.displayName}
                        </span>
                        {loan.borrower.verified && (
                          <span className="flex items-center gap-0.5 text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            KYC
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-dark-text-muted font-mono">
                        Borrower Account
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <AddressBadge address={loan.address} digits={4} />
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={loan.status} />
                  </TableCell>

                  <TableCell className="font-mono text-xs font-bold text-emerald-400">
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
    </div>
  );
};
export default SupplierAgreementsPage;
