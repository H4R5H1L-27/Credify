import React from 'react';
import { TechnicalPanel } from '../../components/console';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Scale,
  Users,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Coins,
  Send,
  Vote,
  ExternalLink,
} from 'lucide-react';

export const ConsoleTrustModelPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold font-sans tracking-tight text-slate-950 uppercase flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-yellow-700" />
          Protocol Trust Model &amp; Formal Threat Analysis
        </h1>
        <p className="text-xs text-slate-600 mt-0.5 font-medium">
          Comprehensive specification of institutional trust boundaries, verifier responsibilities, and smart contract mitigations.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: THE TRUST MODEL & AUTHORITATIVE DISCLAIMER
          ═══════════════════════════════════════════════════════════════ */}
      <TechnicalPanel
        title="Authoritative Trust Boundaries &amp; Verification Role"
        subtitle="Specification of trust relationships, verifier attestation mechanics, and scope limitations."
        badge={<span className="font-mono text-xs font-bold text-yellow-950 bg-yellow-100 border border-yellow-300 px-2 py-0.5 rounded">TRUST BOUNDARY</span>}
      >
        <div className="space-y-5 font-sans text-xs">
          {/* Explicit Mandatory Academic Disclaimer */}
          <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-300 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-yellow-800 shrink-0" />
              <span className="font-bold text-yellow-950 text-xs uppercase tracking-wider">
                Institutional Scope &amp; Trust Model Disclaimer
              </span>
            </div>
            <p className="text-xs text-yellow-950 leading-relaxed font-medium">
              An authorized verifier reviews a submitted profile and records approval on-chain; this is not a government ID check or regulated KYC; the deployment runs on the Sepolia testnet with test ETH. This software is an academic demonstration for a blockchain engineering course. It carries no regulated compliance certifications, no formal third-party audit warranty, no mainnet deployment, and zero real-money utility.
            </p>
          </div>

          {/* Who Trusts Whom Matrix */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Participant Trust Matrix
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="font-bold text-slate-950 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-700" />
                  <span>Syndicate Lenders Trust</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 leading-relaxed list-disc list-inside">
                  <li><strong>The Smart Contract Bytecode:</strong> Funds are locked in an immutable <code>LoanPool</code> vault with no administrative backdoors.</li>
                  <li><strong>The Verifier's Attestation:</strong> Lenders rely on the on-chain KYC attestation that the borrower's identity and suppliers have been reviewed.</li>
                  <li><strong>Waterfall Mathematics:</strong> Trusting the EVM to compute pro-rata dividends deterministically without human discretion.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="font-bold text-slate-950 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-yellow-700" />
                  <span>Borrowers Trust</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 leading-relaxed list-disc list-inside">
                  <li><strong>Immutable Term Sheets:</strong> Interest rates (APR basis points), duration, and merchant caps are frozen in contract storage at creation.</li>
                  <li><strong>Repayment Finality:</strong> Repaying the calculated principal and interest mathematically clears the loan and awards +8 reputation points on-chain.</li>
                  <li><strong>Grace Period Protection:</strong> Lenders cannot trigger default before maturity + the 3-day grace period.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="font-bold text-slate-950 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-purple-700" />
                  <span>Suppliers Trust</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 leading-relaxed list-disc list-inside">
                  <li><strong>Direct Protocol Settlement:</strong> Approved invoices trigger immediate ETH transfers directly from the contract vault to the vendor's wallet.</li>
                  <li><strong>No Intermediary Delays:</strong> Payment does not route through borrower bank accounts or clearinghouse delays.</li>
                  <li><strong>Public Invoicing Proof:</strong> The on-chain <code>SpendExecuted</code> event provides immutable cryptographic proof of payment.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Role of the Verifier Deep-Dive */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              Role and Architecture of the Authorized Verifier
            </h3>
            <p className="text-slate-700 leading-relaxed font-medium">
              In Credify, identity verification is modeled as a <strong>semi-trusted cryptographic attestation service</strong>. An authorized entity holding the <code>VERIFIER_ROLE</code> in <code>KYCRegistry.sol</code> evaluates submitted documentation off-chain.
            </p>
            <div className="font-mono text-xs bg-white p-3 rounded-lg border border-slate-200 text-slate-800 space-y-1">
              <div className="text-slate-500 font-bold">// Salted Credential Hash Scheme (WP2 ADR-003)</div>
              <div>bytes32 credentialHash = keccak256(abi.encodePacked(role, applicant, expiresAt, salt));</div>
              <div>kycRegistry.setVerification(applicant, role, credentialHash, expiresAt);</div>
            </div>
            <p className="text-slate-600 leading-relaxed">
              This pattern protects user privacy by avoiding raw PII storage on-chain while binding the verification to a specific participant, role, salt, and expiry timestamp.
            </p>
          </div>
        </div>
      </TechnicalPanel>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: THREAT MODEL & MITIGATIONS
          ═══════════════════════════════════════════════════════════════ */}
      <TechnicalPanel
        title="Formal Threat Analysis &amp; Smart Contract Mitigations"
        subtitle="Matrix of identified economic and technical attack vectors with their architectural counter-measures."
        badge={<span className="font-mono text-xs font-bold text-rose-950 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">7 VECTORS AUDITED</span>}
      >
        <div className="space-y-4 font-sans text-xs">
          {/* Threat Vector 1 */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Vector 1: Sybil Borrower &amp; Shell Identity Attacks</span>
              </div>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                MITIGATED
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Attack Scenario:</strong> A malicious actor spins up arbitrary disposable EVM addresses to request loans, withdraw capital, and abandon the addresses when repayment falls due.
            </p>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium leading-relaxed">
              <strong>Protocol Mitigation:</strong> (1) <code>LoanFactory.createLoan</code> enforces <code>require(kycRegistry.isVerifiedRole(msg.sender, BORROWER))</code>, requiring salted verifier approval. (2) Borrowers cannot withdraw raw funds; ETH is strictly locked to approved supplier invoices. (3) Defaults incur a permanent -20 reputation penalty in <code>ReputationRegistry.sol</code>.
            </div>
          </div>

          {/* Threat Vector 2 */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Vector 2: Supplier Collusion &amp; Capital Extraction</span>
              </div>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                MITIGATED
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Attack Scenario:</strong> A borrower lists a puppet address as a supplier and triggers disbursements to cash out pooled loan capital.
            </p>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium leading-relaxed">
              <strong>Protocol Mitigation:</strong> (1) Suppliers must be pre-verified by the authorized verifier. (2) Each supplier has an immutable individual <code>merchantCap</code> set at agreement creation. (3) <code>LoanFactory</code> enforces a 10-merchant cap, rejects zero addresses, and prevents duplicate entries with custom errors.
            </div>
          </div>

          {/* Threat Vector 3 */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Vector 3: Malicious Reentrancy via Fallback Handlers</span>
              </div>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                MITIGATED
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Attack Scenario:</strong> A smart contract merchant or lender registers a malicious <code>receive()</code> or <code>fallback()</code> handler that reenters <code>spend()</code> or <code>claimRepayment()</code> before balances are updated.
            </p>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium leading-relaxed">
              <strong>Protocol Mitigation:</strong> (1) OpenZeppelin <code>ReentrancyGuard</code> protects all state-changing external functions. (2) Strict Checks-Effects-Interactions (CEI) architecture: storage variables (e.g. <code>claimed[msg.sender]</code>, <code>totalSpent</code>) are updated <em>prior</em> to issuing low-level ETH transfers. Verified by Slither static analysis.
            </div>
          </div>

          {/* Threat Vector 4 */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Vector 4: Premature Default Griefing by Lenders</span>
              </div>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                MITIGATED
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Attack Scenario:</strong> Syndicate lenders vote default immediately after pooling funds to liquidate the borrower and trigger reputation penalties.
            </p>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium leading-relaxed">
              <strong>Protocol Mitigation:</strong> (1) <code>LoanPool.voteDefault</code> reverts with <code>MaturityNotReached</code> if <code>block.timestamp &lt; maturity</code>. (2) Reverts with <code>GracePeriodActive</code> during the 3 days following maturity. (3) Requires a strict capital-weighted majority quorum threshold (&gt;50.01% / 5001 bps).
            </div>
          </div>

          {/* Threat Vector 5 */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Vector 5: Locked Funds &amp; Incomplete Distribution</span>
              </div>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                MITIGATED
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Attack Scenario / Flaw:</strong> If a borrower spends less than the target, leftover capital remains frozen in contract escrow after loan repayment or default.
            </p>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium leading-relaxed">
              <strong>Protocol Mitigation:</strong> The <code>distributable()</code> formula (ADR-001) dynamically factors in <code>totalContributed - totalSpent</code> in terminal states. Pro-rata claims pull both repayments and unspent principal without locking.
            </div>
          </div>

          {/* Threat Vector 6 */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Vector 6: Indefinite Capital Lockup in Underfunded Pools</span>
              </div>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                MITIGATED
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Attack Scenario:</strong> A loan raises partial capital (e.g. 4 of 10 ETH) and the funding deadline passes, freezing lender funds in limbo.
            </p>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium leading-relaxed">
              <strong>Protocol Mitigation:</strong> The contract enforces a dedicated <code>fundingDeadline</code>. Once elapsed, any participant can call <code>cancelUnfunded()</code> to transition the pool to CANCELLED and enable 100% principal refunds.
            </div>
          </div>

          {/* Threat Vector 7 */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Vector 7: Non-Lender Syndicate Contribution &amp; Governance Hijacking</span>
              </div>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                MITIGATED
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Attack Scenario:</strong> An unauthorized actor (e.g. supplier, borrower, or unvetted external account) calls <code>LoanPool.contribute()</code> to deposit capital, acquire loan voting weight, or self-fund credit lines.
            </p>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium leading-relaxed">
              <strong>Protocol Mitigation:</strong> (1) <code>LoanPool.contribute()</code> strictly enforces <code>require(IKYCRegistry(kycRegistry).isVerified(msg.sender, IKYCRegistry.Role.Lender))</code>, reverting immediately with custom error <code>NotVerifiedLender()</code>. (2) Reverts with <code>BorrowerCannotContribute()</code> if the borrower attempts to fund their own pool.
            </div>
          </div>
        </div>
      </TechnicalPanel>
    </div>
  );
};
