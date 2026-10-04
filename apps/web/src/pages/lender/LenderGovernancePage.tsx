import React from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useLoans } from '../../hooks/useCredify';
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
  TransactionState,
  MilestoneCelebration,
} from '../../components/ui';
import { formatEther, formatEtherNum, formatDate } from '../../lib/utils';
import { api } from '../../lib/api';
import {
  Vote,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FlaskConical,
} from 'lucide-react';

export const LenderGovernancePage: React.FC = () => {
  const { address } = useIdentity();
  const { data: loans, isLoading, refetch: refetchLoans } = useLoans();
  const [isWarpingTime, setIsWarpingTime] = React.useState(false);
  const [showMilestone, setShowMilestone] = React.useState(false);
  const [votedPoolAddress, setVotedPoolAddress] = React.useState<string>('');

  const {
    isExecuting,
    txState,
    executeVoteDefault,
    resetTxState,
  } = useContractAction();

  // Find loans where lender holds capital-weighted voting weight
  const governanceLoans = React.useMemo(() => {
    if (!loans || !address) return [];
    const lower = address.toLowerCase();
    return loans.filter((loan) => {
      const rec = loan.lenders.find((l) => l.walletAddress.toLowerCase() === lower);
      return Boolean(rec && BigInt(rec.contributedWei) > 0n);
    });
  }, [loans, address]);

  const handleVote = async (poolAddress: string) => {
    try {
      setVotedPoolAddress(poolAddress);
      await executeVoteDefault(poolAddress);
      refetchLoans();
      setShowMilestone(true);
    } catch {
      // Handled inside txState
    }
  };

  const handleFastForwardMaturity = async () => {
    setIsWarpingTime(true);
    try {
      await api.timeWarp(15 * 86400);
      await refetchLoans();
    } finally {
      setIsWarpingTime(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="space-y-2">
        <Link to="/app/lender/portfolio" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portfolio</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
          Syndicate Governance & Default Consensus
        </h1>
        <p className="text-xs text-slate-600 font-medium">
          Exercise your capital-weighted voting power on matured loans. Voting weight equals your supplied money at risk (&gt;50% majority threshold required).
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-yellow-50/80 border border-yellow-300 text-xs space-y-2 text-slate-800 shadow-xs">
        <div className="font-bold text-slate-950 flex items-center gap-1.5 font-mono">
          <Clock className="w-4 h-4 text-yellow-700" />
          Maturity & Quorum Protocol
        </div>
        <p className="leading-relaxed">
          The smart contract only accepts default votes after an agreement has reached its maturity timestamp. When accumulated capital votes cross the strict majority threshold (&gt;50% of total pool capital), the contract automatically declares <strong className="text-slate-950">DEFAULTED</strong> on-chain and penalizes borrower reputation.
        </p>
      </div>

      {governanceLoans.length === 0 ? (
        <Card className="border-slate-200 bg-white rounded-2xl shadow-xs">
          <CardContent className="py-12 text-center space-y-3">
            <Vote className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-950">No Eligible Governance Agreements</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
              You do not hold voting weight in any current loan syndicates. Contribute to an agreement to receive voting power.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {governanceLoans.map((loan) => {
            const lenderRec = loan.lenders.find(
              (l: any) => l.walletAddress.toLowerCase() === address?.toLowerCase()
            );
            const myVoteWeight = lenderRec ? formatEtherNum(lenderRec.contributedWei) : 0;
            const myShareBps = lenderRec ? lenderRec.shareBps : 0;
            const hasVoted = Boolean(lenderRec?.hasVoted);

            const totalVoted = formatEtherNum(loan.defaultVoteWeightWei || '0');
            const threshold = formatEtherNum(loan.defaultThresholdWei || '0');
            const quorumPercent = threshold > 0 ? Math.min(100, Math.round((totalVoted / threshold) * 100)) : 0;

            const unpaidWei = BigInt(loan.totalRepayableWei) > BigInt(loan.totalRepaidWei)
              ? BigInt(loan.totalRepayableWei) - BigInt(loan.totalRepaidWei)
              : 0n;
            const unpaidEth = formatEther(unpaidWei.toString());

            const remainingWeightWei = BigInt(loan.defaultThresholdWei || '0') > BigInt(loan.defaultVoteWeightWei || '0')
              ? BigInt(loan.defaultThresholdWei || '0') - BigInt(loan.defaultVoteWeightWei || '0')
              : 0n;
            const remainingWeightEth = formatEther(remainingWeightWei.toString());

            const isPastMaturity = new Date(loan.maturity).getTime() <= Date.now();
            const isDefaulted = loan.status === 'DEFAULTED';
            const isRepaid = loan.status === 'REPAID';
            const isActive = loan.status === 'ACTIVE';

            return (
              <Card key={loan.address} className="border-slate-200 bg-white rounded-2xl shadow-xs">
                <CardHeader className="border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-950">
                        {loan.borrower.displayName} Agreement Syndicate
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 font-mono mt-0.5 font-medium">
                        Contract <AddressBadge address={loan.address} digits={5} /> • Matures: {formatDate(loan.maturity)}
                      </CardDescription>
                    </div>
                    <StatusBadge status={loan.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-5">
                  {/* Defaulted State Banner */}
                  {isDefaulted && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-950">
                        <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                        <span>Agreement Declared DEFAULTED by Syndicate Majority</span>
                      </div>
                      <p className="text-[11px] text-rose-900 leading-relaxed font-mono font-medium">
                        Votes reached {totalVoted.toFixed(2)} ETH (threshold: {threshold.toFixed(2)} ETH). Contract declared default on-chain; borrower reputation penalized.
                      </p>
                    </div>
                  )}

                  {/* 7 Mandatory Governance Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
                    {/* 1. Maturity */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">1. Maturity</div>
                      <div className="font-bold text-slate-950 text-xs truncate" title={loan.maturity}>
                        {formatDate(loan.maturity)}
                      </div>
                      <div className="text-[10px] font-mono">
                        {isPastMaturity ? (
                          <span className="text-rose-700 font-bold">Past Due</span>
                        ) : (
                          <span className="text-slate-500 font-medium">Within Term</span>
                        )}
                      </div>
                    </div>

                    {/* 2. Unpaid Amount */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">2. Unpaid Due</div>
                      <div className="font-bold font-mono text-slate-950 text-xs">
                        {unpaidEth} ETH
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium">
                        Debt open
                      </div>
                    </div>

                    {/* 3. Lender Voting Weight */}
                    <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-300 space-y-1">
                      <div className="text-[10px] text-yellow-900 font-mono font-bold uppercase">3. Your Weight</div>
                      <div className="font-bold font-mono text-slate-950 text-xs">
                        {myVoteWeight.toFixed(2)} ETH
                      </div>
                      <div className="text-[10px] text-yellow-950 font-bold font-mono">
                        {(myShareBps / 100).toFixed(1)}% share
                      </div>
                    </div>

                    {/* 4. Threshold */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">4. Threshold</div>
                      <div className="font-bold font-mono text-slate-950 text-xs">
                        &gt; {threshold.toFixed(2)} ETH
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium">
                        &gt;50% capital
                      </div>
                    </div>

                    {/* 5. Current Votes */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">5. Current Votes</div>
                      <div className={`font-bold font-mono text-xs ${
                        totalVoted > 0 ? 'text-amber-800' : 'text-slate-950'
                      }`}>
                        {totalVoted.toFixed(2)} ETH
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium">
                        {quorumPercent}% quorum
                      </div>
                    </div>

                    {/* 6. Participating Lenders Count */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">6. Voters</div>
                      <div className="font-bold font-mono text-slate-950 text-xs">
                        {loan.lenders.filter((l: any) => l.hasVoted).length} / {loan.lenders.length}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium">
                        Participating
                      </div>
                    </div>

                    {/* 7. Remaining Voting Weight */}
                    <div className={`p-3 rounded-xl border space-y-1 ${
                      remainingWeightWei === 0n && totalVoted > 0
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">7. Remaining</div>
                      <div className="font-bold font-mono text-slate-950 text-xs">
                        {remainingWeightEth} ETH
                      </div>
                      <div className="text-[10px] font-mono font-bold">
                        {remainingWeightWei === 0n && totalVoted > 0 ? (
                          <span className="text-rose-700">Consensus Met</span>
                        ) : (
                          <span className="text-slate-500 font-medium">Needed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Consensus Progress Bar */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-950 font-mono">Quorum Consensus Progress:</span>
                      <span className="font-mono font-bold text-slate-950">
                        {totalVoted.toFixed(2)} voted / &gt; {threshold.toFixed(2)} ETH required ({quorumPercent}%)
                      </span>
                    </div>
                    <ProgressBar
                      value={quorumPercent}
                      threshold={100}
                      variant={quorumPercent >= 100 ? 'danger' : 'warning'}
                      className="h-2.5"
                    />
                    <div className="flex justify-between text-[11px] text-slate-600 font-mono font-medium">
                      <span>Threshold: Strict majority (&gt;50.01% of pool capital)</span>
                      <span>Your Voting Power: {myVoteWeight.toFixed(2)} ETH ({(myShareBps / 100).toFixed(1)}%)</span>
                    </div>
                  </div>

                  {/* Participating Lenders Table with Vote Badges */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 flex items-center justify-between">
                      <span>Participating Syndicate Lenders ({loan.lenders.length})</span>
                      <span>Weight = Capital at Risk</span>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {loan.lenders.map((lender: any) => {
                        const isCurrent = address && lender.walletAddress.toLowerCase() === address.toLowerCase();
                        return (
                          <div key={lender.walletAddress} className="p-3.5 flex items-center justify-between bg-white hover:bg-yellow-50/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <AddressBadge address={lender.walletAddress} digits={5} />
                              <span className="text-slate-950 font-bold text-xs">{lender.displayName}</span>
                              {isCurrent && (
                                <Badge variant="outline" className="text-[10px] font-mono font-bold border-yellow-400 bg-yellow-100 text-black">
                                  Your Wallet
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right font-mono">
                                <div className="font-bold text-slate-950">{formatEther(lender.contributedWei)} ETH</div>
                                <div className="text-[10px] text-slate-500 font-medium">{(lender.shareBps / 100).toFixed(1)}% weight</div>
                              </div>
                              <div>
                                {lender.hasVoted ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3" /> VOTED DEFAULT
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    <Clock className="w-3 h-3" /> NOT VOTED
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Evaluator Fast-Forward Helper */}
                  {!isPastMaturity && isActive && (
                    <div className="p-3.5 rounded-xl bg-yellow-50 border border-yellow-300 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-yellow-950 flex items-center gap-1.5 font-mono font-bold">
                        <FlaskConical className="w-4 h-4 text-yellow-700 shrink-0" />
                        <span>Maturity timestamp not yet reached. Fast-forward local EVM clock to test contract consensus.</span>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={isWarpingTime}
                        onClick={handleFastForwardMaturity}
                        className="text-xs font-bold shrink-0 border-yellow-400"
                      >
                        Fast-Forward +15 Days
                      </Button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-slate-700">
                      {isDefaulted ? (
                        <span className="text-rose-700 font-bold">Default officially recorded on-chain</span>
                      ) : isRepaid ? (
                        <span className="text-emerald-700 font-bold">Agreement fully repaid; governance closed</span>
                      ) : hasVoted ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Your default vote is active on-chain
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-500 font-medium">Requires maturity timestamp check on-chain</span>
                      )}
                    </div>

                    <Button
                      variant="danger"
                      size="sm"
                      disabled={!isActive || isExecuting || hasVoted}
                      onClick={() => handleVote(loan.address)}
                      loading={isExecuting}
                      icon={<Vote className="w-3.5 h-3.5" />}
                      className="text-xs font-bold shadow-xs"
                    >
                      {hasVoted ? 'Default Vote Cast ✓' : 'Cast Contributed Default Vote in MetaMask'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

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
      <MilestoneCelebration
        open={showMilestone && txState?.step === 'confirmed'}
        onClose={() => setShowMilestone(false)}
        type="AGREEMENT_DEFAULTED"
        contractAddress={votedPoolAddress || undefined}
        txHash={txState?.txHash}
        reputationDelta={-20}
        primaryAction={{
          label: 'Dismiss',
          onClick: () => setShowMilestone(false),
        }}
      />
    </div>
  );
};
