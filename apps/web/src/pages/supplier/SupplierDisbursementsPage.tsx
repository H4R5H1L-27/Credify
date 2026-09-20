import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useSupplierDisbursements } from '../../hooks/useCredify';
import {
  Button,
  Badge,
  AddressBadge,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/ui';
import { TransactionInspectModal, DisbursementDetail } from '../../components/supplier/TransactionInspectModal';
import { formatEther, formatEtherNum, formatDate, timeAgo } from '../../lib/utils';
import { Download, ArrowLeft, Search, ShieldCheck, Tag, FileText, Filter, ArrowUpRight } from 'lucide-react';

export const SupplierDisbursementsPage: React.FC = () => {
  const { address } = useIdentity();
  const { data: disbursementData, isLoading } = useSupplierDisbursements(address);
  const [selectedDisbursement, setSelectedDisbursement] = useState<DisbursementDetail | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const disbursements = disbursementData?.disbursements || [];
  const totalEth = disbursementData?.totalDisbursedEth || '0.00';
  const totalWei = disbursementData?.totalDisbursedWei || '0';

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    disbursements.forEach((d) => {
      if (d.categoryText) set.add(d.categoryText);
    });
    return Array.from(set);
  }, [disbursements]);

  // Filtered disbursements
  const filteredDisbursements = useMemo(() => {
    if (selectedCategory === 'ALL') return disbursements;
    return disbursements.filter((d) => d.categoryText === selectedCategory);
  }, [disbursements, selectedCategory]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48 bg-dark-bg-2" />
        <Skeleton className="h-28 w-full rounded-2xl bg-dark-bg-2" />
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
          Corporate Remittance Ledger
        </h1>
        <p className="text-xs text-dark-text-secondary">
          Cryptographically verified procurement remittances transferred directly from buyer facility escrows to your destination merchant account.
        </p>
        <div className="flex items-center gap-3 pt-1">
          <Link
            to="/console/events?eventName=SpendExecuted"
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1 hover:underline"
            title="Inspect on-chain SpendExecuted events in Technical Console"
          >
            <span>Inspect On-Chain Disbursements in Console</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Summary Accounting Banner */}
      <div className="p-6 rounded-2xl border border-dark-border-default bg-dark-bg-2 shadow-dark-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-dark-text-muted">
            Total Contract Remittances Settled
          </span>
          <div className="text-3xl font-bold font-mono text-emerald-400 mt-1">
            {parseFloat(totalEth).toFixed(2)} ETH
          </div>
          <p className="text-xs text-dark-text-secondary mt-0.5">
            Cumulative gross settlements across {disbursements.length} verified on-chain {disbursements.length === 1 ? 'drawdown' : 'drawdowns'}
          </p>
        </div>

        <div className="text-xs text-dark-text-secondary space-y-1.5 sm:text-right">
          <div className="font-medium text-dark-text-primary">Destination Remittance Wallet:</div>
          <AddressBadge address={address || ''} digits={8} />
          <div className="text-[11px] text-dark-text-muted">Direct escrow settlement without custodial holding</div>
        </div>
      </div>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-dark-text-muted font-medium text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Category:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors font-mono flex items-center gap-1.5 ${
              selectedCategory === 'ALL'
                ? 'bg-dark-bg-3 text-dark-text-primary border border-dark-border-subtle font-semibold'
                : 'text-dark-text-secondary hover:bg-dark-bg-2 hover:text-dark-text-primary'
            }`}
          >
            <span>All Categories</span>
            <span className="text-[10px] bg-dark-bg-1 px-1.5 py-0.2 rounded-full text-dark-text-muted">
              {disbursements.length}
            </span>
          </button>
          {categories.map((cat) => {
            const count = disbursements.filter((d) => d.categoryText === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors font-mono flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-dark-bg-3 text-dark-text-primary border border-dark-border-subtle font-semibold'
                    : 'text-dark-text-secondary hover:bg-dark-bg-2 hover:text-dark-text-primary'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] bg-dark-bg-1 px-1.5 py-0.2 rounded-full text-dark-text-muted">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Disbursements Ledger Table */}
      <div className="rounded-2xl border border-dark-border-default bg-dark-bg-2 overflow-hidden shadow-dark-md">
        {filteredDisbursements.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-dark-border-subtle rounded-xl bg-dark-bg-1 m-6 space-y-3">
            <Download className="w-10 h-10 text-dark-text-muted mx-auto" />
            <h4 className="text-sm font-semibold text-dark-text-primary">No Disbursements Found</h4>
            <p className="text-xs text-dark-text-secondary max-w-sm mx-auto">
              {selectedCategory !== 'ALL'
                ? `No remittances found under procurement category "${selectedCategory}".`
                : 'No contract disbursements have been executed to your merchant address yet. When buyers execute procurement drawdowns under active agreements, settlements will register here automatically.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commercial Buyer & Facility</TableHead>
                <TableHead>Remittance Amount</TableHead>
                <TableHead>Procurement Category</TableHead>
                <TableHead>Block Confirmation</TableHead>
                <TableHead>Transaction Hash</TableHead>
                <TableHead>Settlement Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDisbursements.map((d) => (
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

                  <TableCell className="font-mono">
                    <div className="font-bold text-emerald-400 text-sm">
                      {parseFloat(d.amountEth).toFixed(4)} ETH
                    </div>
                    <div className="text-[10px] text-dark-text-muted">
                      {d.amountWei} Wei
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] font-mono font-medium">
                      <Tag className="w-2.5 h-2.5 text-brand-400" />
                      {d.categoryText || 'Procurement'}
                    </span>
                  </TableCell>

                  <TableCell className="font-mono text-xs text-dark-text-secondary">
                    Block #{d.blockNumber}
                  </TableCell>

                  <TableCell>
                    <AddressBadge address={d.transactionHash} digits={5} />
                  </TableCell>

                  <TableCell className="text-xs text-dark-text-secondary">
                    <div>{timeAgo(d.timestamp)}</div>
                    <div className="text-[10px] text-dark-text-muted font-mono">
                      {formatDate(String(d.timestamp))}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
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
                      <Link to={`/app/loans/${d.loanId}`}>
                        <Button variant="ghost" size="xs" icon={<ArrowUpRight className="w-3 h-3" />}>
                          Facility
                        </Button>
                      </Link>
                    </div>
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
export default SupplierDisbursementsPage;

