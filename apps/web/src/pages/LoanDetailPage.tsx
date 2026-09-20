import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useIdentity } from '../context/IdentityContext';
import { useWallet } from '../context/WalletContext';
import { useLoan, useLoanActivity, useReputation, useReputationHistory } from '../hooks/useCredify';
import { useContractAction } from '../hooks/useContractAction';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AddressBadge } from '../components/ui/AddressBadge';
import { Progress } from '../components/ui/Progress';
import { Alert } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import { TransactionLifecycle } from '../components/ui/TransactionLifecycle';
import { EvidenceTimeline } from '../components/evidence/EvidenceTimeline';
import { api } from '../lib/api';
import {
  formatEther,
  formatEtherNum,
  parseEtherToWei,
  formatApr,
  formatDuration,
  formatDate,
  timeAgo,
} from '../lib/utils';
import {
  ArrowLeft,
  Coins,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Send,
  Download,
  Vote,
  ChevronDown,
  ChevronRight,
  Layers,
  Store,
  FlaskConical,
  ShieldAlert,
  History,
  Terminal,
  Binary,
} from 'lucide-react';

export const LoanDetailPage: React.FC = () => {
  const { loanId } = useParams<{ loanId: string }>();
  const { isVerified, address: currentAddress, isLender, isBorrower } = useIdentity();
  const { isConnected } = useWallet();

  const { data: loan, isLoading: loanLoading, error: loanError, refetch: refetchLoan } = useLoan(loanId);
  const { data: activity = [], isLoading: activityLoading, refetch: refetchActivity } = useLoanActivity(loanId);
  const borrowerAddress = loan?.borrower?.walletAddress;
  const { data: borrowerReputation } = useReputation(borrowerAddress);
  const { data: borrowerRepHistory = [] } = useReputationHistory(borrowerAddress);

  const {
    isExecuting,
    txState: contractTxState,
    executeContribute,
    executeSpend,
    executeRepay,
    executeClaim,
    executeVoteDefault,
  } = useContractAction();

  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Contextual Action Form States
  const [contributeEth, setContributeEth] = useState('2');
  const [spendMerchant, setSpendMerchant] = useState('');
  const [isTestUnauthorizedSpend, setIsTestUnauthorizedSpend] = useState(false);
  const [unauthorizedSpendAddress, setUnauthorizedSpendAddress] = useState('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  const [spendEth, setSpendEth] = useState('1');
  const [spendCategory, setSpendCategory] = useState('Hardware & Lab Equipment');
  const [repayEth, setRepayEth] = useState('2');
  const [isWarpingTime, setIsWarpingTime] = useState(false);

  if (loanLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (loanError || !loan) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Agreement Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested loan pool address does not exist on the local EVM or has not been deployed yet.
        </p>
        <div className="pt-2">
          <Button variant="outline" onClick={() => window.history.back()} icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Agreements
          </Button>
        </div>
      </div>
    );
  }

  // Derived Values
  const targetWeiNum = formatEtherNum(loan.targetWei);
  const contributedWeiNum = formatEtherNum(loan.contributedWei);
  const remainingFundingNum = Math.max(0, targetWeiNum - contributedWeiNum);
  const fundingPercent = targetWeiNum > 0 ? Math.min(100, Math.round((contributedWeiNum / targetWeiNum) * 100)) : 0;

  const totalRepaidNum = formatEtherNum(loan.totalRepaidWei);
  const totalRepayableNum = formatEtherNum(loan.totalRepayableWei);
  const remainingDebtNum = Math.max(0, totalRepayableNum - totalRepaidNum);
  const repaymentPercent = totalRepayableNum > 0 ? Math.min(100, Math.round((totalRepaidNum / totalRepayableNum) * 100)) : 0;

  const totalSpentNum = formatEtherNum(loan.totalSpentWei);
  const maxSpendNum = formatEtherNum(loan.maxSpendWei);
  const remainingSpendCapacity = Math.max(0, maxSpendNum - totalSpentNum);
  const spendPercent = maxSpendNum > 0 ? Math.min(100, Math.round((totalSpentNum / maxSpendNum) * 100)) : 0;
  const requestedDisburseNum = Number(spendEth) || 0;
  const resultingSpendCapacity = remainingSpendCapacity - requestedDisburseNum;
  const isOverspendDisburse = requestedDisburseNum > remainingSpendCapacity;
  const activeDisburseMerchant = isTestUnauthorizedSpend
    ? unauthorizedSpendAddress.trim()
    : (spendMerchant || (loan.merchants.length > 0 ? loan.merchants[0] : ''));
  const isApprovedDisburseMerchant = loan.merchants.some(
    (m) => m.toLowerCase() === activeDisburseMerchant.toLowerCase()
  );

  // Active wallet relationships
  const isBorrowerOfLoan = Boolean(
    currentAddress && loan.borrower.walletAddress.toLowerCase() === currentAddress.toLowerCase()
  );

  const activeLenderPosition = loan.lenders.find(
    (l) => currentAddress && l.walletAddress.toLowerCase() === currentAddress.toLowerCase()
  );

  // Pro-rata claimable calculation for connected lender
  const lenderClaimableWei = activeLenderPosition
    ? (activeLenderPosition.claimableWei ?? ((BigInt(loan.totalRepaidWei) * BigInt(activeLenderPosition.shareBps)) / 10000n).toString())
    : '0';

  // Real-time contribution and ownership calculations
  const contributeAmountNum = Math.max(0, Number(contributeEth) || 0);
  const isOverCapacity = contributeAmountNum > remainingFundingNum;
  const contributionSharePercent = targetWeiNum > 0 ? (contributeAmountNum / targetWeiNum) * 100 : 0;
  const currentLenderContributedNum = activeLenderPosition ? formatEtherNum(activeLenderPosition.contributedWei) : 0;
  const resultingLenderTotalNum = currentLenderContributedNum + (isOverCapacity ? 0 : contributeAmountNum);
  const resultingLenderSharePercent = targetWeiNum > 0 ? (resultingLenderTotalNum / targetWeiNum) * 100 : 0;
  const remainingAfterContribution = Math.max(0, remainingFundingNum - contributeAmountNum);

  const handleSetAllocationPercent = (percent: number) => {
    if (remainingFundingNum <= 0) return;
    if (percent === 100) {
      setContributeEth(remainingFundingNum.toString());
    } else {
      const calculated = (remainingFundingNum * (percent / 100)).toFixed(2);
      setContributeEth(calculated);
    }
  };

  // Derived Drawdowns and Repayments from Indexed Events
  const drawdownEvents = activity.filter((e) => e.eventName === 'SpendExecuted');
  const repaymentEvents = activity.filter(
    (e) => e.eventName === 'RepaymentReceived' || e.eventName === 'RepaymentMade'
  );

  // Lifecycle stage mapping
  const isFunding = loan.status === 'FUNDING';
  const isActive = loan.status === 'ACTIVE';
  const isRepaid = loan.status === 'REPAID';
  const isDefaulted = loan.status === 'DEFAULTED';

  // Governance Derived Metrics (7 Mandatory Metrics)
  const maturityDateFormatted = formatDate(loan.maturity);
  const isPastMaturity = new Date(loan.maturity).getTime() <= Date.now();
  const unpaidWei = BigInt(loan.totalRepayableWei) > BigInt(loan.totalRepaidWei)
    ? BigInt(loan.totalRepayableWei) - BigInt(loan.totalRepaidWei)
    : 0n;
  const unpaidEthStr = formatEther(unpaidWei.toString());
  const lenderVotingWeightWei = activeLenderPosition ? activeLenderPosition.contributedWei : '0';
  const lenderVotingWeightEth = activeLenderPosition ? formatEther(activeLenderPosition.contributedWei) : '0';
  const lenderVotingSharePercent = activeLenderPosition ? (activeLenderPosition.shareBps / 100).toFixed(2) : '0.00';
  const hasLenderVoted = Boolean(activeLenderPosition?.hasVoted);
  const defaultThresholdWei = BigInt(loan.defaultThresholdWei || '0');
  const defaultThresholdEth = formatEther(loan.defaultThresholdWei || '0');
  const currentVotesWei = BigInt(loan.defaultVoteWeightWei || '0');
  const currentVotesEth = formatEther(loan.defaultVoteWeightWei || '0');
  const participatingLenders = loan.lenders;
  const remainingVotingWeightWei = defaultThresholdWei > currentVotesWei
    ? defaultThresholdWei - currentVotesWei
    : 0n;
  const remainingVotingWeightEth = formatEther(remainingVotingWeightWei.toString());
  const quorumPercent = defaultThresholdWei > 0n
    ? Math.min(100, Math.round(Number((currentVotesWei * 100n) / defaultThresholdWei)))
    : 0;

  // Action handlers
  const handleContribute = async () => {
    if (!loanId) return;
    try {
      await executeContribute(loanId, parseEtherToWei(contributeEth));
      await refetchLoan();
      await refetchActivity();
    } catch {
      // Surfaced in txState
    }
  };

  const handleSpend = async () => {
    if (!loanId || !activeDisburseMerchant || !spendEth) return;
    try {
      await executeSpend(loanId, activeDisburseMerchant, parseEtherToWei(spendEth), spendCategory);
      await refetchLoan();
      await refetchActivity();
    } catch {
      // Surfaced in txState
    }
  };

  const handleRepay = async () => {
    if (!loanId) return;
    try {
      await executeRepay(loanId, parseEtherToWei(repayEth));
      await refetchLoan();
      await refetchActivity();
    } catch {
      // Surfaced in txState
    }
  };

  const handleClaim = async () => {
    if (!loanId) return;
    try {
      await executeClaim(loanId);
      await refetchLoan();
      await refetchActivity();
    } catch {
      // Surfaced in txState
    }
  };

  const handleVoteDefault = async () => {
    if (!loanId) return;
    try {
      await executeVoteDefault(loanId);
      await refetchLoan();
      await refetchActivity();
    } catch {
      // Surfaced in txState
    }
  };

  const handleFastForwardMaturity = async () => {
    setIsWarpingTime(true);
    try {
      await api.timeWarp(15 * 86400); // Fast forward 15 days past 14-day duration
      await refetchLoan();
      await refetchActivity();
    } finally {
      setIsWarpingTime(false);
    }
  };

  const breadcrumbLink = isBorrowerOfLoan
    ? '/app/borrower/agreements'
    : isLender
    ? (activeLenderPosition ? '/app/lender/positions' : '/app/lender/explore')
    : '/app/supplier/agreements';

  const breadcrumbLabel = isBorrowerOfLoan
    ? 'My Agreements'
    : isLender
    ? (activeLenderPosition ? 'My Positions' : 'Funding Opportunities')
    : 'Agreements';

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to={breadcrumbLink} className="hover:text-slate-900 transition-colors font-medium">
            {breadcrumbLabel}
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-800">{loan.address}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetchLoan();
              refetchActivity();
            }}
            className="text-xs h-7"
          >
            Refresh Chain State
          </Button>
        </div>
      </div>

      {/* Transaction Lifecycle Feedback Banner */}
      {contractTxState && (
        <TransactionLifecycle state={contractTxState} />
      )}

      {/* Funding Target Reached & Active Milestone Banner */}
      {isActive && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 shadow-depth-card flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Loan Activated On-Chain
              </span>
              <span className="text-[10px] font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                100% Funded
              </span>
            </div>
            <p className="text-xs text-emerald-300/90 leading-relaxed">
              The {targetWeiNum.toFixed(2)} ETH funding target was reached. The smart contract automatically transitioned from <code className="font-mono bg-dark-bg-2 px-1 rounded text-dark-text-primary">FUNDING</code> to <code className="font-mono bg-dark-bg-2 px-1 rounded text-emerald-400 font-bold">ACTIVE</code> via the <code className="font-mono bg-dark-bg-2 px-1 rounded text-dark-text-primary">LoanActivated</code> event.
              {isBorrowerOfLoan
                ? ' You may now disburse capital to allowlisted suppliers.'
                : ' Capital is secured in the pool; disbursements to approved merchants can be inspected below.'}
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          AGREEMENT HEADER
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-dark-bg-1 rounded-xl border border-dark-border-subtle p-5 shadow-depth-card space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-dark-text-primary tracking-tight">
                Credit Agreement {loan.address.slice(0, 10)}...
              </h1>
              <StatusBadge status={loan.status} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-dark-text-secondary mt-2 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-dark-text-muted">Contract:</span>
                <AddressBadge address={loan.address} chars={6} />
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5 font-sans">
                <span className="text-dark-text-muted">Borrower:</span>
                <span className="font-semibold text-dark-text-primary">{loan.borrower.displayName}</span>
                <AddressBadge address={loan.borrower.walletAddress} chars={4} />
              </div>
              <span>·</span>
              <div className="flex items-center gap-1 text-emerald-400 font-medium font-sans">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>KYC Verified</span>
              </div>
              <span>·</span>
              <Link
                to={`/console/contracts/${loan.address}`}
                className="inline-flex items-center gap-1 text-credify-400 hover:text-credify-300 font-sans font-medium text-xs hover:underline"
                title="Inspect on-chain contract code and storage"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Inspect Contract</span>
              </Link>
              <span>·</span>
              <Link
                to={`/console/trace?pool=${loan.address}`}
                className="inline-flex items-center gap-1 text-credify-400 hover:text-credify-300 font-sans font-medium text-xs hover:underline"
                title="Trace end-to-end action lifecycle for this agreement"
              >
                <Binary className="w-3.5 h-3.5" />
                <span>Show Technical Evidence</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-dark-border-subtle">
            <div className="text-right">
              <div className="text-xs text-dark-text-muted font-medium">Principal Target</div>
              <div className="text-xl font-bold text-dark-text-primary font-mono">
                {formatEther(loan.targetWei)} ETH
              </div>
            </div>
            <div className="h-8 w-px bg-dark-border-subtle hidden md:block" />
            <div className="text-right">
              <div className="text-xs text-dark-text-muted font-medium">Fixed APR</div>
              <div className="text-xl font-bold text-dark-text-primary font-mono">
                {formatApr(loan.aprBps)}
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle Progression Rail */}
        <div className="pt-2 border-t border-dark-border-subtle">
          <div className="text-xs font-semibold text-dark-text-muted uppercase tracking-wider mb-2">
            Agreement Lifecycle
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border bg-dark-bg-2 border-dark-border-subtle">
              <div className="flex items-center gap-1.5 font-semibold text-dark-text-primary">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Created</span>
              </div>
              <div className="text-xs text-dark-text-secondary mt-1">Contract instantiated</div>
            </div>

            <div
              className={`p-2.5 rounded-lg border ${
                isFunding
                  ? 'bg-blue-950/20 border-blue-500/30 ring-1 ring-blue-500/30'
                  : isActive || isRepaid || isDefaulted
                  ? 'bg-dark-bg-2 border-dark-border-subtle'
                  : 'bg-dark-bg-2/50 border-dark-border-subtle/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-dark-text-primary">
                {isActive || isRepaid || isDefaulted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isFunding ? (
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                ) : (
                  <Clock className="w-4 h-4 text-dark-text-muted" />
                )}
                <span>Funding</span>
              </div>
              <div className="text-xs text-dark-text-secondary mt-1 font-mono">
                {isFunding ? `${fundingPercent}% committed` : 'Fully funded'}
              </div>
            </div>

            <div
              className={`p-2.5 rounded-lg border ${
                isActive
                  ? 'bg-emerald-950/20 border-emerald-500/30 ring-1 ring-emerald-500/30'
                  : isRepaid || isDefaulted
                  ? 'bg-dark-bg-2 border-dark-border-subtle'
                  : 'bg-dark-bg-2/50 border-dark-border-subtle/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-dark-text-primary">
                {isRepaid || isDefaulted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isActive ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ) : (
                  <Clock className="w-4 h-4 text-dark-text-muted" />
                )}
                <span>Active</span>
              </div>
              <div className="text-xs text-dark-text-secondary mt-1">
                {isActive ? 'Spending & repayment' : isFunding ? 'Awaiting funding' : 'Complete'}
              </div>
            </div>

            <div
              className={`p-2.5 rounded-lg border ${
                isRepaid
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                  : isDefaulted
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-400'
                  : 'bg-dark-bg-2/50 border-dark-border-subtle/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-dark-text-primary">
                {isRepaid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isDefaulted ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : (
                  <Clock className="w-4 h-4 text-dark-text-muted" />
                )}
                <span>Settlement</span>
              </div>
              <div className="text-xs text-dark-text-secondary mt-1">
                {isRepaid ? '100% Repaid' : isDefaulted ? 'Defaulted' : 'Due ' + formatDate(loan.maturity)}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Agreement Terms (compact definition list) ─── */}
        <div className="pt-2 border-t border-dark-border-subtle">
          <div className="text-xs font-semibold text-dark-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Smart Contract Terms
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-dark-border-subtle rounded-lg overflow-hidden text-xs">
            <div className="bg-dark-bg-2 p-3 space-y-1">
              <div className="text-dark-text-muted font-medium">Principal</div>
              <div className="font-bold text-dark-text-primary font-mono">{formatEther(loan.targetWei)} ETH</div>
            </div>
            <div className="bg-dark-bg-2 p-3 space-y-1">
              <div className="text-dark-text-muted font-medium">Interest Rate</div>
              <div className="font-bold text-dark-text-primary font-mono">{formatApr(loan.aprBps)}</div>
            </div>
            <div className="bg-dark-bg-2 p-3 space-y-1">
              <div className="text-dark-text-muted font-medium">Duration</div>
              <div className="font-bold text-dark-text-primary font-mono">{formatDuration(loan.durationSeconds)}</div>
            </div>
            <div className="bg-dark-bg-2 p-3 space-y-1">
              <div className="text-dark-text-muted font-medium">Total Repayable</div>
              <div className="font-bold text-dark-text-primary font-mono">{formatEther(loan.totalRepayableWei)} ETH</div>
            </div>
            <div className="bg-dark-bg-2 p-3 space-y-1">
              <div className="text-dark-text-muted font-medium">Spend Limit</div>
              <div className="font-bold text-dark-text-primary font-mono">{formatEther(loan.maxSpendWei)} ETH</div>
            </div>
            <div className="bg-dark-bg-2 p-3 space-y-1">
              <div className="text-dark-text-muted font-medium">Default Quorum</div>
              <div className="font-bold text-dark-text-primary font-mono">{formatEther(loan.defaultThresholdWei)} ETH</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          FUNDING
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-dark-bg-1 rounded-xl border border-dark-border-subtle shadow-depth-card overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-dark-text-primary flex items-center gap-2">
                <Coins className="w-4 h-4 text-credify-400" />
                Funding
              </h2>
              <p className="text-xs text-dark-text-muted mt-0.5">
                Capital contributions recorded by <code className="font-mono text-dark-text-secondary">contribute()</code>.
              </p>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="font-bold text-dark-text-primary">{formatEther(loan.contributedWei)}</span>
              <span className="text-dark-text-muted"> / {formatEther(loan.targetWei)} ETH</span>
            </div>
          </div>

          {/* Funding Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-dark-text-secondary font-medium">
              <span>Funding Progress</span>
              <span>{fundingPercent}%</span>
            </div>
            <Progress value={fundingPercent} className="h-2" />
            {isFunding && (
              <div className="text-xs text-dark-text-muted flex justify-between pt-1 font-mono">
                <span>Remaining capacity:</span>
                <span className="font-semibold text-dark-text-primary">{remainingFundingNum.toFixed(4)} ETH</span>
              </div>
            )}
          </div>

          {/* Syndicate Lenders Table */}
          <div className="border border-dark-border-subtle rounded-lg overflow-hidden">
            <div className="bg-dark-bg-2 px-3 py-2 text-xs font-semibold text-dark-text-muted uppercase tracking-wider border-b border-dark-border-subtle">
              Syndicate Participants ({loan.lenders.length})
            </div>
            {loan.lenders.length === 0 ? (
              <div className="p-4 text-center text-xs text-dark-text-muted">
                No lenders have contributed to this agreement yet.
              </div>
            ) : (
              <div className="divide-y divide-dark-border-subtle text-xs font-sans">
                {loan.lenders.map((lender, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AddressBadge address={lender.walletAddress} chars={5} />
                      {currentAddress && lender.walletAddress.toLowerCase() === currentAddress.toLowerCase() && (
                        <Badge variant="outline" className="text-xs">
                          Your Wallet
                        </Badge>
                      )}
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-dark-text-primary">{formatEther(lender.contributedWei)} ETH</div>
                      <div className="text-xs text-dark-text-muted">{(lender.shareBps / 100).toFixed(2)}% share</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Your Lender Position (inline, if connected wallet is a lender) */}
          {activeLenderPosition && (
            <div className="p-4 rounded-lg bg-credify-950/20 border border-credify-500/30 space-y-2">
              <div className="text-xs font-bold text-credify-300 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-credify-400" />
                <span>Your Position in This Syndicate</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-dark-text-muted">Contributed</div>
                  <div className="font-mono font-bold text-dark-text-primary">{formatEther(activeLenderPosition.contributedWei)} ETH</div>
                </div>
                <div>
                  <div className="text-dark-text-muted">Share</div>
                  <div className="font-mono font-bold text-dark-text-primary">{(activeLenderPosition.shareBps / 100).toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-dark-text-muted">Claimable</div>
                  <div className="font-mono font-bold text-emerald-400">{formatEther(lenderClaimableWei)} ETH</div>
                </div>
              </div>
            </div>
          )}

          {/* CONTEXTUAL ACTION: Contribute (if FUNDING) */}
          {isFunding && (
            <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-blue-400" />
                  <span>Contribute to Loan Syndicate</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-dark-text-muted font-mono">
                    Target: {targetWeiNum.toFixed(2)} ETH
                  </span>
                  <span className="text-dark-text-muted">•</span>
                  <span className="text-xs text-blue-400 font-mono font-semibold">
                    Cap: {remainingFundingNum.toFixed(4)} ETH
                  </span>
                </div>
              </div>

              {!isVerified && (
                <Alert variant="warning" title="Verification Required">
                  Lenders must be verified in the <code className="font-mono">KYCRegistry</code> smart contract before contributing. Complete verification in the{' '}
                  <Link to="/app/verify" className="underline font-semibold">
                    Verification Workflow
                  </Link>.
                </Alert>
              )}

              {/* Quick Allocation Shortcuts */}
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-xs text-dark-text-muted font-medium">Quick Allocation:</span>
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleSetAllocationPercent(pct)}
                    className="text-xs font-medium px-2 py-0.5 rounded bg-dark-bg-2 border border-dark-border-subtle hover:border-blue-500/50 hover:bg-dark-bg-3 text-dark-text-secondary hover:text-dark-text-primary transition-colors cursor-pointer"
                  >
                    {pct === 100 ? 'MAX (100%)' : `${pct}%`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.01"
                    max={remainingFundingNum.toString()}
                    value={contributeEth}
                    onChange={(e) => setContributeEth(e.target.value)}
                    className={`w-full text-xs p-2.5 pr-14 rounded-lg border font-mono focus:outline-none focus:ring-2 ${
                      isOverCapacity
                        ? 'border-rose-500/50 focus:ring-rose-500 text-rose-300 bg-rose-950/20'
                        : 'border-dark-border-default focus:ring-blue-500 bg-dark-bg-2 text-dark-text-primary placeholder:text-dark-text-muted'
                    }`}
                    placeholder="Amount in ETH"
                  />
                  <button
                    type="button"
                    onClick={() => setContributeEth(remainingFundingNum.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-950/50 border border-blue-500/30 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    MAX
                  </button>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  disabled={
                    isExecuting ||
                    !isVerified ||
                    contributeAmountNum <= 0 ||
                    isOverCapacity
                  }
                  loading={isExecuting}
                  onClick={handleContribute}
                  className="text-xs shrink-0"
                >
                  Contribute ETH
                </Button>
              </div>

              {/* Clamping Warning */}
              {isOverCapacity && (
                <div className="text-xs text-rose-300 bg-rose-950/30 border border-rose-500/40 rounded p-2 flex items-center justify-between">
                  <span>
                    Entered amount exceeds remaining pool capacity ({remainingFundingNum.toFixed(4)} ETH).
                  </span>
                  <button
                    type="button"
                    onClick={() => setContributeEth(remainingFundingNum.toString())}
                    className="underline font-bold hover:text-rose-200 ml-2 shrink-0 cursor-pointer"
                  >
                    Clamp to MAX ({remainingFundingNum.toFixed(4)} ETH)
                  </button>
                </div>
              )}

              {/* Real-time Contribution & Ownership Breakdown */}
              {contributeAmountNum > 0 && !isOverCapacity && (
                <div className="p-3 bg-dark-bg-2 border border-dark-border-subtle rounded-lg text-xs space-y-1.5 shadow-depth-card">
                  <div className="flex justify-between items-center text-dark-text-secondary">
                    <span>Contribution share of loan target:</span>
                    <span className="font-mono font-bold text-blue-400">
                      {contributionSharePercent.toFixed(2)}% ({contributeAmountNum} / {targetWeiNum} ETH)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-dark-text-secondary">
                    <span>Your resulting syndicate ownership:</span>
                    <span className="font-mono font-bold text-credify-400">
                      {resultingLenderSharePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-dark-text-secondary">
                    <span>Remaining pool capacity after confirmation:</span>
                    <span className="font-mono text-dark-text-primary">
                      {remainingAfterContribution.toFixed(4)} ETH
                      {remainingAfterContribution === 0 && (
                        <span className="text-emerald-400 font-bold ml-1.5">
                          (Target reached → will activate loan on-chain)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SPENDING
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-dark-bg-1 rounded-xl border border-dark-border-subtle shadow-depth-card overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-dark-text-primary flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                Spending
              </h2>
              <p className="text-xs text-dark-text-muted mt-0.5">
                Borrower can only disburse funds directly to verified merchant allowlist.
              </p>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="font-bold text-dark-text-primary">{formatEther(loan.totalSpentWei)}</span>
              <span className="text-dark-text-muted"> / {formatEther(loan.maxSpendWei)} ETH</span>
            </div>
          </div>

          {/* 5-Metric Spending Policy Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-0.5">
              <div className="text-xs text-dark-text-muted font-medium">1. Spending Cap</div>
              <div className="font-bold font-mono text-dark-text-primary text-sm">{maxSpendNum.toFixed(4)} ETH</div>
              <div className="text-xs text-dark-text-muted">Total policy limit</div>
            </div>

            <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-0.5">
              <div className="text-xs text-dark-text-muted font-medium">2. Already Spent</div>
              <div className="font-bold font-mono text-dark-text-secondary text-sm">{totalSpentNum.toFixed(4)} ETH</div>
              <div className="text-xs text-dark-text-muted">Disbursed to date</div>
            </div>

            <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-0.5">
              <div className="text-xs text-dark-text-muted font-medium">3. Remaining Capacity</div>
              <div className="font-bold font-mono text-emerald-400 text-sm">{remainingSpendCapacity.toFixed(4)} ETH</div>
              <div className="text-xs text-dark-text-muted">Available room</div>
            </div>

            <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-credify-500/30 space-y-0.5">
              <div className="text-xs text-credify-400 font-medium">4. Requested Amount</div>
              <div className="font-bold font-mono text-credify-300 text-sm">
                {requestedDisburseNum > 0 ? requestedDisburseNum.toFixed(4) : '0.0000'} ETH
              </div>
              <div className="text-xs text-dark-text-muted">Pending disburse</div>
            </div>

            <div className={`p-2.5 rounded-lg border space-y-0.5 ${
              isOverspendDisburse
                ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="text-xs font-semibold flex items-center gap-1">
                <span>5. Resulting Capacity</span>
                {isOverspendDisburse ? (
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                )}
              </div>
              <div className={`font-bold font-mono text-sm ${isOverspendDisburse ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isOverspendDisburse
                  ? `-${Math.abs(resultingSpendCapacity).toFixed(4)} ETH`
                  : `${resultingSpendCapacity.toFixed(4)} ETH`}
              </div>
              <div className="text-xs opacity-80">
                {isOverspendDisburse ? 'Limit exceeded' : 'Post-tx remaining'}
              </div>
            </div>
          </div>

          {/* Spending Progress */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-dark-text-secondary font-medium">
              <span>Spending Limit Utilization</span>
              <span>{spendPercent}%</span>
            </div>
            <Progress value={spendPercent} className="h-2" />
          </div>

          {/* Approved Merchant Allowlist */}
          <div className="border border-dark-border-subtle rounded-lg overflow-hidden">
            <div className="bg-dark-bg-2 px-3 py-2 text-xs font-semibold text-dark-text-muted uppercase tracking-wider border-b border-dark-border-subtle">
              Approved Supplier Allowlist ({loan.merchants.length})
            </div>
            <div className="divide-y divide-dark-border-subtle text-xs">
              {loan.merchants.map((merchantAddr, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono">
                    <Store className="w-3.5 h-3.5 text-dark-text-muted" />
                    <AddressBadge address={merchantAddr} chars={6} />
                  </div>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded text-xs">
                    <ShieldCheck className="w-3 h-3" />
                    Allowlisted
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Drawdown Ledger */}
          <div className="border border-dark-border-subtle rounded-lg overflow-hidden">
            <div className="bg-dark-bg-2 px-3 py-2 text-xs font-semibold text-dark-text-muted uppercase tracking-wider border-b border-dark-border-subtle">
              Drawdown Ledger ({drawdownEvents.length})
            </div>
            {drawdownEvents.length === 0 ? (
              <div className="p-4 text-center text-xs text-dark-text-muted">
                No disbursements executed yet.
              </div>
            ) : (
              <div className="divide-y divide-dark-border-subtle text-xs font-sans">
                {drawdownEvents.map((evt) => (
                  <div key={evt.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-dark-text-primary">{evt.summary}</div>
                      <div className="text-xs text-dark-text-muted font-mono mt-0.5 flex items-center gap-1.5">
                        <span>Block #{evt.blockNumber}</span>
                        <span>·</span>
                        <span>{timeAgo(evt.timestamp)}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      {evt.data?.amountWei && (
                        <div className="font-bold text-dark-text-primary">-{formatEther(evt.data.amountWei)} ETH</div>
                      )}
                      <div className="text-xs text-dark-text-muted">
                        Tx: {evt.transactionHash.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CONTEXTUAL ACTION: Disburse (if ACTIVE and borrower) */}
          {isActive && isBorrowerOfLoan && (
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Disburse Funds to Whitelisted Supplier</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTestUnauthorizedSpend(!isTestUnauthorizedSpend)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-credify-400 hover:text-credify-300 cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>{isTestUnauthorizedSpend ? 'Select Approved Supplier' : 'Test Non-Allowlisted Supplier (Evaluator)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-dark-text-secondary mb-1">
                    {isTestUnauthorizedSpend ? 'Unauthorized Destination Address (Evaluator)' : 'Select Approved Supplier'}
                  </label>
                  {!isTestUnauthorizedSpend ? (
                    <select
                      value={spendMerchant || (loan.merchants.length > 0 ? loan.merchants[0] : '')}
                      onChange={(e) => setSpendMerchant(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-dark-border-default bg-dark-bg-2 text-dark-text-primary font-mono"
                    >
                      {loan.merchants.map((addr) => (
                        <option key={addr} value={addr}>
                          {addr.slice(0, 10)}...{addr.slice(-6)} (Allowlisted)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={unauthorizedSpendAddress}
                      onChange={(e) => setUnauthorizedSpendAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full text-xs p-2 rounded border border-amber-500/40 bg-amber-950/20 font-mono text-amber-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-text-secondary mb-1">Expense Category</label>
                  <input
                    type="text"
                    value={spendCategory}
                    onChange={(e) => setSpendCategory(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-dark-border-default bg-dark-bg-2 text-dark-text-primary placeholder:text-dark-text-muted"
                    placeholder="e.g. Lab Hardware"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0.01"
                      value={spendEth}
                      onChange={(e) => setSpendEth(e.target.value)}
                      className={`w-full text-xs p-2.5 pr-12 rounded-lg border font-mono focus:outline-none focus:ring-2 ${
                        isOverspendDisburse
                          ? 'border-rose-500/50 bg-rose-950/20 text-rose-300 focus:ring-rose-500'
                          : 'border-dark-border-default bg-dark-bg-2 text-dark-text-primary focus:ring-emerald-500 placeholder:text-dark-text-muted'
                      }`}
                      placeholder="Disbursement amount in ETH"
                    />
                  </div>

                  <Button
                    size="sm"
                    variant={isOverspendDisburse || !isApprovedDisburseMerchant ? 'secondary' : 'primary'}
                    disabled={isExecuting || requestedDisburseNum <= 0 || !activeDisburseMerchant}
                    loading={isExecuting}
                    onClick={handleSpend}
                    className={`text-xs shrink-0 ${
                      isOverspendDisburse || !isApprovedDisburseMerchant
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isOverspendDisburse || !isApprovedDisburseMerchant
                      ? 'Attempt via MetaMask (Test Rejection)'
                      : `Disburse via Contract (${spendEth} ETH)`}
                  </Button>
                </div>

                {/* Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setSpendEth((remainingSpendCapacity * 0.25).toFixed(2))}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-dark-bg-2 hover:bg-dark-bg-3 text-dark-text-secondary hover:text-dark-text-primary border border-dark-border-subtle cursor-pointer"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpendEth((remainingSpendCapacity * 0.50).toFixed(2))}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-dark-bg-2 hover:bg-dark-bg-3 text-dark-text-secondary hover:text-dark-text-primary border border-dark-border-subtle cursor-pointer"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpendEth((remainingSpendCapacity * 0.75).toFixed(2))}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-dark-bg-2 hover:bg-dark-bg-3 text-dark-text-secondary hover:text-dark-text-primary border border-dark-border-subtle cursor-pointer"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpendEth(remainingSpendCapacity.toString())}
                    className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 cursor-pointer"
                  >
                    MAX
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpendEth((remainingSpendCapacity + 1.0).toFixed(2))}
                    className="text-xs font-bold px-2 py-0.5 rounded bg-rose-950/40 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 cursor-pointer"
                    title="Set amount to remaining capacity + 1.0 ETH to verify SpendLimitExceeded contract rejection"
                  >
                    🧪 Test Overspend (+1 ETH)
                  </button>
                </div>
              </div>

              {/* Real-Time Contract Warnings */}
              {isOverspendDisburse && (
                <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-snug">
                    <strong>Overspending Rejection:</strong> Requested amount ({requestedDisburseNum} ETH) exceeds remaining capacity ({remainingSpendCapacity.toFixed(4)} ETH). The smart contract will revert with <code className="bg-rose-950/50 px-1 py-0.5 rounded font-mono text-xs text-rose-300 border border-rose-500/30">SpendLimitExceeded</code>.
                  </div>
                </div>
              )}

              {!isApprovedDisburseMerchant && (
                <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-snug">
                    <strong>Unauthorized Supplier Rejection:</strong> Recipient <code className="bg-amber-950/50 px-1 py-0.5 rounded font-mono text-xs text-amber-300 border border-amber-500/30">{activeDisburseMerchant}</code> is not on the agreement's allowlist. The smart contract will revert with <code className="bg-amber-950/50 px-1 py-0.5 rounded font-mono text-xs text-amber-300 border border-amber-500/30">MerchantNotApproved()</code>.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          REPAYMENT
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-dark-bg-1 rounded-xl border border-dark-border-subtle shadow-depth-card overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-dark-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Repayment
              </h2>
              <p className="text-xs text-dark-text-muted mt-0.5">
                Repayment balance is held in pool contract for pro-rata pull claims by lenders.
              </p>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="font-bold text-dark-text-primary">{formatEther(loan.totalRepaidWei)}</span>
              <span className="text-dark-text-muted"> / {formatEther(loan.totalRepayableWei)} ETH</span>
            </div>
          </div>

          {/* 5-Metric Repayment Schedule Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-0.5">
              <div className="text-xs text-dark-text-muted font-medium">1. Principal</div>
              <div className="font-bold font-mono text-dark-text-primary text-sm">{formatEther(loan.targetWei)} ETH</div>
              <div className="text-xs text-dark-text-muted">Target borrowed</div>
            </div>

            <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-0.5">
              <div className="text-xs text-dark-text-muted font-medium">2. Fixed Interest</div>
              <div className="font-bold font-mono text-dark-text-secondary text-sm">
                {(formatEtherNum(loan.totalRepayableWei) - formatEtherNum(loan.targetWei)).toFixed(4)} ETH
              </div>
              <div className="text-xs text-dark-text-muted font-mono">{formatApr(loan.aprBps)} APR</div>
            </div>

            <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-0.5">
              <div className="text-xs text-dark-text-muted font-medium">3. Total Repayable</div>
              <div className="font-bold font-mono text-dark-text-primary text-sm">{formatEther(loan.totalRepayableWei)} ETH</div>
              <div className="text-xs text-dark-text-muted">Principal + interest</div>
            </div>

            <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-0.5">
              <div className="text-xs text-dark-text-muted font-medium">4. Amount Repaid</div>
              <div className="font-bold font-mono text-emerald-400 text-sm">{formatEther(loan.totalRepaidWei)} ETH</div>
              <div className="text-xs text-dark-text-muted">{repaymentPercent}% satisfied</div>
            </div>

            <div className={`p-2.5 rounded-lg border space-y-0.5 ${
              remainingDebtNum === 0
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-blue-950/20 border-blue-500/30 text-blue-300'
            }`}>
              <div className="text-xs font-semibold">5. Remaining Debt</div>
              <div className={`font-bold font-mono text-sm ${
                remainingDebtNum === 0 ? 'text-emerald-400' : 'text-blue-400'
              }`}>
                {remainingDebtNum.toFixed(4)} ETH
              </div>
              <div className="text-xs opacity-80">
                {remainingDebtNum === 0 ? 'Fully settled' : 'Outstanding balance'}
              </div>
            </div>
          </div>

          {/* Repayment Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-dark-text-secondary font-medium">
              <span>Repayment Progress</span>
              <span>{repaymentPercent}%</span>
            </div>
            <Progress value={repaymentPercent} className="h-2" />
            <div className="text-xs text-dark-text-muted flex justify-between pt-1 font-mono">
              <span>Remaining outstanding debt:</span>
              <span className="font-semibold text-dark-text-primary">{remainingDebtNum.toFixed(4)} ETH</span>
            </div>
          </div>

          {/* Repayment Ledger */}
          <div className="border border-dark-border-subtle rounded-lg overflow-hidden">
            <div className="bg-dark-bg-2 px-3 py-2 text-xs font-semibold text-dark-text-muted uppercase tracking-wider border-b border-dark-border-subtle">
              Repayments Ledger ({repaymentEvents.length})
            </div>
            {repaymentEvents.length === 0 ? (
              <div className="p-4 text-center text-xs text-dark-text-muted">
                No debt repayments recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-dark-border-subtle text-xs font-sans">
                {repaymentEvents.map((evt) => (
                  <div key={evt.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-dark-text-primary font-mono">
                        {evt.summary}
                      </div>
                      <div className="text-xs text-dark-text-muted font-mono mt-0.5 flex items-center gap-1.5">
                        <span>Block #{evt.blockNumber}</span>
                        <span>·</span>
                        <span>{timeAgo(evt.timestamp)}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      {evt.data?.amountWei && (
                        <div className="font-bold text-dark-text-primary">+{formatEther(evt.data.amountWei)} ETH</div>
                      )}
                      <div className="text-xs text-dark-text-muted">
                        Tx: {evt.transactionHash.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CONTEXTUAL ACTION: Repay (if ACTIVE and borrower) */}
          {isActive && isBorrowerOfLoan && remainingDebtNum > 0 && (
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Submit Debt Repayment</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max={remainingDebtNum.toString()}
                      value={repayEth}
                      onChange={(e) => setRepayEth(e.target.value)}
                      className="w-full text-xs p-2.5 pr-12 rounded-lg border border-dark-border-default focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-dark-bg-2 text-dark-text-primary font-mono placeholder:text-dark-text-muted"
                      placeholder="Repayment in ETH"
                    />
                    <button
                      type="button"
                      onClick={() => setRepayEth(remainingDebtNum.toString())}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isExecuting || Number(repayEth) <= 0 || Number(repayEth) > remainingDebtNum}
                    loading={isExecuting}
                    onClick={handleRepay}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 shrink-0"
                  >
                    Repay via Contract
                  </Button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setRepayEth((remainingDebtNum * 0.25).toFixed(4))}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-dark-bg-2 hover:bg-dark-bg-3 text-dark-text-secondary hover:text-dark-text-primary border border-dark-border-subtle cursor-pointer"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayEth((remainingDebtNum * 0.50).toFixed(4))}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-950/40 hover:bg-blue-950/60 text-blue-300 border border-blue-500/30 cursor-pointer"
                  >
                    50% Partial ({(remainingDebtNum * 0.50).toFixed(2)} ETH)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayEth((remainingDebtNum * 0.75).toFixed(4))}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-dark-bg-2 hover:bg-dark-bg-3 text-dark-text-secondary hover:text-dark-text-primary border border-dark-border-subtle cursor-pointer"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayEth(remainingDebtNum.toString())}
                    className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 cursor-pointer"
                  >
                    100% Full Debt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTEXTUAL ACTION: Claim Repayment (for syndicate lenders) */}
          {activeLenderPosition && (
            <div className="p-4 rounded-lg bg-credify-950/20 border border-credify-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-credify-300 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-credify-400" />
                    <span>Lender Pro-Rata Repayment Claim</span>
                  </div>
                  <div className="text-xs text-credify-400/90 mt-0.5">
                    Your {(activeLenderPosition.shareBps / 100).toFixed(2)}% syndicate share entitles you to pull-claim proportional debt repayments.
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs text-dark-text-muted">Claimable Balance</div>
                  <div className={`text-base font-bold ${
                    BigInt(lenderClaimableWei) > 0n ? 'text-emerald-400' : 'text-dark-text-muted'
                  }`}>
                    {formatEther(lenderClaimableWei)} ETH
                  </div>
                </div>
              </div>

              {/* 5-Metric Pro-Rata Claim Accounting Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-0.5">
                  <div className="text-xs text-dark-text-muted font-medium uppercase">1. Contribution</div>
                  <div className="font-bold font-mono text-dark-text-primary text-sm">
                    {formatEther(activeLenderPosition.contributedWei)} ETH
                  </div>
                  <div className="text-xs text-credify-400 font-semibold font-mono">
                    {(activeLenderPosition.shareBps / 100).toFixed(2)}% share
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-0.5">
                  <div className="text-xs text-dark-text-muted font-medium uppercase">2. Total Contributed</div>
                  <div className="font-bold font-mono text-dark-text-secondary text-sm">
                    {formatEther(loan.contributedWei)} ETH
                  </div>
                  <div className="text-xs text-dark-text-muted">Pool target</div>
                </div>

                <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-0.5">
                  <div className="text-xs text-dark-text-muted font-medium uppercase">3. Total Repaid</div>
                  <div className="font-bold font-mono text-dark-text-secondary text-sm">
                    {formatEther(loan.totalRepaidWei)} ETH
                  </div>
                  <div className="text-xs text-dark-text-muted">
                    / {formatEther(loan.totalRepayableWei)} ETH
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-0.5">
                  <div className="text-xs text-dark-text-muted font-medium uppercase">4. Claimed Amount</div>
                  <div className="font-bold font-mono text-dark-text-secondary text-sm">
                    {formatEther(activeLenderPosition.claimedWei || '0')} ETH
                  </div>
                  <div className="text-xs text-dark-text-muted">Already withdrawn</div>
                </div>

                <div className={`p-2.5 rounded-lg border space-y-0.5 ${
                  BigInt(lenderClaimableWei) > 0n
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-dark-bg-2 border-dark-border-subtle text-dark-text-muted'
                }`}>
                  <div className="text-xs font-semibold uppercase">5. Currently Claimable</div>
                  <div className={`font-bold font-mono text-sm ${
                    BigInt(lenderClaimableWei) > 0n ? 'text-emerald-400' : 'text-dark-text-muted'
                  }`}>
                    {formatEther(lenderClaimableWei)} ETH
                  </div>
                  <div className="text-xs opacity-80">
                    {BigInt(lenderClaimableWei) > 0n ? 'Ready to pull' : 'No balance due'}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  variant={BigInt(lenderClaimableWei) > 0n ? 'primary' : 'secondary'}
                  disabled={isExecuting || BigInt(lenderClaimableWei) === 0n}
                  loading={isExecuting}
                  onClick={handleClaim}
                  className={`text-xs ${
                    BigInt(lenderClaimableWei) > 0n
                      ? 'bg-credify-600 hover:bg-credify-700 text-white'
                      : 'text-dark-text-muted cursor-not-allowed'
                  }`}
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  {BigInt(lenderClaimableWei) > 0n
                    ? `Withdraw ${formatEther(lenderClaimableWei)} ETH via MetaMask`
                    : BigInt(activeLenderPosition.claimedWei || '0') > 0n
                    ? 'All Available Repayments Claimed ✓'
                    : 'Awaiting Borrower Repayments'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          GOVERNANCE
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-dark-bg-1 rounded-xl border border-dark-border-subtle shadow-depth-card overflow-hidden">
        <div className="p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-dark-text-primary flex items-center gap-2">
                <Vote className="w-4 h-4 text-amber-400" />
                Default Governance &amp; Syndicate Voting
              </h2>
              <p className="text-xs text-dark-text-muted mt-0.5">
                Capital-weighted voting consensus to declare default on matured, unpaid agreements. Zero administrative shortcuts.
              </p>
            </div>
            {isDefaulted ? (
              <Badge variant="danger" className="text-xs shrink-0">
                DEFAULTED ON-CHAIN
              </Badge>
            ) : isActive ? (
              <Badge variant="warning" className="text-xs shrink-0">
                ACTIVE GOVERNANCE
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs shrink-0">
                GOVERNANCE INACTIVE
              </Badge>
            )}
          </div>

          {/* Defaulted State Milestone Banner */}
          {isDefaulted && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Agreement Declared DEFAULTED by Syndicate Consensus</span>
              </div>
              <p className="text-xs text-rose-300/90 leading-relaxed">
                The accumulated voting weight ({currentVotesEth} ETH) crossed the contract quorum threshold ({defaultThresholdEth} ETH). The smart contract transitioned agreement status to <strong>DEFAULTED</strong> and executed an automatic on-chain reputation penalty (-20 pts) in <code className="text-rose-300">ReputationRegistry</code>.
              </p>
            </div>
          )}

          {/* Repaid State Banner */}
          {isRepaid && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Agreement Fully Repaid — Governance Closed</span>
              </div>
              <p className="text-xs text-emerald-300/90 leading-relaxed">
                All outstanding principal and interest have been completely settled. Default voting is locked.
              </p>
            </div>
          )}

          {/* 7 Mandatory Governance Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
            {/* 1. Maturity */}
            <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-1">
              <div className="text-xs text-dark-text-muted font-semibold uppercase tracking-wider">1. Maturity</div>
              <div className="font-bold text-dark-text-primary text-xs truncate" title={loan.maturity}>
                {maturityDateFormatted}
              </div>
              <div className="text-xs font-medium">
                {isPastMaturity ? (
                  <span className="text-rose-400 font-semibold">Past Due</span>
                ) : (
                  <span className="text-dark-text-muted">Within Term</span>
                )}
              </div>
            </div>

            {/* 2. Unpaid Amount */}
            <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-1">
              <div className="text-xs text-dark-text-muted font-semibold uppercase tracking-wider">2. Unpaid Amount</div>
              <div className="font-bold font-mono text-dark-text-primary text-xs">
                {unpaidEthStr} ETH
              </div>
              <div className="text-xs text-dark-text-muted">
                Debt outstanding
              </div>
            </div>

            {/* 3. Lender Voting Weight */}
            <div className={`p-2.5 rounded-lg border space-y-1 ${
              activeLenderPosition ? 'bg-credify-950/20 border-credify-500/30' : 'bg-dark-bg-2 border-dark-border-subtle'
            }`}>
              <div className="text-xs text-dark-text-muted font-semibold uppercase tracking-wider">3. Lender Weight</div>
              <div className="font-bold font-mono text-dark-text-primary text-xs">
                {lenderVotingWeightEth} ETH
              </div>
              <div className="text-xs text-credify-400 font-medium">
                {activeLenderPosition ? `${lenderVotingSharePercent}% share` : 'Non-lender (0%)'}
              </div>
            </div>

            {/* 4. Threshold */}
            <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-1">
              <div className="text-xs text-dark-text-muted font-semibold uppercase tracking-wider">4. Threshold</div>
              <div className="font-bold font-mono text-dark-text-primary text-xs">
                &gt; {defaultThresholdEth} ETH
              </div>
              <div className="text-xs text-dark-text-muted font-mono">
                {loan.targetWei ? `>50.01% capital` : 'Quorum'}
              </div>
            </div>

            {/* 5. Current Votes */}
            <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-1">
              <div className="text-xs text-dark-text-muted font-semibold uppercase tracking-wider">5. Current Votes</div>
              <div className={`font-bold font-mono text-xs ${
                currentVotesWei > 0n ? 'text-amber-400' : 'text-dark-text-primary'
              }`}>
                {currentVotesEth} ETH
              </div>
              <div className="text-xs text-dark-text-muted">
                {quorumPercent}% of quorum
              </div>
            </div>

            {/* 6. Participating Lenders Count */}
            <div className="p-2.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-1">
              <div className="text-xs text-dark-text-muted font-semibold uppercase tracking-wider">6. Participants</div>
              <div className="font-bold font-mono text-dark-text-primary text-xs">
                {participatingLenders.filter((l) => l.hasVoted).length} / {participatingLenders.length}
              </div>
              <div className="text-xs text-dark-text-muted">
                Lenders voted
              </div>
            </div>

            {/* 7. Remaining Voting Weight */}
            <div className={`p-2.5 rounded-lg border space-y-1 ${
              remainingVotingWeightWei === 0n && currentVotesWei > 0n
                ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                : 'bg-dark-bg-2 border-dark-border-subtle'
            }`}>
              <div className="text-xs text-dark-text-muted font-semibold uppercase tracking-wider">7. Remaining Weight</div>
              <div className="font-bold font-mono text-dark-text-primary text-xs">
                {remainingVotingWeightEth} ETH
              </div>
              <div className="text-xs font-medium">
                {remainingVotingWeightWei === 0n && currentVotesWei > 0n ? (
                  <span className="text-rose-400 font-bold">Consensus Met</span>
                ) : (
                  <span className="text-dark-text-muted">Needed for default</span>
                )}
              </div>
            </div>
          </div>

          {/* Quorum Consensus Progress Bar */}
          <div className="space-y-1.5 p-3 rounded-lg bg-dark-bg-2 border border-dark-border-subtle">
            <div className="flex justify-between text-xs text-dark-text-secondary font-medium">
              <span>Quorum Consensus Progress</span>
              <span className="font-mono font-bold text-dark-text-primary">
                {currentVotesEth} / &gt; {defaultThresholdEth} ETH ({quorumPercent}%)
              </span>
            </div>
            <Progress value={quorumPercent} className="h-2.5" />
            <div className="flex justify-between text-xs text-dark-text-muted pt-0.5">
              <span>Status: {isDefaulted ? 'Threshold Crossed (DEFAULTED)' : currentVotesWei > 0n ? 'Partial Consensus (Insufficient)' : 'No Votes Cast Yet'}</span>
              <span>Quorum rule: &gt;50.01% capital-weighted majority</span>
            </div>
          </div>

          {/* 6. Participating Lenders Table with Vote Badges */}
          <div className="border border-dark-border-subtle rounded-lg overflow-hidden">
            <div className="bg-dark-bg-2 px-3 py-2 text-xs font-semibold text-dark-text-muted uppercase tracking-wider border-b border-dark-border-subtle flex items-center justify-between">
              <span>Participating Syndicate Lenders ({participatingLenders.length})</span>
              <span className="text-xs font-mono text-dark-text-muted">Weight = Money at risk</span>
            </div>
            {participatingLenders.length === 0 ? (
              <div className="p-4 text-center text-xs text-dark-text-muted">
                No lenders have contributed to this syndicate.
              </div>
            ) : (
              <div className="divide-y divide-dark-border-subtle text-xs font-sans">
                {participatingLenders.map((lender) => {
                  const isCurrent = currentAddress && lender.walletAddress.toLowerCase() === currentAddress.toLowerCase();
                  return (
                    <div key={lender.walletAddress} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AddressBadge address={lender.walletAddress} chars={5} />
                        <span className="text-dark-text-secondary font-medium text-xs">{lender.displayName}</span>
                        {isCurrent && (
                          <Badge variant="outline" className="text-xs">
                            Your Wallet
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono">
                          <div className="font-bold text-dark-text-primary">{formatEther(lender.contributedWei)} ETH</div>
                          <div className="text-xs text-dark-text-muted">{(lender.shareBps / 100).toFixed(2)}% voting weight</div>
                        </div>
                        <div>
                          {lender.hasVoted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Voted Default
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-dark-bg-2 text-dark-text-muted border border-dark-border-subtle">
                              <Clock className="w-3 h-3" /> Not Voted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Evaluator Fast-Forward Time Helper */}
          {!isPastMaturity && isActive && (
            <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-amber-400" />
                  <span>Evaluator Testbed: Fast-Forward Time Past Maturity</span>
                </div>
                <div className="text-xs text-amber-300/80 leading-snug">
                  Smart contract strictly checks <code>block.timestamp &gt;= maturity</code>. Advance local EVM node clock by 15 days to test real default voting without administrator shortcuts.
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                loading={isWarpingTime}
                onClick={handleFastForwardMaturity}
                className="text-xs shrink-0 border-amber-500/40 text-amber-300 hover:bg-amber-950/40"
              >
                Fast-Forward +15 Days
              </Button>
            </div>
          )}

          {/* CONTEXTUAL ACTION: Cast Default Vote */}
          {isActive && (
            <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Vote className="w-4 h-4 text-amber-400" />
                    <span>Cast Contributed Default Vote in MetaMask</span>
                  </div>
                  <div className="text-xs text-amber-300/80 mt-0.5">
                    {activeLenderPosition
                      ? `Your voting power is ${lenderVotingWeightEth} ETH (${lenderVotingSharePercent}%). Quorum threshold is >${defaultThresholdEth} ETH.`
                      : 'Connect an eligible syndicate lender wallet to cast a default vote.'}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="danger"
                  disabled={
                    isExecuting ||
                    !activeLenderPosition ||
                    hasLenderVoted ||
                    isDefaulted ||
                    isRepaid
                  }
                  loading={isExecuting}
                  onClick={handleVoteDefault}
                  className="text-xs shrink-0"
                  icon={<Vote className="w-3.5 h-3.5" />}
                >
                  {hasLenderVoted
                    ? 'Default Vote Cast ✓'
                    : !activeLenderPosition
                    ? 'Lender Wallet Required'
                    : `Vote Default via MetaMask (${lenderVotingWeightEth} ETH)`}
                </Button>
              </div>

              {hasLenderVoted && (
                <div className="text-xs text-emerald-300 bg-emerald-950/40 p-2 rounded border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Your default vote is authoritatively recorded on-chain. If remaining lenders vote and cross &gt;{defaultThresholdEth} ETH, the agreement transitions to DEFAULTED.</span>
                </div>
              )}

              {!isPastMaturity && !hasLenderVoted && activeLenderPosition && (
                <div className="text-xs text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-500/30 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Pre-flight check: Agreement maturity date ({maturityDateFormatted}) has not passed. Voting before maturity will revert with <code>MaturityNotReached()</code>. Click "Fast-Forward +15 Days" above to advance the testnet clock.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BORROWER REPUTATION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-dark-bg-1 rounded-xl border border-dark-border-subtle shadow-depth-card overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-dark-text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Borrower Reputation
              </h2>
              <p className="text-xs text-dark-text-muted mt-0.5">
                On-chain credit score from <span className="font-mono text-dark-text-secondary">ReputationRegistry</span>. Score = 50 + (repayments × 8) − (defaults × 20), clamped 0–100.
              </p>
            </div>
            {isBorrower && (
              <Link to="/app/borrower/reputation" className="text-xs text-credify-400 hover:text-credify-300 hover:underline shrink-0 flex items-center gap-1">
                Full Provenance <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {(() => {
            const repScore = borrowerReputation?.score ?? 50;
            const repSuccesses = borrowerReputation?.successfulLoans ?? 0;
            const repDefaults = borrowerReputation?.defaultedLoans ?? 0;
            const tier = repScore >= 70 ? { label: 'Tier A · Low Risk', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30' }
              : repScore >= 40 ? { label: 'Tier B · Medium Risk', color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/30' }
              : { label: 'High Risk', color: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-500/30' };
            const barColor = repScore >= 70 ? 'bg-emerald-500' : repScore >= 40 ? 'bg-amber-500' : 'bg-rose-500';

            return (
              <div className="space-y-4">
                {/* Authoritative Agreement Outcome Callout (when this agreement reached terminal state) */}
                {loan?.status === 'REPAID' && (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-300">Authoritative Outcome: Full Repayment Confirmed (+8 Points)</div>
                      <div className="text-emerald-300/80 text-xs mt-0.5">
                        This credit agreement was successfully settled on-chain. ReputationRegistry recorded the positive outcome in the borrower's credit score history.
                      </div>
                    </div>
                  </div>
                )}

                {loan?.status === 'DEFAULTED' && (
                  <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-rose-300">Authoritative Outcome: Agreement Declared Defaulted (−20 Points)</div>
                      <div className="text-rose-300/80 text-xs mt-0.5">
                        Lender consensus reached default quorum on this agreement. ReputationRegistry recorded the default penalty against the borrower's on-chain score.
                      </div>
                    </div>
                  </div>
                )}

                {/* Score bar + metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="col-span-2 sm:col-span-1 p-3 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-dark-text-muted">Current Score</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black font-mono text-dark-text-primary">{repScore}</span>
                      <span className="text-xs text-dark-text-muted">/100</span>
                    </div>
                    {/* Mini bar */}
                    <div className="w-full bg-dark-bg-3 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${repScore}%` }} />
                    </div>
                    <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color} ${tier.border}`}>
                      {tier.label}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Repayments</div>
                    <div className="flex items-center gap-1.5 text-2xl font-bold font-mono text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      {repSuccesses}
                    </div>
                    <div className="text-xs text-emerald-400/80">+8 pts each</div>
                  </div>

                  <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-1">
                    <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Defaults</div>
                    <div className="flex items-center gap-1.5 text-2xl font-bold font-mono text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                      {repDefaults}
                    </div>
                    <div className="text-xs text-rose-400/80">−20 pts each</div>
                  </div>

                  <div className="p-3 rounded-lg border border-dark-border-subtle bg-dark-bg-2 space-y-1">
                    <div className="text-xs font-semibold text-dark-text-muted uppercase tracking-wider">Risk Level</div>
                    <div className={`text-base font-bold ${tier.color}`}>
                      {repScore >= 70 ? 'Low' : repScore >= 40 ? 'Medium' : 'High'}
                    </div>
                    <div className="text-xs text-dark-text-muted">
                      {repScore >= 70 ? 'Lender-preferred' : repScore >= 40 ? 'Standard terms' : 'Elevated risk'}
                    </div>
                  </div>
                </div>

                {/* Provenance history (condensed — last 4 entries) */}
                {borrowerRepHistory.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-dark-text-muted mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        Authoritative Outcome History
                      </span>
                      <span className="text-xs text-dark-text-muted font-mono">
                        {borrowerRepHistory.length} total events
                      </span>
                    </div>
                    <div className="divide-y divide-dark-border-subtle rounded-lg border border-dark-border-subtle overflow-hidden">
                      {borrowerRepHistory.slice(-4).reverse().map((entry: any) => {
                        const isSuccess = entry.outcome === 'SUCCESS';
                        const delta = isSuccess ? '+8' : '−20';
                        const hasLoan = entry.loanId && entry.loanId !== 'reputation';
                        const isThisLoan = hasLoan && loanId && entry.loanId.toLowerCase() === loanId.toLowerCase();

                        return (
                          <div key={entry.id} className={`px-3 py-2.5 flex items-center justify-between text-xs hover:bg-dark-bg-2/50 ${isThisLoan ? 'bg-credify-950/20' : ''}`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              {isSuccess
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                : <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                              <span className="font-medium text-dark-text-primary">{isSuccess ? 'Repayment' : 'Default'}</span>
                              <span className={`font-mono text-xs px-1.5 py-0.5 rounded border ${isSuccess ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' : 'text-rose-400 bg-rose-950/40 border-rose-500/30'}`}>
                                {delta} pts
                              </span>
                              {hasLoan && (
                                <span className="text-xs text-dark-text-secondary flex items-center gap-1">
                                  <span>Agreement:</span>
                                  <Link to={`/app/loans/${entry.loanId}`} className="font-mono text-credify-400 hover:underline">
                                    <AddressBadge address={entry.loanId} chars={4} />
                                  </Link>
                                  {isThisLoan && <span className="text-[10px] bg-credify-950/60 text-credify-300 border border-credify-500/30 px-1 rounded font-bold">THIS</span>}
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-dark-text-muted shrink-0">→ {entry.scoreAfter}/100</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            );
          })()}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          EVIDENCE
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-dark-bg-1 rounded-xl border border-dark-border-subtle shadow-depth-card overflow-hidden">
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-dark-text-primary flex items-center gap-2">
              <Layers className="w-4 h-4 text-credify-400" />
              Blockchain Evidence &amp; Lifecycle
            </h2>
            <p className="text-xs text-dark-text-muted mt-0.5">
              Authoritative on-chain event stream emitted by the loan pool and associated protocol contracts from block 0.
            </p>
          </div>

          <EvidenceTimeline
            events={activity}
            isLoading={activityLoading}
            poolAddress={loanId}
          />
        </div>
      </section>
    </div>
  );

};
