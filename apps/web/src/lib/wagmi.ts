import { http, createConfig } from 'wagmi';
import { hardhat, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import {
  HARDHAT_CHAIN_ID,
  SEPOLIA_CHAIN_ID,
  HARDHAT_RPC_URL,
  SEPOLIA_DEFAULT_RPC_URL,
  SEPOLIA_FAUCET_URL,
  SEPOLIA_EXPLORER_URL
} from '@credify/shared';

const isBrowser = typeof window !== 'undefined';
const isRemoteHost = isBrowser && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const defaultNetwork = isRemoteHost ? 'sepolia' : 'localhost';

export const targetNetwork = (import.meta.env.VITE_NETWORK || defaultNetwork).toLowerCase() === 'sepolia' ? 'sepolia' : 'localhost';
export const targetChainId = targetNetwork === 'sepolia' ? SEPOLIA_CHAIN_ID : HARDHAT_CHAIN_ID;

export const hardhatChain = {
  ...hardhat,
  id: HARDHAT_CHAIN_ID,
  name: 'Hardhat Localhost',
  nativeCurrency: { name: 'Demo Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_HARDHAT_RPC_URL || HARDHAT_RPC_URL] },
  },
} as const;

export const sepoliaChain = {
  ...sepolia,
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_SEPOLIA_RPC_URL || SEPOLIA_DEFAULT_RPC_URL]
    }
  }
} as const;

export const wagmiConfig = createConfig({
  chains: [hardhatChain, sepoliaChain],
  connectors: [injected()],
  transports: {
    [hardhatChain.id]: http(import.meta.env.VITE_HARDHAT_RPC_URL || HARDHAT_RPC_URL),
    [sepoliaChain.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL || SEPOLIA_DEFAULT_RPC_URL),
  },
});

export { HARDHAT_CHAIN_ID, SEPOLIA_CHAIN_ID, SEPOLIA_FAUCET_URL, SEPOLIA_EXPLORER_URL };

