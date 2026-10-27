import type { TransactionObservability } from '@credify/shared';

const STORAGE_KEY = 'credify_client_transactions';

export interface ClientTrackedTx {
  hash: string;
  operationName: string;
  from: string;
  to: string | null;
  valueWei: string;
  nonce?: number;
  input?: string;
  status: 'PENDING' | 'SUCCESS' | 'REVERTED';
  blockNumber: string;
  gasUsed: string;
  submittedAt: string;
  confirmedAt?: string;
  error?: string;
}

export function getClientTransactions(): TransactionObservability[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: ClientTrackedTx[] = JSON.parse(raw);
    return list.map((item) => ({
      hash: item.hash,
      blockNumber: item.blockNumber || (item.status === 'PENDING' ? 'Pending' : '0'),
      blockHash: '',
      from: item.from,
      to: item.to,
      valueWei: item.valueWei || '0',
      gas: '500000',
      gasPriceWei: '1000000000',
      nonce: item.nonce ?? 0,
      input: item.input || '0x',
      status: item.status,
      gasUsed: item.gasUsed || '0',
      effectiveGasPriceWei: '1000000000',
      contractAddress: item.to,
      logsCount: item.status === 'SUCCESS' ? 1 : 0,
      decodedEvents: item.operationName ? [
        {
          eventName: item.operationName.replace(/\s+/g, ''),
          contractAddress: item.to || '',
          args: { operation: item.operationName, actor: item.from }
        }
      ] : [],
      provenance: {
        chain: { chainId: 11155111, network: 'sepolia' },
        block: { number: item.blockNumber || 'Pending' },
        transaction: { hash: item.hash },
        origin: 'BLOCKCHAIN' as const,
      }
    }));
  } catch {
    return [];
  }
}

export function trackSubmittedTx(info: {
  hash: string;
  operationName?: string;
  from: string;
  to?: string | null;
  valueWei?: string;
  nonce?: number;
  input?: string;
}) {
  if (typeof window === 'undefined' || !info.hash) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: ClientTrackedTx[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((t) => t.hash.toLowerCase() !== info.hash.toLowerCase());
    const newRecord: ClientTrackedTx = {
      hash: info.hash,
      operationName: info.operationName || 'Transaction',
      from: info.from,
      to: info.to || null,
      valueWei: info.valueWei || '0',
      nonce: info.nonce,
      input: info.input,
      status: 'PENDING',
      blockNumber: 'Pending',
      gasUsed: '0',
      submittedAt: new Date().toISOString(),
    };
    filtered.unshift(newRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch {}
}

export function trackConfirmedTx(
  hash: string,
  receipt: {
    blockNumber?: bigint | string;
    gasUsed?: bigint | string;
    status: 'success' | 'reverted' | string;
  }
) {
  if (typeof window === 'undefined' || !hash) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const list: ClientTrackedTx[] = JSON.parse(raw);
    const updated = list.map((t) => {
      if (t.hash.toLowerCase() === hash.toLowerCase()) {
        const isSuccess = receipt.status === 'success' || receipt.status === 'SUCCESS';
        return {
          ...t,
          status: (isSuccess ? 'SUCCESS' : 'REVERTED') as 'SUCCESS' | 'REVERTED',
          blockNumber: receipt.blockNumber ? receipt.blockNumber.toString() : t.blockNumber,
          gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : '120000',
          confirmedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}
