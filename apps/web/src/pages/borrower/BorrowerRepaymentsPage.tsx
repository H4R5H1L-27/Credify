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
  ShieldAlert,
  CheckCircle2,
  Receipt,
  Sparkles,
} from 'lucide-react';

export const BorrowerRepaymentsPage: React.FC = () => {
  const { address } = useIdentity();
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
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
        <div className="h-28 w-full bg-slate-200 animate-pulse rounded-2xl" />
        <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
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
        <Link to="/app/borrower/overview" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              Facility Repayments
            </h1>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Execute contract-governed debt repayments to return principal and fixed interest to syndicate lenders.
            </p>
          </div>

          {activeLoans.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono font-bold text-slate-600">Agreement:</label>
              <select
                value={selectedLoanId}
                onChange={(e) => {
                  setSelectedLoanId(e.target.value);
                  setRepayAmountEth('5.4');
                }}
                className="text-xs p-2 rounded-xl border border-slate-300 bg-white text-slate-950 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300"
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
        <Card className="border-slate-200 bg-white rounded-2xl shadow-xs">
          <CardContent className="py-12 text-center space-y-4">
            <Coins className="w-10 h-10 text-slate-400 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-950">No Active Repayment Obligations</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 font-medium">
                You do not have any credit facilities requiring repayments at this time.
              </p>
            </div>
            <Link to="/app/borrower/agreements">
              <Button variant="secondary" size="sm" className="font-bold">
                View Agreements
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Agreement Status Banner: Visual Anchor */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-slate-950 text-base">
                  {selectedLoan.borrower.displayName} Facility
                </span>
                <StatusBadge status={selectedLoan.status} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 font-mono">
                <span className="font-bold text-slate-500">Contract:</span>
                <AddressBadge address={selectedLoan.address} digits={6} />
                <span className="text-slate-300">•</span>
                <span className="font-bold text-slate-500">Borrower:</span>
                <AddressBadge address={selectedLoan.borrower.walletAddress} digits={5} />
                <span className="text-slate-300">•</span>
                <span className="font-bold text-slate-500">Matures:</span>
                <span className="text-slate-950 font-bold">{formatDate(selectedLoan.maturity)}</span>
              </div>
            </div>

            <Link to={`/app/loans/${selectedLoan.address}`}>
              <Button variant="secondary" size="sm" className="text-xs font-bold bg-white border border-slate-200 text-slate-900 hover:bg-slate-50">
                View Full Contract
              </Button>
            </Link>
          </div>

          {/* 5-Figure Financial Accounting Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* 1. Principal */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                1. Principal
              </span>
              <div className="text-xl font-bold font-mono text-slate-950">
                {targetWeiNum.toFixed(2)} ETH
              </div>
              <p className="text-xs text-slate-500 font-medium">Borrowed principal</p>
            </div>

            {/* 2. Interest */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                2. Fixed Interest
              </span>
              <div className="text-xl font-bold font-mono text-slate-950">
                {interestNum.toFixed(2)} ETH
              </div>
              <p className="text-xs text-slate-500 font-mono font-medium">{formatApr(selectedLoan.aprBps)} APR</p>
            </div>

            {/* 3. Total Repayable */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                3. Total Repayable
              </span>
              <div className="text-xl font-bold font-mono text-slate-950">
                {totalRepayableNum.toFixed(2)} ETH
              </div>
              <p className="text-xs text-slate-500 font-medium">Principal + interest</p>
            </div>

            {/* 4. Amount Repaid */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-900">
                4. Amount Repaid
              </span>
              <div className="text-xl font-bold font-mono text-emerald-950">
                {totalRepaidNum.toFixed(2)} ETH
              </div>
              <p className="text-xs text-emerald-800 font-mono font-bold">{repaymentPercent}% satisfied</p>
            </div>

            {/* 5. Remaining Balance */}
            <div className={`p-4 rounded-xl border space-y-1 ${
              remainingDebtNum === 0
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-yellow-50 border-yellow-300'
            }`}>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-yellow-950">
                5. Remaining Due
              </span>
              <div className={`text-xl font-bold font-mono ${
                remainingDebtNum === 0 ? 'text-emerald-900' : 'text-slate-950'
              }`}>
                {remainingDebtNum.toFixed(2)} ETH
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {remainingDebtNum === 0 ? 'Fully settled' : 'Outstanding obligation'}
              </p>
            </div>
          </div>

          {/* Repayment Progress Meter */}
          <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-950 text-sm">Cumulative Repayment Progress</span>
                <span className="font-mono text-slate-950 font-bold text-sm">
                  {totalRepaidNum.toFixed(2)} / {totalRepayableNum.toFixed(2)} ETH ({repaymentPercent}%)
                </span>
              </div>
              <ProgressBar value={repaymentPercent} variant={remainingDebtNum === 0 ? 'success' : 'primary'} className="h-2.5" />
              <div className="flex justify-between text-[11px] text-slate-600 font-mono font-medium">
                <span>Agreement maturity: {formatDate(selectedLoan.maturity)}</span>
                <span className="font-bold text-slate-900">
                  {selectedLoan.status === 'REPAID'
                    ? 'Agreement fully repaid on-chain'
                    : `${remainingDebtNum.toFixed(2)} ETH remaining balance`}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Verification Warning (if not borrower) */}
          {!isBorrowerConnected && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-bold text-amber-950">Borrower Wallet Connection Required</div>
                <p className="leading-relaxed font-medium">
                  The connected wallet (<code className="font-mono text-[11px] px-1 bg-white border border-amber-200 text-amber-950 rounded font-bold">{truncateAddress(address || '')}</code>) is not the designated borrower for this agreement (<code className="font-mono text-[11px] px-1 bg-white border border-amber-200 text-amber-950 rounded font-bold">{truncateAddress(selectedLoan.borrower.walletAddress)}</code>). Only the authorized borrower address can execute repayments under smart contract policy.
                </p>
              </div>
            </div>
          )}

          {/* Repayment Execution Card */}
          {selectedLoan.status === 'REPAID' ? (
            <Card className="border-emerald-300 bg-emerald-50 rounded-2xl shadow-xs">
              <CardContent className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
                <h3 className="text-base font-bold text-slate-950">Agreement Fully Satisfied</h3>
                <p className="text-xs text-emerald-900 max-w-md mx-auto font-medium">
                  All principal and interest have been fully transferred to the loan pool contract. Syndicate lenders have been credited their entitled pro-rata shares, and borrower reputation was boosted in ReputationRegistry.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 bg-white rounded-2xl shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-bold text-slate-950">Submit On-Chain Repayment</CardTitle>
                <CardDescription className="text-xs text-slate-600 font-medium">
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
                    <span className="text-[10px] font-mono font-bold text-slate-500 mr-1">Quick Presets:</span>
                    <button
                      type="button"
                      disabled={selectedLoan.status !== 'ACTIVE' || !isBorrowerConnected}
                      onClick={() => handleSetPreset(0.25)}
                      className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      25% Partial
                    </button>
                    <button
                      type="button"
                      disabled={selectedLoan.status !== 'ACTIVE' || !isBorrowerConnected}
                      onClick={() => handleSetPreset(0.5)}
                      className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-950 border border-yellow-300 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      50% Partial ({(remainingDebtNum * 0.5).toFixed(2)} ETH)
                    </button>
                    <button
                      type="button"
                      disabled={selectedLoan.status !== 'ACTIVE' || !isBorrowerConnected}
                      onClick={() => handleSetPreset(0.75)}
                      className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      75% Partial
                    </button>
                    <button
                      type="button"
                      disabled={selectedLoan.status !== 'ACTIVE' || !isBorrowerConnected}
                      onClick={() => handleSetPreset(1)}
                      className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      100% Complete ({remainingDebtNum.toFixed(2)} ETH)
                    </button>
                  </div>
                </div>

                {/* Real-time Resulting Balance Preview */}
                {parsedRepayNum > 0 && !isOverDebt && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-700 font-bold">
                      <span>Resulting Remaining Debt:</span>
                      <span className="font-mono text-slate-950">
                        {resultingRemainingDebt.toFixed(2)} ETH
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      {isCompleteSettlement ? (
                        <span className="text-emerald-800 font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
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
                  className="w-full text-xs font-bold py-2.5 shadow-xs"
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
          <Card className="border-slate-200 bg-white rounded-2xl shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-950">Repayment History Ledger</CardTitle>
              <CardDescription className="text-xs text-slate-600 font-medium">
                Authoritative on-chain record of debt service payments credited to this facility.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {repaymentEvents.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-xs text-slate-500 font-mono font-medium">
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
                          <TableCell className="font-mono font-bold text-emerald-800">
                            +{formatEther(amountWei)} ETH
                          </TableCell>
                          <TableCell className="font-mono font-bold text-slate-950">
                            {formatEther(totalRepaidWei)} ETH
                          </TableCell>
                          <TableCell className="font-mono text-slate-800 font-bold">
                            #{evt.blockNumber}
                          </TableCell>
                          <TableCell>
                            <AddressBadge address={evt.transactionHash} digits={6} variant="mono" />
                          </TableCell>
                          <TableCell className="text-slate-600 text-[11px] font-medium">
                            {timeAgo(evt.timestamp)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-mono font-bold">
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
export default BorrowerRepaymentsPage;
