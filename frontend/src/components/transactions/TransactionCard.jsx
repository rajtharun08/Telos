import React, { useState } from 'react';
import { StateMachineStepper } from './StateMachineStepper';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../api/client';
import { INITIAL_ITEMS } from '../../api/mockData';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Scan,
  ShieldCheck,
  Clock,
  RotateCcw,
  User,
  MessageSquare,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const TransactionCard = ({ tx, onOpenQrGen, onOpenQrScan, onRefresh }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const isBorrower = tx.borrowerId === user.id;
  const isLender = tx.lenderId === user.id;
  const roleLabel = isBorrower ? 'Borrower (Renting)' : isLender ? 'Lender (Owner)' : 'Participant';

  // Find matching item thumbnail from mock data
  const itemMatch = INITIAL_ITEMS.find((i) => i.id === tx.itemId || i.title === tx.itemTitle);
  const itemImage = itemMatch?.image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';
  const itemCategory = itemMatch?.category || 'TOOLS';

  const handleStateTransition = async (nextState) => {
    setIsUpdating(true);
    try {
      await apiFetch(`/api/transactions/${tx.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ state: nextState })
      });
      addToast(`🎉 Transaction status updated to ${nextState}!`, 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      addToast(err.message || 'Failed to update transaction state', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all space-y-6">
      
      {/* Top Bar: Item Image, Title, Mode, Role & Escrow Financial Tag */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-100 dark:border-slate-800 pb-5">
        
        {/* Left: Thumbnail & Item Metadata */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
            <img
              src={itemImage}
              alt={tx.itemTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1.5 left-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-sm ${
                tx.mode === 'RENT' ? 'bg-forest-600' : 'bg-sky-500'
              }`}>
                {tx.mode}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-extrabold border border-slate-200 dark:border-slate-700">
                {roleLabel}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">ID: {tx.id}</span>
            </div>

            <Link
              to={`/items/${tx.itemId}`}
              className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white hover:text-forest-600 dark:hover:text-emerald-400 transition-colors line-clamp-1 block"
            >
              {tx.itemTitle}
            </Link>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Duration: <strong>{tx.days || 2} days</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400" />
                Due: {new Date(tx.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Escrow Financial Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-right shrink-0 min-w-[200px] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
            <span>Escrow Protection</span>
            <Lock className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400" />
          </div>

          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            ₹{(tx.fee + tx.deposit).toFixed(2)}
          </div>

          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-end gap-1">
            <span>Fee: ₹{tx.fee}</span>
            <span>+</span>
            <span className="text-forest-600 dark:text-emerald-400 font-bold">Deposit: ₹{tx.deposit}</span>
          </div>
        </div>
      </div>

      {/* State Machine Timeline Stepper */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        <StateMachineStepper currentState={tx.state} />
      </div>

      {/* Counterparty Info & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        
        {/* Counterparty Persona */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-forest-600 text-white flex items-center justify-center font-bold text-sm shadow">
            {(isBorrower ? tx.lenderName : tx.borrowerName).charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                {isBorrower ? tx.lenderName : tx.borrowerName}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] text-slate-400 block -mt-0.5">
              {isBorrower ? 'Verified Lender & Item Owner' : 'Verified Borrower'}
            </span>
          </div>
        </div>

        {/* Action Buttons based on State and Role */}
        <div className="flex flex-wrap items-center gap-2 justify-end">
          
          {/* State: REQUESTED */}
          {tx.state === 'REQUESTED' && (
            <>
              {isLender ? (
                <>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStateTransition('DECLINED')}
                    className="px-4 py-2.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStateTransition('APPROVED')}
                    className="px-5 py-2.5 rounded-full text-xs font-extrabold bg-forest-600 hover:bg-forest-500 text-white shadow-lg shadow-forest-600/30 transition-transform active:scale-95 cursor-pointer"
                  >
                    Approve Request
                  </button>
                </>
              ) : (
                <button
                  disabled={isUpdating}
                  onClick={() => handleStateTransition('CANCELLED')}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancel Request
                </button>
              )}
            </>
          )}

          {/* State: APPROVED */}
          {tx.state === 'APPROVED' && (
            <>
              {isLender && (
                <button
                  onClick={() => onOpenQrGen(tx)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 dark:bg-forest-600 text-white text-xs font-extrabold shadow-lg hover:bg-slate-800 transition-transform active:scale-95 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-emerald-400 dark:text-white" />
                  <span>Show Handoff QR Code</span>
                </button>
              )}
              {isBorrower && (
                <button
                  onClick={() => onOpenQrScan(tx)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-600 hover:bg-forest-500 text-white text-xs font-extrabold shadow-lg shadow-forest-600/30 transition-transform active:scale-95 cursor-pointer"
                >
                  <Scan className="w-4 h-4" />
                  <span>Scan Handoff QR Code</span>
                </button>
              )}
            </>
          )}

          {/* State: ACTIVE */}
          {tx.state === 'ACTIVE' && (
            <button
              disabled={isUpdating}
              onClick={() => handleStateTransition('RETURNED')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-600 hover:bg-forest-500 text-white text-xs font-extrabold shadow-lg shadow-forest-600/30 transition-transform active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Complete Return & Refund Escrow</span>
            </button>
          )}

          {/* State: RETURNED */}
          {tx.state === 'RETURNED' && (
            <span className="px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-forest-600 dark:text-emerald-400 text-xs font-extrabold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Escrow Cleared & Settled
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
