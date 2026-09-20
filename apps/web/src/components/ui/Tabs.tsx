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
          'relative flex items-center p-1 rounded-xl bg-[#141416] border border-white/10 overflow-x-auto no-scrollbar shadow-inner',
          className
        )}
      >
        {/* Animated Sliding Pill Indicator (Apple Segmented Control) */}
        <div
          className="absolute top-1 bottom-1 rounded-lg bg-[#242428] border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] pointer-events-none transition-all duration-200 ease-expo-out"
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
                'relative z-10 flex items-center justify-center gap-2 py-1.5 px-3.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer select-none',
                isActive
                  ? 'text-white font-semibold'
                  : 'text-[#86868b] hover:text-white'
              )}
            >
              {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold',
                    isActive
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-white/10 text-white/60'
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
        'relative flex border-b border-white/10 gap-2 overflow-x-auto no-scrollbar',
        className
      )}
    >
      {/* Animated Sliding Underline Indicator */}
      <div
        className="absolute bottom-0 h-0.5 bg-[#2997ff] shadow-[0_0_10px_rgba(41,151,255,0.8)] pointer-events-none transition-all duration-200 ease-expo-out"
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
              'relative z-10 flex items-center gap-2 py-2.5 px-3 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer select-none',
              isActive
                ? 'text-[#2997ff] font-semibold'
                : 'text-[#86868b] hover:text-white'
            )}
          >
            {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold',
                  isActive
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'bg-dark-bg-3 text-dark-text-muted'
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
