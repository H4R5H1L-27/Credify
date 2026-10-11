import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../../..');

test('WP10: Sepolia deployment scripts and templates are configured', () => {
  const deployScriptPath = path.join(ROOT_DIR, 'contracts/scripts/deploy.ts');
  assert.ok(fs.existsSync(deployScriptPath), 'deploy.ts exists');
  const deployContent = fs.readFileSync(deployScriptPath, 'utf-8');
  assert.ok(deployContent.includes('11155111'), 'deploy.ts handles Sepolia chain ID 11155111');
  assert.ok(deployContent.includes('VERIFIER_ADDRESS'), 'deploy.ts supports VERIFIER_ADDRESS');
  assert.ok(deployContent.includes('ADMIN_ADDRESS'), 'deploy.ts supports ADMIN_ADDRESS');
  assert.ok(deployContent.includes('sepolia.json'), 'deploy.ts outputs to sepolia.json');

  const verifyScriptPath = path.join(ROOT_DIR, 'contracts/scripts/verify.ts');
  assert.ok(fs.existsSync(verifyScriptPath), 'verify.ts exists');
  const verifyContent = fs.readFileSync(verifyScriptPath, 'utf-8');
  assert.ok(verifyContent.includes('sepolia.etherscan.io'), 'verify.ts generates Sepolia Etherscan links');
  assert.ok(verifyContent.includes('KYCRegistry'), 'verify.ts verifies KYCRegistry');
  assert.ok(verifyContent.includes('LoanFactory'), 'verify.ts verifies LoanFactory');

  const sepoliaExamplePath = path.join(ROOT_DIR, 'contracts/deployments/sepolia.example.json');
  assert.ok(fs.existsSync(sepoliaExamplePath), 'sepolia.example.json exists');
  const exampleManifest = JSON.parse(fs.readFileSync(sepoliaExamplePath, 'utf-8'));
  assert.equal(exampleManifest.network, 'sepolia');
  assert.equal(exampleManifest.chainId, 11155111);
  assert.ok(exampleManifest.contracts.kycRegistry);
  assert.ok(exampleManifest.contracts.reputationRegistry);
  assert.ok(exampleManifest.contracts.loanFactory);
  assert.ok(exampleManifest.contracts.sampleLoanPool);
});

test('WP10: NPM scripts contain deploy:sepolia and verify:sepolia targets', () => {
  const contractsPkgPath = path.join(ROOT_DIR, 'contracts/package.json');
  const contractsPkg = JSON.parse(fs.readFileSync(contractsPkgPath, 'utf-8'));
  assert.ok(contractsPkg.scripts['deploy:sepolia'], 'contracts package has deploy:sepolia script');
  assert.ok(contractsPkg.scripts['verify:sepolia'], 'contracts package has verify:sepolia script');

  const rootPkgPath = path.join(ROOT_DIR, 'package.json');
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
  assert.ok(rootPkg.scripts['chain:deploy:sepolia'], 'root package has chain:deploy:sepolia script');
  assert.ok(rootPkg.scripts['chain:verify:sepolia'], 'root package has chain:verify:sepolia script');
});

test('WP10: Comprehensive Sepolia Deployment Runbook documentation exists', () => {
  const runbookPath = path.join(ROOT_DIR, 'docs/SEPOLIA_DEPLOYMENT.md');
  assert.ok(fs.existsSync(runbookPath), 'SEPOLIA_DEPLOYMENT.md exists');
  const content = fs.readFileSync(runbookPath, 'utf-8');

  // Verify critical sections from prompt requirements
  assert.ok(content.includes('Ethereum Sepolia Testnet'), 'Includes Sepolia context');
  assert.ok(content.includes('Faucet'), 'Includes faucet instructions');
  assert.ok(content.includes('Etherscan API Key'), 'Includes Etherscan API key setup');
  assert.ok(content.includes('chain:deploy:sepolia'), 'Includes deploy command');
  assert.ok(content.includes('chain:verify:sepolia'), 'Includes verify command');
  assert.ok(content.includes('Railway') || content.includes('Render') || content.includes('Fly'), 'Includes backend cloud deployment');
  assert.ok(content.includes('Vercel') || content.includes('Netlify'), 'Includes frontend deployment');
  assert.ok(content.includes('Deliberate Negative Tests') || content.includes('Security Guards in Action'), 'Includes deliberate negative failure rehearsals');
  assert.ok(content.includes('Fallback Matrix') || content.includes('Fallback'), 'Includes localhost & offline fallbacks');
});
