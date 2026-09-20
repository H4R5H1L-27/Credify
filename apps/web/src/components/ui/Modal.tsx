import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  maxWidth = 'lg',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Ambient Backdrop with Calibrated Blur */}
      <div
        className="fixed inset-0 bg-dark-bg-0/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-normal"
        onClick={onClose}
      />

      {/* Floating Glass Dialog Surface */}
      <div
        className={cn(
          'relative z-50 surface-glass rounded-2xl w-full overflow-hidden animate-in zoom-in-95 duration-fast',
          maxWidthMap[maxWidth],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="p-5">{children}</div>

        {footer && (
          <div className="p-4 bg-dark-bg-1/70 border-t border-dark-border-subtle flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
