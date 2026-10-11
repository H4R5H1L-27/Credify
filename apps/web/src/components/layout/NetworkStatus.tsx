import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { AlertCircle, ExternalLink, Globe, PlusCircle, RefreshCw } from 'lucide-react';
import { cn, getExplorerAddressUrl } from '../../lib/utils';

export const NetworkStatus: React.FC<{ className?: string }> = ({ className }) => {
  const {
    isConnected,
    isCorrectNetwork,
    chainId,
    targetNetwork,
    targetChainId,
    targetNetworkName,
    faucetUrl,
    switchNetwork,
    addNetwork,
  } = useWallet();

  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async () => {
    setIsSwitching(true);
    try {
      await switchNetwork();
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isConnected) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans text-slate-600',
          'bg-slate-100 border border-slate-200 shadow-xs',
          className
        )}
        title={`Target Network: ${targetNetworkName} (Chain ID ${targetChainId})`}
      >
        <Globe className="w-3 h-3 text-slate-500" />
        <span className="font-semibold text-slate-700 text-xs hidden sm:inline">
          {targetNetworkName}
        </span>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <button
          type="button"
          onClick={handleSwitch}
          disabled={isSwitching}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer shadow-xs"
          title={`Connected to chain #${chainId}. Click to switch to ${targetNetworkName} (${targetChainId})`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Switch to {targetNetworkName}</span>
        </button>

        <button
          type="button"
          onClick={addNetwork}
          className="p-1 rounded-md text-[11px] font-mono bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          title={`Add ${targetNetworkName} (${targetChainId}) to wallet`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
        </button>

        {faucetUrl && (
          <a
            href={faucetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-sans font-medium bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
            title="Get Sepolia Test ETH from faucet"
          >
            <span>Faucet</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-sans text-slate-700 bg-slate-100 border border-slate-200 shadow-xs"
        title={`Connected to ${targetNetworkName} (Chain ID ${chainId})`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="font-semibold text-slate-800 text-xs hidden sm:inline">
          {targetNetworkName}
        </span>
      </div>

      {faucetUrl && (
        <a
          href={faucetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sans font-medium bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
          title="Get Sepolia Test ETH"
        >
          <span>Faucet</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
    </div>
  );
};

