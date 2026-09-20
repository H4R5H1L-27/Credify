import { defineConfig } from 'hardhat/config';
import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers';

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
    }
  },
  test: {
    mocha: { timeout: 30_000 }
  }
});
