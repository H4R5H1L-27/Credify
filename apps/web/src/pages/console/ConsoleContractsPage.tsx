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
          <h1 className="text-xl font-black font-mono tracking-tight text-slate-950 uppercase flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-yellow-600" />
            Smart Contract Inspector
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 min-w-0">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 min-w-0">
          <div className="text-xs font-sans font-bold text-slate-700 flex items-center gap-1.5">
            <FileCode2 className="w-4 h-4 text-slate-950" />
            <span>TOTAL CONTRACTS</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-950">
            {isLoading ? '...' : contracts.length}
          </div>
          <div className="text-xs text-slate-600 font-sans font-medium">
            Chain ID 31337 (Localhost)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 min-w-0">
          <div className="text-xs font-sans font-bold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-800" />
            <span>CORE INFRASTRUCTURE</span>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-950">
            {isLoading ? '...' : infrastructureContracts.length}
          </div>
          <div className="text-xs text-slate-600 font-sans font-medium">
            KYC, Factory, Reputation
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 min-w-0">
          <div className="text-xs font-sans font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-800" />
            <span>INSTANTIATED POOLS</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-950">
            {isLoading ? '...' : poolContracts.length}
          </div>
          <div className="text-xs text-slate-600 font-sans font-medium">
            Dynamic Loan Escrows
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 min-w-0">
          <div className="text-xs font-sans font-bold text-slate-700 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-yellow-900" />
            <span>ESCROW BALANCE</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-950 truncate">
            {isLoading ? '...' : formatEther(totalEscrowWei.toString(), 4)}
          </div>
          <div className="text-xs text-slate-600 font-sans font-medium">
            Authoritative on-chain ETH
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white border border-slate-200 shadow-sm rounded-xl min-w-0">
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
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, address, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-950 placeholder:text-slate-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 font-medium"
          />
        </div>
      </div>

      {/* Contracts Section */}
      <TechnicalPanel
        title="Deployed Smart Contracts"
        subtitle="Authoritative EVM contracts discovered on the target network. Click any contract to inspect live state and interface capabilities."
        badge={
          <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-950 font-bold">
            {filteredContracts.length} MATCHING
          </span>
        }
        isLoading={isLoading}
        isEmpty={filteredContracts.length === 0}
        emptyState={
          <div className="py-12 text-center text-xs font-sans text-slate-600 space-y-2">
            <FileCode2 className="w-8 h-8 text-slate-400 mx-auto" />
            <div>No smart contracts match your current filter criteria.</div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-yellow-800 underline hover:text-black font-semibold text-xs"
              >
                Clear search query
              </button>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContracts.map((contract) => {
            const isPool = contract.type === 'POOL';
            const isRegistry = contract.type === 'REGISTRY';
            const isFactory = contract.type === 'FACTORY';

            let typeBadgeColor = 'text-blue-900 bg-blue-50 border-blue-300';
            if (isPool) typeBadgeColor = 'text-emerald-900 bg-emerald-50 border-emerald-300';
            if (isFactory) typeBadgeColor = 'text-yellow-950 bg-yellow-100 border-yellow-400';

            return (
              <div
                key={contract.address}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-yellow-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Contract Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-sm text-slate-950 group-hover:text-black transition-colors">
                        {contract.name}
                      </span>
                      <span
                        className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-md border uppercase ${typeBadgeColor}`}
                      >
                        {contract.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-sans font-medium leading-relaxed">
                      {contract.role}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {contract.hasBytecode ? (
                      <span
                        title="Bytecode verified on-chain"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        EVM OK
                      </span>
                    ) : (
                      <span
                        title="No bytecode detected at address"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-300"
                      >
                        NO CODE
                      </span>
                    )}
                  </div>
                </div>

                {/* Contract Technical Properties */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold text-xs">Address:</span>
                    <TechnicalValue value={contract.address} type="address" chars={6} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold text-xs">On-Chain Balance:</span>
                    <span className="text-slate-950 font-bold">
                      {formatEther(contract.balanceWei, 4)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold text-xs">Architecture:</span>
                    <span className="text-slate-800 font-semibold text-xs">
                      {isPool ? 'Factory Instance' : 'Singleton Genesis'}
                    </span>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200">
                  <Link
                    to={`/console/transactions?address=${contract.address}`}
                    className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-slate-700 hover:text-black transition-colors"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-slate-900" />
                    <span>View Txs</span>
                  </Link>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAddress(contract.address)}
                    className="text-xs font-sans bg-white border-slate-300 text-slate-900 hover:bg-yellow-50 hover:border-yellow-400 font-semibold"
                    icon={<ArrowRight className="w-3.5 h-3.5 text-slate-900" />}
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

