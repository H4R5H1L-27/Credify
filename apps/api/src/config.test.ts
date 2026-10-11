import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEnvironment, resolveDeploymentFile } from './config.js';

test('WP4 Environment Validation: defaults to localhost configuration', () => {
  const result = validateEnvironment({});
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.NETWORK, 'localhost');
    assert.equal(result.data.API_PORT, 4100);
    assert.equal(result.data.CORS_ORIGIN, 'http://localhost:5173');
    assert.equal(result.data.DEMO_MODE, 'true');
    assert.equal(result.data.TERMS_PARSER, 'demo');
  }
});

test('WP4 Environment Validation: parses valid Sepolia network config', () => {
  const result = validateEnvironment({
    NETWORK: 'sepolia',
    SEPOLIA_RPC_URL: 'https://ethereum-sepolia-rpc.publicnode.com',
    API_PORT: '4200',
    DEMO_MODE: 'false'
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.NETWORK, 'sepolia');
    assert.equal(result.data.SEPOLIA_RPC_URL, 'https://ethereum-sepolia-rpc.publicnode.com');
    assert.equal(result.data.API_PORT, 4200);
    assert.equal(result.data.DEMO_MODE, 'false');
  }
});

test('WP4 Environment Validation: rejects unsupported network with clear validation error', () => {
  const result = validateEnvironment({
    NETWORK: 'mainnet'
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.path[0] === 'NETWORK');
    assert.ok(issue, 'Expected issue on NETWORK field');
  }
});

test('WP4 Environment Validation: rejects invalid URL in RPC configuration', () => {
  const result = validateEnvironment({
    CHAIN_RPC_URL: 'not-a-valid-url'
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.path[0] === 'CHAIN_RPC_URL');
    assert.ok(issue, 'Expected issue on CHAIN_RPC_URL field');
  }
});

test('WP4 Deployment File Resolution: resolves local vs sepolia target file correctly', () => {
  const localTarget = resolveDeploymentFile('localhost');
  assert.ok(localTarget.includes('local.json'));

  const sepoliaTarget = resolveDeploymentFile('sepolia');
  assert.ok(sepoliaTarget.includes('sepolia.json'));

  const customTarget = resolveDeploymentFile('sepolia', 'custom/path.json');
  assert.ok(customTarget.includes('custom'));
});
