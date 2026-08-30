/**
 * Pending UPI Payment Dashboard Banner
 * Alerts the user when their manual UPI payment is in the verification queue.
 */

import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, X, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { UpiPendingPayment } from '../../types/payment';
import { auth } from '../../lib/firebase';

interface PendingPaymentBannerProps {
  onContactSupport?: () => void;
}

export const PendingPaymentBanner: React.FC<PendingPaymentBannerProps> = ({
  onContactSupport,
}) => {
  const { user } = useAuthStore();
  const [pendingPayment, setPendingPayment] = useState<UpiPendingPayment | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = async () => {
    if (!user?.uid) return;
    try {
      setIsLoading(true);
      let foundPending: UpiPendingPayment | null = null;
      let serverSuccess = false;

      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/payment/upi/status', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          foundPending = data.pending || null;
          serverSuccess = true;
        }
      } catch {
        // Silent fallback
      }

      if (!serverSuccess) {
        try {
          const { db, isFirebaseConfigured } = await import('../../lib/firebase');
          const { collection, getDocs, query, where } = await import('firebase/firestore');
          if (isFirebaseConfigured && db) {
            const q = query(
              collection(db, 'upiPending'),
              where('uid', '==', user.uid),
              where('status', '==', 'pending')
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              foundPending = snap.docs[0].data() as UpiPendingPayment;
            }
          }
        } catch {
          // Silent fallback
        }
      }

      setPendingPayment(foundPending);
    } catch (err) {
      console.warn('[PendingPaymentBanner] Error checking status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if dismissed in this session
    const dismissedSession = sessionStorage.getItem('kdp_upi_banner_dismissed');
    if (dismissedSession) {
      setIsDismissed(true);
    }

    if (user?.uid) {
      fetchStatus();
    }
  }, [user?.uid]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('kdp_upi_banner_dismissed', 'true');
  };

  if (isDismissed || !pendingPayment) {
    return null;
  }

  return (
    <div 
      id="upi-pending-banner"
      className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 px-4 py-2.5 shadow-sm border-b border-amber-600 flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-300"
    >
      <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-white">
          <div className="p-1 rounded-lg bg-black/20 text-white shrink-0">
            <Clock size={15} className="animate-pulse" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 leading-snug">
            <span className="font-bold text-amber-100">UPI Payment Verification in Progress:</span>
            <span>
              Your payment of <strong className="text-white">₹{pendingPayment.amount?.toLocaleString('en-IN')}</strong> for{' '}
              <strong className="text-white capitalize">{pendingPayment.plan}</strong> plan is being verified. Usually takes 2-4 hours.
            </span>
            <span className="hidden sm:inline bg-black/20 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-amber-200">
              UTR: {pendingPayment.utrNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {onContactSupport ? (
            <button
              type="button"
              onClick={onContactSupport}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <MessageSquare size={12} />
              <span>Contact Support</span>
            </button>
          ) : (
            <a
              href="mailto:support@kdpstudio.com?subject=UPI%20Verification%20UTR%20"
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <MessageSquare size={12} />
              <span>Contact Support</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="p-1 rounded-lg hover:bg-black/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
