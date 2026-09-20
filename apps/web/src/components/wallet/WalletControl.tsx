import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useIdentity } from '../../context/IdentityContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Wallet,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Terminal,
} from 'lucide-react';
import { formatEtherNum } from '../../lib/utils';

export const WalletControl: React.FC = () => {
  const {
    isConnected,
    address,
    isCorrectNetwork,
    switchChainToHardhat,
    disconnectWallet,
    connectWallet,
  } = useWallet();

  const {
    identity,
    role,
    verificationStatus,
    isVerified,
    isUnregistered,
  } = useIdentity();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <Button
        size="sm"
        variant="primary"
        onClick={connectWallet}
        className="h-8 text-xs font-semibold tracking-tight shadow-dark-xs"
        icon={<Wallet className="h-3.5 w-3.5" />}
      >
        Connect Wallet
      </Button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Button
        size="sm"
        variant="danger"
        onClick={switchChainToHardhat}
        className="h-8 text-xs animate-pulse flex items-center gap-1.5 shadow-dark-xs"
        icon={<AlertCircle className="h-3.5 w-3.5" />}
      >
        Switch to Local Network
      </Button>
    );
  }

  const roleLabel = role === 'DEMO_OPERATOR' ? 'Operator' : role.charAt(0) + role.slice(1).toLowerCase();
  const displayName = identity?.displayName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected');

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-lg border border-dark-border-default bg-dark-bg-2 px-2.5 py-1.5 text-xs text-dark-text-primary transition-all hover:border-dark-border-strong hover:bg-dark-bg-3 shadow-dark-xs cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          <span className="font-semibold text-dark-text-primary">{displayName}</span>
        </div>

        <div className="h-3.5 w-px bg-dark-border-subtle" />

        <Badge
          variant={
            isVerified
              ? 'success'
              : verificationStatus === 'PENDING'
              ? 'warning'
              : 'secondary'
          }
          className="text-[10px] px-1.5 py-0 font-mono font-medium"
        >
          {roleLabel}
        </Badge>

        <span className="font-mono text-dark-text-secondary text-[11px] hidden sm:inline">
          {address ? `${address.slice(0, 5)}...${address.slice(-3)}` : ''}
        </span>
      </button>

      {/* Account Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-76 rounded-xl border border-dark-border-default bg-dark-bg-2 p-3.5 shadow-dark-lg z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="space-y-3">
            {/* Header: Actor Profile */}
            <div className="flex items-center justify-between pb-2.5 border-b border-dark-border-subtle">
              <div>
                <div className="font-semibold text-dark-text-primary tracking-tight">{displayName}</div>
                <div className="text-[11px] text-dark-text-muted">{roleLabel} Account</div>
              </div>
              {isVerified ? (
                <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  VERIFIED
                </span>
              ) : verificationStatus === 'PENDING' ? (
                <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Clock className="w-3 h-3" />
                  PENDING
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-dark-text-muted bg-dark-bg-3 px-2 py-0.5 rounded border border-dark-border-subtle">
                  <ShieldAlert className="w-3 h-3" />
                  UNVERIFIED
                </span>
              )}
            </div>

            {/* Address & Copy Action */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-dark-bg-1 border border-dark-border-subtle font-mono text-[11px]">
              <span className="text-dark-text-secondary truncate mr-2">
                {address}
              </span>
              <button
                type="button"
                onClick={copyAddress}
                className="text-dark-text-muted hover:text-dark-text-primary transition-colors p-1 rounded cursor-pointer"
                title="Copy address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Network & Balance */}
            <div className="space-y-1.5 text-dark-text-secondary text-[11px] py-1">
              <div className="flex justify-between items-center">
                <span className="text-dark-text-muted">Network:</span>
                <span className="font-medium text-dark-text-primary flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Local network (31337)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-text-muted">Balance:</span>
                <span className="font-mono font-semibold text-dark-text-primary">
                  {identity?.balanceWei ? `${formatEtherNum(identity.balanceWei).toFixed(4)} ETH` : '— ETH'}
                </span>
              </div>
            </div>

            {/* Verification Navigation Link if unverified */}
            {!isVerified && (
              <div className="pt-1">
                <Link
                  to="/app/verify"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between w-full p-2.5 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 text-[11px] font-semibold hover:bg-brand-500/20 hover:text-brand-300 transition-colors"
                >
                  <span>Complete Verification</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Technical Console Shortcut (Only visible for Operator role, never in normal user journeys) */}
            {(role === 'DEMO_OPERATOR' || role === 'EVALUATOR') && (
              <div className="pt-2 border-t border-dark-border-subtle space-y-1">
                <Link
                  to="/console/overview"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-[11px] text-brand-400 hover:text-brand-300 py-1 transition-colors font-mono font-medium"
                >
                  <Terminal className="w-3.5 h-3.5 text-brand-400" />
                  <span>Technical Console (/console)</span>
                </Link>
                <Link
                  to="/console/evaluator"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-[11px] text-dark-text-secondary hover:text-dark-text-primary py-1 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-dark-text-muted" />
                  <span>Academic Evaluator Console</span>
                </Link>
              </div>
            )}

            {/* Disconnect Button */}
            <div className="pt-1 border-t border-dark-border-subtle">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  disconnectWallet();
                }}
                className="w-full flex items-center gap-2 text-[11px] text-crimson-400 hover:text-crimson-300 py-1 font-semibold cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect Wallet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
