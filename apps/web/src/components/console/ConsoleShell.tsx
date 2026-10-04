import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ConsoleNavigation } from './ConsoleNavigation';
import { ConsoleHeader } from './ConsoleHeader';
import { X } from 'lucide-react';

export const ConsoleShell: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen w-full min-w-0 bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:flex h-full shrink-0">
        <ConsoleNavigation />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 w-72 h-full bg-white flex flex-col shadow-2xl border-r border-slate-200">
            <div className="p-4 flex justify-end border-b border-slate-200">
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConsoleNavigation onCloseMobile={() => setMobileNavOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <ConsoleHeader onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc] min-w-0">
          <div className="max-w-7xl mx-auto w-full min-w-0 space-y-6 sm:space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
