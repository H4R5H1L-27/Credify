import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useIdentity } from '../context/IdentityContext';
import { AddressBadge } from '../components/ui/AddressBadge';
import { HARDHAT_CHAIN_ID, HARDHAT_RPC_URL } from '@credify/shared';
import { ShieldCheck, Server, RefreshCw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { identity, address, role } = useIdentity();

  const handleClearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-black text-slate-950 tracking-tight">Workspace Settings</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Local configuration and connected session parameters.
        </p>
      </div>

      <Card className="shadow-sm border-slate-200 bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-950">Active Session Identity</CardTitle>
          <CardDescription className="text-xs text-slate-500">Connected wallet information and role permissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Connected Wallet</span>
              {address ? (
                <AddressBadge address={address} chars={6} />
              ) : (
                <span className="text-slate-500 font-medium">No wallet connected</span>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Identified Role</span>
              <span className="font-bold text-slate-950 block">
                {identity?.displayName || 'Unregistered Guest'} ({role})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-950">Environment Parameters</CardTitle>
          <CardDescription className="text-xs text-slate-500">System parameters used across local services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Fastify Backend API</span>
              <span className="font-mono font-bold text-slate-950 mt-1 block">http://localhost:4100</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Hardhat EVM RPC</span>
              <span className="font-mono font-bold text-slate-950 mt-1 block">{HARDHAT_RPC_URL}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Local Chain ID</span>
              <span className="font-mono font-bold text-slate-950 mt-1 block">{HARDHAT_CHAIN_ID}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Security Mode</span>
              <span className="font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Local Test Network
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-950">Clear Local Browser Cache</div>
              <div className="text-xs text-slate-500 font-medium">Resets cached preferences and reloads session.</div>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearStorage} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Clear Storage &amp; Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
