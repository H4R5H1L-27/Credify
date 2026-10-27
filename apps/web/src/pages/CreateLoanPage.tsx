import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import { useIdentity } from '../context/IdentityContext';
import { useWallet } from '../context/WalletContext';
import { useContractAction } from '../hooks/useContractAction';
import { useEvaluatorContracts } from '../hooks/useCredify';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { TransactionLifecycle } from '../components/ui/TransactionLifecycle';
import { MilestoneCelebration } from '../components/ui/MilestoneCelebration';
import { formatEther, formatApr, formatDuration } from '../lib/utils';
import { api } from '../lib/api';
import { type AgreementParseResult, type TermSheet, kycAbi } from '@credify/shared';
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Hash,
  Sparkles,
  Check,
  Building,
  HelpCircle
} from 'lucide-react';

const PRESETS = [
  {
    title: 'Laboratory Hardware & Sensor Upgrade (10 ETH · 14 Days · 8%)',
    text: 'Create a 10 ETH credit agreement for 14 days at 8% APR with an 8 ETH spending cap to purchase research sensors from BuildRight Supplies.',
  },
  {
    title: 'Research Computing Facility Allocation (5 ETH · 30 Days · 5%)',
    text: 'Create a 5 ETH credit agreement for 30 days at 5% APR with a 4 ETH spending cap for server infrastructure from StudioGrid Equipment.',
  },
  {
    title: 'Short-Term Multi-Vendor Facility (8 ETH · 21 Days · 7%)',
    text: 'Create an 8 ETH credit agreement for 21 days at 7% APR with a 6 ETH spending cap. Disbursements split between BuildRight Supplies and StudioGrid Equipment.',
  },
];

