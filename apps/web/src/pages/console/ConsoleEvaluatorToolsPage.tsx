import React, { useState } from 'react';
import { useEvaluatorContracts, useResetDemo, useHealth } from '../../hooks/useCredify';
import {
  TechnicalPanel,
  TechnicalValue,
  TechnicalStatus,
} from '../../components/console';
import { Button } from '../../components/ui/Button';
import {
  triggerConfetti,
  MilestoneCelebration,
  type MilestoneType,
  AnimatedCheckmark,
  AnimatedShield,
  AnimatedCoin,
  AnimatedSyncPulse,
  NumberTicker,
} from '../../components/ui';
import { api } from '../../lib/api';
import { DEMO_ACCOUNTS } from '@credify/shared';
import { Wrench, Clock, RotateCcw, ShieldCheck, Key, ArrowRight, Sparkles, PartyPopper } from 'lucide-react';

export const ConsoleEvaluatorToolsPage: React.FC = () => {
  const { data: evaluatorData, refetch: refetchContracts } = useEvaluatorContracts();
  const { data: health, refetch: refetchHealth } = useHealth();
  const resetDemo = useResetDemo();

  const [warpDays, setWarpDays] = useState('15');
  const [isWarping, setIsWarping] = useState(false);
  const [warpFeedback, setWarpFeedback] = useState<string | null>(null);
  const [milestonePreview, setMilestonePreview] = useState<{ open: boolean; type: MilestoneType }>({
    open: false,
    type: 'IDENTITY_VERIFIED',
  });
  const [testCounter, setTestCounter] = useState(25.75);

  const handleTimeWarp = async () => {
    const days = Number(warpDays);
    if (isNaN(days) || days <= 0) return;
    setIsWarping(true);
    setWarpFeedback(null);
    try {
      const res = await api.timeWarp(days * 86400);
      setWarpFeedback(`EVM clock advanced by ${days} days (${res.warpedSeconds}s). Node timestamp: ${res.currentTimestamp}`);
      await refetchHealth();
    } catch (err: any) {
      setWarpFeedback(`Failed to warp time: ${err.message}`);
    } finally {
      setIsWarping(false);
    }
  };

  const handleReset = async () => {
    await resetDemo.mutateAsync();
    await refetchContracts();
    await refetchHealth();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-mono tracking-tight text-dark-text-primary uppercase flex items-center gap-2">
          <Wrench className="w-5 h-5 text-brand-400" />
          Academic &amp; Evaluator Diagnostics Suite
        </h1>
        <p className="text-xs text-dark-text-secondary mt-0.5">
          Deterministic local environment controls, EVM block time manipulation, and academic testing accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EVM Time-Warp Simulation */}
        <TechnicalPanel
          title="EVM Block Time Simulator"
          subtitle="Advance the local node clock (`evm_increaseTime`) to test maturity deadlines and default governance voting."
          badge={<span className="font-mono text-[10px] text-brand-400">HARDHAT RPC</span>}
        >
          <div className="space-y-4">
            <div className="space-y-2 font-mono text-xs">
              <label className="text-dark-text-secondary block">
                Advance Node Clock by (Days):
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={warpDays}
                  onChange={(e) => setWarpDays(e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-lg bg-dark-bg-3 border border-dark-border-default font-mono text-xs text-dark-text-primary focus:outline-none focus:border-brand-500"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleTimeWarp}
                  loading={isWarping}
                  icon={<Clock className="w-3.5 h-3.5" />}
                  className="text-xs font-mono"
                >
                  Advance Time
                </Button>
              </div>
            </div>

            {warpFeedback && (
              <div className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle font-mono text-[11px] text-emerald-400">
                {warpFeedback}
              </div>
            )}

            <div className="text-[11px] text-dark-text-muted font-sans leading-relaxed">
              Advancing time allows testing loan maturity expiration without waiting days. Once maturity expires on an active loan with outstanding debt, syndicate lenders can cast capital-weighted default votes.
            </div>
          </div>
        </TechnicalPanel>

        {/* State Reset & Reindex */}
        <TechnicalPanel
          title="Database &amp; Read-Model Reset"
          subtitle="Re-index events from Genesis (Block #0) through the current node head."
          badge={<TechnicalStatus status="ACTIVE" size="sm" />}
        >
          <div className="space-y-4 font-mono text-xs">
            <p className="text-[11px] text-dark-text-secondary font-sans leading-relaxed">
              Wipes the API projection cache and replays every event log from the Hardhat node to reconstruct loans, repayments, reputation, and KYC registries deterministically.
            </p>

            <Button
              size="sm"
              variant="danger"
              onClick={handleReset}
              loading={resetDemo.isPending}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs font-mono"
            >
              Reset Projection Store
            </Button>
          </div>
        </TechnicalPanel>
      </div>
      {/* Motion Assets & Milestone Celebrations Diagnostics */}
      <TechnicalPanel
        title="Motion Assets &amp; Milestone Celebrations Diagnostics"
        subtitle="Test full-screen Canvas Confetti starbursts, Lordicon animated SVGs, and numerical tickers."
        badge={<span className="font-mono text-[10px] text-emerald-400">UI / MOTION</span>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-mono text-xs">
          {/* Confetti Starburst */}
          <div className="p-4 rounded-xl bg-dark-bg-3 border border-dark-border-subtle space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-dark-text-primary mb-1">
                <PartyPopper className="w-4 h-4 text-brand-400" />
                <span>Canvas Confetti Blast</span>
              </div>
              <p className="text-[11px] text-dark-text-secondary font-sans leading-relaxed">
                Spawns multi-shape gold, emerald, cobalt, and white particles with 3D wobble rotation and gravity drag.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                triggerConfetti({
                  particleCount: 120,
                  spread: 90,
                  startVelocity: 42,
                })
              }
              icon={<PartyPopper className="w-3.5 h-3.5" />}
              className="w-full text-xs font-mono"
            >
              Trigger Confetti Starburst
            </Button>
          </div>

          {/* Milestone Modal Previews */}
          <div className="p-4 rounded-xl bg-dark-bg-3 border border-dark-border-subtle space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-dark-text-primary mb-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Milestone Celebrations</span>
              </div>
              <p className="text-[11px] text-dark-text-secondary font-sans leading-relaxed">
                Opens authoritative lifecycle milestone modal with particle bursts and dynamic micro-interactions.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMilestonePreview({ open: true, type: 'IDENTITY_VERIFIED' })}
                className="flex-1 text-[10px] font-mono"
              >
                KYC Modal
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMilestonePreview({ open: true, type: 'REPAYMENT_COMPLETED' })}
                className="flex-1 text-[10px] font-mono"
              >
                Repaid Modal
              </Button>
            </div>
          </div>

          {/* Number Counter Dynamics */}
          <div className="p-4 rounded-xl bg-dark-bg-3 border border-dark-border-subtle space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-dark-text-primary mb-1">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Dynamic Number Ticker</span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 my-1">
                <NumberTicker value={testCounter} decimalPlaces={2} /> ETH
              </div>
              <p className="text-[11px] text-dark-text-secondary font-sans leading-relaxed">
                Ease-out exponential countup with requestAnimationFrame interpolation.
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setTestCounter((prev) => Math.round((prev + Math.random() * 25 + 5) * 100) / 100)}
              className="w-full text-xs font-mono"
            >
              Increment Counter
            </Button>
          </div>
        </div>

        {/* Micro-Interaction Showcase Strip */}
        <div className="mt-4 p-3 rounded-xl bg-dark-bg-1 border border-dark-border-subtle flex flex-wrap items-center justify-around gap-4 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <AnimatedCheckmark size={32} color="#10B981" />
            <span className="text-dark-text-secondary">AnimatedCheckmark</span>
          </div>
          <div className="flex items-center gap-2.5">
            <AnimatedShield size={32} verified={true} />
            <span className="text-dark-text-secondary">AnimatedShield</span>
          </div>
          <div className="flex items-center gap-2.5">
            <AnimatedCoin size={32} />
            <span className="text-dark-text-secondary">AnimatedCoin</span>
          </div>
          <div className="flex items-center gap-2">
            <AnimatedSyncPulse color="emerald" />
            <span className="text-dark-text-secondary">AnimatedSyncPulse</span>
          </div>
        </div>
      </TechnicalPanel>

      {/* Milestone Modal Instance */}
      <MilestoneCelebration
        open={milestonePreview.open}
        onClose={() => setMilestonePreview((prev) => ({ ...prev, open: false }))}
        type={milestonePreview.type}
        amountEth="15.00"
        reputationDelta={8}
        contractAddress="0x5FbDB2315678afecb367f032d93F642f64180aa3"
        blockNumber={42}
        txHash="0x4a8f9c1b2e3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a"
      />

      {/* Deterministic Local Test Accounts Reference */}
      <TechnicalPanel
        title="Local Node Test Accounts (Mnemonic Derivation)"
        subtitle="Standard Hardhat deterministic testing accounts derived from academic local mnemonic."
        badge={<span className="font-mono text-[10px] text-dark-text-muted">CHAIN 31337</span>}
      >
        <div className="space-y-2 font-mono text-xs">
          {DEMO_ACCOUNTS.map((acc, idx) => (
            <div
              key={acc.address}
              className="p-3 rounded-lg bg-dark-bg-3 border border-dark-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-dark-text-muted text-[11px]">#{idx + 1}</span>
                <span className="font-bold text-dark-text-primary">{acc.displayName}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-dark-bg-2 border border-dark-border-default text-brand-300 uppercase">
                  {acc.role}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <TechnicalValue value={acc.address} type="address" chars={6} />
              </div>
            </div>
          ))}
        </div>
      </TechnicalPanel>
    </div>
  );
};
