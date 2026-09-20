import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useLoans, useLoanActivity } from '../../hooks/useCredify';
import { useContractAction } from '../../hooks/useContractAction';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  StatusBadge,
  AddressBadge,
  ProgressBar,
  AmountInput,
  TransactionState,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  MilestoneCelebration,
} from '../../components/ui';
import {
  formatEther,
  formatEtherNum,
  parseEtherToWei,
  formatApr,
  formatDate,
  timeAgo,
  truncateAddress,
} from '../../lib/utils';
import {
  TrendingUp,
  ArrowLeft,
  Coins,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Receipt,
  Clock,
  Sparkles,
  Percent,
} from 'lucide-react';

export const BorrowerRepaymentsPage: React.FC = () => {
  const { address, isVerified } = useIdentity();
  const { data: loans, isLoading: loansLoading, refetch: refetchLoans } = useLoans();

  const {
    isExecuting,
    txState,
    executeRepay,
    resetTxState,
  } = useContractAction();

  const activeLoans = React.useMemo(() => {
    if (!loans || !address) return [];
    const lower = address.toLowerCase();
    return loans.filter((l) => l.borrower.walletAddress.toLowerCase() === lower);
  }, [loans, address]);

  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [repayAmountEth, setRepayAmountEth] = useState('5.4');
  const [showMilestone, setShowMilestone] = useState(false);

  React.useEffect(() => {
    if (activeLoans.length > 0 && !selectedLoanId) {
      setSelectedLoanId(activeLoans[0].address);
    }
  }, [activeLoans, selectedLoanId]);

  const selectedLoan = activeLoans.find((l) => l.address === selectedLoanId) || activeLoans[0];
  const { data: activity = [], refetch: refetchActivity } = useLoanActivity(selectedLoan?.address);

  if (loansLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-dark-bg-3 animate-pulse rounded" />
        <div className="h-28 w-full bg-dark-bg-2 animate-pulse rounded-xl" />
        <div className="h-64 bg-dark-bg-2 animate-pulse rounded-xl" />
      </div>
    );
  }

  // Authoritative calculations from smart contract state
  const targetWeiNum = selectedLoan ? formatEtherNum(selectedLoan.targetWei) : 0;
  const totalRepayableNum = selectedLoan ? formatEtherNum(selectedLoan.totalRepayableWei) : 0;
  const interestNum = Math.max(0, totalRepayableNum - targetWeiNum);
  const totalRepaidNum = selectedLoan ? formatEtherNum(selectedLoan.totalRepaidWei) : 0;
  const remainingDebtNum = Math.max(0, totalRepayableNum - totalRepaidNum);
  const repaymentPercent = totalRepayableNum > 0 ? Math.min(100, Math.round((totalRepaidNum / totalRepayableNum) * 100)) : 0;

  // Filter on-chain repayment activity events
  const repaymentEvents = activity.filter(
    (e) => e.eventName === 'RepaymentReceived' || e.eventName === 'RepaymentMade'
  );

  // Connected borrower wallet check
  const isBorrowerConnected = Boolean(
    address &&
    selectedLoan &&
    selectedLoan.borrower.walletAddress.toLowerCase() === address.toLowerCase()
  );

  const parsedRepayNum = Math.max(0, Number(repayAmountEth) || 0);
  const isOverDebt = parsedRepayNum > remainingDebtNum + 0.000001;
  const isCompleteSettlement = parsedRepayNum >= remainingDebtNum && remainingDebtNum > 0;
  const resultingRemainingDebt = Math.max(0, remainingDebtNum - parsedRepayNum);

  const handleSetPreset = (fraction: number) => {
    if (remainingDebtNum <= 0) return;
    if (fraction === 1) {
      setRepayAmountEth(remainingDebtNum.toString());
    } else {
      const val = (remainingDebtNum * fraction).toFixed(2);
      setRepayAmountEth(val);
    }
  };

  const handleRepay = async () => {
    if (!selectedLoan || !repayAmountEth || parsedRepayNum <= 0 || isOverDebt) return;
    try {
      await executeRepay(selectedLoan.address, parseEtherToWei(repayAmountEth));
      await refetchLoans();
      await refetchActivity();
      setShowMilestone(true);
    } catch {
      // Handled inside useContractAction txState
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="space-y-2">
        <Link to="/app/borrower/overview" className="inline-flex items-center gap-1.5 text-xs text-dark-text-muted hover:text-dark-text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-dark-text-primary">
              Facility Repayments
            </h1>
            <p className="text-xs text-dark-text-secondary mt-0.5">
              Execute contract-governed debt repayments to return principal and fixed interest to syndicate lenders.
            </p>
          </div>

          {activeLoans.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-dark-text-muted">Agreement:</label>
              <select
                value={selectedLoanId}
                onChange={(e) => {
                  setSelectedLoanId(e.target.value);
                  setRepayAmountEth('5.4');
                }}
                className="text-xs p-2 rounded-lg border border-dark-border-default bg-dark-bg-2 text-dark-text-primary font-mono focus:outline-hidden focus:ring-1 focus:ring-brand-500"
              >
                {activeLoans.map((l) => (
                  <option key={l.address} value={l.address}>
                    {l.address.slice(0, 8)}... ({l.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {!selectedLoan ? (
        <Card className="border-dark-border-default bg-dark-bg-2">
          <CardContent className="py-12 text-center space-y-4">
            <Coins className="w-10 h-10 text-dark-text-muted mx-auto" />
            <div>
              <h3 className="text-base font-semibold text-dark-text-primary">No Active Repayment Obligations</h3>
              <p className="text-xs text-dark-text-secondary max-w-md mx-auto mt-1">
                You do not have any credit facilities requiring repayments at this time.
              </p>
            </div>
            <Link to="/app/borrower/agreements">
              <Button variant="secondary" size="sm">
                View Agreements
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Agreement Status Banner: Visual Anchor */}
          <div className="p-4 rounded-xl border border-dark-border-default bg-dark-bg-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-dark-text-primary text-sm">
                  {selectedLoan.borrower.displayName} Facility
                </span>
                <StatusBadge status={selectedLoan.status} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-dark-text-secondary font-mono">
                <span className="text-dark-text-muted">Contract:</span>
                <AddressBadge address={selectedLoan.address} digits={6} />
                <span className="text-dark-border-strong">•</span>
                <span className="text-dark-text-muted">Borrower:</span>
                <AddressBadge address={selectedLoan.borrower.walletAddress} digits={5} />
                <span className="text-dark-border-strong">•</span>
                <span className="text-dark-text-muted">Matures:</span>
                <span className="text-dark-text-primary">{formatDate(selectedLoan.maturity)}</span>
              </div>
            </div>

            <Link to={`/app/loans/${selectedLoan.address}`}>
              <Button variant="secondary" size="sm" className="text-xs">
                View Full Contract
              </Button>
            </Link>
          </div>

          {/* 5-Figure Financial Accounting Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* 1. Principal */}
            <div className="p-4 rounded-xl bg-dark-bg-2 border border-dark-border-default space-y-1">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-dark-text-muted">
                1. Principal
              </span>
              <div className="text-xl font-bold font-mono text-dark-text-primary">
                {targetWeiNum.toFixed(2)} ETH
              </div>
              <p className="text-[10px] text-dark-text-muted">Borrowed principal</p>
            </div>

            {/* 2. Interest */}
            <div className="p-4 rounded-xl bg-dark-bg-2 border border-dark-border-default space-y-1">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-dark-text-muted">
                2. Fixed Interest
              </span>
              <div className="text-xl font-bold font-mono text-dark-text-secondary">
                {interestNum.toFixed(2)} ETH
              </div>
              <p className="text-[10px] text-dark-text-muted font-mono">{formatApr(selectedLoan.aprBps)} APR</p>
            </div>

            {/* 3. Total Repayable */}
            <div className="p-4 rounded-xl bg-dark-bg-2 border border-dark-border-default space-y-1">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-dark-text-muted">
                3. Total Repayable
              </span>
              <div className="text-xl font-bold font-mono text-dark-text-primary">
                {totalRepayableNum.toFixed(2)} ETH
              </div>
              <p className="text-[10px] text-dark-text-muted">Principal + interest</p>
            </div>

            {/* 4. Amount Repaid */}
            <div className="p-4 rounded-xl bg-dark-bg-2 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400">
                4. Amount Repaid
              </span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {totalRepaidNum.toFixed(2)} ETH
              </div>
              <p className="text-[10px] text-dark-text-muted font-mono">{repaymentPercent}% satisfied</p>
            </div>

            {/* 5. Remaining Balance */}
            <div className={`p-4 rounded-xl border space-y-1 ${
              remainingDebtNum === 0
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-dark-bg-2 border-amber-500/30'
            }`}>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-400">
                5. Remaining Due
              </span>
              <div className={`text-xl font-bold font-mono ${
                remainingDebtNum === 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {remainingDebtNum.toFixed(2)} ETH
              </div>
              <p className="text-[10px] text-dark-text-muted">
                {remainingDebtNum === 0 ? 'Fully settled' : 'Outstanding obligation'}
              </p>
            </div>
          </div>

          {/* Repayment Progress Meter */}
          <Card className="border-dark-border-default bg-dark-bg-2">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-dark-text-primary">Cumulative Repayment Progress</span>
                <span className="font-mono text-dark-text-primary font-bold">
                  {totalRepaidNum.toFixed(2)} / {totalRepayableNum.toFixed(2)} ETH ({repaymentPercent}%)
                </span>
              </div>
              <ProgressBar value={repaymentPercent} variant={remainingDebtNum === 0 ? 'success' : 'amber'} className="h-2" />
              <div className="flex justify-between text-[11px] text-dark-text-muted font-mono">
                <span>Agreement maturity: {formatDate(selectedLoan.maturity)}</span>
                <span>
                  {selectedLoan.status === 'REPAID'
                    ? 'Agreement fully repaid on-chain'
                    : `${remainingDebtNum.toFixed(2)} ETH remaining balance`}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Verification Warning (if not borrower) */}
          {!isBorrowerConnected && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-amber-300">Borrower Wallet Connection Required</div>
                <p className="leading-relaxed">
                  The connected wallet (<code className="font-mono text-[11px] px-1 bg-dark-bg-0 text-amber-300 rounded">{truncateAddress(address || '')}</code>) is not the designated borrower for this agreement (<code className="font-mono text-[11px] px-1 bg-dark-bg-0 text-amber-300 rounded">{truncateAddress(selectedLoan.borrower.walletAddress)}</code>). Only the authorized borrower address can execute repayments under smart contract policy.
                </p>
              </div>
            </div>
          )}

          {/* Repayment Execution Card */}
          {selectedLoan.status === 'REPAID' ? (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-base font-semibold text-dark-text-primary">Agreement Fully Satisfied</h3>
                <p className="text-xs text-dark-text-secondary max-w-md mx-auto">
                  All principal and interest have been fully transferred to the loan pool contract. Syndicate lenders have been credited their entitled pro-rata shares, and borrower reputation was boosted in ReputationRegistry.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dark-border-default bg-dark-bg-2">
              <CardHeader className="border-b border-dark-border-subtle pb-3">
                <CardTitle className="text-sm font-semibold text-dark-text-primary">Submit On-Chain Repayment</CardTitle>
                <CardDescription className="text-xs text-dark-text-muted">
                  Send a partial or complete debt repayment directly to the pool contract from your connected borrower wallet.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-5">
                {/* Input with Quick Presets */}
                <div className="space-y-2">
                  <AmountInput
                    label="Repayment Amount"
                    value={repayAmountEth}
                    onChange={setRepayAmountEth}
                    balance={remainingDebtNum.toFixed(2)}
                    maxAmount={remainingDebtNum.toString()}
                    symbol="ETH"
                    placeholder="0.00"
                    disabled={selectedLoan.status !== 'ACTIVE' || !isBorrowerConnected}
                    error={isOverDebt ? `Amount exceeds remaining balance of ${remainingDebtNum.toFixed(2)} ETH` : undefined}
                  />

                  {/* Partial and Full Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono text-dark-text-muted mr-1">Quick Presets:</span>
                    <button
                      type="button"
                      disabled={selectedLoan.status !== 'ACTIVE' || !isBorrowerConnected}
                      onClick={() => handleSetPreset(0.25)}
                      className="text-[10px] font-mono px-2.5 py-1 rounded bg-dark-bg-3 hover:bg-dark-bg-4 text-dark-text-secondary transition-colors cursor-pointer disabled:opacity-40"
                    >
                      25% Partial
                    </button>
                    <button
                      type="button"
                      disabled={selectedLoan.status !== 'ACTIVE' || !isBorrowerConnected}
                      onClick={() => handleSetPreset(0.5)}
                      className="text-[10px] font-mono px-2.5 py-1 rounded bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      50% Partial ({(remainingDebtNum * 0.5).toFixed(2)} ETH)
                    </button>
                    <button
                      type="button"
                      disabled={selectedLoan.status !== 'ACTIVE' || !isBorrowerConnected}
                      onClick={() => handleSetPreset(0.75)}
                      className="text-[10px] font-mono px-2.5 py-1 rounded bg-dark-bg-3 hover:bg-dark-bg-4 text-dark-text-secondary transition-colors cursor-pointer disabled:opacity-40"
                    >
                      75% Partial
                    </button>
                    <button
                      type="button"
                      disabled={selectedLoan.status !== 'ACTIVE' || !isBorrowerConnected}
                      onClick={() => handleSetPreset(1)}
                      className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      100% Complete ({remainingDebtNum.toFixed(2)} ETH)
                    </button>
                  </div>
                </div>

                {/* Real-time Resulting Balance Preview */}
                {parsedRepayNum > 0 && !isOverDebt && (
                  <div className="p-3.5 rounded-lg border border-dark-border-subtle bg-dark-bg-1 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-dark-text-secondary">
                      <span>Resulting Remaining Debt:</span>
                      <span className="font-mono font-bold text-dark-text-primary">
                        {resultingRemainingDebt.toFixed(2)} ETH
                      </span>
                    </div>

                    <div className="text-[11px] text-dark-text-muted leading-relaxed">
                      {isCompleteSettlement ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Full Repayment: Smart contract will transition agreement status to <strong>REPAID</strong> and record a positive borrower outcome in ReputationRegistry (+8 pts).
                        </span>
                      ) : (
                        <span>
                          Partial Repayment: Smart contract will credit {parsedRepayNum.toFixed(2)} ETH, leaving {resultingRemainingDebt.toFixed(2)} ETH remaining. Agreement remains <strong>ACTIVE</strong> and syndicate lenders can immediately claim their pro-rata entitlement.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <Button
                  variant="primary"
                  className="w-full text-xs font-semibold py-2.5 shadow-dark-xs"
                  disabled={
                    selectedLoan.status !== 'ACTIVE' ||
                    !isBorrowerConnected ||
                    parsedRepayNum <= 0 ||
                    isOverDebt ||
                    isExecuting
                  }
                  onClick={handleRepay}
                  loading={isExecuting}
                  icon={<TrendingUp className="w-4 h-4" />}
                >
                  {isCompleteSettlement
                    ? `Sign Complete Repayment in MetaMask (${repayAmountEth} ETH)`
                    : `Sign Partial Repayment in MetaMask (${repayAmountEth} ETH)`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Repayment History Ledger */}
          <Card className="border-dark-border-default bg-dark-bg-2">
            <CardHeader className="border-b border-dark-border-subtle pb-3">
              <CardTitle className="text-sm font-semibold text-dark-text-primary">Repayment History Ledger</CardTitle>
              <CardDescription className="text-xs text-dark-text-muted">
                Authoritative on-chain record of debt service payments credited to this facility.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {repaymentEvents.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <Receipt className="w-8 h-8 text-dark-text-muted mx-auto" />
                  <div className="text-xs text-dark-text-muted font-mono">
                    No debt service repayments recorded yet for this agreement.
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Total Repaid Post-Tx</TableHead>
                      <TableHead>Block #</TableHead>
                      <TableHead>Transaction Hash</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repaymentEvents.map((evt) => {
                      const amountWei = evt.data?.amount || evt.data?.amountWei || '0';
                      const totalRepaidWei = evt.data?.totalRepaid || evt.data?.totalRepaidWei || '0';

                      return (
                        <TableRow key={evt.id}>
                          <TableCell className="font-mono font-bold text-emerald-400">
                            +{formatEther(amountWei)} ETH
                          </TableCell>
                          <TableCell className="font-mono font-semibold text-dark-text-primary">
                            {formatEther(totalRepaidWei)} ETH
                          </TableCell>
                          <TableCell className="font-mono text-dark-text-secondary">
                            #{evt.blockNumber}
                          </TableCell>
                          <TableCell>
                            <AddressBadge address={evt.transactionHash} digits={6} variant="mono" />
                          </TableCell>
                          <TableCell className="text-dark-text-muted text-[11px]">
                            {timeAgo(evt.timestamp)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              CONFIRMED
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Transaction Monitor */}
          {txState && (
            <TransactionState
              status={
                txState.step === 'preparing' || txState.step === 'awaiting_wallet' || txState.step === 'submitted'
                  ? 'broadcasting'
                  : txState.step === 'confirming'
                  ? 'confirming'
                  : txState.step === 'confirmed'
                  ? 'confirmed'
                  : txState.step === 'failed' || txState.step === 'rejected'
                  ? 'error'
                  : 'idle'
              }
              hash={txState.txHash}
              title={txState.title}
              description={txState.description}
              errorMessage={txState.error}
              onReset={resetTxState}
            />
          )}
        </div>
      )}

      {/* Milestone Celebration Modal */}
      {selectedLoan && (
        <MilestoneCelebration
          open={showMilestone && txState?.step === 'confirmed'}
          onClose={() => setShowMilestone(false)}
          type="REPAYMENT_COMPLETED"
          contractAddress={selectedLoan.address}
          txHash={txState?.txHash}
          amountEth={`${repayAmountEth} ETH`}
          reputationDelta={isCompleteSettlement ? 8 : undefined}
          primaryAction={{
            label: 'Dismiss',
            onClick: () => setShowMilestone(false),
          }}
        />
      )}
    </div>
  );
};
