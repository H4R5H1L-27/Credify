import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  StatusBadge,
  AddressBadge,
  Progress,
  DotPattern,
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
        <SpotlightCard className="space-y-4 p-5 text-xs bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="font-bold text-slate-950">Natural-Language Input</span>
            <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
              Validated Schema
            </span>
          </div>
          <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-950 font-mono text-xs leading-relaxed font-semibold">
            "Create a 10 ETH credit agreement for 14 days at 8% APR with an 8 ETH spending cap."
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-sans tracking-wider font-semibold">Target</span>
              <span className="font-black text-slate-950 text-sm">
                <NumberTicker value={10} decimalPlaces={2} suffix=" ETH" />
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-sans tracking-wider font-semibold">Rate</span>
              <span className="font-black text-slate-950 text-sm">
                <NumberTicker value={8} decimalPlaces={1} suffix="% APR" />
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-sans tracking-wider font-semibold">Duration</span>
              <span className="font-black text-slate-950 text-sm">
                <NumberTicker value={14} suffix=" Days" />
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-sans tracking-wider font-semibold">Spend Cap</span>
              <span className="font-black text-slate-950 text-sm">
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
        <SpotlightCard className="space-y-4 p-5 text-xs bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-950">Escrow Target: 10.00 ETH</span>
              <span className="text-slate-500 block text-xs mt-0.5 font-medium">Threshold-activated contract</span>
            </div>
            <StatusBadge status="ACTIVE" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-slate-700 font-semibold">10.00 / 10.00 ETH</span>
              <span className="font-bold text-emerald-700">
                <NumberTicker value={100} suffix="% Target Met" />
              </span>
            </div>
            <Progress value={100} className="h-2" />
          </div>
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="p-2.5 flex justify-between items-center bg-slate-50">
              <span className="text-slate-700 font-medium">Meera Capital (Lender Alpha)</span>
              <span className="font-mono font-bold text-slate-950">6.00 ETH (60%)</span>
            </div>
            <div className="p-2.5 flex justify-between items-center bg-slate-50">
              <span className="text-slate-700 font-medium">Northstar Labs (Lender Beta)</span>
              <span className="font-mono font-bold text-slate-950">4.00 ETH (40%)</span>
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
        <SpotlightCard className="space-y-3 p-5 text-xs bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-bold text-slate-950">Contract Policy Allowlist</span>
            <span className="text-xs font-mono font-bold text-slate-600">Cap: 8.00 ETH</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-emerald-900 font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>BuildRight Supplies (Authorized Supplier)</span>
            </div>
            <span className="font-mono font-black text-emerald-800">
              <NumberTicker value={2} decimalPlaces={2} suffix=" ETH Allowed" />
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 flex items-center justify-between text-rose-900 font-semibold">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Unapproved Merchant Address</span>
            </div>
            <span className="font-mono font-bold text-xs text-rose-700">Revert: MerchantNotApproved()</span>
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
        <SpotlightCard className="space-y-3 p-5 text-xs bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-bold text-slate-950">
              Repayment Settled: <NumberTicker value={5.4} decimalPlaces={2} suffix=" ETH" />
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 bg-yellow-100 border border-yellow-300 px-2 py-0.5 rounded">Block Confirmed</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-950">Lender Alpha (60% share)</span>
                <div className="text-slate-500 font-medium text-xs">Claimable balance updated</div>
              </div>
              <span className="font-mono font-black text-emerald-700 text-sm">
                <NumberTicker value={3.24} decimalPlaces={2} suffix=" ETH" />
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-950">Lender Beta (40% share)</span>
                <div className="text-slate-500 font-medium text-xs">Claimable balance updated</div>
              </div>
              <span className="font-mono font-black text-emerald-700 text-sm">
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
        <SpotlightCard className="space-y-3 p-5 text-xs bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-bold text-slate-950">Borrower Credit Score</span>
            <span className="font-mono font-black text-emerald-700">
              <NumberTicker value={58} suffix=" / 100" /> (+8 pts)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500 font-sans font-medium">Authoritative Event:</span>
              <span className="font-bold text-slate-950 font-mono">LoanRepaid</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500 font-sans font-medium">Escrow Pool:</span>
              <AddressBadge address="0x8d94943C2e9c15dFA4Ac920a67e8B41e8c8959dC" chars={5} />
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500 font-sans font-medium">Proof Consensus:</span>
              <span className="text-emerald-700 font-sans font-bold">ReputationRegistry Updated</span>
            </div>
          </div>
        </SpotlightCard>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-950 flex flex-col relative overflow-hidden">
      {/* Mathematical Dynamic Animated Dot Grid Matrix */}
      <DotPattern
        spacing={30}
        dotSize={1.8}
        glow
        interactive
        ambientWave
      />

      {/* Ambient background illumination */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 gradient-hero-ambient pointer-events-none" />

      {/* Navigation Top Bar with Frosted Glass */}
      <header className="h-16 surface-glass-header px-4 sm:px-8 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 z-30 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#ffe600] border border-yellow-400 flex items-center justify-center text-black font-black text-base shadow-xs">
            C
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-950">Credify</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/console/evaluator"
            className="text-xs font-bold text-slate-700 hover:text-black px-3 py-1.5 transition-colors flex items-center gap-1.5 rounded-lg hover:bg-slate-100"
          >
            <Terminal className="w-3.5 h-3.5 text-yellow-700" />
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
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-950 text-xs font-fancy font-bold shadow-xs tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-yellow-700 shrink-0" />
          <span>Decentralized Multi-Lender Credit Protocol</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-display font-black tracking-[-0.03em] text-slate-950 leading-[1.08] max-w-4xl mx-auto">
          Shared credit agreements,<br />
          <span className="bg-[#ffe600] text-black px-3 py-0.5 rounded-xl shadow-xs inline-block mt-2">
            enforced by code.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
          Credify demonstrates how syndicated loan agreements transition from natural language terms into parameterized smart contract escrows—with policy-restricted spending, pro-rata dividend claims, and automated on-chain reputation.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/app')}
            icon={<ArrowRight className="w-4 h-4" />}
            className="px-6 py-3 text-base shadow-sm rounded-full font-bold"
          >
            Launch Application
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/console/evaluator')}
            icon={<Terminal className="w-4 h-4" />}
            className="rounded-full px-6 text-sm font-bold bg-white border-slate-300 text-slate-900 hover:bg-slate-50"
          >
            Evaluator Console
          </Button>
        </div>

        {/* Live Architectural Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-10 max-w-3xl mx-auto text-left">
          <SpotlightCard className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-fancy font-bold text-slate-500 uppercase tracking-wider block">Escrow Consensus</span>
            <div className="text-2xl font-display font-black text-slate-950 flex items-baseline gap-1">
              <NumberTicker value={100} duration={900} />
              <span className="text-xs font-fancy font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                100% On-Chain
              </span>
            </div>
          </SpotlightCard>
          <SpotlightCard className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-fancy font-bold text-slate-500 uppercase tracking-wider block">Syndicated Volume</span>
            <div className="text-2xl font-display font-black text-slate-950 flex items-baseline gap-1">
              <NumberTicker value={23} decimalPlaces={2} duration={1100} />
              <span className="text-xs font-fancy font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-950 border border-yellow-300">
                ETH
              </span>
            </div>
          </SpotlightCard>
          <SpotlightCard className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-fancy font-bold text-slate-500 uppercase tracking-wider block">Fixed Rate Benchmark</span>
            <div className="text-2xl font-display font-black text-slate-950 flex items-baseline gap-1">
              <NumberTicker value={8} decimalPlaces={1} duration={1300} />
              <span className="text-xs font-fancy font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-300">
                % APR
              </span>
            </div>
          </SpotlightCard>
          <SpotlightCard className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-fancy font-bold text-slate-500 uppercase tracking-wider block">Reputation Ceiling</span>
            <div className="text-2xl font-display font-black text-slate-950 flex items-baseline gap-1">
              <NumberTicker value={100} duration={1400} />
              <span className="text-xs font-fancy font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Score Cap
              </span>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* The Multi-Lender Lifecycle: Interactive Walkthrough */}
      <section className="py-12 px-4 sm:px-8 max-w-5xl mx-auto w-full relative z-10">
        <div className="text-center mb-8 space-y-1">
          <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-950 tracking-tight">The Multi-Lender Lifecycle</h2>
          <p className="text-xs text-slate-600 font-medium">
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
                    ? 'bg-[#ffe600] border-yellow-400 text-black shadow-xs font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-black' : 'text-slate-500'}`} />
                  <span className="truncate font-display font-bold">{step.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Stepper Content inside Spotlight Card with activeStep key */}
        <SpotlightCard key={activeStep} spotlightSize={450} className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100/90 border border-yellow-400 text-xs font-fancy font-bold text-yellow-950 shadow-xs tracking-wide">
                <Layers className="w-3.5 h-3.5 text-yellow-800" />
                <span className="font-bold">Stage 0{activeStep + 1}</span>
                <span className="text-yellow-700/80 font-normal">/</span>
                <span className="text-yellow-900 font-semibold">05</span>
              </div>
              <h3 className="text-2xl font-display font-black text-slate-950 tracking-tight">
                {steps[activeStep].title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
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
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-600 space-y-2">
        <div className="flex items-center justify-center gap-2 text-slate-700 font-semibold">
          <span>Credify Protocol</span>
          <span>•</span>
          <Link to="/console/overview" className="text-yellow-800 hover:underline inline-flex items-center gap-0.5 font-bold">
            Technical Console <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Autonomous multi-lender credit contracts with deterministic proof consensus.
        </div>
      </footer>
    </div>
  );
};
