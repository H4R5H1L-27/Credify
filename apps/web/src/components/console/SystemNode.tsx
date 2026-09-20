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
  'evm-node': <Cpu className="w-4 h-4 text-brand-400" />,
  indexer: <Radio className="w-4 h-4 text-purple-400" />,
  'api-server': <Server className="w-4 h-4 text-emerald-400" />,
  registry: <Database className="w-4 h-4 text-indigo-400" />,
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
        'p-5 rounded-2xl border border-dark-border-subtle/80 bg-dark-bg-2 shadow-depth-card space-y-4 transition-all duration-normal hover:border-dark-border-strong',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-dark-bg-3 border border-dark-border-subtle/60 shrink-0">
            {TYPE_ICONS[type]}
          </div>
          <div className="space-y-0.5">
            <div className="text-sm font-bold font-sans text-dark-text-primary tracking-tight">
              {name}
            </div>
            {endpoint && (
              <div className="text-xs font-mono text-dark-text-secondary">
                {endpoint}
              </div>
            )}
          </div>
        </div>

        <TechnicalStatus status={status} label={statusLabel} size="sm" />
      </div>

      {metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-dark-border-subtle/50 text-xs">
          {metrics.map((m, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-xs font-sans text-dark-text-secondary block">
                {m.label}
              </span>
              <span className="font-mono font-bold text-dark-text-primary text-sm block">
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
