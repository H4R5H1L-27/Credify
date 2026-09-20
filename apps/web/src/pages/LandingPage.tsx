import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  StatusBadge,
  AddressBadge,
  Progress,
  DotPattern,
  ShimmerButton,
  AnimatedShinyText,
  SpotlightCard,
  NumberTicker,
  Card3DContainer,
  Card3DBody,
  Card3DItem,
} from '../components/ui';
import {
  FileText,
  Coins,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Terminal,
  Layers,
  Cpu,
  ArrowUpRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      id: 0,
      title: '1. Parameterized Contract',
      subtitle: 'Natural language terms validated and committed directly to an immutable LoanPool contract.',
      icon: FileText,
      preview: (
        <SpotlightCard className="space-y-4 p-5 text-xs bg-dark-bg-1/90 border-dark-border-subtle/80 shadow-depth-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-dark-border-subtle">
            <span className="font-semibold text-dark-text-primary">Natural-Language Input</span>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
              Validated Schema
            </span>
          </div>
          <div className="p-3 rounded-lg bg-dark-bg-2 border border-dark-border-subtle/80 text-dark-text-secondary font-mono text-xs leading-relaxed">
            "Create a 10 ETH credit agreement for 14 days at 8% APR with an 8 ETH spending cap."
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono text-xs">
            <div className="p-2.5 bg-dark-bg-2 rounded-lg border border-dark-border-subtle/60">
              <span className="text-dark-text-muted block text-[10px] uppercase font-sans tracking-wider">Target</span>
              <span className="font-bold text-dark-text-primary text-sm">
                <NumberTicker value={10} decimalPlaces={2} suffix=" ETH" />
              </span>
            </div>
            <div className="p-2.5 bg-dark-bg-2 rounded-lg border border-dark-border-subtle/60">
              <span className="text-dark-text-muted block text-[10px] uppercase font-sans tracking-wider">Rate</span>
              <span className="font-bold text-dark-text-primary text-sm">
                <NumberTicker value={8} decimalPlaces={1} suffix="% APR" />
              </span>
            </div>
            <div className="p-2.5 bg-dark-bg-2 rounded-lg border border-dark-border-subtle/60">
              <span className="text-dark-text-muted block text-[10px] uppercase font-sans tracking-wider">Duration</span>
              <span className="font-bold text-dark-text-primary text-sm">
                <NumberTicker value={14} suffix=" Days" />
              </span>
            </div>
            <div className="p-2.5 bg-dark-bg-2 rounded-lg border border-dark-border-subtle/60">
              <span className="text-dark-text-muted block text-[10px] uppercase font-sans tracking-wider">Spend Cap</span>
              <span className="font-bold text-dark-text-primary text-sm">
                <NumberTicker value={8} decimalPlaces={2} suffix=" ETH" />
              </span>
            </div>
          </div>
        </SpotlightCard>
      ),
    },
    {
      id: 1,
      title: '2. Multi-Lender Syndication',
      subtitle: 'Multiple verified institutional lenders pool capital. Escrow activates automatically upon 100% threshold.',
      icon: Coins,
      preview: (
        <SpotlightCard className="space-y-4 p-5 text-xs bg-dark-bg-1/90 border-dark-border-subtle/80 shadow-depth-subtle">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-dark-text-primary">Escrow Target: 10.00 ETH</span>
              <span className="text-dark-text-muted block text-xs mt-0.5">Threshold-activated contract</span>
            </div>
            <StatusBadge status="ACTIVE" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-dark-text-secondary">10.00 / 10.00 ETH</span>
              <span className="font-bold text-emerald-400">
                <NumberTicker value={100} suffix="% Target Met" />
              </span>
            </div>
            <Progress value={100} className="h-2" />
          </div>
          <div className="divide-y divide-dark-border-subtle border border-dark-border-subtle rounded-lg overflow-hidden text-xs">
            <div className="p-2.5 flex justify-between items-center bg-dark-bg-2/70">
              <span className="text-dark-text-secondary">Meera Capital (Lender Alpha)</span>
              <span className="font-mono font-semibold text-dark-text-primary">6.00 ETH (60%)</span>
            </div>
            <div className="p-2.5 flex justify-between items-center bg-dark-bg-2/70">
              <span className="text-dark-text-secondary">Northstar Labs (Lender Beta)</span>
              <span className="font-mono font-semibold text-dark-text-primary">4.00 ETH (40%)</span>
            </div>
          </div>
        </SpotlightCard>
      ),
    },
    {
      id: 2,
      title: '3. Enforce Spending Rules',
      subtitle: 'Borrower drawdowns are restricted by contract policy: only allowlisted merchants can receive funds.',
      icon: ShieldCheck,
      preview: (
        <SpotlightCard className="space-y-3 p-5 text-xs bg-dark-bg-1/90 border-dark-border-subtle/80 shadow-depth-subtle">
          <div className="flex items-center justify-between pb-2 border-b border-dark-border-subtle">
            <span className="font-semibold text-dark-text-primary">Contract Policy Allowlist</span>
            <span className="text-xs font-mono text-dark-text-muted">Cap: 8.00 ETH</span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>BuildRight Supplies (Authorized Supplier)</span>
            </div>
            <span className="font-mono font-bold text-emerald-400">
              <NumberTicker value={2} decimalPlaces={2} suffix=" ETH Allowed" />
            </span>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-between text-rose-300">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Unapproved Merchant Address</span>
            </div>
            <span className="font-mono font-semibold text-xs text-rose-400">Revert: MerchantNotApproved()</span>
          </div>
        </SpotlightCard>
      ),
    },
    {
      id: 3,
      title: '4. Pro-Rata Repayments',
      subtitle: 'Repayments are distributed mathematically pro-rata and claimed via non-custodial pull payments.',
      icon: TrendingUp,
      preview: (
        <SpotlightCard className="space-y-3 p-5 text-xs bg-dark-bg-1/90 border-dark-border-subtle/80 shadow-depth-subtle">
          <div className="flex items-center justify-between pb-2 border-b border-dark-border-subtle">
            <span className="font-semibold text-dark-text-primary">
              Repayment Settled: <NumberTicker value={5.4} decimalPlaces={2} suffix=" ETH" />
            </span>
            <span className="font-mono text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded">Block Confirmed</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-dark-bg-2 border border-dark-border-subtle flex justify-between items-center">
              <div>
                <span className="font-semibold text-dark-text-primary">Lender Alpha (60% share)</span>
                <div className="text-dark-text-muted text-xs">Claimable balance updated</div>
              </div>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                <NumberTicker value={3.24} decimalPlaces={2} suffix=" ETH" />
              </span>
            </div>
            <div className="p-3 rounded-lg bg-dark-bg-2 border border-dark-border-subtle flex justify-between items-center">
              <div>
                <span className="font-semibold text-dark-text-primary">Lender Beta (40% share)</span>
                <div className="text-dark-text-muted text-xs">Claimable balance updated</div>
              </div>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                <NumberTicker value={2.16} decimalPlaces={2} suffix=" ETH" />
              </span>
            </div>
          </div>
        </SpotlightCard>
      ),
    },
    {
      id: 4,
      title: '5. Cryptographic Evidence',
      subtitle: 'Settled loan outcomes trigger automatic cross-contract reputation upgrades (+8 pts) and immutable events.',
      icon: FileCheck2,
      preview: (
        <SpotlightCard className="space-y-3 p-5 text-xs bg-dark-bg-1/90 border-dark-border-subtle/80 shadow-depth-subtle">
          <div className="flex items-center justify-between pb-2 border-b border-dark-border-subtle">
            <span className="font-semibold text-dark-text-primary">Borrower Credit Score</span>
            <span className="font-mono font-bold text-emerald-400">
              <NumberTicker value={58} suffix=" / 100" /> (+8 pts)
            </span>
          </div>
          <div className="p-3 rounded-lg bg-dark-bg-2 border border-dark-border-subtle space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-dark-text-secondary">
              <span className="text-dark-text-muted font-sans">Authoritative Event:</span>
              <span className="font-bold text-dark-text-primary">LoanRepaid</span>
            </div>
            <div className="flex items-center justify-between text-dark-text-secondary">
              <span className="text-dark-text-muted font-sans">Escrow Pool:</span>
              <AddressBadge address="0x8d94943C2e9c15dFA4Ac920a67e8B41e8c8959dC" chars={5} />
            </div>
            <div className="flex items-center justify-between text-dark-text-secondary">
              <span className="text-dark-text-muted font-sans">Proof Consensus:</span>
              <span className="text-emerald-400 font-sans font-semibold">ReputationRegistry Updated</span>
            </div>
          </div>
        </SpotlightCard>
      ),
    },
  ];

  return (
    <div className="min-h-screen surface-canvas text-dark-text-primary flex flex-col relative overflow-hidden">
      {/* Mathematical Dynamic Animated Dot Grid Matrix (Magic UI / Aceternity) */}
      <DotPattern
        spacing={30}
        dotSize={1.8}
        glow
        interactive
        ambientWave
      />

      {/* Ambient background illumination */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 gradient-hero-ambient pointer-events-none" />

      {/* Navigation Top Bar with Calibrated Glass */}
      <header className="h-16 surface-glass-header px-4 sm:px-8 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm shadow-depth-card">
            C
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Credify</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/console/evaluator"
            className="text-xs font-medium text-dark-text-secondary hover:text-dark-text-primary px-3 py-1.5 transition-colors flex items-center gap-1.5 rounded-lg hover:bg-dark-bg-2"
          >
            <Terminal className="w-3.5 h-3.5 text-brand-400" />
            <span>Evaluator Console</span>
          </Link>
          <Button
            variant="primary"
            onClick={() => navigate('/app')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Enter Application
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 max-w-5xl mx-auto w-full text-center space-y-6 relative z-10">
        {/* Animated Shiny Text Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full surface-glass text-xs font-medium border border-dark-border-subtle/80 shadow-depth-subtle">
          <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <AnimatedShinyText className="text-xs font-medium">
            Decentralized Multi-Lender Credit Protocol
          </AnimatedShinyText>
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold tracking-[-0.03em] text-white leading-[1.08] max-w-4xl mx-auto">
          Shared credit agreements,<br />
          <span className="bg-gradient-to-b from-white via-white/95 to-white/50 bg-clip-text text-transparent">
            enforced by code.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[#a1a1a6] max-w-2xl mx-auto leading-relaxed font-normal">
          Credify demonstrates how syndicated loan agreements transition from natural language terms into parameterized smart contract escrows—with policy-restricted spending, pro-rata dividend claims, and automated on-chain reputation.
        </p>

        {/* Action CTAs with Shimmer Button */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
          <ShimmerButton
            onClick={() => navigate('/app')}
            icon={<ArrowRight className="w-4 h-4" />}
            className="px-6 py-3 text-base shadow-depth-card rounded-full font-semibold"
          >
            Launch Application
          </ShimmerButton>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/console/evaluator')}
            icon={<Terminal className="w-4 h-4" />}
            className="rounded-full px-6 text-sm font-semibold"
          >
            Evaluator Console
          </Button>
        </div>

        {/* Live Architectural Metrics Strip with Cursor Spotlight Cards and Number Tickers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-10 max-w-3xl mx-auto text-left">
          <SpotlightCard className="p-4 rounded-2xl bg-dark-bg-1/80 border border-white/10 space-y-1">
            <span className="text-[11px] font-sans text-[#86868b] uppercase tracking-wider block">Escrow Consensus</span>
            <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1">
              <NumberTicker value={100} duration={900} />
              <span className="text-sm font-sans text-emerald-400 font-semibold">% On-Chain</span>
            </div>
          </SpotlightCard>
          <SpotlightCard className="p-4 rounded-2xl bg-dark-bg-1/80 border border-white/10 space-y-1">
            <span className="text-[11px] font-sans text-[#86868b] uppercase tracking-wider block">Syndicated Volume</span>
            <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1">
              <NumberTicker value={23} decimalPlaces={2} duration={1100} />
              <span className="text-sm font-sans text-blue-400 font-semibold">ETH</span>
            </div>
          </SpotlightCard>
          <SpotlightCard className="p-4 rounded-2xl bg-dark-bg-1/80 border border-white/10 space-y-1">
            <span className="text-[11px] font-sans text-[#86868b] uppercase tracking-wider block">Fixed Rate Benchmark</span>
            <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1">
              <NumberTicker value={8} decimalPlaces={1} duration={1300} />
              <span className="text-sm font-sans text-[#a1a1a6] font-semibold">% APR</span>
            </div>
          </SpotlightCard>
          <SpotlightCard className="p-4 rounded-2xl bg-dark-bg-1/80 border border-white/10 space-y-1">
            <span className="text-[11px] font-sans text-[#86868b] uppercase tracking-wider block">Reputation Ceiling</span>
            <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1">
              <NumberTicker value={100} duration={1400} />
              <span className="text-sm font-sans text-emerald-400 font-semibold">Score Cap</span>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* The Multi-Lender Lifecycle: Interactive Walkthrough */}
      <section className="py-12 px-4 sm:px-8 max-w-5xl mx-auto w-full relative z-10">
        <div className="text-center mb-8 space-y-1">
          <h2 className="text-2xl font-bold text-dark-text-primary tracking-tight">The Multi-Lender Lifecycle</h2>
          <p className="text-xs text-dark-text-secondary">
            Inspect the cryptographic enforcement mechanisms executed at each stage of the syndicated credit facility.
          </p>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
          {steps.map((step) => {
            const Icon = step.icon;
            const isSelected = activeStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-500/10 border-brand-500/40 text-brand-300 shadow-depth-card'
                    : 'bg-dark-bg-1 border-dark-border-subtle text-dark-text-secondary hover:bg-dark-bg-2 hover:text-dark-text-primary'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-brand-400' : 'text-dark-text-muted'}`} />
                  <span className="truncate">{step.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Stepper Content inside Spotlight Card with activeStep key */}
        <SpotlightCard key={activeStep} spotlightSize={450} className="p-6 sm:p-8 bg-dark-bg-1/90 border-dark-border-subtle/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-dark-bg-2 border border-dark-border-subtle text-xs font-mono text-dark-text-secondary">
                <Layers className="w-3 h-3 text-brand-400" />
                <span>Stage 0{activeStep + 1} of 05</span>
              </div>
              <h3 className="text-xl font-bold text-dark-text-primary tracking-tight">
                {steps[activeStep].title}
              </h3>
              <p className="text-xs text-dark-text-secondary leading-relaxed">
                {steps[activeStep].subtitle}
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/app')}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Enter Credit Workspace
                </Button>
              </div>
            </div>

            <div className="w-full">
              <Card3DContainer className="w-full">
                <Card3DBody className="w-full">
                  <Card3DItem translateZ={28} className="w-full">
                    {steps[activeStep].preview}
                  </Card3DItem>
                </Card3DBody>
              </Card3DContainer>
            </div>
          </div>
        </SpotlightCard>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-dark-border-subtle bg-dark-bg-1/80 py-8 px-4 text-center text-xs text-dark-text-muted space-y-2">
        <div className="flex items-center justify-center gap-2 text-[#86868b]">
          <span>Credify Protocol</span>
          <span>•</span>
          <Link to="/console/overview" className="text-blue-400 hover:underline inline-flex items-center gap-0.5 font-medium">
            Technical Console <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="text-xs text-dark-text-subtle">
          Autonomous multi-lender credit contracts with deterministic proof consensus.
        </div>
      </footer>
    </div>
  );
};
