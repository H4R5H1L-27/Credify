import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { consoleApi } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { TechnicalValue } from './TechnicalValue';
import {
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export interface BlockDetailModalProps {
  blockNumberOrHash: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTx?: (txHash: string) => void;
}

export const BlockDetailModal: React.FC<BlockDetailModalProps> = ({
  blockNumberOrHash,
  isOpen,
  onClose,
  onSelectTx,
}) => {
  const [showRawJson, setShowRawJson] = useState(false);

  const { data: block, isLoading } = useQuery({
    queryKey: ['console', 'block', blockNumberOrHash],
    queryFn: () => (blockNumberOrHash ? consoleApi.getBlock(blockNumberOrHash) : null),
    enabled: Boolean(blockNumberOrHash && isOpen),
  });

  if (!isOpen || !blockNumberOrHash) return null;

  const gasUsedBig = block ? BigInt(block.gasUsed) : 0n;
  const gasLimitBig = block ? BigInt(block.gasLimit) : 1n;
  const gasPercent = block && gasLimitBig > 0n ? Math.min(100, Number((gasUsedBig * 100n) / gasLimitBig)) : 0;
  const baseFeeGwei = block?.baseFeePerGas ? (Number(block.baseFeePerGas) / 1e9).toFixed(4) : '0.0000';

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Block #${block?.number ?? blockNumberOrHash}`}
      description="Authoritative EVM block header and confirmed transaction receipts"
      maxWidth="2xl"
    >
      {isLoading ? (
        <div className="py-16 text-center text-xs font-mono text-slate-500 space-y-3 font-medium">
          <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Querying local EVM execution client for block header...</div>
        </div>
      ) : !block ? (
        <div className="py-12 text-center text-xs font-mono text-slate-500 space-y-2 font-medium">
          <Layers className="w-8 h-8 mx-auto text-slate-400" />
          <div>Block not found on active provider.</div>
        </div>
      ) : (
        <div className="space-y-6 font-mono text-xs">
          {/* Top Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Transactions</span>
              <div className="text-base font-black text-slate-950">
                {block.transactionCount} {block.transactionCount === 1 ? 'tx' : 'txs'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Gas Utilized</span>
              <div className="text-base font-black text-slate-950">{gasPercent}%</div>
              <div className="text-[10px] text-slate-600 font-medium">
                {Number(block.gasUsed).toLocaleString()} / {Number(block.gasLimit).toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Base Fee</span>
              <div className="text-base font-black text-yellow-950">{baseFeeGwei} Gwei</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Block Size</span>
              <div className="text-base font-black text-slate-950">{block.size} bytes</div>
            </div>
          </div>

          {/* Block Provenance & Identifiers */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-950 flex items-center justify-between">
              <span>Block Header Provenance</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-50 border border-emerald-300 text-emerald-800">
                EVM FINALIZED
              </span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
                <span className="text-slate-500 font-medium">Block Hash:</span>
                <TechnicalValue value={block.hash} type="hash" chars={12} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2">
                <span className="text-slate-500 font-medium">Parent Hash:</span>
                <TechnicalValue value={block.parentHash} type="hash" chars={12} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2">
                <span className="text-slate-500 font-medium">Timestamp:</span>
                <span className="text-slate-800 font-bold font-mono">
                  {block.timestamp} ({new Date(block.timestamp).toLocaleTimeString()})
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2">
                <span className="text-slate-500 font-medium">Fee Recipient / Miner:</span>
                <TechnicalValue value={block.miner} type="address" chars={8} />
              </div>
            </div>
          </div>

          {/* Included Transactions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                Confirmed Transactions ({block.transactions.length})
              </h4>
            </div>

            {block.transactions.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs font-medium">
                No transactions included in this block (empty block produced by miner).
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 bg-white overflow-hidden">
                {block.transactions.map((txHash, idx) => (
                  <div
                    key={txHash}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-yellow-50/40 transition-colors cursor-pointer group"
                    onClick={() => {
                      if (onSelectTx) {
                        onSelectTx(txHash);
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] text-slate-500 font-bold w-5">#{idx + 1}</span>
                      <TechnicalValue value={txHash} type="hash" chars={10} />
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 group-hover:text-yellow-800 font-bold transition-colors">
                      <span className="text-xs">Inspect Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
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
              <span>{showRawJson ? 'Hide Raw Block Record' : 'Show Raw JSON-RPC Record'}</span>
            </button>

            {showRawJson && (
              <pre className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] overflow-x-auto text-slate-800 font-mono leading-relaxed">
                {JSON.stringify(block, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
