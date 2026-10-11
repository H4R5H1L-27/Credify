import React, { useState } from 'react';
import { TechnicalPanel } from '../../components/console';
import {
  BookOpen,
  Scale,
  Send,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Layers,
  Coins,
  Calculator,
  Lock,
  RotateCcw,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

export const ConsoleConceptsPage: React.FC = () => {
  // Interactive Waterfall Sandbox State
  const [calcTargetEth, setCalcTargetEth] = useState(10);
  const [calcSpentEth, setCalcSpentEth] = useState(6);
  const [calcAprBps, setCalcAprBps] = useState(800); // 8%
  const [calcRepaidEth, setCalcRepaidEth] = useState(6.48); // 6 ETH spent + 8% interest
  const [calcStatus, setCalcStatus] = useState<'REPAID' | 'DEFAULTED'>('REPAID');

  // Lenders contributions
  const [lenderAContrib, setLenderAContrib] = useState(5); // 50%
  const [lenderBContrib, setLenderBContrib] = useState(3); // 30%
  const [lenderCContrib, setLenderCContrib] = useState(2); // 20%

  const totalContrib = lenderAContrib + lenderBContrib + lenderCContrib;
  const unspentPrincipal = Math.max(0, totalContrib - calcSpentEth);

  // Distributable computation
  const distributable = calcRepaidEth + unspentPrincipal;

  // Lender payouts
  const calcPayout = (contrib: number) => {
    if (totalContrib === 0) return 0;
    return (contrib * distributable) / totalContrib;
  };

  const payoutA = calcPayout(lenderAContrib);
  const payoutB = calcPayout(lenderBContrib);
  const payoutC = calcPayout(lenderCContrib);

  const yieldA = lenderAContrib > 0 ? (((payoutA - lenderAContrib) / lenderAContrib) * 100).toFixed(2) : '0';
  const yieldB = lenderBContrib > 0 ? (((payoutB - lenderBContrib) / lenderBContrib) * 100).toFixed(2) : '0';
  const yieldC = lenderCContrib > 0 ? (((payoutC - lenderCContrib) / lenderCContrib) * 100).toFixed(2) : '0';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold font-sans tracking-tight text-slate-950 uppercase flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-yellow-700" />
          Protocol Core Concepts &amp; Architectural Theory
        </h1>
        <p className="text-xs text-slate-600 mt-0.5 font-medium">
          Academic walkthrough of multi-lender coordination, controlled supplier disbursements, and the non-locking pro-rata waterfall.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CONCEPT 1: MULTI-LENDER COORDINATION WITHOUT CENTRAL CUSTODY
          ═══════════════════════════════════════════════════════════════ */}
      <TechnicalPanel
        title="1. Multi-Lender Coordination Without Central Custody"
        subtitle="How autonomous EVM escrow pools eliminate custodial intermediaries and counterparty credit risk."
        badge={<span className="font-mono text-xs font-bold text-yellow-950 bg-yellow-100 border border-yellow-300 px-2 py-0.5 rounded">SYNDICATE ESCROW</span>}
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-950 text-sm">The Custodial Problem in Traditional P2P Lending</h3>
            <p className="text-slate-700 leading-relaxed font-medium">
              In traditional finance and legacy Web2 P2P lending platforms, multiple lenders entrust capital to a central platform operator. The operator holds custody of pooled funds in bank accounts, manually processes disbursements, and distributes yield. This introduces <strong>counterparty risk</strong>, <strong>single points of failure</strong>, high management fees, and lack of verifiable accounting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="font-bold text-slate-950 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-yellow-700" />
                <span>Autonomous Smart Contract Vault</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Each credit agreement deploys an isolated, immutable <code>LoanPool</code> smart contract. Capital is committed directly to the contract address on the EVM. Neither the borrower nor Credify administrators hold private keys to withdraw pooled funds.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="font-bold text-slate-950 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-700" />
                <span>All-or-Nothing Funding Window</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Lenders commit capital within a strictly enforced <code>fundingDeadline</code>. If the target threshold is not 100% reached before expiration, any participant can invoke <code>cancelUnfunded()</code>, immediately unlocking 100% principal refunds.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="font-bold text-slate-950 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-indigo-700" />
                <span>Pull-Payment Pattern Safety</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Rather than pushing ETH to all lenders in an iterative loop (which creates gas exhaustion and reentrancy vectors), Credify implements the <strong>pull-payment pattern</strong>: each lender individually calls <code>claimRepayment()</code> to withdraw their share.
              </p>
            </div>
          </div>
        </div>
      </TechnicalPanel>

      {/* ═══════════════════════════════════════════════════════════════
          CONCEPT 2: CONTROLLED DISBURSEMENT VIA ALLOWLISTED SUPPLIERS
          ═══════════════════════════════════════════════════════════════ */}
      <TechnicalPanel
        title="2. Controlled Disbursement via Allowlisted Suppliers"
        subtitle="Eliminating borrower loan diversion through cryptographic vendor allowlisting and on-chain spending caps."
        badge={<span className="font-mono text-xs font-bold text-purple-950 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">ANTI-DIVERSION</span>}
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-950 text-sm">The Loan Diversion Hazard</h3>
            <p className="text-slate-700 leading-relaxed font-medium">
              When business borrowers obtain unsecured credit, lenders face the acute risk of <strong>capital diversion</strong>: the borrower withdraws cash and diverts it to speculative activities, personal expenses, or capital flight rather than approved commercial operations (such as purchasing inventory or equipment).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="font-bold text-slate-950 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-purple-700" />
                <span>Zero Direct Borrower Custody</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                The <code>LoanPool</code> smart contract does not contain any method for the borrower to transfer pooled ETH to their own wallet. Funds can only exit the pool contract through two paths: direct payments to allowlisted suppliers (<code>spend()</code>), or pro-rata claims by lenders (<code>claimRepayment()</code>).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="font-bold text-slate-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>On-Chain Merchant Caps &amp; Invoices</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                At agreement deployment, the factory enforces: maximum 10 merchants, zero-address prevention, duplicate address prevention, and individual spend limits. When spending, the contract verifies <code>merchantSpent[to] + amount &lt;= merchantCaps[to]</code> and emits invoice metadata in <code>SpendExecuted</code>.
              </p>
            </div>
          </div>
        </div>
      </TechnicalPanel>

      {/* ═══════════════════════════════════════════════════════════════
          CONCEPT 3: PRO-RATA WATERFALL & INTERACTIVE SANDBOX
          ═══════════════════════════════════════════════════════════════ */}
      <TechnicalPanel
        title="3. Pro-Rata Waterfall &amp; Unspent Principal Distribution"
        subtitle="Mathematical derivation of the non-locking waterfall formula and interactive simulation calculator."
        badge={<span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">MATHEMATICAL FORMULA</span>}
      >
        <div className="space-y-6 font-sans text-xs">
          {/* Mathematical Explanation */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-950 text-sm">The "Locked Funds" Defect and Resolution (ADR-001)</h3>
              <p className="text-slate-700 leading-relaxed font-medium">
                In basic multi-lender prototypes, lender dividend claims are computed solely from <code>totalRepaid</code>:
              </p>
              <div className="font-mono text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800">
                claimable = (lenderContribution * totalRepaid) / totalContributed - claimed
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                <strong>Defect:</strong> If a pool raised 10 ETH but the borrower only spent 6 ETH and repaid 6.48 ETH (principal + interest), the remaining 4 ETH of unspent principal would remain permanently trapped in the contract escrow because claims only referenced <code>totalRepaid</code>!
              </p>
              <p className="text-slate-700 leading-relaxed font-medium">
                <strong>Credify Solution:</strong> We created the <code>distributable()</code> view in <code>LoanPool.sol</code>:
              </p>
              <div className="font-mono text-xs bg-yellow-50 p-2.5 rounded-lg border border-yellow-300 text-yellow-950 font-bold">
                distributable() = (status == Repaid || status == Defaulted) ? totalRepaid + (totalContributed - totalSpent) : totalRepaid
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                This guarantees that unspent principal is returned pro-rata to lenders in both terminal states (Repaid or Defaulted), while ensuring the vault balance never falls below outstanding entitlements.
              </p>
            </div>
          </div>

          {/* Interactive Sandbox */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-yellow-700" />
              <h3 className="font-bold text-slate-950 text-sm">Interactive Pro-Rata Waterfall Simulator</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Simulator Inputs */}
              <div className="space-y-4">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Loan Agreement Parameters
                </span>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">Total Capital Contributed:</span>
                    <span className="font-mono font-bold text-slate-950">{totalContrib} ETH</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold">Lender A (ETH)</span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={lenderAContrib}
                        onChange={(e) => setLenderAContrib(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold">Lender B (ETH)</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={lenderBContrib}
                        onChange={(e) => setLenderBContrib(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold">Lender C (ETH)</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={lenderCContrib}
                        onChange={(e) => setLenderCContrib(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 font-mono text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">Disbursed to Suppliers (Spent):</span>
                    <span className="font-mono font-bold text-slate-950">{calcSpentEth} ETH</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={totalContrib}
                    step="0.5"
                    value={calcSpentEth}
                    onChange={(e) => setCalcSpentEth(Number(e.target.value))}
                    className="w-full accent-yellow-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">Repaid by Borrower:</span>
                    <span className="font-mono font-bold text-slate-950">{calcRepaidEth} ETH</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={calcSpentEth * 1.5}
                    step="0.1"
                    value={calcRepaidEth}
                    onChange={(e) => setCalcRepaidEth(Number(e.target.value))}
                    className="w-full accent-yellow-400"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-700 block">Terminal Status:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCalcStatus('REPAID')}
                      className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-xs border ${
                        calcStatus === 'REPAID'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      REPAID (+8 pts)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcStatus('DEFAULTED')}
                      className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-xs border ${
                        calcStatus === 'DEFAULTED'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      DEFAULTED (-20 pts)
                    </button>
                  </div>
                </div>
              </div>

              {/* Simulator Calculated Results */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Waterfall Output Breakdown
                </span>

                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-600 font-medium">Unspent Principal Returned:</span>
                    <span className="font-mono font-bold text-slate-950">{unspentPrincipal.toFixed(2)} ETH</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-600 font-medium">Total Distributable Pool:</span>
                    <span className="font-mono font-bold text-yellow-950 text-sm">{distributable.toFixed(2)} ETH</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Individual Pro-Rata Entitlements</span>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-950">Lender A ({((lenderAContrib / (totalContrib || 1)) * 100).toFixed(0)}%)</div>
                      <div className="text-[10px] text-slate-500 font-mono">Contributed {lenderAContrib} ETH</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-950">{payoutA.toFixed(4)} ETH</div>
                      <div className={`text-[10px] font-mono font-bold ${Number(yieldA) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {Number(yieldA) >= 0 ? `+${yieldA}%` : `${yieldA}%`}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-950">Lender B ({((lenderBContrib / (totalContrib || 1)) * 100).toFixed(0)}%)</div>
                      <div className="text-[10px] text-slate-500 font-mono">Contributed {lenderBContrib} ETH</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-950">{payoutB.toFixed(4)} ETH</div>
                      <div className={`text-[10px] font-mono font-bold ${Number(yieldB) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {Number(yieldB) >= 0 ? `+${yieldB}%` : `${yieldB}%`}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-950">Lender C ({((lenderCContrib / (totalContrib || 1)) * 100).toFixed(0)}%)</div>
                      <div className="text-[10px] text-slate-500 font-mono">Contributed {lenderCContrib} ETH</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-950">{payoutC.toFixed(4)} ETH</div>
                      <div className={`text-[10px] font-mono font-bold ${Number(yieldC) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {Number(yieldC) >= 0 ? `+${yieldC}%` : `${yieldC}%`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TechnicalPanel>
    </div>
  );
};
