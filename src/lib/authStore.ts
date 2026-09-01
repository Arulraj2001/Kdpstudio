import { create } from 'zustand';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendEmailVerification, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from './firebase';
import { useGeoStore } from './geoStore';
import { 
  createUserDocument, 
  getUserDocument, 
  UserDocument, 
  updateUserDocument 
} from './userService';
import { 
  sendWelcomeEmail, 
  sendAdminNewSignupEmail, 
  sendPasswordResetEmail as sendServicePasswordResetEmail 
} from './emailService';
import { showPaymentSuccessToast } from './postPayment';
import { startBookSync, teardownBookSync } from './bookSyncManager';


export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  name?: string;
  photoURL: string | null;
  emailVerified: boolean;
  plan: 'free' | 'starter' | 'pro' | 'agency' | 'lifetime';
  currency: string;
  country: string;
  onboardingComplete?: boolean;
  isDemo?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  userDoc: UserDocument | null;
  isLoading: boolean;
  isInitialized: boolean;
  authError: string | null;

  // Actions
  updateUserData: (data: Partial<UserDocument> & Partial<AuthUser>) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  setDemoUser: (user?: Partial<AuthUser>) => Promise<void>;
  completeOnboarding: (data: {
    name?: string;
    bookTypes?: string[];
    publishingGoal?: string;
    defaultAuthorName?: string;
    defaultLanguage?: string;
    defaultTrimSize?: string;
  }) => Promise<void>;
  clearError: () => void;
}

/**
 * Converts Firebase auth error codes into friendly user messages
 */
export function getFriendlyAuthErrorMessage(errorCodeOrMsg: string): string {
  if (!errorCodeOrMsg) return 'An unexpected error occurred. Please try again.';

  const ERROR_MESSAGES: Record<string, string> = {
    'auth/wrong-password': 'Incorrect password. Try again.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/network-request-failed': 'Connection error. Check your internet.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/invalid-login-credentials': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before completing.',
    'auth/popup-blocked': 'Sign-in popup was blocked by your browser. Please allow popups for this site.',
    'auth/unauthorized-domain': 'This domain is not authorized. Please add it to Authorized Domains in Firebase Console > Authentication > Settings.',
    'auth/operation-not-allowed': 'Authentication provider is not enabled in Firebase Console.',
  };

  for (const [code, friendlyMsg] of Object.entries(ERROR_MESSAGES)) {
    if (errorCodeOrMsg.includes(code)) {
      return friendlyMsg;
    }
  }

  return errorCodeOrMsg.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/.*\)\.?$/, '');
}

// Session sync helper to server endpoint
async function notifyServerSession(idToken?: string, isLogout = false) {
  try {
    if (isLogout) {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } else if (idToken) {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
    }
  } catch (err) {
    // Non-blocking
    console.debug('Session sync notice:', err);
  }
}

