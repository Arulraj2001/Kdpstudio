import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Firebase Client Configuration Loader
 * Supports both VITE_ and NEXT_PUBLIC_ prefixes for maximum framework portability.
 * Note: To enable Google Sign-In, ensure your hosting domain is added to 
 * Authorized Domains in Firebase Console > Authentication > Settings.
 */
// Helper to get client environment variable with static literal access for Vite build inlining
const getClientEnv = (val: any, fallback: string): string => {
  if (typeof val === 'string' && val.length > 0) return val;
  return fallback;
};

export const firebaseConfig = {
  apiKey: getClientEnv(import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY, 'AIzaSyCXrovDMZnlS9iZTbx5XTjdqP-kmafGaKM'),
  authDomain: getClientEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, 'kdpstudio-83edb.firebaseapp.com'),
  projectId: getClientEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 'kdpstudio-83edb'),
  storageBucket: getClientEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, 'kdpstudio-83edb.firebasestorage.app'),
  messagingSenderId: getClientEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, '948994960311'),
  appId: getClientEnv(import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID, '1:948994960311:web:cc6634e13a51ae7a427ef5'),
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY'
);

let app: FirebaseApp;

if (!getApps().length) {
  if (isFirebaseConfigured) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      console.warn('⚠️ Firebase initialization failed with provided config, switching to Preview Mode fallback:', e);
      app = initializeApp({
        apiKey: 'AIzaSyDemoKeyForKDPStudioPreviewPrototyping123',
        authDomain: 'kdp-studio-demo.firebaseapp.com',
        projectId: 'kdp-studio-demo',
        storageBucket: 'kdp-studio-demo.appspot.com',
        messagingSenderId: '1040865203032',
        appId: '1:1040865203032:web:demo123456789',
      });
    }
  } else {
    // Demo / Prototyping fallback app initialization
    app = initializeApp({
      apiKey: 'AIzaSyDemoKeyForKDPStudioPreviewPrototyping123',
      authDomain: 'kdp-studio-demo.firebaseapp.com',
      projectId: 'kdp-studio-demo',
      storageBucket: 'kdp-studio-demo.appspot.com',
      messagingSenderId: '1040865203032',
      appId: '1:1040865203032:web:demo123456789',
    });
    console.info(
      'ℹ️ Firebase running in Preview Mode. Set VITE_FIREBASE_API_KEY & VITE_FIREBASE_PROJECT_ID to connect your live Firebase project.'
    );
  }
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app };
export default app;
