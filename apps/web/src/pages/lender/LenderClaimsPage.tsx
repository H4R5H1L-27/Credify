import React from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useLoans, useEvaluatorEvents } from '../../hooks/useCredify';
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
  TransactionState,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/ui';
import { formatEther, formatEtherNum, timeAgo } from '../../lib/utils';
import {
  Download,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  TrendingUp,
  FileText,
  ExternalLink,
  Coins,
} from 'lucide-react';

export const LenderClaimsPage: React.FC = () => {
  const { address, identity } = useIdentity();
  const { data: loans, isLoading, refetch: refetchLoans } = useLoans();
  const { data: allEvents } = useEvaluatorEvents();

  const {
    isExecuting,
    txState,
    executeClaim,
    resetTxState,
  } = useContractAction();

  // Positions with pro-rata claims
  const positionsWithClaims = React.useMemo(() => {
    if (!loans || !address) return [];
    const lower = address.toLowerCase();
    const result: Array<{
      loan: any;
      rec: any;
      contributedWei: bigint;
      poolContributedWei: bigint;
      shareBps: number;
      totalRepaidWei: bigint;
      totalClaimedWei: bigint;
      claimableWei: bigint;
      entitledWei: bigint;
    }> = [];

    for (const loan of loans) {
      const rec = loan.lenders.find((l: any) => l.walletAddress.toLowerCase() === lower);
      if (rec && BigInt(rec.contributedWei) > 0n) {
        const cWei = BigInt(rec.contributedWei);
        const totalRepaid = BigInt(loan.totalRepaidWei || '0');
        const poolContributed = BigInt(loan.contributedWei || '1');

        // Authoritative on-chain calculations
        const entitledShare = poolContributed > 0n ? (totalRepaid * cWei) / poolContributed : 0n;
        const claimable = rec.claimableWei !== undefined ? BigInt(rec.claimableWei) : entitledShare;
        const claimed = rec.claimedWei !== undefined ? BigInt(rec.claimedWei) : 0n;

        result.push({
          loan,
          rec,
          contributedWei: cWei,
          poolContributedWei: poolContributed,
          shareBps: rec.shareBps,
          totalRepaidWei: totalRepaid,
          totalClaimedWei: claimed,
          claimableWei: claimable,
          entitledWei: entitledShare,
        });
      }
    }

    return result;
  }, [loans, address]);

  // Overall totals across positions
  const totalClaimableAll = positionsWithClaims.reduce((acc, p) => acc + p.claimableWei, 0n);
  const totalClaimedAll = positionsWithClaims.reduce((acc, p) => acc + p.totalClaimedWei, 0n);
  const totalContributedAll = positionsWithClaims.reduce((acc, p) => acc + p.contributedWei, 0n);

  // Claim events specifically for this connected lender
  const myClaimEvents = React.useMemo(() => {
    if (!allEvents || !address) return [];
    const lower = address.toLowerCase();
    return allEvents
      .filter(
        (evt) =>
          evt.eventName === 'RepaymentClaimed' &&
          ((evt.actor && evt.actor.toLowerCase() === lower) ||
            (evt.data?.lender && evt.data.lender.toLowerCase() === lower))
      )
      .sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
  }, [allEvents, address]);

  const handleClaimPosition = async (poolAddress: string) => {
    try {
      await executeClaim(poolAddress);
      refetchLoans();
    } catch {
      // Handled inside txState
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Navigation & Header */}
      <div className="space-y-2">
        <Link
          to="/app/lender/portfolio"
          className="inline-flex items-center gap-1.5 text-xs text-dark-text-muted hover:text-dark-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portfolio</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-dark-text-primary">
              Pro-Rata Repayment Claims
            </h1>
            <p className="text-xs text-dark-text-secondary mt-1 max-w-2xl">
              Withdraw repayments made by borrowers directly to your connected wallet. Credify enforces
              authoritative on-chain proportional pull-claims based on each lender&apos;s syndicate contribution share.
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <Link
                to="/console/events?eventName=RepaymentClaimed"
                className="text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1 hover:underline"
                title="Inspect on-chain RepaymentClaimed events in Technical Console"
              >
                <span>Inspect Pull-Payment Evidence in Console</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Connected Wallet Live Balance */}
          <div className="p-3 bg-dark-bg-2 border border-dark-border-default rounded-xl shadow-dark-xs flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-dark-text-muted">
                Connected Balance
              </div>
              <div className="font-mono font-bold text-dark-text-primary text-sm">
                {identity?.balanceWei ? `${formatEtherNum(identity.balanceWei).toFixed(4)} ETH` : '— ETH'}
              </div>
              <div className="text-[10px] text-dark-text-muted font-mono">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-dark-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
              Currently Claimable
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {formatEtherNum(totalClaimableAll).toFixed(2)} ETH
            </div>
            <p className="text-[11px] text-dark-text-secondary mt-0.5">
              Available to pull across {positionsWithClaims.filter((p) => p.claimableWei > 0n).length} positions
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-dark-border-default bg-dark-bg-2 shadow-dark-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-dark-text-muted">
              Total Already Claimed
            </span>
            <div className="text-2xl font-bold font-mono text-dark-text-primary mt-1">
              {formatEtherNum(totalClaimedAll).toFixed(2)} ETH
            </div>
            <p className="text-[11px] text-dark-text-secondary mt-0.5">
              Cumulative distributions received
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-dark-bg-3 text-dark-text-muted flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-dark-border-default bg-dark-bg-2 shadow-dark-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-dark-text-muted">
              Total Capital Deployed
            </span>
            <div className="text-2xl font-bold font-mono text-dark-text-primary mt-1">
              {formatEtherNum(totalContributedAll).toFixed(2)} ETH
            </div>
            <p className="text-[11px] text-dark-text-secondary mt-0.5">
              Across {positionsWithClaims.length} active credit syndicates
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Transaction Lifecycle Monitor */}
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

      {/* Pro-Rata Claimable Positions */}
      <div className="rounded-2xl border border-dark-border-default bg-dark-bg-2 overflow-hidden shadow-dark-md">
        <div className="p-5 border-b border-dark-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-dark-text-primary">Syndicate Claim Positions</h3>
            <p className="text-xs text-dark-text-secondary mt-0.5">
              Authoritative on-chain accounting showing your exact proportional entitlement.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Pull-Payment Security (Escrow Protected)</span>
          </div>
        </div>

        <div className="p-5">
          {positionsWithClaims.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Download className="w-10 h-10 text-dark-text-muted mx-auto" />
              <h3 className="text-sm font-semibold text-dark-text-primary">No Funded Positions Found</h3>
              <p className="text-xs text-dark-text-secondary max-w-sm mx-auto">
                Your connected wallet has not funded any credit agreements yet. Discover open opportunities in the agreement catalog.
              </p>
              <Link to="/app/lender/explore">
                <Button size="sm" variant="primary" className="mt-2 text-xs">
                  Browse Funding Opportunities
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-dark-border-subtle">
              {positionsWithClaims.map(
                ({
                  loan,
                  contributedWei,
                  poolContributedWei,
                  shareBps,
                  totalRepaidWei,
                  totalClaimedWei,
                  claimableWei,
                }) => {
                  const sharePct = (shareBps / 100).toFixed(2);
                  const canClaim = claimableWei > 0n;

                  return (
                    <div key={loan.address} className="py-6 space-y-4">
                      {/* Agreement Row Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-dark-text-primary text-sm">
                              {loan.borrower.displayName} Facility
                            </span>
                            <StatusBadge status={loan.status} />
                          </div>
                          <div className="text-[11px] text-dark-text-secondary font-mono mt-0.5 flex items-center gap-2">
                            <span>Contract:</span>
                            <AddressBadge address={loan.address} digits={6} />
                            <span>·</span>
                            <Link
                              to={`/app/loans/${loan.address}`}
                              className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
                            >
                              <span>View Provenance</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-dark-text-muted font-mono">Currently Claimable</div>
                          <div
                            className={`text-lg font-bold font-mono ${
                              canClaim ? 'text-emerald-400' : 'text-dark-text-muted'
                            }`}
                          >
                            {formatEtherNum(claimableWei).toFixed(4)} ETH
                          </div>
                        </div>
                      </div>

                      {/* Mandatory 5-Metric Accounting Breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                        {/* 1. Contribution */}
                        <div className="p-3 rounded-lg bg-dark-bg-1 border border-dark-border-subtle space-y-0.5">
                          <div className="text-[10px] text-dark-text-muted font-mono uppercase">
                            1. Contribution
                          </div>
                          <div className="font-bold font-mono text-dark-text-primary text-sm">
                            {formatEtherNum(contributedWei).toFixed(2)} ETH
                          </div>
                          <div className="text-[10px] text-brand-400 font-mono">
                            {sharePct}% pool share
                          </div>
                        </div>

                        {/* 2. Total Contribution */}
                        <div className="p-3 rounded-lg bg-dark-bg-1 border border-dark-border-subtle space-y-0.5">
                          <div className="text-[10px] text-dark-text-muted font-mono uppercase">
                            2. Total Pool
                          </div>
                          <div className="font-bold font-mono text-dark-text-secondary text-sm">
                            {formatEtherNum(poolContributedWei).toFixed(2)} ETH
                          </div>
                          <div className="text-[10px] text-dark-text-muted">Target pool</div>
                        </div>

                        {/* 3. Total Repaid */}
                        <div className="p-3 rounded-lg bg-dark-bg-1 border border-dark-border-subtle space-y-0.5">
                          <div className="text-[10px] text-dark-text-muted font-mono uppercase">
                            3. Total Repaid
                          </div>
                          <div className="font-bold font-mono text-dark-text-primary text-sm">
                            {formatEtherNum(totalRepaidWei).toFixed(2)} ETH
                          </div>
                          <div className="text-[10px] text-dark-text-muted">
                            of {formatEtherNum(loan.totalRepayableWei).toFixed(2)} ETH due
                          </div>
                        </div>

                        {/* 4. Claimed Amount */}
                        <div className="p-3 rounded-lg bg-dark-bg-1 border border-dark-border-subtle space-y-0.5">
                          <div className="text-[10px] text-dark-text-muted font-mono uppercase">
                            4. Claimed
                          </div>
                          <div className="font-bold font-mono text-dark-text-secondary text-sm">
                            {formatEtherNum(totalClaimedWei).toFixed(2)} ETH
                          </div>
                          <div className="text-[10px] text-dark-text-muted">Already pulled</div>
                        </div>

                        {/* 5. Currently Claimable Amount */}
                        <div
                          className={`p-3 rounded-lg border space-y-0.5 ${
                            canClaim
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-dark-bg-1 border-dark-border-subtle text-dark-text-muted'
                          }`}
                        >
                          <div className="text-[10px] font-mono uppercase tracking-wider flex items-center justify-between">
                            <span>5. Claimable</span>
                            {canClaim && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            )}
                          </div>
                          <div
                            className={`font-bold font-mono text-sm ${
                              canClaim ? 'text-emerald-400' : 'text-dark-text-muted'
                            }`}
                          >
                            {formatEtherNum(claimableWei).toFixed(4)} ETH
                          </div>
                          <div className="text-[10px] opacity-80">
                            {canClaim ? 'Available to pull' : 'No balance due'}
                          </div>
                        </div>
                      </div>

                      {/* Pull Claim Action Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="text-[11px] text-dark-text-muted flex items-center gap-1.5 font-mono">
                          <TrendingUp className="w-3.5 h-3.5 text-brand-400" />
                          <span>
                            Formula: (totalRepaid * contribution) / totalContributed − claimed
                          </span>
                        </div>

                        <div>
                          <Button
                            variant={canClaim ? 'success' : 'secondary'}
                            size="sm"
                            disabled={!canClaim || isExecuting}
                            onClick={() => handleClaimPosition(loan.address)}
                            loading={isExecuting}
                            icon={<Download className="w-3.5 h-3.5" />}
                            className="text-xs font-semibold"
                          >
                            {canClaim
                              ? `Withdraw ${formatEtherNum(claimableWei).toFixed(4)} ETH in MetaMask`
                              : totalClaimedWei > 0n
                              ? 'All Repayments Claimed ✓'
                              : 'Awaiting Borrower Repayment'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      {/* On-Chain Claims Evidence Ledger Table */}
      <div className="rounded-2xl border border-dark-border-default bg-dark-bg-2 overflow-hidden shadow-dark-md">
        <div className="p-5 border-b border-dark-border-subtle flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-dark-text-primary flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-400" />
              <span>On-Chain Claim History Ledger</span>
            </h3>
            <p className="text-xs text-dark-text-secondary mt-0.5">
              Cryptographic evidence of pull-payment claim transactions mined on the blockchain.
            </p>
          </div>
          <span className="text-xs font-mono text-dark-text-muted">
            {myClaimEvents.length} {myClaimEvents.length === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>

        {myClaimEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-dark-text-muted font-mono">
            No claim transactions recorded yet for this wallet address. Once you withdraw your repayment share,
            the verified block transaction will be archived here.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim Description</TableHead>
                <TableHead>Pool Contract</TableHead>
                <TableHead>Block #</TableHead>
                <TableHead>Transaction Hash</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Amount Claimed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myClaimEvents.map((evt) => {
                const amountEth = evt.data?.amount ? formatEther(evt.data.amount) : '0';
                return (
                  <TableRow key={evt.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium text-dark-text-primary text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{evt.summary}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <AddressBadge address={evt.loanId} digits={4} />
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

                    <TableCell className="text-right font-mono font-bold text-emerald-400">
                      +{amountEth} ETH
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