// Global active snapshot listener reference
let unsubscribeUserSnapshot: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => {
  let unsubscribeAuth: (() => void) | null = null;

  const setupUserDocListener = (uid: string) => {
    if (unsubscribeUserSnapshot) {
      unsubscribeUserSnapshot();
      unsubscribeUserSnapshot = null;
    }
    if (!isFirebaseConfigured || !db) return;

    try {
      unsubscribeUserSnapshot = onSnapshot(
        doc(db, 'users', uid),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserDocument;
            const previousPlan = get().user?.plan;

            // Synchronize authStore with fresh Firestore document
            const currentAuthUser = get().user;
            if (currentAuthUser) {
              set({
                userDoc: data,
                user: {
                  ...currentAuthUser,
                  displayName: data.name || data.displayName || currentAuthUser.displayName,
                  photoURL: data.photoURL || currentAuthUser.photoURL,
                  emailVerified: data.emailVerified ?? currentAuthUser.emailVerified,
                  plan: data.plan || currentAuthUser.plan,
                  currency: data.currency || currentAuthUser.currency,
                  country: data.country || currentAuthUser.country,
                  onboardingComplete: data.onboardingComplete ?? currentAuthUser.onboardingComplete,
                },
              });
            }

            // If plan upgraded, show celebratory toast
            if (
              previousPlan &&
              previousPlan !== data.plan &&
              data.plan !== 'free'
            ) {
              const geo = useGeoStore.getState();
              showPaymentSuccessToast(data.plan, geo.currency as any);
            }
          }
        },
        (error) => {
          console.debug('Plan real-time listener notice:', error);
        }
      );
    } catch (err) {
      console.debug('Error setting up user doc listener:', err);
    }
  };

  // Initialize Firebase Auth state listener once
  if (typeof window !== 'undefined') {
    unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const geo = useGeoStore.getState();
          const currency = geo.currency || 'USD';
          const country = geo.location?.country || 'US';

          const authUser: AuthUser = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Kindle Author',
            photoURL: fbUser.photoURL || null,
            emailVerified: fbUser.emailVerified || false,
            plan: 'free',
            currency,
            country,
            onboardingComplete: false,
          };

          // Optimistically unblock UI with basic user info immediately
          set({
            user: authUser,
            isLoading: false,
            isInitialized: true,
            authError: null,
          });

          // Fetch full user doc from cache/Firestore in non-blocking manner
          try {
            let userDoc = await getUserDocument(fbUser.uid);
            if (!userDoc) {
              userDoc = await createUserDocument(
                fbUser.uid,
                fbUser.email || '',
                fbUser.displayName || '',
                fbUser.photoURL,
                currency,
                country,
                fbUser.emailVerified
              );
            }

            if (userDoc) {
              set((state) => ({
                userDoc,
                user: state.user ? {
                  ...state.user,
                  displayName: userDoc.name || state.user.displayName,
                  photoURL: userDoc.photoURL || state.user.photoURL,
                  plan: userDoc.plan || state.user.plan,
                  currency: userDoc.currency || state.user.currency,
                  country: userDoc.country || state.user.country,
                  onboardingComplete: userDoc.onboardingComplete ?? state.user.onboardingComplete,
                } : null,
              }));
            }

            const token = await fbUser.getIdToken();
            await notifyServerSession(token);
          } catch (docErr) {
            console.debug('Background user doc load note:', docErr);
          }

          // Attach real-time Firestore document listener
          setupUserDocListener(fbUser.uid);
          startBookSync(fbUser.uid);
        } catch (err: any) {
          console.error('Error synchronizing auth state:', err);
          set({ isLoading: false, isInitialized: true });
        }
      } else {
        if (unsubscribeUserSnapshot) {
          unsubscribeUserSnapshot();
          unsubscribeUserSnapshot = null;
        }

        // Check for local demo user if in preview mode
        const localUser = localStorage.getItem('kdp_active_session_user');
        if (localUser) {
          try {
            const parsed = JSON.parse(localUser);
            const doc = await getUserDocument(parsed.uid);
            set({
              user: parsed,
              userDoc: doc,
              isLoading: false,
              isInitialized: true,
              authError: null,
            });
            startBookSync(parsed.uid);
            return;
          } catch {}
        }

        set({
          user: null,
          userDoc: null,
          isLoading: false,
          isInitialized: true,
          authError: null,
        });
        notifyServerSession(undefined, true);
        teardownBookSync();
      }
    });
  }

  return {
    user: null,
    userDoc: null,
    isLoading: true,
    isInitialized: false,
    authError: null,

    updateUserData: (data: Partial<UserDocument> & Partial<AuthUser>) => {
      const current = get().user;
      const currentDoc = get().userDoc;
      if (!current) return;
      set({
        user: {
          ...current,
          ...(data as any),
          plan: (data.plan || current.plan) as any,
        },
        userDoc: currentDoc ? { ...currentDoc, ...(data as any) } : null,
      });
    },

    clearError: () => set({ authError: null }),

    signInWithGoogle: async () => {
      set({ isLoading: true, authError: null });
      try {
        if (!isFirebaseConfigured) {
          // Preview fallback: simulate Google login smoothly (existing user → straight to dashboard)
          await get().setDemoUser({
            displayName: 'Sarah Jenkins',
            email: 'sarah.jenkins@example.com',
            photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            emailVerified: true,
            plan: 'pro',
            onboardingComplete: true,
          });
          return;
        }

        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        const geo = useGeoStore.getState();
        const currency = geo.currency || 'USD';
        const country = geo.location?.country || 'US';
        const existingDoc = await getUserDocument(fbUser.uid);
        const isNewUser = !existingDoc;

        // Google signups are pre-verified
        const userDoc = await createUserDocument(
          fbUser.uid,
          fbUser.email || '',
          fbUser.displayName || 'Kindle Author',
          fbUser.photoURL,
          currency,
          country,
          true
        );

        if (isNewUser && fbUser.email) {
          const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kdpstudio.com';
          sendWelcomeEmail({
            to: fbUser.email,
            name: fbUser.displayName || userDoc.name || 'Kindle Author',
            verificationUrl: `${appUrl}/dashboard`,
          }).catch(console.error);

          sendAdminNewSignupEmail({
            userName: fbUser.displayName || userDoc.name || 'Kindle Author',
            userEmail: fbUser.email,
            country,
            currency,
            signupMethod: 'Google',
          }).catch(console.error);
        }

        const authUser: AuthUser = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || userDoc.name,
          photoURL: fbUser.photoURL || userDoc.photoURL,
          emailVerified: true,
          plan: userDoc.plan || 'free',
          currency: userDoc.currency,
          country: userDoc.country,
          onboardingComplete: userDoc.onboardingComplete ?? false,
        };

        const token = await fbUser.getIdToken();
        await notifyServerSession(token);

        set({ user: authUser, userDoc, isLoading: false, authError: null });
      } catch (err: any) {
        console.error('Google Sign-In Error:', err);
        set({
          isLoading: false,
          authError: getFriendlyAuthErrorMessage(err.code || err.message),
        });
        throw err;
      }
    },

    signInWithEmail: async (email: string, password: string) => {
      set({ isLoading: true, authError: null });
      try {
        if (!isFirebaseConfigured) {
          // Demo fallback
          await get().setDemoUser({
            email,
            displayName: email.split('@')[0] || 'Kindle Author',
            emailVerified: true,
            plan: 'free',
            onboardingComplete: true,
          });
          return;
        }

        const cred = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = cred.user;
        const userDoc = await getUserDocument(fbUser.uid);

        const authUser: AuthUser = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || userDoc?.name || email.split('@')[0],
          photoURL: fbUser.photoURL || userDoc?.photoURL || null,
          emailVerified: fbUser.emailVerified,
          plan: userDoc?.plan || 'free',
          currency: userDoc?.currency || 'USD',
          country: userDoc?.country || 'US',
          onboardingComplete: userDoc?.onboardingComplete ?? false,
        };

        const token = await fbUser.getIdToken();
        await notifyServerSession(token);

        set({ user: authUser, userDoc, isLoading: false, authError: null });
      } catch (err: any) {
        console.error('Sign-in error:', err);
        set({
          isLoading: false,
          authError: getFriendlyAuthErrorMessage(err.code || err.message),
        });
        throw err;
      }
    },

    signUpWithEmail: async (email: string, password: string, name: string) => {
      set({ isLoading: true, authError: null });
      try {
        const geo = useGeoStore.getState();
        const currency = geo.currency || 'USD';
        const country = geo.location?.country || 'US';

        if (!isFirebaseConfigured) {
          // Demo fallback
          await get().setDemoUser({
            email,
            displayName: name || email.split('@')[0],
            emailVerified: false,
            plan: 'free',
            onboardingComplete: false,
          });
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = cred.user;

        // Set display name in Firebase Auth
        if (name) {
          await updateProfile(fbUser, { displayName: name });
        }

        // Send verification email
        try {
          await sendEmailVerification(fbUser);
        } catch (e) {
          console.warn('Verification email trigger error:', e);
        }

        // Create Firestore user document
        const userDoc = await createUserDocument(
          fbUser.uid,
          email,
          name,
          null,
          currency,
          country,
          false
        );

        // Send Welcome & Admin Signup Emails
        const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kdpstudio.com';
        sendWelcomeEmail({
          to: email,
          name: name || email.split('@')[0],
          verificationUrl: `${appUrl}/verify-email`,
        }).catch(console.error);

        sendAdminNewSignupEmail({
          userName: name || email.split('@')[0],
          userEmail: email,
          country,
          currency,
          signupMethod: 'Email',
        }).catch(console.error);

        const authUser: AuthUser = {
          uid: fbUser.uid,
          email,
          displayName: name || email.split('@')[0],
          photoURL: null,
          emailVerified: false,
          plan: 'free',
          currency,
          country,
          onboardingComplete: false,
        };

        const token = await fbUser.getIdToken();
        await notifyServerSession(token);

        set({ user: authUser, userDoc, isLoading: false, authError: null });
      } catch (err: any) {
        console.error('Sign-up error:', err);
        set({
          isLoading: false,
          authError: getFriendlyAuthErrorMessage(err.code || err.message),
        });
        throw err;
      }
    },

    signOut: async () => {
      set({ isLoading: true });
      if (unsubscribeUserSnapshot) {
        unsubscribeUserSnapshot();
        unsubscribeUserSnapshot = null;
      }
      try {
        if (isFirebaseConfigured) {
          await fbSignOut(auth);
        }
      } catch (err) {
        console.warn('Firebase signOut error:', err);
      } finally {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('kdp_active_session_user');
          localStorage.removeItem('kdp_onboarding_progress');
          localStorage.removeItem('onboarding-progress');
        }
        await notifyServerSession(undefined, true);
        set({
          user: null,
          userDoc: null,
          isLoading: false,
          authError: null,
        });
      }
    },

    sendVerificationEmail: async () => {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
    },

    sendPasswordReset: async (email: string) => {
      set({ authError: null });
      try {
        if (isFirebaseConfigured) {
          await sendPasswordResetEmail(auth, email);
        } else {
          // Simulated success
          await new Promise((resolve) => setTimeout(resolve, 800));
        }

        const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kdpstudio.com';
        sendServicePasswordResetEmail({
          to: email,
          name: email.split('@')[0] || 'Kindle Author',
          resetUrl: `${appUrl}/login?reset=true`,
          expiresInMinutes: 60,
        }).catch(console.error);
      } catch (err: any) {
        set({ authError: getFriendlyAuthErrorMessage(err.code || err.message) });
        throw err;
      }
    },

    refreshUserData: async () => {
      const currentUser = get().user;
      if (!currentUser) return;
      try {
        const userDoc = await getUserDocument(currentUser.uid);
        if (userDoc) {
          set({
            userDoc,
            user: {
              ...currentUser,
              displayName: userDoc.name || currentUser.displayName,
              plan: userDoc.plan || currentUser.plan,
              currency: userDoc.currency || currentUser.currency,
              country: userDoc.country || currentUser.country,
              emailVerified: userDoc.emailVerified ?? currentUser.emailVerified,
            },
          });
        }
      } catch (err) {
        console.error('Error refreshing user data:', err);
      }
    },

    setDemoUser: async (mockUser?: Partial<AuthUser>) => {
      const geo = useGeoStore.getState();
      const demoUid = 'kdp_author_' + Math.random().toString(36).substring(2, 9);
      const email = mockUser?.email || 'author@kdpstudio.io';
      const name = mockUser?.displayName || 'Alexander Vance';
      const currency = mockUser?.currency || geo.currency || 'USD';
      const country = mockUser?.country || geo.location?.country || 'US';

      const userDoc = await createUserDocument(
        demoUid,
        email,
        name,
        mockUser?.photoURL || null,
        currency,
        country,
        mockUser?.emailVerified ?? true
      );

      // Ensure demo user is Pro author with fresh onboarding wizard flow
      const desiredPlan = mockUser?.plan || 'pro';
      const isOnboardingComplete = mockUser?.onboardingComplete ?? false;
      await updateUserDocument(demoUid, { 
        plan: desiredPlan,
        onboardingComplete: isOnboardingComplete
      });
      userDoc.plan = desiredPlan;
      userDoc.onboardingComplete = isOnboardingComplete;

      const authUser: AuthUser = {
        uid: demoUid,
        email,
        displayName: name,
        photoURL: mockUser?.photoURL || null,
        emailVerified: mockUser?.emailVerified ?? true,
        plan: desiredPlan,
        currency,
        country,
        onboardingComplete: isOnboardingComplete,
        isDemo: true,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('kdp_active_session_user', JSON.stringify(authUser));
      }
      await notifyServerSession(undefined, false);

      set({
        user: authUser,
        userDoc: { ...userDoc, isDemo: true },
        isLoading: false,
        isInitialized: true,
        authError: null,
      });
    },

    completeOnboarding: async (data) => {
      const currentUser = get().user;
      const currentDoc = get().userDoc;
      if (!currentUser) return;

      const newSettings = {
        ...(currentDoc?.settings || {}),
        defaultAuthorName: data.defaultAuthorName ?? currentDoc?.settings?.defaultAuthorName ?? data.name ?? currentUser.displayName,
        defaultLanguage: data.defaultLanguage ?? currentDoc?.settings?.defaultLanguage ?? 'English',
        defaultTrimSize: data.defaultTrimSize ?? currentDoc?.settings?.defaultTrimSize ?? '6x9',
        defaultPaperType: currentDoc?.settings?.defaultPaperType ?? 'white',
        defaultFont: currentDoc?.settings?.defaultFont ?? 'Georgia',
        emailNotifications: currentDoc?.settings?.emailNotifications ?? true,
        weeklyDigest: currentDoc?.settings?.weeklyDigest ?? true,
        bookTypes: data.bookTypes ?? currentDoc?.settings?.bookTypes ?? [],
        publishingGoal: data.publishingGoal ?? currentDoc?.settings?.publishingGoal ?? 'business',
      };

      const patch: Partial<UserDocument> = {
        name: data.name || currentUser.displayName,
        onboardingComplete: true,
        settings: newSettings,
        updatedAt: new Date().toISOString(),
      };

      await updateUserDocument(currentUser.uid, patch);

      const updatedUser: AuthUser = {
        ...currentUser,
        displayName: data.name || currentUser.displayName,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('kdp_active_session_user', JSON.stringify(updatedUser));
        localStorage.removeItem('kdp_onboarding_progress');
      }

      set({
        user: updatedUser,
        userDoc: currentDoc ? { ...currentDoc, ...patch } : null,
      });
    },
  };
});

/**
 * Helper to determine if current session is running in View-Only Demo Mode
 */
export function isDemoUser(): boolean {
  if (typeof window === 'undefined') return false;
  const state = useAuthStore.getState();
  const user = state.user;
  const userDoc = state.userDoc;
  return Boolean(
    user?.isDemo ||
    userDoc?.isDemo ||
    user?.email === 'demo.author@kdpstudio.io' ||
    (user?.uid && user.uid.startsWith('kdp_author_'))
  );
}

/**
 * Helper to display a consistent View-Only notice for demo users attempting restricted actions
 */
export function notifyDemoRestricted(actionText?: string, onNavigate?: (route: any) => void): void {
  import('./toastStore').then(({ useToastStore }) => {
    useToastStore.getState().addToast({
      type: 'warning',
      title: 'Demo Mode (View-Only)',
      message: `You are exploring in Demo Mode. Create a free account or sign in to ${actionText || 'perform this action'} and save your work.`,
      duration: 6000,
      action: onNavigate ? {
        label: 'Create Free Account',
        onClick: () => onNavigate('signup'),
      } : undefined,
    });
  });
}
