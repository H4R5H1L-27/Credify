import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { useReputation, useReputationHistory } from '../../hooks/useCredify';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { AddressBadge } from '../../components/ui/AddressBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { timeAgo, formatDate } from '../../lib/utils';
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
  Layers,
  ArrowUpRight,
} from 'lucide-react';

/* ─── helpers ─── */

function scoreTier(score: number): { label: string; color: string; bg: string; ring: string } {
  if (score >= 70) return { label: 'Tier A — Low Risk', color: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-400' };
  if (score >= 40) return { label: 'Tier B — Medium Risk', color: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-400' };
  return { label: 'High Risk', color: 'text-rose-700', bg: 'bg-rose-50', ring: 'ring-rose-400' };
}

function gaugeColor(score: number): string {
  if (score >= 70) return '#10b981'; // emerald-500
  if (score >= 40) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
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
      <text x="64" y="84" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui">out of 100</text>
    </svg>
  );
}

/* ─── page ─── */

export const BorrowerReputationPage: React.FC = () => {
  const { address } = useIdentity();
  const { data: reputation, isLoading: repLoading } = useReputation(address || '');
  const { data: history = [], isLoading: histLoading } = useReputationHistory(address || '');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'SUCCESS' | 'DEFAULT'>('ALL');

  if (repLoading || histLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
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
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <Link to="/app/borrower/overview" className="inline-flex items-center gap-1.5 text-xs text-[#86868b] hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Reputation &amp; Outcome History
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[#86868b] max-w-xl">
            On-chain credit performance score recorded directly by the <span className="font-mono text-white/90">ReputationRegistry</span> smart contract.
            Score = <span className="font-mono text-white/90">50 + (successful_agreements × 8) − (defaulted_agreements × 20)</span>, clamped 0–100.
          </p>
          <Link
            to="/console/contracts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 font-sans shrink-0 hover:underline"
            title="Inspect on-chain ReputationRegistry contract"
          >
            <span>Inspect Reputation Registry</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 1. Score Hero & Key Counters */}
      <div className="rounded-xl border border-dark-border-subtle bg-dark-bg-1 p-6 shadow-depth-card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-8">
          {/* Gauge */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <ScoreGauge score={score} />
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${tier.bg} ${tier.color} border-current/20`}>
              {tier.label}
            </span>
          </div>

          {/* Stats Grid: Current Score, Successful Agreements, Defaulted Agreements */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-dark-text-muted">Current Score</span>
              <div className="text-3xl font-black font-mono text-dark-text-primary">{score}<span className="text-base font-normal text-dark-text-muted">/100</span></div>
            </div>
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Successful Agreements</span>
              <div className="flex items-center gap-2 text-2xl font-bold font-mono text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                {successfulLoans}
                <span className="text-xs font-normal text-emerald-400/70 ml-1">× +8 pts</span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">Defaulted Agreements</span>
              <div className="flex items-center gap-2 text-2xl font-bold font-mono text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                {defaultedLoans}
                <span className="text-xs font-normal text-rose-400/70 ml-1">× −20 pts</span>
              </div>
            </div>
            <div className={`p-4 rounded-lg border space-y-1 ${trajectoryDelta >= 0 ? 'bg-blue-950/20 border-blue-500/20' : 'bg-amber-950/20 border-amber-500/20'}`}>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${trajectoryDelta >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
                Net Trajectory
              </span>
              <div className={`flex items-center gap-1.5 text-2xl font-bold font-mono ${trajectoryDelta >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
                {trajectoryDelta >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {trajectoryDelta >= 0 ? `+${trajectoryDelta}` : trajectoryDelta}
                <span className="text-xs font-normal ml-1 opacity-70">from 50</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Latest Authoritative Outcome Banner */}
      {latestOutcome && (
        <div className={`rounded-xl border p-5 transition-all ${
          latestOutcome.outcome === 'SUCCESS'
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : 'bg-rose-950/20 border-rose-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                latestOutcome.outcome === 'SUCCESS'
                  ? 'bg-emerald-900/40 text-emerald-400'
                  : 'bg-rose-900/40 text-rose-400'
              }`}>
                {latestOutcome.outcome === 'SUCCESS' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider text-dark-text-muted">
                    Latest Agreement Outcome
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    latestOutcome.outcome === 'SUCCESS'
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                  }`}>
                    {latestOutcome.outcome === 'SUCCESS' ? '+8 Points Earned' : '−20 Point Penalty'}
                  </span>
                </div>
                <div className="font-bold text-dark-text-primary text-sm">
                  {latestOutcome.outcome === 'SUCCESS'
                    ? 'Credit Agreement Successfully Repaid'
                    : 'Credit Agreement Declared Defaulted'}
                </div>
                <div className="text-xs text-dark-text-secondary flex items-center gap-2 flex-wrap">
                  <span>Agreement:</span>
                  <Link
                    to={`/app/loans/${latestOutcome.loanId}`}
                    className="font-mono font-semibold text-credify-400 hover:underline inline-flex items-center gap-1"
                  >
                    <AddressBadge address={latestOutcome.loanId} chars={6} />
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                  <span>•</span>
                  <span className="font-mono text-dark-text-muted">{timeAgo(latestOutcome.timestamp)}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 text-right font-mono text-xs text-dark-text-secondary border-t sm:border-t-0 sm:border-l border-dark-border-subtle pt-2 sm:pt-0 sm:pl-4">
              <div>Resulting Score: <strong className="text-dark-text-primary">{latestOutcome.scoreAfter}/100</strong></div>
              <div className="text-[11px] text-dark-text-muted mt-0.5">
                Tx <AddressBadge address={latestOutcome.transactionHash} chars={4} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Authoritative Agreements Overview (Successful vs Defaulted) */}
      {(reputation?.successfulAgreements?.length || 0) + (reputation?.defaultedAgreements?.length || 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Successful Agreements Card */}
          <Card className="border-emerald-500/20 bg-dark-bg-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <CardTitle className="text-sm">Successful Agreements</CardTitle>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  {reputation?.successfulAgreements?.length || 0} completed
                </span>
              </div>
              <CardDescription className="text-xs">
                Agreements fully settled on-chain. Each completed agreement contributed +8 reputation points.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(!reputation?.successfulAgreements || reputation.successfulAgreements.length === 0) ? (
                <div className="text-xs text-dark-text-muted py-2">No completed agreements yet.</div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {reputation.successfulAgreements.map((poolAddr) => (
                    <div key={poolAddr} className="flex items-center justify-between p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-xs">
                      <Link to={`/app/loans/${poolAddr}`} className="font-mono text-credify-400 hover:underline flex items-center gap-1">
                        <AddressBadge address={poolAddr} chars={6} />
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded">
                        +8 pts ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Defaulted Agreements Card */}
          <Card className="border-rose-500/20 bg-dark-bg-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileX className="w-4 h-4 text-rose-400" />
                  <CardTitle className="text-sm">Defaulted Agreements</CardTitle>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                  {reputation?.defaultedAgreements?.length || 0} defaulted
                </span>
              </div>
              <CardDescription className="text-xs">
                Agreements where lender consensus declared default. Each default imposed a −20 reputation penalty.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(!reputation?.defaultedAgreements || reputation.defaultedAgreements.length === 0) ? (
                <div className="text-xs text-dark-text-muted py-2">No defaults on record. Outstanding credit discipline.</div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {reputation.defaultedAgreements.map((poolAddr) => (
                    <div key={poolAddr} className="flex items-center justify-between p-2 rounded bg-rose-950/20 border border-rose-500/20 text-xs">
                      <Link to={`/app/loans/${poolAddr}`} className="font-mono text-credify-400 hover:underline flex items-center gap-1">
                        <AddressBadge address={poolAddr} chars={6} />
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/50 px-1.5 py-0.5 rounded">
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
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-dark-text-secondary" />
              <CardTitle>On-Chain Score History</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Immutable audit trail connecting every reputation score transition directly to an authoritative agreement outcome.
            </CardDescription>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-dark-bg-2 p-1 rounded-lg text-xs font-medium self-start sm:self-auto border border-dark-border-subtle">
            <button
              onClick={() => setOutcomeFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                outcomeFilter === 'ALL' ? 'bg-dark-bg-3 shadow-xs font-bold text-dark-text-primary' : 'text-dark-text-secondary hover:text-dark-text-primary'
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setOutcomeFilter('SUCCESS')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                outcomeFilter === 'SUCCESS' ? 'bg-dark-bg-3 shadow-xs font-bold text-emerald-400' : 'text-dark-text-secondary hover:text-dark-text-primary'
              }`}
            >
              Repayments ({successfulLoans})
            </button>
            <button
              onClick={() => setOutcomeFilter('DEFAULT')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                outcomeFilter === 'DEFAULT' ? 'bg-dark-bg-3 shadow-xs font-bold text-rose-400' : 'text-dark-text-secondary hover:text-dark-text-primary'
              }`}
            >
              Defaults ({defaultedLoans})
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-dark-text-muted mx-auto" />
              <div className="text-xs text-dark-text-secondary font-medium">
                {outcomeFilter === 'ALL' ? 'Baseline score established: 50/100' : `No ${outcomeFilter.toLowerCase()} outcomes found.`}
              </div>
              <div className="text-xs text-dark-text-muted">
                Every completed repayment or default event will append an immutable proof here.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-dark-border-subtle text-xs font-sans">
              {filteredHistory.map((entry) => {
                const isSuccess = entry.outcome === 'SUCCESS';
                const deltaFormatted = isSuccess ? '+8' : '−20';
                const hasValidLoan = entry.loanId && entry.loanId !== 'reputation';

                return (
                  <div key={entry.id} className="py-4 flex items-start gap-3.5 hover:bg-dark-bg-2/50 px-2 rounded-lg transition-colors">
                    {/* Outcome Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isSuccess ? 'bg-emerald-950/40 border border-emerald-500/30' : 'bg-rose-950/40 border border-rose-500/30'
                    }`}>
                      {isSuccess
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold ${isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isSuccess ? 'Authoritative Repayment Settled' : 'Consensus Default Finalized'}
                        </span>
                        <span className={`font-mono text-xs px-2 py-0.5 rounded-full border font-bold ${
                          isSuccess
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                        }`}>
                          {deltaFormatted} pts
                        </span>
                        <span className="font-mono text-dark-text-secondary text-xs">
                          Score: {entry.scoreBefore} → <strong className="text-dark-text-primary">{entry.scoreAfter}</strong> / 100
                        </span>
                      </div>

                      {/* Authoritative Agreement Link */}
                      {hasValidLoan && (
                        <div className="text-xs text-dark-text-secondary flex items-center gap-1.5 flex-wrap">
                          <span className="text-dark-text-muted">Agreement Contract:</span>
                          <Link
                            to={`/app/loans/${entry.loanId}`}
                            className="font-mono font-semibold text-credify-400 hover:underline inline-flex items-center gap-1"
                          >
                            <AddressBadge address={entry.loanId} chars={6} />
                            <ArrowUpRight className="w-3 h-3 text-credify-400" />
                          </Link>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                            isSuccess
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                          }`}>
                            {isSuccess ? 'REPAID' : 'DEFAULTED'}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-dark-text-muted font-mono flex-wrap pt-0.5">
                        <span>Block #{entry.blockNumber}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          Tx <AddressBadge address={entry.transactionHash} chars={5} />
                          <ExternalLink className="w-3 h-3 text-dark-text-muted" />
                        </span>
                        <span>•</span>
                        <span>{timeAgo(entry.timestamp)}</span>
                      </div>
                    </div>

                    {/* Running count badge */}
                    <div className="shrink-0 text-right text-xs font-mono text-dark-text-muted space-y-0.5">
                      <div className="text-emerald-400 font-semibold">{entry.successfulLoans} ✓</div>
                      <div className="text-rose-400 font-semibold">{entry.defaultedLoans} ✗</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Score Improvement Guide & Invariant Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <CardTitle>Score Improvement Guide</CardTitle>
          </div>
          <CardDescription className="text-xs">
            How on-chain outcomes govern your credit score and terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {score >= 100 ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300">
              <Star className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">Maximum score achieved (100/100). You have demonstrated exceptional on-chain credit performance.</span>
            </div>
          ) : (
            <>
              {defaultedLoans > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-rose-300">Default Recovery Required</div>
                    <div className="text-rose-400/90 mt-0.5">
                      {defaultedLoans} default{defaultedLoans > 1 ? 's' : ''} on record impose a {defaultedLoans * 20} point penalty.
                      You need at least <strong>{repaymentsToRecoverDefault} more successful repayment{repaymentsToRecoverDefault !== 1 ? 's' : ''}</strong> to fully offset this penalty.
                    </div>
                  </div>
                </div>
              )}
              {score < 70 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs">
                  <TrendingUp className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-amber-300">Path to Tier A (Low Risk)</div>
                    <div className="text-amber-400/90 mt-0.5">
                      Your current score is <strong>{score}/100</strong>. Tier A requires ≥70/100.
                      Complete <strong>{repaymentsToTierA} more successful repayment{repaymentsToTierA !== 1 ? 's' : ''}</strong> to reach Tier A status.
                    </div>
                  </div>
                </div>
              )}
              {score >= 70 && score < 100 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Tier A — Low Risk Status</div>
                    <div className="mt-0.5 text-emerald-400/90">
                      You are in the top tier. Each additional repayment adds <strong>+8 points</strong> toward a perfect 100/100.
                      Maximum score requires {Math.ceil((100 - score) / 8)} more repayment{Math.ceil((100 - score) / 8) !== 1 ? 's' : ''}.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Immutable formula explanation */}
          <div className="p-3 rounded-lg bg-dark-bg-2 border border-dark-border-subtle text-xs font-mono text-dark-text-secondary space-y-1">
            <div className="font-bold text-dark-text-primary font-sans">Smart Contract Invariant:</div>
            <div>Score = max(0, min(100, 50 + (successes × 8) − (defaults × 20)))</div>
            <div className="text-xs text-dark-text-muted font-sans mt-1">
              Recorded directly by ReputationRegistry.sol upon LoanRepaid and LoanDefaulted events. No arbitrary modifications permitted.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
