import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { consoleApi } from '../../lib/api';
import { formatEther } from '../../lib/utils';
import {
  TechnicalPanel,
  TechnicalValue,
  TechnicalStatus,
  ContractInspectorModal,
  TransactionDetailModal,
} from '../../components/console';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui';
import {
  FileCode2,
  RefreshCw,
  Layers,
  Search,
  CheckCircle2,
  ShieldCheck,
  Factory,
  Coins,
  ArrowRight,
  ExternalLink,
  Wallet,
  ArrowLeftRight,
} from 'lucide-react';

export const ConsoleContractsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAddress = searchParams.get('address');

  const [selectedAddress, setSelectedAddress] = useState<string | null>(initialAddress);
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'INFRASTRUCTURE' | 'POOLS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync URL search param when selectedAddress changes
  useEffect(() => {
    if (selectedAddress) {
      setSearchParams({ address: selectedAddress }, { replace: true });
    } else if (searchParams.has('address')) {
      searchParams.delete('address');
      setSearchParams(searchParams, { replace: true });
    }
  }, [selectedAddress]);

  // Keep local state in sync if user navigates back/forward with browser buttons
  useEffect(() => {
    const addressInUrl = searchParams.get('address');
    if (addressInUrl !== selectedAddress) {
      setSelectedAddress(addressInUrl);
    }
  }, [searchParams]);

  const {
    data: contracts = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['console', 'contracts'],
    queryFn: () => consoleApi.getContracts(),
    refetchInterval: 5000,
  });

  // Calculate high-level summary KPIs
  const infrastructureContracts = useMemo(
    () => contracts.filter((c) => c.type === 'REGISTRY' || c.type === 'FACTORY'),
    [contracts]
  );
  const poolContracts = useMemo(() => contracts.filter((c) => c.type === 'POOL'), [contracts]);

  const totalEscrowWei = useMemo(() => {
    return poolContracts.reduce((acc, c) => {
      try {
        return acc + BigInt(c.balanceWei || '0');
      } catch {
        return acc;
      }
    }, BigInt(0));
  }, [poolContracts]);

  // Filtered list based on category tab and text search
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      // Category filter
      if (categoryFilter === 'INFRASTRUCTURE' && contract.type === 'POOL') return false;
      if (categoryFilter === 'POOLS' && contract.type !== 'POOL') return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = contract.name.toLowerCase().includes(query);
        const matchesAddress = contract.address.toLowerCase().includes(query);
        const matchesRole = contract.role.toLowerCase().includes(query);
        return matchesName || matchesAddress || matchesRole;
      }

      return true;
    });
  }, [contracts, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-dark-text-primary uppercase flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-brand-400" />
            Smart Contract Inspector
          </h1>
          <p className="text-xs text-dark-text-secondary mt-0.5">
            Deterministic EVM bytecode deployments, authoritative registries, and instantiated agreement escrow facilities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            loading={isLoading || isRefetching}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
          >
            Refresh Contracts
          </Button>
        </div>
      </div>

      {/* Contract Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle flex flex-col justify-between">
          <div className="text-[11px] font-mono text-dark-text-muted flex items-center gap-1.5">
            <FileCode2 className="w-3.5 h-3.5 text-brand-400" />
            TOTAL CONTRACTS
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-dark-text-primary">
            {isLoading ? '...' : contracts.length}
          </div>
          <div className="mt-1 text-[10px] text-dark-text-secondary font-mono">
            Chain ID 31337 (Localhost)
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle flex flex-col justify-between">
          <div className="text-[11px] font-mono text-dark-text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            CORE INFRASTRUCTURE
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-400">
            {isLoading ? '...' : infrastructureContracts.length}
          </div>
          <div className="mt-1 text-[10px] text-dark-text-secondary font-mono">
            KYC, Factory, Reputation
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle flex flex-col justify-between">
          <div className="text-[11px] font-mono text-dark-text-muted flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            INSTANTIATED POOLS
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {isLoading ? '...' : poolContracts.length}
          </div>
          <div className="mt-1 text-[10px] text-dark-text-secondary font-mono">
            Dynamic Loan Escrows
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-dark-bg-2 border border-dark-border-subtle flex flex-col justify-between">
          <div className="text-[11px] font-mono text-dark-text-muted flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-brand-400" />
            ESCROW BALANCE
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-brand-400 truncate">
            {isLoading ? '...' : formatEther(totalEscrowWei.toString(), 4)}
          </div>
          <div className="mt-1 text-[10px] text-dark-text-secondary font-mono">
            Authoritative on-chain ETH
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-dark-bg-2 border border-dark-border-subtle rounded-lg">
        {/* Category Tabs with Animated Pill Glider */}
        <Tabs
          variant="pill"
          tabs={[
            { id: 'ALL', label: 'ALL CONTRACTS', count: contracts.length },
            { id: 'INFRASTRUCTURE', label: 'INFRASTRUCTURE', count: infrastructureContracts.length },
            { id: 'POOLS', label: 'LOAN POOLS', count: poolContracts.length },
          ]}
          activeTab={categoryFilter}
          onChange={(id) => setCategoryFilter(id as any)}
        />

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-dark-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, address, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-dark-bg-3 border border-dark-border-subtle rounded-md text-dark-text-primary placeholder:text-dark-text-muted focus:outline-none focus:border-brand-500/50"
          />
        </div>
      </div>

      {/* Contracts Section */}
      <TechnicalPanel
        title="Deployed Smart Contracts"
        subtitle="Authoritative EVM contracts discovered on the target network. Click any contract to inspect live state and interface capabilities."
        badge={
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-dark-bg-3 border border-dark-border-subtle text-dark-text-secondary">
            {filteredContracts.length} MATCHING
          </span>
        }
        isLoading={isLoading}
        isEmpty={filteredContracts.length === 0}
        emptyState={
          <div className="py-12 text-center text-xs font-mono text-dark-text-muted space-y-2">
            <FileCode2 className="w-8 h-8 text-dark-text-muted mx-auto" />
            <div>No smart contracts match your current filter criteria.</div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-brand-400 underline hover:text-brand-300 text-[11px]"
              >
                Clear search query
              </button>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredContracts.map((contract) => {
            const isPool = contract.type === 'POOL';
            const isRegistry = contract.type === 'REGISTRY';
            const isFactory = contract.type === 'FACTORY';

            let typeBadgeColor = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
            if (isPool) typeBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            if (isFactory) typeBadgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';

            return (
              <div
                key={contract.address}
                className="p-4 rounded-lg bg-dark-bg-3 border border-dark-border-subtle hover:border-dark-border-default transition-all flex flex-col justify-between space-y-3.5 group"
              >
                {/* Contract Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-sm text-dark-text-primary group-hover:text-brand-400 transition-colors">
                        {contract.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${typeBadgeColor}`}
                      >
                        {contract.type}
                      </span>
                    </div>
                    <p className="text-xs text-dark-text-secondary leading-relaxed">
                      {contract.role}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {contract.hasBytecode ? (
                      <span
                        title="Bytecode verified on-chain"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        EVM OK
                      </span>
                    ) : (
                      <span
                        title="No bytecode detected at address"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      >
                        NO CODE
                      </span>
                    )}
                  </div>
                </div>

                {/* Contract Technical Properties */}
                <div className="p-3 bg-dark-bg-2 border border-dark-border-subtle rounded-md space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-dark-text-muted text-[11px]">Address:</span>
                    <TechnicalValue value={contract.address} type="address" chars={6} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-dark-text-muted text-[11px]">On-Chain Balance:</span>
                    <span className="text-dark-text-primary font-bold">
                      {formatEther(contract.balanceWei, 4)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-dark-text-muted text-[11px]">Architecture:</span>
                    <span className="text-dark-text-secondary text-[11px]">
                      {isPool ? 'Factory Instance' : 'Singleton Genesis'}
                    </span>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="pt-1 flex items-center justify-between gap-2 border-t border-dark-border-subtle/50">
                  <Link
                    to={`/console/transactions?address=${contract.address}`}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-dark-text-muted hover:text-brand-400 transition-colors"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    View Txs
                  </Link>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAddress(contract.address)}
                    className="text-xs font-mono group-hover:border-brand-500/40"
                    icon={<ArrowRight className="w-3.5 h-3.5 text-brand-400" />}
                  >
                    Inspect State
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </TechnicalPanel>

      {/* Contract Inspector Modal */}
      <ContractInspectorModal
        address={selectedAddress}
        isOpen={Boolean(selectedAddress)}
        onClose={() => setSelectedAddress(null)}
        onSelectTx={(txHash) => setSelectedTx(txHash)}
      />

      {/* Transaction Detail Modal for seamless drill-down */}
      <TransactionDetailModal
        txHash={selectedTx}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};

