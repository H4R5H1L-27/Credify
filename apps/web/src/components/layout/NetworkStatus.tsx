import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { AlertCircle, Wifi } from 'lucide-react';
import { cn } from '../../lib/utils';

export const NetworkStatus: React.FC<{ className?: string }> = ({ className }) => {
  const { isConnected, isCorrectNetwork, chainId, switchChainToHardhat } = useWallet();

  if (!isConnected) {
    return null;
  }

  if (!isCorrectNetwork) {
    return (
      <button
        type="button"
        onClick={switchChainToHardhat}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium',
          'bg-crimson-500/10 border border-crimson-500/30 text-crimson-400 hover:bg-crimson-500/20 transition-colors cursor-pointer animate-pulse',
          className
        )}
        title="Click to switch to Hardhat local testnet (31337)"
      >
        <AlertCircle className="w-3.5 h-3.5 text-crimson-400 shrink-0" />
        <span className="hidden sm:inline">Wrong Network:</span>
        <span className="underline">Switch (31337)</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-dark-text-secondary',
        'bg-dark-bg-2 border border-dark-border-default',
        className
      )}
      title="Connected to Hardhat Local Node (Chain ID: 31337)"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      <span className="font-medium text-dark-text-primary hidden md:inline">
        Localhost
      </span>
      <span className="text-dark-text-muted text-[10px]">
        (31337)
      </span>
    </div>
  );
};
