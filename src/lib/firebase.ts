import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Firebase Client Configuration Loader
 * Supports both VITE_ and NEXT_PUBLIC_ prefixes for maximum framework portability.
 * Note: To enable Google Sign-In, ensure your hosting domain is added to 
 * Authorized Domains in Firebase Console > Authentication > Settings.
 */
const getEnvVar = (viteKey: string, nextKey: string, fallback = ''): string => {
  // Vite client-side
  const meta = typeof import.meta !== 'undefined' ? (import.meta as any) : undefined;
  if (meta?.env) {
    if (meta.env[viteKey]) return meta.env[viteKey];
    if (meta.env[nextKey]) return meta.env[nextKey];
  }
  // Node / Server environment
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[viteKey]) return process.env[viteKey];
    if (process.env[nextKey]) return process.env[nextKey];
  }
  return fallback;
};


export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID'),
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
