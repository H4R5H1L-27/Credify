import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useReputation, useReputationHistory } from '../../hooks/useCredify';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { AddressBadge } from '../../components/ui/AddressBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { timeAgo } from '../../lib/utils';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  History,
  Lightbulb,
  ExternalLink,
  Star,
  FileCheck,
  FileX,
  ArrowUpRight,
} from 'lucide-react';

/* ─── helpers ─── */

function scoreTier(score: number): { label: string; color: string; bg: string; ring: string } {
  if (score >= 70) return { label: 'Tier A — Low Risk', color: 'text-emerald-800', bg: 'bg-emerald-100 border-emerald-300', ring: 'ring-emerald-400' };
  if (score >= 40) return { label: 'Tier B — Medium Risk', color: 'text-amber-900', bg: 'bg-amber-100 border-amber-300', ring: 'ring-amber-400' };
  return { label: 'Tier C — High Risk', color: 'text-rose-900', bg: 'bg-rose-100 border-rose-300', ring: 'ring-rose-400' };
}

function gaugeColor(score: number): string {
  if (score >= 70) return '#16a34a'; // emerald-600
  if (score >= 40) return '#d97706'; // amber-600
  return '#dc2626'; // rose-600
}

// SVG arc gauge
function ScoreGauge({ score }: { score: number }) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const r = 52;
  const cx = 64;
  const cy = 64;
  const startAngle = -210;
  const totalArc = 240; // degrees
  const filled = (clampedScore / 100) * totalArc;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcPath = (start: number, end: number, color: string) => {
    const largeArc = Math.abs(end - start) > 180 ? 1 : 0;
    const sx = cx + r * Math.cos(toRad(start));
    const sy = cy + r * Math.sin(toRad(start));
    const ex = cx + r * Math.cos(toRad(end));
    const ey = cy + r * Math.sin(toRad(end));
    return <path d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`} stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />;
  };
  const color = gaugeColor(clampedScore);
  return (
    <svg width="128" height="112" viewBox="0 0 128 128" className="select-none">
      {arcPath(startAngle, startAngle + totalArc, '#e2e8f0')}
      {clampedScore > 0 && arcPath(startAngle, startAngle + filled, color)}
      <text x="64" y="68" textAnchor="middle" fill="#0f172a" fontSize="28" fontWeight="800" fontFamily="monospace">{clampedScore}</text>
      <text x="64" y="84" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="system-ui" fontWeight="bold">out of 100</text>
    </svg>
  );
}

export const BorrowerReputationPage: React.FC = () => {
  const { address } = useIdentity();
  const { data: reputation, isLoading: repLoading } = useReputation(address || '');
  const { data: history = [], isLoading: histLoading } = useReputationHistory(address || '');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'SUCCESS' | 'DEFAULT'>('ALL');

  if (repLoading || histLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48 bg-slate-200" />
        <Skeleton className="h-56 w-full rounded-2xl bg-slate-200" />
        <Skeleton className="h-40 w-full rounded-2xl bg-slate-200" />
      </div>
    );
  }

  const score = reputation?.score ?? 50;
  const successfulLoans = reputation?.successfulLoans ?? 0;
  const defaultedLoans = reputation?.defaultedLoans ?? 0;
  const tier = scoreTier(score);
  const latestOutcome = reputation?.latestOutcome;

  // Improvement math
  const baselineScore = 50;
  const trajectoryDelta = score - baselineScore;
  const repaymentsToRecoverDefault = defaultedLoans > 0 ? Math.ceil((defaultedLoans * 20) / 8) : 0;
  const repaymentsToTierA = score < 70 ? Math.ceil((70 - score) / 8) : 0;

  // Filtered history
  const filteredHistory = history.filter((entry) => {
    if (outcomeFilter === 'ALL') return true;
    return entry.outcome === outcomeFilter;
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="space-y-2">
        <Link to="/app/borrower/overview" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Reputation &amp; Outcome History
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-600 max-w-xl font-medium">
            On-chain credit performance score recorded directly by the <span className="font-mono text-slate-950 font-bold">ReputationRegistry</span> smart contract.
            Score = <span className="font-mono text-slate-950 font-bold">50 + (successful_agreements × 8) − (defaulted_agreements × 20)</span>, clamped 0–100.
          </p>
          <Link
            to="/console/contracts"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-900 hover:text-black font-sans shrink-0 underline"
            title="Inspect on-chain ReputationRegistry contract"
          >
            <span>Inspect Reputation Registry</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 1. Score Hero & Key Counters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-8">
          {/* Gauge */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <ScoreGauge score={score} />
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${tier.bg} ${tier.color}`}>
              {tier.label}
            </span>
          </div>

          {/* Stats Grid: Current Score, Successful Agreements, Defaulted Agreements */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Current Score</span>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-3xl font-black font-mono text-slate-950">{score}</span>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-[#ffe600] text-black border border-yellow-400">
                  / 100 MAX
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Successful Agreements</span>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-2xl font-bold font-mono text-emerald-950">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{successfulLoans}</span>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  +8 pts each
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-900">Defaulted Agreements</span>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-2xl font-bold font-mono text-rose-950">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>{defaultedLoans}</span>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                  -20 pts penalty
                </span>
              </div>
            </div>
            <div className={`p-4 rounded-xl border shadow-xs space-y-1 ${trajectoryDelta >= 0 ? 'bg-yellow-50 border-yellow-300' : 'bg-amber-50 border-amber-300'}`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${trajectoryDelta >= 0 ? 'text-yellow-950' : 'text-amber-950'}`}>
                Net Trajectory
              </span>
              <div className="flex items-center justify-between pt-1">
                <div className={`flex items-center gap-1.5 text-2xl font-bold font-mono ${trajectoryDelta >= 0 ? 'text-slate-950' : 'text-amber-950'}`}>
                  {trajectoryDelta >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-rose-600" />}
                  <span>{trajectoryDelta >= 0 ? `+${trajectoryDelta}` : trajectoryDelta}</span>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-white text-slate-900 border border-slate-200">
                  Baseline 50
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Latest Authoritative Outcome Banner */}
      {latestOutcome && (
        <div className={`rounded-2xl border p-5 shadow-xs transition-all ${
          latestOutcome.outcome === 'SUCCESS'
            ? 'bg-emerald-50 border-emerald-300'
            : 'bg-rose-50 border-rose-300'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                latestOutcome.outcome === 'SUCCESS'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {latestOutcome.outcome === 'SUCCESS' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Latest Agreement Outcome
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    latestOutcome.outcome === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}>
                    {latestOutcome.outcome === 'SUCCESS' ? '+8 Points Earned' : '−20 Point Penalty'}
                  </span>
                </div>
                <div className="font-bold text-slate-950 text-sm">
                  {latestOutcome.outcome === 'SUCCESS'
                    ? 'Credit Agreement Successfully Repaid'
                    : 'Credit Agreement Declared Defaulted'}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap font-medium">
                  <span>Agreement:</span>
                  <Link
                    to={`/app/loans/${latestOutcome.loanId}`}
                    className="font-mono font-bold text-yellow-950 hover:underline inline-flex items-center gap-1"
                  >
                    <AddressBadge address={latestOutcome.loanId} digits={6} />
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                  <span>•</span>
                  <span className="font-mono text-slate-500">{timeAgo(latestOutcome.timestamp)}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 text-right font-mono text-xs text-slate-700 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
              <div>Resulting Score: <strong className="text-slate-950">{latestOutcome.scoreAfter}/100</strong></div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Tx <AddressBadge address={latestOutcome.transactionHash} digits={4} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Authoritative Agreements Overview (Successful vs Defaulted) */}
      {(reputation?.successfulAgreements?.length || 0) + (reputation?.defaultedAgreements?.length || 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Successful Agreements Card */}
          <Card className="border-emerald-300 bg-white rounded-2xl shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  <CardTitle className="text-sm font-bold text-slate-950">Successful Agreements</CardTitle>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  {reputation?.successfulAgreements?.length || 0} completed
                </span>
              </div>
              <CardDescription className="text-xs text-slate-600 font-medium">
                Agreements fully settled on-chain. Each completed agreement contributed +8 reputation points.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {(!reputation?.successfulAgreements || reputation.successfulAgreements.length === 0) ? (
                <div className="text-xs text-slate-500 py-2 font-medium">No completed agreements yet.</div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {reputation.successfulAgreements.map((poolAddr) => (
                    <div key={poolAddr} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                      <Link to={`/app/loans/${poolAddr}`} className="font-mono text-yellow-950 font-bold hover:underline flex items-center gap-1">
                        <AddressBadge address={poolAddr} digits={6} />
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        +8 pts ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Defaulted Agreements Card */}
          <Card className="border-rose-300 bg-white rounded-2xl shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileX className="w-4 h-4 text-rose-700" />
                  <CardTitle className="text-sm font-bold text-slate-950">Defaulted Agreements</CardTitle>
                </div>
                <span className="text-xs font-mono font-bold text-rose-900 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                  {reputation?.defaultedAgreements?.length || 0} defaulted
                </span>
              </div>
              <CardDescription className="text-xs text-slate-600 font-medium">
                Agreements where lender consensus declared default. Each default imposed a −20 reputation penalty.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {(!reputation?.defaultedAgreements || reputation.defaultedAgreements.length === 0) ? (
                <div className="text-xs text-slate-500 py-2 font-medium">No defaults on record. Outstanding credit discipline.</div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {reputation.defaultedAgreements.map((poolAddr) => (
                    <div key={poolAddr} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                      <Link to={`/app/loans/${poolAddr}`} className="font-mono text-yellow-950 font-bold hover:underline flex items-center gap-1">
                        <AddressBadge address={poolAddr} digits={6} />
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      <span className="text-[10px] font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                        −20 pts ✗
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. On-Chain Outcome-Oriented Score History */}
      <Card className="border-slate-200 bg-white rounded-2xl shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <CardTitle className="text-base font-bold text-slate-950">On-Chain Score History</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-600 font-medium">
              Immutable audit trail connecting every reputation score transition directly to an authoritative agreement outcome.
            </CardDescription>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl text-xs font-medium self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setOutcomeFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                outcomeFilter === 'ALL' ? 'bg-[#ffe600] text-black font-bold shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setOutcomeFilter('SUCCESS')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                outcomeFilter === 'SUCCESS' ? 'bg-[#ffe600] text-black font-bold shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Repayments ({successfulLoans})
            </button>
            <button
              onClick={() => setOutcomeFilter('DEFAULT')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                outcomeFilter === 'DEFAULT' ? 'bg-[#ffe600] text-black font-bold shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Defaults ({defaultedLoans})
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {filteredHistory.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs text-slate-800 font-bold">
                {outcomeFilter === 'ALL' ? 'Baseline score established: 50/100' : `No ${outcomeFilter.toLowerCase()} outcomes found.`}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Every completed repayment or default event will append an immutable proof here.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs font-sans">
              {filteredHistory.map((entry) => {
                const isSuccess = entry.outcome === 'SUCCESS';
                const deltaFormatted = isSuccess ? '+8' : '−20';
                const hasValidLoan = entry.loanId && entry.loanId !== 'reputation';

                return (
                  <div key={entry.id} className="py-4 flex items-start gap-3.5 hover:bg-yellow-50/20 px-3 rounded-xl transition-colors">
                    {/* Outcome Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isSuccess ? 'bg-emerald-100 border border-emerald-300' : 'bg-rose-100 border border-rose-300'
                    }`}>
                      {isSuccess
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        : <AlertTriangle className="w-4 h-4 text-rose-700" />}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold ${isSuccess ? 'text-emerald-800' : 'text-rose-800'}`}>
                          {isSuccess ? 'Authoritative Repayment Settled' : 'Consensus Default Finalized'}
                        </span>
                        <span className={`font-mono text-xs px-2.5 py-0.5 rounded-full border font-bold ${
                          isSuccess
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {deltaFormatted} pts
                        </span>
                        <span className="font-mono text-slate-700 text-xs font-medium">
                          Score: {entry.scoreBefore} → <strong className="text-slate-950">{entry.scoreAfter}</strong> / 100
                        </span>
                      </div>

                      {/* Authoritative Agreement Link */}
                      {hasValidLoan && (
                        <div className="text-xs text-slate-700 flex items-center gap-1.5 flex-wrap font-medium">
                          <span className="text-slate-500">Agreement Contract:</span>
                          <Link
                            to={`/app/loans/${entry.loanId}`}
                            className="font-mono font-bold text-yellow-950 hover:underline inline-flex items-center gap-1"
                          >
                            <AddressBadge address={entry.loanId} digits={6} />
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            isSuccess
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}>
                            {isSuccess ? 'REPAID' : 'DEFAULTED'}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-mono flex-wrap pt-0.5">
                        <span>Block #{entry.blockNumber}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          Tx <AddressBadge address={entry.transactionHash} digits={5} />
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </span>
                        <span>•</span>
                        <span>{timeAgo(entry.timestamp)}</span>
                      </div>
                    </div>

                    {/* Running count badge */}
                    <div className="shrink-0 text-right text-xs font-mono text-slate-600 font-bold space-y-0.5">
                      <div className="text-emerald-800">{entry.successfulLoans} ✓</div>
                      <div className="text-rose-800">{entry.defaultedLoans} ✗</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Score Improvement Guide & Invariant Rules */}
      <Card className="border-slate-200 bg-white rounded-2xl shadow-xs">
        <CardHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-600" />
            <CardTitle className="text-base font-bold text-slate-950">Score Improvement Guide</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-600 font-medium">
            How on-chain outcomes govern your credit score and terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {score >= 100 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950">
              <Star className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">Maximum score achieved (100/100). You have demonstrated exceptional on-chain credit performance.</span>
            </div>
          ) : (
            <>
              {defaultedLoans > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-300 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-950">Default Recovery Required</div>
                    <div className="text-rose-900 mt-0.5 font-medium">
                      {defaultedLoans} default{defaultedLoans > 1 ? 's' : ''} on record impose a {defaultedLoans * 20} point penalty.
                      You need at least <strong>{repaymentsToRecoverDefault} more successful repayment{repaymentsToRecoverDefault !== 1 ? 's' : ''}</strong> to fully offset this penalty.
                    </div>
                  </div>
                </div>
              )}
              {score < 70 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-300 text-xs">
                  <TrendingUp className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-yellow-950">Path to Tier A (Low Risk)</div>
                    <div className="text-yellow-950 mt-0.5 font-medium">
                      Your current score is <strong>{score}/100</strong>. Tier A requires ≥70/100.
                      Complete <strong>{repaymentsToTierA} more successful repayment{repaymentsToTierA !== 1 ? 's' : ''}</strong> to reach Tier A status.
                    </div>
                  </div>
                </div>
              )}
              {score >= 70 && score < 100 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Tier A — Low Risk Status</div>
                    <div className="mt-0.5 text-emerald-900 font-medium">
                      You are in the top tier. Each additional repayment adds <strong>+8 points</strong> toward a perfect 100/100.
                      Maximum score requires {Math.ceil((100 - score) / 8)} more repayment{Math.ceil((100 - score) / 8) !== 1 ? 's' : ''}.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Immutable formula explanation */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 space-y-1">
            <div className="font-bold text-slate-950 font-sans">Smart Contract Invariant:</div>
            <div className="font-bold">Score = max(0, min(100, 50 + (successes × 8) − (defaults × 20)))</div>
            <div className="text-xs text-slate-600 font-sans mt-1 font-medium">
              Recorded directly by ReputationRegistry.sol upon LoanRepaid and LoanDefaulted events. No arbitrary modifications permitted.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default BorrowerReputationPage;
