import React from 'react';
import { Search, X, SlidersHorizontal, MapPin, Wrench, Camera, Tent, Dumbbell, Trees, Music, Sparkles } from 'lucide-react';

export const ItemFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedMode,
  setSelectedMode,
  radiusKm,
  setRadiusKm,
  onOpenFilterSheet
}) => {
  const categories = [
    { id: 'ALL', name: 'All Categories', icon: Sparkles },
    { id: 'tools', name: 'Tools & Hardware', icon: Wrench },
    { id: 'electronics', name: 'Electronics & Audio', icon: Camera },
    { id: 'outdoor', name: 'Camping & Outdoor', icon: Tent },
    { id: 'sports', name: 'Sports & Fitness', icon: Dumbbell },
    { id: 'lawn', name: 'Lawn & Garden', icon: Trees },
    { id: 'party', name: 'Events & Party', icon: Music },
  ];

  const modes = [
    { id: 'ALL', label: 'All Items' },
    { id: 'RENT', label: 'Rent ($)' },
    { id: 'BORROW', label: 'Borrow (Free)' },
    { id: 'BUY', label: 'Buy' },
  ];

  const distanceChips = [
    { val: 0.5, label: '500m' },
    { val: 1.0, label: '1km' },
    { val: 2.0, label: '2km' },
    { val: 5.0, label: '5km' },
    { val: 10.0, label: '10km' },
    { val: 25.0, label: '25km' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
      
      {/* Search Bar + Mode Tabs */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        
        {/* Search Box with Quick Clear */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools, cameras, camping gear nearby..."
            className="w-full pl-11 pr-10 py-3 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Listing Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 w-full md:w-auto shrink-0">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMode(m.id)}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                selectedMode === m.id
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Filters Button */}
        {onOpenFilterSheet && (
          <button
            onClick={onOpenFilterSheet}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-900 dark:bg-forest-600 text-white text-xs font-bold shadow hover:bg-slate-800 dark:hover:bg-forest-500 transition-colors shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        )}
      </div>

      {/* 1-Touch Radius Distance Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400" />
          Radius:
        </span>
        {distanceChips.map((chip) => (
          <button
            key={chip.val}
            onClick={() => setRadiusKm(chip.val)}
            className={`px-3 py-1 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              radiusKm === chip.val
                ? 'bg-forest-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Scrollable Icon Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 dark:border-slate-800 pt-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 dark:bg-forest-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-forest-400 dark:text-white' : 'text-slate-400'}`} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
