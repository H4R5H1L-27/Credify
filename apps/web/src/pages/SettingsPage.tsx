import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useIdentity } from '../context/IdentityContext';
import { AddressBadge } from '../components/ui/AddressBadge';
import { HARDHAT_CHAIN_ID, HARDHAT_RPC_URL } from '@credify/shared';

export const SettingsPage: React.FC = () => {
  const { identity, address, role } = useIdentity();

  const handleClearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="border-b border-dark-border-subtle pb-5">
        <h1 className="text-2xl font-bold text-dark-text-primary tracking-tight">Workspace Settings</h1>
        <p className="text-xs text-dark-text-secondary mt-1">
          Local configuration and connected session parameters.
        </p>
      </div>

      <Card className="shadow-depth-card border-dark-border-subtle bg-dark-bg-1">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Active Session Identity</CardTitle>
          <CardDescription>Connected wallet information and role permissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-dark-bg-2 rounded border border-dark-border-subtle space-y-1">
              <span className="text-[11px] text-dark-text-muted block">Connected Wallet</span>
              {address ? (
                <AddressBadge address={address} chars={6} />
              ) : (
                <span className="text-dark-text-muted font-medium">No wallet connected</span>
              )}
            </div>

            <div className="p-3 bg-dark-bg-2 rounded border border-dark-border-subtle space-y-1">
              <span className="text-[11px] text-dark-text-muted block">Identified Role</span>
              <span className="font-semibold text-dark-text-primary block">
                {identity?.displayName || 'Unregistered Guest'} ({role})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-depth-card border-dark-border-subtle bg-dark-bg-1">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Environment Parameters</CardTitle>
          <CardDescription>System parameters used across local services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-dark-bg-2 rounded border border-dark-border-subtle">
              <span className="text-[11px] text-dark-text-muted block">Fastify Backend API</span>
              <span className="font-mono font-semibold text-dark-text-primary mt-0.5 block">http://localhost:4100</span>
            </div>

            <div className="p-3 bg-dark-bg-2 rounded border border-dark-border-subtle">
              <span className="text-[11px] text-dark-text-muted block">Hardhat EVM RPC</span>
              <span className="font-mono font-semibold text-dark-text-primary mt-0.5 block">{HARDHAT_RPC_URL}</span>
            </div>

            <div className="p-3 bg-dark-bg-2 rounded border border-dark-border-subtle">
              <span className="text-[11px] text-dark-text-muted block">Local Chain ID</span>
              <span className="font-mono font-semibold text-dark-text-primary mt-0.5 block">{HARDHAT_CHAIN_ID}</span>
            </div>

            <div className="p-3 bg-dark-bg-2 rounded border border-dark-border-subtle">
              <span className="text-[11px] text-dark-text-muted block">Security Mode</span>
              <span className="font-semibold text-emerald-400 mt-0.5 block">Local Test Network</span>
            </div>
          </div>

          <div className="pt-4 border-t border-dark-border-subtle flex items-center justify-between">
            <div>
              <div className="font-semibold text-dark-text-primary">Clear Local Browser Cache</div>
              <div className="text-xs text-dark-text-muted">Resets cached preferences and reload session.</div>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearStorage}>
              Clear Storage &amp; Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
