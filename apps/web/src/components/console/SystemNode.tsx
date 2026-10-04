import React from 'react';
import { cn } from '../../lib/utils';
import { TechnicalStatus, type TechnicalStatusType } from './TechnicalStatus';
import { Server, Database, Cpu, Radio } from 'lucide-react';

export type SystemNodeType = 'evm-node' | 'indexer' | 'api-server' | 'registry';

export interface SystemNodeProps {
  name: string;
  type: SystemNodeType;
  endpoint?: string;
  status: TechnicalStatusType;
  statusLabel?: string;
  metrics?: { label: string; value: string | number }[];
  className?: string;
}

const TYPE_ICONS: Record<SystemNodeType, React.ReactNode> = {
  'evm-node': <Cpu className="w-4 h-4 text-slate-950" />,
  indexer: <Radio className="w-4 h-4 text-purple-800" />,
  'api-server': <Server className="w-4 h-4 text-emerald-800" />,
  registry: <Database className="w-4 h-4 text-indigo-800" />,
};

export const SystemNode: React.FC<SystemNodeProps> = ({
  name,
  type,
  endpoint,
  status,
  statusLabel,
  metrics = [],
  className,
}) => {
  return (
    <div
      className={cn(
        'p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 transition-all duration-normal hover:border-yellow-400 hover:shadow-md min-w-0',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-yellow-50 border border-yellow-300 shrink-0">
            {TYPE_ICONS[type]}
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="text-sm font-bold font-sans text-slate-950 tracking-tight truncate">
              {name}
            </div>
            {endpoint && (
              <div className="text-xs font-mono text-slate-700 font-medium truncate">
                {endpoint}
              </div>
            )}
          </div>
        </div>

        <TechnicalStatus status={status} label={statusLabel} size="sm" />
      </div>

      {metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
          {metrics.map((m, idx) => (
            <div key={idx} className="space-y-0.5 min-w-0">
              <span className="text-xs font-sans text-slate-700 font-medium block truncate">
                {m.label}
              </span>
              <span className="font-mono font-bold text-slate-950 text-sm block truncate">
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
