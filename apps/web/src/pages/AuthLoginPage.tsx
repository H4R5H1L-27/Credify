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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#ffe600] flex items-center justify-center text-black font-black text-lg shadow-sm border border-yellow-400">
              C
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-950">Credify</span>
          </Link>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Decentralized Credit Application
          </div>
        </div>

        {/* Wallet Gateway Card */}
        <Card className="shadow-sm border-slate-200 bg-white rounded-2xl">
          <CardHeader className="text-center pb-3">
            <div className="w-12 h-12 rounded-2xl bg-yellow-100 border border-yellow-300 text-yellow-900 flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-black text-slate-950">Connect Web3 Wallet</CardTitle>
            <CardDescription className="text-xs leading-relaxed text-slate-500 font-medium">
              Credify authenticates actors directly through their connected wallet address. Your address determines your role, permissions, and on-chain verification state.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="primary"
              onClick={connectWallet}
              className="w-full py-2.5 text-xs font-bold bg-[#ffe600] text-black hover:bg-yellow-400 border border-yellow-400"
              icon={<Wallet className="w-4 h-4" />}
            >
              Connect MetaMask
            </Button>

            <div className="pt-3 border-t border-slate-200 flex flex-col items-center gap-2 text-center text-xs">
              <span className="text-slate-500 font-medium">Academic evaluator or tester?</span>
              <Link
                to="/console/evaluator"
                className="inline-flex items-center gap-1 font-bold text-slate-950 hover:text-black hover:underline"
              >
                <Terminal className="w-3.5 h-3.5 text-yellow-600" />
                <span>Open Evaluator Console &amp; Test Keys</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-600 font-medium leading-relaxed shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 inline-block mr-1.5 mb-0.5" />
          <span>Local network execution • Zero real money or financial credentials required.</span>
        </div>
      </div>
    </div>
  );
};
