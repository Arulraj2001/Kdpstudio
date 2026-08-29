/**
 * Post-Payment Success Handlers & Client Polling Utilities
 * Facilitates optimistic validation, server synchronization, and author celebratory toasts.
 */

import { PlanName, Currency } from '../types/payment';
import { useAuthStore } from './authStore';
import { useToastStore } from './toastStore';
import { auth } from './firebase';
import { getUserDocument } from './userService';

/**
 * Polls the backend /api/user/plan endpoint until the user's plan matches expectedPlan.
 * @param expectedPlan Target plan expected after payment processing
 * @param maxAttempts Maximum polling iterations (default 10)
 * @param intervalMs Interval between poll attempts in milliseconds (default 3000ms)
 * @returns Promise<boolean> True if upgraded within window, false on timeout
 */
export async function pollUntilPlanUpgraded(
  expectedPlan: PlanName,
  maxAttempts: number = 10,
  intervalMs: number = 3000
): Promise<boolean> {
  const normalizedExpected = expectedPlan.toLowerCase();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const currentUser = useAuthStore.getState().user;
      const uid = currentUser?.uid || auth.currentUser?.uid;

      if (!uid) {
        // Wait and retry
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        continue;
      }

      let token = '';
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch {
          // ignore
        }
      }

      // 1. Check /api/user/plan
      const headers: Record<string, string> = {
        'x-user-id': uid,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/user/plan?uid=${encodeURIComponent(uid)}`, {
        headers,
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        const serverPlan = (data.plan || '').toLowerCase();

        if (serverPlan === normalizedExpected) {
          // Synchronize local zustand auth store
          await useAuthStore.getState().refreshUserData();
          return true;
        }
      } else {
        // Fallback: check Firestore directly
        const doc = await getUserDocument(uid);
        if (doc && doc.plan.toLowerCase() === normalizedExpected) {
          await useAuthStore.getState().refreshUserData();
          return true;
        }
      }
    } catch (err) {
      console.warn(`[postPayment] Polling attempt ${attempt} failed:`, err);
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  // Final check
  await useAuthStore.getState().refreshUserData();
  const currentPlan = (useAuthStore.getState().user?.plan || '').toLowerCase();
  return currentPlan === normalizedExpected;
}

/**
 * Displays a celebratory upgrade toast notification
 * @param plan Plan name ('starter' | 'pro' | 'agency' | 'free')
 * @param currency Currency code for reference
 */
export function showPaymentSuccessToast(plan: PlanName, currency?: Currency): void {
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const addToast = useToastStore.getState().addToast;

  addToast({
    type: 'success',
    title: 'Payment Successful',
    message: `🎉 Welcome to ${planName} plan! Your account has been upgraded with unlimited publishing tools.`,
    duration: 5000,
  });
}
