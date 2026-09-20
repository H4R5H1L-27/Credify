import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAgreement } from './services/terms.js';

const merchants = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222'
] as `0x${string}`[];

test('demo agreement parser produces validated term sheet', () => {
  const parsed = parseAgreement('10 ETH for 14 days at 8% with a spend cap of 8 ETH.', merchants);
  assert.equal(parsed.terms.targetWei, '10000000000000000000');
  assert.equal(parsed.terms.durationSeconds, 1209600);
  assert.equal(parsed.terms.aprBps, 800);
  assert.equal(parsed.terms.maxSpendWei, '8000000000000000000');
  assert.equal(parsed.terms.defaultQuorumBps, 5001);
});