export const CreateLoanPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, isBorrower, isVerified, identity, address, isGuidedMode } = useIdentity();
  const { targetChainId } = useWallet();
  const { executeCreateLoan, executeAttestOnChain, txState: contractTxState, isExecuting } = useContractAction();
  const { data: evaluatorContracts } = useEvaluatorContracts();

  const isSepolia = targetChainId === 11155111 || evaluatorContracts?.network === 'sepolia';
  const kycAddress = evaluatorContracts?.contracts?.kycRegistry as `0x${string}` | undefined;

  const { data: onChainVerified, refetch: refetchOnChainKyc } = useReadContract({
    address: kycAddress,
    abi: kycAbi as any,
    functionName: 'isVerified',
    args: address ? [address as `0x${string}`, 1] : undefined,
    query: {
      enabled: Boolean(address && !isGuidedMode && kycAddress),
    }
  });

  const { data: isVerifierOnChain } = useReadContract({
    address: kycAddress,
    abi: kycAbi as any,
    functionName: 'hasRole',
    args: address ? ['0x0ce23c3e399818cfee81a7ab0880f714e53d7672b08df0fa62f2843416e1ea09' as `0x${string}`, address as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(address && !isGuidedMode && kycAddress),
    }
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [agreementText, setAgreementText] = useState(PRESETS[0].text);
  const [showMilestone, setShowMilestone] = useState(false);

  // Server-parsed state (replaces client-side regex heuristics)
  const [parseResult, setParseResult] = useState<AgreementParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [acceptedDefaults, setAcceptedDefaults] = useState<Record<string, any>>({
    fundingDays: 7,
    defaultQuorumPercent: 50.01,
    gracePeriodDays: 3,
  });

  const [createdPoolId, setCreatedPoolId] = useState<string | null>(null);

  // Call the server-side parse endpoint POST /api/v1/agreements/parse
  const parseWithServer = async (defaultsOverride?: Record<string, any>) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const defaults = defaultsOverride || acceptedDefaults;
      const res = await api.parseAgreement({
        agreementText,
        acceptedDefaults: defaults,
        borrowerAddress: address,
      });
      setParseResult(res);
      setStep(2);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse agreement with server');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAcceptDefault = async (field: string, value: any) => {
    const updated = { ...acceptedDefaults, [field]: value };
    setAcceptedDefaults(updated);
    await parseWithServer(updated);
  };

  const handleDeploy = async () => {
    if (!parseResult || !parseResult.terms) return;
    setStep(3);
    try {
      const res = await executeCreateLoan({
        naturalLanguageText: agreementText,
        terms: parseResult.terms,
      });
      setCreatedPoolId(res.poolAddress);
      setShowMilestone(true);
    } catch {
      // Handled in useContractAction txState
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/app/borrower/agreements" className="hover:text-slate-900 transition-colors duration-fast">
          Agreements
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold">New Credit Agreement</span>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-950 tracking-tight font-sans">Create Loan Agreement</h1>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          Draft terms in natural language. The server parses and maps enforceable clauses into a strict smart contract term sheet, cryptographically anchored to the <code className="font-mono text-yellow-950 bg-yellow-100 px-1 py-0.5 rounded font-bold">LoanFactory</code>.
        </p>
      </div>

      {/* Identity Verification Gate Alert */}
      {!isVerified && (
        <Alert variant="warning" title="On-Chain Verification Required">
          <div className="space-y-2">
            <p>
              Your connected wallet (<strong className="font-mono">{address ? `${address.slice(0, 8)}...` : 'Not Connected'}</strong>) has not completed identity attestation on the <code className="font-mono">KYCRegistry</code> smart contract.
              Loan deployment will revert on-chain without verified status.
            </p>
            <div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate('/app/verify')}
                className="text-xs font-bold"
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
          Your connected wallet identity is registered as <strong>{identity?.role || 'LENDER'}</strong>.
          Agreements are typically initiated by verified Borrowers.
        </Alert>
      )}

      {/* Stepper Progress */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors duration-normal ${
              step >= 1 ? 'bg-[#ffe600] text-black border border-yellow-400 font-black shadow-xs' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            1
          </span>
          <span className={step >= 1 ? 'text-slate-950 font-bold' : 'text-slate-500'}>Natural Language Agreement</span>
        </div>
        <div className="w-12 h-px bg-slate-200" />
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors duration-normal ${
              step >= 2 ? 'bg-[#ffe600] text-black border border-yellow-400 font-black shadow-xs' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            2
          </span>
          <span className={step >= 2 ? 'text-slate-950 font-bold' : 'text-slate-500'}>Review &amp; Cryptographic Binding</span>
        </div>
        <div className="w-12 h-px bg-slate-200" />
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors duration-normal ${
              step >= 3 ? 'bg-[#ffe600] text-black border border-yellow-400 font-black shadow-xs' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            3
          </span>
          <span className={step >= 3 ? 'text-slate-950 font-bold' : 'text-slate-500'}>Deploy On-Chain</span>
        </div>
      </div>

      {parseError && (
        <Alert variant="error" title="Agreement Parsing Failed">
          {parseError}
        </Alert>
      )}

      {/* STEP 1: Describe Agreement */}
      {step === 1 && (
        <Card className="animate-milestone-enter bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950 font-bold">1. Natural Language Agreement Terms</CardTitle>
            <CardDescription className="text-slate-600 font-medium">
              Write terms describing principal target, APR, loan tenure, spend cap, and approved suppliers. The parser translates plain English into validated parameters for the fixed smart contract template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Agreement Text
              </label>
              <textarea
                value={agreementText}
                onChange={(e) => setAgreementText(e.target.value)}
                rows={5}
                className="w-full text-sm p-3.5 rounded-xl border border-slate-300 bg-white text-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 font-sans leading-relaxed"
                placeholder="e.g. Create a 10 ETH credit agreement for 14 days at 8% APR with an 8 ETH spending cap to purchase research sensors from BuildRight Supplies."
              />
            </div>

            {/* Presets Helper */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Standard Verified Templates:
              </span>
              <div className="space-y-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAgreementText(p.text)}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-yellow-400 bg-slate-50 hover:bg-yellow-50/30 transition-all duration-fast text-xs flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-slate-950 group-hover:text-yellow-950 transition-colors">
                        {p.title}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5 font-medium">{p.text}</div>
                    </div>
                    <span className="text-xs text-yellow-800 font-bold shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">Use &rarr;</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={() => parseWithServer()}
                disabled={!agreementText.trim() || !isVerified || isParsing}
                icon={<ArrowRight className="w-4 h-4" />}
                className="font-bold"
              >
                {isParsing ? 'Parsing with Server...' : 'Parse & Review Term Sheet'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Review Structured Terms & Cryptographic Binding */}
      {step === 2 && parseResult && (
        <div className="space-y-6 animate-milestone-enter">
          {/* Side-by-Side: Original Text & Plain English Reverse Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Original Agreement Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-800 leading-relaxed border border-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {parseResult.rawText}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50/40 border-yellow-200 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold text-yellow-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                  Contract Enforceable Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-white/80 rounded-xl text-xs text-slate-900 leading-relaxed border border-yellow-200 font-sans font-medium max-h-48 overflow-y-auto">
                  {parseResult.summary}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cryptographic Agreement Hash Badge */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Hash className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <div className="text-xs font-mono text-yellow-400 font-bold flex items-center gap-2">
                  <span>agreementHash: {parseResult.agreementHash.slice(0, 18)}...{parseResult.agreementHash.slice(-10)}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-sans border border-slate-700">
                    Keccak256
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-sans mt-0.5">
                  This 32-byte cryptographic commitment is stored in the contract to immutably bind the agreement.
                </div>
              </div>
            </div>
            <div className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              Parser: <strong className="text-white capitalize">{parseResult.parser}</strong>
            </div>
          </div>

          {/* Unsupported Clauses Alert */}
          {parseResult.unsupportedClauses.length > 0 && (
            <Alert variant="warning" title="Unsupported Off-Chain Clauses Detected">
              <div className="space-y-2 mt-1">
                <p className="text-xs">
                  The agreement text contains terms that cannot be enforced on-chain by the smart contract protocol. These provisions remain purely off-chain legal covenants:
                </p>
                <div className="space-y-1.5 pt-1">
                  {parseResult.unsupportedClauses.map((c, i) => (
                    <div key={i} className="text-xs bg-yellow-100/70 p-2 rounded-lg border border-yellow-300">
                      <div className="font-bold text-yellow-950 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-700 shrink-0" />
                        {c.clause}: <span className="font-normal italic">"{c.quote}"</span>
                      </div>
                      <div className="text-yellow-900 mt-0.5">{c.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Alert>
          )}

          {/* Unresolved Merchants Alert */}
          {parseResult.unresolvedMerchants.length > 0 && (
            <Alert variant="warning" title="Unverified Supplier Names Detected">
              <div className="space-y-1.5 mt-1 text-xs">
                <p>
                  The following vendor names were mentioned in text but are not registered verified suppliers in the <code className="font-mono">KYCRegistry</code>:
                </p>
                <ul className="list-disc pl-5 font-bold text-slate-900">
                  {parseResult.unresolvedMerchants.map((u, i) => (
                    <li key={i}>{u.name}</li>
                  ))}
                </ul>
                <p className="text-slate-600">
                  On-chain disbursements are strictly blocked for unverified suppliers.
                </p>
              </div>
            </Alert>
          )}

          {/* Missing Required Terms Warning */}
          {parseResult.missingFields.length > 0 && (
            <Alert variant="error" title="Missing Required Contract Parameters">
              <div className="space-y-2 mt-1 text-xs">
                <p>
                  The agreement cannot be deployed because required smart contract parameters were not specified in the text:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {parseResult.missingFields.map((field) => (
                    <span key={field} className="px-2 py-1 rounded bg-red-100 text-red-900 border border-red-200 font-mono font-bold">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </Alert>
          )}

          {/* Structured Parameter Inspection Table */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-950 font-bold">Smart Contract Parameters</CardTitle>
              <CardDescription className="text-slate-600 font-medium text-xs">
                Review the exact parameters being passed to <code className="font-mono text-yellow-950 bg-yellow-100 px-1 py-0.5 rounded font-bold">LoanFactory.createLoan</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 bg-slate-50 text-xs">
                {/* Target */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 font-medium block">Principal Target:</span>
                    {parseResult.fields.targetEth.quote && (
                      <span className="text-[11px] text-slate-500 italic block mt-0.5">Quote: "{parseResult.fields.targetEth.quote}"</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      parseResult.fields.targetEth.source === 'text' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {parseResult.fields.targetEth.source === 'text' ? 'From Text' : 'Default'}
                    </span>
                    <span className="font-black text-slate-950 font-mono text-sm">
                      {parseResult.fields.targetEth.value ? `${parseResult.fields.targetEth.value} ETH` : 'Unspecified'}
                    </span>
                  </div>
                </div>

                {/* APR */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 font-medium block">Interest Rate (APR):</span>
                    {parseResult.fields.aprPercent.quote && (
                      <span className="text-[11px] text-slate-500 italic block mt-0.5">Quote: "{parseResult.fields.aprPercent.quote}"</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      parseResult.fields.aprPercent.source === 'text' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {parseResult.fields.aprPercent.source === 'text' ? 'From Text' : 'Default'}
                    </span>
                    <span className="font-bold text-slate-950 font-mono">
                      {parseResult.fields.aprPercent.value !== undefined ? `${parseResult.fields.aprPercent.value}% (${Math.round(parseResult.fields.aprPercent.value * 100)} bps)` : 'Unspecified'}
                    </span>
                  </div>
                </div>

                {/* Duration */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 font-medium block">Loan Duration:</span>
                    {parseResult.fields.durationDays.quote && (
                      <span className="text-[11px] text-slate-500 italic block mt-0.5">Quote: "{parseResult.fields.durationDays.quote}"</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      parseResult.fields.durationDays.source === 'text' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {parseResult.fields.durationDays.source === 'text' ? 'From Text' : 'Default'}
                    </span>
                    <span className="font-bold text-slate-950 font-mono">
                      {parseResult.fields.durationDays.value !== undefined ? `${parseResult.fields.durationDays.value} days` : 'Unspecified'}
                    </span>
                  </div>
                </div>

                {/* Spending Cap */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 font-medium block">Global Spending Cap:</span>
                    {parseResult.fields.spendCapEth.quote && (
                      <span className="text-[11px] text-slate-500 italic block mt-0.5">Quote: "{parseResult.fields.spendCapEth.quote}"</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      parseResult.fields.spendCapEth.source === 'text' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {parseResult.fields.spendCapEth.source === 'text' ? 'From Text' : 'Default'}
                    </span>
                    <span className="font-black text-slate-950 font-mono">
                      {parseResult.fields.spendCapEth.value ? `${parseResult.fields.spendCapEth.value} ETH` : 'Unspecified'}
                    </span>
                  </div>
                </div>

                {/* Funding Window */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 font-medium block">Syndicate Funding Window:</span>
                    {parseResult.fields.fundingDays.quote && (
                      <span className="text-[11px] text-slate-500 italic block mt-0.5">Quote: "{parseResult.fields.fundingDays.quote}"</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      parseResult.fields.fundingDays.source === 'text' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {parseResult.fields.fundingDays.source === 'text' ? 'From Text' : 'Default'}
                    </span>
                    <span className="font-bold text-slate-950 font-mono">
                      {parseResult.fields.fundingDays.value !== undefined ? `${parseResult.fields.fundingDays.value} days` : '7 days (Default)'}
                    </span>
                  </div>
                </div>

                {/* Default Quorum */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 font-medium block">Default Voting Quorum:</span>
                    {parseResult.fields.defaultQuorumPercent.quote && (
                      <span className="text-[11px] text-slate-500 italic block mt-0.5">Quote: "{parseResult.fields.defaultQuorumPercent.quote}"</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      parseResult.fields.defaultQuorumPercent.source === 'text' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {parseResult.fields.defaultQuorumPercent.source === 'text' ? 'From Text' : 'Default'}
                    </span>
                    <span className="font-bold text-slate-950 font-mono">
                      {parseResult.fields.defaultQuorumPercent.value !== undefined ? `${parseResult.fields.defaultQuorumPercent.value}%` : '50.01% (Default)'}
                    </span>
                  </div>
                </div>

                {/* Grace Period */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 font-medium block">Overdue Grace Period:</span>
                    {parseResult.fields.gracePeriodDays.quote && (
                      <span className="text-[11px] text-slate-500 italic block mt-0.5">Quote: "{parseResult.fields.gracePeriodDays.quote}"</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      parseResult.fields.gracePeriodDays.source === 'text' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {parseResult.fields.gracePeriodDays.source === 'text' ? 'From Text' : 'Default'}
                    </span>
                    <span className="font-bold text-slate-950 font-mono">
                      {parseResult.fields.gracePeriodDays.value !== undefined ? `${parseResult.fields.gracePeriodDays.value} days` : '3 days (Default)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Suppliers Breakdown */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Verified Allowed Suppliers ({parseResult.resolvedMerchants.length}):
                </span>
                {parseResult.resolvedMerchants.length > 0 ? (
                  <div className="space-y-2">
                    {parseResult.resolvedMerchants.map((m, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <Building className="w-4 h-4 text-slate-500" />
                          <div>
                            <div className="font-bold text-slate-950">{m.name}</div>
                            <div className="font-mono text-[11px] text-slate-500">{m.address}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 font-mono">
                            {m.capEth ? `Cap: ${m.capEth} ETH` : 'Pro-rata Spend Cap'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 text-center">
                    No verified suppliers recognized in text.
                  </div>
                )}
              </div>

              {/* On-Chain KYC Warning for Sepolia Live Chain Mode */}
              {!isGuidedMode && isSepolia && onChainVerified === false && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-amber-950 text-sm">
                        On-Chain KYC Attestation Required
                      </div>
                      <p className="text-amber-900 leading-relaxed font-medium">
                        Address <code className="bg-amber-100 font-mono px-1 rounded font-bold">{address}</code> has not been attested in the Sepolia <code className="bg-amber-100 font-mono px-1 rounded font-bold">KYCRegistry</code> contract ({kycAddress ? `${kycAddress.slice(0, 6)}...${kycAddress.slice(-4)}` : ''}).
                        Deploying loans on Sepolia requires on-chain borrower attestation (otherwise the smart contract simulation reverts with <code className="font-mono text-amber-950 bg-amber-200 px-1 rounded">BorrowerNotVerified()</code>).
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2">
                    {isVerifierOnChain || address?.toLowerCase() === '0x448920c465158b78a694460e96e022b82b35c6e2' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={async () => {
                          if (!address) return;
                          try {
                            if (executeAttestOnChain) {
                              await executeAttestOnChain(address as `0x${string}`, 1);
                            }
                            if (typeof refetchOnChainKyc === 'function') {
                              await (refetchOnChainKyc as any)();
                            }
                          } catch {}
                        }}
                        disabled={isExecuting}
                        className="text-xs font-bold"
                      >
                        Attest Active Wallet as Borrower on Sepolia (1-Click)
                      </Button>
                    ) : (
                      <div className="text-[11px] text-amber-800 space-y-1">
                        <span className="font-bold block">How to proceed:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                          <li>Switch to <strong>Evaluator (Guided)</strong> mode in the top right to simulate transactions with pre-verified demo keys.</li>
                          <li>Or switch in MetaMask to the deployer/verifier account (<code className="font-mono text-xs">0x4489...C6e2</code>) to attest your address on-chain.</li>
                          <li>Or connect with the pre-attested Sepolia borrower account (<code className="font-mono text-xs">0xa69380a4E44B6084205A3B721d7Cdff582EB7793</code>).</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  icon={<ArrowLeft className="w-4 h-4" />}
                  className="font-bold bg-white border-slate-300 text-slate-900 hover:bg-slate-50"
                >
                  Edit Agreement Text
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeploy}
                  disabled={
                    !parseResult.isValid ||
                    !parseResult.terms ||
                    isExecuting ||
                    (!isGuidedMode && isSepolia && onChainVerified === false)
                  }
                  icon={<FileText className="w-4 h-4" />}
                  className="font-bold"
                >
                  Deploy Agreement to Blockchain
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: Deploy On-Chain (Transaction Lifecycle) */}
      {step === 3 && (
        <Card className="animate-milestone-enter bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950 font-bold">3. On-Chain Contract Instantiation</CardTitle>
            <CardDescription className="text-slate-600 font-medium">
              Observing smart contract factory deployment and reputation authorization on the EVM.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {contractTxState && <TransactionLifecycle state={contractTxState} />}

            {contractTxState?.step === 'confirmed' && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-slate-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm text-emerald-950">LoanPool Contract Active &amp; Ready for Funding</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowMilestone(true)}
                    className="text-xs font-bold bg-white border-slate-300 text-slate-900 hover:bg-slate-50"
                  >
                    View Milestone
                  </Button>
                </div>
                <div className="text-xs text-slate-800 leading-relaxed font-medium">
                  The agreement was successfully deployed to the blockchain with immutable hash binding <code className="font-mono text-emerald-900 font-bold">{parseResult?.agreementHash.slice(0, 16)}...</code>. Lenders can now inspect and fund the syndicate pool.
                </div>
                <div className="flex items-center gap-3 pt-1">
                  {createdPoolId && createdPoolId.startsWith('0x') && createdPoolId.length === 42 ? (
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/app/loans/${createdPoolId}`)}
                      icon={<ArrowRight className="w-4 h-4" />}
                      className="font-bold"
                    >
                      Open Agreement Details
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    onClick={() => navigate('/app/borrower/agreements')}
                    className="font-bold bg-white border-slate-300 text-slate-900 hover:bg-slate-50"
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
                  className="font-bold bg-white border-slate-300 text-slate-900 hover:bg-slate-50"
                >
                  Return to Term Sheet
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeploy}
                  disabled={isExecuting}
                  className="font-bold"
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
          amountEth={parseResult?.fields.targetEth.value}
          primaryAction={{
            label: 'Open Agreement Details',
            onClick: () => {
              setShowMilestone(false);
              navigate(`/app/loans/${createdPoolId}`);
            },
          }}
        />
      )}
    </div>
  );
};
