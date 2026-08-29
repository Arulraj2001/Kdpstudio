import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type PwaEventType =
  | 'pwa_install_prompted'
  | 'pwa_install_accepted'
  | 'pwa_install_dismissed'
  | 'pwa_notification_granted'
  | 'pwa_notification_denied'
  | 'pwa_offline_page_shown'
  | 'pwa_launched_standalone';

export const trackPwaEvent = async (
  uid: string | null | undefined,
  event: PwaEventType,
  data?: Record<string, any>
): Promise<void> => {
  try {
    if (typeof window === 'undefined') return;

    // Detect environment
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    const eventPayload = {
      event,
      uid: uid || 'anonymous',
      isStandalone,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      serverCreatedAt: serverTimestamp(),
      ...data,
    };

    // Save to Firestore telemetry collection (fire-and-forget)
    addDoc(collection(db, 'pwaEvents'), eventPayload).catch((err) => {
      // Non-blocking log
      console.debug('[PWA Telemetry] Non-blocking tracking notice:', err?.message || err);
    });
  } catch {
    // Non-blocking
  }
};
