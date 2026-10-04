import React from 'react';
import { cn } from '../../lib/utils';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
    <table className={cn('w-full text-left text-xs font-sans caption-bottom', className)} {...props} />
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn('bg-slate-50 border-b border-slate-200 text-slate-700 font-bold select-none', className)} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={cn('divide-y divide-slate-100 font-sans', className)} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={cn('hover:bg-yellow-50/40 transition-colors', className)} {...props} />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={cn('py-3.5 px-4 text-left font-bold text-slate-800 text-xs uppercase tracking-wider', className)} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn('py-3.5 px-4 text-slate-900 text-xs align-middle font-medium', className)} {...props} />
);

export const TableCaption: React.FC<React.HTMLAttributes<HTMLTableCaptionElement>> = ({ className, ...props }) => (
  <caption className={cn('py-2 text-[11px] text-slate-500 font-mono', className)} {...props} />
);
