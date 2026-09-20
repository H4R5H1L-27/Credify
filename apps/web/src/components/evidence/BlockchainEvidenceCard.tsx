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
  TrendingUp,
  FileText,
  Clock,
  Send,
  Download,
  Vote,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Code2,
  ExternalLink,
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
        colorClass: 'text-indigo-400',
        bgClass: 'bg-indigo-500/10',
        borderClass: 'border-indigo-500/20',
        icon: <FileText className="w-4 h-4 text-indigo-400" />,
      };
    case 'Funded':
      return {
        label: 'Syndicate Contribution',
        category: 'Funding',
        colorClass: 'text-brand-400',
        bgClass: 'bg-brand-500/10',
        borderClass: 'border-brand-500/20',
        icon: <Coins className="w-4 h-4 text-brand-400" />,
      };
    case 'LoanActivated':
      return {
        label: 'Funding Target Reached',
        category: 'Lifecycle Transition',
        colorClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/20',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      };
    case 'SpendExecuted':
      return {
        label: 'Controlled Supplier Disbursement',
        category: 'Procurement',
        colorClass: 'text-purple-400',
        bgClass: 'bg-purple-500/10',
        borderClass: 'border-purple-500/20',
        icon: <Send className="w-4 h-4 text-purple-400" />,
      };
    case 'RepaymentReceived':
      return {
        label: 'Borrower Repayment',
        category: 'Debt Service',
        colorClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/20',
        icon: <ArrowUpRight className="w-4 h-4 text-emerald-400" />,
      };
    case 'LoanRepaid':
      return {
        label: 'Agreement Fully Repaid',
        category: 'Terminal Settlement',
        colorClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/20',
        icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      };
    case 'RepaymentClaimed':
      return {
        label: 'Lender Pro-Rata Claim',
        category: 'Yield Distribution',
        colorClass: 'text-indigo-400',
        bgClass: 'bg-indigo-500/10',
        borderClass: 'border-indigo-500/20',
        icon: <Download className="w-4 h-4 text-indigo-400" />,
      };
    case 'DefaultVoteCast':
      return {
        label: 'Governance Default Vote',
        category: 'Consensus Governance',
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-500/20',
        icon: <Vote className="w-4 h-4 text-amber-400" />,
      };
    case 'LoanDefaulted':
      return {
        label: 'Consensus Default Finalized',
        category: 'Terminal Governance',
        colorClass: 'text-crimson-400',
        bgClass: 'bg-crimson-500/10',
        borderClass: 'border-crimson-500/20',
        icon: <AlertTriangle className="w-4 h-4 text-crimson-400" />,
      };
    case 'ReputationUpdated': {
      const isSuccess = data.successful === 'true' || data.successful === '1';
      return {
        label: isSuccess ? 'Reputation Reward (+8 pts)' : 'Reputation Penalty (−20 pts)',
        category: 'Credit Provenance',
        colorClass: isSuccess ? 'text-emerald-400' : 'text-crimson-400',
        bgClass: isSuccess ? 'bg-emerald-500/10' : 'bg-crimson-500/10',
        borderClass: isSuccess ? 'border-emerald-500/20' : 'border-crimson-500/20',
        icon: isSuccess ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-crimson-400" />,
      };
    }
    case 'VerificationUpdated':
      return {
        label: 'Identity Attestation',
        category: 'KYC Registry',
        colorClass: 'text-teal-400',
        bgClass: 'bg-teal-500/10',
        borderClass: 'border-teal-500/20',
        icon: <ShieldCheck className="w-4 h-4 text-teal-400" />,
      };
    default:
      return {
        label: eventName,
        category: 'Contract Event',
        colorClass: 'text-dark-text-secondary',
        bgClass: 'bg-dark-bg-3',
        borderClass: 'border-dark-border-subtle',
        icon: <Layers className="w-4 h-4 text-dark-text-muted" />,
      };
  }
}

