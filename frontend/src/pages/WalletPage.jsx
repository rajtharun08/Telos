import React, { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { WalletOverviewCard } from '../components/wallet/WalletOverviewCard';
import { LedgerTable } from '../components/wallet/LedgerTable';
import { TopUpModal } from '../components/wallet/TopUpModal';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

export const WalletPage = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState({ available: 0, locked: 0, earned: 0 });
  const [ledger, setLedger] = useState([]);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      const [wData, lData] = await Promise.all([
        apiFetch('/api/wallet'),
        apiFetch('/api/wallet/ledger')
      ]);
      setWallet(wData);
      setLedger(lData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6 pb-24 md:pb-8">
        
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Escrow & Financial Wallet</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Manage your available balance, locked security deposits, earnings payouts, and audit trail.
          </p>
        </div>

        {/* Overview Metrics */}
        <WalletOverviewCard wallet={wallet} onOpenTopUp={() => setIsTopUpOpen(true)} />

        {/* Audit Ledger Table */}
        <LedgerTable ledger={ledger} />

        {/* Top-up Modal */}
        <TopUpModal
          isOpen={isTopUpOpen}
          onClose={() => setIsTopUpOpen(false)}
          onTopUpSuccess={fetchWalletData}
        />
      </div>
    </PageTransition>
  );
};
