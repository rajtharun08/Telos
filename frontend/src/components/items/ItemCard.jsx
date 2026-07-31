import React, { useState } from 'react';
import { Star, MapPin, CheckCircle2, Heart, ChevronRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ItemCard = ({ item, isSelected, onSelect, onOpenDetail }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const { addToast } = useToast();

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    addToast(isFavorite ? `Removed "${item.title}" from saved items` : `❤️ Saved "${item.title}" to favorites!`, 'info');
  };

  return (
    <div
      onClick={() => onOpenDetail(item)}
      className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-forest-600 dark:hover:border-emerald-500 transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
        isSelected ? 'ring-2 ring-forest-600 border-forest-600 shadow-md' : ''
      }`}
    >
      {/* Image Container with Floating Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Mode Tag */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md ${
            item.mode === 'RENT'
              ? 'bg-forest-600 text-white'
              : item.mode === 'BORROW'
              ? 'bg-sky-500 text-white'
              : 'bg-amber-500 text-white'
          }`}>
            {item.mode}
          </span>
        </div>

        {/* Favorite Bookmark Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-rose-500 transition-colors shadow-md"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Price Badge Pill */}
        <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl text-white text-xs font-black font-mono border border-slate-700 shadow-md">
          {item.mode === 'BORROW' ? 'FREE' : `₹${item.price}/day`}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            <span>{item.category}</span>
            <div className="flex items-center gap-1 text-amber-500 font-extrabold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{item.rating || 4.9}</span>
              <span className="text-slate-400 font-normal">({item.reviews || 18})</span>
            </div>
          </div>

          <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-forest-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
            {item.title}
          </h3>
        </div>

        {/* Distance & Radial Privacy Note */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <MapPin className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400 shrink-0" />
          <span>{item.distanceKm || '0.4'} km away</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-slate-400 text-[11px]">Approximate zone</span>
        </div>

        {/* Owner Info Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-forest-600 text-white flex items-center justify-center font-bold text-xs">
              {(item.ownerName || 'JonSnow').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {item.ownerName || 'JonSnow'}
                </span>
                <CheckCircle2 className="w-3 h-3 text-forest-600 dark:text-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Verified Owner</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(item);
            }}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-forest-600 hover:text-white text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
