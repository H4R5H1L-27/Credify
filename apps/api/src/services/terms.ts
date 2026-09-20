import { termSheetSchema, type TermSheet } from '@credify/shared';
import type { Address } from 'viem';
import { parseEther } from 'viem';

export type ParsedAgreement = {
  terms: TermSheet;
  source: 'demo-heuristic' | 'provided-terms';
  assumptions: string[];
};

const ethAmount = (text: string, fallback: string) => {
  const m = text.match(/(\d+(?:\.\d+)?)\s*ETH/i);
  return m ? parseEther(m[1]).toString() : parseEther(fallback).toString();
};

const percent = (text: string, fallback: number) => {
  const m = text.match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? Math.round(Number(m[1]) * 100) : fallback;
};

const days = (text: string, fallback: number) => {
  const m = text.match(/(\d+)\s*day/i);
  return m ? Number(m[1]) : fallback;
};

export function parseAgreement(text: string, merchantAddresses: Address[], provided?: unknown): ParsedAgreement {
  if (provided) {
    const terms = termSheetSchema.parse(provided);
    return { terms, source: 'provided-terms', assumptions: [] };
  }

  const targetWei = ethAmount(text, '10');
  const aprBps = percent(text, 800);
  const durationSeconds = days(text, 14) * 24 * 60 * 60;
  const capMatch = text.match(/(?:spend|cap|limit)[^\d]*(\d+(?:\.\d+)?)\s*ETH/i);
  const maxSpendWei = capMatch ? parseEther(capMatch[1]).toString() : (BigInt(targetWei) * 80n / 100n).toString();
  const terms = termSheetSchema.parse({
    targetWei,
    durationSeconds,
    aprBps,
    maxSpendWei,
    defaultQuorumBps: 5001,
    merchants: merchantAddresses
  });

  return {
    terms,
    source: 'demo-heuristic',
    assumptions: [
      'Demo parser defaulted the term target to 10 ETH when absent.',
      'Demo parser uses a 50.01% contributed-weight quorum for default.',
      'The merchant set comes from the seeded Credify demo environment.'
    ]
  };
}
