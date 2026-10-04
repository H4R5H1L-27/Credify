import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useHealth } from '../../hooks/useCredify';
import { useIdentity } from '../../context/IdentityContext';
import { useAccount, useBlockNumber, useChainId } from 'wagmi';
import { TechnicalStatus } from './TechnicalStatus';
import { AddressBadge } from '../ui/AddressBadge';
import { AnimatedSyncPulse } from '../ui/MicroInteractions';
import { Menu, ChevronRight } from 'lucide-react';

export interface ConsoleHeaderProps {
  onToggleMobileNav?: () => void;
}

export const ConsoleHeader: React.FC<ConsoleHeaderProps> = ({ onToggleMobileNav }) => {
  const location = useLocation();
  const { address, identity } = useIdentity();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { data: wagmiBlockNumber } = useBlockNumber({ watch: true });
  const { data: health } = useHealth();

  // Authoritative block number from node or wagmi
  const currentBlock = health?.blockNumber ? Number(health.blockNumber) : (wagmiBlockNumber ? Number(wagmiBlockNumber) : null);
  const activeChainId = health?.chainId || chainId || 31337;

  // Synchronization status derived from node & API health
  const syncStatus = !health
    ? 'OFFLINE'
    : !health.ok
    ? 'DISCONNECTED'
    : 'SYNCED';

  // Compute breadcrumb path
  const pathSegments = location.pathname
    .replace(/^\/console\/?/, '')
    .split('/')
    .filter(Boolean);

  return (
    <header className="h-16 surface-glass-header px-6 flex items-center justify-between gap-4 shrink-0 z-10 select-none">
      {/* Left: Mobile Nav toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        {onToggleMobileNav && (
          <button
            type="button"
            onClick={onToggleMobileNav}
            className="md:hidden p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-950"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Proportional Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-sans font-medium">
          <Link to="/console/overview" className="text-yellow-800 hover:text-yellow-900 transition-colors font-bold">
            Console
          </Link>
          {pathSegments.map((seg, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600 capitalize font-medium">
                {seg.replace(/-/g, ' ')}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right: Technical Metadata Cluster */}
      <div className="flex items-center gap-2.5 flex-wrap text-xs font-sans">
        {/* Network & Node Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs shadow-xs">
          <AnimatedSyncPulse color="emerald" />
          <span className="text-slate-700 font-semibold">EVM Localhost</span>
        </div>

        {/* Current Block Height */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs shadow-xs">
          <span className="text-slate-500 font-medium">Block:</span>
          {currentBlock !== null ? (
            <span className="font-bold font-mono text-slate-900">#{currentBlock}</span>
          ) : (
            <span className="text-slate-500 font-mono animate-pulse">#...</span>
          )}
        </div>

        {/* System Synchronization Status */}
        <TechnicalStatus status={syncStatus} size="sm" />

        {/* Wallet State */}
        {isConnected && address ? (
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200">
            <AddressBadge address={address} chars={4} />
            {identity?.role && (
              <span className="text-xs font-sans px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 uppercase font-bold">
                {identity.role}
              </span>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-sans text-slate-500 pl-3 border-l border-slate-200">
            <span>No Wallet</span>
          </div>
        )}
      </div>
    </header>
  );
};
