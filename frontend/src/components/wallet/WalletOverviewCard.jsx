import React from 'react';
import { Wallet, Lock, TrendingUp, PlusCircle } from 'lucide-react';

export const WalletOverviewCard = ({ wallet, onOpenTopUp }) => {
  const available = wallet.available || 0;
  const locked = wallet.locked || 0;
  const earned = wallet.earned || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      
      {/* Card 1: Available Balance */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available Balance</span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-forest-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight mb-4">
          ₹{available.toFixed(2)}
        </div>
        <button
          onClick={onOpenTopUp}
          className="w-full py-2.5 rounded-full bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-xs shadow-md shadow-forest-600/30 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Top-Up Balance</span>
        </button>
      </div>

      {/* Card 2: Escrow Locked */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Escrow Locked</span>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight mb-1">
          ₹{locked.toFixed(2)}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Funds held safely until return handoff</p>
      </div>

      {/* Card 3: Lifetime Earned */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lifetime Earned</span>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight mb-1">
          ₹{earned.toFixed(2)}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Total payouts from item listings</p>
      </div>
    </div>
  );
};
