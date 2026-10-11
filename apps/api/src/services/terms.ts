import {
  canonicalizeAgreementText,
  computeAgreementHash,
  reverseRenderSummary,
  type AgreementParseResult,
  type ParsedField,
  type ResolvedMerchant,
  type UnresolvedMerchant,
  type UnsupportedClause,
  type TermSheet
} from '@credify/shared';
import { parseEther, type Address } from 'viem';

export interface VerifiedSupplierEntry {
  name: string;
  address: Address;
  organization?: string;
  category?: string;
}

export const DEFAULT_VERIFIED_SUPPLIERS: VerifiedSupplierEntry[] = [
  {
    name: 'BuildRight Supplies',
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    organization: 'BuildRight Hardware & Materials Ltd.',
    category: 'Laboratory Materials & Sensors'
  },
  {
    name: 'StudioGrid Equipment',
    address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    organization: 'StudioGrid Scientific Instruments Corp.',
    category: 'Precision Optical & Computing Gear'
  }
];

export interface ParseOptions {
  acceptedDefaults?: Record<string, any>;
  verifiedSuppliers?: VerifiedSupplierEntry[];
}

function findSentence(text: string, matchIndex: number, matchLength: number): string {
  const start = Math.max(0, text.lastIndexOf('.', matchIndex) + 1);
  let end = text.indexOf('.', matchIndex + matchLength);
  if (end === -1) end = text.length;
  return text.slice(start, end).trim();
}

