import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;
let adminMessagingInstance: Messaging | null = null;

export function getFirebaseAdminApp(): App | null {
  if (adminApp) return adminApp;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0]!;
    return adminApp;
  }

  const projectId = 
    process.env.FIREBASE_ADMIN_PROJECT_ID || 
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
    process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      return adminApp;
    } catch (err) {
      console.warn('Failed to initialize Firebase Admin with service account:', err);
    }
  } else if (projectId) {
    try {
      adminApp = initializeApp({
        projectId,
      });
      return adminApp;
    } catch (err) {
      console.warn('Failed to initialize Firebase Admin with projectId only:', err);
    }
  }

  return null;
}

export function getAdminAuth(): Auth | null {
  if (adminAuthInstance) return adminAuthInstance;
  const app = getFirebaseAdminApp();
  if (app) {
    adminAuthInstance = getAuth(app);
  }
  return adminAuthInstance;
}

export function getAdminDb(): Firestore | null {
  if (adminDbInstance) return adminDbInstance;
  const app = getFirebaseAdminApp();
  if (app) {
    adminDbInstance = getFirestore(app);
  }
  return adminDbInstance;
}

export const adminAuth = {
  verifyIdToken: async (token: string): Promise<DecodedIdToken> => {
    const auth = getAdminAuth();
    if (!auth) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Firebase Admin SDK is not configured.');
      }
      // In development / preview mode without admin service account, parse basic payload
      try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          return decoded as DecodedIdToken;
        }
      } catch {
        // ignore
      }
      return { uid: 'demo-user-123', email: 'author@kdpstudio.com', email_verified: true } as any;
    }
    return auth.verifyIdToken(token);
  },
  createSessionCookie: async (idToken: string, options: { expiresIn: number }): Promise<string> => {
    const auth = getAdminAuth();
    if (!auth) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Firebase Admin SDK is not configured.');
      }
      return `session_demo_${Date.now()}`;
    }
    return auth.createSessionCookie(idToken, options);
  },
  verifySessionCookie: async (sessionCookie: string, checkRevoked = true): Promise<DecodedIdToken> => {
    const auth = getAdminAuth();
    if (!auth) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Firebase Admin SDK is not configured.');
      }
      return { uid: 'demo-user-123', email: 'author@kdpstudio.com', email_verified: true } as any;
    }
    return auth.verifySessionCookie(sessionCookie, checkRevoked);
  },
};

export function getAdminMessaging(): Messaging | null {
  if (adminMessagingInstance) return adminMessagingInstance;
  const app = getFirebaseAdminApp();
  if (app) {
    adminMessagingInstance = getMessaging(app);
  }
  return adminMessagingInstance;
}

// Proxy adminDb so property access delegates to getAdminDb() dynamically
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    const db = getAdminDb();
    if (!db) {
      console.warn(`[Firebase Admin] adminDb.${String(prop)} accessed before Admin SDK is fully initialized.`);
      return () => ({});
    }
    const val = (db as any)[prop];
    return typeof val === 'function' ? val.bind(db) : val;
  }
});

export const adminMessaging = {
  send: async (msg: any) => {
    const messaging = getAdminMessaging();
    if (!messaging) return null;
    return messaging.send(msg);
  }
};
