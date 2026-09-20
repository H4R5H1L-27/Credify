import test from 'node:test';
import assert from 'node:assert/strict';
import { VerificationStore } from './store/verification.js';

test('verification lifecycle transitions through states correctly', async () => {
  const store = new VerificationStore('test-verification-requests.json');
  await store.load();

  const testAddress = '0x1234567890123456789012345678901234567890';

  // 1. Register account -> status: NOT_STARTED
  const registered = store.register({
    walletAddress: testAddress,
    role: 'BORROWER',
    profile: {
      fullName: 'Test Scholar',
      organization: 'Quantum AI Lab',
      role: 'BORROWER',
      referenceId: 'CRD-TEST-001',
    },
  });

  assert.equal(registered.status, 'NOT_STARTED');
  assert.equal(registered.role, 'BORROWER');
  assert.ok(registered.credentialHash.startsWith('0x'));
  assert.equal(store.getByAddress(testAddress)?.status, 'NOT_STARTED');

  // 2. Submit evidence -> status: PENDING
  const submitted = store.create({
    walletAddress: testAddress,
    role: 'BORROWER',
    profile: {
      fullName: 'Test Scholar',
      organization: 'Quantum AI Lab',
      role: 'BORROWER',
      referenceId: 'CRD-TEST-001',
      details: { docRef: 'CHARTER-2026' },
    },
  });

  assert.equal(submitted.status, 'PENDING');
  assert.equal(store.getByAddress(testAddress)?.status, 'PENDING');

  // 3. Verifier rejects request with feedback -> status: REJECTED
  const rejected = store.update(submitted.id, {
    status: 'REJECTED',
    reviewedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    rejectionReason: 'Academic affiliation documents missing institutional stamp.',
  });

  assert.equal(rejected.status, 'REJECTED');
  assert.equal(rejected.rejectionReason, 'Academic affiliation documents missing institutional stamp.');
  assert.ok(rejected.reviewedAt);

  // 4. Applicant resubmits updated evidence -> status: PENDING, rejection cleared
  const resubmitted = store.create({
    walletAddress: testAddress,
    role: 'BORROWER',
    profile: {
      fullName: 'Test Scholar',
      organization: 'Quantum AI Lab',
      role: 'BORROWER',
      referenceId: 'CRD-TEST-001-REV',
      details: { docRef: 'CHARTER-2026-STAMPED' },
    },
  });

  assert.equal(resubmitted.status, 'PENDING');
  assert.equal(resubmitted.rejectionReason, undefined);
  assert.equal(store.getByAddress(testAddress)?.status, 'PENDING');

  // 5. Verifier approves on-chain -> status: VERIFIED with attestation metadata
  const verified = store.update(resubmitted.id, {
    status: 'VERIFIED',
    reviewedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    attestationTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    attestationBlock: '42',
  });

  assert.equal(verified.status, 'VERIFIED');
  assert.equal(verified.attestationBlock, '42');
  assert.equal(verified.attestationTxHash, '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
  assert.equal(store.getByAddress(testAddress)?.status, 'VERIFIED');
});
