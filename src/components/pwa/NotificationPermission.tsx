import React, { useState, useEffect } from 'react';
import { Bell, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { initMessaging } from '../../lib/messaging';
import { useAuthStore } from '../../lib/authStore';
import { toastStore } from '../../lib/toastStore';

export const NotificationPermission: React.FC = () => {
  const { user } = useAuthStore();
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Check if permission already handled
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return;
    }

    // Check 7-day dismissal
    const dismissedAt = localStorage.getItem('notification-dismissed');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    // Show banner after 5 minutes of app use (or 45s for first time)
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 45000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('notification-dismissed', Date.now().toString());
    setShowBanner(false);
  };

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const token = await initMessaging(user?.uid);
      if (token) {
        toastStore.addToast({
          title: 'Notifications Enabled ✅',
          message: 'You will receive updates when your books finish generating.',
          type: 'success',
          duration: 4000,
        });
        setShowBanner(false);
      } else {
        toastStore.addToast({
          title: 'Permission Notice',
          message: 'You can enable notifications in your browser site settings anytime.',
          type: 'info',
          duration: 4000,
        });
        setShowBanner(false);
      }
    } catch (err) {
      console.error('Error enabling notifications:', err);
    } finally {
      setIsRequesting(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="w-full bg-gradient-to-r from-purple-950 via-[#181335] to-indigo-950 border-b border-purple-500/30 text-white px-4 py-2.5 transition-all duration-300 shadow-md animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
            <Bell size={15} className="text-amber-300" />
          </div>
          <p className="text-xs text-slate-200 font-medium">
            <strong className="text-white font-bold">Stay Updated:</strong> Get push notifications when your books and interior batches finish generating.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleEnable}
            disabled={isRequesting}
            className="px-3.5 py-1.5 text-[11px] font-bold text-white rounded-lg bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Bell size={12} />
            <span>{isRequesting ? 'Enabling...' : 'Enable Notifications'}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-md ml-1"
            aria-label="Close notification banner"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
