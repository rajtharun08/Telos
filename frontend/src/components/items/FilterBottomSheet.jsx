import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, MapPin, Tag, DollarSign, RotateCcw } from 'lucide-react';
import { DEMO_CATEGORIES } from '../../api/mockData';

export const FilterBottomSheet = ({
  isOpen,
  onClose,
  radiusKm,
  setRadiusKm,
  selectedCategory,
  setSelectedCategory,
  selectedMode,
  setSelectedMode,
  maxPrice,
  setMaxPrice,
  onReset
}) => {
  const distanceChips = [
    { val: 0.5, label: '500m' },
    { val: 1.0, label: '1km' },
    { val: 2.0, label: '2km' },
    { val: 5.0, label: '5km' },
    { val: 10.0, label: '10km' },
    { val: 25.0, label: '25km' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden text-slate-900 dark:text-white border-t sm:border border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-forest-600 dark:text-emerald-400" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Filter Listings</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onReset}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Controls Body */}
            <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* 1. Radius Distance */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
                  Radial Neighborhood Radius
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {distanceChips.map((chip) => (
                    <button
                      key={chip.val}
                      onClick={() => setRadiusKm(chip.val)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        radiusKm === chip.val
                          ? 'bg-forest-600 text-white shadow-md shadow-forest-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Listing Mode */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
                  Listing Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'ALL', label: 'All Items' },
                    { id: 'RENT', label: 'Rent ($)' },
                    { id: 'BORROW', label: 'Borrow (Free)' },
                    { id: 'BUY', label: 'Buy Outright' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMode(m.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        selectedMode === m.id
                          ? 'bg-slate-900 dark:bg-forest-600 text-white border-slate-900 dark:border-forest-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Max Daily Price Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
                    Max Daily Price
                  </span>
                  <span className="text-forest-600 dark:text-emerald-400 font-mono">₹{maxPrice}/day</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={2500}
                  step={50}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-forest-600 cursor-pointer"
                />
              </div>

              {/* 4. Category Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedCategory('ALL')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold text-left transition-all ${
                      selectedCategory === 'ALL'
                        ? 'bg-forest-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    All Categories
                  </button>
                  {DEMO_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold text-left transition-all truncate ${
                        selectedCategory === cat.id
                          ? 'bg-forest-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer Action Button */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-full bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-xs shadow-lg shadow-forest-600/30 transition-transform active:scale-98 cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
