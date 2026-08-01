import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Sparkles, Loader2 } from 'lucide-react';

export const LoadingOverlay = ({ isVisible, message = 'Authenticating Escrow Session...' }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 text-center"
        >
          {/* Centered Glowing Logo Pulsing Container */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-3xl bg-forest-500/30 blur-xl animate-pulse" />
            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-forest-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-forest-600/50 border border-emerald-400/30"
            >
              T
            </motion.div>
          </div>

          {/* Title & Status Bar */}
          <div className="space-y-3 max-w-xs mx-auto">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <h3 className="text-lg font-black text-white tracking-tight">TELOS P2P</h3>
            </div>
            
            <p className="text-xs font-semibold text-emerald-400 animate-pulse font-mono">
              {message}
            </p>

            {/* Animated Progress Bar */}
            <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden relative border border-slate-700">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="w-full h-full bg-gradient-to-r from-forest-600 via-emerald-400 to-teal-300 rounded-full"
              />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-500" />
              <span>100% End-to-End Escrow Protection</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
