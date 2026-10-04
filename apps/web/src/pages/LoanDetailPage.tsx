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
        <p className="text-xs text-slate-600 font-medium">
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
    if (!loanId || isBorrowerOfLoan) return;
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
          <Link to={breadcrumbLink} className="hover:text-slate-900 transition-colors font-semibold">
            {breadcrumbLabel}
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-800 font-medium">{loan.address}</span>
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
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Loan Activated On-Chain
              </span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-mono">
                100% Funded
              </span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              The {targetWeiNum.toFixed(2)} ETH funding target was reached. The smart contract automatically transitioned from <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-slate-900 font-semibold">FUNDING</code> to <code className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-800 font-bold">ACTIVE</code> via the <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-slate-900 font-semibold">LoanActivated</code> event.
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-950 tracking-tight">
                Credit Agreement {loan.address.slice(0, 10)}...
              </h1>
              <StatusBadge status={loan.status} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Contract:</span>
                <AddressBadge address={loan.address} chars={6} />
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5 font-sans">
                <span className="text-slate-500">Borrower:</span>
                <span className="font-bold text-slate-950">{loan.borrower.displayName}</span>
                <AddressBadge address={loan.borrower.walletAddress} chars={4} />
              </div>
              <span>·</span>
              <div className="flex items-center gap-1 text-emerald-700 font-semibold font-sans">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>KYC Verified</span>
              </div>
              <span>·</span>
              <Link
                to={`/console/contracts/${loan.address}`}
                className="inline-flex items-center gap-1 text-slate-900 hover:text-black font-sans font-semibold text-xs hover:underline"
                title="Inspect on-chain contract code and storage"
              >
                <Terminal className="w-3.5 h-3.5 text-yellow-600" />
                <span>Inspect Contract</span>
              </Link>
              <span>·</span>
              <Link
                to={`/console/trace?pool=${loan.address}`}
                className="inline-flex items-center gap-1 text-slate-900 hover:text-black font-sans font-semibold text-xs hover:underline"
                title="Trace end-to-end action lifecycle for this agreement"
              >
                <Binary className="w-3.5 h-3.5 text-yellow-600" />
                <span>Show Technical Evidence</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Principal Target</div>
              <div className="text-xl font-black text-slate-950 font-mono">
                {formatEther(loan.targetWei)} ETH
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden md:block" />
            <div className="text-right">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Fixed APR</div>
              <div className="text-xl font-black text-slate-950 font-mono">
                {formatApr(loan.aprBps)}
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle Progression Rail */}
        <div className="pt-2 border-t border-slate-200">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Agreement Lifecycle
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl border bg-slate-50/80 border-slate-200">
              <div className="flex items-center gap-1.5 font-bold text-slate-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Created</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Contract instantiated</div>
            </div>

            <div
              className={`p-2.5 rounded-xl border ${
                isFunding
                  ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                  : isActive || isRepaid || isDefaulted
                  ? 'bg-slate-50/80 border-slate-200'
                  : 'bg-slate-50/40 border-slate-200/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-slate-950">
                {isActive || isRepaid || isDefaulted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isFunding ? (
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
                <span>Funding</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 font-mono font-medium">
                {isFunding ? `${fundingPercent}% committed` : 'Fully funded'}
              </div>
            </div>

            <div
              className={`p-2.5 rounded-xl border ${
                isActive
                  ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                  : isRepaid || isDefaulted
                  ? 'bg-slate-50/80 border-slate-200'
                  : 'bg-slate-50/40 border-slate-200/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-slate-950">
                {isRepaid || isDefaulted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isActive ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
                <span>Active</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                {isActive ? 'Spending & repayment' : isFunding ? 'Awaiting funding' : 'Complete'}
              </div>
            </div>

            <div
              className={`p-2.5 rounded-xl border ${
                isRepaid
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : isDefaulted
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-slate-50/40 border-slate-200/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-slate-950">
                {isRepaid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isDefaulted ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
                <span>Settlement</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                {isRepaid ? '100% Repaid' : isDefaulted ? 'Defaulted' : 'Due ' + formatDate(loan.maturity)}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Agreement Terms (compact definition list) ─── */}
        <div className="pt-2 border-t border-slate-200">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-yellow-600" />
            Smart Contract Terms
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Principal</div>
              <div className="font-black text-slate-950 font-mono text-sm">{formatEther(loan.targetWei)} ETH</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Interest Rate</div>
              <div className="font-black text-slate-950 font-mono text-sm">{formatApr(loan.aprBps)}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Duration</div>
              <div className="font-black text-slate-950 font-mono text-sm">{formatDuration(loan.durationSeconds)}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Total Repayable</div>
              <div className="font-black text-slate-950 font-mono text-sm">{formatEther(loan.totalRepayableWei)} ETH</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Spend Limit</div>
              <div className="font-black text-slate-950 font-mono text-sm">{formatEther(loan.maxSpendWei)} ETH</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Default Quorum</div>
              <div className="font-black text-slate-950 font-mono text-sm">{formatEther(loan.defaultThresholdWei)} ETH</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          FUNDING
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-600" />
                Funding
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Capital contributions recorded by <code className="font-mono text-slate-800 font-semibold">contribute()</code>.
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-50 border border-yellow-300 text-xs font-mono font-bold text-slate-950">
                {formatEther(loan.contributedWei)} ETH of {formatEther(loan.targetWei)} ETH
              </span>
            </div>
          </div>

          {/* Funding Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-700 font-semibold">
              <span>Funding Progress</span>
              <span>{fundingPercent}%</span>
            </div>
            <Progress value={fundingPercent} className="h-2" />
            {isFunding && (
              <div className="text-xs text-slate-600 flex justify-between pt-1 font-mono">
                <span>Remaining capacity:</span>
                <span className="font-bold text-slate-950">{remainingFundingNum.toFixed(4)} ETH</span>
              </div>
            )}
          </div>

          {/* Syndicate Lenders Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              Syndicate Participants ({loan.lenders.length})
            </div>
            {loan.lenders.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No lenders have contributed to this agreement yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs font-sans">
                {loan.lenders.map((lender, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-2">
                      <AddressBadge address={lender.walletAddress} chars={5} />
                      {currentAddress && lender.walletAddress.toLowerCase() === currentAddress.toLowerCase() && (
                        <Badge variant="outline" className="text-xs">
                          Your Wallet
                        </Badge>
                      )}
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-slate-950">{formatEther(lender.contributedWei)} ETH</div>
                      <div className="text-xs text-slate-500">{(lender.shareBps / 100).toFixed(2)}% share</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Your Lender Position (inline, if connected wallet is a lender) */}
          {activeLenderPosition && (
            <div className="p-4 rounded-xl bg-yellow-50/70 border border-yellow-200/80 space-y-2">
              <div className="text-xs font-bold text-yellow-950 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-yellow-700" />
                <span>Your Position in This Syndicate</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-slate-600 font-medium">Contributed</div>
                  <div className="font-mono font-bold text-slate-950">{formatEther(activeLenderPosition.contributedWei)} ETH</div>
                </div>
                <div>
                  <div className="text-slate-600 font-medium">Share</div>
                  <div className="font-mono font-bold text-slate-950">{(activeLenderPosition.shareBps / 100).toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-slate-600 font-medium">Claimable</div>
                  <div className="font-mono font-bold text-emerald-700">{formatEther(lenderClaimableWei)} ETH</div>
                </div>
              </div>
            </div>
          )}

          {/* CONTEXTUAL ACTION: Contribute (if FUNDING) */}
          {isFunding && (
            isBorrowerOfLoan ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Borrower Counterparty Restriction</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-sans font-medium">
                  You are connected as the registered borrower for this agreement ({loan.borrower.displayName || 'Borrower'} &middot; <AddressBadge address={loan.borrower.walletAddress} chars={4} />). In syndicated credit protocols, borrowers are prohibited from lending into their own syndicate pool to preserve independent counterparty governance and prevent circular wash-funding.
                </p>
                <div className="pt-0.5 text-[11px] text-slate-600 font-medium">
                  To contribute capital as a lender, switch to a Lender persona in the account switcher or connect a verified lender wallet.
                </div>
              </div>
            ) : (
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-yellow-600" />
                  <span>Contribute to Loan Syndicate</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-mono font-medium">
                    Target: {targetWeiNum.toFixed(2)} ETH
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-900 font-mono font-bold">
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
                <span className="text-xs text-slate-600 font-medium">Quick Allocation:</span>
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleSetAllocationPercent(pct)}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 hover:border-yellow-400 hover:bg-yellow-50 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
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
                        ? 'border-rose-400 focus:ring-rose-400 text-rose-900 bg-rose-50'
                        : 'border-slate-200 focus:ring-yellow-400 bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400'
                    }`}
                    placeholder="Amount in ETH"
                  />
                  <button
                    type="button"
                    onClick={() => setContributeEth(remainingFundingNum.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-900 hover:bg-slate-200 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded cursor-pointer"
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
                <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded p-2 flex items-center justify-between font-medium">
                  <span>
                    Entered amount exceeds remaining pool capacity ({remainingFundingNum.toFixed(4)} ETH).
                  </span>
                  <button
                    type="button"
                    onClick={() => setContributeEth(remainingFundingNum.toString())}
                    className="underline font-bold hover:text-rose-900 ml-2 shrink-0 cursor-pointer"
                  >
                    Clamp to MAX ({remainingFundingNum.toFixed(4)} ETH)
                  </button>
                </div>
              )}

              {/* Real-time Contribution & Ownership Breakdown */}
              {contributeAmountNum > 0 && !isOverCapacity && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Contribution share of loan target:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {contributionSharePercent.toFixed(2)}% ({contributeAmountNum} / {targetWeiNum} ETH)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Your resulting syndicate ownership:</span>
                    <span className="font-mono font-bold text-yellow-800">
                      {resultingLenderSharePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Remaining pool capacity after confirmation:</span>
                    <span className="font-mono font-bold text-slate-950">
                      {remainingAfterContribution.toFixed(4)} ETH
                      {remainingAfterContribution === 0 && (
                        <span className="text-emerald-700 font-bold ml-1.5">
                          (Target reached → will activate loan on-chain)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
            )
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SPENDING
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Spending
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Borrower can only disburse funds directly to verified merchant allowlist.
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-50 border border-yellow-300 text-xs font-mono font-bold text-slate-950">
                {formatEther(loan.totalSpentWei)} ETH of {formatEther(loan.maxSpendWei)} ETH
              </span>
            </div>
          </div>

          {/* 5-Metric Spending Policy Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">1. Spending Cap</div>
              <div className="font-black font-mono text-slate-950 text-sm">{maxSpendNum.toFixed(4)} ETH</div>
              <div className="text-xs text-slate-500 font-medium">Total policy limit</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">2. Already Spent</div>
              <div className="font-black font-mono text-slate-700 text-sm">{totalSpentNum.toFixed(4)} ETH</div>
              <div className="text-xs text-slate-500 font-medium">Disbursed to date</div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5">
              <div className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider">3. Remaining Capacity</div>
              <div className="font-black font-mono text-emerald-700 text-sm">{remainingSpendCapacity.toFixed(4)} ETH</div>
              <div className="text-xs text-emerald-700 font-medium">Available room</div>
            </div>

            <div className="p-2.5 rounded-xl bg-yellow-50 border border-yellow-300 space-y-0.5">
              <div className="text-[11px] text-yellow-900 font-bold uppercase tracking-wider">4. Requested Amount</div>
              <div className="font-black font-mono text-slate-950 text-sm">
                {requestedDisburseNum > 0 ? requestedDisburseNum.toFixed(4) : '0.0000'} ETH
              </div>
              <div className="text-xs text-slate-600 font-medium">Pending disburse</div>
            </div>

            <div className={`p-2.5 rounded-xl border space-y-0.5 ${
              isOverspendDisburse
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                <span>5. Resulting</span>
                {isOverspendDisburse ? (
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                )}
              </div>
              <div className={`font-black font-mono text-sm ${isOverspendDisburse ? 'text-rose-700' : 'text-emerald-700'}`}>
                {isOverspendDisburse
                  ? `-${Math.abs(resultingSpendCapacity).toFixed(4)} ETH`
                  : `${resultingSpendCapacity.toFixed(4)} ETH`}
              </div>
              <div className="text-xs opacity-80 font-medium">
                {isOverspendDisburse ? 'Limit exceeded' : 'Post-tx remaining'}
              </div>
            </div>
          </div>

          {/* Spending Progress */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-slate-700 font-semibold">
              <span>Spending Limit Utilization</span>
              <span>{spendPercent}%</span>
            </div>
            <Progress value={spendPercent} className="h-2" />
          </div>

          {/* Approved Merchant Allowlist */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              Approved Supplier Allowlist ({loan.merchants.length})
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {loan.merchants.map((merchantAddr, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-2 font-mono">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    <AddressBadge address={merchantAddr} chars={6} />
                  </div>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full text-xs">
                    <ShieldCheck className="w-3 h-3" />
                    Allowlisted
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Drawdown Ledger */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              Drawdown Ledger ({drawdownEvents.length})
            </div>
            {drawdownEvents.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                No disbursements executed yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs font-sans">
                {drawdownEvents.map((evt) => (
                  <div key={evt.id} className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div>
                      <div className="font-bold text-slate-950">{evt.summary}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                        <span>Block #{evt.blockNumber}</span>
                        <span>·</span>
                        <span>{timeAgo(evt.timestamp)}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      {evt.data?.amountWei && (
                        <div className="font-bold text-slate-950">-{formatEther(evt.data.amountWei)} ETH</div>
                      )}
                      <div className="text-xs text-slate-500">
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
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Disburse Funds to Whitelisted Supplier</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTestUnauthorizedSpend(!isTestUnauthorizedSpend)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 hover:text-yellow-800 cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>{isTestUnauthorizedSpend ? 'Select Approved Supplier' : 'Test Non-Allowlisted Supplier (Evaluator)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isTestUnauthorizedSpend ? 'Unauthorized Destination Address (Evaluator)' : 'Select Approved Supplier'}
                  </label>
                  {!isTestUnauthorizedSpend ? (
                    <select
                      value={spendMerchant || (loan.merchants.length > 0 ? loan.merchants[0] : '')}
                      onChange={(e) => setSpendMerchant(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono"
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
                      className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-amber-50 font-mono text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category</label>
                  <input
                    type="text"
                    value={spendCategory}
                    onChange={(e) => setSpendCategory(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
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
                          ? 'border-rose-300 bg-rose-50 text-rose-900 focus:ring-rose-500'
                          : 'border-slate-200 bg-slate-50 text-slate-900 focus:ring-emerald-500 placeholder:text-slate-400'
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
                    className="text-xs shrink-0"
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
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 cursor-pointer"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpendEth((remainingSpendCapacity * 0.50).toFixed(2))}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 cursor-pointer"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpendEth((remainingSpendCapacity * 0.75).toFixed(2))}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 cursor-pointer"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpendEth(remainingSpendCapacity.toString())}
                    className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer"
                  >
                    MAX
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpendEth((remainingSpendCapacity + 1.0).toFixed(2))}
                    className="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 cursor-pointer"
                    title="Set amount to remaining capacity + 1.0 ETH to verify SpendLimitExceeded contract rejection"
                  >
                    🧪 Test Overspend (+1 ETH)
                  </button>
                </div>
              </div>

              {/* Real-Time Contract Warnings */}
              {isOverspendDisburse && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-snug">
                    <strong>Overspending Rejection:</strong> Requested amount ({requestedDisburseNum} ETH) exceeds remaining capacity ({remainingSpendCapacity.toFixed(4)} ETH). The smart contract will revert with <code className="bg-white px-1 py-0.5 rounded font-mono text-xs text-rose-800 border border-rose-200 font-bold">SpendLimitExceeded</code>.
                  </div>
                </div>
              )}

              {!isApprovedDisburseMerchant && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-snug">
                    <strong>Unauthorized Supplier Rejection:</strong> Recipient <code className="bg-white px-1 py-0.5 rounded font-mono text-xs text-amber-800 border border-amber-200 font-bold">{activeDisburseMerchant}</code> is not on the agreement's allowlist. The smart contract will revert with <code className="bg-white px-1 py-0.5 rounded font-mono text-xs text-amber-800 border border-amber-200 font-bold">MerchantNotApproved()</code>.
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
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Repayment
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Repayment balance is held in pool contract for pro-rata pull claims by lenders.
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-50 border border-yellow-300 text-xs font-mono font-bold text-slate-950">
                {formatEther(loan.totalRepaidWei)} ETH of {formatEther(loan.totalRepayableWei)} ETH
              </span>
            </div>
          </div>

          {/* 5-Metric Repayment Schedule Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">1. Principal</div>
              <div className="font-black font-mono text-slate-950 text-sm">{formatEther(loan.targetWei)} ETH</div>
              <div className="text-xs text-slate-500 font-medium">Target borrowed</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">2. Fixed Interest</div>
              <div className="font-black font-mono text-slate-700 text-sm">
                {(formatEtherNum(loan.totalRepayableWei) - formatEtherNum(loan.targetWei)).toFixed(4)} ETH
              </div>
              <div className="text-xs text-slate-500 font-mono font-medium">{formatApr(loan.aprBps)} APR</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">3. Total Repayable</div>
              <div className="font-black font-mono text-slate-950 text-sm">{formatEther(loan.totalRepayableWei)} ETH</div>
              <div className="text-xs text-slate-500 font-medium">Principal + interest</div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5">
              <div className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider">4. Amount Repaid</div>
              <div className="font-black font-mono text-emerald-700 text-sm">{formatEther(loan.totalRepaidWei)} ETH</div>
              <div className="text-xs text-emerald-700 font-medium">{repaymentPercent}% satisfied</div>
            </div>

            <div className={`p-2.5 rounded-xl border space-y-0.5 ${
              remainingDebtNum === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <div className="text-[11px] font-semibold uppercase tracking-wider">5. Remaining Debt</div>
              <div className={`font-black font-mono text-sm ${
                remainingDebtNum === 0 ? 'text-emerald-700' : 'text-blue-700'
              }`}>
                {remainingDebtNum.toFixed(4)} ETH
              </div>
              <div className="text-xs opacity-80 font-medium">
                {remainingDebtNum === 0 ? 'Fully settled' : 'Outstanding balance'}
              </div>
            </div>
          </div>

          {/* Repayment Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-700 font-semibold">
              <span>Repayment Progress</span>
              <span>{repaymentPercent}%</span>
            </div>
            <Progress value={repaymentPercent} className="h-2" />
            <div className="text-xs text-slate-600 flex justify-between pt-1 font-mono">
              <span>Remaining outstanding debt:</span>
              <span className="font-bold text-slate-950">{remainingDebtNum.toFixed(4)} ETH</span>
            </div>
          </div>

          {/* Repayment Ledger */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              Repayments Ledger ({repaymentEvents.length})
            </div>
            {repaymentEvents.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                No debt repayments recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs font-sans">
                {repaymentEvents.map((evt) => (
                  <div key={evt.id} className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div>
                      <div className="font-bold text-slate-950 font-mono">
                        {evt.summary}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                        <span>Block #{evt.blockNumber}</span>
                        <span>·</span>
                        <span>{timeAgo(evt.timestamp)}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      {evt.data?.amountWei && (
                        <div className="font-bold text-slate-950">+{formatEther(evt.data.amountWei)} ETH</div>
                      )}
                      <div className="text-xs text-slate-500">
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
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
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
                      className="w-full text-xs p-2.5 pr-12 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-900 font-mono placeholder:text-slate-400"
                      placeholder="Repayment in ETH"
                    />
                    <button
                      type="button"
                      onClick={() => setRepayEth(remainingDebtNum.toString())}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-900 hover:bg-slate-200 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded cursor-pointer"
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
                    className="text-xs shrink-0"
                  >
                    Repay via Contract
                  </Button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setRepayEth((remainingDebtNum * 0.25).toFixed(4))}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 cursor-pointer"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayEth((remainingDebtNum * 0.50).toFixed(4))}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer"
                  >
                    50% Partial ({(remainingDebtNum * 0.50).toFixed(2)} ETH)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayEth((remainingDebtNum * 0.75).toFixed(4))}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 cursor-pointer"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayEth(remainingDebtNum.toString())}
                    className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer"
                  >
                    100% Full Debt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTEXTUAL ACTION: Claim Repayment (for syndicate lenders) */}
          {activeLenderPosition && (
            <div className="p-4 rounded-xl bg-yellow-50/70 border border-yellow-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-yellow-700" />
                    <span>Lender Pro-Rata Repayment Claim</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 font-medium">
                    Your {(activeLenderPosition.shareBps / 100).toFixed(2)}% syndicate share entitles you to pull-claim proportional debt repayments.
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs text-slate-500 font-medium">Claimable Balance</div>
                  <div className={`text-base font-bold ${
                    BigInt(lenderClaimableWei) > 0n ? 'text-emerald-700' : 'text-slate-500'
                  }`}>
                    {formatEther(lenderClaimableWei)} ETH
                  </div>
                </div>
              </div>

              {/* 5-Metric Pro-Rata Claim Accounting Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5">
                  <div className="text-xs text-slate-500 font-medium uppercase">1. Contribution</div>
                  <div className="font-bold font-mono text-slate-900 text-sm">
                    {formatEther(activeLenderPosition.contributedWei)} ETH
                  </div>
                  <div className="text-xs text-yellow-800 font-bold font-mono">
                    {(activeLenderPosition.shareBps / 100).toFixed(2)}% share
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5">
                  <div className="text-xs text-slate-500 font-medium uppercase">2. Total Contributed</div>
                  <div className="font-bold font-mono text-slate-700 text-sm">
                    {formatEther(loan.contributedWei)} ETH
                  </div>
                  <div className="text-xs text-slate-500">Pool target</div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5">
                  <div className="text-xs text-slate-500 font-medium uppercase">3. Total Repaid</div>
                  <div className="font-bold font-mono text-slate-700 text-sm">
                    {formatEther(loan.totalRepaidWei)} ETH
                  </div>
                  <div className="text-xs text-slate-500">
                    of {formatEther(loan.totalRepayableWei)} ETH
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5">
                  <div className="text-xs text-slate-500 font-medium uppercase">4. Claimed Amount</div>
                  <div className="font-bold font-mono text-slate-700 text-sm">
                    {formatEther(activeLenderPosition.claimedWei || '0')} ETH
                  </div>
                  <div className="text-xs text-slate-500">Already withdrawn</div>
                </div>

                <div className={`p-2.5 rounded-lg border space-y-0.5 ${
                  BigInt(lenderClaimableWei) > 0n
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}>
                  <div className="text-xs font-semibold uppercase">5. Currently Claimable</div>
                  <div className={`font-bold font-mono text-sm ${
                    BigInt(lenderClaimableWei) > 0n ? 'text-emerald-700' : 'text-slate-500'
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
                  className="text-xs"
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
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                <Vote className="w-4 h-4 text-amber-600" />
                Default Governance &amp; Syndicate Voting
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
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
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Agreement Declared DEFAULTED by Syndicate Consensus</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed font-medium">
                The accumulated voting weight ({currentVotesEth} ETH) crossed the contract quorum threshold ({defaultThresholdEth} ETH). The smart contract transitioned agreement status to <strong>DEFAULTED</strong> and executed an automatic on-chain reputation penalty (-20 pts) in <code className="text-rose-900 bg-rose-100 px-1 py-0.5 rounded font-mono font-bold">ReputationRegistry</code>.
              </p>
            </div>
          )}

          {/* Repaid State Banner */}
          {isRepaid && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Agreement Fully Repaid — Governance Closed</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                All outstanding principal and interest have been completely settled. Default voting is locked.
              </p>
            </div>
          )}

          {/* 7 Mandatory Governance Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
            {/* 1. Maturity */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">1. Maturity</div>
              <div className="font-bold text-slate-950 text-xs truncate" title={loan.maturity}>
                {maturityDateFormatted}
              </div>
              <div className="text-xs font-medium">
                {isPastMaturity ? (
                  <span className="text-rose-700 font-bold">Past Due</span>
                ) : (
                  <span className="text-slate-500">Within Term</span>
                )}
              </div>
            </div>

            {/* 2. Unpaid Amount */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">2. Unpaid Amount</div>
              <div className="font-black font-mono text-slate-950 text-xs">
                {unpaidEthStr} ETH
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Debt outstanding
              </div>
            </div>

            {/* 3. Lender Voting Weight */}
            <div className={`p-2.5 rounded-xl border space-y-1 ${
              activeLenderPosition ? 'bg-yellow-50/80 border-yellow-300' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">3. Lender Weight</div>
              <div className="font-black font-mono text-slate-950 text-xs">
                {lenderVotingWeightEth} ETH
              </div>
              <div className="text-xs text-yellow-800 font-semibold">
                {activeLenderPosition ? `${lenderVotingSharePercent}% share` : 'Non-lender (0%)'}
              </div>
            </div>

            {/* 4. Threshold */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">4. Threshold</div>
              <div className="font-black font-mono text-slate-950 text-xs">
                &gt; {defaultThresholdEth} ETH
              </div>
              <div className="text-xs text-slate-500 font-mono font-medium">
                {loan.targetWei ? `>50.01% capital` : 'Quorum'}
              </div>
            </div>

            {/* 5. Current Votes */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">5. Current Votes</div>
              <div className={`font-black font-mono text-xs ${
                currentVotesWei > 0n ? 'text-amber-700' : 'text-slate-950'
              }`}>
                {currentVotesEth} ETH
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {quorumPercent}% of quorum
              </div>
            </div>

            {/* 6. Participating Lenders Count */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">6. Participants</div>
              <div className="font-black font-mono text-slate-950 text-xs">
                {participatingLenders.filter((l) => l.hasVoted).length} / {participatingLenders.length}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Lenders voted
              </div>
            </div>

            {/* 7. Remaining Voting Weight */}
            <div className={`p-2.5 rounded-xl border space-y-1 ${
              remainingVotingWeightWei === 0n && currentVotesWei > 0n
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">7. Remaining Weight</div>
              <div className="font-black font-mono text-slate-950 text-xs">
                {remainingVotingWeightEth} ETH
              </div>
              <div className="text-xs font-medium">
                {remainingVotingWeightWei === 0n && currentVotesWei > 0n ? (
                  <span className="text-rose-700 font-bold">Consensus Met</span>
                ) : (
                  <span className="text-slate-500">Needed for default</span>
                )}
              </div>
            </div>
          </div>

          {/* Quorum Consensus Progress Bar */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between text-xs text-slate-700 font-semibold">
              <span>Quorum Consensus Progress</span>
              <span className="font-mono font-bold text-slate-950">
                {currentVotesEth} / &gt; {defaultThresholdEth} ETH ({quorumPercent}%)
              </span>
            </div>
            <Progress value={quorumPercent} className="h-2.5" />
            <div className="flex justify-between text-xs text-slate-500 pt-0.5">
              <span>Status: {isDefaulted ? 'Threshold Crossed (DEFAULTED)' : currentVotesWei > 0n ? 'Partial Consensus (Insufficient)' : 'No Votes Cast Yet'}</span>
              <span>Quorum rule: &gt;50.01% capital-weighted majority</span>
            </div>
          </div>

          {/* 6. Participating Lenders Table with Vote Badges */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 flex items-center justify-between">
              <span>Participating Syndicate Lenders ({participatingLenders.length})</span>
              <span className="text-xs font-mono text-slate-500">Weight = Money at risk</span>
            </div>
            {participatingLenders.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                No lenders have contributed to this syndicate.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs font-sans">
                {participatingLenders.map((lender) => {
                  const isCurrent = currentAddress && lender.walletAddress.toLowerCase() === currentAddress.toLowerCase();
                  return (
                    <div key={lender.walletAddress} className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-2">
                        <AddressBadge address={lender.walletAddress} chars={5} />
                        <span className="text-slate-700 font-semibold text-xs">{lender.displayName}</span>
                        {isCurrent && (
                          <Badge variant="outline" className="text-xs">
                            Your Wallet
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono">
                          <div className="font-bold text-slate-950">{formatEther(lender.contributedWei)} ETH</div>
                          <div className="text-xs text-slate-500">{(lender.shareBps / 100).toFixed(2)}% voting weight</div>
                        </div>
                        <div>
                          {lender.hasVoted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> Voted Default
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
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
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-amber-600" />
                  <span>Evaluator Testbed: Fast-Forward Time Past Maturity</span>
                </div>
                <div className="text-xs text-amber-800 leading-snug font-medium">
                  Smart contract strictly checks <code>block.timestamp &gt;= maturity</code>. Advance local EVM node clock by 15 days to test real default voting without administrator shortcuts.
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                loading={isWarpingTime}
                onClick={handleFastForwardMaturity}
                className="text-xs shrink-0 border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 font-semibold"
              >
                Fast-Forward +15 Days
              </Button>
            </div>
          )}

          {/* CONTEXTUAL ACTION: Cast Default Vote */}
          {isActive && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Vote className="w-4 h-4 text-amber-500" />
                    <span>Cast Contributed Default Vote in MetaMask</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 font-medium">
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
                <div className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Your default vote is authoritatively recorded on-chain. If remaining lenders vote and cross &gt;{defaultThresholdEth} ETH, the agreement transitions to DEFAULTED.</span>
                </div>
              )}

              {!isPastMaturity && !hasLenderVoted && activeLenderPosition && (
                <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-start gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
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
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Borrower Reputation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                On-chain credit score from <span className="font-mono text-slate-800 font-semibold">ReputationRegistry</span>. Score = 50 + (repayments × 8) − (defaults × 20), clamped 0–100.
              </p>
            </div>
            {isBorrower && (
              <Link to="/app/borrower/reputation" className="text-xs text-yellow-700 hover:text-yellow-800 hover:underline shrink-0 flex items-center gap-1 font-semibold">
                Full Provenance <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {(() => {
            const repScore = borrowerReputation?.score ?? 50;
            const repSuccesses = borrowerReputation?.successfulLoans ?? 0;
            const repDefaults = borrowerReputation?.defaultedLoans ?? 0;
            const tier = repScore >= 70 ? { label: 'Tier A · Low Risk', color: 'text-emerald-800', bg: 'bg-emerald-100', border: 'border-emerald-300' }
              : repScore >= 40 ? { label: 'Tier B · Medium Risk', color: 'text-amber-800', bg: 'bg-amber-100', border: 'border-amber-300' }
              : { label: 'High Risk', color: 'text-rose-800', bg: 'bg-rose-100', border: 'border-rose-300' };
            const barColor = repScore >= 70 ? 'bg-emerald-500' : repScore >= 40 ? 'bg-amber-500' : 'bg-rose-500';

            return (
              <div className="space-y-4">
                {/* Authoritative Agreement Outcome Callout (when this agreement reached terminal state) */}
                {loan?.status === 'REPAID' && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-900">Authoritative Outcome: Full Repayment Confirmed (+8 Points)</div>
                      <div className="text-emerald-800 text-xs mt-0.5 font-medium">
                        This credit agreement was successfully settled on-chain. ReputationRegistry recorded the positive outcome in the borrower's credit score history.
                      </div>
                    </div>
                  </div>
                )}

                {loan?.status === 'DEFAULTED' && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-rose-900">Authoritative Outcome: Agreement Declared Defaulted (−20 Points)</div>
                      <div className="text-rose-800 text-xs mt-0.5 font-medium">
                        Lender consensus reached default quorum on this agreement. ReputationRegistry recorded the default penalty against the borrower's on-chain score.
                      </div>
                    </div>
                  </div>
                )}

                {/* Score bar + metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current Score</div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black font-mono text-slate-900">{repScore}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide">
                        / 100 max
                      </span>
                    </div>
                    {/* Mini bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${repScore}%` }} />
                    </div>
                    <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color} ${tier.border}`}>
                      {tier.label}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Repayments</div>
                    <div className="flex items-center gap-1.5 text-2xl font-black font-mono text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      {repSuccesses}
                    </div>
                    <div className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block">+8 pts each</div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                    <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Defaults</div>
                    <div className="flex items-center gap-1.5 text-2xl font-black font-mono text-rose-700">
                      <AlertTriangle className="w-4 h-4" />
                      {repDefaults}
                    </div>
                    <div className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 inline-block">−20 pts each</div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Risk Level</div>
                    <div className={`text-base font-bold ${tier.color}`}>
                      {repScore >= 70 ? 'Low' : repScore >= 40 ? 'Medium' : 'High'}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      {repScore >= 70 ? 'Lender-preferred' : repScore >= 40 ? 'Standard terms' : 'Elevated risk'}
                    </div>
                  </div>
                </div>

                {/* Provenance history (condensed — last 4 entries) */}
                {borrowerRepHistory.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-yellow-600" />
                        Authoritative Outcome History
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {borrowerRepHistory.length} total events
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
                      {borrowerRepHistory.slice(-4).reverse().map((entry: any) => {
                        const isSuccess = entry.outcome === 'SUCCESS';
                        const delta = isSuccess ? '+8' : '−20';
                        const hasLoan = entry.loanId && entry.loanId !== 'reputation';
                        const isThisLoan = hasLoan && loanId && entry.loanId.toLowerCase() === loanId.toLowerCase();

                        return (
                          <div key={entry.id} className={`px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors ${isThisLoan ? 'bg-yellow-50/50' : ''}`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              {isSuccess
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                : <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                              <span className="font-bold text-slate-950">{isSuccess ? 'Repayment' : 'Default'}</span>
                              <span className={`font-mono text-xs px-2 py-0.5 rounded-full font-bold border ${isSuccess ? 'text-emerald-800 bg-emerald-100 border-emerald-300' : 'text-rose-800 bg-rose-100 border-rose-300'}`}>
                                {delta} pts
                              </span>
                              {hasLoan && (
                                <span className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                                  <span>Agreement:</span>
                                  <Link to={`/app/loans/${entry.loanId}`} className="font-mono text-yellow-700 hover:text-yellow-800 font-semibold hover:underline">
                                    <AddressBadge address={entry.loanId} chars={4} />
                                  </Link>
                                  {isThisLoan && <span className="text-[10px] bg-yellow-100 text-yellow-900 border border-yellow-300 px-1.5 rounded font-bold">THIS</span>}
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-slate-600 font-bold shrink-0">→ {entry.scoreAfter}/100</span>
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
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
              <Layers className="w-4 h-4 text-yellow-600" />
              Blockchain Evidence &amp; Lifecycle
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
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
