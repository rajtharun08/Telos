import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, ShieldCheck, Zap } from 'lucide-react';

export const CalendarDatePicker = ({ pricePerDay = 15, depositAmount = 50, onDateChange }) => {
  const [startDate, setStartDate] = useState(24);
  const [endDate, setEndDate] = useState(27);

  const daysInMonth = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30
  ];

  const presets = [
    { label: '1 Day', days: 1 },
    { label: 'Weekend (2 Days)', days: 2 },
    { label: '3 Days', days: 3 },
    { label: '1 Week (7 Days)', days: 7 },
  ];

  const handleSelectPreset = (days) => {
    const start = 24;
    const end = start + days;
    setStartDate(start);
    setEndDate(end);
    if (onDateChange) onDateChange(start, end);
  };

  const handleDateClick = (day) => {
    if (day < 20) return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else if (day > startDate) {
      setEndDate(day);
      if (onDateChange) onDateChange(startDate, day);
    } else {
      setStartDate(day);
      setEndDate(null);
    }
  };

  const durationDays = startDate && endDate ? endDate - startDate : 1;
  const rentalFee = durationDays * pricePerDay;
  const totalEscrowHold = rentalFee + depositAmount;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
          SELECT RENTAL DATES & ESCROW
        </h4>
        <span className="text-xs font-bold text-forest-600 dark:text-emerald-400 font-mono">₹{pricePerDay}/day</span>
      </div>

      {/* 1-Touch Quick Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {presets.map((p) => {
          const isSelected = durationDays === p.days;
          return (
            <button
              key={p.days}
              type="button"
              onClick={() => handleSelectPreset(p.days)}
              className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-forest-600 text-white border-forest-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-sm font-bold text-slate-800 dark:text-white">June 2026</span>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
        {daysInMonth.map((day) => {
          const isSelectedStart = day === startDate;
          const isSelectedEnd = day === endDate;
          const isInRange = startDate && endDate && day > startDate && day < endDate;
          const isDisabled = day < 20;

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              className={`h-9 w-full rounded-xl flex items-center justify-center transition-all ${
                isSelectedStart || isSelectedEnd
                  ? 'bg-slate-900 dark:bg-forest-600 text-white font-bold shadow'
                  : isInRange
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-forest-700 dark:text-emerald-300 font-bold'
                  : isDisabled
                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Summary Box & Escrow Breakdown */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
        <div className="flex items-center justify-between text-xs border-b border-slate-200 dark:border-slate-700 pb-2">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">PICK-UP</span>
            <span className="font-bold text-slate-800 dark:text-white">Jun {startDate || 24}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">RETURN</span>
            <span className="font-bold text-slate-800 dark:text-white">Jun {endDate || 27}</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-forest-600 text-white font-extrabold text-xs shadow-sm">
            {durationDays} {durationDays === 1 ? 'day' : 'days'}
          </span>
        </div>

        {/* Pricing Rows */}
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex justify-between">
            <span>Rental Fee ({durationDays} days @ ₹{pricePerDay}/day)</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">₹{rentalFee}</span>
          </div>
          <div className="flex justify-between">
            <span>Security Deposit (100% Refundable)</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">₹{depositAmount}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-white">
          <span>Total Escrow Hold:</span>
          <span className="text-forest-600 dark:text-emerald-400 font-mono text-base">₹{totalEscrowHold}</span>
        </div>
      </div>

      {/* Security Protection Notice */}
      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
        <ShieldCheck className="w-4 h-4 text-forest-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-snug text-[11px]">
          Funds remain locked in <strong>atomic escrow</strong> and are only released to the owner upon physical QR code handoff. Security deposit is automatically refunded upon return.
        </p>
      </div>
    </div>
  );
};
