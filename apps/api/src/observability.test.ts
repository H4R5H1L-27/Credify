import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from './server.js';
import { ProjectionStore } from './store/projection.js';
import { VerificationStore } from './store/verification.js';
import { ChainIndexer } from './chain/indexer.js';
import { LoanService } from './services/loan-service.js';
import { ObservabilityService } from './services/observability-service.js';

test('WP5 Observability: GET /api/v1/health returns complete status with realistic numbers', async () => {
  const mockDeployment: any = {
    network: 'localhost',
    chainId: 31337,
    deploymentBlock: '1',
    contracts: {
      loanFactory: '0x0000000000000000000000000000000000000001',
      kycRegistry: '0x0000000000000000000000000000000000000002',
      reputationRegistry: '0x0000000000000000000000000000000000000003',
    }
  };

  const mockChain: any = {
    deployment: mockDeployment,
    blockNumber: async () => 18n,
    getPools: async () => ['0xpool1', '0xpool2'],
    publicClient: {
      getBlock: async () => ({ timestamp: 1700000000n, hash: '0xabc' }),
      getLogs: async () => []
    }
  };

  const store = new ProjectionStore('test-health-projection.json');
  await store.load();
  store.setLastIndexedBlock(18n);

  const verificationStore = new VerificationStore('test-health-verification.json');
  const indexer = new ChainIndexer(mockChain, store);
  const loans = new LoanService(mockChain, store);
  const observability = new ObservabilityService(mockChain, store, verificationStore, loans);

  const server = buildServer({
    deployment: mockDeployment,
    chain: mockChain,
    store,
    verificationStore,
    indexer,
    loans,
    observability
  });

  const res = await server.inject({
    method: 'GET',
    url: '/api/v1/health'
  });

  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.ok, true);
  assert.equal(body.status, 'healthy');
  assert.equal(body.connected, true);
  assert.equal(body.network, 'localhost');
  assert.equal(body.chainId, 31337);
  assert.equal(body.blockNumber, '18');
  assert.equal(body.latestIndexedBlock, '18');
  assert.equal(body.syncLag, 0);
  assert.equal(body.poolCount, 2);

  // Verify /health alias behaves identically
  const aliasRes = await server.inject({
    method: 'GET',
    url: '/health'
  });
  assert.equal(aliasRes.statusCode, 200);
  const aliasBody = JSON.parse(aliasRes.body);
  assert.equal(aliasBody.blockNumber, '18');
});

test('WP5 Observability: GET /api/v1/observability/metrics returns Prometheus and JSON payloads', async () => {
  const mockDeployment: any = {
    network: 'localhost',
    chainId: 31337,
    contracts: {
      loanFactory: '0x0000000000000000000000000000000000000001',
      kycRegistry: '0x0000000000000000000000000000000000000002',
      reputationRegistry: '0x0000000000000000000000000000000000000003',
    }
  };

  const mockChain: any = {
    deployment: mockDeployment,
    blockNumber: async () => 25n,
    getPools: async () => ['0xpool1'],
    publicClient: {
      getBlock: async () => ({ timestamp: 1700000000n, hash: '0xabc' }),
      getLogs: async () => []
    }
  };

  const store = new ProjectionStore('test-metrics-projection.json');
  await store.load();
  store.setLastIndexedBlock(24n);

  const verificationStore = new VerificationStore('test-metrics-verification.json');
  const indexer = new ChainIndexer(mockChain, store);
  const loans = new LoanService(mockChain, store);
  const observability = new ObservabilityService(mockChain, store, verificationStore, loans);

  const server = buildServer({
    deployment: mockDeployment,
    chain: mockChain,
    store,
    verificationStore,
    indexer,
    loans,
    observability
  });

  // 1. JSON format
  const jsonRes = await server.inject({
    method: 'GET',
    url: '/api/v1/observability/metrics'
  });
  assert.equal(jsonRes.statusCode, 200);
  const jsonBody = JSON.parse(jsonRes.body);
  assert.equal(jsonBody.chain.headBlock, '25');
  assert.equal(jsonBody.indexer.lastIndexedBlock, '24');
  assert.equal(jsonBody.indexer.syncLag, 1);
  assert.equal(jsonBody.protocol.poolsCount, 1);
  assert.ok(typeof jsonBody.system.uptimeSeconds === 'number');

  // 2. Prometheus format
  const promRes = await server.inject({
    method: 'GET',
    url: '/api/v1/observability/metrics?format=prometheus'
  });
  assert.equal(promRes.statusCode, 200);
  assert.ok(promRes.headers['content-type']?.includes('text/plain'));
  const text = promRes.body;
  assert.ok(text.includes('# TYPE credify_chain_head_block gauge'));
  assert.ok(text.includes('credify_chain_head_block{network="localhost",chainId="31337"} 25'));
  assert.ok(text.includes('credify_indexer_sync_lag{network="localhost",chainId="31337"} 1'));
  assert.ok(text.includes('credify_loan_pools_total{network="localhost"} 1'));
});
