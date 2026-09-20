import React, { createContext, useContext, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { DEMO_ACCOUNTS, type DemoAccountPreset, HARDHAT_CHAIN_ID } from '@credify/shared';

export interface WalletContextType {
  isConnected: boolean;
  address?: `0x${string}`;
  chainId?: number;
  isCorrectNetwork: boolean;
  detectedPreset: DemoAccountPreset | null;
  balanceFormatted?: string;
  isImportModalOpen: boolean;
  openImportModal: () => void;
  closeImportModal: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  addHardhatNetwork: () => Promise<void>;
  switchChainToHardhat: () => Promise<void>;
  checkRoleMismatch: (requiredRole: string, requiredAddress?: string) => {
    isMismatch: boolean;
    requiredRole: string;
    requiredAddress?: string;
    connectedAddress?: string;
    connectedPersonaName?: string;
  };
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: balanceData } = useBalance({ address });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const isCorrectNetwork = !isConnected || chainId === HARDHAT_CHAIN_ID;

  // Find if the connected address matches a known account
  const detectedPreset = React.useMemo(() => {
    if (!address) return null;
    const lower = address.toLowerCase();
    return DEMO_ACCOUNTS.find((a) => a.address.toLowerCase() === lower) || null;
  }, [address]);

  const connectWallet = async () => {
    const connector = connectors[0];
    if (connector) {
      await connectAsync({ connector });
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  const addHardhatNetwork = async () => {
    if (typeof window !== 'undefined' && (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } }).ethereum) {
      try {
        await (window as unknown as { ethereum: { request: (args: unknown) => Promise<unknown> } }).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x7a69', // 31337
              chainName: 'Hardhat Localhost (Credify)',
              nativeCurrency: { name: 'Demo Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['http://127.0.0.1:8545']
            }
          ]
        });
      } catch (err) {
        console.error('Failed to add Hardhat network to MetaMask:', err);
      }
    }
  };

  const switchChainToHardhat = async () => {
    try {
      if (switchChainAsync) {
        await switchChainAsync({ chainId: HARDHAT_CHAIN_ID });
      }
    } catch {
      await addHardhatNetwork();
    }
  };

  const checkRoleMismatch = (requiredRole: string, requiredAddress?: string) => {
    if (!isConnected || !address) {
      return { isMismatch: false, requiredRole };
    }

    // If specific address is required (e.g. loan borrower), check exact match
    if (requiredAddress && address.toLowerCase() !== requiredAddress.toLowerCase()) {
      return {
        isMismatch: true,
        requiredRole,
        requiredAddress,
        connectedAddress: address,
        connectedPersonaName: detectedPreset?.displayName || 'External Wallet'
      };
    }

    // If a generic role is required (e.g. LENDER), check role
    if (detectedPreset && detectedPreset.role !== requiredRole && requiredRole !== 'DEMO_OPERATOR') {
      return {
        isMismatch: true,
        requiredRole,
        requiredAddress,
        connectedAddress: address,
        connectedPersonaName: detectedPreset.displayName
      };
    }

    return { isMismatch: false, requiredRole };
  };

  const balanceFormatted = balanceData ? `${parseFloat(balanceData.formatted).toFixed(2)} ${balanceData.symbol}` : undefined;

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address: address as `0x${string}` | undefined,
        chainId,
        isCorrectNetwork,
        detectedPreset,
        balanceFormatted,
        isImportModalOpen,
        openImportModal: () => setIsImportModalOpen(true),
        closeImportModal: () => setIsImportModalOpen(false),
        connectWallet,
        disconnectWallet,
        addHardhatNetwork,
        switchChainToHardhat,
        checkRoleMismatch
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
