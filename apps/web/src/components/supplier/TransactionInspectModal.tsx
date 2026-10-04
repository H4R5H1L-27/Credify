import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AddressBadge } from '../ui/AddressBadge';
import { formatEther, formatDate, timeAgo, decodeBytes32String } from '../../lib/utils';
import {
  ShieldCheck,
  Copy,
  Check,
  FileText,
  Boxes,
  Clock,
  ArrowUpRight,
  Hash,
  Send,
  Building,
} from 'lucide-react';

export interface DisbursementDetail {
  id: string;
  loanId: string;
  borrowerAddress?: string;
  borrowerName?: string;
  amountWei: string;
  amountEth?: string;
  category?: string;
  categoryText?: string;
  blockNumber: string | number;
  transactionHash: string;
  timestamp: string | number;
  summary?: string;
  supplierAddress?: string;
}

interface TransactionInspectModalProps {
  open: boolean;
  onClose: () => void;
  disbursement: DisbursementDetail | null;
}

export const TransactionInspectModal: React.FC<TransactionInspectModalProps> = ({
  open,
  onClose,
  disbursement,
}) => {
  const [copiedTx, setCopiedTx] = useState(false);

  if (!disbursement) return null;

  const handleCopyTx = () => {
    navigator.clipboard.writeText(disbursement.transactionHash);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  const categoryName =
    disbursement.categoryText ||
    decodeBytes32String(disbursement.category) ||
    'Authorized Equipment / Services';

  const ethDisplay = disbursement.amountEth
    ? `${parseFloat(disbursement.amountEth).toFixed(4)} ETH`
    : formatEther(disbursement.amountWei);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cryptographic Remittance Proof"
      description="Cryptographic evidence of procurement settlement executed directly from loan pool escrow."
      maxWidth="2xl"
    >
      <div className="space-y-5 text-xs">
        {/* On-Chain Verification Banner */}
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-emerald-950 flex items-center gap-2">
              <span>Verified On-Chain Remittance</span>
              <Badge variant="success" className="font-mono text-[10px] font-bold">
                CONFIRMED
              </Badge>
            </div>
            <p className="text-[11px] text-emerald-900 leading-relaxed font-sans font-medium">
              Executed via smart contract method{' '}
              <code className="px-1.5 py-0.5 rounded bg-emerald-100 font-mono text-[10px] text-emerald-950 font-bold">
                LoanPool.spend(address merchant, uint256 amount, bytes32 category)
              </code>
              . Funds settled directly to destination merchant wallet without intermediary custody.
            </p>
          </div>
        </div>

        {/* Amount & Category Card */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Settlement Amount
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-800 mt-0.5">
              {ethDisplay}
            </div>
            <div className="text-[11px] font-mono text-slate-500 font-medium mt-0.5">
              {disbursement.amountWei} Wei
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Procurement Category
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-950 font-bold text-xs font-mono">
              {categoryName}
            </span>
          </div>
        </div>

        {/* Evidence Attributes Ledger */}
        <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden bg-white shadow-xs">
          {/* Transaction Hash */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-yellow-50/20 transition-colors">
            <span className="font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              Transaction Hash
            </span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[11px] text-slate-950 font-bold break-all select-all">
                {disbursement.transactionHash}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0 text-slate-500 hover:text-slate-950"
                onClick={handleCopyTx}
                title="Copy Transaction Hash"
              >
                {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* Block Number */}
          <div className="p-3.5 flex items-center justify-between gap-2 hover:bg-yellow-50/20 transition-colors">
            <span className="font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
              <Boxes className="w-3.5 h-3.5 text-slate-500" />
              Block Number
            </span>
            <span className="font-mono font-bold text-slate-950 text-xs">
              #{disbursement.blockNumber}
            </span>
          </div>

          {/* Timestamp */}
          <div className="p-3.5 flex items-center justify-between gap-2 hover:bg-yellow-50/20 transition-colors">
            <span className="font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Execution Time
            </span>
            <div className="text-right">
              <span className="text-slate-950 font-bold">
                {formatDate(String(disbursement.timestamp))}
              </span>
              <span className="text-slate-500 ml-1.5 font-mono text-[11px] font-medium">
                ({timeAgo(String(disbursement.timestamp))})
              </span>
            </div>
          </div>

          {/* Originating Loan Pool */}
          <div className="p-3.5 flex items-center justify-between gap-2 hover:bg-yellow-50/20 transition-colors">
            <span className="font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Source Credit Facility
            </span>
            <div className="flex items-center gap-2">
              <AddressBadge address={disbursement.loanId} digits={6} />
              <Link to={`/app/loans/${disbursement.loanId}`} onClick={onClose}>
                <span className="inline-flex items-center gap-1 text-[11px] text-yellow-950 hover:text-black font-bold underline">
                  View Facility <ArrowUpRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </div>

          {/* Borrower Originator */}
          {(disbursement.borrowerName || disbursement.borrowerAddress) && (
            <div className="p-3.5 flex items-center justify-between gap-2 hover:bg-yellow-50/20 transition-colors">
              <span className="font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                Commercial Buyer
              </span>
              <div className="flex items-center gap-2">
                {disbursement.borrowerName && (
                  <span className="font-bold text-slate-950">
                    {disbursement.borrowerName}
                  </span>
                )}
                {disbursement.borrowerAddress && (
                  <AddressBadge address={disbursement.borrowerAddress} digits={5} />
                )}
              </div>
            </div>
          )}

          {/* Recipient Merchant Wallet */}
          {disbursement.supplierAddress && (
            <div className="p-3.5 flex items-center justify-between gap-2 hover:bg-yellow-50/20 transition-colors">
              <span className="font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
                <Send className="w-3.5 h-3.5 text-slate-500" />
                Destination Merchant Wallet
              </span>
              <AddressBadge address={disbursement.supplierAddress} digits={6} />
            </div>
          )}
        </div>

        {/* Indexer Summary */}
        {disbursement.summary && (
          <div className="p-3.5 rounded-xl bg-yellow-50/80 border border-yellow-300 text-yellow-950 font-mono text-[11px] leading-relaxed">
            <span className="font-bold text-slate-950 font-sans block mb-1">
              Protocol Settlement Audit Log:
            </span>
            {disbursement.summary}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to={`/app/loans/${disbursement.loanId}`} onClick={onClose}>
            <Button variant="secondary" size="sm" icon={<ArrowUpRight className="w-3.5 h-3.5" />} className="font-bold">
              Open Facility Record
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={onClose} className="font-bold">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
