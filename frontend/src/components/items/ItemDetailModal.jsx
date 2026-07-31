import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CalendarDatePicker } from '../common/CalendarDatePicker';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  MapPin,
  CheckCircle2,
  Heart,
  MessageSquare,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Share2
} from 'lucide-react';

export const ItemDetailModal = ({ isOpen, onClose, item }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rentalDays, setRentalDays] = useState(3);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!item) return null;

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
      onClose();
      navigate('/transactions');
    } catch (err) {
      addToast(err.message || 'Failed to send request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-2xl" fullScreenOnMobile={true}>
      <div className="space-y-5 text-slate-900 dark:text-white -mt-2">
        
        {/* Top Hero Image Header with Floating Controls */}
        <div className="relative h-60 sm:h-72 -mx-6 -mt-6 overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

          {/* Floating Back, Share & Favorite Buttons */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center text-slate-800 dark:text-white shadow-lg hover:bg-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  addToast('Link copied to clipboard!', 'info');
                }}
                className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center text-slate-800 dark:text-white shadow-lg hover:bg-white transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsFavorite(!isFavorite);
                  addToast(isFavorite ? 'Removed from saved items' : 'Saved to favorites!', 'info');
                }}
                className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center text-slate-800 dark:text-white shadow-lg hover:text-rose-500 transition-colors cursor-pointer"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Title, Category & Price Tag */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              {item.category || 'TOOLS'}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {item.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              <MapPin className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400" />
              <span>{item.distanceKm || '0.4'} km away</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-400">Approximate zone</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{item.rating || 4.9}</span>
                <span className="text-slate-400">({item.reviews || 32})</span>
              </div>
            </div>
          </div>

          {/* Price Badge Pill */}
          <div className="bg-slate-900 dark:bg-forest-600 px-4 py-2 rounded-2xl text-white text-center shrink-0 shadow-md">
            <span className="text-lg font-black font-mono block">₹{pricePerDay}</span>
            <span className="text-[10px] text-slate-300 font-bold uppercase block -mt-1">/day</span>
          </div>
        </div>

        {/* Location Privacy Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 font-medium">
          <Lock className="w-4 h-4 text-forest-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Location Privacy Enforced</span>
            <span>Exact street address & door pickup pin will be unlocked automatically once the request is approved by the lender.</span>
          </div>
        </div>

        {/* Owner Profile Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest-600 text-white flex items-center justify-center font-bold text-sm shadow">
              {(item.ownerName || 'JonSnow').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.ownerName || 'JonSnow'}</h4>
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                ★ 4.9 (18 reviews) • Verified Neighbor
              </p>
            </div>
          </div>

          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <MessageSquare className="w-3.5 h-3.5 text-forest-600" />
            <span>Chat</span>
          </button>
        </div>

        {/* About Item Description */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ABOUT THIS ITEM</h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {item.description || '18V cordless drill with 2 batteries, charger, and carry case. Perfect for home projects and woodworking.'}
          </p>
        </div>

        {/* Specs Pill Badges */}
        <div className="flex flex-wrap gap-2">
          {(item.specs || ['Includes carry case', '2 batteries', '18V - 60Nm torque', 'Refundable deposit']).map((spec, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              ✓ {spec}
            </span>
          ))}
        </div>

        {/* Interactive Calendar Date Picker */}
        <CalendarDatePicker
          pricePerDay={pricePerDay}
          depositAmount={depositFee}
          onDateChange={(start, end) => setRentalDays(Math.max(1, end - start))}
        />

        {/* Clean Primary CTA Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            disabled={isSubmitting}
            onClick={handleRequestRent}
            className="w-full py-4 rounded-2xl bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-base shadow-xl shadow-forest-600/30 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Request to Rent (₹{rentalDays * pricePerDay} + ₹{depositFee} Escrow Deposit)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
