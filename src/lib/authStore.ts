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
import { auth, googleProvider, isFirebaseConfigured } from './firebase';
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
}

interface AuthState {
  user: AuthUser | null;
  userDoc: UserDocument | null;
  isLoading: boolean;
  isInitialized: boolean;
  authError: string | null;

  // Actions
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

  if (errorCodeOrMsg.includes('auth/wrong-password') || errorCodeOrMsg.includes('auth/invalid-credential') || errorCodeOrMsg.includes('auth/invalid-login-credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (errorCodeOrMsg.includes('auth/user-not-found')) {
    return 'No account found with this email. Please sign up first.';
  }
  if (errorCodeOrMsg.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (errorCodeOrMsg.includes('auth/weak-password')) {
    return 'Password must be at least 6 characters long.';
  }
  if (errorCodeOrMsg.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (errorCodeOrMsg.includes('auth/network-request-failed')) {
    return 'Connection error. Please check your internet connection.';
  }
  if (errorCodeOrMsg.includes('auth/popup-closed-by-user')) {
    return 'Google sign-in was closed before completing.';
  }
  if (errorCodeOrMsg.includes('auth/popup-blocked')) {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
  }
  if (errorCodeOrMsg.includes('auth/unauthorized-domain')) {
    return 'This domain is not authorized. Please add it to Authorized Domains in Firebase Console > Authentication > Settings.';
  }
  if (errorCodeOrMsg.includes('auth/operation-not-allowed')) {
    return 'Authentication provider is not enabled in Firebase Console. Please enable Google or Email/Password in Firebase Auth settings.';
  }
  if (errorCodeOrMsg.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please wait a moment or reset your password.';
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

export const useAuthStore = create<AuthState>((set, get) => {
  let unsubscribeAuth: (() => void) | null = null;

  // Initialize Firebase Auth state listener once
  if (typeof window !== 'undefined') {
    unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const geo = useGeoStore.getState();
          const currency = geo.currency || 'USD';
          const country = geo.location?.country || 'US';

          // Get or create Firestore user doc
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

          const authUser: AuthUser = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || userDoc?.name || 'Kindle Author',
            photoURL: fbUser.photoURL || userDoc?.photoURL || null,
            emailVerified: fbUser.emailVerified || false,
            plan: userDoc?.plan || 'free',
            currency: userDoc?.currency || currency,
            country: userDoc?.country || country,
          };

          // Inform server of active token
          try {
            const token = await fbUser.getIdToken();
            await notifyServerSession(token);
          } catch {}

          set({
            user: authUser,
            userDoc,
            isLoading: false,
            isInitialized: true,
            authError: null,
          });
        } catch (err: any) {
          console.error('Error synchronizing auth state:', err);
          set({ isLoading: false, isInitialized: true });
        }
      } else {
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
      }
    });
  }

  return {
    user: null,
    userDoc: null,
    isLoading: true,
    isInitialized: false,
    authError: null,

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
          plan: userDoc.plan,
          currency: userDoc.currency,
          country: userDoc.country,
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
      try {
        if (isFirebaseConfigured) {
          await fbSignOut(auth);
        }
      } catch (err) {
        console.warn('Firebase signOut error:', err);
      } finally {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('kdp_active_session_user');
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
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('kdp_active_session_user', JSON.stringify(authUser));
      }
      await notifyServerSession(undefined, false);

      set({
        user: authUser,
        userDoc,
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
