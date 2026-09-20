import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { consoleApi } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TechnicalValue } from './TechnicalValue';
import { TransactionStatus } from './TransactionStatus';
import { EventBadge } from './EventBadge';
import {
  ArrowRight,
  Clock,
  Layers,
  Fuel,
  FileCode2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Hash,
  RotateCcw,
  Zap,
} from 'lucide-react';

export interface TransactionDetailModalProps {
  txHash: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock?: (blockNumber: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  txHash,
  isOpen,
  onClose,
  onSelectBlock,
}) => {
  const navigate = useNavigate();
  const [showRawJson, setShowRawJson] = useState(false);
  const [showFullCalldata, setShowFullCalldata] = useState(false);

  const { data: tx, isLoading } = useQuery({
    queryKey: ['console', 'tx', txHash],
    queryFn: () => (txHash ? consoleApi.getTransaction(txHash) : null),
    enabled: Boolean(txHash && isOpen),
  });

  if (!isOpen || !txHash) return null;

  const valueEth = tx && tx.valueWei !== '0' ? (Number(tx.valueWei) / 1e18).toFixed(4) : '0.0000';
  const effectiveGasPriceGwei = tx?.effectiveGasPriceWei ? (Number(tx.effectiveGasPriceWei) / 1e9).toFixed(3) : '0.000';
  const gasUsedNum = tx ? Number(tx.gasUsed) : 0;
  const gasLimitNum = tx ? Number(tx.gas) : 1;
  const gasEfficiencyPercent = gasLimitNum > 0 ? Math.round((gasUsedNum / gasLimitNum) * 100) : 0;
  const totalFeeEth = tx && tx.effectiveGasPriceWei
    ? ((BigInt(tx.gasUsed) * BigInt(tx.effectiveGasPriceWei)) / 1000000000000n).toString()
    : '0';

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Transaction Evidence Chain"
      description={txHash ? `${txHash.slice(0, 18)}...${txHash.slice(-10)}` : ''}
      maxWidth="xl"
    >
      {isLoading ? (
        <div className="py-16 text-center text-xs font-mono text-dark-text-muted space-y-3">
          <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Retrieving authoritative receipt &amp; event logs from local EVM...</div>
        </div>
      ) : !tx ? (
        <div className="py-12 text-center text-xs font-mono text-dark-text-muted space-y-2">
          <Layers className="w-8 h-8 mx-auto text-dark-text-muted" />
          <div>Transaction receipt not found or pending in local mempool.</div>
        </div>
      ) : (
        <div className="space-y-6 font-mono text-xs">
          {/* Primary Execution Status & Route Banner */}
          <div className="p-4 rounded-xl bg-dark-bg-3 border border-dark-border-subtle space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TransactionStatus
                  status={tx.status === 'SUCCESS' ? 'CONFIRMED' : tx.status === 'REVERTED' ? 'REVERTED' : 'PENDING'}
                  size="md"
                />
                <span className="text-dark-text-muted text-[11px]">
                  Block #{tx.blockNumber}
                </span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/console/replay?tx=${tx.hash}`);
                    onClose();
                  }}
                  className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay Tx</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate(`/console/trace?tx=${tx.hash}`);
                    onClose();
                  }}
                  className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Trace Tx</span>
                </button>

                {onSelectBlock && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBlock(tx.blockNumber);
                      onClose();
                    }}
                    className="text-xs text-dark-text-muted hover:text-dark-text-primary flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>Block #{tx.blockNumber}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* From -> To Route Path */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-dark-border-subtle text-[11px]">
              <div className="space-y-1">
                <span className="text-dark-text-muted text-[10px] uppercase">Transaction Initiator (From)</span>
                <div>
                  <TechnicalValue value={tx.from} type="address" chars={8} />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-dark-text-muted text-[10px] uppercase">Target Contract (To)</span>
                <div>
                  {tx.to ? (
                    <TechnicalValue value={tx.to} type="address" chars={8} />
                  ) : (
                    <span className="text-amber-400">Contract Deployment ({tx.contractAddress})</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Value & Gas Accounting Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-[10px] text-dark-text-muted uppercase">ETH Value</span>
              <div className="text-sm font-bold text-dark-text-primary">{valueEth} ETH</div>
              <div className="text-[10px] text-dark-text-muted">{tx.valueWei} wei</div>
            </div>

            <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-[10px] text-dark-text-muted uppercase">Gas Used</span>
              <div className="text-sm font-bold text-dark-text-primary">
                {gasUsedNum.toLocaleString()}
              </div>
              <div className="text-[10px] text-dark-text-muted">{gasEfficiencyPercent}% of limit</div>
            </div>

            <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-[10px] text-dark-text-muted uppercase">Gas Price</span>
              <div className="text-sm font-bold text-brand-400">{effectiveGasPriceGwei} Gwei</div>
            </div>

            <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-[10px] text-dark-text-muted uppercase">Logs Emitted</span>
              <div className="text-sm font-bold text-dark-text-primary">{tx.logsCount} events</div>
            </div>
          </div>

          {/* Emitted Events Timeline */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-dark-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-400" />
                Emitted Event Timeline ({tx.decodedEvents.length})
              </h4>
            </div>

            {tx.decodedEvents.length === 0 ? (
              <div className="p-4 rounded-lg bg-dark-bg-3 border border-dark-border-subtle text-center text-dark-text-muted text-[11px]">
                No contract events emitted during this transaction execution.
              </div>
            ) : (
              <div className="space-y-2">
                {tx.decodedEvents.map((evt, idx) => (
                  <div
                    key={`${evt.eventName}-${idx}`}
                    className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-dark-text-muted">#{idx + 1}</span>
                        <EventBadge eventName={evt.eventName} size="sm" />
                      </div>
                      <TechnicalValue value={evt.contractAddress} type="address" chars={6} label="Contract" />
                    </div>

                    {evt.args && Object.keys(evt.args).length > 0 && (
                      <div className="p-2 rounded bg-dark-bg-2 border border-dark-border-subtle/50 text-[10px] space-y-1">
                        {Object.entries(evt.args).map(([k, v]) => (
                          <div key={k} className="flex items-start justify-between gap-2">
                            <span className="text-dark-text-muted">{k}:</span>
                            <span className="text-dark-text-primary font-mono truncate max-w-[280px]">
                              {String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raw Technical Metadata (Progressive Disclosure) */}
          <div className="p-3.5 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-2">
            <div className="text-[11px] font-bold text-dark-text-primary">
              Authoritative Technical Identifiers
            </div>

            <div className="space-y-1.5 text-[11px] divide-y divide-dark-border-subtle/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
                <span className="text-dark-text-muted">Tx Hash:</span>
                <TechnicalValue value={tx.hash} type="hash" chars={14} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2">
                <span className="text-dark-text-muted">Block Hash:</span>
                <TechnicalValue value={tx.blockHash} type="hash" chars={14} />
              </div>

              <div className="flex items-center justify-between gap-1 pt-2">
                <span className="text-dark-text-muted">Account Nonce:</span>
                <span className="text-dark-text-primary font-bold">{tx.nonce}</span>
              </div>
            </div>
          </div>

          {/* Calldata Input Hex */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-dark-text-primary uppercase">Input Calldata</span>
              <span className="text-[10px] text-dark-text-muted">
                {tx.input.length > 2 ? `${(tx.input.length - 2) / 2} bytes` : '0 bytes (transfer)'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-dark-bg-1 border border-dark-border-subtle text-[10px] break-all leading-relaxed text-dark-text-secondary">
              {showFullCalldata ? tx.input : `${tx.input.slice(0, 130)}${tx.input.length > 130 ? '...' : ''}`}
            </div>

            {tx.input.length > 130 && (
              <button
                type="button"
                onClick={() => setShowFullCalldata(!showFullCalldata)}
                className="text-[10px] text-brand-400 hover:underline"
              >
                {showFullCalldata ? 'Collapse Calldata' : 'Show Complete Calldata Hex'}
              </button>
            )}
          </div>

          {/* Technical JSON Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="flex items-center gap-1.5 text-[11px] text-dark-text-muted hover:text-dark-text-primary transition-colors font-mono"
            >
              {showRawJson ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>{showRawJson ? 'Hide Raw Receipt Payload' : 'Show Complete Receipt JSON'}</span>
            </button>

            {showRawJson && (
              <pre className="mt-2.5 p-3 rounded-lg bg-dark-bg-1 border border-dark-border-subtle text-[10px] overflow-x-auto text-dark-text-secondary leading-relaxed">
                {JSON.stringify(tx, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
