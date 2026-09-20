import { http, createConfig } from 'wagmi';
import { hardhat } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const hardhatChain = {
  ...hardhat,
  id: 31337,
  name: 'Hardhat Localhost',
  nativeCurrency: { name: 'Demo Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
} as const;

export const wagmiConfig = createConfig({
  chains: [hardhatChain],
  connectors: [injected()],
  transports: {
    [hardhatChain.id]: http('http://127.0.0.1:8545'),
  },
});
