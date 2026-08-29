import { getMessaging, getToken, onMessage, isSupported, MessagePayload, Messaging } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { app, db } from './firebase';

const VAPID_KEY = (import.meta as any)?.env?.VITE_FIREBASE_VAPID_KEY ||
  (import.meta as any)?.env?.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
  'BNx7h7mO5F8Z8z5Y1k9X7u1A_DemoVapidKeyPlaceholderForKDPStudioPreview123';

export const detectDevice = (): 'android' | 'ios' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  return 'desktop';
};

let messagingInstance: Messaging | null = null;

export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
};

export const initMessaging = async (uid?: string): Promise<string | null> => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('[FCM] Notifications not supported in this browser environment.');
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn('[FCM] Firebase Cloud Messaging is not supported on this platform/browser.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission was denied or dismissed.');
      return null;
    }

    // Wait for Service Worker registration
    let swReg: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      swReg = await navigator.serviceWorker.ready.catch(() => undefined);
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (token && uid) {
      const userRef = doc(db, 'users', uid);
      const tokenData = {
        token,
        device: detectDevice(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(tokenData),
        });
      } catch (err) {
        console.warn('[FCM] Could not sync token to user doc (user may be in demo mode):', err);
      }
      localStorage.setItem('kdp_fcm_token', token);
    }

    return token;
  } catch (err) {
    console.warn('[FCM] Error initializing messaging:', err);
    return null;
  }
};

export const onForegroundMessage = async (callback: (payload: MessagePayload) => void): Promise<(() => void) | null> => {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;
    return onMessage(messaging, callback);
  } catch (err) {
    console.warn('[FCM] Error subscribing to foreground messages:', err);
    return null;
  }
};

export const removeFcmToken = async (uid: string): Promise<void> => {
  try {
    const currentToken = localStorage.getItem('kdp_fcm_token');
    if (!currentToken || !uid) return;

    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const existingTokens = data.fcmTokens || [];
      const tokenToRemove = existingTokens.find((t: any) => t.token === currentToken);
      if (tokenToRemove) {
        await updateDoc(userRef, {
          fcmTokens: arrayRemove(tokenToRemove),
        });
      }
    }
    localStorage.removeItem('kdp_fcm_token');
  } catch (err) {
    console.warn('[FCM] Error removing token on logout:', err);
  }
};
