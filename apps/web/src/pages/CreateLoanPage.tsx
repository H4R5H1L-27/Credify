import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useIdentity } from '../context/IdentityContext';
import { useWallet } from '../context/WalletContext';
import { useEvaluatorContracts } from '../hooks/useCredify';
import { useContractAction } from '../hooks/useContractAction';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { AddressBadge } from '../components/ui/AddressBadge';
import { TransactionLifecycle } from '../components/ui/TransactionLifecycle';
import { MilestoneCelebration } from '../components/ui/MilestoneCelebration';
import { formatEther, formatApr, formatDuration } from '../lib/utils';
import { FileText, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, AlertCircle, ShieldAlert, Key, ShieldCheck } from 'lucide-react';

const PRESETS = [
  {
    title: 'Laboratory Hardware & Sensor Upgrade (10 ETH · 14 Days · 8%)',
    text: 'Create a 10 ETH credit agreement for 14 days at 8% APR with an 8 ETH spending cap to purchase research sensors.',
  },
  {
    title: 'Research Computing Facility Allocation (5 ETH · 30 Days · 5%)',
    text: 'Create a 5 ETH credit agreement for 30 days at 5% APR with a 4 ETH spending cap for server infrastructure.',
  },
  {
    title: 'Short-Term Inventory Bridge Agreement (8 ETH · 7 Days · 10%)',
    text: 'Create an 8 ETH credit agreement for 7 days at 10% APR with an 8 ETH spending cap.',
  },
];

