import { defineConfig } from 'hardhat/config';
import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Automatically load root or local .env if available
for (const p of [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../.env')]) {
  if (existsSync(p)) {
    try {
      process.loadEnvFile(p);
      break;
    } catch {}
  }
}

const demoMnemonic = process.env.DEMO_MNEMONIC ?? 'test test test test test test test test test test test junk';

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: '0.8.24',
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  },
  networks: {
    hardhatMainnet: {
      type: 'edr-simulated',
      chainId: 31337,
      accounts: { mnemonic: demoMnemonic }
    },
    localhost: {
      type: 'http',
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
      ethers: {
        waitForTransactionReceipt: true
      }
    },
    sepolia: {
      type: 'http',
      url: process.env.SEPOLIA_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com',
      chainId: 11155111,
      accounts: process.env.SEPOLIA_PRIVATE_KEY
        ? [process.env.SEPOLIA_PRIVATE_KEY]
        : { mnemonic: demoMnemonic }
    }
  },
  test: {
    mocha: { timeout: 30_000 }
  }
});
