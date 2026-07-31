import React, { useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { Button } from '../components/common/Button';
import { LocationPickerModal } from '../components/map/LocationPickerModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../api/client';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Tag,
  DollarSign,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Layers,
  Wrench,
  ShieldCheck
} from 'lucide-react';
import { DEMO_CATEGORIES } from '../api/mockData';

export const CreateItemPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('tools');
  const [mode, setMode] = useState('RENT'); // RENT | BORROW | BUY
  const [price, setPrice] = useState('250.00');
  const [deposit, setDeposit] = useState('500.00');
  const [description, setDescription] = useState('');
  const [specsInput, setSpecsInput] = useState('Keyless chuck, 18V Li-Ion battery, Includes carrying case');
  const [vicinity, setVicinity] = useState(`${user.neighborhood} (~0.5km)`);
  const [itemLocation, setItemLocation] = useState({ lat: user.lat, lng: user.lng });
  const [image, setImage] = useState('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80');

  const handleSubmit = async () => {
    if (!title.trim()) {
      addToast('Please provide an item title', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const specsList = specsInput.split(',').map((s) => s.trim()).filter(Boolean);
      await apiFetch('/api/items', {
        method: 'POST',
        body: JSON.stringify({
          title,
          category,
          mode,
          price: parseFloat(price) || 0,
          deposit: parseFloat(deposit) || 0,
          description,
          specs: specsList,
          vicinity,
          lat: itemLocation.lat,
          lng: itemLocation.lng,
          image
        })
      });

      addToast(`🎉 Item "${title}" listed successfully!`, 'success');
      navigate('/explore');
    } catch (err) {
      addToast(err.message || 'Failed to list item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8 pb-28 md:pb-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-forest-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> P2P Listing Wizard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">List Your Item for Sharing</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium">
            Earn extra income or help your neighbors by renting or borrowing tools, equipment, and gear safely with escrow protection.
          </p>
        </div>

        {/* Wizard Step Indicator with Pixel-Perfect Line Alignment */}
        <div className="max-w-xl mx-auto px-6">
          <div className="relative flex items-center justify-between">
            
            {/* Track Line bounded strictly between node centers */}
            <div className="absolute top-[18px] left-6 right-6 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0 rounded-full" />
            
            {/* Active Fill Line */}
            <div
              className="absolute top-[18px] left-6 h-1 bg-gradient-to-r from-forest-600 to-emerald-500 -translate-y-1/2 z-0 rounded-full transition-all duration-300"
              style={{
                width: step === 1 ? '0%' : step === 2 ? '50%' : 'calc(100% - 48px)',
              }}
            />

            {[
              { num: 1, label: 'Item Details' },
              { num: 2, label: 'Pricing & Mode' },
              { num: 3, label: 'Location & Review' },
            ].map((s) => {
              const isDone = s.num < step;
              const isCurrent = s.num === step;
              return (
                <div
                  key={s.num}
                  className="relative z-10 flex flex-col items-center group cursor-pointer"
                  onClick={() => setStep(s.num)}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-500 text-white shadow-md'
                        : isCurrent
                        ? 'bg-forest-600 text-white ring-4 ring-forest-500/20 shadow-lg shadow-forest-600/30 scale-110'
                        : 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5 text-white" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-extrabold mt-2 whitespace-nowrap transition-colors ${
                      isCurrent
                        ? 'text-forest-600 dark:text-emerald-400 font-black'
                        : isDone
                        ? 'text-slate-900 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Card Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          
          {/* STEP 1: Details */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Tag className="w-5 h-5 text-forest-600 dark:text-emerald-400" />
                Step 1: Item Basic Details & Cover Image
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Item Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. DeWalt 20V Max Cordless Circular Saw"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600"
                  >
                    {DEMO_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Image Cover URL</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe item condition, included accessories, and usage tips..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Specs / Feature Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={specsInput}
                  onChange={(e) => setSpecsInput(e.target.value)}
                  placeholder="e.g. 20V Li-Ion, Includes Blade, Carrying Bag"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-full bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-xs shadow-md shadow-forest-600/30 transition-transform active:scale-95 cursor-pointer"
                >
                  Next: Pricing & Mode →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Mode & Pricing */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-forest-600 dark:text-emerald-400" />
                Step 2: Listing Mode & Escrow Security Deposit
              </h3>

              {/* Mode Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'RENT', label: 'Rent Item (₹)', desc: 'Charge daily fee + security deposit' },
                  { id: 'BORROW', label: 'Borrow (Free)', desc: 'Free sharing + security deposit' },
                  { id: 'BUY', label: 'Buy Outright', desc: 'One-time purchase price' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      mode === m.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-forest-600 dark:border-emerald-500 ring-2 ring-forest-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block mb-1">{m.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug block">{m.desc}</span>
                  </button>
                ))}
              </div>

              {/* Pricing Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {mode !== 'BORROW' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {mode === 'RENT' ? 'Daily Rental Price (₹)' : 'Selling Price (₹)'}
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 font-mono text-sm font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Refundable Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 font-mono text-sm font-black text-forest-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600"
                  />
                  <p className="text-[11px] text-slate-400">
                    Deposit is locked atomically from borrower wallet & returned on safe return handoff.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-full bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-xs shadow-md shadow-forest-600/30 transition-transform active:scale-95 cursor-pointer"
                >
                  Next: Location Pin →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Location & Review */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-forest-600 dark:text-emerald-400" />
                Step 3: Radial Location Pin & Final Review
              </h3>

              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">Item Pickup Origin Pin</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Vicinity: {vicinity} (Lat: {itemLocation.lat.toFixed(4)}, Lng: {itemLocation.lng.toFixed(4)})
                    </p>
                  </div>
                  <button
                    onClick={() => setIsLocationModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-100 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-forest-600" />
                    <span>Adjust Pin on Map</span>
                  </button>
                </div>
              </div>

              {/* Review Summary Card */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs">
                <h4 className="font-extrabold text-forest-700 dark:text-emerald-300 uppercase tracking-wider">Listing Summary</h4>
                <div className="text-slate-700 dark:text-slate-300 space-y-1 font-medium">
                  <p><strong>Title:</strong> {title || 'Untitled Item'}</p>
                  <p><strong>Mode:</strong> {mode} • <strong>Price:</strong> ₹{price}/day • <strong>Deposit:</strong> ₹{deposit}</p>
                  <p><strong>Owner:</strong> {user.name} ({user.neighborhood})</p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-xs shadow-lg shadow-forest-600/30 transition-transform active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish Item Listing</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Location Picker Modal */}
        <LocationPickerModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          initialLocation={itemLocation}
          onConfirm={(loc) => setItemLocation(loc)}
        />
      </div>
    </PageTransition>
  );
};
