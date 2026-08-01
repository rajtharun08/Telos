import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '../components/layout/PageTransition';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
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
  LockKeyhole,
  ArrowLeft
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
      <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden selection:bg-emerald-500 selection:text-white">
        
        {/* Background Ambient Glowing Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-forest-600/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />

        {/* 1. Immersive Top Auth Header Bar */}
        <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/explore" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-forest-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-forest-600/40 font-black text-xl group-hover:scale-105 transition-transform">
              T
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight font-sans">
                TELOS
              </span>
              <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest -mt-1">
                P2P Sharing Economy
              </span>
            </div>
          </Link>

          <Link
            to="/explore"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-extrabold text-white border border-white/15 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Explore Map</span>
          </Link>
        </header>

        {/* 2. Main Centered Auth Container */}
        <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/80 backdrop-blur-2xl rounded-3xl sm:rounded-[36px] border border-slate-800 shadow-2xl overflow-hidden">
            
            {/* Left Column: Platform Values & Live Metrics (Desktop Only) */}
            <div className="lg:col-span-5 hidden lg:flex flex-col justify-between p-10 min-h-[520px] bg-gradient-to-br from-forest-950/80 via-slate-950 to-emerald-950/80 text-white relative border-r border-slate-800/80">
              
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 animate-pulse" />
                  <span>Verified Neighborhoods</span>
                </div>

                <h2 className="text-2xl font-black tracking-tight leading-snug">
                  Borrow & Rent Tools Safely with Your Neighbors
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Lock security deposits atomically in Rupee (₹) escrow and return items with instant time-bound QR code scanning.
                </p>
              </div>

              {/* Metrics Showcase */}
              <div className="space-y-3 py-4">
                <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Total Protected Escrow</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">₹1,24,500</span>
                  </div>
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Safe Returns</span>
                    <span className="text-base font-black text-white font-mono">99.8%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Active Radius</span>
                    <span className="text-base font-black text-white font-mono">500m - 25km</span>
                  </div>
                </div>
              </div>

              {/* Security Banner */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Encrypted JWT & Spatial PostGIS Protection</span>
              </div>
            </div>

            {/* Right Column: Auth Console */}
            <div className="lg:col-span-7 p-6 sm:p-10 space-y-6">
              
              {/* Header */}
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black border border-emerald-500/30">
                  <LockKeyhole className="w-3.5 h-3.5" /> Secure Neighborhood Auth
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Welcome to Telos
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  Select a pre-verified neighbor persona or enter credentials.
                </p>
              </div>

              {/* Mode Tabs */}
              <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
                <button
                  onClick={() => setActiveTab('demo')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'demo'
                      ? 'bg-forest-600 text-white shadow-lg shadow-forest-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>1-Click Personas</span>
                </button>

                <button
                  onClick={() => setActiveTab('email')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'email'
                      ? 'bg-forest-600 text-white shadow-lg shadow-forest-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Email & Password</span>
                </button>
              </div>

              {/* Tab 1: 1-Click Demo Personas */}
              {activeTab === 'demo' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Choose Pre-Verified Neighbor Account
                  </span>

                  <div className="space-y-2.5">
                    {demoUsers.map((u) => {
                      const isUserLoading = isLoading && loadingUser === u.id;
                      return (
                        <button
                          key={u.id}
                          disabled={isLoading}
                          onClick={() => handleQuickDemoLogin(u)}
                          className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
                            isUserLoading
                              ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                              : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-emerald-500/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <div className="w-10 h-10 rounded-full bg-forest-600 text-white flex items-center justify-center font-black text-sm shadow">
                                {u.name.charAt(0)}
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-forest-500 border border-slate-950 flex items-center justify-center text-white">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              </div>
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs sm:text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
                                  {u.name}
                                </span>
                                {u.admin && (
                                  <span className="text-[9px] bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                                    Admin
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium truncate">
                                <span className="flex items-center gap-1 truncate max-w-[130px] sm:max-w-[180px]">
                                  <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="truncate">{u.neighborhood}</span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-amber-400 font-bold shrink-0">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  {u.rating || 4.9}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 pl-2">
                            {isUserLoading ? (
                              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500 transition-colors">
                                <ArrowRight className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Tab 2: Email & Password Form */}
              {activeTab === 'email' && (
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 text-xs font-semibold text-white border border-slate-800 focus:outline-none focus:border-forest-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950 text-xs font-semibold text-white border border-slate-800 focus:outline-none focus:border-forest-500 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
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
                        <span>Authenticating Session...</span>
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

            </div>
          </div>
        </main>

        {/* 3. Bottom Auth Footer */}
        <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-500 font-medium">
          Telos P2P Sharing Platform • 100% Escrow Protection & PostGIS Spatial Discovery
        </footer>

      </div>
    </PageTransition>
  );
};
