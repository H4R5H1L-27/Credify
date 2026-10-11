import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { config } from '../config.js';
import type { ActivityEvent } from '@credify/shared';

export type ProjectionState = {
  lastIndexedBlock: string;
  blockHashes: Record<string, string>;
  events: ActivityEvent[];
  updatedAt: string;
};

const emptyState = (): ProjectionState => ({
  lastIndexedBlock: '0',
  blockHashes: {},
  events: [],
  updatedAt: new Date().toISOString()
});

export class ProjectionStore {
  private readonly file: string;
  private state: ProjectionState = emptyState();
  private loaded = false;

  constructor(fileName = 'projection.json') {
    this.file = `${config.dataDir}/${fileName}`;
  }

  async load() {
    if (this.loaded) return;
    await mkdir(dirname(this.file), { recursive: true });
    try {
      const data = JSON.parse(await readFile(this.file, 'utf8')) as Partial<ProjectionState>;
      this.state = {
        lastIndexedBlock: data.lastIndexedBlock || '0',
        blockHashes: data.blockHashes || {},
        events: data.events || [],
        updatedAt: data.updatedAt || new Date().toISOString()
      };
    } catch {
      this.state = emptyState();
    }
    this.loaded = true;
  }

  /**
   * Atomic save pattern: writes entire JSON to a temporary file,
   * then atomically renames the temp file over the destination file.
   * Guarantees read-model consistency without partial or corrupted reads.
   */
  async save() {
    await mkdir(dirname(this.file), { recursive: true });
    this.state.updatedAt = new Date().toISOString();
    const tempFile = `${this.file}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
    const payload = JSON.stringify(this.state, null, 2);
    await writeFile(tempFile, payload, 'utf8');
    await rename(tempFile, this.file);
  }

  get lastIndexedBlock(): bigint {
    return BigInt(this.state.lastIndexedBlock || '0');
  }

  setLastIndexedBlock(block: bigint) {
    this.state.lastIndexedBlock = block.toString();
  }

  getBlockHash(blockNumber: bigint): string | undefined {
    return this.state.blockHashes[blockNumber.toString()];
  }

  setBlockHash(blockNumber: bigint, hash: string) {
    this.state.blockHashes[blockNumber.toString()] = hash;
    this.pruneBlockHashes(200);
  }

  /**
   * Prunes stored block hashes beyond maxCount to prevent unbounded growth while
   * keeping a sufficient window for deep reorganization detection.
   */
  private pruneBlockHashes(maxCount = 200) {
    const keys = Object.keys(this.state.blockHashes);
    if (keys.length <= maxCount) return;
    keys.sort((a, b) => Number(BigInt(a) - BigInt(b)));
    const removeCount = keys.length - maxCount;
    for (let i = 0; i < removeCount; i++) {
      delete this.state.blockHashes[keys[i]];
    }
  }

  /**
   * Rewinds the projection to a specific block (e.g. following an EVM reorganization).
   * Purges all events originating from blockNumber onwards and updates the cursor.
   */
  async rewindTo(blockNumber: bigint) {
    const cutoff = blockNumber;
    this.state.events = this.state.events.filter((e) => BigInt(e.blockNumber) < cutoff);
    for (const key of Object.keys(this.state.blockHashes)) {
      if (BigInt(key) >= cutoff) {
        delete this.state.blockHashes[key];
      }
    }
    const newLastBlock = cutoff > 0n ? cutoff - 1n : 0n;
    this.state.lastIndexedBlock = newLastBlock.toString();
    await this.save();
  }

  addEvents(events: ActivityEvent[]) {
    const existing = new Set(this.state.events.map((e) => e.id));
    for (const event of events) {
      if (!existing.has(event.id)) {
        this.state.events.push(event);
      }
    }
    this.state.events.sort((a, b) => {
      const blockDiff = Number(BigInt(b.blockNumber) - BigInt(a.blockNumber));
      if (blockDiff !== 0) return blockDiff;
      return b.timestamp.localeCompare(a.timestamp);
    });
  }

  allEvents(): ActivityEvent[] {
    return [...this.state.events];
  }

  eventsForLoan(loanId: string): ActivityEvent[] {
    const target = loanId.toLowerCase();
    return this.state.events.filter((event) => event.loanId.toLowerCase() === target);
  }

  async reset() {
    this.state = emptyState();
    this.loaded = true;
    await this.save();
  }
}
