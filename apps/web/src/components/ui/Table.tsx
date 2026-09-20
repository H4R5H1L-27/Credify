import React from 'react';
import { cn } from '../../lib/utils';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <div className="w-full overflow-x-auto rounded-xl border border-dark-border-default bg-dark-bg-2 shadow-dark-xs">
    <table className={cn('w-full text-left text-xs font-sans caption-bottom', className)} {...props} />
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn('bg-dark-bg-3/80 border-b border-dark-border-default text-dark-text-secondary font-semibold select-none', className)} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={cn('divide-y divide-dark-border-subtle font-sans', className)} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={cn('hover:bg-dark-bg-3/50 transition-colors', className)} {...props} />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={cn('py-3 px-4 text-left font-semibold text-dark-text-secondary text-xs uppercase tracking-wider', className)} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn('py-3 px-4 text-dark-text-primary text-xs align-middle', className)} {...props} />
);

export const TableCaption: React.FC<React.HTMLAttributes<HTMLTableCaptionElement>> = ({ className, ...props }) => (
  <caption className={cn('py-2 text-[11px] text-dark-text-muted font-mono', className)} {...props} />
);
