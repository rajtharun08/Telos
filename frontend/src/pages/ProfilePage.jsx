import React, { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ItemCard } from '../components/items/ItemCard';
import { ItemDetailModal } from '../components/items/ItemDetailModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../api/client';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Star,
  MapPin,
  Calendar,
  Grid,
  MessageSquare,
  FileCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Upload,
  Plus,
  HelpCircle,
  LogOut
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'reviews' | 'kyc' | 'settings'
  const [userItems, setUserItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  // Mock Reviews
  const reviews = [
    {
      id: 'rev-1',
      author: 'Vikram Malhotra',
      rating: 5,
      date: '2 weeks ago',
      comment: 'Aliya was super prompt with the drill handoff! Item was in perfect condition with full battery charge.'
    },
    {
      id: 'rev-2',
      author: 'Ananya Iyer',
      rating: 5,
      date: '1 month ago',
      comment: 'Smooth borrow transaction for the camping tent. Very friendly neighbor!'
    }
  ];

  useEffect(() => {
    setIsLoading(true);
    apiFetch('/api/items')
      .then((data) => {
        const mine = data.filter((item) => item.ownerId === user.id || item.ownerName === user.name);
        setUserItems(mine.length > 0 ? mine : data.slice(0, 2));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6 pb-24 md:pb-8">
        
        {/* User Profile Banner Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 text-center sm:text-left">
            
            {/* Left: Avatar & Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 w-full">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full bg-slate-900 dark:bg-forest-600 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg border-4 border-white dark:border-slate-800">
                  {user.name.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-forest-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white shadow">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2 w-full">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">{user.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-forest-600 dark:text-emerald-400 text-xs font-extrabold border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                    Verified Neighbor
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400 shrink-0" />
                    {user.neighborhood}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Joined {user.joined || 'Jan 2024'}
                  </span>
                </div>

                {/* Rating & Trust Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-extrabold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{user.rating || 4.9}</span>
                    <span className="text-slate-400 font-normal">({user.reviews || 24} reviews)</span>
                  </div>

                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    100% On-Time Returns
                  </span>

                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-forest-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 whitespace-nowrap">
                    <ShieldCheck className="w-3.5 h-3.5" /> KYC: {user.kycStatus || 'VERIFIED'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'listings', label: 'My Listings', icon: Grid, count: userItems.length },
            { id: 'reviews', label: 'Neighbor Reviews', icon: Star, count: reviews.length },
            { id: 'kyc', label: 'Identity & KYC', icon: FileCheck },
            { id: 'settings', label: 'Preferences', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 dark:bg-forest-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-forest-600 dark:text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-forest-600 dark:bg-slate-900 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: My Listings Grid */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Your Active Sharing Listings</h3>
            </div>

            {userItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center space-y-3 border border-slate-200 dark:border-slate-800 shadow-sm">
                <Grid className="w-10 h-10 text-forest-600 dark:text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No listings posted yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Start sharing your idle tools, camera gear, or camping equipment with verified neighbors.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onOpenDetail={(i) => setSelectedDetailItem(i)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Neighbor Feedback & Ratings</h3>
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{rev.author}</span>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{rev.rating}.0</span>
                      <span className="text-slate-400 text-[10px]">({rev.date})</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: KYC & Identity */}
        {activeTab === 'kyc' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Identity & Verification Center</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Government ID and receipt verification status</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-forest-600 dark:text-emerald-400 font-extrabold text-xs border border-emerald-200 dark:border-emerald-800">
                Status: VERIFIED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
                  Government Passport / ID
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Document #A8492019 verified on Jan 15, 2024</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <FileCheck className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
                  Purchase Receipt Verification
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Invoice #INV-8819 verified for Bosch Drill</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Preferences & Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="space-y-4 max-w-md">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Hyperlocal Search Preferences</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Home Neighborhood</label>
                  <input
                    type="text"
                    value={user.neighborhood}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Default Search Radius</label>
                  <input
                    type="text"
                    value="2.0 km"
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Customer Support & Logout Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 max-w-md">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Account Actions & Support</h3>
              
              <Link
                to="/support"
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
                  <span>Customer Support & FAQ Center</span>
                </div>
                <span>→</span>
              </Link>

              <button
                onClick={() => {
                  logout();
                  addToast('Signed out of account safely', 'info');
                  navigate('/login');
                }}
                className="w-full p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800/60 text-xs font-extrabold text-rose-600 dark:text-rose-400 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </div>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        <ItemDetailModal
          isOpen={!!selectedDetailItem}
          onClose={() => setSelectedDetailItem(null)}
          item={selectedDetailItem}
        />
      </div>
    </PageTransition>
  );
};
