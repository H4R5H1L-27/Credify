import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

const widthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  width = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark Ambient Backdrop with Calibrated Blur */}
      <div
        className="fixed inset-0 bg-dark-bg-0/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-normal"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={cn(
            'w-screen bg-dark-bg-1 border-l border-dark-border-default shadow-depth-elevated flex flex-col justify-between animate-in slide-in-from-right duration-200',
            widthMap[width],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-dark-border-subtle flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-dark-text-primary tracking-tight">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-dark-text-secondary mt-1">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-dark-text-muted hover:text-dark-text-primary rounded-md p-1 transition-colors hover:bg-dark-bg-3 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-5 flex-1 overflow-y-auto">{children}</div>

          {/* Optional Sticky Footer */}
          {footer && (
            <div className="p-4 bg-dark-bg-1/70 border-t border-dark-border-subtle flex items-center justify-end gap-2.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
