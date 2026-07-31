import React, { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { HeroBanner } from '../components/common/HeroBanner';
import { ItemFilterBar } from '../components/items/ItemFilterBar';
import { ItemCard } from '../components/items/ItemCard';
import { DiscoveryMap } from '../components/map/DiscoveryMap';
import { FilterBottomSheet } from '../components/items/FilterBottomSheet';
import { ItemDetailModal } from '../components/items/ItemDetailModal';
import { ChatDrawer } from '../components/chat/ChatDrawer';
import { Skeleton } from '../components/common/Skeleton';
import { useLocation } from '../context/LocationContext';
import { apiFetch } from '../api/client';
import { SlidersHorizontal, Map, List, Compass, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export const ExplorePage = () => {
  const { userLocation, radiusKm, setRadiusKm } = useLocation();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState(2500);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'grid' | 'map'

  // Modals & Selection
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [detailModalItem, setDetailModalItem] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    let url = `/api/items?radius=${radiusKm}`;
    if (selectedCategory !== 'ALL') url += `&category=${selectedCategory}`;
    if (selectedMode !== 'ALL') url += `&mode=${selectedMode}`;

    apiFetch(url)
      .then((data) => {
        let res = data;

        // Price Filter
        if (maxPrice < 2500) {
          res = res.filter((i) => (i.price || 0) <= maxPrice);
        }

        // Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          res = res.filter(
            (i) => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
          );
        }
        setItems(res);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [radiusKm, selectedCategory, selectedMode, maxPrice, searchQuery]);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6 pb-24 md:pb-8">
        
        {/* Top Hero Banner Header */}
        <HeroBanner onExploreClick={() => setViewMode('split')} />

        {/* Live Neighborhood Ticker Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 font-bold shadow-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <Zap className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400 animate-pulse" />
            <span className="truncate max-w-[120px] sm:max-w-none">Neighborhood Live</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            <span className="flex items-center gap-1 font-bold text-forest-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" /> {items.length} Listings ({radiusKm}km)
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400" /> 100% Escrow
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <ItemFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
          radiusKm={radiusKm}
          setRadiusKm={setRadiusKm}
          onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
        />

        {/* Mobile View Toggle Bar */}
        <div className="flex items-center justify-between lg:hidden bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'split' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'map' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Map
            </button>
          </div>

          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-600 text-white text-xs font-bold shadow-md shadow-forest-600/30"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Primary Split View Content */}
        <div className="min-h-[650px] flex flex-col lg:flex-row gap-6">
          
          {/* Grid List */}
          {(viewMode === 'split' || viewMode === 'grid') && (
            <div className={`${viewMode === 'split' ? 'w-full lg:w-1/2 xl:w-7/12' : 'w-full'} space-y-4`}>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <Skeleton key={n} className="h-72 bg-slate-200 dark:bg-slate-800" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center space-y-3 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Compass className="w-10 h-10 text-forest-600 mx-auto animate-bounce" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No items found within {radiusKm} km</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try expanding your radial distance slider or changing your search filters to view more listings.
                  </p>
                </div>
              ) : (
                <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
                  {items.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      isSelected={item.id === selectedItemId}
                      onSelect={() => setSelectedItemId(item.id)}
                      onOpenDetail={(i) => setDetailModalItem(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discovery Map */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div className={`${viewMode === 'split' ? 'w-full lg:w-1/2 xl:w-5/12 h-[480px] lg:h-auto lg:sticky lg:top-20' : 'w-full h-[650px]'}`}>
              <DiscoveryMap
                items={items}
                center={userLocation}
                radiusKm={radiusKm}
                selectedItemId={selectedItemId}
                onSelectItem={(id) => setSelectedItemId(id)}
                onOpenDetail={(i) => setDetailModalItem(i)}
              />
            </div>
          )}
        </div>

        {/* Filter Bottom Sheet */}
        <FilterBottomSheet
          isOpen={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
          radiusKm={radiusKm}
          setRadiusKm={setRadiusKm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          onReset={() => {
            setRadiusKm(5);
            setSelectedCategory('ALL');
            setSelectedMode('ALL');
            setMaxPrice(2500);
          }}
        />

        {/* Item Detail Modal */}
        <ItemDetailModal
          isOpen={!!detailModalItem}
          onClose={() => setDetailModalItem(null)}
          item={detailModalItem}
        />

        {/* Chat Drawer */}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          recipientName={detailModalItem?.ownerName || 'Vikram Malhotra'}
          itemTitle={detailModalItem?.title || 'Bosch Cordless Drill'}
        />
      </div>
    </PageTransition>
  );
};
