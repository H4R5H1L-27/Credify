import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

function resolveDeploymentFile(): string {
  if (process.env.DEPLOYMENT_FILE) return resolve(process.cwd(), process.env.DEPLOYMENT_FILE);
  const candidates = [
    resolve(process.cwd(), 'contracts/deployments/local.json'),
    resolve(process.cwd(), '../contracts/deployments/local.json'),
    resolve(process.cwd(), '../../contracts/deployments/local.json')
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0];
}

export const config = {
  rpcUrl: process.env.CHAIN_RPC_URL ?? 'http://127.0.0.1:8545',
  port: Number(process.env.API_PORT ?? 4100),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  demoMode: (process.env.DEMO_MODE ?? 'true') === 'true',
  deploymentFile: resolveDeploymentFile(),
  dataDir: resolve(process.cwd(), 'data'),
  demoMnemonic: process.env.DEMO_MNEMONIC ?? 'test test test test test test test test test test test junk',
  termsParser: process.env.TERMS_PARSER ?? 'demo',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? ''
};
