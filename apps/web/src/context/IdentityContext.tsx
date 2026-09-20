import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { WalletIdentity, Role, VerificationStatus, RegisterIdentityInput } from '@credify/shared';
import { api } from '../lib/api';

export interface IdentityContextType {
  isConnected: boolean;
  address?: `0x${string}`;
  identity: WalletIdentity | null;
  role: Role | 'UNREGISTERED';
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  isBorrower: boolean;
  isLender: boolean;
  isMerchant: boolean;
  isOperator: boolean;
  isUnregistered: boolean;
  isLoading: boolean;
  refetchIdentity: () => Promise<void>;
  registerIdentity: (data: Omit<RegisterIdentityInput, 'walletAddress'>) => Promise<WalletIdentity>;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export const IdentityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const prevAddressRef = useRef<`0x${string}` | undefined>(undefined);

  const {
    data: identity,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['identity', address],
    queryFn: () => (address ? api.getIdentity(address) : null),
    enabled: Boolean(isConnected && address),
    staleTime: 3000,
  });

  // Whenever account changes in MetaMask:
  // 1. Detect new address
  // 2. Invalidate all cached queries to flush prior actor's data
  useEffect(() => {
    if (address && prevAddressRef.current !== address) {
      queryClient.invalidateQueries({ queryKey: ['identity'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan'] });
      queryClient.invalidateQueries({ queryKey: ['loanActivity'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['verificationRequests'] });
      queryClient.invalidateQueries({ queryKey: ['verificationRequest'] });
      queryClient.invalidateQueries({ queryKey: ['reputation'] });
      queryClient.invalidateQueries({ queryKey: ['health'] });
      queryClient.invalidateQueries({ queryKey: ['evaluatorContracts'] });
      queryClient.invalidateQueries({ queryKey: ['evaluatorEvents'] });
      prevAddressRef.current = address;
    }
  }, [address, queryClient]);

  const refetchIdentity = async () => {
    await refetch();
  };

  const registerIdentity = async (data: Omit<RegisterIdentityInput, 'walletAddress'>): Promise<WalletIdentity> => {
    if (!address) throw new Error('No wallet connected');
    const result = await api.registerIdentity({
      walletAddress: address,
      ...data,
    });
    await refetch();
    return result;
  };

  const role: Role | 'UNREGISTERED' = identity?.role || 'UNREGISTERED';
  const isVerified: boolean = identity?.isVerified || false;
  const verificationStatus: VerificationStatus = identity?.verificationStatus || 'NOT_STARTED';

  const isBorrower = role === 'BORROWER';
  const isLender = role === 'LENDER';
  const isMerchant = role === 'MERCHANT';
  const isOperator = role === 'DEMO_OPERATOR' || role === 'EVALUATOR';
  const isUnregistered = role === 'UNREGISTERED';

  return (
    <IdentityContext.Provider
      value={{
        isConnected,
        address,
        identity: identity || null,
        role,
        verificationStatus,
        isVerified,
        isBorrower,
        isLender,
        isMerchant,
        isOperator,
        isUnregistered,
        isLoading,
        refetchIdentity,
        registerIdentity,
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
};

export const useIdentity = () => {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
};
