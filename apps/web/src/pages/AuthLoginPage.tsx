import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Wallet, ShieldCheck, Terminal, ArrowRight } from 'lucide-react';

export const AuthLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, connectWallet } = useWallet();

  useEffect(() => {
    if (isConnected) {
      navigate('/app', { replace: true });
    }
  }, [isConnected, navigate]);

  return (
    <div className="min-h-screen surface-canvas flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-credify-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
              C
            </div>
            <span className="font-bold text-2xl tracking-tight text-dark-text-primary">Credify</span>
          </Link>
          <div className="text-xs font-semibold uppercase tracking-wider text-dark-text-muted">
            Decentralized Credit Application
          </div>
        </div>

        {/* Wallet Gateway Card */}
        <Card className="shadow-depth-card border-dark-border-subtle bg-dark-bg-1">
          <CardHeader className="text-center pb-3">
            <div className="w-12 h-12 rounded-full bg-credify-950/40 border border-credify-500/30 text-credify-400 flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg">Connect Web3 Wallet</CardTitle>
            <CardDescription className="text-xs leading-relaxed text-dark-text-secondary">
              Credify authenticates actors directly through their connected wallet address. Your address determines your role, permissions, and on-chain verification state.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="primary"
              onClick={connectWallet}
              className="w-full py-2.5 text-xs font-semibold"
              icon={<Wallet className="w-4 h-4" />}
            >
              Connect MetaMask
            </Button>

            <div className="pt-3 border-t border-dark-border-subtle flex flex-col items-center gap-2 text-center text-xs">
              <span className="text-dark-text-secondary">Academic evaluator or tester?</span>
              <Link
                to="/console/evaluator"
                className="inline-flex items-center gap-1 font-semibold text-credify-400 hover:text-credify-300"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Open Evaluator Console &amp; Test Keys</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="p-3 bg-dark-bg-1 border border-dark-border-subtle rounded-lg text-center text-xs text-dark-text-secondary leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-400 inline-block mr-1 mb-0.5" />
          <span>Local network execution (Chain ID 31337) • Zero real money or financial credentials.</span>
        </div>
      </div>
    </div>
  );
};
