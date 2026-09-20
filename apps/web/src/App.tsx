import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from './lib/wagmi';
import { IdentityProvider, useIdentity } from './context/IdentityContext';
import { WalletProvider } from './context/WalletContext';
import { AppShell } from './components/layout/AppShell';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { AuthLoginPage } from './pages/AuthLoginPage';

// Borrower Pages
import { BorrowerOverviewPage } from './pages/borrower/BorrowerOverviewPage';
import { BorrowerAgreementsPage } from './pages/borrower/BorrowerAgreementsPage';
import { BorrowerSpendingPage } from './pages/borrower/BorrowerSpendingPage';
import { BorrowerRepaymentsPage } from './pages/borrower/BorrowerRepaymentsPage';
import { BorrowerReputationPage } from './pages/borrower/BorrowerReputationPage';
import { CreateLoanPage } from './pages/CreateLoanPage';

// Lender Pages
import { LenderPortfolioPage } from './pages/lender/LenderPortfolioPage';
import { LenderExplorePage } from './pages/lender/LenderExplorePage';
import { LenderPositionsPage } from './pages/lender/LenderPositionsPage';
import { LenderClaimsPage } from './pages/lender/LenderClaimsPage';
import { LenderGovernancePage } from './pages/lender/LenderGovernancePage';

// Supplier Pages
import { SupplierOverviewPage } from './pages/supplier/SupplierOverviewPage';
import { SupplierProfilePage } from './pages/supplier/SupplierProfilePage';
import { SupplierDisbursementsPage } from './pages/supplier/SupplierDisbursementsPage';
import { SupplierAgreementsPage } from './pages/supplier/SupplierAgreementsPage';

// Universal / Operational Pages
import { VerificationWorkflowPage } from './pages/verification/VerificationWorkflowPage';
import { LoanDetailPage } from './pages/LoanDetailPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';

// Technical Console Workspace Pages & Shell
import { ConsoleShell } from './components/console';
import {
  ConsoleOverviewPage,
  ConsoleBlockchainPage,
  ConsoleTransactionsPage,
  ConsoleContractsPage,
  ConsoleEventsPage,
  ConsoleBackendPage,
  ConsoleVerificationPage,
  ConsoleArchitecturePage,
  ConsoleTracePage,
  ConsoleReplayPage,
  ConsoleEvaluatorToolsPage,
  ConsoleEvaluatorPage,
} from './pages/console';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Intelligent role-aware redirect component for `/app` root
 */
const AppIndexRedirect: React.FC = () => {
  const { role, isConnected } = useIdentity();

  if (!isConnected) {
    return <Navigate to="/app/borrower/overview" replace />;
  }

  if (role === 'LENDER') {
    return <Navigate to="/app/lender/portfolio" replace />;
  }

  if (role === 'MERCHANT') {
    return <Navigate to="/app/supplier/overview" replace />;
  }

  if (role === 'DEMO_OPERATOR' || role === 'EVALUATOR') {
    return <Navigate to="/app/evaluator" replace />;
  }

  return <Navigate to="/app/borrower/overview" replace />;
};

export const App: React.FC = () => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <IdentityProvider>
          <WalletProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Landing & Marketing */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/demo" element={<AuthLoginPage />} />
                <Route path="/auth/login" element={<AuthLoginPage />} />

                {/* Primary Application Workspace */}
                <Route path="/app" element={<AppShell />}>
                  <Route index element={<AppIndexRedirect />} />
                  <Route path="overview" element={<AppIndexRedirect />} />

                  {/* Borrower Route Tree */}
                  <Route path="borrower/overview" element={<BorrowerOverviewPage />} />
                  <Route path="borrower/agreements" element={<BorrowerAgreementsPage />} />
                  <Route path="borrower/agreements/new" element={<CreateLoanPage />} />
                  <Route path="borrower/spending" element={<BorrowerSpendingPage />} />
                  <Route path="borrower/repayments" element={<BorrowerRepaymentsPage />} />
                  <Route path="borrower/reputation" element={<BorrowerReputationPage />} />

                  {/* Lender Route Tree */}
                  <Route path="lender/portfolio" element={<LenderPortfolioPage />} />
                  <Route path="lender/explore" element={<LenderExplorePage />} />
                  <Route path="lender/positions" element={<LenderPositionsPage />} />
                  <Route path="lender/claims" element={<LenderClaimsPage />} />
                  <Route path="lender/governance" element={<LenderGovernancePage />} />

                  {/* Supplier / Merchant Route Tree */}
                  <Route path="supplier/overview" element={<SupplierOverviewPage />} />
                  <Route path="supplier/profile" element={<SupplierProfilePage />} />
                  <Route path="supplier/disbursements" element={<SupplierDisbursementsPage />} />
                  <Route path="supplier/agreements" element={<SupplierAgreementsPage />} />

                  {/* Identity & Verification Lifecycle */}
                  <Route path="verify" element={<VerificationWorkflowPage />} />
                  <Route path="verify/:loanId" element={<VerificationWorkflowPage />} />

                  {/* Operational Agreement Details (canonical & legacy aliases) */}
                  <Route path="agreements/:loanId" element={<LoanDetailPage />} />
                  <Route path="loans/:loanId" element={<LoanDetailPage />} />
                  <Route path="loans" element={<Navigate to="/app/borrower/agreements" replace />} />
                  <Route path="loans/new" element={<CreateLoanPage />} />

                  {/* Evaluator & Academic Console (Redirected to separate Technical Console) */}
                  <Route path="evaluator" element={<Navigate to="/console/evaluator" replace />} />
                  <Route path="demo/evaluator" element={<Navigate to="/console/evaluator" replace />} />

                  {/* System Audit & Settings */}
                  <Route path="activity" element={<ActivityPage />} />
                  <Route path="reputation" element={<BorrowerReputationPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Dedicated Technical Console Workspace */}
                <Route path="/console" element={<ConsoleShell />}>
                  <Route index element={<Navigate to="/console/overview" replace />} />
                  <Route path="overview" element={<ConsoleOverviewPage />} />
                  <Route path="blockchain" element={<ConsoleBlockchainPage />} />
                  <Route path="transactions" element={<ConsoleTransactionsPage />} />
                  <Route path="contracts" element={<ConsoleContractsPage />} />
                  <Route path="events" element={<ConsoleEventsPage />} />
                  <Route path="backend" element={<ConsoleBackendPage />} />
                  <Route path="verification" element={<ConsoleVerificationPage />} />
                  <Route path="architecture" element={<ConsoleArchitecturePage />} />
                  <Route path="evaluator" element={<ConsoleEvaluatorPage />} />
                  <Route path="trace" element={<ConsoleTracePage />} />
                  <Route path="replay" element={<ConsoleReplayPage />} />
                  <Route path="evaluator-tools" element={<ConsoleEvaluatorToolsPage />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </WalletProvider>
        </IdentityProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