export const CreateLoanPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, isBorrower, isVerified, identity, address } = useIdentity();
  const { data: evaluatorData } = useEvaluatorContracts();
  const { executeCreateLoan, txState: contractTxState, isExecuting } = useContractAction();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [agreementText, setAgreementText] = useState(PRESETS[0].text);
  const [showMilestone, setShowMilestone] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{
    targetWei: string;
    durationSeconds: number;
    aprBps: number;
    maxSpendWei: string;
    defaultQuorumBps: number;
    merchants: string[];
  } | null>(null);

  const [createdPoolId, setCreatedPoolId] = useState<string | null>(null);

  // Client-side heuristics preview (mirrors backend term parser for instant feedback)
  const previewTerms = () => {
    const text = agreementText;
    const targetMatch = text.match(/(\d+(?:\.\d+)?)\s*ETH/i);
    const targetEth = targetMatch ? Number(targetMatch[1]) : 10;
    const targetWei = BigInt(Math.round(targetEth * 1e18)).toString();

    const aprMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
    const aprBps = aprMatch ? Math.round(Number(aprMatch[1]) * 100) : 800;

    const daysMatch = text.match(/(\d+)\s*day/i);
    const durationDays = daysMatch ? Number(daysMatch[1]) : 14;
    const durationSeconds = durationDays * 24 * 60 * 60;

    const capMatch = text.match(/(?:spend|cap|limit)[^\d]*(\d+(?:\.\d+)?)\s*ETH/i);
    const capEth = capMatch ? Number(capMatch[1]) : targetEth * 0.8;
    const maxSpendWei = BigInt(Math.round(capEth * 1e18)).toString();

    const defaultMerchants = evaluatorData?.demoAccounts?.merchants || [
      '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
      '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    ];

    setParsedPreview({
      targetWei,
      durationSeconds,
      aprBps,
      maxSpendWei,
      defaultQuorumBps: 5001,
      merchants: defaultMerchants,
    });
    setStep(2);
  };

  const handleDeploy = async () => {
    if (!parsedPreview) return;
    setStep(3);
    try {
      const res = await executeCreateLoan({
        naturalLanguageText: agreementText,
        terms: parsedPreview,
      });
      setCreatedPoolId(res.poolAddress);
      setShowMilestone(true);
    } catch {
      // Error is caught and surfaced in useContractAction txState
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs text-dark-text-muted">
        <Link to="/app/borrower/agreements" className="hover:text-dark-text-primary transition-colors duration-fast">
          Agreements
        </Link>
        <span>/</span>
        <span className="text-dark-text-secondary font-medium">New Credit Agreement</span>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-dark-text-primary tracking-tight">Create Loan Agreement</h1>
        <p className="text-xs text-dark-text-secondary mt-1">
          Propose an on-chain credit agreement. Parameters are parsed into a structured term sheet and instantiated via the <code className="font-mono text-brand-400">LoanFactory</code> smart contract.
        </p>
      </div>

      {/* Identity Verification Gate Alert */}
      {!isVerified && (
        <Alert variant="warning" title="On-Chain Verification Required">
          <div className="space-y-2">
            <p>
              Your connected wallet (<strong className="font-mono">{address ? `${address.slice(0, 8)}...` : 'Not Connected'}</strong>) has not completed identity attestation on the <code className="font-mono">KYCRegistry</code> smart contract.
              Loan creation will be rejected on-chain by the factory without verified status.
            </p>
            <div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate('/app/verify')}
                className="text-xs h-7"
              >
                Complete Identity Verification &rarr;
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Role Notice */}
      {isConnected && !isBorrower && (
        <Alert variant="info" title="Borrower Role Notice">
          Your connected wallet identity is recognized with role <strong>{identity?.role || 'LENDER'}</strong>.
          Agreements are typically initiated by Borrowers.
        </Alert>
      )}

      {/* Stepper Progress */}
      <div className="flex items-center justify-between border-b border-dark-border-subtle pb-4">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors duration-normal ${
              step >= 1 ? 'bg-brand-500 text-white shadow-xs font-bold' : 'bg-dark-bg-3 text-dark-text-muted border border-dark-border-subtle'
            }`}
          >
            1
          </span>
          <span className={step >= 1 ? 'text-dark-text-primary font-semibold' : 'text-dark-text-muted'}>Describe Agreement</span>
        </div>
        <div className="w-12 h-px bg-dark-border-subtle" />
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors duration-normal ${
              step >= 2 ? 'bg-brand-500 text-white shadow-xs font-bold' : 'bg-dark-bg-3 text-dark-text-muted border border-dark-border-subtle'
            }`}
          >
            2
          </span>
          <span className={step >= 2 ? 'text-dark-text-primary font-semibold' : 'text-dark-text-muted'}>Review Structured Terms</span>
        </div>
        <div className="w-12 h-px bg-dark-border-subtle" />
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors duration-normal ${
              step >= 3 ? 'bg-brand-500 text-white shadow-xs font-bold' : 'bg-dark-bg-3 text-dark-text-muted border border-dark-border-subtle'
            }`}
          >
            3
          </span>
          <span className={step >= 3 ? 'text-dark-text-primary font-semibold' : 'text-dark-text-muted'}>Deploy On-Chain</span>
        </div>
      </div>

      {/* STEP 1: Describe Agreement */}
      {step === 1 && (
        <Card className="animate-milestone-enter">
          <CardHeader>
            <CardTitle>1. Natural Language Agreement Terms</CardTitle>
            <CardDescription>
              Specify terms describing the principal, duration, APR, and spending cap. The Credify parser extracts validated parameters for the immutable contract template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-dark-text-secondary mb-1.5">
                Agreement Text
              </label>
              <textarea
                value={agreementText}
                onChange={(e) => setAgreementText(e.target.value)}
                rows={4}
                className="w-full text-sm p-3 rounded-lg border border-dark-border-default bg-dark-bg-3 text-dark-text-primary focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-sans leading-relaxed"
                placeholder="e.g. Create a 10 ETH credit agreement for 14 days at 8% with an 8 ETH spending cap."
              />
            </div>

            {/* Presets Helper */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-dark-text-muted uppercase tracking-wider block">
                Standard Templates:
              </span>
              <div className="space-y-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAgreementText(p.text)}
                    className="w-full text-left p-3 rounded-lg border border-dark-border-subtle hover:border-dark-border-strong bg-dark-bg-3 hover:bg-dark-bg-2 transition-all duration-fast text-xs flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-dark-text-primary group-hover:text-brand-300 transition-colors">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-dark-text-muted mt-0.5">{p.text}</div>
                    </div>
                    <span className="text-xs text-brand-400 font-medium shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">Use &rarr;</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={previewTerms}
                disabled={!agreementText.trim() || !isVerified}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Parse &amp; Review Term Sheet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Review Structured Terms */}
      {step === 2 && parsedPreview && (
        <Card className="animate-milestone-enter">
          <CardHeader>
            <CardTitle>2. Review Structured Smart Contract Term Sheet</CardTitle>
            <CardDescription>
              Verify the parsed terms before deploying the <code className="font-mono text-brand-400">LoanPool</code> instance on-chain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border border-dark-border-default rounded-lg divide-y divide-dark-border-subtle bg-dark-bg-3 text-xs">
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-dark-text-secondary">Principal Target:</span>
                <span className="font-bold text-dark-text-primary font-mono text-sm">
                  {formatEther(parsedPreview.targetWei)}
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-dark-text-secondary">Interest Rate:</span>
                <span className="font-bold text-dark-text-primary font-mono">
                  {formatApr(parsedPreview.aprBps)}
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-dark-text-secondary">Duration:</span>
                <span className="font-bold text-dark-text-primary font-mono">
                  {formatDuration(parsedPreview.durationSeconds)}
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-dark-text-secondary">Spending Cap:</span>
                <span className="font-bold text-dark-text-primary font-mono">
                  {formatEther(parsedPreview.maxSpendWei)}
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-dark-text-secondary">Default Quorum:</span>
                <span className="font-bold text-dark-text-primary font-mono">
                  {(parsedPreview.defaultQuorumBps / 100).toFixed(2)}% (Capital-weighted)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Edit
              </Button>
              <Button
                variant="primary"
                onClick={handleDeploy}
                icon={<FileText className="w-4 h-4" />}
              >
                Deploy Agreement to Blockchain
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Deploy On-Chain (Transaction Lifecycle) */}
      {step === 3 && (
        <Card className="animate-milestone-enter">
          <CardHeader>
            <CardTitle>3. On-Chain Contract Instantiation</CardTitle>
            <CardDescription>
              Observing smart contract factory deployment and reputation authorization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {contractTxState && <TransactionLifecycle state={contractTxState} />}

            {contractTxState?.step === 'confirmed' && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-dark-text-primary space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="font-semibold text-sm">LoanPool Contract Active &amp; Ready for Funding</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowMilestone(true)}
                    className="text-xs"
                  >
                    View Milestone
                  </Button>
                </div>
                <div className="text-xs text-dark-text-secondary leading-relaxed">
                  The agreement was successfully recorded on the local EVM. Lenders can now inspect the terms and contribute pooled funds toward the target.
                </div>
                <div className="flex items-center gap-3 pt-1">
                  {createdPoolId && createdPoolId.startsWith('0x') && createdPoolId.length === 42 ? (
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/app/agreements/${createdPoolId}`)}
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      Open Agreement Details
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    onClick={() => navigate('/app/borrower/agreements')}
                  >
                    View My Agreements
                  </Button>
                </div>
              </div>
            )}

            {(contractTxState?.step === 'failed' || contractTxState?.step === 'rejected') && (
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Return to Term Sheet
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeploy}
                  disabled={isExecuting}
                >
                  Retry Deployment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Milestone Celebration Modal */}
      {createdPoolId && (
        <MilestoneCelebration
          open={showMilestone}
          onClose={() => setShowMilestone(false)}
          type="AGREEMENT_CREATED"
          contractAddress={createdPoolId}
          txHash={contractTxState?.txHash}
          amountEth={parsedPreview ? formatEther(parsedPreview.targetWei) : undefined}
          primaryAction={{
            label: 'Open Agreement Details',
            onClick: () => {
              setShowMilestone(false);
              navigate(`/app/agreements/${createdPoolId}`);
            },
          }}
        />
      )}
    </div>
  );
};
