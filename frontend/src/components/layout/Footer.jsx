import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Database, HelpCircle } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-16 py-8 px-6 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">TELOS</span>
            <span className="text-xs text-forest-600 dark:text-emerald-400 font-extrabold">— Hyperlocal P2P Sharing</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Powered by Spring Boot 3.3, PostGIS radial spatial discovery, coordinate privacy masks, and atomic escrow state machines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <Link
            to="/support"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400" />
            <span>Support & FAQ</span>
          </Link>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400" />
            <span>Escrow Protected</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium">
            <MapPin className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400" />
            <span>PostGIS Radial Map</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
