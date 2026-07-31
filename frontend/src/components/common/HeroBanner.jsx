import React from 'react';
import { Sparkles, ShieldCheck, MapPin, Repeat, ArrowRight, Zap, CheckCircle2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeroBanner = ({ onExploreClick }) => {
  return (
    <div className="relative bg-gradient-to-r from-slate-900 via-slate-900 to-forest-950 text-white rounded-3xl p-4 sm:p-10 border border-slate-800 shadow-2xl overflow-hidden">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-forest-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        
        {/* Left Content Column */}
        <div className="lg:col-span-7 space-y-3 sm:space-y-5">
          
          {/* Live Status Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-forest-600/20 text-emerald-400 border border-forest-500/30 text-[10px] sm:text-xs font-extrabold shadow-sm">
            <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Hyperlocal Peer-to-Peer Sharing Engine</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Borrow, Rent & Share with <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">Verified Neighbors</span>
          </h1>

          {/* Hero Description */}
          <p className="hidden sm:block text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-xl">
            Access high-end power tools, camera equipment, camping gear, and lawn care items within your customizable radial neighborhood zone. Protected by atomic escrow locking and QR code handoff verification.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] sm:text-xs font-bold text-slate-300">
            <div className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Escrow</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-forest-400" />
              <span>Radial Discovery</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <Repeat className="w-4 h-4 text-indigo-400" />
              <span>State Machine Guaranteed</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 pt-1">
            <Link
              to="/create-item"
              className="px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-full bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-xs shadow-lg shadow-forest-600/30 transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <span>List Item</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={onExploreClick}
              className="px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white font-bold text-xs border border-white/20 transition-colors cursor-pointer"
            >
              Explore Map
            </button>
          </div>
        </div>

        {/* Right Feature Showcase Graphic Column (Desktop Only) */}
        <div className="lg:col-span-5 hidden lg:block">
          <div className="bg-slate-950/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4 relative overflow-hidden group hover:border-forest-600/50 transition-colors">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-extrabold text-white">Hyperlocal Radar Live</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                ACTIVE ZONE
              </span>
            </div>

            {/* Simulated Live Neighborhood Feed Item */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-white">DeWalt Cordless Saw</span>
                <span className="font-mono text-emerald-400 font-bold">₹250/day</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-forest-400" /> 0.4 km away
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Lock className="w-3 h-3" /> Escrow Locked
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 text-center pt-1">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/60">
                <span className="text-xl font-black text-emerald-400 font-mono block">100%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Verified Owners</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/60">
                <span className="text-xl font-black text-emerald-400 font-mono block">500m+</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Neighborhood Pin</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
