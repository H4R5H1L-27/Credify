import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AddressBadge } from '../ui/AddressBadge';
import { DEMO_ACCOUNTS, HARDHAT_CHAIN_ID, HARDHAT_RPC_URL } from '@credify/shared';
import { useWallet } from '../../context/WalletContext';
import { Copy, Check, Key, ShieldAlert, PlusCircle } from 'lucide-react';

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
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <div className="font-bold text-amber-950">Academic Demo Test Accounts Only</div>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed font-medium">
                These private keys are derived from the standard open-source Hardhat test mnemonic (<code className="bg-white border border-amber-200 px-1.5 py-0.5 rounded text-amber-900 font-mono font-bold">"test ... junk"</code>). They control simulated demo ETH on your local node. <strong>Never send real funds to these addresses or import real mainnet private keys.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Network Configuration */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-950 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span>
                Add Localhost EVM to MetaMask
              </div>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                RPC: <span className="font-mono text-slate-900 font-bold">{HARDHAT_RPC_URL}</span> · Chain ID: <span className="font-mono text-slate-900 font-bold">{HARDHAT_CHAIN_ID}</span> · Currency: <span className="text-slate-900 font-bold">ETH</span>
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddNetwork}
              className="shrink-0 border-blue-300 text-blue-800 hover:bg-blue-50 font-semibold"
            >
              {networkAdded ? (
                <>
                  <Check className="mr-1.5 h-4 w-4 text-emerald-600" />
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
            <div className="font-bold text-slate-950 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</span>
              Deterministic Test Accounts
            </div>
            <span className="text-xs text-slate-500 font-medium">Copy a key → In MetaMask: Account → Add Account → Import</span>
          </div>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {DEMO_ACCOUNTS.map((acc, index) => {
              const isCurrent = address && address.toLowerCase() === acc.address.toLowerCase();
              return (
                <div key={acc.id} className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isCurrent ? 'bg-blue-50/60' : 'hover:bg-slate-50/70'}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-950">{acc.displayName}</span>
                      <Badge variant={acc.role === 'BORROWER' ? 'default' : acc.role === 'LENDER' ? 'success' : 'secondary'}>
                        {acc.role}
                      </Badge>
                      {isCurrent && (
                        <Badge variant="warning">
                          Active in MetaMask
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <AddressBadge address={acc.address} chars={6} />
                      <span>·</span>
                      <span className="text-slate-600">{acc.description}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dual Mode Note */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-600 font-medium flex items-center justify-between shadow-xs">
          <span>
            <strong className="text-slate-950">Tip:</strong> If you prefer evaluating without MetaMask, simply close this dialog. Credify includes full backend persona simulation by default.
          </span>
          <Button size="sm" variant="secondary" onClick={closeImportModal}>
            Got it
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
