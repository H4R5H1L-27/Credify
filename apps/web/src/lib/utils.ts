import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEther(wei: string | bigint | number, decimals = 2): string {
  try {
    const b = BigInt(wei.toString());
    const ether = Number(b) / 1e18;
    return `${ether.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals })} ETH`;
  } catch {
    return '0 ETH';
  }
}

export function formatEtherNum(wei: string | bigint | number): number {
  try {
    const b = BigInt(wei.toString());
    return Number(b) / 1e18;
  } catch {
    return 0;
  }
}

export function parseEtherToWei(eth: string | number): string {
  try {
    const num = Number(eth);
    if (isNaN(num) || num <= 0) return '0';
    return BigInt(Math.round(num * 1e18)).toString();
  } catch {
    return '0';
  }
}

export function formatApr(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

export function formatDuration(seconds: number): string {
  const days = Math.round(seconds / 86400);
  if (days >= 1) return `${days} day${days > 1 ? 's' : ''}`;
  const hours = Math.round(seconds / 3600);
  return `${hours} hour${hours > 1 ? 's' : ''}`;
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function timeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}

export function decodeBytes32String(hex?: string): string {
  if (!hex || !hex.startsWith('0x')) return hex || '';
  try {
    let str = '';
    for (let i = 2; i < hex.length; i += 2) {
      const code = parseInt(hex.slice(i, i + 2), 16);
      if (code >= 32 && code <= 126) {
        str += String.fromCharCode(code);
      }
    }
    return str.trim() || hex;
  } catch {
    return hex;
  }
}
