import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ActivityEvent } from '@credify/shared';
import { AddressBadge } from '../ui/AddressBadge';
import { timeAgo, formatDate, formatEtherNum } from '../../lib/utils';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Coins,
  ArrowUpRight,
  FileText,
  Send,
  Download,
  Vote,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Code2,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

/* ─── Event Configuration & Styling ─── */
type EventConfig = {
  label: string;
  category: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  icon: React.ReactNode;
};

function getEventConfig(eventName: string, data: Record<string, string> = {}): EventConfig {
  switch (eventName) {
    case 'LoanCreated':
    case 'LoanPoolCreated':
      return {
        label: 'Agreement Created',
        category: 'Initialization',
        colorClass: 'text-indigo-900',
        bgClass: 'bg-indigo-50',
        borderClass: 'border-indigo-300',
        icon: <FileText className="w-4 h-4 text-indigo-700" />,
      };
    case 'Funded':
      return {
        label: 'Syndicate Contribution',
        category: 'Funding',
        colorClass: 'text-yellow-950',
        bgClass: 'bg-yellow-100',
        borderClass: 'border-yellow-400',
        icon: <Coins className="w-4 h-4 text-yellow-800" />,
      };
    case 'LoanActivated':
      return {
        label: 'Funding Target Reached',
        category: 'Lifecycle Transition',
        colorClass: 'text-emerald-950',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-300',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" />,
      };
    case 'SpendExecuted':
      return {
        label: 'Controlled Supplier Disbursement',
        category: 'Procurement',
        colorClass: 'text-purple-950',
        bgClass: 'bg-purple-50',
        borderClass: 'border-purple-300',
        icon: <Send className="w-4 h-4 text-purple-700" />,
      };
    case 'RepaymentReceived':
      return {
        label: 'Borrower Repayment',
        category: 'Debt Service',
        colorClass: 'text-emerald-950',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-300',
        icon: <ArrowUpRight className="w-4 h-4 text-emerald-700" />,
      };
    case 'LoanRepaid':
      return {
        label: 'Agreement Fully Repaid',
        category: 'Terminal Settlement',
        colorClass: 'text-emerald-950',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-300',
        icon: <Sparkles className="w-4 h-4 text-emerald-700" />,
      };
    case 'RepaymentClaimed':
      return {
        label: 'Lender Pro-Rata Claim',
        category: 'Yield Distribution',
        colorClass: 'text-indigo-950',
        bgClass: 'bg-indigo-50',
        borderClass: 'border-indigo-300',
        icon: <Download className="w-4 h-4 text-indigo-700" />,
      };
    case 'DefaultVoteCast':
      return {
        label: 'Governance Default Vote',
        category: 'Consensus Governance',
        colorClass: 'text-amber-950',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-300',
        icon: <Vote className="w-4 h-4 text-amber-700" />,
      };
    case 'LoanDefaulted':
      return {
        label: 'Consensus Default Finalized',
        category: 'Terminal Governance',
        colorClass: 'text-rose-950',
        bgClass: 'bg-rose-50',
        borderClass: 'border-rose-300',
        icon: <AlertTriangle className="w-4 h-4 text-rose-700" />,
      };
    case 'ReputationUpdated': {
      const isSuccess = data.successful === 'true' || data.successful === '1';
      return {
        label: isSuccess ? 'Reputation Reward (+8 pts)' : 'Reputation Penalty (−20 pts)',
        category: 'Credit Provenance',
        colorClass: isSuccess ? 'text-emerald-950' : 'text-rose-950',
        bgClass: isSuccess ? 'bg-emerald-50' : 'bg-rose-50',
        borderClass: isSuccess ? 'border-emerald-300' : 'border-rose-300',
        icon: isSuccess ? <ShieldCheck className="w-4 h-4 text-emerald-700" /> : <AlertTriangle className="w-4 h-4 text-rose-700" />,
      };
    }
    case 'VerificationUpdated':
      return {
        label: 'Identity Attestation',
        category: 'KYC Registry',
        colorClass: 'text-teal-950',
        bgClass: 'bg-teal-50',
        borderClass: 'border-teal-300',
        icon: <ShieldCheck className="w-4 h-4 text-teal-700" />,
      };
    default:
      return {
        label: eventName,
        category: 'Contract Event',
        colorClass: 'text-slate-900',
        bgClass: 'bg-slate-100',
        borderClass: 'border-slate-300',
        icon: <Layers className="w-4 h-4 text-slate-600" />,
      };
  }
}

