import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { consoleApi } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TechnicalValue } from './TechnicalValue';
import { ProgressBar } from '../ui/ProgressBar';
import {
  Layers,
  Clock,
  Cpu,
  Hash,
  FileCode,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ExternalLink,
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
      maxWidth="xl"
    >
      {isLoading ? (
        <div className="py-16 text-center text-xs font-mono text-dark-text-muted space-y-3">
          <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Querying local EVM execution client for block header...</div>
        </div>
      ) : !block ? (
        <div className="py-12 text-center text-xs font-mono text-dark-text-muted space-y-2">
          <Layers className="w-8 h-8 mx-auto text-dark-text-muted" />
          <div>Block not found on active provider.</div>
        </div>
      ) : (
        <div className="space-y-6 font-mono text-xs">
          {/* Top Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-[10px] text-dark-text-muted uppercase">Transactions</span>
              <div className="text-base font-bold text-dark-text-primary">
                {block.transactionCount} {block.transactionCount === 1 ? 'tx' : 'txs'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-[10px] text-dark-text-muted uppercase">Gas Utilized</span>
              <div className="text-base font-bold text-dark-text-primary">{gasPercent}%</div>
              <div className="text-[10px] text-dark-text-muted">
                {Number(block.gasUsed).toLocaleString()} / {Number(block.gasLimit).toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-[10px] text-dark-text-muted uppercase">Base Fee</span>
              <div className="text-base font-bold text-brand-400">{baseFeeGwei} Gwei</div>
            </div>

            <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-[10px] text-dark-text-muted uppercase">Block Size</span>
              <div className="text-base font-bold text-dark-text-primary">{block.size} bytes</div>
            </div>
          </div>

          {/* Block Provenance & Identifiers */}
          <div className="p-3.5 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-2.5">
            <div className="text-[11px] font-bold text-dark-text-primary flex items-center justify-between">
              <span>Block Header Provenance</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                EVM FINALIZED
              </span>
            </div>

            <div className="space-y-2 text-[11px] divide-y divide-dark-border-subtle/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
                <span className="text-dark-text-muted">Block Hash:</span>
                <TechnicalValue value={block.hash} type="hash" chars={12} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2">
                <span className="text-dark-text-muted">Parent Hash:</span>
                <TechnicalValue value={block.parentHash} type="hash" chars={12} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2">
                <span className="text-dark-text-muted">Timestamp:</span>
                <span className="text-dark-text-secondary">
                  {block.timestamp} ({new Date(block.timestamp).toLocaleTimeString()})
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2">
                <span className="text-dark-text-muted">Fee Recipient / Miner:</span>
                <TechnicalValue value={block.miner} type="address" chars={8} />
              </div>
            </div>
          </div>

          {/* Included Transactions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-dark-text-primary uppercase tracking-wider">
                Confirmed Transactions ({block.transactions.length})
              </h4>
            </div>

            {block.transactions.length === 0 ? (
              <div className="p-6 rounded-lg bg-dark-bg-3 border border-dark-border-subtle text-center text-dark-text-muted text-[11px]">
                No transactions included in this block (empty block produced by miner).
              </div>
            ) : (
              <div className="border border-dark-border-subtle rounded-lg divide-y divide-dark-border-subtle bg-dark-bg-3 overflow-hidden">
                {block.transactions.map((txHash, idx) => (
                  <div
                    key={txHash}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-dark-bg-2 transition-colors cursor-pointer group"
                    onClick={() => {
                      if (onSelectTx) {
                        onSelectTx(txHash);
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] text-dark-text-muted w-5">#{idx + 1}</span>
                      <TechnicalValue value={txHash} type="hash" chars={10} />
                    </div>

                    <div className="flex items-center gap-2 text-dark-text-muted group-hover:text-brand-400 transition-colors">
                      <span className="text-[10px]">Inspect Details</span>
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
              className="flex items-center gap-1.5 text-[11px] text-dark-text-muted hover:text-dark-text-primary transition-colors font-mono"
            >
              {showRawJson ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>{showRawJson ? 'Hide Raw Block Record' : 'Show Raw JSON-RPC Record'}</span>
            </button>

            {showRawJson && (
              <pre className="mt-2.5 p-3 rounded-lg bg-dark-bg-1 border border-dark-border-subtle text-[10px] overflow-x-auto text-dark-text-secondary leading-relaxed">
                {JSON.stringify(block, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