export function parseAgreementDeterministic(
  rawText: string,
  options?: ParseOptions
): AgreementParseResult {
  const canonicalText = canonicalizeAgreementText(rawText);
  const agreementHash = computeAgreementHash(canonicalText);
  const acceptedDefaults = options?.acceptedDefaults || {};
  const suppliers = options?.verifiedSuppliers || DEFAULT_VERIFIED_SUPPLIERS;

  const missingFields: string[] = [];
  const validationErrors: string[] = [];
  const unsupportedClauses: UnsupportedClause[] = [];

  // --- 1. Target Amount (ETH) ---
  let targetEthVal: string | undefined;
  let targetQuote: string | undefined;

  // Search for explicit credit target / facility phrases first
  const targetPattern = /(?:facility|credit|loan|borrow|target|principal|amount|funding)\s*(?:of|for|amount of)?\s*(\d+(?:\.\d+)?)\s*ETH/i;
  const targetMatch = rawText.match(targetPattern);
  if (targetMatch) {
    targetEthVal = targetMatch[1];
    targetQuote = targetMatch[0];
  } else {
    // Fallback: look for general ETH match that is neither preceded nor followed by spend/cap/limit
    const allEthMatches = [...rawText.matchAll(/(\d+(?:\.\d+)?)\s*ETH/gi)];
    for (const m of allEthMatches) {
      const idx = m.index ?? 0;
      const preceding = rawText.slice(Math.max(0, idx - 25), idx);
      const following = rawText.slice(idx + m[0].length, Math.min(rawText.length, idx + m[0].length + 25));
      if (!/spend|cap|limit|tranche|to\s+[a-z]/i.test(preceding) && !/spend|cap|limit|tranche/i.test(following)) {
        targetEthVal = m[1];
        targetQuote = m[0];
        break;
      }
    }
  }

  const targetField: ParsedField<string> = targetEthVal
    ? { value: targetEthVal, source: 'text', quote: targetQuote }
    : acceptedDefaults.targetEth
    ? { value: String(acceptedDefaults.targetEth), source: 'default' }
    : { source: 'missing' };

  if (targetField.source === 'missing') {
    missingFields.push('targetEth');
  }

  // Currency is fixed to ETH for this protocol
  const currencyField: ParsedField<string> = { value: 'ETH', source: 'text', quote: targetQuote ? 'ETH' : undefined };

  // --- 2. Interest Rate / APR (%) ---
  let aprVal: number | undefined;
  let aprQuote: string | undefined;

  const aprMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:APR|interest|annual)?/i) ||
                   rawText.match(/(?:at|with)\s+(\d+(?:\.\d+)?)\s*%/i) ||
                   rawText.match(/(?:interest rate of|rate of)\s+(\d+(?:\.\d+)?)\s*%/i);
  if (aprMatch) {
    aprVal = parseFloat(aprMatch[1]);
    aprQuote = aprMatch[0];
  }

  const aprField: ParsedField<number> = aprVal !== undefined
    ? { value: aprVal, source: 'text', quote: aprQuote }
    : acceptedDefaults.aprPercent !== undefined
    ? { value: Number(acceptedDefaults.aprPercent), source: 'default' }
    : { source: 'missing' };

  if (aprField.source === 'missing') {
    missingFields.push('aprPercent');
  }

  // --- 3. Loan Duration (Days) ---
  let durationDaysVal: number | undefined;
  let durationQuote: string | undefined;

  // Match minutes (for quick demo testing, e.g. 5 minutes or 10 minutes)
  const minuteMatch = rawText.match(/(?:for|duration of|tenure of)?\s*(\d+)\s*(?:minute|minutes)\b/i);
  // Match days
  const dayMatch = rawText.match(/(?:for|duration of|tenure of)?\s*(\d+)\s*(?:day|days)\b/i);
  // Match weeks
  const weekMatch = rawText.match(/(?:for|duration of|tenure of)?\s*(\d+)\s*(?:week|weeks)\b/i);
  // Match months
  const monthMatch = rawText.match(/(?:for|duration of|tenure of)?\s*(\d+)\s*(?:month|months)\b/i);

  if (minuteMatch && (!dayMatch || (minuteMatch.index ?? 0) <= (dayMatch.index ?? 0))) {
    durationDaysVal = parseFloat((Number(minuteMatch[1]) / (24 * 60)).toFixed(6));
    durationQuote = minuteMatch[0];
  } else if (dayMatch) {
    durationDaysVal = parseInt(dayMatch[1], 10);
    durationQuote = dayMatch[0];
  } else if (weekMatch) {
    durationDaysVal = parseInt(weekMatch[1], 10) * 7;
    durationQuote = weekMatch[0];
  } else if (monthMatch) {
    durationDaysVal = parseInt(monthMatch[1], 10) * 30;
    durationQuote = monthMatch[0];
  }

  const durationField: ParsedField<number> = durationDaysVal !== undefined
    ? { value: durationDaysVal, source: 'text', quote: durationQuote }
    : acceptedDefaults.durationDays !== undefined
    ? { value: Number(acceptedDefaults.durationDays), source: 'default' }
    : { source: 'missing' };

  if (durationField.source === 'missing') {
    missingFields.push('durationDays');
  }

  // --- 4. Funding Window (Days) ---
  let fundingDaysVal: number | undefined;
  let fundingQuote: string | undefined;

  const fundingMatch = rawText.match(/(?:funding|syndicate|fundraising)\s*(?:window|period|deadline)?\s*(?:of|is|for|closes in)?\s*(\d+)\s*(?:day|days)\b/i);
  if (fundingMatch) {
    fundingDaysVal = parseInt(fundingMatch[1], 10);
    fundingQuote = fundingMatch[0];
  }

  const fundingField: ParsedField<number> = fundingDaysVal !== undefined
    ? { value: fundingDaysVal, source: 'text', quote: fundingQuote }
    : acceptedDefaults.fundingDays !== undefined
    ? { value: Number(acceptedDefaults.fundingDays), source: 'default' }
    : { source: 'missing' };

  if (fundingField.source === 'missing') {
    missingFields.push('fundingDays');
  }

  // --- 5. Global Spending Cap (ETH) ---
  let spendCapEthVal: string | undefined;
  let spendCapQuote: string | undefined;

  const capMatch = rawText.match(/(?:spend|spending|drawdown)\s*(?:cap|limit)\s*(?:of|is|at)?\s*(\d+(?:\.\d+)?)\s*ETH/i) ||
                   rawText.match(/(\d+(?:\.\d+)?)\s*ETH\s*(?:global\s*)?(?:spend|spending|drawdown)\s*(?:cap|limit)/i) ||
                   rawText.match(/(\d+(?:\.\d+)?)\s*ETH\s*cap\b/i) ||
                   rawText.match(/cap(?:ped)?\s*(?:at|of)?\s*(\d+(?:\.\d+)?)\s*ETH/i) ||
                   rawText.match(/(?:capping|cap)\s*(?:our\s*)?(?:spend|disbursements)?\s*(?:at|to)?\s*(\d+(?:\.\d+)?)\s*ETH/i);
  if (capMatch) {
    spendCapEthVal = capMatch[1];
    spendCapQuote = capMatch[0];
  }

  const spendCapField: ParsedField<string> = spendCapEthVal
    ? { value: spendCapEthVal, source: 'text', quote: spendCapQuote }
    : acceptedDefaults.spendCapEth
    ? { value: String(acceptedDefaults.spendCapEth), source: 'default' }
    : { source: 'missing' };

  if (spendCapField.source === 'missing') {
    missingFields.push('spendCapEth');
  }

  // --- 6. Default Quorum (%) ---
  let quorumVal: number | undefined;
  let quorumQuote: string | undefined;

  const quorumMatch = rawText.match(/(?:quorum|majority|voting threshold)\s*(?:of)?\s*(\d+(?:\.\d+)?)\s*%/i) ||
                      rawText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:majority|quorum)/i);
  if (quorumMatch) {
    quorumVal = parseFloat(quorumMatch[1]);
    quorumQuote = quorumMatch[0];
  }

  const quorumField: ParsedField<number> = quorumVal !== undefined
    ? { value: quorumVal, source: 'text', quote: quorumQuote }
    : acceptedDefaults.defaultQuorumPercent !== undefined
    ? { value: Number(acceptedDefaults.defaultQuorumPercent), source: 'default' }
    : { source: 'missing' };

  if (quorumField.source === 'missing') {
    missingFields.push('defaultQuorumPercent');
  }

  // --- 7. Grace Period (Days) ---
  let graceVal: number | undefined;
  let graceQuote: string | undefined;

  const graceMatch = rawText.match(/(?:grace period|cure period)\s*(?:of)?\s*(\d+)\s*(?:day|days)/i) ||
                     rawText.match(/(\d+)\s*(?:day|days)\s*grace period/i);
  if (graceMatch) {
    graceVal = parseInt(graceMatch[1], 10);
    graceQuote = graceMatch[0];
  }

  const graceField: ParsedField<number> = graceVal !== undefined
    ? { value: graceVal, source: 'text', quote: graceQuote }
    : acceptedDefaults.gracePeriodDays !== undefined
    ? { value: Number(acceptedDefaults.gracePeriodDays), source: 'default' }
    : { source: 'missing' };

  if (graceField.source === 'missing') {
    missingFields.push('gracePeriodDays');
  }

  // --- 8. Merchant Resolution & Per-Merchant Caps ---
  // Security rule: raw hex addresses in text are explicitly ignored!
  const resolvedMerchants: ResolvedMerchant[] = [];
  const unresolvedMerchants: UnresolvedMerchant[] = [];

  for (const supplier of suppliers) {
    const cleanSupplierName = supplier.name.toLowerCase();
    const shortName = cleanSupplierName.replace(/\s+(supplies|equipment|hardware|instruments|ltd|corp|inc)/gi, '').trim();

    // Check if supplier full name or short name is mentioned
    const nameRegex = new RegExp(`\\b(${supplier.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${shortName})\\b`, 'i');
    const nameMatch = rawText.match(nameRegex);

    if (nameMatch) {
      // Look for a specific cap for this merchant, e.g. "6 ETH to BuildRight", "up to 4 ETH for StudioGrid"
      let capEth: string | undefined;
      const merchantCapRegex = new RegExp(
        `(?:(?:up to|maximum|cap of|allocation of)\\s*)?(\\d+(?:\\.\\d+)?)\\s*ETH\\s*(?:to|for|at)\\s*(?:the\\s*)?${nameMatch[0]}|${nameMatch[0]}[^.]*?(?:cap|allocation|limit)[^.]*?(\\d+(?:\\.\\d+)?)\\s*ETH`,
        'i'
      );
      const mCapMatch = rawText.match(merchantCapRegex);
      if (mCapMatch) {
        capEth = mCapMatch[1] || mCapMatch[2];
      }

      resolvedMerchants.push({
        name: supplier.name,
        address: supplier.address,
        capEth,
        capWei: capEth ? parseEther(capEth).toString() : undefined,
        quote: nameMatch[0]
      });
    }
  }

  // Detect unknown merchant names in text (e.g. Acme Hardware, Quantum Foundry)
  const unknownMerchantRegex = /\b([A-Z][a-zA-Z0-9&]+(?:\s+[A-Z][a-zA-Z0-9&]+)*\s+(?:Supplies|Hardware|Equipment|Instruments|Foundry|Semiconductor|Corp|Ltd|Inc))\b/g;
  let unknownMatch;
  while ((unknownMatch = unknownMerchantRegex.exec(rawText)) !== null) {
    const candidate = unknownMatch[1];
    const isKnown = suppliers.some(s => s.name.toLowerCase() === candidate.toLowerCase());
    if (!isKnown && !unresolvedMerchants.some(u => u.name.toLowerCase() === candidate.toLowerCase())) {
      unresolvedMerchants.push({
        name: candidate,
        quote: unknownMatch[0]
      });
    }
  }

  // If no merchants in text, check if acceptedDefaults provides them
  if (resolvedMerchants.length === 0 && acceptedDefaults.merchants && Array.isArray(acceptedDefaults.merchants)) {
    for (const mAddr of acceptedDefaults.merchants) {
      const sup = suppliers.find(s => s.address.toLowerCase() === String(mAddr).toLowerCase());
      if (sup) {
        resolvedMerchants.push({
          name: sup.name,
          address: sup.address
        });
      }
    }
  }

  if (resolvedMerchants.length === 0) {
    missingFields.push('merchants');
  }

  // --- 9. Unsupported Clauses Detection ---
  // Collateral
  const collateralMatch = rawText.match(/\b(collateral|pledge|pledges|pledged|security interest|lien|secured by|securitization)\b/i);
  if (collateralMatch) {
    unsupportedClauses.push({
      clause: 'Collateral Pledge',
      quote: findSentence(rawText, collateralMatch.index ?? 0, collateralMatch[0].length),
      reason: 'Collateral pledges cannot be verified, escrowed, or liquidated on-chain; Credify enforces merchant allowlists and on-chain credit reputation instead.'
    });
  }

  // Personal Guarantee
  const guaranteeMatch = rawText.match(/\b(guarantor|guarantors|personal guarantee|unconditional guarantee|co-signer|indemnity)\b/i);
  if (guaranteeMatch) {
    unsupportedClauses.push({
      clause: 'Personal Guarantee',
      quote: findSentence(rawText, guaranteeMatch.index ?? 0, guaranteeMatch[0].length),
      reason: 'Personal guarantees cannot be enforced or seized by the smart contract protocol.'
    });
  }

  // Dynamic Late Fees
  const lateFeeMatch = rawText.match(/\b(late fee|late fees|penalty interest|overdue fee|per month overdue|penalty of \d+%\s*per)\b/i);
  if (lateFeeMatch) {
    unsupportedClauses.push({
      clause: 'Dynamic Late Fee Penalty',
      quote: findSentence(rawText, lateFeeMatch.index ?? 0, lateFeeMatch[0].length),
      reason: 'Dynamic penalty late fees are not enforced by the smart contract; credit facility terms apply fixed flat interest.'
    });
  }

  // Physical Audit / Site Inspection
  const auditMatch = rawText.match(/\b(physical inspection|audit premises|inspect premises|site visit|inspect facilities)\b/i);
  if (auditMatch) {
    unsupportedClauses.push({
      clause: 'Physical Inspection / Audit',
      quote: findSentence(rawText, auditMatch.index ?? 0, auditMatch[0].length),
      reason: 'Physical premises inspections are off-chain operational activities outside protocol consensus.'
    });
  }

  // Arbitration / Legal Jurisdiction
  const arbitrationMatch = rawText.match(/\b(arbitration|jurisdiction of|courts? of|governed by the laws of|dispute resolution in)\b/i);
  if (arbitrationMatch) {
    unsupportedClauses.push({
      clause: 'Arbitration & Legal Jurisdiction',
      quote: findSentence(rawText, arbitrationMatch.index ?? 0, arbitrationMatch[0].length),
      reason: 'Off-chain legal dispute and arbitration clauses cannot be executed or automated on-chain.'
    });
  }

  // --- 10. Bounds Validation & TermSheet Construction ---
  let terms: TermSheet | null = null;

  if (targetField.value) {
    try {
      const targetWeiBig = parseEther(targetField.value);
      if (targetWeiBig <= 0n) validationErrors.push('Principal target must be greater than 0 ETH');
    } catch {
      validationErrors.push('Invalid target ETH number format');
    }
  }

  if (aprField.value !== undefined) {
    const aprBps = Math.round(aprField.value * 100);
    if (aprBps < 0 || aprBps > 5000) {
      validationErrors.push(`APR of ${aprField.value}% (${aprBps} bps) exceeds protocol bound (maximum 50% / 5000 bps)`);
    }
  }

  if (durationField.value !== undefined) {
    const durationSeconds = Math.round(durationField.value * 86400);
    if (durationSeconds < 300 || durationSeconds > 31536000) {
      validationErrors.push(`Duration of ${durationField.value} days (${durationSeconds}s) outside protocol bounds (5 minutes to 365 days)`);
    }
  }

  if (fundingField.value !== undefined) {
    const fundingSeconds = Math.round(fundingField.value * 86400);
    if (fundingSeconds < 300 || fundingSeconds > 7776000) {
      validationErrors.push(`Funding window of ${fundingField.value} days (${fundingSeconds}s) outside protocol bounds (5 minutes to 90 days)`);
    }
  }

  if (spendCapField.value && targetField.value) {
    try {
      const capWei = parseEther(spendCapField.value);
      const targetWei = parseEther(targetField.value);
      if (capWei <= 0n) validationErrors.push('Spending cap must be greater than 0 ETH');
      if (capWei > targetWei) {
        validationErrors.push(`Spending cap (${spendCapField.value} ETH) cannot exceed principal target (${targetField.value} ETH)`);
      }
    } catch {
      validationErrors.push('Invalid spend cap ETH format');
    }
  }

  if (quorumField.value !== undefined) {
    const quorumBps = Math.round(quorumField.value * 100);
    if (quorumBps <= 5000 || quorumBps > 10000) {
      validationErrors.push(`Default quorum of ${quorumField.value}% (${quorumBps} bps) must be strictly greater than 50% (5001 to 10000 bps)`);
    }
  }

  if (graceField.value !== undefined) {
    const graceSeconds = Math.round(graceField.value * 86400);
    if (graceSeconds < 0 || graceSeconds > 2592000) {
      validationErrors.push(`Grace period of ${graceField.value} days exceeds protocol bound (maximum 30 days)`);
    }
  }

  // Construct final TermSheet if all required fields are present and valid
  const canConstructTerms =
    missingFields.length === 0 &&
    validationErrors.length === 0 &&
    targetField.value &&
    aprField.value !== undefined &&
    durationField.value !== undefined &&
    spendCapField.value &&
    resolvedMerchants.length > 0;

  if (canConstructTerms) {
    const targetWei = parseEther(targetField.value!).toString();
    const durationSeconds = Math.round(durationField.value! * 86400);
    const fundingDurationSeconds = fundingField.value !== undefined ? Math.round(fundingField.value * 86400) : 7 * 86400;
    const aprBps = Math.round(aprField.value! * 100);
    const maxSpendWei = parseEther(spendCapField.value!).toString();
    const defaultQuorumBps = quorumField.value !== undefined ? Math.round(quorumField.value * 100) : 5001;
    const gracePeriodSeconds = graceField.value !== undefined ? Math.round(graceField.value * 86400) : 3 * 86400;

    const merchants = resolvedMerchants.map((m) => m.address);
    const merchantCapsWei = resolvedMerchants.map((m) => {
      if (m.capWei) return m.capWei;
      return (BigInt(maxSpendWei) / BigInt(resolvedMerchants.length)).toString();
    });

    terms = {
      targetWei,
      durationSeconds,
      fundingDurationSeconds,
      aprBps,
      maxSpendWei,
      defaultQuorumBps,
      gracePeriodSeconds,
      agreementHash,
      merchants,
      merchantCapsWei
    };
  }

  // Reverse-render plain-English summary deterministically
  const summary = reverseRenderSummary({
    targetEth: targetField.value,
    aprPercent: aprField.value,
    durationDays: durationField.value !== undefined ? Math.round(durationField.value) : undefined,
    fundingDays: fundingField.value !== undefined ? Math.round(fundingField.value) : undefined,
    spendCapEth: spendCapField.value,
    quorumPercent: quorumField.value,
    gracePeriodDays: graceField.value !== undefined ? Math.round(graceField.value) : undefined,
    merchants: resolvedMerchants.map((m) => ({ name: m.name, capEth: m.capEth }))
  });

  return {
    rawText,
    canonicalText,
    agreementHash,
    parser: 'deterministic',
    fields: {
      targetEth: targetField,
      currency: currencyField,
      aprPercent: aprField,
      durationDays: durationField,
      fundingDays: fundingField,
      spendCapEth: spendCapField,
      defaultQuorumPercent: quorumField,
      gracePeriodDays: graceField
    },
    terms,
    resolvedMerchants,
    unresolvedMerchants,
    missingFields,
    unsupportedClauses,
    summary,
    isValid: missingFields.length === 0 && validationErrors.length === 0,
    validationErrors
  };
}

export function parseAgreement(
  rawText: string,
  optionsOrMerchants?: ParseOptions | Address[],
  _provided?: unknown
): AgreementParseResult {
  if (Array.isArray(optionsOrMerchants)) {
    const opts: ParseOptions = {
      acceptedDefaults: {
        fundingDays: 7,
        defaultQuorumPercent: 50.01,
        gracePeriodDays: 3,
        merchants: optionsOrMerchants
      },
      verifiedSuppliers: optionsOrMerchants.map((addr, i) => ({
        name: `Merchant ${i + 1}`,
        address: addr as Address
      }))
    };
    return parseAgreementDeterministic(rawText, opts);
  }
  return parseAgreementDeterministic(rawText, optionsOrMerchants);
}

