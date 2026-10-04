import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Coins,
  Activity,
  ShieldCheck,
  Terminal,
  Settings,
  Menu,
  X,
  Send,
  TrendingUp,
  Briefcase,
  Store,
  Vote,
  Download,
  PlusCircle,
  FileText,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { WalletControl } from '../wallet/WalletControl';
import { NetworkStatus } from './NetworkStatus';
import { Breadcrumbs } from './Breadcrumbs';

export const AppShell: React.FC = () => {
  const { role, isBorrower, isLender, isMerchant, isOperator, isUnregistered, isConnected, address } = useIdentity();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const prevAddressRef = useRef<string | undefined>(address);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle Account Change in MetaMask:
  // Detect address change -> navigate to corresponding workspace
  useEffect(() => {
    if (prevAddressRef.current && prevAddressRef.current !== address) {
      const path = location.pathname;
      if (isLender && path.startsWith('/app/borrower')) {
        navigate('/app/lender/portfolio', { replace: true });
      } else if (isBorrower && (path.startsWith('/app/lender') || path.startsWith('/app/supplier'))) {
        navigate('/app/borrower/overview', { replace: true });
      } else if (isMerchant && (path.startsWith('/app/borrower') || path.startsWith('/app/lender'))) {
        navigate('/app/supplier/overview', { replace: true });
      } else if (isUnregistered && (path.startsWith('/app/borrower') || path.startsWith('/app/lender') || path.startsWith('/app/supplier'))) {
        navigate('/app/verify', { replace: true });
      }
    }
    prevAddressRef.current = address;
  }, [address, isBorrower, isLender, isMerchant, isUnregistered, location.pathname, navigate]);

  // Determine if the current view is in the separate Evaluator Workspace
  const isEvaluatorWorkspace = location.pathname.startsWith('/app/evaluator') || isOperator;

  // 1. Borrower Navigation (strictly per specification)
  const borrowerNavItems = [
    { to: '/app/borrower/overview', label: 'Overview', icon: LayoutDashboard },
    { to: '/app/borrower/agreements', label: 'Agreements', icon: FileText },
    { to: '/app/borrower/agreements/new', label: 'Create Agreement', icon: PlusCircle },
    { to: '/app/borrower/spending', label: 'Spending', icon: Send },
    { to: '/app/borrower/repayments', label: 'Repayments', icon: TrendingUp },
    { to: '/app/verify', label: 'Identity', icon: UserCheck },
    { to: '/app/borrower/reputation', label: 'Reputation', icon: ShieldCheck },
    { to: '/app/activity', label: 'Activity', icon: Activity },
  ];

  // 2. Lender Navigation (strictly per specification)
  const lenderNavItems = [
    { to: '/app/lender/portfolio', label: 'Portfolio', icon: LayoutDashboard },
    { to: '/app/lender/explore', label: 'Find Agreements', icon: Coins },
    { to: '/app/lender/positions', label: 'Positions', icon: Briefcase },
    { to: '/app/lender/claims', label: 'Claims', icon: Download },
    { to: '/app/lender/governance', label: 'Governance', icon: Vote },
    { to: '/app/activity', label: 'Activity', icon: Activity },
    { to: '/app/verify', label: 'Identity', icon: UserCheck },
  ];

  // 3. Supplier Navigation (strictly per specification)
  const supplierNavItems = [
    { to: '/app/supplier/overview', label: 'Overview', icon: LayoutDashboard },
    { to: '/app/supplier/profile', label: 'Business Profile', icon: Store },
    { to: '/app/verify', label: 'Verification', icon: UserCheck },
    { to: '/app/supplier/disbursements', label: 'Disbursements', icon: Download },
    { to: '/app/supplier/agreements', label: 'Agreements', icon: FileText },
    { to: '/app/activity', label: 'Activity', icon: Activity },
  ];

  // 4. Evaluator Workspace Navigation (segregated workspace)
  const evaluatorNavItems = [
    { to: '/console/evaluator', label: 'Evaluator Console', icon: Terminal },
    { to: '/app/borrower/agreements', label: 'All Agreements', icon: FileText },
    { to: '/app/verify', label: 'Verification Queue', icon: UserCheck },
    { to: '/app/activity', label: 'Chain Activity', icon: Activity },
  ];

  // 5. Unregistered / Guest Navigation
  const unregisteredNavItems = [
    { to: '/app/verify', label: 'Identity & Verification', icon: UserCheck },
    { to: '/app/borrower/agreements', label: 'Browse Agreements', icon: FileText },
    { to: '/app/activity', label: 'Chain Activity', icon: Activity },
  ];

  // Select active navigation based on workspace context & wallet role
  const activeNavItems = isEvaluatorWorkspace
    ? evaluatorNavItems
    : isBorrower
    ? borrowerNavItems
    : isLender
    ? lenderNavItems
    : isMerchant
    ? supplierNavItems
    : unregisteredNavItems;

  const roleTitle = isEvaluatorWorkspace
    ? 'Evaluator Workspace'
    : isBorrower
    ? 'Borrower'
    : isLender
    ? 'Lender'
    : isMerchant
    ? 'Supplier'
    : 'Credit Workspace';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Clean Top Bar with Calibrated Glass */}
      <header className="h-14 surface-glass-header px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Hamburger, Brand Monogram, and Dynamic Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Brand Monogram */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#ffe600] border border-yellow-400 flex items-center justify-center text-black font-black text-sm shadow-xs group-hover:bg-[#facc15] transition-colors">
              C
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-950 hidden sm:inline">
              Credify
            </span>
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block shrink-0" />

          {/* Dynamic Breadcrumbs */}
          <div className="min-w-0">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right: Network Status Indicator & Wallet Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <NetworkStatus />
          <WalletControl />
        </div>
      </header>

      {/* Main Body with Restrained Sidebar + Normal Document Scrolling Content */}
      <div className="flex-1 flex w-full">
        {/* Restrained Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-slate-200 bg-white p-3 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Section Heading */}
            <div className="px-3 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {roleTitle}
            </div>

            {/* Navigation List */}
            <nav className="space-y-1">
              {activeNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to.endsWith('overview') || item.to.endsWith('portfolio') || item.to.endsWith('evaluator')}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors select-none',
                        isActive
                          ? 'bg-[#ffe600] text-black font-bold shadow-xs border border-yellow-400'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer (only shown in operator/evaluator mode) */}
          {isEvaluatorWorkspace && (
            <div className="pt-3 border-t border-slate-200 px-3 flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-900 border border-yellow-400/40 font-mono font-bold">
                OPERATOR
              </span>
            </div>
          )}
        </aside>

        {/* Responsive Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Surface */}
            <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 p-4 shadow-xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200">
              <div className="space-y-4">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#ffe600] border border-yellow-400 flex items-center justify-center text-black font-bold text-xs">
                      C
                    </div>
                    <span className="font-bold text-sm text-slate-950">Credify</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded text-slate-500 hover:text-slate-950 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Role Header */}
                <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {roleTitle} Navigation
                </div>

                {/* Nav Links */}
                <nav className="space-y-1">
                  {activeNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to.endsWith('overview') || item.to.endsWith('portfolio') || item.to.endsWith('evaluator')}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                            isActive
                              ? 'bg-[#ffe600] text-black font-bold border border-yellow-400 shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                          )
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-slate-100" />
            </div>
          </div>
        )}

        {/* Primary Page Outlet — Natural Document Scrolling */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-7xl mx-auto w-full">
          {/* Informative Unregistered Account Notice */}
          {isConnected && isUnregistered && !location.pathname.startsWith('/app/verify') && !location.pathname.startsWith('/app/evaluator') && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold text-amber-950">Unregistered Account:</span>{' '}
                  <span className="text-amber-900">
                    This wallet address is not registered in the Credify system. Complete verification to activate role permissions.
                  </span>
                </div>
              </div>
              <Link
                to="/app/verify"
                className="inline-flex items-center gap-1 font-bold text-amber-950 hover:text-black underline shrink-0"
              >
                <span>Submit Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
};
