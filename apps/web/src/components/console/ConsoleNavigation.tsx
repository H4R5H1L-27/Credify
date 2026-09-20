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
        'w-64 bg-dark-bg-1 border-r border-dark-border-subtle/80 flex flex-col shrink-0 h-full select-none',
        className
      )}
    >
      {/* Console Brand Header */}
      <div className="p-5 border-b border-dark-border-subtle/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-dark-bg-2 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-depth-subtle">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="font-sans text-sm font-bold text-dark-text-primary tracking-tight flex items-center gap-2">
              <span>Credify</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/30 flex items-center gap-1">
                <AnimatedSyncPulse color="cobalt" />
                CONSOLE
              </span>
            </div>
            <div className="text-xs font-sans text-dark-text-muted mt-0.5">
              Protocol Telemetry &amp; Node
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links Grouped by Section */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        {CONSOLE_NAV_ITEMS.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="px-2.5 text-xs font-sans font-semibold text-dark-text-muted tracking-wider uppercase mb-2">
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
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-sans font-medium transition-all duration-micro',
                        isActive
                          ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 font-semibold shadow-depth-subtle'
                          : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-bg-2/80 border border-transparent'
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
      <div className="p-4 border-t border-dark-border-subtle/60 bg-dark-bg-1/80">
        <Link
          to="/app"
          className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 rounded-xl text-xs font-sans font-medium text-dark-text-secondary hover:text-dark-text-primary bg-dark-bg-2 border border-dark-border-subtle hover:border-dark-border-default transition-all duration-micro shadow-depth-subtle"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-brand-400" />
          <span>Return to App Workspace</span>
        </Link>
      </div>
    </aside>
  );
};
