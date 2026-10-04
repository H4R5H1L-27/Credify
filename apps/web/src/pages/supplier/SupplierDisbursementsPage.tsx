import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useSupplierDisbursements } from '../../hooks/useCredify';
import {
  Button,
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
import { formatDate, timeAgo } from '../../lib/utils';
import { ArrowLeft, Search, Tag, Filter, ArrowUpRight, Coins } from 'lucide-react';

export const SupplierDisbursementsPage: React.FC = () => {
  const { address } = useIdentity();
  const { data: disbursementData, isLoading } = useSupplierDisbursements(address);
  const [selectedDisbursement, setSelectedDisbursement] = useState<DisbursementDetail | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const disbursements = disbursementData?.disbursements || [];
  const totalEth = disbursementData?.totalDisbursedEth || '0.00';

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
        <Skeleton className="h-8 w-48 bg-slate-200" />
        <Skeleton className="h-28 w-full rounded-2xl bg-slate-200" />
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
          Corporate Remittance Ledger
        </h1>
        <p className="text-xs text-slate-600 font-medium">
          Cryptographically verified procurement remittances transferred directly from buyer facility escrows to your destination merchant account.
        </p>
        <div className="flex items-center gap-3 pt-1">
          <Link
            to="/console/events?eventName=SpendExecuted"
            className="text-xs text-yellow-900 hover:text-black font-bold inline-flex items-center gap-1 underline"
            title="Inspect on-chain SpendExecuted events in Technical Console"
          >
            <span>Inspect On-Chain Disbursements in Console</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Summary Accounting Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Contract Remittances Settled
          </span>
          <div className="text-3xl font-bold font-mono text-emerald-800 mt-1 flex items-baseline gap-1.5">
            <span>{parseFloat(totalEth).toFixed(2)}</span>
            <span className="text-xl font-bold text-emerald-950">ETH</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Cumulative gross settlements across {disbursements.length} verified on-chain {disbursements.length === 1 ? 'drawdown' : 'drawdowns'}
          </p>
        </div>

        <div className="text-xs text-slate-700 space-y-1.5 sm:text-right font-medium">
          <div className="font-bold text-slate-950">Destination Remittance Wallet:</div>
          <AddressBadge address={address || ''} digits={8} />
          <div className="text-[11px] text-slate-500 font-normal">Direct escrow settlement without custodial holding</div>
        </div>
      </div>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors font-mono flex items-center gap-1.5 ${
              selectedCategory === 'ALL'
                ? 'bg-[#ffe600] text-black border border-yellow-400 font-bold shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 border border-slate-200 font-medium'
            }`}
          >
            <span>All Categories</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              selectedCategory === 'ALL' ? 'bg-black text-[#ffe600]' : 'bg-slate-100 text-slate-700'
            }`}>
              {disbursements.length}
            </span>
          </button>
          {categories.map((cat) => {
            const count = disbursements.filter((d) => d.categoryText === cat).length;
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors font-mono flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-[#ffe600] text-black border border-yellow-400 font-bold shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 border border-slate-200 font-medium'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isSel ? 'bg-black text-[#ffe600]' : 'bg-slate-100 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Remittance Ledger Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {filteredDisbursements.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 m-6 space-y-3">
            <Coins className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-950">No Remittances Found</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
              No on-chain disbursements match the selected filter query.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer Entity & Facility</TableHead>
                <TableHead>Procurement Category</TableHead>
                <TableHead>Remittance Amount</TableHead>
                <TableHead>Block Confirmation</TableHead>
                <TableHead>Settlement Timestamp</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDisbursements.map((d) => (
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
                      <AddressBadge address={d.transactionHash} digits={5} />
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
