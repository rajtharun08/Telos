import React, { useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, CheckCircle2, UserCheck } from 'lucide-react';

export const LoginPage = () => {
  const { login, demoUsers, switchUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('aliya.rahman@telos.app');
  const [password, setPassword] = useState('demo1234');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(email, password);
      addToast(`Welcome back, ${email}!`, 'success');
      setIsLoading(false);
      navigate('/explore');
    }, 600);
  };

  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-4 py-12 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Sign in to Telos</h1>
          <p className="text-xs text-slate-400">Hyperlocal P2P sharing economy with escrow protection</p>
        </div>

        {/* Login Form */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <Button variant="primary" size="lg" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          {/* Quick Persona Logins */}
          <div className="pt-3 border-t border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Quick 1-Click Demo Logins
            </span>
            <div className="space-y-1.5">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUser(u.id);
                    addToast(`Signed in as ${u.name}`, 'success');
                    navigate('/explore');
                  }}
                  className="w-full p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-white block">{u.name}</span>
                    <span className="text-[10px] text-slate-400">{u.neighborhood}</span>
                  </div>
                  {u.admin ? (
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">Admin</span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-medium">User</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
