import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const PwaInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      addToast('🎉 Telos App successfully installed on your device!', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [addToast]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        addToast('Installing Telos App...', 'info');
      }
      setDeferredPrompt(null);
    } else {
      addToast('To install Telos, tap "Share" or "Menu" in your browser and select "Add to Home Screen".', 'info');
    }
  };

  if (isDismissed || isInstalled) return null;

  return (
    <div className="bg-gradient-to-r from-forest-600 via-emerald-600 to-teal-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-bold transition-all">
      <div className="flex items-center gap-2 max-w-xl">
        <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
          <Smartphone className="w-4 h-4" />
        </div>
        <div>
          <span>Install Telos App for fast offline access & push notifications</span>
          <span className="hidden sm:inline text-emerald-100 font-normal pl-2">• Hyperlocal Sharing P2P</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-forest-700 hover:bg-emerald-50 text-xs font-extrabold shadow-sm transition-transform active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-full hover:bg-white/20 text-emerald-100 hover:text-white transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
