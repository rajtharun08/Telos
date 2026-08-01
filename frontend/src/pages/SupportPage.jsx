import React, { useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { useToast } from '../context/ToastContext';
import {
  HelpCircle,
  ShieldCheck,
  QrCode,
  AlertTriangle,
  MapPin,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const SupportPage = () => {
  const { addToast } = useToast();
  const [openFaq, setOpenFaq] = useState('escrow');

  // Support Ticket Form State
  const [category, setCategory] = useState('escrow');
  const [priority, setPriority] = useState('NORMAL');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState([
    {
      id: 'TICK-8849',
      category: 'Escrow Refund',
      subject: 'Security deposit hold auto-refund query',
      status: 'RESOLVED',
      date: 'Yesterday, 4:15 PM'
    }
  ]);

  const faqs = [
    {
      id: 'escrow',
      title: 'How does the Escrow Security Deposit system work?',
      icon: ShieldCheck,
      content:
        'When you submit a rental or borrow request, the daily fee plus refundable security deposit (in ₹) is locked in escrow from your wallet. Funds are held safely and are never transferred to the lender until the item is safely returned and verified via QR code scan.'
    },
    {
      id: 'handoff',
      title: 'How do QR Code Pickup & Return handoffs work?',
      icon: QrCode,
      content:
        'Physical handoffs use time-bound, cryptographically signed QR code tokens. Upon meetup, the lender generates a pickup QR code from their app, which the borrower scans with their camera to confirm item receipt. Upon return, the process is reversed.'
    },
    {
      id: 'disputes',
      title: 'What happens if an item is returned damaged or late?',
      icon: AlertTriangle,
      content:
        'If an item is returned past the scheduled end time, late fees are automatically assessed. If an item is returned damaged, either party can tap "Flag Dispute" in the Transactions Hub. Escrow funds remain frozen while our Admin Support team reviews photos and invoice receipts.'
    },
    {
      id: 'privacy',
      title: 'Is my exact home location kept private?',
      icon: MapPin,
      content:
        'Yes! Telos uses deterministic polar jittering on public map views so neighbors see approximate neighborhood distance radius pins (e.g. ~0.5km). Exact pickup addresses are unlocked strictly after a transaction is confirmed by both parties.'
    },
    {
      id: 'payments',
      title: 'What payment & wallet top-up methods are supported?',
      icon: CreditCard,
      content:
        'We support UPI (GPay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), and Apple Pay. Wallet top-up presets are available in ₹250, ₹500, ₹1,000, and ₹2,500 denominations.'
    }
  ];

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      addToast('Please enter your support query details', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newTicket = {
        id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
        category: category === 'escrow' ? 'Escrow & Wallet' : category === 'handoff' ? 'QR Handoff' : 'Dispute & Claim',
        subject: message.slice(0, 45) + '...',
        status: 'OPEN',
        date: 'Just now'
      };
      setTickets([newTicket, ...tickets]);
      addToast(`🎉 Support Ticket #${newTicket.id} submitted! Our team will respond shortly.`, 'success');
      setMessage('');
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8 pb-28 md:pb-12">
        
        {/* Page Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-forest-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> Customer Support & FAQ Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            How can we help your neighborhood today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium">
            Find instant answers to escrow rules, QR handoffs, damage claims, and neighborhood privacy policies.
          </p>
        </div>

        {/* Section 1: Frequently Asked Questions Accordion */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-forest-600 dark:text-emerald-400" />
            Frequently Asked Questions
          </h3>

          <div className="space-y-3">
            {faqs.map((faq) => {
              const Icon = faq.icon;
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? '' : faq.id)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-forest-50 dark:bg-forest-950/60 text-forest-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">{faq.title}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-4 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                      {faq.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Create Support Ticket Form & Ticket Status Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Contact Support Team Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <MessageSquare className="w-5 h-5 text-forest-600 dark:text-emerald-400" />
              Submit Support Ticket
            </h3>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600"
                  >
                    <option value="escrow">Escrow & Wallet Holds (₹)</option>
                    <option value="handoff">QR Code Pickup / Return Handoff</option>
                    <option value="disputes">Item Condition & Damage Dispute</option>
                    <option value="account">Account & Identity Verification</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600"
                  >
                    <option value="LOW">Normal Query</option>
                    <option value="NORMAL">Priority Assistance</option>
                    <option value="URGENT">Urgent Escrow Freeze Claim</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Describe Your Query</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide transaction IDs, item title, or escrow details..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-xs shadow-lg shadow-forest-600/30 transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Ticket to Support Team</span>
              </button>
            </form>
          </div>

          {/* Right: Active Support Tickets Status */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Clock className="w-5 h-5 text-forest-600 dark:text-emerald-400" />
              Your Ticket History
            </h3>

            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono">{t.id}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-forest-600 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 animate-pulse'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{t.category}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{t.subject}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">{t.date}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};
