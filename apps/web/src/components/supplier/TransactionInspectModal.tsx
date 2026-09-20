import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AddressBadge } from '../ui/AddressBadge';
import { formatEther, formatDate, timeAgo, decodeBytes32String } from '../../lib/utils';
import {
  ShieldCheck,
  ExternalLink,
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
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="font-semibold text-emerald-300 flex items-center gap-2">
              <span>Verified On-Chain Remittance</span>
              <Badge variant="success" className="font-mono text-[10px]">
                CONFIRMED
              </Badge>
            </div>
            <p className="text-[11px] text-emerald-400/90 leading-relaxed font-sans">
              Executed via smart contract method{' '}
              <code className="px-1 py-0.5 rounded bg-emerald-500/20 font-mono text-[10px] text-emerald-200">
                LoanPool.spend(address merchant, uint256 amount, bytes32 category)
              </code>
              . Funds settled directly to destination merchant wallet without intermediary custody.
            </p>
          </div>
        </div>

        {/* Amount & Category Card */}
        <div className="p-4 rounded-xl border border-dark-border-subtle bg-dark-bg-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-medium text-dark-text-muted uppercase tracking-wider">
              Settlement Amount
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
              {ethDisplay}
            </div>
            <div className="text-[11px] font-mono text-dark-text-muted mt-0.5">
              {disbursement.amountWei} Wei
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-[11px] font-medium text-dark-text-muted uppercase tracking-wider block">
              Procurement Category
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-300 font-semibold text-xs font-mono">
              {categoryName}
            </span>
          </div>
        </div>

        {/* Evidence Attributes Ledger */}
        <div className="rounded-xl border border-dark-border-default divide-y divide-dark-border-subtle overflow-hidden bg-dark-bg-1">
          {/* Transaction Hash */}
          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-dark-bg-2 transition-colors">
            <span className="font-medium text-dark-text-muted flex items-center gap-1.5 shrink-0">
              <Hash className="w-3.5 h-3.5 text-dark-text-muted" />
              Transaction Hash
            </span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[11px] text-dark-text-primary break-all select-all">
                {disbursement.transactionHash}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0 text-dark-text-muted hover:text-dark-text-primary"
                onClick={handleCopyTx}
                title="Copy Transaction Hash"
              >
                {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* Block Number */}
          <div className="p-3 flex items-center justify-between gap-2 hover:bg-dark-bg-2 transition-colors">
            <span className="font-medium text-dark-text-muted flex items-center gap-1.5 shrink-0">
              <Boxes className="w-3.5 h-3.5 text-dark-text-muted" />
              Block Number
            </span>
            <span className="font-mono font-semibold text-dark-text-primary text-xs">
              #{disbursement.blockNumber}
            </span>
          </div>

          {/* Timestamp */}
          <div className="p-3 flex items-center justify-between gap-2 hover:bg-dark-bg-2 transition-colors">
            <span className="font-medium text-dark-text-muted flex items-center gap-1.5 shrink-0">
              <Clock className="w-3.5 h-3.5 text-dark-text-muted" />
              Execution Time
            </span>
            <div className="text-right">
              <span className="text-dark-text-primary font-medium">
                {formatDate(String(disbursement.timestamp))}
              </span>
              <span className="text-dark-text-muted ml-1.5 font-mono text-[11px]">
                ({timeAgo(String(disbursement.timestamp))})
              </span>
            </div>
          </div>

          {/* Originating Loan Pool */}
          <div className="p-3 flex items-center justify-between gap-2 hover:bg-dark-bg-2 transition-colors">
            <span className="font-medium text-dark-text-muted flex items-center gap-1.5 shrink-0">
              <FileText className="w-3.5 h-3.5 text-dark-text-muted" />
              Source Credit Facility
            </span>
            <div className="flex items-center gap-2">
              <AddressBadge address={disbursement.loanId} digits={6} />
              <Link to={`/app/loans/${disbursement.loanId}`} onClick={onClose}>
                <span className="inline-flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 font-medium">
                  View Facility <ArrowUpRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </div>

          {/* Borrower Originator */}
          {(disbursement.borrowerName || disbursement.borrowerAddress) && (
            <div className="p-3 flex items-center justify-between gap-2 hover:bg-dark-bg-2 transition-colors">
              <span className="font-medium text-dark-text-muted flex items-center gap-1.5 shrink-0">
                <Building className="w-3.5 h-3.5 text-dark-text-muted" />
                Commercial Buyer
              </span>
              <div className="flex items-center gap-2">
                {disbursement.borrowerName && (
                  <span className="font-semibold text-dark-text-primary">
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
            <div className="p-3 flex items-center justify-between gap-2 hover:bg-dark-bg-2 transition-colors">
              <span className="font-medium text-dark-text-muted flex items-center gap-1.5 shrink-0">
                <Send className="w-3.5 h-3.5 text-dark-text-muted" />
                Destination Merchant Wallet
              </span>
              <AddressBadge address={disbursement.supplierAddress} digits={6} />
            </div>
          )}
        </div>

        {/* Indexer Summary */}
        {disbursement.summary && (
          <div className="p-3 rounded-xl bg-dark-bg-0 border border-dark-border-subtle text-dark-text-secondary font-mono text-[11px] leading-relaxed">
            <span className="font-semibold text-dark-text-primary font-sans block mb-0.5">
              Protocol Settlement Audit Log:
            </span>
            {disbursement.summary}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to={`/app/loans/${disbursement.loanId}`} onClick={onClose}>
            <Button variant="outline" size="sm" icon={<ArrowUpRight className="w-3.5 h-3.5" />}>
              Open Facility Record
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
