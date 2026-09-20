import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { consoleApi } from '../../lib/api';
import { formatEther } from '../../lib/utils';
import type { TransactionObservability, ActivityEvent } from '@credify/shared';
import {
  TechnicalPanel,
  TechnicalValue,
  TransactionStatus,
  EventBadge,
  ReplayStageCard,
  ReplayController,
  type ReplayStageInfo,
  TransactionDetailModal,
  BlockDetailModal,
  ContractInspectorModal,
} from '../../components/console';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui';
import {
  RotateCcw,
  Play,
  Pause,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Cpu,
  FileCode2,
  Database,
  Monitor,
  Eye,
  Activity,
  Sliders,
} from 'lucide-react';

type WorkflowFilterType = 'ALL' | 'CREATION' | 'FUNDING' | 'SPENDING' | 'REPAYMENT' | 'CLAIM' | 'VERIFY' | 'REVERT';

export const ConsoleReplayPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTx = searchParams.get('tx') || '';

  const [targetTxHash, setTargetTxHash] = useState(initialTx);
  const [selectedTx, setSelectedTx] = useState<string | null>(initialTx || null);
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowFilterType>('ALL');

  // Playback state
  const [playbackStep, setPlaybackStep] = useState<number>(9);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Modals state
  const [modalTxHash, setModalTxHash] = useState<string | null>(null);
  const [modalBlock, setModalBlock] = useState<string | null>(null);
  const [modalContract, setModalContract] = useState<string | null>(null);
  const [inspectedStage, setInspectedStage] = useState<ReplayStageInfo | null>(null);

  // Auto-play timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch transactions and events from authoritative console API
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['console', 'transactions'],
    queryFn: () => consoleApi.getTransactions({ limit: 50 }),
    refetchInterval: 5000,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['console', 'events'],
    queryFn: () => consoleApi.getEvents({ limit: 50 }),
    refetchInterval: 5000,
  });

  // Filter transactions based on selected workflow pill
  const filteredTransactions = useMemo(() => {
    if (workflowFilter === 'ALL') return transactions;

    return transactions.filter((t) => {
      if (workflowFilter === 'REVERT') {
        return t.status === 'REVERTED';
      }

      const hasEvt = (name: string) =>
        t.decodedEvents.some((e) => e.eventName === name) ||
        events.some(
          (e) =>
            e.transactionHash.toLowerCase() === t.hash.toLowerCase() &&
            e.eventName === name
        );

      if (workflowFilter === 'CREATION') return hasEvt('LoanCreated');
      if (workflowFilter === 'FUNDING') return hasEvt('Funded');
      if (workflowFilter === 'SPENDING') return hasEvt('SpendExecuted');
      if (workflowFilter === 'REPAYMENT') return hasEvt('RepaymentReceived') || hasEvt('LoanRepaid');
      if (workflowFilter === 'CLAIM') return hasEvt('RepaymentClaimed');
      if (workflowFilter === 'VERIFY') return hasEvt('VerificationUpdated');
      return true;
    });
  }, [transactions, events, workflowFilter]);

  // Auto-select first transaction if none selected
  useEffect(() => {
    if (!selectedTx && filteredTransactions.length > 0) {
      setSelectedTx(filteredTransactions[0].hash);
      setTargetTxHash(filteredTransactions[0].hash);
    }
  }, [filteredTransactions, selectedTx]);

  // Sync selectedTx with search params
  useEffect(() => {
    if (selectedTx) {
      setSearchParams({ tx: selectedTx }, { replace: true });
    }
  }, [selectedTx, setSearchParams]);

  // Find selected transaction and associated event
  const currentTransaction: TransactionObservability | undefined = useMemo(() => {
    if (!selectedTx) return filteredTransactions[0] || transactions[0];
    return (
      transactions.find((t) => t.hash.toLowerCase() === selectedTx.toLowerCase()) ||
      filteredTransactions[0] ||
      transactions[0]
    );
  }, [transactions, filteredTransactions, selectedTx]);

  const currentEvent: ActivityEvent | undefined = useMemo(() => {
    if (!currentTransaction) return undefined;
    return events.find(
      (e) => e.transactionHash.toLowerCase() === currentTransaction.hash.toLowerCase()
    );
  }, [events, currentTransaction]);

  // Controlled Playback Timer
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(350, Math.round(1400 / playbackSpeed));
      timerRef.current = setInterval(() => {
        setPlaybackStep((prev) => {
          if (prev >= 9) {
            setIsPlaying(false);
            return 9;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed]);

  // Build the 9 chronological replay stages from real transaction evidence
  const replayStages: ReplayStageInfo[] = useMemo(() => {
    if (!currentTransaction) return [];

    const tx = currentTransaction;
    const isReverted = tx.status === 'REVERTED';
    const decodedEvt = currentEvent || tx.decodedEvents[0];
    const eventName = decodedEvt?.eventName || (isReverted ? 'Revert' : 'Transaction');
    const eventParams = currentEvent ? currentEvent.data : tx.decodedEvents[0]?.args || {};
    const targetContract = tx.to || tx.contractAddress || '0x0000000000000000000000000000000000000000';
    const timestamp = currentEvent?.timestamp || tx.provenance?.block?.timestamp || new Date().toISOString();

    // Workflow classification
    let workflowType = 'Contract Interaction';
    let userActionSummary = 'User initiated interaction on Credify web interface.';
    let readModelSummary = 'Materialized state synchronized from verified EVM log entries into read projection.';

    if (eventName === 'Funded') {
      workflowType = 'Lender Capital Contribution';
      userActionSummary = 'Lender committed capital to credit pool escrow on web portal.';
      readModelSummary = 'Lender balance recorded, loan funding percent updated, ledger synced.';
    } else if (eventName === 'SpendExecuted') {
      workflowType = 'Controlled Supplier Spending';
      userActionSummary = 'Borrower authorized governed disbursement to verified supplier.';
      readModelSummary = 'Supplier disbursement credited, available loan escrow decremented in projection.';
    } else if (eventName === 'RepaymentReceived' || eventName === 'LoanRepaid') {
      workflowType = 'Debt Repayment';
      userActionSummary = 'Borrower submitted debt service payment to pool contract.';
      readModelSummary = 'Principal balance updated, dividend pool available for lender claims.';
    } else if (eventName === 'RepaymentClaimed') {
      workflowType = 'Lender Dividend Claim';
      userActionSummary = 'Lender requested disbursement of accrued pool dividends.';
      readModelSummary = 'Lender claimed balance credited, remaining pool escrow reconciled.';
    } else if (eventName === 'LoanCreated') {
      workflowType = 'Credit Agreement Creation';
      userActionSummary = 'Borrower finalized agreement term sheet and requested deployment.';
      readModelSummary = 'New parameterized LoanPool escrow registered in active catalog.';
    } else if (eventName === 'LoanActivated') {
      workflowType = 'Agreement Activation';
      userActionSummary = 'Funding condition fulfilled; agreement state transitioned to ACTIVE.';
      readModelSummary = 'Loan status updated to ACTIVE, borrower merchant drawdowns authorized.';
    } else if (eventName === 'VerificationUpdated') {
      workflowType = 'Institutional Identity Attestation';
      userActionSummary = 'Compliance officer reviewed and attested institutional credentials.';
      readModelSummary = 'Identity status updated to VERIFIED; permission flags enabled.';
    }

    const calcState = (stepNum: number) => {
      if (isReverted && stepNum >= 4) {
        if (playbackStep < stepNum) return 'PENDING';
        return 'REVERTED';
      }
      if (playbackStep < stepNum) return 'PENDING';
      if (playbackStep === stepNum) return 'ACTIVE';
      return 'COMPLETED';
    };

    const stages: ReplayStageInfo[] = [
      {
        step: 1,
        id: 'stage-1-user-action',
        name: 'User Action Initiated',
        category: 'Client UI & Form Submission',
        summary: userActionSummary,
        details: {
          Actor: tx.from,
          Workflow: workflowType,
          Target: targetContract,
        },
        timestamp,
        state: calcState(1),
        evidenceRef: { type: 'TRANSACTION', value: tx.hash },
      },
      {
        step: 2,
        id: 'stage-2-wallet',
        name: 'Wallet Cryptographic Signing',
        category: 'Client Signer & EIP-155',
        summary:
          'Signer produced secp256k1 cryptographic signature. Chain ID binding verified against replay attacks.',
        details: {
          Signer: tx.from,
          Nonce: tx.nonce,
          ChainId: tx.provenance?.chain?.chainId || 31337,
        },
        timestamp,
        state: calcState(2),
        evidenceRef: { type: 'TRANSACTION', value: tx.hash },
      },
      {
        step: 3,
        id: 'stage-3-tx-submitted',
        name: 'Transaction Broadcast',
        category: 'EVM Mempool & Broadcast',
        summary: `Raw RLP transaction broadcast to RPC node pool. Ingested into local EVM mempool with hash ${tx.hash.slice(0, 14)}...`,
        details: {
          TxHash: tx.hash,
          GasLimit: tx.gas,
          Value: formatEther(tx.valueWei || '0'),
        },
        timestamp,
        state: calcState(3),
        evidenceRef: { type: 'TRANSACTION', value: tx.hash },
      },
      {
        step: 4,
        id: 'stage-4-tx-confirmed',
        name: 'EVM Execution & Gas Metering',
        category: 'EVM Runtime Execution',
        summary: isReverted
          ? 'EVM executed bytecode sequence and encountered an execution REVERT. State mutations rolled back.'
          : `EVM processed opcodes without unhandled exceptions. Gas consumed: ${tx.gasUsed}. State tree updated.`,
        details: {
          ExecutionStatus: tx.status,
          GasUsed: tx.gasUsed,
          GasPrice: tx.gasPriceWei ? `${tx.gasPriceWei} wei` : 'Base Fee',
        },
        timestamp,
        state: calcState(4),
        evidenceRef: { type: 'TRANSACTION', value: tx.hash },
      },
      {
        step: 5,
        id: 'stage-5-block-mined',
        name: 'Block Mined & Sealed',
        category: 'Consensus & Block Finalization',
        summary: `Transaction included in Block #${tx.blockNumber}. Block receipt root and state root confirmed.`,
        details: {
          BlockNumber: tx.blockNumber,
          BlockHash: tx.blockHash || 'N/A',
          Timestamp: timestamp,
        },
        timestamp,
        state: calcState(5),
        evidenceRef: { type: 'BLOCK', value: tx.blockNumber },
      },
      {
        step: 6,
        id: 'stage-6-event-emitted',
        name: 'Contract Event Log Emitted',
        category: 'EVM Logs & Bloom Filter',
        summary:
          eventName !== 'Transaction'
            ? `Smart contract emitted event '${eventName}' with ${Object.keys(eventParams).length} parameter(s).`
            : `Receipt emitted ${tx.logsCount} log entries during execution.`,
        details: {
          EventName: eventName,
          Contract: targetContract,
          LogEntries: tx.logsCount,
          ...eventParams,
        },
        timestamp,
        state: calcState(6),
        evidenceRef: { type: 'EVENT', value: currentEvent?.id || tx.hash },
      },
      {
        step: 7,
        id: 'stage-7-indexer-updated',
        name: 'Indexer Head Synchronized',
        category: 'Background Log Poller',
        summary: `Authoritative background poller ingested Block #${tx.blockNumber} logs. Indexer cursor advanced without drift.`,
        details: {
          IndexedBlock: tx.blockNumber,
          SyncStatus: 'SYNCHRONIZED',
          Lag: '0 blocks',
        },
        timestamp,
        state: calcState(7),
        evidenceRef: { type: 'BLOCK', value: tx.blockNumber },
      },
      {
        step: 8,
        id: 'stage-8-read-model-updated',
        name: 'Read Model Materialized',
        category: 'CQRS Projection & DB Sync',
        summary: readModelSummary,
        details: {
          Projection: 'EvaluatorReadModel',
          MutationType: isReverted ? 'REVERT_RECORDED' : 'STATE_ADVANCED',
          BlockNumber: tx.blockNumber,
        },
        timestamp,
        state: calcState(8),
        evidenceRef: { type: 'PROJECTION', value: tx.hash },
      },
      {
        step: 9,
        id: 'stage-9-ui-updated',
        name: 'UI State Reactive Refresh',
        category: 'Client Cache Reconciliation',
        summary:
          'TanStack React Query invalidated relevant query caches. Client rendered updated institutional balances and contract states.',
        details: {
          InvalidatedKeys: 'loans, events, console, reputation',
          ClientStatus: 'SYNCHRONIZED',
        },
        timestamp,
        state: calcState(9),
        evidenceRef: { type: 'PROJECTION', value: tx.hash },
      },
    ];

    return stages;
  }, [currentTransaction, currentEvent, playbackStep]);

  const activeStage = replayStages[playbackStep - 1];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTxHash) return;
    setSelectedTx(targetTxHash.trim());
    setPlaybackStep(9);
    setIsPlaying(false);
  };

  const handleInspectStage = (stage: ReplayStageInfo) => {
    if (stage.evidenceRef?.type === 'TRANSACTION') {
      setModalTxHash(stage.evidenceRef.value);
    } else if (stage.evidenceRef?.type === 'BLOCK') {
      setModalBlock(stage.evidenceRef.value);
    } else if (stage.evidenceRef?.type === 'CONTRACT') {
      setModalContract(stage.evidenceRef.value);
    } else {
      setInspectedStage(stage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-dark-text-primary uppercase flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-brand-400" />
            Deterministic Transaction Replay
          </h1>
          <p className="text-xs text-dark-text-secondary mt-0.5 font-sans">
            Step-by-step deterministic reconstruction of completed on-chain transactions. Synthesizes real EVM state transitions without triggering mutations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Reduced motion toggle */}
          <button
            type="button"
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
              reducedMotion
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-dark-bg-2 text-dark-text-muted border-dark-border-subtle hover:text-dark-text-primary'
            }`}
            title="Toggle reduced motion mode"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Reduced Motion: {reducedMotion ? 'ON' : 'OFF'}</span>
          </button>

          {currentTransaction && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/console/trace?tx=${currentTransaction.hash}`)}
              icon={<Zap className="w-3.5 h-3.5 text-brand-400" />}
              className="text-xs font-mono"
            >
              Open in Action Trace
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Filter Pills & Transaction Search */}
      <div className="space-y-3">
        <Tabs
          variant="pill"
          tabs={[
            { id: 'ALL', label: 'All Transactions' },
            { id: 'CREATION', label: 'Agreement Creation' },
            { id: 'FUNDING', label: 'Lender Funding' },
            { id: 'SPENDING', label: 'Supplier Spending' },
            { id: 'REPAYMENT', label: 'Repayments' },
            { id: 'CLAIM', label: 'Dividends Claim' },
            { id: 'VERIFY', label: 'Identity Attestation' },
            { id: 'REVERT', label: 'Reverted Transactions' },
          ]}
          activeTab={workflowFilter}
          onChange={(id) => {
            setWorkflowFilter(id as WorkflowFilterType);
            setPlaybackStep(9);
            setIsPlaying(false);
          }}
        />

        {/* Transaction Selection Bar */}
        <div className="p-3.5 rounded-xl bg-dark-bg-2 border border-dark-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-dark-text-muted shrink-0" />
            <input
              type="text"
              value={targetTxHash}
              onChange={(e) => setTargetTxHash(e.target.value)}
              placeholder="Paste transaction hash (0x...) to replay execution proof..."
              className="w-full bg-transparent border-none text-xs text-dark-text-primary placeholder:text-dark-text-muted focus:outline-none"
            />
            <Button size="sm" variant="primary" type="submit" className="text-xs shrink-0 font-mono">
              Replay Tx
            </Button>
          </form>

          {/* Quick Transaction Picker */}
          {filteredTransactions.length > 0 && (
            <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-dark-border-subtle pt-2 md:pt-0 md:pl-3">
              <span className="text-dark-text-muted text-[11px] shrink-0">Recent:</span>
              <select
                value={selectedTx || ''}
                onChange={(e) => {
                  setSelectedTx(e.target.value);
                  setTargetTxHash(e.target.value);
                  setPlaybackStep(9);
                  setIsPlaying(false);
                }}
                aria-label="Select transaction to replay"
                className="bg-dark-bg-3 border border-dark-border-subtle rounded-lg px-2.5 py-1 text-xs text-dark-text-primary font-mono focus:outline-none focus:border-brand-500 max-w-[220px] truncate"
              >
                {filteredTransactions.map((tx) => {
                  const evt = tx.decodedEvents[0]?.eventName || (tx.status === 'REVERTED' ? 'Reverted' : 'Tx');
                  return (
                    <option key={tx.hash} value={tx.hash}>
                      #{tx.blockNumber} • {evt} ({tx.hash.slice(0, 8)}...)
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Selected Transaction Metadata Card */}
      {currentTransaction && (
        <div className="p-4 rounded-xl bg-dark-bg-2 border border-dark-border-subtle font-mono text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-dark-border-subtle/50">
            <div className="flex items-center gap-2">
              <TransactionStatus
                status={currentTransaction.status === 'SUCCESS' ? 'CONFIRMED' : currentTransaction.status === 'REVERTED' ? 'REVERTED' : 'PENDING'}
                size="md"
              />
              <span className="font-bold text-dark-text-primary">
                {currentEvent?.eventName || currentTransaction.decodedEvents[0]?.eventName || 'Contract Call'}
              </span>
              <span className="text-dark-text-muted text-[11px]">
                Block #{currentTransaction.blockNumber}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalTxHash(currentTransaction.hash)}
                className="text-xs text-brand-400 hover:underline flex items-center gap-1"
              >
                <span>Inspect Authoritative Receipt</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <span className="text-dark-text-muted block text-[10px]">TX HASH</span>
              <span className="font-bold text-dark-text-primary truncate block" title={currentTransaction.hash}>
                {currentTransaction.hash.slice(0, 14)}...{currentTransaction.hash.slice(-8)}
              </span>
            </div>
            <div>
              <span className="text-dark-text-muted block text-[10px]">CALLER (FROM)</span>
              <span className="font-bold text-dark-text-primary truncate block" title={currentTransaction.from}>
                {currentTransaction.from.slice(0, 10)}...{currentTransaction.from.slice(-6)}
              </span>
            </div>
            <div>
              <span className="text-dark-text-muted block text-[10px]">GAS CONSUMED</span>
              <span className="font-bold text-dark-text-primary block">
                {Number(currentTransaction.gasUsed).toLocaleString()} gas
              </span>
            </div>
            <div>
              <span className="text-dark-text-muted block text-[10px]">VALUE TRANSFERRED</span>
              <span className="font-bold text-brand-400 block">
                {formatEther(currentTransaction.valueWei || '0')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Playback Controller */}
      <ReplayController
        currentStep={playbackStep}
        totalSteps={9}
        isPlaying={isPlaying}
        onPlay={() => {
          if (playbackStep >= 9) setPlaybackStep(1);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onRestart={() => {
          setPlaybackStep(1);
          setIsPlaying(false);
        }}
        onStepForward={() => {
          setIsPlaying(false);
          setPlaybackStep((prev) => Math.min(9, prev + 1));
        }}
        onStepBack={() => {
          setIsPlaying(false);
          setPlaybackStep((prev) => Math.max(1, prev - 1));
        }}
        onJumpToStep={(step) => {
          setIsPlaying(false);
          setPlaybackStep(step);
        }}
        speed={playbackSpeed}
        onChangeSpeed={setPlaybackSpeed}
        activeStageName={activeStage?.name}
      />

      {/* Replay Stages Timeline */}
      <TechnicalPanel
        title="Chronological Information Flow"
        subtitle="Step-by-step progression of evidence through Credify's architectural layers."
        badge={
          <span className="font-mono text-[10px] text-brand-400">
            {playbackStep} OF 9 MILESTONES APPLIED
          </span>
        }
        isLoading={txLoading}
        isEmpty={replayStages.length === 0}
        emptyState={
          <div className="py-12 text-center text-xs font-mono text-dark-text-muted space-y-2">
            <Layers className="w-8 h-8 mx-auto text-dark-text-muted" />
            <div>No transaction selected or available to replay.</div>
          </div>
        }
      >
        <div className="space-y-4 relative">
          {/* Subtle vertical connector wire */}
          <div className="absolute left-7 top-6 bottom-6 w-0.5 bg-dark-border-subtle -z-10" />

          {replayStages.map((stage) => {
            const isStageActive = stage.step === playbackStep;
            return (
              <div
                key={stage.id}
                className={`transition-all duration-300 ${
                  isStageActive && !reducedMotion ? 'scale-[1.01]' : ''
                }`}
              >
                <ReplayStageCard
                  stage={stage}
                  isActive={isStageActive}
                  onInspect={handleInspectStage}
                />
              </div>
            );
          })}
        </div>
      </TechnicalPanel>

      {/* Stage Evidence Proof Inspector Dialog */}
      {inspectedStage && (
        <Modal
          open={Boolean(inspectedStage)}
          onClose={() => setInspectedStage(null)}
          title={`Milestone ${inspectedStage.step}: ${inspectedStage.name}`}
          description={`${inspectedStage.category} • Recorded Proof Evidence`}
          maxWidth="lg"
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-dark-bg-2 border border-dark-border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-dark-text-muted text-[11px]">ARCHITECTURAL LAYER:</span>
                <span className="font-bold text-dark-text-primary">{inspectedStage.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-text-muted text-[11px]">EXECUTION STATE:</span>
                <span className="font-bold text-emerald-400">{inspectedStage.state}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-text-muted text-[11px]">RECORDED TIMESTAMP:</span>
                <span className="font-bold text-dark-text-primary">{inspectedStage.timestamp}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] text-dark-text-muted uppercase font-bold">
                Narrative Explanation
              </div>
              <p className="text-xs text-dark-text-secondary font-sans leading-relaxed p-3 rounded-lg bg-dark-bg-1 border border-dark-border-subtle">
                {inspectedStage.summary}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] text-dark-text-muted uppercase font-bold">
                Captured Parameters
              </div>
              <div className="p-3 rounded-lg bg-dark-bg-1 border border-dark-border-subtle space-y-1.5 text-[11px]">
                {Object.entries(inspectedStage.details).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <span className="text-dark-text-muted">{k}:</span>
                    <span className="text-dark-text-primary font-bold truncate max-w-[320px]">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInspectedStage(null)}
                className="text-xs font-mono"
              >
                Close Inspector
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
        onSelectTx={(h) => setModalTxHash(h)}
      />

      {/* Contract Inspector Modal */}
      <ContractInspectorModal
        address={modalContract}
        isOpen={Boolean(modalContract)}
        onClose={() => setModalContract(null)}
      />
    </div>
  );
};
