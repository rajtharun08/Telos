import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocation as useGeoLocation } from '../../context/LocationContext';
import { LocationPickerModal } from '../map/LocationPickerModal';
import {
  MapPin,
  ChevronDown,
  Map,
  Plus,
  User,
  Repeat,
  Wallet,
  ShieldCheck,
  Sun,
  Moon,
  MessageSquare,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const Navbar = ({ onOpenFilterSheet, onOpenChat }) => {
  const { user, switchUser, demoUsers } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { userLocation } = useGeoLocation();
  const location = useLocation();
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const desktopNavLinks = [
    { path: '/explore', label: 'Explore Map', icon: Map },
    { path: '/transactions', label: 'Transactions', icon: Repeat },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
    { path: '/profile', label: 'My Profile', icon: User },
    ...(user?.admin ? [{ path: '/admin', label: 'Admin Queue', icon: ShieldCheck }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-8 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Top Header Row for Mobile & Desktop */}
        <div className="flex items-center justify-between w-full md:w-auto gap-1.5 sm:gap-4">
          
          {/* Brand Logo */}
          <Link to="/explore" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-forest-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-forest-600/30 font-black text-base sm:text-xl group-hover:scale-105 transition-transform">
              T
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                TELOS
              </span>
              <span className="text-[8px] sm:text-[10px] font-extrabold text-forest-600 dark:text-emerald-400 uppercase tracking-wider -mt-1 hidden sm:block">
                P2P Sharing
              </span>
            </div>
          </Link>

          {/* Hyperlocal Neighborhood Location Selector Button */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-[10px] sm:text-xs font-extrabold border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink"
            title="Click to adjust your neighborhood pickup location"
          >
            <MapPin className="w-3 h-3 text-forest-600 shrink-0" />
            <span className="truncate max-w-[85px] sm:max-w-[180px]">{(user?.neighborhood || 'HSR LAYOUT').toUpperCase()}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* Mobile Right Controls: Support, Chat & Theme Switcher */}
          <div className="flex md:hidden items-center gap-1 shrink-0">
            <Link
              to="/support"
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Customer Support & FAQ"
            >
              <HelpCircle className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400" />
            </Link>

            <button
              onClick={onOpenChat}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer relative"
              title="Open Direct Messages"
            >
              <MessageSquare className="w-3.5 h-3.5 text-forest-600" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-forest-500 ring-2 ring-white dark:ring-slate-950 animate-ping" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          </div>
        </div>

        {/* Center Desktop Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-full border border-slate-200 dark:border-slate-800">
          {desktopNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-forest-600 text-white shadow-md shadow-forest-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions Toolbar (Desktop Only) */}
        <div className="hidden md:flex items-center gap-3">
          
          {/* Customer Support & FAQ Trigger */}
          <Link
            to="/support"
            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Customer Support & FAQ Center"
          >
            <HelpCircle className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
          </Link>

          {/* Direct Messaging Chat Trigger */}
          <button
            onClick={onOpenChat}
            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer relative"
            title="Open Direct Messages & Handoff Chat"
          >
            <MessageSquare className="w-4 h-4 text-forest-600" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-forest-500 ring-2 ring-white dark:ring-slate-950 animate-ping" />
          </button>

          {/* Light / Dark Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-indigo-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Primary Create Listing CTA */}
          <Link
            to="/create-item"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-600 hover:bg-forest-500 text-white text-xs font-extrabold shadow-lg shadow-forest-600/30 transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>List Item</span>
          </Link>

          {/* User Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-forest-600 text-white flex items-center justify-center font-black text-sm shadow">
                {user.name.charAt(0)}
              </div>
              <div className="text-left leading-none hidden lg:block">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{user.name.split(' ')[0]}</span>
                <span className="text-[10px] text-forest-600 dark:text-emerald-400 font-semibold block">Verified</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Persona Switcher Dropdown Panel */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{user.email}</p>
                  </div>
                  {user.admin && (
                    <span className="text-[9px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                      Admin
                    </span>
                  )}
                </div>

                <Link
                  to="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full px-3 py-2.5 rounded-xl bg-forest-50 dark:bg-forest-950/50 text-forest-700 dark:text-forest-300 text-xs font-extrabold flex items-center justify-between hover:bg-forest-100 dark:hover:bg-forest-950 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-forest-600" />
                    <span>View Full Profile</span>
                  </div>
                  <span>→</span>
                </Link>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold text-slate-400 px-2 uppercase tracking-wider block">
                    Switch Persona Demo
                  </span>
                  {demoUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        u.id === user.id
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center font-bold text-[10px]">
                          {u.name.charAt(0)}
                        </div>
                        <span>{u.name}</span>
                      </div>
                      {u.id === user.id && <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Neighborhood Location Adjuster Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        initialLocation={userLocation}
        onConfirm={(loc) => {
          setIsLocationModalOpen(false);
        }}
      />
    </header>
  );
};
