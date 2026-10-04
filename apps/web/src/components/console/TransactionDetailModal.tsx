import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { consoleApi } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { TechnicalValue } from './TechnicalValue';
import { TransactionStatus } from './TransactionStatus';
import { EventBadge } from './EventBadge';
import {
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronRight,
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

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Transaction Evidence Chain"
      description={txHash ? `${txHash.slice(0, 18)}...${txHash.slice(-10)}` : ''}
      maxWidth="2xl"
    >
      {isLoading ? (
        <div className="py-16 text-center text-xs font-mono text-slate-500 space-y-3 font-medium">
          <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Retrieving authoritative receipt &amp; event logs from local EVM...</div>
        </div>
      ) : !tx ? (
        <div className="py-12 text-center text-xs font-mono text-slate-500 space-y-2 font-medium">
          <Layers className="w-8 h-8 mx-auto text-slate-400" />
          <div>Transaction receipt not found or pending in local mempool.</div>
        </div>
      ) : (
        <div className="space-y-6 font-mono text-xs">
          {/* Primary Execution Status & Route Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TransactionStatus
                  status={tx.status === 'SUCCESS' ? 'CONFIRMED' : tx.status === 'REVERTED' ? 'REVERTED' : 'PENDING'}
                  size="md"
                />
                <span className="text-slate-600 text-xs font-bold">
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
                  className="text-xs text-yellow-800 hover:text-yellow-950 font-bold flex items-center gap-1 cursor-pointer"
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
                  className="text-xs text-yellow-800 hover:text-yellow-950 font-bold flex items-center gap-1 cursor-pointer"
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
                    className="text-xs text-slate-600 hover:text-slate-950 font-semibold flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>Block #{tx.blockNumber}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* From -> To Route Path */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Transaction Initiator (From)</span>
                <div>
                  <TechnicalValue value={tx.from} type="address" chars={8} />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Target Contract (To)</span>
                <div>
                  {tx.to ? (
                    <TechnicalValue value={tx.to} type="address" chars={8} />
                  ) : (
                    <span className="text-amber-800 font-bold">Contract Deployment ({tx.contractAddress})</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Value & Gas Accounting Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">ETH Value</span>
              <div className="text-sm font-black text-slate-950">{valueEth} ETH</div>
              <div className="text-[10px] text-slate-600 font-medium">{tx.valueWei} wei</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Gas Used</span>
              <div className="text-sm font-black text-slate-950">
                {gasUsedNum.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-600 font-medium">{gasEfficiencyPercent}% of limit</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Gas Price</span>
              <div className="text-sm font-black text-yellow-950">{effectiveGasPriceGwei} Gwei</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Logs Emitted</span>
              <div className="text-sm font-black text-slate-950">{tx.logsCount} events</div>
            </div>
          </div>

          {/* Emitted Events Timeline */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-yellow-700" />
                Emitted Event Timeline ({tx.decodedEvents.length})
              </h4>
            </div>

            {tx.decodedEvents.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs font-medium">
                No contract events emitted during this transaction execution.
              </div>
            ) : (
              <div className="space-y-2">
                {tx.decodedEvents.map((evt, idx) => (
                  <div
                    key={`${evt.eventName}-${idx}`}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-bold">#{idx + 1}</span>
                        <EventBadge eventName={evt.eventName} size="sm" />
                      </div>
                      <TechnicalValue value={evt.contractAddress} type="address" chars={6} label="Contract" />
                    </div>

                    {evt.args && Object.keys(evt.args).length > 0 && (
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                        {Object.entries(evt.args).map(([k, v]) => (
                          <div key={k} className="flex items-start justify-between gap-3">
                            <span className="text-slate-500 font-medium shrink-0">{k}:</span>
                            <span className="text-slate-950 font-bold font-mono text-right break-all">
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

          {/* Raw Technical Metadata */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-950">
              Authoritative Technical Identifiers
            </div>

            <div className="space-y-1.5 text-xs divide-y divide-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
                <span className="text-slate-500 font-medium">Tx Hash:</span>
                <TechnicalValue value={tx.hash} type="hash" chars={14} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2">
                <span className="text-slate-500 font-medium">Block Hash:</span>
                <TechnicalValue value={tx.blockHash} type="hash" chars={14} />
              </div>

              <div className="flex items-center justify-between gap-1 pt-2">
                <span className="text-slate-500 font-medium">Account Nonce:</span>
                <span className="text-slate-950 font-bold">{tx.nonce}</span>
              </div>
            </div>
          </div>

          {/* Calldata Input Hex */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-950 uppercase">Input Calldata</span>
              <span className="text-[10px] text-slate-500 font-medium">
                {tx.input.length > 2 ? `${(tx.input.length - 2) / 2} bytes` : '0 bytes (transfer)'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs break-all leading-relaxed text-slate-800 font-mono">
              {showFullCalldata ? tx.input : `${tx.input.slice(0, 130)}${tx.input.length > 130 ? '...' : ''}`}
            </div>

            {tx.input.length > 130 && (
              <button
                type="button"
                onClick={() => setShowFullCalldata(!showFullCalldata)}
                className="text-xs text-yellow-800 hover:text-yellow-950 font-bold underline cursor-pointer"
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
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-950 font-bold transition-colors font-mono cursor-pointer"
            >
              {showRawJson ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>{showRawJson ? 'Hide Raw Receipt Payload' : 'Show Complete Receipt JSON'}</span>
            </button>

            {showRawJson && (
              <pre className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] overflow-x-auto text-slate-800 font-mono leading-relaxed">
                {JSON.stringify(tx, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
