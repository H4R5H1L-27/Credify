import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { consoleApi } from '../../lib/api';
import { formatEther } from '../../lib/utils';
import type { TransactionObservability, ActivityEvent } from '@credify/shared';
import {
  TechnicalPanel,
  TechnicalValue,
  TraceNode,
  TraceConnection,
  TracePlayback,
  buildActionTrace,
  type TraceStage,
  type ActionTrace,
  TransactionDetailModal,
  BlockDetailModal,
  ContractInspectorModal,
} from '../../components/console';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Binary,
  Search,
  Layers,
  FileCode2,
  Cpu,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';

export const ConsoleTracePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTx = searchParams.get('tx') || '';

  const [targetTxHash, setTargetTxHash] = useState(initialTx);
  const [selectedTx, setSelectedTx] = useState<string | null>(initialTx || null);

  // Playback state
  const [playbackStep, setPlaybackStep] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Modals
  const [modalTxHash, setModalTxHash] = useState<string | null>(null);
  const [modalBlock, setModalBlock] = useState<string | null>(null);
  const [modalContract, setModalContract] = useState<string | null>(null);
  const [selectedStageEvidence, setSelectedStageEvidence] = useState<TraceStage | null>(null);

  // Fetch recent transactions
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['console', 'transactions'],
    queryFn: () => consoleApi.getTransactions({ limit: 50 }),
    refetchInterval: 5000,
  });

  // Fetch recent events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['console', 'events'],
    queryFn: () => consoleApi.getEvents({ limit: 50 }),
    refetchInterval: 5000,
  });

  // Auto-select first transaction if none selected
  useEffect(() => {
    if (!selectedTx && transactions.length > 0) {
      setSelectedTx(transactions[0].hash);
      setTargetTxHash(transactions[0].hash);
    }
  }, [transactions, selectedTx]);

  // Sync selectedTx with search params
  useEffect(() => {
    if (selectedTx) {
      setSearchParams({ tx: selectedTx }, { replace: true });
    }
  }, [selectedTx]);

  // Find selected transaction and associated event
  const currentTransaction: TransactionObservability | undefined = useMemo(() => {
    if (!selectedTx) return transactions[0];
    return transactions.find((t) => t.hash.toLowerCase() === selectedTx.toLowerCase()) || transactions[0];
  }, [transactions, selectedTx]);

  const currentEvent: ActivityEvent | undefined = useMemo(() => {
    if (!currentTransaction) return undefined;
    return events.find(
      (e) => e.transactionHash.toLowerCase() === currentTransaction.hash.toLowerCase()
    );
  }, [events, currentTransaction]);

  // Build the authoritative 10-stage action trace
  const actionTrace: ActionTrace | null = useMemo(() => {
    if (!currentTransaction) return null;
    return buildActionTrace(currentTransaction, currentEvent);
  }, [currentTransaction, currentEvent]);

  // Auto-step timer during playback
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 1200 / playbackSpeed;
    const timer = setInterval(() => {
      setPlaybackStep((prev) => {
        if (prev >= 10) {
          setIsPlaying(false);
          return 10;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  // Categorize workflows from real transactions
  const workflowPresets = useMemo(() => {
    const presets: Array<{ label: string; txHash: string; eventName: string; isRevert?: boolean }> = [];

    // Search transactions and events for distinctive actions
    const foundEventNames = new Set<string>();

    for (const evt of events) {
      if (!foundEventNames.has(evt.eventName)) {
        foundEventNames.add(evt.eventName);
        let label = evt.eventName;
        if (evt.eventName === 'Funded') label = 'Lender Contribution';
        else if (evt.eventName === 'SpendExecuted') label = 'Supplier Spending';
        else if (evt.eventName === 'RepaymentReceived') label = 'Debt Repayment';
        else if (evt.eventName === 'LoanActivated') label = 'Loan Activation';
        else if (evt.eventName === 'LoanCreated') label = 'Agreement Creation';
        else if (evt.eventName === 'VerificationUpdated') label = 'Identity Attestation';
        else if (evt.eventName === 'ReputationUpdated') label = 'Reputation Score';
        else if (evt.eventName === 'DefaultVoteCast') label = 'Default Vote';

        presets.push({
          label,
          txHash: evt.transactionHash,
          eventName: evt.eventName,
        });
      }
    }

    // Check for a reverted transaction
    const revertedTx = transactions.find((t) => t.status === 'REVERTED');
    if (revertedTx) {
      presets.push({
        label: 'Reverted Execution',
        txHash: revertedTx.hash,
        eventName: 'Revert',
        isRevert: true,
      });
    }

    return presets.slice(0, 7);
  }, [events, transactions]);

  // Handle stage inspection click
  const handleInspectStageEvidence = (stage: TraceStage) => {
    if (!actionTrace) return;
    if (stage.evidenceType === 'TRANSACTION') {
      setModalTxHash(actionTrace.txHash);
    } else if (stage.evidenceType === 'BLOCK') {
      setModalBlock(actionTrace.blockNumber);
    } else if (stage.evidenceType === 'SMART_CONTRACT') {
      setModalContract(actionTrace.targetContract);
    } else {
      setSelectedStageEvidence(stage);
    }
  };

  const handleSelectPreset = (txHash: string) => {
    setSelectedTx(txHash);
    setTargetTxHash(txHash);
    setPlaybackStep(10);
    setIsPlaying(false);
  };

  const handleReplay = () => {
    setPlaybackStep(1);
    setIsPlaying(true);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-dark-text-primary uppercase flex items-center gap-2">
            <Binary className="w-5 h-5 text-brand-400" />
            End-to-End Action Trace Engine
          </h1>
          <p className="text-xs text-dark-text-secondary mt-0.5">
            Connects real participant actions through wallet custody, EVM bytecode, block proofs, and backend synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReplay}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
          >
            Replay Trace
          </Button>
        </div>
      </div>

      {/* Quick Workflow Preset Bar */}
      <div className="p-3.5 bg-dark-bg-2 border border-dark-border-subtle rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <span className="text-[11px] font-bold uppercase text-dark-text-muted flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-brand-400" />
            Verified Protocol Workflow Presets
          </span>

          {/* Search Tx Hash */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-dark-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={targetTxHash}
              onChange={(e) => {
                setTargetTxHash(e.target.value);
                if (e.target.value.startsWith('0x') && e.target.value.length === 66) {
                  setSelectedTx(e.target.value);
                  setPlaybackStep(10);
                  setIsPlaying(false);
                }
              }}
              placeholder="Paste 0x... EVM transaction hash"
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-dark-bg-3 border border-dark-border-subtle rounded-md text-dark-text-primary placeholder:text-dark-text-muted focus:outline-none focus:border-brand-500/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {workflowPresets.map((p) => {
            const isSelected = selectedTx?.toLowerCase() === p.txHash.toLowerCase();
            return (
              <button
                key={p.txHash + p.eventName}
                type="button"
                onClick={() => handleSelectPreset(p.txHash)}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? p.isRevert
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-brand-500 text-white font-bold'
                    : 'bg-dark-bg-3 border border-dark-border-subtle text-dark-text-secondary hover:text-dark-text-primary'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Playback Controls Toolbar */}
      <TracePlayback
        currentStep={playbackStep}
        totalSteps={10}
        isPlaying={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onStepForward={() => setPlaybackStep((p) => Math.min(10, p + 1))}
        onStepBack={() => setPlaybackStep((p) => Math.max(1, p - 1))}
        onReset={handleReplay}
        onJumpToStep={(step) => {
          setPlaybackStep(step);
          setIsPlaying(false);
        }}
        speed={playbackSpeed}
        onChangeSpeed={(s) => setPlaybackSpeed(s)}
        stepName={actionTrace?.stages[playbackStep - 1]?.name}
      />

      {/* Action Trace Banner */}
      {actionTrace && (
        <div className="p-4 rounded-xl bg-dark-bg-2 border border-dark-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-dark-text-primary text-sm">
                {actionTrace.title}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                  actionTrace.isReverted
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {actionTrace.isReverted ? '0x0 REVERTED' : '0x1 CONFIRMED'}
              </span>
            </div>
            <div className="text-[11px] text-dark-text-secondary font-sans">
              Initiated by {actionTrace.actorAddress} → Target contract {actionTrace.contractName} ({actionTrace.targetContract.slice(0, 10)}...)
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-dark-text-muted self-end md:self-auto shrink-0">
            <div>
              <span className="text-dark-text-muted">Block: </span>
              <button
                onClick={() => setModalBlock(actionTrace.blockNumber)}
                className="text-brand-400 font-bold hover:underline"
              >
                #{actionTrace.blockNumber}
              </button>
            </div>
            <div>
              <span className="text-dark-text-muted">Tx: </span>
              <button
                onClick={() => setModalTxHash(actionTrace.txHash)}
                className="text-brand-400 font-bold hover:underline"
              >
                {actionTrace.txHash.slice(0, 10)}...
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10-Stage Action Trace Progression Timeline */}
      <TechnicalPanel
        title="Authoritative 10-Stage Execution Lifecycle"
        subtitle="Complete chronological trail linking user intent, cryptographic signature, EVM execution, and projection update."
        badge={
          <span className="font-mono text-[10px] text-brand-400">
            STAGE {playbackStep} / 10
          </span>
        }
      >
        <div className="space-y-0 py-2">
          {actionTrace?.stages.map((stage, index) => {
            // Determine dynamic status based on playback position
            let dynamicStatus = stage.status;
            const isCurrent = stage.stageNumber === playbackStep;

            if (stage.stageNumber > playbackStep) {
              dynamicStatus = 'IDLE';
            } else if (stage.stageNumber === playbackStep) {
              dynamicStatus = stage.status === 'FAILED' ? 'FAILED' : 'ACTIVE';
            } else {
              dynamicStatus = stage.status;
            }

            const nextStage = actionTrace.stages[index + 1];
            let nextDynamicStatus = nextStage?.status || 'IDLE';
            if (nextStage && nextStage.stageNumber > playbackStep) {
              nextDynamicStatus = 'IDLE';
            }

            const isFailureBranch = stage.status === 'FAILED' || nextStage?.status === 'SKIPPED';

            return (
              <React.Fragment key={stage.id}>
                {/* Stage Node */}
                <TraceNode
                  stage={{ ...stage, status: dynamicStatus }}
                  isCurrentStep={isCurrent}
                  onInspectEvidence={handleInspectStageEvidence}
                />

                {/* Connection to Next Stage */}
                {index < actionTrace.stages.length - 1 && (
                  <TraceConnection
                    fromStatus={dynamicStatus}
                    toStatus={nextDynamicStatus}
                    isFailureBranch={isFailureBranch && actionTrace.isReverted}
                    label={
                      index === 1
                        ? 'Zod Validation OK'
                        : index === 2
                        ? 'Signed Payload'
                        : index === 3
                        ? 'eth_sendRawTransaction'
                        : index === 4
                        ? actionTrace.isReverted ? 'EVM Revert' : 'State Mutation'
                        : index === 5
                        ? 'Block Receipt'
                        : index === 6
                        ? 'Event Topic'
                        : index === 7
                        ? 'ABI Log Decoded'
                        : index === 8
                        ? 'Read Model Updated'
                        : undefined
                    }
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </TechnicalPanel>

      {/* Stage Evidence Modal */}
      {selectedStageEvidence && (
        <Modal
          open={Boolean(selectedStageEvidence)}
          onClose={() => setSelectedStageEvidence(null)}
          title={`Stage ${selectedStageEvidence.stageNumber} Technical Evidence: ${selectedStageEvidence.name}`}
          description={selectedStageEvidence.layer}
          maxWidth="lg"
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3.5 rounded-lg bg-dark-bg-3 border border-dark-border-subtle space-y-1">
              <span className="text-[10px] text-dark-text-muted uppercase">Stage Summary</span>
              <div className="text-xs text-dark-text-primary font-sans leading-relaxed">
                {selectedStageEvidence.summary}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-dark-text-primary">
                Captured Evidence Key-Values
              </span>
              <div className="border border-dark-border-subtle rounded-lg divide-y divide-dark-border-subtle bg-dark-bg-3 overflow-hidden">
                {Object.entries(selectedStageEvidence.details || {}).map(([k, v]) => (
                  <div key={k} className="p-2.5 flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-dark-text-muted">{k}:</span>
                    <span className="text-dark-text-primary font-bold truncate max-w-[320px]">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-dark-border-subtle">
              <Button variant="outline" size="sm" onClick={() => setSelectedStageEvidence(null)}>
                Close Evidence
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        txHash={modalTxHash}
        isOpen={Boolean(modalTxHash)}
        onClose={() => setModalTxHash(null)}
        onSelectBlock={(b) => setModalBlock(b)}
      />

      {/* Block Detail Modal */}
      <BlockDetailModal
        blockNumberOrHash={modalBlock}
        isOpen={Boolean(modalBlock)}
        onClose={() => setModalBlock(null)}
        onSelectTx={(t) => setModalTxHash(t)}
      />

      {/* Contract Inspector Modal */}
      <ContractInspectorModal
        address={modalContract}
        isOpen={Boolean(modalContract)}
        onClose={() => setModalContract(null)}
        onSelectTx={(t) => setModalTxHash(t)}
      />
    </div>
  );
};
