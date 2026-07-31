import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../api/client';
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Smartphone,
  Building2,
  Wallet,
  Sparkles
} from 'lucide-react';

export const TopUpModal = ({ isOpen, onClose, onTopUpSuccess }) => {
  const { addToast } = useToast();
  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'applepay'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presetAmounts = [250, 500, 1000, 2500];

  const paymentMethods = [
    { id: 'upi', name: 'Instant UPI / GPay / PhonePe', desc: 'Direct bank clearance', icon: Zap },
    { id: 'card', name: 'Credit / Debit Card', desc: 'Visa, Mastercard **** 4819', icon: CreditCard },
    { id: 'applepay', name: 'Apple / Net Banking', desc: 'Express checkout', icon: Smartphone },
  ];

  const handleTopUp = async () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (!finalAmount || finalAmount <= 0) {
      addToast('Please enter a valid top-up amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/wallet/topups', {
        method: 'POST',
        body: JSON.stringify({
          amount: finalAmount,
          method: paymentMethod
        })
      });

      addToast(`🎉 Successfully topped up ₹${finalAmount.toFixed(2)} to your wallet!`, 'success');
      if (onTopUpSuccess) onTopUpSuccess(res);
      onClose();
    } catch (err) {
      addToast(err.message || 'Top-up failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVal = customAmount ? parseFloat(customAmount) || 0 : amount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-md">
      <div className="space-y-5 text-slate-900 dark:text-white -mt-2">
        
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-forest-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5" /> Telos Financial Engine
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Instant Wallet Top-Up
            </h2>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-forest-600 text-white flex items-center justify-center font-bold shadow-md shadow-forest-600/30">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Add funds to your Telos wallet to cover rental daily fees and security deposits safely in escrow.
        </p>

        {/* Preset Amount Grid */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Select Top-Up Amount
          </label>
          <div className="grid grid-cols-4 gap-2">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setAmount(amt);
                  setCustomAmount('');
                }}
                className={`py-3 rounded-2xl font-mono text-xs sm:text-sm font-black border transition-all cursor-pointer ${
                  amount === amt && !customAmount
                    ? 'bg-forest-600 text-white border-forest-600 shadow-md shadow-forest-600/30 scale-102'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Or Enter Custom Amount (₹)
          </label>
          <div className="relative">
            <span className="w-4 h-4 text-slate-400 font-extrabold font-mono absolute left-4 top-1/2 -translate-y-1/2">₹</span>
            <input
              type="number"
              min="1"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 font-mono text-sm font-extrabold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600"
            />
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Select Payment Method
          </label>
          <div className="space-y-2">
            {paymentMethods.map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-forest-600 dark:border-emerald-500 ring-2 ring-forest-500/20'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-forest-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">{m.name}</span>
                      <span className="text-[10px] text-slate-400 block">{m.desc}</span>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-forest-600 dark:text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Escrow Guarantee Note */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-forest-600 dark:text-emerald-400 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Instant Wallet Credit Guarantee</span>
          </div>
          <span className="font-mono font-black text-forest-600 dark:text-emerald-400 text-sm">+₹{selectedVal.toFixed(2)}</span>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            disabled={isSubmitting}
            onClick={handleTopUp}
            className="w-full py-4 rounded-full bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-base shadow-xl shadow-forest-600/30 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            <span>Confirm & Top-Up ₹{selectedVal.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
