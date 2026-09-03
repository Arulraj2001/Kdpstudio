import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

/**
 * Firebase Client Configuration Loader
 * Supports both NEXT_PUBLIC_ and VITE_ prefixes across SSR, Edge, and browser runtime.
 */
function getEnvVar(key: string, viteKey?: string): string | undefined {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv) {
      if (metaEnv[key]) return metaEnv[key];
      if (viteKey && metaEnv[viteKey]) return metaEnv[viteKey];
    }
  } catch {}
  return undefined;
}

const getClientEnv = (val: string | undefined, fallback: string): string => {
  if (typeof val === 'string' && val.length > 0) return val;
  return fallback;
};

// Dynamic auth domain calculation to ensure same-origin OAuth handshake
const getDynamicAuthDomain = (): string => {
  const customAuthDomain = getEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN');
  if (customAuthDomain) return customAuthDomain;

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host.includes('kdpstudio-aio') || host.includes('kdpstudioaio')) {
      return 'kdpstudioaio-3bf53.firebaseapp.com';
    }
    return host;
  }
  return 'kdpstudioaio-3bf53.firebaseapp.com';
};

export const firebaseConfig = {
  apiKey: getClientEnv(getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY'), 'AIzaSyC3gnC1NdRYEHm4zR8Kfe0BJeGR_Ae1xLk'),
  authDomain: getDynamicAuthDomain(),
  projectId: getClientEnv(getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID'), 'kdpstudioaio-3bf53'),
  storageBucket: getClientEnv(getEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET'), 'kdpstudioaio-3bf53.firebasestorage.app'),
  messagingSenderId: getClientEnv(getEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID'), '494698350011'),
  appId: getClientEnv(getEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID'), '1:494698350011:web:ad96b775d58d49a874309e'),
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY'
);

// Only allow the throwaway preview project in non-production builds.
// In production we never silently switch to the demo project — the live
// pricing / auth / Firestore data would otherwise go stale or break.
const getIsProduction = (): boolean => {
  try {
    const meta = (import.meta as any)?.env;
    if (meta && typeof meta.PROD === 'boolean') return meta.PROD;
  } catch {}
  return typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';
};

const isProduction = getIsProduction();

const demoFirebaseConfig = {
  apiKey: 'AIzaSyDemoKeyForKDPStudioPreviewPrototyping123',
  authDomain: 'kdp-studio-demo.firebaseapp.com',
  projectId: 'kdp-studio-demo',
  storageBucket: 'kdp-studio-demo.appspot.com',
  messagingSenderId: '1040865203032',
  appId: '1:1040865203032:web:demo123456789',
};

let app: FirebaseApp;

if (!getApps().length) {
  if (isFirebaseConfigured) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      if (isProduction) {
        // Fail loudly rather than silently degrade to the demo project.
        console.error(
          '⚠️ Firebase initialization failed in production with the provided config. ' +
          'Verify your VITE_/NEXT_PUBLIC_FIREBASE_* keys point to the live project.',
          e
        );
        throw e;
      }
      console.warn('⚠️ Firebase initialization failed with provided config, switching to Preview Mode fallback:', e);
      app = initializeApp(demoFirebaseConfig);
    }
  } else if (isProduction) {
    // Never use the demo project for a real production build.
    throw new Error(
      'Firebase is not configured for this production build. ' +
      'Set real NEXT_PUBLIC_FIREBASE_API_KEY / NEXT_PUBLIC_FIREBASE_PROJECT_ID (or VITE_ equivalents) in the deployed environment.'
    );
  } else {
    // Demo / Prototyping fallback app initialization (non-production only)
    app = initializeApp(demoFirebaseConfig);
    console.info(
      'ℹ️ Firebase running in Preview Mode. Set NEXT_PUBLIC_FIREBASE_API_KEY & NEXT_PUBLIC_FIREBASE_PROJECT_ID to connect your live Firebase project.'
    );
  }
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);

let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
} catch {
  firestoreDb = getFirestore(app);
}
export const db: Firestore = firestoreDb;
export const storage: FirebaseStorage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app };
export default app;