/* ─── Parameter Formatter ─── */
function formatParameterValue(key: string, value: string): React.ReactNode {
  if (!value) return <span className="text-slate-400">null</span>;

  // Address
  if (value.startsWith('0x') && value.length === 42) {
    return <AddressBadge address={value} chars={5} />;
  }
  // Tx Hash
  if (value.startsWith('0x') && value.length === 66) {
    return <AddressBadge address={value} chars={6} />;
  }
  // Wei values
  if (key.toLowerCase().includes('wei') || key.toLowerCase().includes('amount') || key === 'totalrepaid' || key === 'totalcontributed' || key === 'weight') {
    try {
      const eth = formatEtherNum(value);
      return <span className="font-mono font-bold text-slate-950">{eth.toFixed(4)} ETH <span className="text-[10px] font-normal text-slate-500">({value} wei)</span></span>;
    } catch {
      return <span className="font-mono font-semibold text-slate-800">{value}</span>;
    }
  }
  // APR BPS
  if (key.toLowerCase().includes('aprbps') || key.toLowerCase().includes('bps')) {
    const bps = Number(value);
    if (!Number.isNaN(bps)) {
      return <span className="font-mono font-bold text-slate-950">{(bps / 100).toFixed(2)}%</span>;
    }
  }
  // Timestamp / seconds
  if (key.toLowerCase().includes('maturity') || key.toLowerCase().includes('timestamp') || key.toLowerCase().includes('seconds')) {
    const sec = Number(value);
    if (!Number.isNaN(sec) && sec > 1000000) {
      return <span className="font-mono font-semibold text-slate-800">{formatDate(new Date(sec * 1000).toISOString())}</span>;
    }
  }
  // Boolean
  if (value === 'true' || value === 'false') {
    return (
      <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
        value === 'true' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'
      }`}>
        {value.toUpperCase()}
      </span>
    );
  }

  return <span className="font-mono font-semibold text-slate-800 break-all">{value}</span>;
}

/* ─── BlockchainEvidenceCard Component ─── */
interface BlockchainEvidenceCardProps {
  event: ActivityEvent;
  isExpandedDefault?: boolean;
}

export const BlockchainEvidenceCard: React.FC<BlockchainEvidenceCardProps> = ({
  event,
  isExpandedDefault = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
  const [copiedJson, setCopiedJson] = useState(false);
  const config = getEventConfig(event.eventName, event.data);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1500);
  };

  const contractName = event.contractName || (event.loanId === 'reputation' ? 'ReputationRegistry' : event.loanId === 'kyc' ? 'KYCRegistry' : 'LoanPool');
  const contractAddress = event.contractAddress || (event.loanId !== 'reputation' && event.loanId !== 'kyc' ? event.loanId : undefined);

  return (
    <div className={`rounded-2xl border transition-all duration-normal overflow-hidden ${
      isExpanded ? 'border-yellow-400 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-yellow-400'
    }`}>
      {/* ─── PRIMARY PRESENTATION: "What happened?" ─── */}
      <div className="p-5 space-y-3.5">
        {/* Header line: category, event name, block, timestamp */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${config.bgClass} ${config.colorClass} ${config.borderClass}`}>
              {config.icon}
              <span>{config.label}</span>
            </span>
            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {config.category}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 font-medium">
            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-bold">
              Block #{event.blockNumber}
            </span>
            <span>•</span>
            <span title={event.timestamp}>{timeAgo(event.timestamp)}</span>
          </div>
        </div>

        {/* Narrative Description: "What happened?" */}
        <p className="text-sm font-bold text-slate-950 leading-relaxed font-sans">
          {event.summary}
        </p>

        {/* Actor & Basic Context Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs text-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-medium">Initiated by:</span>
            {event.actor ? (
              <div className="inline-flex items-center gap-1.5">
                {event.actorName && (
                  <span className="font-bold text-slate-950">{event.actorName}</span>
                )}
                {event.actorRole && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-bold">
                    {event.actorRole}
                  </span>
                )}
                <AddressBadge address={event.actor} chars={4} />
              </div>
            ) : (
              <span className="font-mono text-slate-500 font-medium">Contract Trigger</span>
            )}
          </div>

          {/* Toggle for Expandable Secondary Presentation */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-fast cursor-pointer ${
              isExpanded
                ? 'bg-[#ffe600] text-black border border-yellow-400 shadow-xs'
                : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 hover:border-yellow-400'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isExpanded ? 'Hide Technical Proof' : 'How can I verify it?'}</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 ml-0.5" /> : <ChevronRight className="w-3.5 h-3.5 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* ─── EXPANDABLE SECONDARY PRESENTATION: "How can I verify it?" ─── */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50 p-5 space-y-4">
          {/* Section banner */}
          <div className="flex items-center justify-between text-xs text-slate-700 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cryptographic Proof &amp; Contract State</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-medium">
              Deterministic EVM Log · Log ID: {event.id}
            </span>
          </div>

          {/* Technical Proof Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Contract Emitted</span>
              <div className="font-bold text-slate-950">{contractName}</div>
              {contractAddress && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <AddressBadge address={contractAddress} chars={5} />
                  <Link
                    to={`/console/contracts/${contractAddress}`}
                    className="text-[10px] text-yellow-800 hover:text-yellow-950 font-bold font-sans hover:underline ml-1"
                    title="Inspect contract storage & methods"
                  >
                    Inspect
                  </Link>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Transaction Hash</span>
              <div className="flex items-center gap-1">
                <AddressBadge address={event.transactionHash} chars={6} />
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <Link
                  to={`/console/transactions/${event.transactionHash}`}
                  className="text-[10px] text-yellow-800 hover:text-yellow-950 font-bold font-sans hover:underline"
                  title="Inspect transaction receipt & parameters"
                >
                  Inspect
                </Link>
                <span className="text-slate-300 text-[10px]">•</span>
                <Link
                  to={`/console/replay?tx=${event.transactionHash}`}
                  className="text-[10px] text-yellow-800 hover:text-yellow-950 font-bold font-sans hover:underline"
                  title="Replay transaction progression"
                >
                  Replay
                </Link>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Block Height</span>
              <div className="font-mono font-black text-slate-950 text-sm">#{event.blockNumber}</div>
              <div className="text-[10px] text-slate-500 font-mono font-medium">Finalized &amp; Indexed</div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Timestamp</span>
              <div className="font-mono text-xs font-bold text-slate-950">{formatDate(event.timestamp)}</div>
              <div className="text-[10px] text-slate-500 font-mono">{event.timestamp}</div>
            </div>
          </div>

          {/* Structured Decoded Event Data Table */}
          {event.data && Object.keys(event.data).length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-950">Decoded Event Arguments</span>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-3.5 w-1/3">Parameter</th>
                      <th className="py-2.5 px-3.5">Decoded Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Object.entries(event.data).map(([key, value]) => (
                      <tr key={key} className="hover:bg-yellow-50/40 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono text-slate-700 font-medium">{key}</td>
                        <td className="py-2.5 px-3.5">{formatParameterValue(key, value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw JSON Code Block for Technical Inspection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-950 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-slate-500" />
                Raw Indexed Event Payload
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 hover:text-black bg-white border border-slate-300 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-xs"
              >
                {copiedJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed">
              {JSON.stringify(event, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
