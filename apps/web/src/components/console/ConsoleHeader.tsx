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
            className="md:hidden p-2 rounded-lg bg-dark-bg-2 border border-dark-border-subtle text-dark-text-secondary hover:text-dark-text-primary"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Proportional Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-sans font-medium">
          <Link to="/console/overview" className="text-brand-400 hover:text-brand-300 transition-colors font-semibold">
            Console
          </Link>
          {pathSegments.map((seg, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-dark-text-muted" />
              <span className="text-dark-text-secondary capitalize">
                {seg.replace(/-/g, ' ')}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right: Technical Metadata Cluster */}
      <div className="flex items-center gap-3 flex-wrap text-xs font-sans">
        {/* Network & Node Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle/70 text-xs shadow-depth-subtle">
          <AnimatedSyncPulse color="emerald" />
          <span className="text-dark-text-secondary">EVM Localhost</span>
        </div>

        {/* Current Block Height */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle/70 text-xs shadow-depth-subtle">
          <span className="text-dark-text-muted font-medium">Block:</span>
          {currentBlock !== null ? (
            <span className="font-bold font-mono text-dark-text-primary">#{currentBlock}</span>
          ) : (
            <span className="text-dark-text-muted font-mono animate-pulse">#...</span>
          )}
        </div>

        {/* System Synchronization Status */}
        <TechnicalStatus status={syncStatus} size="sm" />

        {/* Wallet State */}
        {isConnected && address ? (
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-dark-border-subtle/80">
            <AddressBadge address={address} chars={4} />
            {identity?.role && (
              <span className="text-xs font-sans px-2 py-0.5 rounded-md bg-dark-bg-2 border border-dark-border-subtle text-dark-text-secondary uppercase font-semibold">
                {identity.role}
              </span>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-sans text-dark-text-muted pl-3 border-l border-dark-border-subtle/80">
            <span>No Wallet</span>
          </div>
        )}
      </div>
    </header>
  );
};
