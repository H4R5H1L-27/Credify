import React, { useState, useRef, useEffect } from 'react';
import { useIdentity } from '../../context/IdentityContext';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import {
  Sparkles,
  ChevronDown,
  User,
  Check,
  Building2,
  Store,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';

export const GuidedModeSwitcher: React.FC = () => {
  const {
    isGuidedMode,
    setGuidedMode,
    toggleGuidedMode,
    activePersona,
    activePersonaId,
    switchPersona,
    availablePersonas
  } = useIdentity();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setShowInfo(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'BORROWER':
        return <User className="w-3.5 h-3.5 text-blue-600" />;
      case 'LENDER':
        return <Building2 className="w-3.5 h-3.5 text-purple-600" />;
      case 'MERCHANT':
        return <Store className="w-3.5 h-3.5 text-emerald-600" />;
      case 'DEMO_OPERATOR':
        return <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <User className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'success' | 'warning' => {
    switch (role) {
      case 'BORROWER':
        return 'default';
      case 'LENDER':
        return 'secondary';
      case 'MERCHANT':
        return 'success';
      case 'DEMO_OPERATOR':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  if (!isGuidedMode) {
    return (
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setGuidedMode(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-yellow-50 hover:text-yellow-950 border border-slate-200 hover:border-yellow-300 rounded-lg transition-colors cursor-pointer shadow-xs"
          title="Enable Guided Demo Mode for friction-free presenter walkthrough"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Guided Mode</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-1.5" ref={dropdownRef}>
      {/* Active Guided Mode Pill */}
      <div className="flex items-center bg-amber-50/80 border border-amber-300/80 rounded-lg p-0.5 shadow-xs">
        {/* Mode Indicator & Info Tooltip Trigger */}
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-amber-950 hover:bg-amber-100/60 rounded-md transition-colors cursor-pointer"
          title="Guided Demo Mode Active — Click for details"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="hidden md:inline font-bold">Guided Demo Mode</span>
          <Info className="w-3 h-3 text-amber-700 opacity-70 hover:opacity-100" />
        </button>

        <div className="h-3.5 w-px bg-amber-300 mx-0.5" />

        {/* Persona Selector Trigger */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 border border-amber-200 rounded-md shadow-xs transition-colors cursor-pointer"
        >
          {getRoleIcon(activePersona.role)}
          <span className="truncate max-w-[110px] sm:max-w-[140px]">
            {activePersona.displayName}
          </span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform duration-150', isDropdownOpen && 'rotate-180')} />
        </button>
      </div>

      {/* Info Popover */}
      {showInfo && (
        <div className="absolute top-full mt-2 left-0 w-72 bg-white rounded-xl border border-slate-200 shadow-xl p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span className="font-bold text-slate-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Guided Demo Mode
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
              PRESENTER
            </span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            In Guided Mode, blockchain mutations are automatically signed by verified protocol demo keys on the backend. This enables a complete borrower, lender, and supplier presentation without MetaMask popups.
          </p>
          <div className="pt-1 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">Switch to Wallet Mode:</span>
            <button
              type="button"
              onClick={() => {
                setShowInfo(false);
                setGuidedMode(false);
              }}
              className="text-[11px] font-bold text-slate-700 hover:text-black flex items-center gap-1 cursor-pointer"
            >
              <ToggleRight className="w-4 h-4 text-emerald-600" />
              <span>Disable</span>
            </button>
          </div>
        </div>
      )}

      {/* Persona Selection Dropdown */}
      {isDropdownOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-1">
          <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Select Demo Persona
            </span>
            <span className="text-[10px] text-slate-400 font-medium">7 Accounts Ready</span>
          </div>

          <div className="space-y-0.5 max-h-80 overflow-y-auto pt-1">
            {availablePersonas.map((persona) => {
              const isSelected = persona.id === activePersonaId;
              const roleLabel = persona.role === 'DEMO_OPERATOR' ? 'Operator' : persona.role.charAt(0) + persona.role.slice(1).toLowerCase();

              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => {
                    switchPersona(persona.id);
                    setIsDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-amber-50 text-slate-950 font-bold border border-amber-200'
                      : 'hover:bg-slate-50 text-slate-800'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      {getRoleIcon(persona.role)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate flex items-center gap-1.5">
                        <span>{persona.displayName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {persona.description}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(persona.role)} className="text-[9px] px-1.5 py-0 shrink-0 ml-2 font-mono">
                    {roleLabel}
                  </Badge>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 px-2 py-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Presenter Mode: Active</span>
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(false);
                setGuidedMode(false);
              }}
              className="text-slate-600 hover:text-rose-600 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <ToggleLeft className="w-4 h-4 text-slate-400" />
              <span>Use MetaMask</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
