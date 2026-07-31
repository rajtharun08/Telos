import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Plus, MessageSquare, User, Map, Repeat, Wallet } from 'lucide-react';

export const MobileBottomNav = ({ onOpenFilterSheet }) => {
  const location = useLocation();

  const navItems = [
    { path: '/explore', label: 'Explore', icon: Map },
    { path: '/transactions', label: 'Activity', icon: Repeat },
    // Center Floating CTA Button
    { isCenter: true, label: 'List Item', icon: Plus },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 shadow-2xl transition-colors pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around relative">
        {navItems.map((item, idx) => {
          if (item.isCenter) {
            return (
              <div key="list-btn" className="relative -top-5">
                <Link
                  to="/create-item"
                  className="w-14 h-14 rounded-full bg-forest-600 hover:bg-forest-500 text-white flex items-center justify-center shadow-xl shadow-forest-600/40 border-4 border-slate-100 dark:border-slate-950 transition-transform active:scale-95 cursor-pointer"
                  title="List Item for Sharing"
                >
                  <Plus className="w-7 h-7 stroke-[3]" />
                </Link>
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 text-[10px] font-extrabold transition-colors cursor-pointer ${
                isActive
                  ? 'text-forest-600 dark:text-emerald-400 font-extrabold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
