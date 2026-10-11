import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { canonicalizeAgreementText, computeAgreementHash, type TermSheet } from '@credify/shared';
import { config } from '../config.js';

export interface StoredAgreement {
  agreementHash: `0x${string}`;
  rawText: string;
  canonicalText: string;
  createdAt: string;
  terms?: TermSheet | null;
  summary?: string;
  parser?: string;
}

function initialAgreements(): StoredAgreement[] {
  const seeds = [
    'Create a 10 ETH credit agreement for 14 days at 8% APR with an 8 ETH spending cap to purchase research sensors from BuildRight Supplies.',
    'Create a 5 ETH credit agreement for 30 days at 5% APR with a 4 ETH spending cap for server infrastructure from StudioGrid Equipment.',
    'Create an 8 ETH credit agreement for 7 days at 10% APR with an 8 ETH spending cap.'
  ];

  return seeds.map((raw) => {
    const canonical = canonicalizeAgreementText(raw);
    const hash = computeAgreementHash(canonical);
    return {
      agreementHash: hash,
      rawText: raw,
      canonicalText: canonical,
      createdAt: new Date().toISOString(),
      parser: 'deterministic'
    };
  });
}

export class AgreementStore {
  private readonly file: string;
  private agreements: Map<string, StoredAgreement> = new Map();
  private loaded = false;

  constructor(fileName = 'agreements.json') {
    this.file = `${config.dataDir}/${fileName}`;
  }

  async load() {
    if (this.loaded) return;
    await mkdir(config.dataDir, { recursive: true });
    try {
      const raw = await readFile(this.file, 'utf8');
      const list = JSON.parse(raw) as StoredAgreement[];
      for (const item of list) {
        this.agreements.set(item.agreementHash.toLowerCase(), item);
      }
    } catch {
      for (const item of initialAgreements()) {
        this.agreements.set(item.agreementHash.toLowerCase(), item);
      }
      await this.save();
    }
    this.loaded = true;
  }

  async save() {
    await mkdir(config.dataDir, { recursive: true });
    const list = Array.from(this.agreements.values());
    await writeFile(this.file, JSON.stringify(list, null, 2));
  }

  saveAgreement(
    rawText: string,
    terms?: TermSheet | null,
    summary?: string,
    parser: 'llm' | 'deterministic' = 'deterministic'
  ): StoredAgreement {
    const canonical = canonicalizeAgreementText(rawText);
    const hash = computeAgreementHash(canonical);
    const lower = hash.toLowerCase();

    const existing = this.agreements.get(lower);
    if (existing) {
      if (terms && !existing.terms) existing.terms = terms;
      if (summary && !existing.summary) existing.summary = summary;
      return existing;
    }

    const item: StoredAgreement = {
      agreementHash: hash,
      rawText,
      canonicalText: canonical,
      createdAt: new Date().toISOString(),
      terms: terms ?? null,
      summary,
      parser
    };

    this.agreements.set(lower, item);
    // Fire-and-forget save in background
    void this.save();
    return item;
  }

  getByHash(hash: string): StoredAgreement | undefined {
    return this.agreements.get(hash.toLowerCase());
  }

  listAll(): StoredAgreement[] {
    return Array.from(this.agreements.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
