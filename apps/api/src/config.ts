import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { z } from 'zod';

// Automatically load root or local .env if available
for (const p of [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env'), resolve(process.cwd(), '../.env')]) {
  if (existsSync(p)) {
    try {
      process.loadEnvFile(p);
      break;
    } catch {}
  }
}

const envSchema = z.object({
  NETWORK: z.enum(['localhost', 'local', 'hardhat', 'sepolia']).default('localhost'),
  CHAIN_RPC_URL: z.string().url().optional(),
  SEPOLIA_RPC_URL: z.string().url().optional(),
  PORT: z.coerce.number().int().positive().optional(),
  API_PORT: z.coerce.number().int().positive().default(4100),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DEMO_MODE: z.string().default('true'),
  DEPLOYMENT_FILE: z.string().optional(),
  DEMO_MNEMONIC: z.string().default('test test test test test test test test test test test junk'),
  TERMS_PARSER: z.enum(['demo', 'gemini']).default('demo'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().optional().default('gemini-1.5-flash'),
  VERIFIER_SECRET: z.string().default('credify-verifier-secret-test'),
  AUTH_SECRET: z.string().optional(),
  INDEXER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
  INDEXER_REORG_DEPTH: z.coerce.number().int().nonnegative().default(3)
});

const parsedEnvResult = envSchema.safeParse(process.env);
if (!parsedEnvResult.success) {
  console.error('\n====================================================');
  console.error('FATAL: Environment Configuration Validation Error');
  console.error('====================================================');
  for (const issue of parsedEnvResult.error.issues) {
    console.error(`- [${issue.path.join('.')}] ${issue.message}`);
  }
  console.error('====================================================\n');
  process.exit(1);
}

const env = parsedEnvResult.data;
const network = env.NETWORK === 'sepolia' ? 'sepolia' : 'localhost';

function resolveDeploymentFile(net: string, specified?: string): string {
  if (specified) return resolve(process.cwd(), specified);
  const targetFile = net === 'sepolia' ? 'sepolia.json' : 'local.json';
  const candidates = [
    resolve(process.cwd(), `contracts/deployments/${targetFile}`),
    resolve(process.cwd(), `../contracts/deployments/${targetFile}`),
    resolve(process.cwd(), `../../contracts/deployments/${targetFile}`),
    resolve(process.cwd(), `deployments/${targetFile}`)
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0];
}

const deploymentFile = resolveDeploymentFile(network, env.DEPLOYMENT_FILE);

export const config = {
  network,
  rpcUrl:
    env.CHAIN_RPC_URL ||
    (network === 'sepolia'
      ? env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
      : 'http://127.0.0.1:8545'),
  port: env.PORT || env.API_PORT || 4100,
  corsOrigin: env.CORS_ORIGIN,
  demoMode: env.DEMO_MODE === 'true',
  deploymentFile,
  dataDir: resolve(process.cwd(), 'data'),
  demoMnemonic: env.DEMO_MNEMONIC,
  termsParser: env.TERMS_PARSER,
  geminiApiKey: env.GEMINI_API_KEY,
  geminiModel: env.GEMINI_MODEL,
  verifierSecret: env.AUTH_SECRET || env.VERIFIER_SECRET,
  indexerPollIntervalMs: env.INDEXER_POLL_INTERVAL_MS,
  indexerReorgDepth: env.INDEXER_REORG_DEPTH
};

export function validateEnvironment(rawEnv: Record<string, unknown>) {
  return envSchema.safeParse(rawEnv);
}

export { envSchema, resolveDeploymentFile };
