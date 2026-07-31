import React from 'react';
import {
  FileText,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const StateMachineStepper = ({ currentState }) => {
  const steps = [
    { key: 'REQUESTED', label: '1. Request Sent', icon: FileText },
    { key: 'APPROVED', label: '2. Lender Approved', icon: CheckCircle2 },
    { key: 'ACTIVE', label: '3. QR Handoff (Active)', icon: QrCode },
    { key: 'RETURNED', label: '4. Returned & Settled', icon: ShieldCheck },
  ];

  const terminalStates = ['DECLINED', 'CANCELLED', 'OVERDUE'];
  const isTerminal = terminalStates.includes(currentState);

  const getCurrentStepIndex = () => {
    switch (currentState) {
      case 'REQUESTED': return 0;
      case 'APPROVED': return 1;
      case 'ACTIVE': return 2;
      case 'RETURNED': return 3;
      default: return 0;
    }
  };

  const currentIndex = getCurrentStepIndex();

  if (isTerminal) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
        <div className="flex items-center gap-2 font-extrabold">
          <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>Status: {currentState}</span>
        </div>
        <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-300">
          Escrow deposit unlocked & returned to borrower.
        </span>
      </div>
    );
  }

  return (
    <div className="w-full py-2 space-y-2">
      <div className="flex items-center justify-between relative px-2 sm:px-6">
        
        {/* Background Track Line */}
        <div className="absolute top-5 left-8 right-8 h-1.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 rounded-full z-0" />
        
        {/* Active Progress Bar */}
        <div
          className="absolute top-5 left-8 h-1.5 bg-gradient-to-r from-forest-600 via-emerald-500 to-teal-400 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 82}%` }}
        />

        {/* Stepper Nodes */}
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-xs transition-all duration-300 ${
                  isDone
                    ? 'bg-forest-600 text-white shadow-md shadow-forest-600/30 scale-100'
                    : isCurrent
                    ? 'bg-gradient-to-tr from-forest-600 to-emerald-500 text-white ring-4 ring-forest-500/20 shadow-xl shadow-forest-600/40 scale-110 animate-pulse'
                    : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                <Icon className={`w-4 h-4 ${isDone || isCurrent ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
              </div>
              <span
                className={`text-[11px] font-extrabold mt-2 whitespace-nowrap tracking-tight ${
                  isCurrent
                    ? 'text-forest-600 dark:text-emerald-400 font-black'
                    : isDone
                    ? 'text-slate-900 dark:text-slate-200'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
