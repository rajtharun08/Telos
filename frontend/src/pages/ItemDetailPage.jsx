import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/layout/PageTransition';
import { CalendarDatePicker } from '../components/common/CalendarDatePicker';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../api/client';
import {
  Star,
  MapPin,
  CheckCircle2,
  Heart,
  MessageSquare,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Share2,
  Sparkles
} from 'lucide-react';

export const ItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rentalDays, setRentalDays] = useState(3);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    apiFetch('/api/items')
      .then((data) => {
        const found = data.find((i) => String(i.id) === String(id));
        setItem(found || data[0]);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading || !item) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-forest-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">Loading item details...</p>
      </div>
    );
  }

  const pricePerDay = item.price || 250;
  const depositFee = item.deposit || 500;
  const totalPrice = (rentalDays * pricePerDay) + depositFee;

  const handleRequestRent = async () => {
    setIsSubmitting(true);
    try {
      await apiFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          itemId: item.id,
          days: rentalDays
        })
      });
      addToast(`🎉 Request sent for ${item.title}! ₹${totalPrice} locked safely in escrow.`, 'success');
      navigate('/transactions');
    } catch (err) {
      addToast(err.message || 'Failed to send request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-28 md:pb-12">
        
        {/* Top Header Bar for App & Web */}
        <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-forest-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Discovery</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  addToast('Link copied to clipboard!', 'info');
                }}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Share Listing"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsFavorite(!isFavorite);
                  addToast(isFavorite ? 'Removed from saved items' : 'Saved to favorites!', 'info');
                }}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                title="Save Item"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Showcase Container */}
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Image Gallery & Item Info (8 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Hero Image */}
              <div className="relative rounded-3xl overflow-hidden bg-slate-200 dark:bg-slate-800 shadow-lg aspect-4/3">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Mode Pill Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-forest-600 text-white shadow-md">
                    {item.mode}
                  </span>
                </div>
              </div>

              {/* Title & Category Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  <span>{item.category || 'TOOLS'}</span>
                  <div className="flex items-center gap-1 text-amber-500 font-extrabold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{item.rating || 4.9}</span>
                    <span className="text-slate-400 font-normal">({item.reviews || 24} reviews)</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {item.title}
                </h1>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
                  <MapPin className="w-4 h-4 text-forest-600 dark:text-emerald-400 shrink-0" />
                  <span>{item.distanceKm || '0.5'} km away</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>Approximate neighborhood zone</span>
                </div>
              </div>

              {/* Location Privacy Guarantee Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200 font-medium shadow-sm">
                <Lock className="w-5 h-5 text-forest-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block text-sm">Coordinate Privacy Guaranteed</span>
                  <span>Exact pickup address and map coordinates remain hidden until your rental request is approved by the owner.</span>
                </div>
              </div>

              {/* Verified Owner Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-forest-600 text-white flex items-center justify-center font-extrabold text-lg shadow">
                    {(item.ownerName || 'JonSnow').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{item.ownerName || 'JonSnow'}</h4>
                      <CheckCircle2 className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Verified Neighbor • 100% Response Rate</p>
                  </div>
                </div>

                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 cursor-pointer">
                  <MessageSquare className="w-4 h-4 text-forest-600" />
                  <span>Chat</span>
                </button>
              </div>

              {/* About Item Description */}
              <div className="space-y-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">ABOUT THIS LISTING</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {item.description || '18V cordless drill with 2 high-capacity batteries, charger, and sturdy carry case. Perfect for heavy duty drilling and home improvement projects.'}
                </p>

                <div className="flex flex-wrap gap-2 pt-3">
                  {(item.specs || ['Includes carry case', '2 batteries', '18V Torque', 'Refundable deposit']).map((spec, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700"
                    >
                      ✓ {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Booking & Escrow Calculator (5 cols) */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
                
                {/* Price Display */}
                <div className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">₹{pricePerDay}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase pl-1">/ day</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Security Deposit</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">₹{depositFee} (Refundable)</span>
                  </div>
                </div>

                {/* Calendar Date Selection */}
                <CalendarDatePicker
                  pricePerDay={pricePerDay}
                  depositAmount={depositFee}
                  onDateChange={(start, end) => setRentalDays(Math.max(1, end - start))}
                />

                {/* Breakdown Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>₹{pricePerDay} x {rentalDays} rental days</span>
                    <span className="font-mono font-bold">₹{rentalDays * pricePerDay}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Escrow Deposit (Returned upon handoff)</span>
                    <span className="font-mono font-bold">₹{depositFee}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-white font-extrabold text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Total Amount to Lock</span>
                    <span className="font-mono text-forest-600 dark:text-emerald-400">₹{totalPrice}</span>
                  </div>
                </div>

                {/* Request Button */}
                <button
                  disabled={isSubmitting}
                  onClick={handleRequestRent}
                  className="w-full py-4 rounded-full bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-base shadow-lg shadow-forest-600/30 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Request to Rent (₹{totalPrice})</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  );
};
