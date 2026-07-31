import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  MessageSquare,
  CheckCheck,
  QrCode,
  ShieldCheck,
  User,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  PhoneCall,
  Image as ImageIcon,
  Smile
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { INITIAL_ITEMS, DEMO_USERS } from '../../api/mockData';

export const ChatDrawer = ({
  isOpen,
  onClose,
  recipientName = 'Vikram Malhotra',
  itemTitle = 'Bosch Professional GSB 18V Drill Kit'
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Active Conversations List
  const [conversations, setConversations] = useState([
    {
      id: 'conv-1',
      recipient: 'Vikram Malhotra',
      itemTitle: 'Bosch Professional GSB 18V Drill Kit',
      itemImage: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
      price: 250,
      unread: 0,
      online: true,
      lastMsg: 'Perfect! 4 PM works great. See you at Indiranagar 100ft Rd.'
    },
    {
      id: 'conv-2',
      recipient: 'Ananya Iyer',
      itemTitle: 'Sony Alpha A7 IV Camera',
      itemImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      price: 850,
      unread: 1,
      online: true,
      lastMsg: 'Is the camera available for rental this weekend?'
    }
  ]);

  const [activeConvId, setActiveConvId] = useState('conv-1');
  const [isTyping, setIsTyping] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  const [messagesMap, setMessagesMap] = useState({
    'conv-1': [
      {
        id: 1,
        sender: 'Vikram Malhotra',
        text: `Hi ${user.name.split(' ')[0]}! Yes, the Bosch Drill Kit is fully charged and ready for pickup near Indiranagar 100ft Rd.`,
        time: '10:15 AM'
      },
      {
        id: 2,
        sender: user.name,
        text: 'Awesome! I submitted the rental request with escrow lock. Can I pick it up at 4 PM today?',
        time: '10:18 AM'
      },
      {
        id: 3,
        sender: 'Vikram Malhotra',
        text: 'Perfect! 4 PM works great. I will have the handoff QR code ready for verification when you arrive.',
        time: '10:20 AM'
      }
    ],
    'conv-2': [
      {
        id: 101,
        sender: 'Ananya Iyer',
        text: 'Hi Aliya, is the Sony Camera available for this coming weekend?',
        time: 'Yesterday'
      }
    ]
  });

  const [inputText, setInputText] = useState('');

  const quickReplies = [
    '📍 Share pickup address',
    '⏰ I have arrived at location!',
    '🔋 Is battery included?',
    '🤝 Ready for QR code scan'
  ];

  const handleSendMessage = (textToSend) => {
    const msgText = textToSend || inputText;
    if (!msgText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: user.name,
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMsg]
    }));

    if (!textToSend) setInputText('');

    // Trigger typing indicator and auto reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replyMsg = {
        id: Date.now() + 1,
        sender: activeConv.recipient,
        text: `Sounds great! Looking forward to completing the P2P handoff for ${activeConv.itemTitle}.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessagesMap((prev) => ({
        ...prev,
        [activeConvId]: [...(prev[activeConvId] || []), replyMsg]
      }));
    }, 1800);
  };

  const currentMessages = messagesMap[activeConvId] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          />

          {/* Chat Drawer Box */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl z-10 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
          >
            {/* Top Bar Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-forest-600 text-white flex items-center justify-center font-black text-sm shadow">
                    {activeConv.recipient.charAt(0)}
                  </div>
                  {activeConv.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {activeConv.recipient}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-forest-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Verified Neighbor
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">
                    Re: {activeConv.itemTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conversation Selector Tabs */}
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeConvId === c.id
                      ? 'bg-forest-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate max-w-[120px]">{c.recipient.split(' ')[0]}</span>
                  {c.unread > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {c.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Item Card Banner Summary */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={activeConv.itemImage}
                  alt={activeConv.itemTitle}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block line-clamp-1">
                    {activeConv.itemTitle}
                  </span>
                  <span className="text-[11px] text-forest-600 dark:text-emerald-400 font-bold font-mono">
                    ₹{activeConv.price}/day • Escrow Protected
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-forest-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Escrow Active
              </span>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="text-center my-1">
                <span className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400" />
                  P2P Messages are encrypted & monitored for safety
                </span>
              </div>

              {currentMessages.map((msg) => {
                const isMe = msg.sender === user.name;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-forest-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                      <span>{msg.time}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-forest-600 dark:text-emerald-400" />}
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic bg-white dark:bg-slate-800 p-2.5 rounded-2xl max-w-[140px] border border-slate-200 dark:border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-forest-600 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-forest-600 animate-bounce delay-100" />
                  <span className="w-2 h-2 rounded-full bg-forest-600 animate-bounce delay-200" />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Typing...</span>
                </div>
              )}
            </div>

            {/* Quick Suggestions Chips */}
            <div className="p-2 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(reply)}
                  className="px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-forest-600 hover:text-white transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Footer Input */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message to your neighbor..."
                className="flex-1 px-4 py-3 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-forest-600"
              />
              <button
                type="submit"
                className="p-3 rounded-full bg-forest-600 hover:bg-forest-500 text-white shadow-md shadow-forest-600/30 transition-transform active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
