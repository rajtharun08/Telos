import React, { useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { Button } from '../components/common/Button';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, CheckCircle2, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage = () => {
  const { login, demoUsers, switchUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('aliya.rahman@telos.app');
  const [password, setPassword] = useState('demo1234');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Authenticating Escrow Session...');

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingMessage('Authenticating Escrow Session...');

    setTimeout(() => {
      login(email, password);
      addToast(`Welcome back, ${email}!`, 'success');
      setIsLoading(false);
      navigate('/explore');
    }, 900);
  };

  const handleQuickDemoLogin = (userObj) => {
    setIsLoading(true);
    setLoadingMessage(`Loading Persona for ${userObj.name}...`);

    setTimeout(() => {
      switchUser(userObj.id);
      addToast(`🎉 Signed in as ${userObj.name}`, 'success');
      setIsLoading(false);
      navigate('/explore');
    }, 900);
  };

  return (
    <PageTransition>
      {/* High-Tech Animated Loading Overlay */}
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />

      <div className="max-w-md mx-auto px-4 py-8 sm:py-12 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="relative w-14 h-14 mx-auto mb-2">
            <div className="absolute inset-0 rounded-2xl bg-forest-500/20 blur-md animate-pulse" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-forest-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-forest-600/30 border border-emerald-400/30">
              T
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Sign in to Telos</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-medium">
            Hyperlocal P2P sharing economy with automated escrow security.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-full bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-xs shadow-lg shadow-forest-600/30 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Sign In to Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Logins */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block text-center">
              Quick 1-Click Demo Logins
            </span>
            
            <div className="space-y-2">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickDemoLogin(u)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-forest-500/50 text-left flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-forest-600 text-white flex items-center justify-center font-black text-xs shadow">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white block group-hover:text-forest-600 dark:group-hover:text-emerald-400 transition-colors">
                        {u.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {u.neighborhood}
                      </span>
                    </div>
                  </div>
                  
                  {u.admin ? (
                    <span className="text-[9px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                      Admin
                    </span>
                  ) : (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/60 text-forest-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      Verified
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Badge Footer */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
          <ShieldCheck className="w-4 h-4 text-forest-600" />
          <span>Protected by Encrypted JWT & Spatial Escrow</span>
        </div>
      </div>
    </PageTransition>
  );
};
