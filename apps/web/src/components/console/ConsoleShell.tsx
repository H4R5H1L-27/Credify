import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ConsoleNavigation } from './ConsoleNavigation';
import { ConsoleHeader } from './ConsoleHeader';
import { X } from 'lucide-react';

export const ConsoleShell: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-dark-bg-0 text-dark-text-primary overflow-hidden font-sans">
      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:flex h-full shrink-0">
        <ConsoleNavigation />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 w-72 h-full bg-dark-bg-1 flex flex-col shadow-2xl border-r border-dark-border-subtle">
            <div className="p-4 flex justify-end border-b border-dark-border-subtle/60">
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-bg-2"
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

        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 bg-dark-bg-0 scrollbar-none">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
