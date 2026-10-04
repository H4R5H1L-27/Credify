import React from 'react';
import type { ActivityEvent } from '@credify/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TechnicalValue } from './TechnicalValue';
import { EventBadge } from './EventBadge';
import { formatEther } from '../../lib/utils';
import {
  Cpu,
  ArrowLeftRight,
  FileCode2,
  GitCommit,
} from 'lucide-react';

export interface EventTraceModalProps {
  event: ActivityEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTx?: (txHash: string) => void;
  onSelectBlock?: (blockNumber: string) => void;
  onSelectContract?: (address: string) => void;
}

export const EventTraceModal: React.FC<EventTraceModalProps> = ({
  event,
  isOpen,
  onClose,
  onSelectTx,
  onSelectBlock,
  onSelectContract,
}) => {
  if (!isOpen || !event) return null;

  // Derive Read Model projection impact explanation based on event type
  const getReadModelProjection = () => {
    switch (event.eventName) {
      case 'Funded':
        return {
          entity: 'Loan Agreement Escrow',
          action: 'Position Recorded & Funding Progress Incremented',
          description: `Lender contribution recorded in read model projection. Increased pool funded balance and updated pro-rata equity shares for the syndicate.`,
          stateImpact: 'FUNDING PROGRESS +',
        };
      case 'LoanActivated':
        return {
          entity: 'Loan Agreement Lifecycle',
          action: 'State Transition: FUNDING → ACTIVE',
          description: `Funding threshold fulfilled. Agreement state transitioned to ACTIVE in the authoritative projection. Supplier spending cap unlocked.`,
          stateImpact: 'STATUS: ACTIVE',
        };
      case 'SpendExecuted':
        return {
          entity: 'Supplier Payment Facility',
          action: 'Merchant Disbursement Recorded',
          description: `Disbursement released to approved supplier. Pool escrow balance decremented and supplier payment history updated.`,
          stateImpact: 'DISBURSED',
        };
      case 'RepaymentReceived':
        return {
          entity: 'Debt Service & Claims Pool',
          action: 'Repayment Applied & Dividends Credited',
          description: `Borrower debt payment credited. Lenders' claimable dividend balances updated proportionally according to initial contribution shares.`,
          stateImpact: 'REPAYMENT RECEIVED',
        };
      case 'LoanRepaid':
        return {
          entity: 'Loan Agreement Lifecycle',
          action: 'State Transition: ACTIVE → REPAID',
          description: `Full principal plus accrued interest satisfied. Agreement finalized as REPAID in projections; positive credit event registered.`,
          stateImpact: 'STATUS: REPAID',
        };
      case 'LoanDefaulted':
        return {
          entity: 'Loan Agreement Lifecycle',
          action: 'State Transition: ACTIVE → DEFAULTED',
          description: `Lender consensus quorum satisfied. Agreement marked DEFAULTED on-chain; borrower credit reputation penalized.`,
          stateImpact: 'STATUS: DEFAULTED',
        };
      case 'VerificationUpdated':
        return {
          entity: 'Institutional Identity Attestation',
          action: event.data?.verified === 'true' ? 'Identity Verified' : 'Verification Revoked',
          description: `KYCRegistry attestation projection synchronized for ${event.actor || 'principal'}. Access granted across protocol facilities.`,
          stateImpact: 'IDENTITY VERIFIED',
        };
      case 'ReputationUpdated':
        return {
          entity: 'Borrower Credit Score & Track Record',
          action: 'Deterministic Score Recalculated',
          description: `Authoritative credit score updated to ${event.data?.score || 50}/100 based on verified agreement outcome (${event.data?.successes || 0} successful, ${event.data?.defaults || 0} defaults).`,
          stateImpact: `SCORE: ${event.data?.score || 50}/100`,
        };
      case 'LoanCreated':
        return {
          entity: 'Loan Syndicate Pool',
          action: 'Factory Instance Discovered & Tracked',
          description: `New LoanPool instance deployed via LoanFactory. Added to indexer monitoring set and exposed in borrower and lender explorers.`,
          stateImpact: 'POOL REGISTERED',
        };
      default:
        return {
          entity: 'Protocol Projection Store',
          action: 'Event Log Indexed',
          description: `EVM event log parsed, indexed, and materialized in memory store for client consumption.`,
          stateImpact: 'INDEXED',
        };
    }
  };

  const projection = getReadModelProjection();

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Event Lineage & Audit Trace"
      description="Deterministic trace pipeline linking EVM block header proof, transaction execution, smart contract bytecode, and read-model state projection."
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Event Header Banner */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <EventBadge eventName={event.eventName} />
              <span className="text-xs text-slate-700 font-bold">
                Block #{event.blockNumber}
              </span>
              <span className="text-slate-300 text-xs">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-slate-950 font-sans font-semibold">
              {event.summary}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Emitted Contract</div>
            <div className="font-bold text-slate-950 text-xs">
              {event.contractName || 'SmartContract'}
            </div>
            {event.contractAddress && (
              <TechnicalValue value={event.contractAddress} type="address" chars={6} />
            )}
          </div>
        </div>

        {/* 5-Layer Trace Pipeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-950 flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-yellow-700" />
              Trace Pipeline Lineage
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-500">
              5-Tier Verification Chain
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Step 1: EVM Block */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#ffe600] text-black border border-yellow-400 flex items-center justify-center text-[10px] font-black">
                    1
                  </span>
                  <span className="font-bold text-slate-950">EVM Block Header Proof</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-bold">
                    Height: #{event.blockNumber}
                  </span>
                </div>
                <div className="text-xs text-slate-600 pl-7 font-sans font-medium">
                  Block timestamp verified on-chain at {event.timestamp}
                </div>
              </div>

              {onSelectBlock && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onSelectBlock(event.blockNumber);
                    onClose();
                  }}
                  className="text-xs shrink-0 self-end sm:self-auto bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-bold"
                  icon={<Cpu className="w-3 h-3 text-yellow-700" />}
                >
                  Inspect Block
                </Button>
              )}
            </div>

            {/* Step 2: Transaction Execution */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#ffe600] text-black border border-yellow-400 flex items-center justify-center text-[10px] font-black">
                    2
                  </span>
                  <span className="font-bold text-slate-950">Transaction Execution</span>
                  <TechnicalValue value={event.transactionHash} type="hash" chars={8} />
                </div>
                <div className="text-xs text-slate-600 pl-7 font-sans font-medium">
                  Initiated by {event.actorName || 'Actor'} ({event.actorRole || 'PRINCIPAL'})
                </div>
              </div>

              {onSelectTx && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onSelectTx(event.transactionHash);
                    onClose();
                  }}
                  className="text-xs shrink-0 self-end sm:self-auto bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-bold"
                  icon={<ArrowLeftRight className="w-3 h-3 text-yellow-700" />}
                >
                  Inspect Tx
                </Button>
              )}
            </div>

            {/* Step 3: Smart Contract Bytecode */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#ffe600] text-black border border-yellow-400 flex items-center justify-center text-[10px] font-black">
                    3
                  </span>
                  <span className="font-bold text-slate-950">Smart Contract Bytecode</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-300 font-bold">
                    {event.contractName || 'Contract'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 pl-7 font-sans font-medium">
                  Address: {event.contractAddress || event.loanId}
                </div>
              </div>

              {onSelectContract && (event.contractAddress || event.loanId) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onSelectContract(event.contractAddress || event.loanId);
                    onClose();
                  }}
                  className="text-xs shrink-0 self-end sm:self-auto bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-bold"
                  icon={<FileCode2 className="w-3 h-3 text-yellow-700" />}
                >
                  Inspect Contract
                </Button>
              )}
            </div>

            {/* Step 4: Decoded Event Emission */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#ffe600] text-black border border-yellow-400 flex items-center justify-center text-[10px] font-black">
                    4
                  </span>
                  <span className="font-bold text-slate-950">Decoded Event Emission</span>
                  <span className="text-xs text-slate-600 font-bold">
                    {Object.keys(event.data || {}).length} Parameters
                  </span>
                </div>
              </div>

              {/* Decoded Parameters Table */}
              <div className="ml-7 border border-slate-200 rounded-xl divide-y divide-slate-200 bg-white overflow-hidden">
                {Object.entries(event.data || {}).map(([key, val]) => {
                  const isAddress = typeof val === 'string' && val.startsWith('0x') && val.length === 42;
                  const isWeiAmount = /amount|total|weight|target/i.test(key) && !isNaN(Number(val)) && Number(val) > 1000000;

                  return (
                    <div key={key} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-500 font-medium">{key}:</span>
                      <div className="text-right">
                        {isAddress ? (
                          <TechnicalValue value={val} type="address" chars={8} />
                        ) : isWeiAmount ? (
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-slate-950 font-mono">
                              {formatEther(val, 4)}
                            </span>
                            <span className="text-slate-500 text-[10px] font-medium">
                              ({val} wei)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-950 font-bold font-mono">
                            {String(val)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 5: Read Model & State Projection */}
            <div className="p-3.5 rounded-xl bg-yellow-50/70 border border-yellow-300 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-black text-[#ffe600] flex items-center justify-center text-[10px] font-black">
                    5
                  </span>
                  <span className="font-bold text-yellow-950">Read Model State Projection</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-200 text-yellow-950 border border-yellow-400">
                  {projection.stateImpact}
                </span>
              </div>

              <div className="pl-7 space-y-1 font-sans">
                <div className="text-xs font-bold text-slate-950">
                  {projection.entity} — {projection.action}
                </div>
                <div className="text-xs text-slate-700 leading-relaxed font-medium">
                  {projection.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={onClose} className="font-sans text-xs font-bold bg-white border-slate-300 text-slate-900 hover:bg-slate-50">
            Close Trace
          </Button>
        </div>
      </div>
    </Modal>
  );
};
