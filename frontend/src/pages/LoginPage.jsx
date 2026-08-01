import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '../components/layout/PageTransition';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Mail,
  Lock,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Eye,
  EyeOff,
  Zap,
  MapPin,
  Star,
  Loader2,
  LockKeyhole
} from 'lucide-react';

export const LoginPage = () => {
  const { login, demoUsers, switchUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('demo'); // 'demo' | 'email'
  const [email, setEmail] = useState('aliya.rahman@telos.app');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      login(email, password);
      addToast(`Welcome back, ${email}!`, 'success');
      setIsLoading(false);
      navigate('/explore');
    }, 700);
  };

  const handleQuickDemoLogin = (userObj) => {
    setIsLoading(true);
    setLoadingUser(userObj.id);

    setTimeout(() => {
      switchUser(userObj.id);
      addToast(`🎉 Signed in as ${userObj.name}`, 'success');
      setIsLoading(false);
      navigate('/explore');
    }, 700);
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12 pb-28 md:pb-12">
        
        {/* Split Grid Layout Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[36px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          
          {/* Left Column: Brand Showcase & Interactive Stats (Desktop Only) */}
          <div className="lg:col-span-5 hidden lg:flex flex-col justify-between p-10 min-h-[580px] bg-gradient-to-br from-forest-950 via-slate-950 to-emerald-950 text-white relative overflow-hidden">
            
            {/* Background Ambient Glow Orbs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-forest-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top Brand Pill */}
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wider uppercase">
                <Zap className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>Hyperlocal P2P Engine</span>
              </div>

              <h2 className="text-3xl font-black tracking-tight leading-tight font-sans">
                Borrow & Share Tools Safely with Your Neighbors
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Experience 100% escrow-protected sharing. Lock security deposits automatically and return items with instant QR code verification.
              </p>
            </div>

            {/* Middle Live Metrics Showcase Cards */}
            <div className="relative z-10 space-y-3 py-6">
              <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Total Protected Escrow</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">₹1,24,500</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-forest-600/30 border border-forest-500/40 flex items-center justify-center text-emerald-400 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Safe Returns</span>
                  <span className="text-base font-black text-white font-mono">99.8%</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Active Radius</span>
                  <span className="text-base font-black text-white font-mono">500m - 25km</span>
                </div>
              </div>
            </div>

            {/* Bottom Testimonial Pill */}
            <div className="relative z-10 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-sm">
                A
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-extrabold text-white">"Instant QR handoffs and Rupee escrow make sharing tools totally worry-free!"</p>
                <span className="text-[10px] text-slate-400 font-semibold block">— Aliya R., HSR Layout Sector 1</span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Login & Demo Console */}
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-6">
            
            {/* Header */}
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-forest-600 dark:text-emerald-400 text-xs font-extrabold border border-emerald-200 dark:border-emerald-800">
                <LockKeyhole className="w-3.5 h-3.5" /> Secure Authentication
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome to Telos
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Choose a pre-configured demo neighbor persona or enter your credentials.
              </p>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('demo')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'demo'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
                <span>1-Click Demo Personas</span>
              </button>

              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'email'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
                <span>Email & Password</span>
              </button>
            </div>

            {/* Tab 1: Quick 1-Click Demo Personas */}
            {activeTab === 'demo' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Select Verified Neighbor Account
                </span>

                <div className="space-y-3">
                  {demoUsers.map((u) => {
                    const isUserLoading = isLoading && loadingUser === u.id;
                    return (
                      <button
                        key={u.id}
                        disabled={isLoading}
                        onClick={() => handleQuickDemoLogin(u)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
                          isUserLoading
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-forest-600 ring-2 ring-forest-500/30'
                            : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 border-slate-200 dark:border-slate-700 hover:border-forest-500'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="relative">
                            <div className="w-11 h-11 rounded-full bg-slate-900 dark:bg-forest-600 text-white flex items-center justify-center font-black text-sm shadow">
                              {u.name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-forest-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-forest-600 dark:group-hover:text-emerald-400 transition-colors">
                                {u.name}
                              </span>
                              {u.admin && (
                                <span className="text-[9px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-forest-600 dark:text-emerald-400" />
                                {u.neighborhood}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-amber-500 font-bold">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {u.rating || 4.9}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Action Arrow / Loading Spinner */}
                        <div className="shrink-0 pl-2">
                          {isUserLoading ? (
                            <Loader2 className="w-5 h-5 text-forest-600 dark:text-emerald-400 animate-spin" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-forest-600 dark:group-hover:text-emerald-400 group-hover:border-forest-500 transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Tab 2: Standard Email & Password Form */}
            {activeTab === 'email' && (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
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
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-xs shadow-lg shadow-forest-600/30 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Escrow Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* Footer Trust Shield */}
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
              <span>100% Escrow Protected • Instant QR Verification</span>
            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  );
};
