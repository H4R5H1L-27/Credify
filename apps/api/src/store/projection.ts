import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { config } from '../config.js';
import type { ActivityEvent } from '@credify/shared';

export type ProjectionState = {
  lastIndexedBlock: string;
  events: ActivityEvent[];
};

const emptyState = (): ProjectionState => ({ lastIndexedBlock: '0', events: [] });

export class ProjectionStore {
  private readonly file: string;
  private state: ProjectionState = emptyState();
  private loaded = false;

  constructor(fileName = 'projection.json') {
    this.file = `${config.dataDir}/${fileName}`;
  }

  async load() {
    if (this.loaded) return;
    await mkdir(config.dataDir, { recursive: true });
    try {
      this.state = JSON.parse(await readFile(this.file, 'utf8')) as ProjectionState;
    } catch {
      this.state = emptyState();
    }
    this.loaded = true;
  }

  async save() {
    await mkdir(config.dataDir, { recursive: true });
    await writeFile(this.file, JSON.stringify(this.state, null, 2));
  }

  get lastIndexedBlock() { return BigInt(this.state.lastIndexedBlock); }
  setLastIndexedBlock(block: bigint) { this.state.lastIndexedBlock = block.toString(); }

  addEvents(events: ActivityEvent[]) {
    const existing = new Set(this.state.events.map((e) => e.id));
    for (const event of events) if (!existing.has(event.id)) this.state.events.push(event);
    this.state.events.sort((a, b) => {
      const blockDiff = Number(BigInt(b.blockNumber) - BigInt(a.blockNumber));
      if (blockDiff !== 0) return blockDiff;
      return b.timestamp.localeCompare(a.timestamp);
    });
  }

  allEvents() { return [...this.state.events]; }
  eventsForLoan(loanId: string) { return this.state.events.filter((event) => event.loanId.toLowerCase() === loanId.toLowerCase()); }

  async reset() {
    this.state = emptyState();
    this.loaded = true;
    await this.save();
  }
}
