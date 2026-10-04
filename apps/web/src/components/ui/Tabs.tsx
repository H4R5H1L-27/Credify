import React, { useRef, useState, useEffect, useId } from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [gliderStyle, setGliderStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({ left: 0, width: 0, opacity: 0 });

  const instanceId = useId();

  useEffect(() => {
    const updateGlider = () => {
      const container = containerRef.current;
      const activeButton = tabRefs.current.get(activeTab);

      if (container && activeButton) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeButton.getBoundingClientRect();

        setGliderStyle({
          left: activeRect.left - containerRect.left + container.scrollLeft,
          width: activeRect.width,
          opacity: 1,
        });
      }
    };

    updateGlider();

    window.addEventListener('resize', updateGlider);
    return () => window.removeEventListener('resize', updateGlider);
  }, [activeTab, tabs]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextTab = tabs[(index + 1) % tabs.length];
      onChange(nextTab.id);
      tabRefs.current.get(nextTab.id)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevTab = tabs[(index - 1 + tabs.length) % tabs.length];
      onChange(prevTab.id);
      tabRefs.current.get(prevTab.id)?.focus();
    }
  };

  if (variant === 'pill') {
    return (
      <div
        ref={containerRef}
        role="tablist"
        className={cn(
          'relative flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/90 overflow-x-auto no-scrollbar',
          className
        )}
      >
        {/* Animated Sliding Pill Indicator (Bright Yellow High Contrast) */}
        <div
          className="absolute top-1 bottom-1 rounded-lg bg-[#ffe600] border border-yellow-400 shadow-[0_1px_4px_rgba(234,179,8,0.35)] pointer-events-none transition-all duration-200 ease-expo-out"
          style={{
            transform: `translateX(${gliderStyle.left}px)`,
            width: `${gliderStyle.width}px`,
            opacity: gliderStyle.opacity,
          }}
        />

        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
                else tabRefs.current.delete(tab.id);
              }}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                'relative z-10 flex items-center justify-center gap-2 py-1.5 px-3.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer select-none',
                isActive
                  ? 'text-black font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold transition-colors',
                    isActive
                      ? 'bg-black text-[#ffe600]'
                      : 'bg-slate-200 text-slate-700'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: 'underline' variant with smooth bottom glider
  return (
    <div
      ref={containerRef}
      role="tablist"
      className={cn(
        'relative flex border-b border-slate-200 gap-2 overflow-x-auto no-scrollbar',
        className
      )}
    >
      {/* Animated Sliding Underline Indicator */}
      <div
        className="absolute bottom-0 h-0.5 bg-[#eab308] shadow-[0_0_8px_rgba(234,179,8,0.5)] pointer-events-none transition-all duration-200 ease-expo-out"
        style={{
          transform: `translateX(${gliderStyle.left}px)`,
          width: `${gliderStyle.width}px`,
          opacity: gliderStyle.opacity,
        }}
      />

      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'relative z-10 flex items-center gap-2 py-2.5 px-3 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer select-none',
              isActive
                ? 'text-slate-950 font-bold border-b-2 border-[#eab308]'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold',
                  isActive
                    ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
