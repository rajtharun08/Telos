import React from 'react';
import { ShieldCheck, MapPin, Database, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md mt-16 py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-white tracking-tight">TELOS</span>
            <span className="text-xs text-indigo-400 font-medium">— Hyperlocal P2P Sharing</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Powered by Spring Boot 3.3, PostGIS radial spatial discovery, coordinate privacy masks, and atomic escrow state machines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Escrow Protected</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span>ST_DWithin PostGIS</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>PostgreSQL 16</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
