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
        className="h-8 text-xs font-bold tracking-tight bg-[#ffe600] text-black hover:bg-yellow-400 border border-yellow-400 shadow-xs"
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
        className="h-8 text-xs font-bold animate-pulse flex items-center gap-1.5 shadow-xs"
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
        className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 transition-all hover:border-yellow-400 hover:bg-yellow-50/50 shadow-xs cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="font-bold text-slate-900">{displayName}</span>
        </div>

        <div className="h-3.5 w-px bg-slate-200" />

        <Badge
          variant={
            isVerified
              ? 'success'
              : verificationStatus === 'PENDING'
              ? 'warning'
              : 'secondary'
          }
          className="text-[10px] px-1.5 py-0 font-mono font-bold"
        >
          {roleLabel}
        </Badge>

        <span className="font-mono text-slate-600 font-medium text-[11px] hidden sm:inline">
          {address ? `${address.slice(0, 5)}...${address.slice(-3)}` : ''}
        </span>
      </button>

      {/* Account Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-76 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="space-y-3">
            {/* Header: Actor Profile */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <div>
                <div className="font-black text-slate-950 tracking-tight">{displayName}</div>
                <div className="text-[11px] text-slate-500 font-medium">{roleLabel} Account</div>
              </div>
              {isVerified ? (
                <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                  <ShieldCheck className="w-3 h-3" />
                  VERIFIED
                </span>
              ) : verificationStatus === 'PENDING' ? (
                <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                  <Clock className="w-3 h-3" />
                  PENDING
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  <ShieldAlert className="w-3 h-3" />
                  UNVERIFIED
                </span>
              )}
            </div>

            {/* Address & Copy Action */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px]">
              <span className="text-slate-700 font-bold truncate mr-2">
                {address}
              </span>
              <button
                type="button"
                onClick={copyAddress}
                className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded cursor-pointer"
                title="Copy address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Network & Balance */}
            <div className="space-y-1.5 text-slate-600 text-[11px] py-1 font-medium">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Network:</span>
                <span className="font-bold text-slate-950 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Local EVM Network
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Balance:</span>
                <span className="font-mono font-black text-slate-950">
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
                  className="flex items-center justify-between w-full p-2.5 rounded-xl bg-yellow-50 border border-yellow-300 text-yellow-950 text-[11px] font-bold hover:bg-yellow-100 transition-colors"
                >
                  <span>Complete Verification</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Technical Console Shortcut (Only visible for Operator role, never in normal user journeys) */}
            {(role === 'DEMO_OPERATOR' || role === 'EVALUATOR') && (
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <Link
                  to="/console/overview"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-[11px] text-slate-950 hover:text-black py-1 transition-colors font-mono font-bold"
                >
                  <Terminal className="w-3.5 h-3.5 text-yellow-600" />
                  <span>Technical Console (/console)</span>
                </Link>
                <Link
                  to="/console/evaluator"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-[11px] text-slate-600 hover:text-slate-950 py-1 transition-colors font-medium"
                >
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>Academic Evaluator Console</span>
                </Link>
              </div>
            )}

            {/* Disconnect Button */}
            <div className="pt-1 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  disconnectWallet();
                }}
                className="w-full flex items-center gap-2 text-[11px] text-rose-600 hover:text-rose-700 py-1 font-bold cursor-pointer transition-colors"
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
