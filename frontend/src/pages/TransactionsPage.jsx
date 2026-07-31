import React, { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { TransactionCard } from '../components/transactions/TransactionCard';
import { QrGeneratorModal } from '../components/handoff/QrGeneratorModal';
import { QrScannerModal } from '../components/handoff/QrScannerModal';
import { Skeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import {
  Repeat,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TransactionsPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'BORROWER' | 'LENDER'

  // Modals
  const [qrGenTx, setQrGenTx] = useState(null);
  const [qrScanTx, setQrScanTx] = useState(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/transactions');
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const filtered = transactions.filter((t) => {
    if (activeTab === 'BORROWER') return t.borrowerId === user.id;
    if (activeTab === 'LENDER') return t.lenderId === user.id;
    return true;
  });

  // Calculate Metrics
  const activeCount = transactions.filter((t) => ['REQUESTED', 'APPROVED', 'ACTIVE'].includes(t.state)).length;
  const totalEscrowLocked = transactions
    .filter((t) => ['APPROVED', 'ACTIVE'].includes(t.state))
    .reduce((sum, t) => sum + (t.fee || 0) + (t.deposit || 0), 0);
  const completedCount = transactions.filter((t) => t.state === 'RETURNED').length;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8 pb-24 md:pb-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-forest-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Server-Authoritative State Machine
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Transaction Lifecycle Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Manage requests, approve handoffs with QR codes, and monitor escrow balances.
            </p>
          </div>
        </div>

        {/* Overview Metric Cards (3 Column) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              <span>Active Rentals</span>
              <Clock className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {activeCount}
            </div>
            <p className="text-[11px] text-slate-400">In-progress requests & handoffs</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              <span>Escrow Protection</span>
              <Lock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              ₹{totalEscrowLocked.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400">Secured in atomic wallet holds</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              <span>Completed Handoffs</span>
              <CheckCircle2 className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-forest-600 dark:text-emerald-400 font-mono">
              {completedCount}
            </div>
            <p className="text-[11px] text-slate-400">Successful P2P returns</p>
          </div>
        </div>

        {/* Role Tabs Bar */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800/60 p-1.5 rounded-full border border-slate-200 dark:border-slate-700/80 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Activity', count: transactions.length },
            { id: 'BORROWER', label: 'As Borrower (Renting)', count: transactions.filter(t => t.borrowerId === user.id).length },
            { id: 'LENDER', label: 'As Lender (Hosting)', count: transactions.filter(t => t.lenderId === user.id).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-forest-600 text-white shadow-md shadow-forest-600/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="space-y-5">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-56 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
              <Skeleton className="h-56 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center space-y-4 border border-slate-200 dark:border-slate-800 shadow-sm">
              <Repeat className="w-12 h-12 text-forest-600 dark:text-emerald-400 mx-auto animate-pulse" />
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">No transactions found for this filter</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Explore nearby listings on the radial map and request an item to initiate an escrow-backed transaction!
              </p>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-600 text-white text-xs font-extrabold shadow-md shadow-forest-600/30 hover:bg-forest-500"
              >
                <span>Explore Nearby Listings</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            filtered.map((tx) => (
              <TransactionCard
                key={tx.id}
                tx={tx}
                onOpenQrGen={(t) => setQrGenTx(t)}
                onOpenQrScan={(t) => setQrScanTx(t)}
                onRefresh={fetchTransactions}
              />
            ))
          )}
        </div>

        {/* QR Code Generator & Scanner Modals */}
        <QrGeneratorModal
          isOpen={!!qrGenTx}
          onClose={() => setQrGenTx(null)}
          tx={qrGenTx}
        />

        <QrScannerModal
          isOpen={!!qrScanTx}
          onClose={() => setQrScanTx(null)}
          tx={qrScanTx}
          onScanSuccess={fetchTransactions}
        />
      </div>
    </PageTransition>
  );
};
