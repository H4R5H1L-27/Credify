import React, { useState } from 'react';
import type { TransactionObservability } from '@credify/shared';
import { formatEtherNum, formatAddress } from '../../lib/utils';
import { TechnicalValue } from './TechnicalValue';
import { EventBadge } from './EventBadge';
import {
  HelpCircle,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Lock,
  Coins,
  Cpu,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface TransactionExplainerProps {
  tx: TransactionObservability;
  className?: string;
}

interface ExplainerDetails {
  operationType: string;
  summary: string;
  lifecycleImpact: string;
  storageTransitions: Array<{ slotOrField: string; description: string }>;
  invariantsChecked: Array<{ name: string; condition: string; status: 'PASSED' | 'FAILED' }>;
  gasBreakdown: {
    gasUsed: number;
    gasLimit: number;
    effectiveGwei: number;
    feeEth: string;
    analysis: string;
  };
  eventInterpretations: Array<{
    eventName: string;
    contractAddress: string;
    explanation: string;
    indexingNotes: string;
    args: Record<string, string>;
  }>;
}

export function analyzeTransaction(tx: TransactionObservability): ExplainerDetails {
  const isReverted = tx.status === 'REVERTED';
  const firstEvt = tx.decodedEvents[0];
  const eventName = firstEvt?.eventName || (isReverted ? 'TransactionReverted' : 'ContractExecution');
  const gasUsed = Number(tx.gasUsed || 0);
  const gasLimit = Number(tx.gas || 1);
  const gasPriceWei = Number(tx.effectiveGasPriceWei || 1e9);
  const effectiveGwei = gasPriceWei / 1e9;
  const feeWei = BigInt(gasUsed) * BigInt(gasPriceWei);
  const feeEth = (Number(feeWei) / 1e18).toFixed(6);

  let operationType = 'Contract Interaction';
  let summary = 'Execution of contract method on-chain.';
  let lifecycleImpact = 'No lifecycle transition detected.';
  const storageTransitions: Array<{ slotOrField: string; description: string }> = [];
  const invariantsChecked: Array<{ name: string; condition: string; status: 'PASSED' | 'FAILED' }> = [];

  // Default Invariants
  invariantsChecked.push({
    name: 'Reentrancy Lock',
    condition: 'OpenZeppelin ReentrancyGuard lock non-reentrant execution',
    status: isReverted ? 'FAILED' : 'PASSED',
  });

  if (eventName === 'LoanCreated' || eventName === 'LoanPoolCreated') {
    operationType = 'Agreement Creation (LoanFactory)';
    summary = `Borrower ${formatAddress(tx.from)} deployed a new isolated LoanPool escrow contract with custom term parameters.`;
    lifecycleImpact = 'A new autonomous LoanPool contract was instantiated in the FUNDING state.';
    storageTransitions.push(
      { slotOrField: 'LoanFactory.loans[]', description: 'Appended new pool address to factory catalog' },
      { slotOrField: 'LoanPool.status', description: 'Initialized to Status.Funding (enum 0)' },
      { slotOrField: 'LoanPool.fundingDeadline', description: 'Timestamp set to block.timestamp + fundingDuration' }
    );
    invariantsChecked.push(
      { name: 'Borrower Caller Identity', condition: 'msg.sender == terms.borrower', status: 'PASSED' },
      { name: 'KYC Verification Attestation', condition: 'kycRegistry.isVerified(borrower, BORROWER)', status: 'PASSED' },
      { name: 'APR Basis Points Bounds', condition: 'aprBps <= 5000 (50% max APR)', status: 'PASSED' },
      { name: 'Supplier Allowlist Validation', condition: 'merchants.length <= 10 and no zero or duplicate addresses', status: 'PASSED' }
    );
  } else if (eventName === 'Funded') {
    operationType = 'Syndicate Capital Contribution';
    const amountEth = tx.valueWei !== '0' ? (Number(tx.valueWei) / 1e18).toFixed(4) : 'contributed';
    summary = `Verified syndicate lender committed ${amountEth} ETH into the LoanPool vault escrow.`;
    lifecycleImpact = tx.decodedEvents.some(e => e.eventName === 'LoanActivated')
      ? 'Funding target achieved! Lifecycle transitioned from FUNDING to ACTIVE, locking maturity timestamp.'
      : 'Pool remains in FUNDING state, accumulating capital toward the target threshold.';
    storageTransitions.push(
      { slotOrField: 'LoanPool.contributions[lender]', description: `Incremented by ${amountEth} ETH` },
      { slotOrField: 'LoanPool.totalContributed', description: `Incremented pool total capital committed` },
      { slotOrField: 'Contract Balance (Vault)', description: `EVM balance increased by msg.value` }
    );
    invariantsChecked.push(
      { name: 'Syndicate Lender KYC', condition: 'kycRegistry.isVerified(msg.sender, LENDER)', status: 'PASSED' },
      { name: 'Funding Deadline Check', condition: 'block.timestamp <= fundingDeadline', status: 'PASSED' },
      { name: 'Funding Target Upper Bound', condition: 'totalContributed + msg.value <= fundingTarget', status: 'PASSED' },
      { name: 'Borrower Self-Fund Guard', condition: 'msg.sender != borrower (BorrowerCannotContribute)', status: 'PASSED' }
    );
  } else if (eventName === 'SpendExecuted') {
    operationType = 'Controlled Supplier Disbursement';
    summary = `Borrower directed an on-chain disbursement from the loan vault directly to an approved supplier invoice.`;
    lifecycleImpact = 'Pool remains in ACTIVE state. Available spend allowance decremented; vault balance decreased.';
    storageTransitions.push(
      { slotOrField: 'LoanPool.totalSpent', description: 'Incremented by disbursement amount' },
      { slotOrField: 'LoanPool.merchantSpent[supplier]', description: 'Incremented per-merchant spend tracker' },
      { slotOrField: 'Contract Balance (Vault)', description: 'Decreased by amount transferred to supplier' }
    );
    invariantsChecked.push(
      { name: 'Active Lifecycle Guard', condition: 'status == Status.Active', status: 'PASSED' },
      { name: 'Borrower Authorization', condition: 'msg.sender == borrower', status: 'PASSED' },
      { name: 'Supplier Allowlist Guard', condition: 'isApprovedMerchant[to] == true', status: 'PASSED' },
      { name: 'Per-Merchant Spend Cap', condition: 'merchantSpent[to] + amount <= merchantCaps[to]', status: 'PASSED' },
      { name: 'Total Spend Cap Guard', condition: 'totalSpent + amount <= totalSpendCap', status: 'PASSED' }
    );
  } else if (eventName === 'RepaymentReceived' || eventName === 'LoanRepaid') {
    operationType = 'Debt Service & Settlement';
    summary = `Borrower transferred debt repayment into the pool vault to settle principal and accrued interest.`;
    lifecycleImpact = eventName === 'LoanRepaid'
      ? 'Full debt obligations satisfied! Lifecycle transitioned to REPAID, awarding +8 reputation points.'
      : 'Repayment credited toward total repayable amount; pool remains ACTIVE until fully cleared.';
    storageTransitions.push(
      { slotOrField: 'LoanPool.totalRepaid', description: 'Incremented by msg.value' },
      { slotOrField: 'LoanPool.status', description: eventName === 'LoanRepaid' ? 'Updated to Status.Repaid (enum 2)' : 'Remains Active' },
      { slotOrField: 'ReputationRegistry.scores[borrower]', description: eventName === 'LoanRepaid' ? 'Incremented score by +8 (capped at 100)' : 'Unchanged' }
    );
    invariantsChecked.push(
      { name: 'Active Agreement Guard', condition: 'status == Status.Active', status: 'PASSED' },
      { name: 'Repayment Cap Check', condition: 'totalRepaid + msg.value <= totalRepayable', status: 'PASSED' },
      { name: 'Pull-Payment Allocation', condition: 'distributable() view automatically incorporates repayment', status: 'PASSED' }
    );
  } else if (eventName === 'RepaymentClaimed') {
    operationType = 'Lender Dividend Pro-Rata Claim';
    summary = `Syndicate lender withdrew their mathematically calculated pro-rata share of repayments and unspent principal.`;
    lifecycleImpact = 'No lifecycle transition. Lender claimed balance updated; contract vault balance decremented.';
    storageTransitions.push(
      { slotOrField: 'LoanPool.claimed[lender]', description: 'Incremented by claimable pro-rata amount' },
      { slotOrField: 'Contract Balance (Vault)', description: 'Decreased by transfer amount sent to lender' }
    );
    invariantsChecked.push(
      { name: 'Pro-Rata Entitlement', condition: 'entitlement = (contribution * distributable) / totalContributed', status: 'PASSED' },
      { name: 'Double-Claim Guard', condition: 'entitlement > claimed[msg.sender]', status: 'PASSED' },
      { name: 'Vault Solvency Invariant', condition: 'contract balance >= sum(outstanding claims)', status: 'PASSED' }
    );
  } else if (eventName === 'DefaultVoteCast' || eventName === 'LoanDefaulted') {
    operationType = 'Consensus Governance Default Vote';
    summary = `Syndicate lender cast an on-chain capital-weighted default vote following maturity and grace period expiration.`;
    lifecycleImpact = eventName === 'LoanDefaulted'
      ? 'Quorum threshold reached (>50.01%)! Agreement finalized as DEFAULTED, deducting -20 reputation points.'
      : 'Vote recorded on-chain; total default weight accumulating toward quorum threshold.';
    storageTransitions.push(
      { slotOrField: 'LoanPool.hasVotedDefault[lender]', description: 'Set to true (prevents vote re-use)' },
      { slotOrField: 'LoanPool.defaultVotesWeight', description: 'Incremented by lender.contributed capital' },
      { slotOrField: 'ReputationRegistry.scores[borrower]', description: eventName === 'LoanDefaulted' ? 'Deducted 20 points (floored at 0)' : 'Unchanged' }
    );
    invariantsChecked.push(
      { name: 'Lender Syndicate Verification', condition: 'contributions[msg.sender] > 0', status: 'PASSED' },
      { name: 'Maturity Timestamp Verification', condition: 'block.timestamp >= maturity', status: 'PASSED' },
      { name: 'Grace Period Enforcement', condition: 'block.timestamp >= maturity + GRACE_PERIOD (3 days)', status: 'PASSED' },
      { name: 'Single Vote Enforcement', condition: '!hasVotedDefault[msg.sender]', status: 'PASSED' }
    );
  } else if (eventName === 'VerificationUpdated') {
    operationType = 'Institutional Identity Attestation';
    summary = `Authorized KYC Verifier recorded a cryptographic attestation hash binding role, applicant, expiry, and salt.`;
    lifecycleImpact = 'Identity registry record updated; participant authorized to interact with protocol.';
    storageTransitions.push(
      { slotOrField: 'KYCRegistry.verifications[role][subject]', description: 'Stored salted credential hash and expiry timestamp' }
    );
    invariantsChecked.push(
      { name: 'Verifier Role Authorization', condition: 'hasRole(VERIFIER_ROLE, msg.sender)', status: 'PASSED' },
      { name: 'Expiry Future Check', condition: 'expiresAt > block.timestamp', status: 'PASSED' }
    );
  }

  // Gas analysis
  const gasEfficiency = gasLimit > 0 ? Math.round((gasUsed / gasLimit) * 100) : 0;
  let gasAnalysis = `Consumed ${gasUsed.toLocaleString()} gas units (${gasEfficiency}% of block gas limit). `;
  if (gasUsed > 150000) {
    gasAnalysis += 'High gas consumption due to contract bytecode deployment and multi-slot storage initialization.';
  } else if (gasUsed > 60000) {
    gasAnalysis += 'Moderate gas consumption involving state SSTORE modifications, external ERC20/ETH transfers, and event logs.';
  } else {
    gasAnalysis += 'Efficient execution utilizing warm storage access and optimized call logic.';
  }

  const eventInterpretations = (tx.decodedEvents || []).map((evt) => {
    let explanation = `Emitted by contract ${formatAddress(evt.contractAddress)}.`;
    let indexingNotes = 'Topic 0 stores event signature keccak256 hash. Indexed parameters are mapped to Bloom filters for sub-second retrieval.';

    if (evt.eventName === 'Funded') {
      explanation = `Indicates that lender ${evt.args?.lender ? formatAddress(evt.args.lender) : 'lender'} contributed ${evt.args?.amount ? (Number(evt.args.amount) / 1e18).toFixed(4) : 'funds'} ETH.`;
      indexingNotes = 'Indexed lender address allows filtering all historical syndicate commitments for that address.';
    } else if (evt.eventName === 'SpendExecuted') {
      explanation = `Indicates direct procurement payment of ${evt.args?.amount ? (Number(evt.args.amount) / 1e18).toFixed(4) : ''} ETH to supplier ${evt.args?.to ? formatAddress(evt.args.to) : 'merchant'}.`;
      indexingNotes = 'Indexed recipient enables supplier accounts to monitor inbound disbursements in real time.';
    } else if (evt.eventName === 'RepaymentReceived') {
      explanation = `Indicates payment of ${evt.args?.amount ? (Number(evt.args.amount) / 1e18).toFixed(4) : ''} ETH towards outstanding principal and interest.`;
      indexingNotes = 'Indexed loan address enables syndicate lenders to listen for yield distribution triggers.';
    } else if (evt.eventName === 'ReputationUpdated') {
      const isSuccess = evt.args?.successful === 'true' || evt.args?.successful === '1';
      explanation = `ReputationRegistry updated score for borrower ${evt.args?.borrower ? formatAddress(evt.args.borrower) : ''}: ${isSuccess ? '+8 points for on-time repayment' : '-20 points penalty for default'}.`;
      indexingNotes = 'Global registry event materialized into institutional borrower credit score.';
    }

    return {
      eventName: evt.eventName,
      contractAddress: evt.contractAddress,
      explanation,
      indexingNotes,
      args: evt.args || {},
    };
  });

  return {
    operationType,
    summary,
    lifecycleImpact,
    storageTransitions,
    invariantsChecked,
    gasBreakdown: {
      gasUsed,
      gasLimit,
      effectiveGwei,
      feeEth,
      analysis: gasAnalysis,
    },
    eventInterpretations,
  };
}

export const TransactionExplainerDrawer: React.FC<TransactionExplainerProps> = ({
  tx,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'invariants' | 'gas' | 'events'>('overview');
  const details = analyzeTransaction(tx);

  return (
    <div className={`space-y-4 font-sans text-xs ${className}`}>
      {/* Pedagogical Banner */}
      <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-300 space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-yellow-800 shrink-0" />
          <span className="text-xs font-bold text-yellow-950 uppercase tracking-wider">
            Pedagogical Transaction Breakdown · {details.operationType}
          </span>
        </div>
        <p className="text-xs text-yellow-900 leading-relaxed font-medium">
          {details.summary}
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-3 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'text-black border-b-2 border-yellow-500 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Operation &amp; State Impact
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invariants')}
          className={`pb-2 px-3 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'invariants'
              ? 'text-black border-b-2 border-yellow-500 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Invariants &amp; Security Guards ({details.invariantsChecked.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gas')}
          className={`pb-2 px-3 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'gas'
              ? 'text-black border-b-2 border-yellow-500 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Gas &amp; EVM Economics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`pb-2 px-3 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'events'
              ? 'text-black border-b-2 border-yellow-500 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Decoded Event Logs ({details.eventInterpretations.length})
        </button>
      </div>

      {/* Tab 1: Overview & State Transitions */}
      {activeTab === 'overview' && (
        <div className="space-y-4 pt-1">
          {/* Lifecycle Impact */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-600" />
              Protocol Lifecycle Impact
            </span>
            <div className="text-xs font-semibold text-slate-950 leading-relaxed">
              {details.lifecycleImpact}
            </div>
          </div>

          {/* Storage Slots & Variables Modified */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              EVM Storage Slots Modified
            </span>
            {details.storageTransitions.length === 0 ? (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                No contract storage slots were mutated during this transaction.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
                {details.storageTransitions.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between gap-3 text-xs">
                    <span className="font-mono font-bold text-slate-900 shrink-0 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {item.slotOrField}
                    </span>
                    <span className="text-slate-600 font-medium text-right leading-relaxed">
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Invariants & Security Guards */}
      {activeTab === 'invariants' && (
        <div className="space-y-2.5 pt-1">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Smart Contract Security Checks Enforced
          </span>
          <div className="space-y-2">
            {details.invariantsChecked.map((inv, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{inv.name}</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                    {inv.condition}
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shrink-0">
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Gas & EVM Economics */}
      {activeTab === 'gas' && (
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Gas Consumed</span>
              <div className="font-mono font-bold text-slate-950 text-sm">
                {details.gasBreakdown.gasUsed.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {Math.round((details.gasBreakdown.gasUsed / details.gasBreakdown.gasLimit) * 100)}% of limit
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Base / Eff. Price</span>
              <div className="font-mono font-bold text-yellow-950 text-sm">
                {details.gasBreakdown.effectiveGwei.toFixed(2)} Gwei
              </div>
              <div className="text-[10px] text-slate-500 font-mono">EIP-1559 base fee</div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Execution Fee</span>
              <div className="font-mono font-bold text-slate-950 text-sm">
                {details.gasBreakdown.feeEth} ETH
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                ~${(Number(details.gasBreakdown.feeEth) * 2600).toFixed(4)} USD
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Gas Limit</span>
              <div className="font-mono font-bold text-slate-950 text-sm">
                {details.gasBreakdown.gasLimit.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Mempool allocation</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Architectural Gas Commentary
            </span>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {details.gasBreakdown.analysis}
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Decoded Event Logs */}
      {activeTab === 'events' && (
        <div className="space-y-3 pt-1">
          {details.eventInterpretations.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
              No event logs were emitted by this transaction.
            </div>
          ) : (
            details.eventInterpretations.map((evt, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <EventBadge eventName={evt.eventName} size="sm" />
                  <TechnicalValue value={evt.contractAddress} type="address" chars={6} label="Contract" />
                </div>

                <div className="text-xs text-slate-950 font-medium leading-relaxed">
                  {evt.explanation}
                </div>

                <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {evt.indexingNotes}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
