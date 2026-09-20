import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const mustExist = [
  'README.md',
  'docs/BLUEPRINT.md',
  'docs/UI_GUIDE.md',
  'docs/API_CONTRACT.md',
  'docs/DEMO_RUNBOOK.md',
  'contracts/contracts/KYCRegistry.sol',
  'contracts/contracts/ReputationRegistry.sol',
  'contracts/contracts/LoanFactory.sol',
  'contracts/contracts/LoanPool.sol',
  'apps/api/src/server.ts',
  'apps/api/src/chain/indexer.ts',
  'apps/api/src/chain/client.ts',
  'apps/api/src/services/loan-service.ts'
];
for (const file of mustExist) await readFile(resolve(root, file));
console.log(`Credify sanity check passed: ${mustExist.length} required files present.`);
