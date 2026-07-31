import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const base = "inline-flex items-center font-semibold rounded-full border backdrop-blur-sm transition-all";
  
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  };

  const variants = {
    default: "bg-slate-800/80 border-slate-700 text-slate-300",
    primary: "bg-indigo-950/80 border-indigo-500/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]",
    emerald: "bg-emerald-950/80 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
    amber: "bg-amber-950/80 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
    rose: "bg-rose-950/80 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]",
    purple: "bg-purple-950/80 border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]",
    rent: "bg-emerald-950/80 border-emerald-500/50 text-emerald-300",
    borrow: "bg-sky-950/80 border-sky-500/50 text-sky-300",
    buy: "bg-amber-950/80 border-amber-500/50 text-amber-300",
  };

  return (
    <span className={`${base} ${sizes[size]} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};
