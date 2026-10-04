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
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
        <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
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
  const isOverspend = isOverSpendingCap;
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
        <Link to="/app/borrower/overview" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
          Controlled Supplier Spending
        </h1>
        <p className="text-xs text-slate-600 font-medium">
          Disburse authorized facility capital directly to whitelisted laboratory suppliers. The smart contract strictly enforces merchant allowlists and spending ceilings.
        </p>
      </div>

      {!isVerified && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-xs text-amber-950">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-950">Identity Verification Required</div>
            <p className="font-medium">
              Your connected borrower wallet must be verified in the KYCRegistry before spending operations can be executed on-chain.
            </p>
            <Link to="/app/verify" className="inline-block mt-1 font-bold underline text-amber-950 hover:text-black">
              Complete Verification Workflow →
            </Link>
          </div>
        </div>
      )}

      {activeLoans.length === 0 ? (
        <Card className="border-slate-200 bg-white rounded-2xl shadow-xs">
          <CardContent className="py-12 text-center space-y-4">
            <Coins className="w-10 h-10 text-slate-400 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-950">No Active Facilities Ready for Spending</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 font-medium">
                You do not have any credit facilities in the <strong className="text-slate-950">ACTIVE</strong> status. Agreements must reach their 100% funding threshold before disbursements can be executed.
              </p>
            </div>
            <Link to="/app/borrower/agreements">
              <Button variant="secondary" size="sm" className="font-bold">
                View My Agreements
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Agreement Selection */}
          <Card className="border-slate-200 bg-white rounded-2xl shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-950">1. Active Credit Facility</CardTitle>
                  <CardDescription className="text-xs text-slate-600 font-medium">
                    Smart contract facility currently authorized for direct vendor disbursements.
                  </CardDescription>
                </div>
                <StatusBadge status={selectedLoan.status} />
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {activeLoans.length > 1 ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Active Facility ({activeLoans.length})
                  </label>
                  <select
                    value={selectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono text-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  >
                    {activeLoans.map((l) => (
                      <option key={l.address} value={l.address}>
                        {l.address.slice(0, 12)}… — Target: {formatEther(l.targetWei)} ETH | Spend Limit: {formatEther(l.maxSpendWei)} ETH
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Contract:</span>
                    <AddressBadge address={selectedLoan.address} digits={6} />
                  </div>
                  <div className="font-mono text-slate-700 font-medium">
                    Principal: <strong className="text-slate-950 font-bold">{formatEther(selectedLoan.targetWei)} ETH</strong>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5-Figure Policy Breakdown */}
          <Card className="border border-slate-200 bg-white shadow-xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-950 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-600" />
                    Spending Policy & Capacity Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 font-medium">
                    Authoritative contract spending metrics and resulting capacity after disbursement.
                  </CardDescription>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                  LoanPool.sol Enforcement
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* 5-Metric Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                {/* 1. Spending Cap */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-xs font-mono font-bold text-slate-600 uppercase">1. Spending Cap</div>
                  <div className="text-base font-bold font-mono text-slate-950">
                    {maxSpendNum.toFixed(2)} ETH
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Total allowed cap</div>
                </div>

                {/* 2. Already Spent */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-xs font-mono font-bold text-slate-600 uppercase">2. Already Spent</div>
                  <div className="text-base font-bold font-mono text-slate-800">
                    {totalSpentNum.toFixed(2)} ETH
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Cumulative draws</div>
                </div>

                {/* 3. Remaining Capacity */}
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 space-y-1">
                  <div className="text-xs font-mono font-bold text-emerald-800 uppercase">3. Available Room</div>
                  <div className="text-base font-bold font-mono text-emerald-950">
                    {remainingSpendCapacity.toFixed(2)} ETH
                  </div>
                  <div className="text-xs text-emerald-700 font-medium">Available capacity</div>
                </div>

                {/* 4. Requested Amount */}
                <div className="p-3.5 rounded-xl bg-yellow-50 border border-yellow-300 space-y-1">
                  <div className="text-xs font-mono font-bold text-yellow-900 uppercase">4. Requested</div>
                  <div className="text-base font-bold font-mono text-slate-950">
                    {requestedNum > 0 ? requestedNum.toFixed(2) : '0.00'} ETH
                  </div>
                  <div className="text-xs text-yellow-800 font-medium">Disbursement input</div>
                </div>

                {/* 5. Resulting Remaining Capacity */}
                <div className={`p-3.5 rounded-xl border space-y-1 ${
                  isOverspend
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-emerald-50 border border-emerald-300 text-emerald-950'
                }`}>
                  <div className="text-xs font-mono uppercase font-bold flex items-center gap-1">
                    <span>5. Post-Tx Room</span>
                    {isOverspend ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div className={`text-base font-bold font-mono ${isOverspend ? 'text-rose-700' : 'text-emerald-800'}`}>
                    {isOverspend
                      ? `-${Math.abs(resultingRemainingCapacity).toFixed(2)} ETH`
                      : `${resultingRemainingCapacity.toFixed(2)} ETH`}
                  </div>
                  <div className="text-xs font-medium">
                    {isOverspend ? 'Exceeds spending limit' : 'Room remaining'}
                  </div>
                </div>
              </div>

              {/* Progress Utilization Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-mono text-slate-700">
                  <span className="font-bold">Capacity Utilization (Spent + Requested)</span>
                  <span className="text-slate-950 font-bold">
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
                  variant={isOverspend ? 'danger' : 'primary'}
                  className="h-2.5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Spend Execution Form */}
          <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-950">2. Recipient Supplier & Amount</CardTitle>
              <CardDescription className="text-xs text-slate-600 font-medium">
                Select a verified recipient on the contract allowlist and enter disbursement details.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Supplier Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Whitelisted Destination Vendor
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTestUnauthorized(!isTestUnauthorized)}
                    className="inline-flex items-center gap-1 text-xs font-mono font-bold text-yellow-900 hover:text-black cursor-pointer underline"
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
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-yellow-400 bg-yellow-50/70 ring-2 ring-yellow-400/40 shadow-xs'
                              : 'border-slate-200 hover:border-yellow-400 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 min-w-0">
                              <div className="font-bold text-xs text-slate-950 flex items-center gap-1.5 truncate">
                                <Store className="w-3.5 h-3.5 text-slate-500" />
                                <span>{sup?.businessName || 'Approved Supplier'}</span>
                              </div>
                              <div className="text-xs text-slate-500 font-medium">
                                {sup?.category || 'Hardware & Sensors'}
                              </div>
                              <AddressBadge address={mAddr} digits={4} className="mt-1" />
                            </div>

                            <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
                              <ShieldCheck className="w-3 h-3" />
                              ALLOWLISTED
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-3">
                    <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Evaluator Mode: Non-Allowlisted Recipient Address</span>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      Enter any address that is <strong>not</strong> on this agreement's approved supplier allowlist. The smart contract will reject this transaction with <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px] text-amber-950 font-bold">MerchantNotApproved()</code>.
                    </p>
                    <input
                      type="text"
                      value={unauthorizedAddress}
                      onChange={(e) => setUnauthorizedAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full text-xs p-2.5 rounded-lg border border-amber-300 font-mono bg-white text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold"
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
                      className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetPercent(0.50)}
                      className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetPercent(0.75)}
                      className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmountEth(remainingSpendCapacity.toString())}
                      className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors border border-emerald-300 cursor-pointer"
                    >
                      100% MAX
                    </button>
                    <button
                      type="button"
                      onClick={setOverspendPreset}
                      className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 transition-colors border border-rose-300 cursor-pointer"
                      title="Set amount to remaining capacity + 1.0 ETH to verify SpendLimitExceeded contract rejection"
                    >
                      🧪 Test Overspend (+1 ETH)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Expense Category (Immutable Audit)
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Laboratory Hardware"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                  <p className="text-[10px] text-slate-500 font-mono font-medium">
                    Encoded into bytes32 category in SpendExecuted event.
                  </p>
                </div>
              </div>

              {/* Pre-Flight Contract Enforcement Explanations */}
              {isOverspend && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-950 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">Contract Enforcement: Overspending Rejection</div>
                    <p className="text-[11px] leading-relaxed font-medium">
                      The requested disbursement (<strong>{requestedNum} ETH</strong>) exceeds remaining spending capacity (<strong>{remainingSpendCapacity.toFixed(2)} ETH</strong>). The contract will revert with <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[10px] font-bold">SpendLimitExceeded</code>.
                    </p>
                  </div>
                </div>
              )}

              {!isApprovedMerchant && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">Contract Enforcement: Unauthorized Supplier Rejection</div>
                    <p className="text-[11px] leading-relaxed font-medium">
                      Recipient address <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px] font-bold">{activeMerchantAddress}</code> is not on allowlist. Reverts with <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px] font-bold">MerchantNotApproved()</code>.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit / Test Action */}
              <div className="pt-2">
                <Button
                  variant={isOverspend || !isApprovedMerchant ? 'danger' : 'primary'}
                  className="w-full text-xs font-bold py-2.5 shadow-xs"
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