/* ─── Parameter Formatter ─── */
function formatParameterValue(key: string, value: string): React.ReactNode {
  if (!value) return <span className="text-dark-text-muted">null</span>;

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
      return <span className="font-mono font-bold text-dark-text-primary">{eth.toFixed(4)} ETH <span className="text-[10px] font-normal text-dark-text-muted">({value} wei)</span></span>;
    } catch {
      return <span className="font-mono text-dark-text-secondary">{value}</span>;
    }
  }
  // APR BPS
  if (key.toLowerCase().includes('aprbps') || key.toLowerCase().includes('bps')) {
    const bps = Number(value);
    if (!Number.isNaN(bps)) {
      return <span className="font-mono font-bold text-dark-text-primary">{(bps / 100).toFixed(2)}%</span>;
    }
  }
  // Timestamp / seconds
  if (key.toLowerCase().includes('maturity') || key.toLowerCase().includes('timestamp') || key.toLowerCase().includes('seconds')) {
    const sec = Number(value);
    if (!Number.isNaN(sec) && sec > 1000000) {
      return <span className="font-mono text-dark-text-secondary">{formatDate(new Date(sec * 1000).toISOString())}</span>;
    }
  }
  // Boolean
  if (value === 'true' || value === 'false') {
    return (
      <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
        value === 'true' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-crimson-500/10 text-crimson-400 border border-crimson-500/20'
      }`}>
        {value.toUpperCase()}
      </span>
    );
  }

  return <span className="font-mono text-dark-text-secondary break-all">{value}</span>;
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
    <div className={`rounded-xl border transition-all duration-normal ${
      isExpanded ? 'border-dark-border-strong bg-dark-bg-2 shadow-card' : 'border-dark-border-default bg-dark-bg-2 hover:border-dark-border-strong'
    }`}>
      {/* ─── PRIMARY PRESENTATION: "What happened?" ─── */}
      <div className="p-4 space-y-3">
        {/* Header line: category, event name, block, timestamp */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${config.bgClass} ${config.colorClass} ${config.borderClass}`}>
              {config.icon}
              <span>{config.label}</span>
            </span>
            <span className="text-[11px] font-medium text-dark-text-muted bg-dark-bg-3 px-2 py-0.5 rounded border border-dark-border-subtle">
              {config.category}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-dark-text-muted">
            <span className="bg-dark-bg-3 px-2 py-0.5 rounded border border-dark-border-subtle text-dark-text-secondary font-semibold">
              Block #{event.blockNumber}
            </span>
            <span>•</span>
            <span title={event.timestamp}>{timeAgo(event.timestamp)}</span>
          </div>
        </div>

        {/* Narrative Description: "What happened?" */}
        <p className="text-sm font-medium text-dark-text-primary leading-relaxed">
          {event.summary}
        </p>

        {/* Actor & Basic Context Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-dark-border-subtle text-xs text-dark-text-secondary">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-dark-text-muted font-medium">Initiated by:</span>
            {event.actor ? (
              <div className="inline-flex items-center gap-1.5">
                {event.actorName && (
                  <span className="font-semibold text-dark-text-primary">{event.actorName}</span>
                )}
                {event.actorRole && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-bg-3 border border-dark-border-subtle text-dark-text-secondary font-bold">
                    {event.actorRole}
                  </span>
                )}
                <AddressBadge address={event.actor} chars={4} />
              </div>
            ) : (
              <span className="font-mono text-dark-text-muted">Contract Trigger</span>
            )}
          </div>

          {/* Toggle for Expandable Secondary Presentation */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-fast cursor-pointer ${
              isExpanded
                ? 'bg-brand-500 text-white shadow-xs'
                : 'bg-dark-bg-3 text-dark-text-secondary border border-dark-border-subtle hover:bg-dark-bg-1 hover:text-dark-text-primary hover:border-dark-border-default'
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
        <div className="border-t border-dark-border-default bg-dark-bg-1/90 p-4 space-y-4 rounded-b-xl animate-milestone-enter">
          {/* Section banner */}
          <div className="flex items-center justify-between text-xs text-dark-text-secondary border-b border-dark-border-subtle pb-2">
            <div className="flex items-center gap-1.5 font-semibold text-dark-text-primary">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Cryptographic Proof &amp; Contract State</span>
            </div>
            <span className="text-[11px] font-mono text-dark-text-muted">
              Deterministic EVM Log · Log ID: {event.id}
            </span>
          </div>

          {/* Technical Proof Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-[10px] uppercase font-bold text-dark-text-muted tracking-wider">Contract Emitted</span>
              <div className="font-bold text-dark-text-primary">{contractName}</div>
              {contractAddress && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <AddressBadge address={contractAddress} chars={5} />
                  <Link
                    to={`/console/contracts/${contractAddress}`}
                    className="text-[10px] text-brand-400 hover:text-brand-300 font-sans hover:underline ml-1"
                    title="Inspect contract storage & methods"
                  >
                    Inspect
                  </Link>
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-[10px] uppercase font-bold text-dark-text-muted tracking-wider">Transaction Hash</span>
              <div className="flex items-center gap-1">
                <AddressBadge address={event.transactionHash} chars={6} />
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <Link
                  to={`/console/transactions/${event.transactionHash}`}
                  className="text-[10px] text-brand-400 hover:text-brand-300 font-sans hover:underline"
                  title="Inspect transaction receipt & parameters"
                >
                  Inspect
                </Link>
                <span className="text-dark-text-muted text-[10px]">·</span>
                <Link
                  to={`/console/replay?tx=${event.transactionHash}`}
                  className="text-[10px] text-brand-400 hover:text-brand-300 font-sans hover:underline"
                  title="Replay transaction progression"
                >
                  Replay
                </Link>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-[10px] uppercase font-bold text-dark-text-muted tracking-wider">Block Height</span>
              <div className="font-mono font-bold text-dark-text-primary text-sm">#{event.blockNumber}</div>
              <div className="text-[10px] text-dark-text-muted font-mono">Finalized &amp; Indexed</div>
            </div>

            <div className="p-2.5 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-[10px] uppercase font-bold text-dark-text-muted tracking-wider">Timestamp</span>
              <div className="font-mono text-[11px] text-dark-text-primary">{formatDate(event.timestamp)}</div>
              <div className="text-[10px] text-dark-text-muted font-mono">{event.timestamp}</div>
            </div>
          </div>

          {/* Structured Decoded Event Data Table */}
          {event.data && Object.keys(event.data).length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-dark-text-secondary">Decoded Event Arguments</span>
              <div className="rounded-lg border border-dark-border-subtle bg-dark-bg-3 overflow-hidden">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-dark-bg-2 border-b border-dark-border-subtle text-dark-text-muted font-semibold">
                    <tr>
                      <th className="py-2 px-3 w-1/3">Parameter</th>
                      <th className="py-2 px-3">Decoded Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border-subtle">
                    {Object.entries(event.data).map(([key, value]) => (
                      <tr key={key} className="hover:bg-dark-bg-2/50 transition-colors">
                        <td className="py-2 px-3 font-mono text-dark-text-secondary font-medium">{key}</td>
                        <td className="py-2 px-3">{formatParameterValue(key, value)}</td>
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
              <span className="font-bold text-dark-text-secondary flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-dark-text-muted" />
                Raw Indexed Event Payload
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-dark-text-secondary hover:text-dark-text-primary bg-dark-bg-3 border border-dark-border-subtle px-2 py-0.5 rounded cursor-pointer transition-colors"
              >
                {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-dark-bg-4 border border-dark-border-subtle text-brand-300 font-mono text-[11px] overflow-x-auto max-h-48">
              {JSON.stringify(event, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
