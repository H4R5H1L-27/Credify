import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Cpu,
  ArrowLeftRight,
  FileCode2,
  Layers,
  Server,
  ShieldCheck,
  Network,
  Binary,
  RotateCcw,
  Wrench,
  ArrowLeft,
  Terminal,
  GraduationCap,
} from 'lucide-react';
import { AnimatedSyncPulse } from '../ui/MicroInteractions';

export interface ConsoleNavigationProps {
  onCloseMobile?: () => void;
  className?: string;
}

export const CONSOLE_NAV_ITEMS = [
  {
    category: 'Core Observability',
    items: [
      { path: '/console/overview', label: 'Overview', icon: LayoutDashboard },
      { path: '/console/blockchain', label: 'Blockchain', icon: Cpu },
      { path: '/console/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { path: '/console/contracts', label: 'Contracts', icon: FileCode2 },
      { path: '/console/events', label: 'Events', icon: Layers },
    ],
  },
  {
    category: 'System & State',
    items: [
      { path: '/console/backend', label: 'Backend', icon: Server },
      { path: '/console/verification', label: 'Verification', icon: ShieldCheck },
      { path: '/console/architecture', label: 'Architecture', icon: Network },
    ],
  },
  {
    category: 'Diagnostics & Evaluation',
    items: [
      { path: '/console/evaluator', label: 'Evaluator Guide', icon: GraduationCap },
      { path: '/console/trace', label: 'Action Trace', icon: Binary },
      { path: '/console/replay', label: 'Tx Replay', icon: RotateCcw },
      { path: '/console/evaluator-tools', label: 'Evaluator Tools', icon: Wrench },
    ],
  },
];

export const ConsoleNavigation: React.FC<ConsoleNavigationProps> = ({
  onCloseMobile,
  className,
}) => {
  return (
    <aside
      className={cn(
        'w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full select-none',
        className
      )}
    >
      {/* Console Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#ffe600] border border-yellow-400 flex items-center justify-center text-black font-bold shadow-xs">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="font-sans text-sm font-bold text-slate-950 tracking-tight flex items-center gap-2">
              <span>Credify</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black text-[#ffe600] font-bold flex items-center gap-1">
                <AnimatedSyncPulse color="cobalt" />
                CONSOLE
              </span>
            </div>
            <div className="text-xs font-sans text-slate-500 mt-0.5 font-medium">
              Protocol Telemetry &amp; Node
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links Grouped by Section */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        {CONSOLE_NAV_ITEMS.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="px-2.5 text-[11px] font-sans font-bold text-slate-400 tracking-wider uppercase mb-2">
              {section.category}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-sans transition-all duration-micro',
                        isActive
                          ? 'bg-[#ffe600] text-black border border-yellow-400 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Return to Core Product Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <Link
          to="/app"
          className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 rounded-xl text-xs font-sans font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-yellow-400 transition-all duration-micro shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-900" />
          <span>Return to App Workspace</span>
        </Link>
      </div>
    </aside>
  );
};
