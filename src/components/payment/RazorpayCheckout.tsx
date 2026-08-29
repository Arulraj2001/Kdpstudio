/**
 * Razorpay Checkout UI Component
 * Dynamically loads Razorpay checkout.js, triggers subscription creation,
 * handles popup modal interaction, and orchestrates verification with polling.
 */

import React, { useState, useEffect } from 'react';
import { PlanName, BillingCycle } from '../../types/payment';
import { useAuthStore } from '../../lib/authStore';
import { pollUntilPlanUpgraded, showPaymentSuccessToast } from '../../lib/postPayment';
import { auth } from '../../lib/firebase';
import { Loader2, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  plan: PlanName;
  billingCycle: BillingCycle;
  amount: number; // in INR
  onSuccess: () => void;
  onError: (error: string) => void;
  onClose: () => void;
  className?: string;
}

export const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  plan,
  billingCycle,
  amount,
  onSuccess,
  onError,
  onClose,
  className = '',
}) => {
  const { user } = useAuthStore();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoadError, setScriptLoadError] = useState(false);

  // 1. Dynamically inject Razorpay Checkout Script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.Razorpay) {
      setIsScriptLoaded(true);
      return;
    }

    const scriptId = 'razorpay-checkout-script';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      existingScript.addEventListener('load', () => setIsScriptLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.warn('[RazorpayCheckout] Script load failed or blocked in environment.');
      setScriptLoadError(true);
      setIsScriptLoaded(true); // Allow fallback test simulation
    };

    document.head.appendChild(script);
  }, []);

  const handleCheckout = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const uid = user?.uid || auth.currentUser?.uid || 'guest_user';
      let idToken = '';

      if (auth.currentUser) {
        try {
          idToken = await auth.currentUser.getIdToken();
        } catch (e) {
          // ignore
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': uid,
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      // Step 1: Create Razorpay Subscription on Backend
      const createRes = await fetch('/api/payment/razorpay/create-subscription', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          plan,
          billingCycle,
          uid,
          email: user?.email,
          name: user?.displayName || user?.name || 'Author',
        }),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to initialize payment gateway');
      }

      const { subscriptionId, razorpayKeyId, isSandbox } = await createRes.json();

      // Step 2: Verification handler
      const verifyPayment = async (paymentResponse: {
        razorpay_payment_id: string;
        razorpay_subscription_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const verifyRes = await fetch('/api/payment/razorpay/verify', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...paymentResponse,
              plan,
              billingCycle,
              uid,
            }),
          });

          if (!verifyRes.ok) {
            const errJson = await verifyRes.json().catch(() => ({}));
            throw new Error(errJson.error || 'Payment signature verification failed');
          }

          // Step 3: Authoritative Polling & Notification
          await pollUntilPlanUpgraded(plan);
          showPaymentSuccessToast(plan, 'INR');
          setIsLoading(false);
          onSuccess();
        } catch (verErr: any) {
          console.error('[RazorpayCheckout] Verification Error:', verErr);
          setIsLoading(false);
          onError(verErr.message || 'Payment verification failed');
        }
      };

      // If Razorpay JS is available, trigger standard Checkout modal
      if (typeof window !== 'undefined' && window.Razorpay && !isSandbox) {
        const options = {
          key: razorpayKeyId,
          subscription_id: subscriptionId,
          name: 'KDP Studio',
          description: `${plan.toUpperCase()} Plan (${billingCycle})`,
          image: '/favicon.ico',
          prefill: {
            name: user?.displayName || user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#7c3aed',
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
              onClose();
            },
          },
          handler: (response: any) => {
            verifyPayment(response);
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          setIsLoading(false);
          onError(resp.error?.description || 'Payment transaction failed');
        });
        rzp.open();
      } else {
        // Developer / Sandbox Preview Simulation
        console.log('[RazorpayCheckout] Simulating successful test checkout flow');
        await new Promise((resolve) => setTimeout(resolve, 800));
        await verifyPayment({
          razorpay_payment_id: `pay_test_${Math.random().toString(36).substring(2, 9)}`,
          razorpay_subscription_id: subscriptionId,
          razorpay_signature: `sig_test_${Math.random().toString(36).substring(2, 9)}`,
        });
      }
    } catch (err: any) {
      console.error('[RazorpayCheckout] Checkout error:', err);
      setIsLoading(false);
      onError(err.message || 'Unable to open Razorpay checkout');
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <button
        type="button"
        id="pay-razorpay-button"
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/20 active:scale-[0.99] transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Opening payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 text-purple-200" />
            <span>Pay ₹{amount.toLocaleString('en-IN')} with Razorpay</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-2.5 text-xs text-slate-500 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Cards, NetBanking, UPI & Auto-Debit via Razorpay</span>
      </div>
    </div>
  );
};
