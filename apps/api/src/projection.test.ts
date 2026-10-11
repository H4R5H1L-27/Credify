import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rm, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ProjectionStore } from './store/projection.js';
import type { ActivityEvent } from '@credify/shared';

const testFile = 'test-projection-atomic.json';
const testFilePath = resolve(process.cwd(), 'data', testFile);

test('ProjectionStore: loads empty state cleanly when file does not exist', async () => {
  try {
    await rm(testFilePath, { force: true });
  } catch {}

  const store = new ProjectionStore(testFile);
  await store.load();
  assert.equal(store.lastIndexedBlock, 0n);
  assert.equal(store.allEvents().length, 0);
});

test('ProjectionStore: atomic write creates file with valid JSON content', async () => {
  const store = new ProjectionStore(testFile);
  await store.load();

  store.setLastIndexedBlock(42n);
  store.setBlockHash(42n, '0xabc123');

  const mockEvent: ActivityEvent = {
    id: '0xtx1-0',
    loanId: '0xpool1',
    eventName: 'LoanCreated',
    transactionHash: '0xtx1',
    blockNumber: '42',
    summary: 'Loan created',
    timestamp: new Date().toISOString(),
    data: {}
  };
  store.addEvents([mockEvent]);
  await store.save();

  // Verify file on disk is valid JSON
  const raw = await readFile(testFilePath, 'utf8');
  const parsed = JSON.parse(raw);
  assert.equal(parsed.lastIndexedBlock, '42');
  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.blockHashes['42'], '0xabc123');
});

test('ProjectionStore: deduplicates events by id', async () => {
  const store = new ProjectionStore(testFile);
  await store.load();

  const mockEvent: ActivityEvent = {
    id: '0xtx1-0',
    loanId: '0xpool1',
    eventName: 'LoanCreated',
    transactionHash: '0xtx1',
    blockNumber: '42',
    summary: 'Loan created',
    timestamp: new Date().toISOString(),
    data: {}
  };
  store.addEvents([mockEvent, mockEvent]);
  assert.equal(store.allEvents().length, 1);
});

test('ProjectionStore: rewindTo purges reorged events and restores cursor', async () => {
  const store = new ProjectionStore(testFile);
  await store.load();

  store.setLastIndexedBlock(45n);
  store.setBlockHash(43n, '0xhash43');
  store.setBlockHash(44n, '0xhash44');
  store.setBlockHash(45n, '0xhash45');

  const event43: ActivityEvent = {
    id: '0xtx-43',
    loanId: '0xpool1',
    eventName: 'Funded',
    transactionHash: '0xtx43',
    blockNumber: '43',
    summary: 'Funded',
    timestamp: '2026-10-11T10:00:00Z',
    data: {}
  };
  const event44: ActivityEvent = {
    id: '0xtx-44',
    loanId: '0xpool1',
    eventName: 'LoanActivated',
    transactionHash: '0xtx44',
    blockNumber: '44',
    summary: 'Activated',
    timestamp: '2026-10-11T10:01:00Z',
    data: {}
  };
  const event45: ActivityEvent = {
    id: '0xtx-45',
    loanId: '0xpool1',
    eventName: 'SpendExecuted',
    transactionHash: '0xtx45',
    blockNumber: '45',
    summary: 'Spend',
    timestamp: '2026-10-11T10:02:00Z',
    data: {}
  };

  store.addEvents([event43, event44, event45]);
  assert.equal(store.allEvents().length, 4); // 1 from previous test + 3

  // Reorg occurs at block 44: block 44 and 45 are invalidated
  await store.rewindTo(44n);

  assert.equal(store.lastIndexedBlock, 43n);
  assert.equal(store.getBlockHash(43n), '0xhash43');
  assert.equal(store.getBlockHash(44n), undefined);
  assert.equal(store.getBlockHash(45n), undefined);

  // Events from block 44 and 45 must be purged
  const remaining = store.allEvents();
  assert.ok(!remaining.some((e) => e.blockNumber === '44'));
  assert.ok(!remaining.some((e) => e.blockNumber === '45'));
  assert.ok(remaining.some((e) => e.blockNumber === '43'));

  await store.save();
  const raw = await readFile(testFilePath, 'utf8');
  const parsed = JSON.parse(raw);
  assert.equal(parsed.lastIndexedBlock, '43');

  // Clean up
  try {
    await rm(testFilePath, { force: true });
  } catch {}
});
