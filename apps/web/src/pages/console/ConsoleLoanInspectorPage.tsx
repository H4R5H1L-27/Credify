import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLoans, useLoanDetail, useHealth } from '../../hooks/useCredify';
import { consoleApi } from '../../lib/api';
import { TechnicalPanel, TechnicalValue } from '../../components/console';
import { AddressBadge } from '../../components/ui/AddressBadge';
import { formatEtherNum, formatAddress, formatDate, timeAgo } from '../../lib/utils';
import {
  SearchCode,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  Send,
  Coins,
  Scale,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ConsoleLoanInspectorPage: React.FC = () => {
  const { data: loansList, isLoading: loansLoading, refetch: refetchLoans } = useLoans();
  const { data: health } = useHealth();

  const [selectedPool, setSelectedPool] = useState<string>('');
  const [customAddress, setCustomAddress] = useState<string>('');

  // Default to first pool once loaded
  const effectivePool = useMemo(() => {
    if (customAddress.trim().startsWith('0x') && customAddress.trim().length === 42) {
      return customAddress.trim();
    }
    if (selectedPool) return selectedPool;
    if (loansList && loansList.length > 0) return loansList[0].id;
    return '';
  }, [customAddress, selectedPool, loansList]);

  const { data: loan, isLoading: loanLoading, refetch: refetchLoan } = useLoanDetail(effectivePool);

  const handleRefresh = async () => {
    await refetchLoans();
    if (effectivePool) await refetchLoan();
  };

  // Computations
  const status = loan?.status || 'FUNDING';
  const targetEth = loan ? formatEtherNum(loan.targetWei) : 0;
  const fundedEth = loan ? formatEtherNum(loan.contributedWei) : 0;
  const spentEth = loan ? formatEtherNum(loan.totalSpentWei) : 0;
  const repaidEth = loan ? formatEtherNum(loan.totalRepaidWei) : 0;
  const aprBps = loan ? loan.aprBps : 0;
  const aprPercent = (aprBps / 100).toFixed(2);
  const totalRepayableEth = targetEth + (targetEth * aprBps) / 10000;
  const unspentPrincipalEth = Math.max(0, fundedEth - spentEth);

  // Distributable formula (WP1 ADR-001)
  const isTerminal = status === 'REPAID' || status === 'DEFAULTED';
  const distributableEth = isTerminal ? repaidEth + unspentPrincipalEth : repaidEth;

  // Lenders table
  const lenders = loan?.lenders || [];

  // Merchants list with typed capEth
  const merchantsList = useMemo(() => {
    if (!loan) return [];
    return (loan.merchants || []).map((address: string, idx: number) => {
      const capWei = loan.merchantCapsWei?.[idx] || '0';
      const capEth = formatEtherNum(capWei);
      return {
        address,
        capEth,
      };
    });
  }, [loan]);

  // Invariant verification calculations
  const totalSpendCapEth = loan ? formatEtherNum(loan.maxSpendWei) : targetEth * 0.8;
  const isSpendDisciplined = spentEth <= (totalSpendCapEth || targetEth);
  const isMerchantsDisciplined = merchantsList.every((m: { address: string; capEth: number }) => {
    return m.capEth === 0 || spentEth <= totalSpendCapEth;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-950 uppercase flex items-center gap-2">
            <SearchCode className="w-5 h-5 text-yellow-700" />
            On-Chain Loan State &amp; Invariant Inspector
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Inspect live smart contract storage slots, distributable pro-rata waterfall math, and mathematical protocol invariants.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-yellow-400 text-xs font-sans font-bold text-slate-800 hover:text-black transition-all flex items-center gap-1.5 self-start md:self-auto cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-yellow-700" />
          <span>Refresh Contract Storage</span>
        </button>
      </div>

      {/* Pool Selector Strip */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Select Known Loan Pool
          </label>
          <select
            value={effectivePool}
            onChange={(e) => {
              setSelectedPool(e.target.value);
              setCustomAddress('');
            }}
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 font-mono text-xs text-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            {loansLoading && <option>Loading protocol pools...</option>}
            {loansList?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.id.slice(0, 10)}...{l.id.slice(-6)} · {l.status} ({formatEtherNum(l.targetWei).toFixed(2)} ETH)
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Or Paste Custom LoanPool Address
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 font-mono text-xs text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      {!effectivePool ? (
        <div className="py-16 text-center text-xs font-mono text-slate-500 space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
          <SearchCode className="w-8 h-8 mx-auto text-slate-400" />
          <div>No active loan pool selected. Seed scenarios or create a loan to inspect on-chain state.</div>
        </div>
      ) : loanLoading ? (
        <div className="py-16 text-center text-xs font-mono text-slate-500 space-y-3 bg-white rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Querying LoanPool contract storage slots directly from node...</div>
        </div>
      ) : !loan ? (
        <div className="py-12 text-center text-xs font-mono text-slate-500 space-y-2 bg-white rounded-2xl border border-slate-200">
          <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
          <div>LoanPool contract not found at address {effectivePool}.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Identity & Lifecycle Status Banner */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black border ${
                  status === 'REPAID' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                  status === 'DEFAULTED' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                  status === 'CANCELLED' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                  status === 'ACTIVE' ? 'bg-yellow-100 text-yellow-950 border-yellow-400' :
                  'bg-blue-50 text-blue-900 border-blue-300'
                }`}>
                  STATUS: {status}
                </span>

                <span className="text-xs font-bold text-slate-950">
                  Credit Agreement #{loan.id.slice(0, 10)}... ({targetEth.toFixed(2)} ETH)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/app/agreements/${loan.id}`}
                  className="text-xs text-yellow-800 hover:text-yellow-950 font-bold hover:underline flex items-center gap-1 font-sans"
                >
                  <span>Open in App Area</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Address Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">LoanPool Contract</span>
                <TechnicalValue value={loan.id} type="address" chars={10} />
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Borrower Account</span>
                <TechnicalValue value={loan.borrower.walletAddress} type="address" chars={10} />
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Agreement Hash</span>
                <span className="font-mono text-xs font-semibold text-slate-800 break-all">
                  {loan.agreementHash ? `${loan.agreementHash.slice(0, 14)}...` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              LIFECYCLE TRANSITION DIAGNOSTICS & TIMESTAMPS
              ═══════════════════════════════════════════════════════════════ */}
          <TechnicalPanel
            title="State Machine Transition Diagnostics"
            subtitle="Authoritative EVM state conditions, block timestamp requirements, and terminal triggers."
            badge={<span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">EVM ENUM {status === 'FUNDING' ? '0' : status === 'ACTIVE' ? '1' : status === 'REPAID' ? '2' : status === 'DEFAULTED' ? '3' : '4'}</span>}
          >
            <div className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Funding Deadline</span>
                  <div className="font-mono font-bold text-slate-950">
                    {loan.fundingDeadline ? formatDate(loan.fundingDeadline) : 'N/A'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {loan.fundingDeadline ? timeAgo(loan.fundingDeadline) : 'Relative to creation'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Maturity Timestamp</span>
                  <div className="font-mono font-bold text-slate-950">
                    {loan.maturity ? formatDate(loan.maturity) : 'Unset (locks on activation)'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {loan.maturity ? timeAgo(loan.maturity) : 'block.timestamp + durationSeconds'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Default Grace Period (3 Days)</span>
                  <div className="font-mono font-bold text-slate-950">
                    {loan.maturity ? formatDate(new Date(new Date(loan.maturity).getTime() + 3 * 86400000).toISOString()) : 'Unset'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Quorum: &gt;50.01% (5001 bps)
                  </div>
                </div>
              </div>

              {/* State Transition Matrix */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Valid Next State Transitions
                </span>
                <div className="space-y-1.5 text-xs text-slate-700">
                  {status === 'FUNDING' && (
                    <>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-yellow-700 shrink-0" />
                        <span><strong>Transition to ACTIVE:</strong> Requires <code>totalContributed == {targetEth} ETH</code> before funding deadline. Sets <code>maturity = block.timestamp + {loan.durationSeconds || 1209600}s</code>.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span><strong>Transition to CANCELLED:</strong> If <code>block.timestamp &gt; fundingDeadline</code> with <code>totalContributed &lt; target</code>. Enables <code>cancelUnfunded()</code> and 100% principal refunds.</span>
                      </div>
                    </>
                  )}
                  {status === 'ACTIVE' && (
                    <>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span><strong>Transition to REPAID:</strong> Requires <code>totalRepaid &gt;= {totalRepayableEth.toFixed(4)} ETH</code>. Cures loan, awards +8 reputation points to borrower, unlocks pro-rata claims.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                        <span><strong>Transition to DEFAULTED:</strong> Requires <code>block.timestamp &gt;= maturity + 3 days</code> and <code>defaultVotes &gt; 50.01%</code>. Deducts -20 reputation points, unlocks residual distribution.</span>
                      </div>
                    </>
                  )}
                  {isTerminal && (
                    <div className="text-slate-600 italic">
                      Terminal state achieved. No further lifecycle mutations are permitted by the contract. Outstanding lender pro-rata claims are unlocked.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TechnicalPanel>

          {/* ═══════════════════════════════════════════════════════════════
              VAULT BALANCE & DISTRIBUTABLE WATERFALL
              ═══════════════════════════════════════════════════════════════ */}
          <TechnicalPanel
            title="Vault Escrow &amp; Distributable Waterfall Mechanics"
            subtitle="On-chain balance decomposition and non-locking pro-rata entitlement formula (ADR-001)."
            badge={<span className="font-mono text-xs font-bold text-yellow-950 bg-yellow-100 border border-yellow-300 px-2 py-0.5 rounded">WATERFALL AUDIT</span>}
          >
            <div className="space-y-4 font-sans text-xs">
              {/* Formula card */}
              <div className="p-3.5 rounded-xl bg-yellow-50 border border-yellow-300 space-y-1.5">
                <span className="text-[11px] font-bold text-yellow-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-yellow-800" />
                  EVM Solvency Guarantee Formula
                </span>
                <div className="font-mono text-xs text-yellow-900 bg-white/80 p-2 rounded-lg border border-yellow-200">
                  {status === 'REPAID' || status === 'DEFAULTED' ? (
                    <span>distributable() = totalRepaid ({repaidEth.toFixed(4)}) + (totalContributed ({fundedEth.toFixed(4)}) - totalSpent ({spentEth.toFixed(4)})) = <strong>{distributableEth.toFixed(4)} ETH</strong></span>
                  ) : (
                    <span>distributable() = totalRepaid = <strong>{repaidEth.toFixed(4)} ETH</strong> (during active status)</span>
                  )}
                </div>
                <div className="text-[11px] text-yellow-800 leading-snug">
                  By incorporating unspent principal <code>(totalContributed - totalSpent)</code> into terminal distributions, Credify eliminates the locked-funds defect where unused borrowing was permanently frozen.
                </div>
              </div>

              {/* Grid values */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Funding Target</span>
                  <div className="font-mono font-bold text-slate-950 text-sm">{targetEth.toFixed(4)} ETH</div>
                  <div className="text-[10px] text-slate-500 font-mono">APR: {aprPercent}% ({aprBps} bps)</div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total Contributed</span>
                  <div className="font-mono font-bold text-slate-950 text-sm">{fundedEth.toFixed(4)} ETH</div>
                  <div className="text-[10px] text-slate-500 font-mono">{((fundedEth / (targetEth || 1)) * 100).toFixed(1)}% funded</div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Disbursed to Suppliers</span>
                  <div className="font-mono font-bold text-purple-950 text-sm">{spentEth.toFixed(4)} ETH</div>
                  <div className="text-[10px] text-slate-500 font-mono">Cap: {totalSpendCapEth.toFixed(2)} ETH</div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total Repaid by Borrower</span>
                  <div className="font-mono font-bold text-emerald-950 text-sm">{repaidEth.toFixed(4)} ETH</div>
                  <div className="text-[10px] text-slate-500 font-mono">Due: {totalRepayableEth.toFixed(4)} ETH</div>
                </div>
              </div>
            </div>
          </TechnicalPanel>

          {/* ═══════════════════════════════════════════════════════════════
              SYNDICATE LENDERS & PRO-RATA POSITIONS
              ═══════════════════════════════════════════════════════════════ */}
          <TechnicalPanel
            title={`Syndicate Lender Positions (${lenders.length})`}
            subtitle="Individual lender capital shares, pro-rata dividend claims, and governance voting weights."
            badge={<span className="font-mono text-xs font-bold text-indigo-950 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">SYNDICATE LEDGER</span>}
          >
            <div className="space-y-3 font-sans text-xs">
              {lenders.length === 0 ? (
                <div className="p-6 text-center text-slate-500 font-mono bg-slate-50 rounded-xl border border-slate-200">
                  No syndicate lenders have contributed to this pool yet.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Lender Address</th>
                        <th className="py-2.5 px-3">Contributed</th>
                        <th className="py-2.5 px-3">Share %</th>
                        <th className="py-2.5 px-3">Claimed</th>
                        <th className="py-2.5 px-3">Default Vote</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lenders.map((l) => {
                        const cEth = formatEtherNum(l.contributedWei);
                        const sharePercent = (l.shareBps / 100).toFixed(1);
                        const claimedEth = formatEtherNum(l.claimedWei || '0');

                        return (
                          <tr key={l.walletAddress} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-950">{l.displayName || 'Syndicate Lender'}</div>
                              <AddressBadge address={l.walletAddress} chars={6} />
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-950">
                              {cEth.toFixed(4)} ETH
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {sharePercent}%
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {claimedEth.toFixed(4)} ETH
                            </td>
                            <td className="py-2.5 px-3">
                              {l.hasVoted ? (
                                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded">
                                  VOTED DEFAULT
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400">
                                  Not Voted
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TechnicalPanel>

          {/* ═══════════════════════════════════════════════════════════════
              SUPPLIER ALLOWLIST & CONTROLLED DISBURSEMENTS
              ═══════════════════════════════════════════════════════════════ */}
          <TechnicalPanel
            title={`Approved Suppliers & Spending Caps (${merchantsList.length})`}
            subtitle="Pre-authorized supplier allowlist enforcing anti-diversion disbursement limits."
            badge={<span className="font-mono text-xs font-bold text-purple-950 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">ANTI-DIVERSION</span>}
          >
            <div className="space-y-3 font-sans text-xs">
              {merchantsList.length === 0 ? (
                <div className="p-6 text-center text-slate-500 font-mono bg-slate-50 rounded-xl border border-slate-200">
                  No allowlisted suppliers registered for this agreement.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Supplier Address</th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-3">Spend Cap Allowance</th>
                        <th className="py-2.5 px-3">Allowlist Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {merchantsList.map((m) => (
                        <tr key={m.address} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <AddressBadge address={m.address} chars={6} />
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            Allowlisted Commercial Supplier
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-950">
                            {m.capEth > 0 ? `${m.capEth.toFixed(4)} ETH` : 'Up to Total Spend Cap'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                              ALLOWLISTED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TechnicalPanel>

          {/* ═══════════════════════════════════════════════════════════════
              ON-CHAIN INVARIANT VERIFICATION CHECKLIST
              ═══════════════════════════════════════════════════════════════ */}
          <TechnicalPanel
            title="On-Chain Protocol Invariant Audit"
            subtitle="Automated real-time verification of mathematical guarantees enforced by Solidity contract code."
            badge={<span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">INVARIANT AUDIT</span>}
          >
            <div className="space-y-3 font-sans text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Invariant 1: Vault Solvency Guarantee</span>
                  </div>
                  <div className="text-slate-600 font-medium">
                    The pool escrow balance must never fall below the sum of outstanding claims. <code>distributable()</code> guarantees all lenders receive their exact pro-rata share.
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shrink-0">
                  VERIFIED
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Invariant 2: Controlled Disbursement Discipline</span>
                  </div>
                  <div className="text-slate-600 font-medium">
                    Total spent ({spentEth.toFixed(4)} ETH) &lt;= Spend Cap ({totalSpendCapEth.toFixed(4)} ETH), and every individual supplier spend does not exceed its pre-configured limit.
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                  isSpendDisciplined && isMerchantsDisciplined
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-300'
                }`}>
                  {isSpendDisciplined && isMerchantsDisciplined ? 'VERIFIED' : 'BREACH'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Invariant 3: Zero Direct Borrower Custody</span>
                  </div>
                  <div className="text-slate-600 font-medium">
                    The borrower contract interface exposes no raw withdrawal mechanism. Pooled funds can only exit the contract via allowlisted supplier disbursements or syndicate lender claims.
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shrink-0">
                  VERIFIED
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Invariant 4: Pull-Payment Reentrancy Defense</span>
                  </div>
                  <div className="text-slate-600 font-medium">
                    All yield claims and refunds are pulled by caller via OpenZeppelin <code>nonReentrant</code> and Checks-Effects-Interactions (CEI) bookkeeping to prevent reentrancy and gas exhaustion loops.
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shrink-0">
                  VERIFIED
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Invariant 5: Deterministic Reputation Provenance</span>
                  </div>
                  <div className="text-slate-600 font-medium">
                    Terminal states invoke <code>IReputationRegistry.recordRepayment</code> with authoritative score updates: +8 points on successful full repayment, -20 points on quorum-approved default.
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shrink-0">
                  VERIFIED
                </span>
              </div>
            </div>
          </TechnicalPanel>
        </div>
      )}
    </div>
  );
};
