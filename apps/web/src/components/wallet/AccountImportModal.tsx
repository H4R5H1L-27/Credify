import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AddressBadge } from '../ui/AddressBadge';
import { DEMO_ACCOUNTS, HARDHAT_CHAIN_ID, HARDHAT_RPC_URL } from '@credify/shared';
import { useWallet } from '../../context/WalletContext';
import { Copy, Check, Key, ShieldAlert, PlusCircle, ExternalLink } from 'lucide-react';

export const AccountImportModal: React.FC = () => {
  const { isImportModalOpen, closeImportModal, addHardhatNetwork, address } = useWallet();
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);
  const [networkAdded, setNetworkAdded] = useState(false);

  const handleCopyKey = (key: string, index: number) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyIndex(index);
    setTimeout(() => setCopiedKeyIndex(null), 2000);
  };

  const handleAddNetwork = async () => {
    await addHardhatNetwork();
    setNetworkAdded(true);
    setTimeout(() => setNetworkAdded(false), 3000);
  };

  return (
    <Dialog
      open={isImportModalOpen}
      onClose={closeImportModal}
      title="Evaluator Wallet Assistant"
      description="Connect MetaMask to the local Hardhat node and import test accounts to sign transactions directly."
      className="max-w-3xl"
    >
      <div className="space-y-6 text-sm">
        {/* Academic Safety Banner */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <div className="font-semibold text-amber-300">Academic Demo Test Accounts Only</div>
              <p className="mt-1 text-xs text-amber-200/80 leading-relaxed">
                These private keys are derived from the standard open-source Hardhat test mnemonic (<code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-300 font-mono">"test ... junk"</code>). They control simulated demo ETH on your local node. <strong>Never send real funds to these addresses or import real mainnet private keys.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Network Configuration */}
        <div className="rounded-xl border border-white/10 bg-dark-bg-1 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-medium text-white flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-400">1</span>
                Add Localhost EVM to MetaMask
              </div>
              <p className="mt-1 text-xs text-[#86868b]">
                RPC: <span className="font-mono text-white/90">{HARDHAT_RPC_URL}</span> · Chain ID: <span className="font-mono text-white/90">{HARDHAT_CHAIN_ID}</span> · Currency: <span className="text-white/90">ETH</span>
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddNetwork}
              className="shrink-0 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
            >
              {networkAdded ? (
                <>
                  <Check className="mr-1.5 h-4 w-4 text-emerald-400" />
                  Request Sent
                </>
              ) : (
                <>
                  <PlusCircle className="mr-1.5 h-4 w-4" />
                  Add Network to MetaMask
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Step 2: Import Test Personas */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="font-medium text-white flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-400">2</span>
              Deterministic Test Accounts
            </div>
            <span className="text-xs text-[#86868b]">Copy a key $\rightarrow$ In MetaMask: Account $\rightarrow$ Add Account $\rightarrow$ Import</span>
          </div>

          <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-dark-bg-1 overflow-hidden shadow-sm">
            {DEMO_ACCOUNTS.map((acc, index) => {
              const isCurrent = address && address.toLowerCase() === acc.address.toLowerCase();
              return (
                <div key={acc.id} className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isCurrent ? 'bg-blue-500/10' : 'hover:bg-white/[0.03]'}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{acc.displayName}</span>
                      <Badge variant={acc.role === 'BORROWER' ? 'default' : acc.role === 'LENDER' ? 'success' : 'secondary'}>
                        {acc.role}
                      </Badge>
                      {isCurrent && (
                        <Badge variant="warning">
                          Active in MetaMask
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#86868b]">
                      <AddressBadge address={acc.address} chars={6} />
                      <span>·</span>
                      <span className="text-[#86868b]">{acc.description}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dual Mode Note */}
        <div className="rounded-xl border border-white/10 bg-dark-bg-1 p-3 text-xs text-[#86868b] flex items-center justify-between">
          <span>
            <strong className="text-white/90">Tip:</strong> If you prefer evaluating without MetaMask, simply close this dialog. Credify includes full backend persona simulation by default.
          </span>
          <Button size="sm" variant="secondary" onClick={closeImportModal}>
            Got it
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
