import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useLoans } from '../../hooks/useCredify';
import { useContractAction } from '../../hooks/useContractAction';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
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
  MilestoneCelebration,
} from '../../components/ui';
import {
  formatEther,
  formatEtherNum,
  parseEtherToWei,
} from '../../lib/utils';
import {
  Send,
  ShieldCheck,
  AlertCircle,
  Store,
  ArrowLeft,
  Coins,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  ShieldAlert,
} from 'lucide-react';

export const BorrowerSpendingPage: React.FC = () => {
  const { address, isVerified } = useIdentity();
  const { data: loans, isLoading: loansLoading, refetch: refetchLoans } = useLoans();
  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.getSuppliers(),
  });

  const {
    isExecuting,
    txState,
    executeSpend,
    resetTxState,
  } = useContractAction();

  // Active borrower agreements
  const activeLoans = React.useMemo(() => {
    if (!loans || !address) return [];
    const lower = address.toLowerCase();
    return loans.filter((l) => l.borrower.walletAddress.toLowerCase() === lower && l.status === 'ACTIVE');
  }, [loans, address]);

  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');
  const [isTestUnauthorized, setIsTestUnauthorized] = useState<boolean>(false);
  const [unauthorizedAddress, setUnauthorizedAddress] = useState<string>('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  const [amountEth, setAmountEth] = useState('1.5');
  const [category, setCategory] = useState('Laboratory Hardware');
  const [showMilestone, setShowMilestone] = useState(false);

  // Set default selected loan
  React.useEffect(() => {
    if (activeLoans.length > 0 && !selectedLoanId) {
      setSelectedLoanId(activeLoans[0].address);
    }
  }, [activeLoans, selectedLoanId]);

  const selectedLoan = activeLoans.find((l) => l.address === selectedLoanId) || activeLoans[0];

  // Set default merchant from selected loan's approved list
  React.useEffect(() => {
    if (selectedLoan && selectedLoan.merchants.length > 0 && !selectedMerchant) {
      setSelectedMerchant(selectedLoan.merchants[0]);
    }
  }, [selectedLoan, selectedMerchant]);

  if (loansLoading || suppliersLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-dark-bg-3 animate-pulse rounded" />
        <div className="h-64 bg-dark-bg-2 animate-pulse rounded-xl" />
      </div>
    );
  }

  // Authoritative loan calculations
  const maxSpendNum = selectedLoan ? formatEtherNum(selectedLoan.maxSpendWei) : 0;
  const totalSpentNum = selectedLoan ? formatEtherNum(selectedLoan.totalSpentWei) : 0;
  const remainingSpendCapacity = Math.max(0, maxSpendNum - totalSpentNum);

  const parsedAmountNum = Number(amountEth) || 0;
  const requestedNum = parsedAmountNum;
  const isOverSpendingCap = parsedAmountNum > remainingSpendCapacity;
  const isAmountExceeded = isOverSpendingCap;
  const isOverspend = isAmountExceeded;
  const resultingRemainingCapacity = remainingSpendCapacity - requestedNum;

  // Active merchant destination address
  const activeMerchantAddress = isTestUnauthorized ? unauthorizedAddress.trim() : selectedMerchant;
  const isApprovedMerchant = selectedLoan
    ? selectedLoan.merchants.some((m) => m.toLowerCase() === activeMerchantAddress.toLowerCase())
    : false;

  const handleSpend = async () => {
    if (!selectedLoan || !activeMerchantAddress || !amountEth) return;
    try {
      await executeSpend(
        selectedLoan.address,
        activeMerchantAddress,
        parseEtherToWei(amountEth),
        category
      );
      refetchLoans();
      setShowMilestone(true);
    } catch {
      // Caught and displayed via useContractAction txState
    }
  };

  const setPresetPercent = (percent: number) => {
    const val = (remainingSpendCapacity * percent).toFixed(2);
    setAmountEth(val);
  };

  const setOverspendPreset = () => {
    const val = (remainingSpendCapacity + 1.0).toFixed(2);
    setAmountEth(val);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Breadcrumb & Header */}
      <div className="space-y-2">
        <Link to="/app/borrower/overview" className="inline-flex items-center gap-1.5 text-xs text-dark-text-muted hover:text-dark-text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-dark-text-primary">
          Controlled Supplier Spending
        </h1>
        <p className="text-xs text-dark-text-secondary">
          Disburse authorized facility capital directly to whitelisted laboratory suppliers. The smart contract strictly enforces merchant allowlists and spending ceilings.
        </p>
      </div>

      {!isVerified && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-300">Identity Verification Required</div>
            <p>
              Your connected borrower wallet must be verified in the KYCRegistry before spending operations can be executed on-chain.
            </p>
            <Link to="/app/verify" className="inline-block mt-1 font-semibold underline text-amber-300 hover:text-amber-200">
              Complete Verification Workflow →
            </Link>
          </div>
        </div>
      )}

      {activeLoans.length === 0 ? (
        <Card className="border-dark-border-default bg-dark-bg-2">
          <CardContent className="py-12 text-center space-y-4">
            <Coins className="w-10 h-10 text-dark-text-muted mx-auto" />
            <div>
              <h3 className="text-base font-semibold text-dark-text-primary">No Active Facilities Ready for Spending</h3>
              <p className="text-xs text-dark-text-secondary max-w-md mx-auto mt-1">
                You do not have any credit facilities in the <strong className="text-brand-400">ACTIVE</strong> status. Agreements must reach their 100% funding threshold before disbursements can be executed.
              </p>
            </div>
            <Link to="/app/borrower/agreements">
              <Button variant="secondary" size="sm">
                View My Agreements
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Agreement Selection */}
          <Card className="border-dark-border-default bg-dark-bg-2">
            <CardHeader className="pb-3 border-b border-dark-border-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-dark-text-primary">1. Visual Anchor: Active Credit Facility</CardTitle>
                  <CardDescription className="text-xs text-dark-text-muted">
                    Smart contract facility currently authorized for direct vendor disbursements.
                  </CardDescription>
                </div>
                <StatusBadge status={selectedLoan.status} />
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {activeLoans.length > 1 ? (
                <div>
                  <label className="block text-xs font-semibold text-dark-text-secondary mb-1">
                    Select Active Facility ({activeLoans.length})
                  </label>
                  <select
                    value={selectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-dark-border-default bg-dark-bg-1 font-mono text-dark-text-primary focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                  >
                    {activeLoans.map((l) => (
                      <option key={l.address} value={l.address}>
                        {l.address.slice(0, 12)}… — Target: {formatEther(l.targetWei)} ETH | Spend Limit: {formatEther(l.maxSpendWei)} ETH
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-dark-bg-1 border border-dark-border-subtle text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-dark-text-secondary">Contract:</span>
                    <AddressBadge address={selectedLoan.address} digits={6} />
                  </div>
                  <div className="font-mono text-dark-text-secondary">
                    Principal: <strong className="text-dark-text-primary">{formatEther(selectedLoan.targetWei)} ETH</strong>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5-Figure Policy Breakdown */}
          <Card className="border-brand-500/20 bg-dark-bg-2">
            <CardHeader className="pb-3 border-b border-dark-border-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-dark-text-primary flex items-center gap-2">
                    <Coins className="w-4 h-4 text-brand-400" />
                    Spending Policy & Capacity Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs text-dark-text-muted">
                    Authoritative contract spending metrics and resulting capacity after disbursement.
                  </CardDescription>
                </div>
                <span className="text-[11px] font-mono text-dark-text-muted">
                  LoanPool.sol Enforcement
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* 5-Metric Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                {/* 1. Spending Cap */}
                <div className="p-3 rounded-xl bg-dark-bg-1 border border-dark-border-subtle space-y-1">
                  <div className="text-[10px] font-mono text-dark-text-muted uppercase">1. Spending Cap</div>
                  <div className="text-base font-bold font-mono text-dark-text-primary">
                    {maxSpendNum.toFixed(2)} ETH
                  </div>
                  <div className="text-[10px] text-dark-text-muted">Total allowed cap</div>
                </div>

                {/* 2. Already Spent */}
                <div className="p-3 rounded-xl bg-dark-bg-1 border border-dark-border-subtle space-y-1">
                  <div className="text-[10px] font-mono text-dark-text-muted uppercase">2. Already Spent</div>
                  <div className="text-base font-bold font-mono text-dark-text-secondary">
                    {totalSpentNum.toFixed(2)} ETH
                  </div>
                  <div className="text-[10px] text-dark-text-muted">Cumulative draws</div>
                </div>

                {/* 3. Remaining Capacity */}
                <div className="p-3 rounded-xl bg-dark-bg-1 border border-emerald-500/30 space-y-1">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase">3. Available Room</div>
                  <div className="text-base font-bold font-mono text-emerald-400">
                    {remainingSpendCapacity.toFixed(2)} ETH
                  </div>
                  <div className="text-[10px] text-dark-text-muted">Available capacity</div>
                </div>

                {/* 4. Requested Amount */}
                <div className="p-3 rounded-xl bg-dark-bg-1 border border-brand-500/30 space-y-1">
                  <div className="text-[10px] font-mono text-brand-400 uppercase">4. Requested</div>
                  <div className="text-base font-bold font-mono text-brand-300">
                    {requestedNum > 0 ? requestedNum.toFixed(2) : '0.00'} ETH
                  </div>
                  <div className="text-[10px] text-dark-text-muted">Disbursement input</div>
                </div>

                {/* 5. Resulting Remaining Capacity */}
                <div className={`p-3 rounded-xl border space-y-1 ${
                  isOverspend
                    ? 'bg-crimson-500/10 border-crimson-500/30 text-crimson-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  <div className="text-[10px] font-mono uppercase font-semibold flex items-center gap-1">
                    <span>5. Post-Tx Room</span>
                    {isOverspend ? (
                      <AlertTriangle className="w-3 h-3 text-crimson-400" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                  <div className={`text-base font-bold font-mono ${isOverspend ? 'text-crimson-400' : 'text-emerald-400'}`}>
                    {isOverspend
                      ? `-${Math.abs(resultingRemainingCapacity).toFixed(2)} ETH`
                      : `${resultingRemainingCapacity.toFixed(2)} ETH`}
                  </div>
                  <div className="text-[10px] opacity-80">
                    {isOverspend ? 'Exceeds spending limit' : 'Room remaining'}
                  </div>
                </div>
              </div>

              {/* Progress Utilization Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-mono text-dark-text-muted">
                  <span>Capacity Utilization (Spent + Requested)</span>
                  <span className="text-dark-text-primary font-semibold">
                    {maxSpendNum > 0
                      ? Math.min(100, Math.round(((totalSpentNum + requestedNum) / maxSpendNum) * 100))
                      : 0}%
                  </span>
                </div>
                <ProgressBar
                  value={
                    maxSpendNum > 0
                      ? Math.min(100, ((totalSpentNum + requestedNum) / maxSpendNum) * 100)
                      : 0
                  }
                  variant={isOverspend ? 'crimson' : 'brand'}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Spend Execution Form */}
          <Card className="border-dark-border-default bg-dark-bg-2">
            <CardHeader className="pb-3 border-b border-dark-border-subtle">
              <CardTitle className="text-sm font-semibold text-dark-text-primary">2. Recipient Supplier & Amount</CardTitle>
              <CardDescription className="text-xs text-dark-text-muted">
                Select a verified recipient on the contract allowlist and enter disbursement details.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Supplier Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-dark-text-secondary">
                    Whitelisted Destination Vendor
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTestUnauthorized(!isTestUnauthorized)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-brand-400 hover:text-brand-300 cursor-pointer"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>{isTestUnauthorized ? 'Return to Approved List' : 'Test Non-Allowlisted Address (Evaluator)'}</span>
                  </button>
                </div>

                {!isTestUnauthorized ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedLoan.merchants.map((mAddr) => {
                      const sup = suppliers?.find(
                        (s) => s.address.toLowerCase() === mAddr.toLowerCase()
                      );
                      const isSelected = selectedMerchant.toLowerCase() === mAddr.toLowerCase();

                      return (
                        <div
                          key={mAddr}
                          onClick={() => setSelectedMerchant(mAddr)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/30'
                              : 'border-dark-border-default hover:border-dark-border-strong bg-dark-bg-1'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 min-w-0">
                              <div className="font-semibold text-xs text-dark-text-primary flex items-center gap-1.5 truncate">
                                <Store className="w-3.5 h-3.5 text-dark-text-muted" />
                                <span>{sup?.businessName || 'Approved Supplier'}</span>
                              </div>
                              <div className="text-[11px] text-dark-text-muted">
                                {sup?.category || 'Hardware & Sensors'}
                              </div>
                              <AddressBadge address={mAddr} digits={4} className="mt-1" />
                            </div>

                            <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                              <ShieldCheck className="w-3 h-3" />
                              ALLOWLISTED
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>Evaluator Mode: Non-Allowlisted Recipient Address</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      Enter any address that is <strong>not</strong> on this agreement's approved supplier allowlist. The smart contract will reject this transaction with <code className="bg-dark-bg-0 px-1 py-0.5 rounded font-mono text-[10px] text-amber-300">MerchantNotApproved()</code>.
                    </p>
                    <input
                      type="text"
                      value={unauthorizedAddress}
                      onChange={(e) => setUnauthorizedAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full text-xs p-2.5 rounded-lg border border-amber-500/40 font-mono bg-dark-bg-1 text-dark-text-primary focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <AmountInput
                    label="Disbursement Amount"
                    value={amountEth}
                    onChange={setAmountEth}
                    balance={remainingSpendCapacity.toFixed(2)}
                    maxAmount={remainingSpendCapacity.toString()}
                    symbol="ETH"
                    placeholder="1.50"
                    error={isOverspend ? `Exceeds max remaining capacity of ${remainingSpendCapacity.toFixed(2)} ETH` : undefined}
                  />

                  {/* Allocation & Overspend Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setPresetPercent(0.25)}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-dark-bg-3 hover:bg-dark-bg-4 text-dark-text-secondary transition-colors cursor-pointer"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetPercent(0.50)}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-dark-bg-3 hover:bg-dark-bg-4 text-dark-text-secondary transition-colors cursor-pointer"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetPercent(0.75)}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-dark-bg-3 hover:bg-dark-bg-4 text-dark-text-secondary transition-colors cursor-pointer"
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmountEth(remainingSpendCapacity.toString())}
                      className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors border border-emerald-500/20 cursor-pointer"
                    >
                      100% MAX
                    </button>
                    <button
                      type="button"
                      onClick={setOverspendPreset}
                      className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-crimson-500/10 hover:bg-crimson-500/20 text-crimson-400 transition-colors border border-crimson-500/20 cursor-pointer"
                      title="Set amount to remaining capacity + 1.0 ETH to verify SpendLimitExceeded contract rejection"
                    >
                      🧪 Test Overspend (+1 ETH)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-dark-text-secondary">
                    Expense Category (Immutable Audit)
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Laboratory Hardware"
                    className="w-full text-xs p-2.5 rounded-lg border border-dark-border-default bg-dark-bg-1 text-dark-text-primary focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                  />
                  <p className="text-[10px] text-dark-text-muted font-mono">
                    Encoded into bytes32 category in SpendExecuted event.
                  </p>
                </div>
              </div>

              {/* Pre-Flight Contract Enforcement Explanations */}
              {isOverspend && (
                <div className="p-3.5 rounded-xl bg-crimson-500/10 border border-crimson-500/30 text-xs text-crimson-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-crimson-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">Contract Enforcement: Overspending Rejection</div>
                    <p className="text-[11px] leading-relaxed">
                      The requested disbursement (<strong>{requestedNum} ETH</strong>) exceeds remaining spending capacity (<strong>{remainingSpendCapacity.toFixed(2)} ETH</strong>). The contract will revert with <code className="bg-dark-bg-0 px-1 py-0.5 rounded font-mono text-[10px]">SpendLimitExceeded</code>.
                    </p>
                  </div>
                </div>
              )}

              {!isApprovedMerchant && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">Contract Enforcement: Unauthorized Supplier Rejection</div>
                    <p className="text-[11px] leading-relaxed">
                      Recipient address <code className="bg-dark-bg-0 px-1 py-0.5 rounded font-mono text-[10px]">{activeMerchantAddress}</code> is not on allowlist. Reverts with <code className="bg-dark-bg-0 px-1 py-0.5 rounded font-mono text-[10px]">MerchantNotApproved()</code>.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit / Test Action */}
              <div className="pt-2">
                <Button
                  variant={isOverspend || !isApprovedMerchant ? 'danger' : 'primary'}
                  className="w-full text-xs font-semibold py-2.5 shadow-dark-xs"
                  disabled={
                    !isVerified ||
                    requestedNum <= 0 ||
                    !activeMerchantAddress ||
                    isExecuting
                  }
                  onClick={handleSpend}
                  loading={isExecuting}
                  icon={<Send className="w-4 h-4" />}
                >
                  {isOverspend || !isApprovedMerchant
                    ? `Attempt Disbursement via MetaMask (Test Contract Rejection)`
                    : `Confirm & Sign Disbursement in MetaMask (${amountEth} ETH)`}
                </Button>
              </div>
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
          type="PAYMENT_CONFIRMED"
          contractAddress={activeMerchantAddress}
          txHash={txState?.txHash}
          amountEth={`${amountEth} ETH`}
          primaryAction={{
            label: 'Dismiss',
            onClick: () => setShowMilestone(false),
          }}
        />
      )}
    </div>
  );
};
