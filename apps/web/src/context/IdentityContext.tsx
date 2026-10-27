import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type WalletIdentity,
  type Role,
  type VerificationStatus,
  type RegisterIdentityInput,
  type DemoAccountPreset,
  DEMO_ACCOUNTS,
} from '@credify/shared';
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

  // WP9 Guided Presenter Mode additions
  isGuidedMode: boolean;
  setGuidedMode: (enabled: boolean) => void;
  toggleGuidedMode: () => void;
  activePersona: DemoAccountPreset;
  activePersonaId: string;
  switchPersona: (personaId: string) => void;
  availablePersonas: DemoAccountPreset[];
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export const IdentityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const queryClient = useQueryClient();
  const prevAddressRef = useRef<`0x${string}` | undefined>(undefined);

  // Guided Demo Mode state (defaults to true for zero-friction demo walkthrough)
  const [isGuidedMode, setIsGuidedModeState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('credify_guided_mode');
    if (stored !== null) return stored === 'true';
    return true;
  });

  // Active persona in Guided Mode (defaults to borrower: Aarav Menon)
  const [activePersonaId, setActivePersonaIdState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'borrower';
    return localStorage.getItem('credify_active_persona') || 'borrower';
  });

  const activePersona = useMemo(() => {
    return DEMO_ACCOUNTS.find((p) => p.id === activePersonaId) || DEMO_ACCOUNTS[1];
  }, [activePersonaId]);

  const setGuidedMode = (enabled: boolean) => {
    setIsGuidedModeState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('credify_guided_mode', String(enabled));
    }
    // Flush queries when toggling mode
    queryClient.invalidateQueries();
  };

  const toggleGuidedMode = () => {
    setGuidedMode(!isGuidedMode);
  };

  const switchPersona = (personaId: string) => {
    const found = DEMO_ACCOUNTS.find((p) => p.id === personaId);
    if (!found) return;
    setActivePersonaIdState(personaId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('credify_active_persona', personaId);
    }
    // Invalidate all queries so the newly selected persona's view refreshes instantly
    queryClient.invalidateQueries();
  };

  // Determine effective connection & address
  const isConnected = isGuidedMode ? true : wagmiIsConnected;
  const address = isGuidedMode ? (activePersona.address as `0x${string}`) : wagmiAddress;

  const {
    data: queriedIdentity,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['identity', address],
    queryFn: () => (address ? api.getIdentity(address) : null),
    enabled: Boolean(isConnected && address),
    staleTime: 3000,
  });

  // Fallback synthetic identity for demo accounts in Guided Mode
  const identity: WalletIdentity | null = useMemo(() => {
    if (queriedIdentity) return queriedIdentity;
    if (isGuidedMode && activePersona) {
      return {
        address: activePersona.address,
        displayName: activePersona.displayName,
        role: activePersona.role,
        verificationStatus: 'VERIFIED',
        isVerified: true,
        balanceWei: '100000000000000000000', // 100 ETH default for presentation
      };
    }
    return null;
  }, [queriedIdentity, isGuidedMode, activePersona]);

  // Whenever effective address changes:
  // Invalidate all cached queries to flush prior actor's data
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
    if (typeof window !== 'undefined') {
      localStorage.setItem(`credify_verified_${address.toLowerCase()}`, 'true');
      localStorage.setItem('credify_verified_status', 'VERIFIED');
    }
    await refetch();
    return result;
  };

  const storedVerified = typeof window !== 'undefined' && address
    ? localStorage.getItem(`credify_verified_${address.toLowerCase()}`) === 'true'
    : false;

  const storedRole = typeof window !== 'undefined' && address
    ? (localStorage.getItem(`credify_role_${address.toLowerCase()}`) as Role | null) ||
      (JSON.parse(localStorage.getItem('credify_verification_requests') || '[]').find((r: any) => r.walletAddress?.toLowerCase() === address.toLowerCase())?.role as Role | undefined) ||
      (storedVerified ? 'BORROWER' : undefined)
    : undefined;

  const storedName = typeof window !== 'undefined' && address
    ? localStorage.getItem(`credify_name_${address.toLowerCase()}`) ||
      (JSON.parse(localStorage.getItem('credify_verification_requests') || '[]').find((r: any) => r.walletAddress?.toLowerCase() === address.toLowerCase())?.profile?.fullName as string | undefined)
    : undefined;

  const effectiveRole: Role | 'UNREGISTERED' = isGuidedMode
    ? activePersona.role
    : (identity?.role && identity.role !== 'UNREGISTERED'
        ? identity.role
        : (storedRole || 'UNREGISTERED'));

  const isVerified: boolean = isGuidedMode
    ? true
    : Boolean(identity?.isVerified || storedVerified || effectiveRole !== 'UNREGISTERED');

  const verificationStatus: VerificationStatus = isGuidedMode
    ? 'VERIFIED'
    : (identity?.verificationStatus === 'VERIFIED' || storedVerified || isVerified
        ? 'VERIFIED'
        : (identity?.verificationStatus || (effectiveRole !== 'UNREGISTERED' ? 'VERIFIED' : 'NOT_STARTED')));

  const role = effectiveRole;
  const isBorrower = role === 'BORROWER';
  const isLender = role === 'LENDER';
  const isMerchant = role === 'MERCHANT';
  const isOperator = role === 'DEMO_OPERATOR' || role === 'EVALUATOR';
  const isUnregistered = role === 'UNREGISTERED';

  const contextualIdentity: WalletIdentity | null = useMemo(() => {
    if (isGuidedMode && activePersona) {
      return {
        address: activePersona.address,
        displayName: activePersona.displayName,
        role: activePersona.role,
        verificationStatus: 'VERIFIED',
        isVerified: true,
        balanceWei: '100000000000000000000',
      };
    }
    const base = identity || (address ? {
      address,
      displayName: storedName || 'Verified Institutional Actor',
      role: effectiveRole,
      verificationStatus,
      isVerified,
      balanceWei: '0',
    } : null);

    if (!base) return null;

    return {
      ...base,
      displayName: (base.displayName && base.displayName !== 'Unregistered Account')
        ? base.displayName
        : (storedName || 'Verified Institutional Actor'),
      role: effectiveRole,
      isVerified,
      verificationStatus,
    };
  }, [identity, isGuidedMode, activePersona, address, storedName, effectiveRole, verificationStatus, isVerified]);

  return (
    <IdentityContext.Provider
      value={{
        isConnected,
        address,
        identity: contextualIdentity,
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
        isGuidedMode,
        setGuidedMode,
        toggleGuidedMode,
        activePersona,
        activePersonaId,
        switchPersona,
        availablePersonas: DEMO_ACCOUNTS,
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
