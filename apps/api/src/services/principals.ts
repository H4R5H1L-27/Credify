import type { Address } from 'viem';
import type { DemoPrincipal } from '@credify/shared';
import { ChainClient } from '../chain/client.js';

export const principalDefinitions = [
  { id: 'operator', displayName: 'Credify Demo Operator', role: 'DEMO_OPERATOR' as const },
  { id: 'borrower', displayName: 'Aarav Menon', role: 'BORROWER' as const },
  { id: 'lender-alpha', displayName: 'Meera Capital', role: 'LENDER' as const },
  { id: 'lender-beta', displayName: 'Northstar Labs', role: 'LENDER' as const },
  { id: 'lender-gamma', displayName: 'Blue Oak Partners', role: 'LENDER' as const },
  { id: 'merchant-a', displayName: 'BuildRight Supplies', role: 'MERCHANT' as const },
  { id: 'merchant-b', displayName: 'StudioGrid Equipment', role: 'MERCHANT' as const }
];

export async function principalList(chain: ChainClient): Promise<DemoPrincipal[]> {
  return Promise.all(principalDefinitions.map(async (definition) => {
    const account = chain.accountForPrincipalId(definition.id);
    const verified = definition.role === 'DEMO_OPERATOR' || await chain.verified(account.address);
    return { ...definition, walletAddress: account.address, verified };
  }));
}

export function principalById(chain: ChainClient, id: string) {
  const definition = principalDefinitions.find((item) => item.id === id);
  if (!definition) return null;
  const account = chain.accountForPrincipalId(id);
  return { ...definition, walletAddress: account.address as Address };
}

export async function principalForAddress(chain: ChainClient, address: Address): Promise<DemoPrincipal | null> {
  const found = principalDefinitions.find((item) => chain.accountForPrincipalId(item.id).address.toLowerCase() === address.toLowerCase());
  if (!found) return null;
  const verified = found.role === 'DEMO_OPERATOR' || await chain.verified(address);
  return { ...found, walletAddress: address, verified };
}
