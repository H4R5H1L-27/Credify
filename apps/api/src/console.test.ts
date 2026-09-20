import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDeployment, ChainClient } from './chain/client.js';
import { ProjectionStore } from './store/projection.js';
import { VerificationStore } from './store/verification.js';
import { ChainIndexer } from './chain/indexer.js';
import { LoanService } from './services/loan-service.js';
import { ObservabilityService } from './services/observability-service.js';
import { buildServer } from './server.js';

async function setupTestApp() {
  const deployment = await loadDeployment();
  const chain = new ChainClient(deployment);
  const store = new ProjectionStore('test-console-projection.json');
  const verificationStore = new VerificationStore('test-console-verification.json');
  const indexer = new ChainIndexer(chain, store);
  const loans = new LoanService(chain, store);
  await store.load();
  await verificationStore.load();
  await indexer.indexOnce();
  const observability = new ObservabilityService(chain, store, verificationStore, loans);

  const app = buildServer({
    deployment,
    chain,
    store,
    verificationStore,
    indexer,
    loans,
    observability,
  });

  return { app, deployment, chain, store, verificationStore, indexer, loans };
}

test('GET /api/v1/console/network returns authoritative node data', async () => {
  const { app, deployment } = await setupTestApp();

  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/console/network',
  });

  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);

  assert.equal(body.chainId, deployment.chainId);
  assert.equal(body.network, deployment.network);
  assert.ok(typeof body.latestBlockNumber === 'string');
  assert.ok(body.gasLimit);
  assert.equal(body.provenance.origin, 'BLOCKCHAIN');
  assert.equal(body.provenance.chain.chainId, deployment.chainId);
});

test('GET /api/v1/console/blocks returns block headers with valid provenance', async () => {
  const { app } = await setupTestApp();

  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/console/blocks?limit=3',
  });

  assert.equal(res.statusCode, 200);
  const blocks = JSON.parse(res.body);
  assert.ok(Array.isArray(blocks));
  assert.ok(blocks.length > 0);

  const first = blocks[0];
  assert.ok(typeof first.number === 'string');
  assert.ok(first.hash.startsWith('0x'));
  assert.ok(first.parentHash.startsWith('0x'));
  assert.ok(first.timestamp);
  assert.equal(first.provenance.origin, 'BLOCKCHAIN');
});

test('GET /api/v1/console/blocks/:number returns block or 404', async () => {
  const { app } = await setupTestApp();

  // Block 0 exists on every EVM chain
  const res0 = await app.inject({
    method: 'GET',
    url: '/api/v1/console/blocks/0',
  });
  assert.equal(res0.statusCode, 200);
  const blk0 = JSON.parse(res0.body);
  assert.equal(blk0.number, '0');

  // Huge non-existent block should 404
  const resNotFound = await app.inject({
    method: 'GET',
    url: '/api/v1/console/blocks/999999999',
  });
  assert.equal(resNotFound.statusCode, 404);
});

test('GET /api/v1/console/contracts lists deployment contracts and pools', async () => {
  const { app, deployment } = await setupTestApp();

  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/console/contracts',
  });

  assert.equal(res.statusCode, 200);
  const contracts = JSON.parse(res.body);
  assert.ok(Array.isArray(contracts));
  assert.ok(contracts.length >= 3);

  const factory = contracts.find((c: any) => c.name === 'LoanFactory');
  assert.ok(factory);
  assert.equal(factory.address.toLowerCase(), deployment.contracts.loanFactory.toLowerCase());
  assert.equal(factory.hasBytecode, true);
  assert.equal(factory.type, 'FACTORY');
  assert.equal(factory.provenance.origin, 'BLOCKCHAIN');
});

test('GET /api/v1/console/contracts/:address inspects specific contract detail', async () => {
  const { app, deployment } = await setupTestApp();

  const res = await app.inject({
    method: 'GET',
    url: `/api/v1/console/contracts/${deployment.contracts.kycRegistry}`,
  });

  assert.equal(res.statusCode, 200);
  const detail = JSON.parse(res.body);
  assert.equal(detail.name, 'KYCRegistry');
  assert.equal(detail.hasBytecode, true);
  assert.ok(detail.bytecodeSize > 0);
  assert.ok(Array.isArray(detail.eventsEmitted));
  assert.equal(detail.provenance.origin, 'BLOCKCHAIN');
});

test('GET /api/v1/console/indexer returns synchronization state and lag', async () => {
  const { app } = await setupTestApp();

  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/console/indexer',
  });

  assert.equal(res.statusCode, 200);
  const state = JSON.parse(res.body);
  assert.equal(state.running, true);
  assert.ok(typeof state.lastIndexedBlock === 'string');
  assert.ok(typeof state.currentHeadBlock === 'string');
  assert.ok(typeof state.blockLag === 'number');
  assert.ok(state.blockLag >= 0);
  assert.equal(state.provenance.origin, 'BACKEND_INDEXED');
});

test('GET /api/v1/console/verification returns institutional attestations queue', async () => {
  const { app } = await setupTestApp();

  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/console/verification',
  });

  assert.equal(res.statusCode, 200);
  const verifications = JSON.parse(res.body);
  assert.ok(Array.isArray(verifications));
  assert.ok(verifications.length > 0);

  const first = verifications[0];
  assert.ok(first.id);
  assert.ok(first.walletAddress.startsWith('0x'));
  assert.ok(first.credentialHash.startsWith('0x'));
  assert.equal(first.provenance.origin, 'BACKEND_INDEXED');
});

test('Alias routes /api/console/* return identical responses to /api/v1/console/*', async () => {
  const { app } = await setupTestApp();

  const resV1 = await app.inject({ method: 'GET', url: '/api/v1/console/network' });
  const resAlias = await app.inject({ method: 'GET', url: '/api/console/network' });

  assert.equal(resV1.statusCode, 200);
  assert.equal(resAlias.statusCode, 200);
  assert.deepEqual(JSON.parse(resV1.body).chainId, JSON.parse(resAlias.body).chainId);
});

test('GET /api/v1/evaluator/wallets returns live test accounts with balances and verification', async () => {
  const { app } = await setupTestApp();

  const res = await app.inject({ method: 'GET', url: '/api/v1/evaluator/wallets' });
  assert.equal(res.statusCode, 200);
  const wallets = JSON.parse(res.body);
  assert.ok(Array.isArray(wallets));
  assert.ok(wallets.length >= 7);

  const borrower = wallets.find((w: any) => w.role === 'BORROWER');
  assert.ok(borrower);
  assert.ok(borrower.address.startsWith('0x'));
  assert.ok(typeof borrower.balanceWei === 'string');
  assert.ok(typeof borrower.balanceEth === 'string');
  assert.ok(typeof borrower.isVerified === 'boolean');
});
