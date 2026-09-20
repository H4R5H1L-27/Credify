import { termSheetSchema, type TermSheet } from '@credify/shared';
import type { Address } from 'viem';
import { parseAgreement, type ParsedAgreement } from './terms.js';
import { config } from '../config.js';

export interface AgreementTermParser {
  parse(text: string, merchantAddresses: Address[]): Promise<ParsedAgreement>;
}

export class DemoAgreementParser implements AgreementTermParser {
  async parse(text: string, merchantAddresses: Address[]) {
    return parseAgreement(text, merchantAddresses);
  }
}

export class GeminiAgreementParser implements AgreementTermParser {
  constructor(private readonly apiKey: string, private readonly model: string) {}

  async parse(text: string, merchantAddresses: Address[]): Promise<ParsedAgreement> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const prompt = [
      'You are the term-normalization layer for the Credify academic blockchain demo.',
      'Return JSON only. Never return Solidity or executable code.',
      'Schema:',
      '{ targetWei: string, durationSeconds: number, aprBps: number, maxSpendWei: string, defaultQuorumBps: number, merchants: string[] }',
      'Only use merchant addresses from this allowlist:',
      JSON.stringify(merchantAddresses),
      `Agreement: ${text}`
    ].join('\n');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!response.ok) throw new Error(`Gemini parser failed with HTTP ${response.status}`);
    const payload = await response.json() as any;
    const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof raw !== 'string') throw new Error('Gemini parser returned no text candidate');
    const json = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, ''));
    const terms = termSheetSchema.parse(json) as TermSheet;
    return { terms, source: 'provided-terms' as const, assumptions: ['Parsed by the configured Gemini model and then validated locally with the Credify term schema.'] };
  }
}

export function agreementParser(): AgreementTermParser {
  if (config.termsParser === 'gemini') {
    if (!config.geminiApiKey || !config.geminiModel) throw new Error('GEMINI_CONFIG_MISSING');
    return new GeminiAgreementParser(config.geminiApiKey, config.geminiModel);
  }
  return new DemoAgreementParser();
}
