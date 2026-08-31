/**
 * Stripe Checkout Client Component
 * Creates a Stripe Checkout Session on the server (with the dynamic live price)
 * and redirects the buyer to Stripe's hosted payment page.
 */

import React, { useState } from 'react';
import { PlanName, BillingCycle, Currency } from '../../types/payment';
import { useAuthStore } from '../../lib/authStore';
import { auth } from '../../lib/firebase';
import { Loader2, ShieldCheck, CreditCard } from 'lucide-react';
import { formatPrice } from '../../lib/geo';

interface StripeCheckoutProps {
  plan: PlanName;
  billingCycle: BillingCycle;
  amount: number;
  currency: Currency;
  onSuccess?: () => void;
  onError: (error: string) => void;
  className?: string;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  plan,
  billingCycle,
  amount,
  currency,
  onSuccess,
  onError,
  className = '',
}) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const uid = user?.uid || auth.currentUser?.uid || 'guest_user';
      let idToken = '';
      if (auth.currentUser) {
        try {
          idToken = await auth.currentUser.getIdToken();
        } catch (e) {}
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/payment/stripe/create-checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          plan,
          billingCycle,
          currency,
          uid,
          email: user?.email,
          name: user?.displayName || user?.name,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to initialize Stripe checkout');
      }

      const data = await res.json();
      if (!data.url) throw new Error('No checkout URL returned from Stripe service');

      // Redirect the user to Stripe's hosted Checkout page
      window.location.href = data.url;
    } catch (err: any) {
      console.error('[StripeCheckout] Initiation error:', err);
      setIsLoading(false);
      onError(err.message || 'Unable to open Stripe payment page');
    }
  };

  const formattedAmount = formatPrice(amount, currency);

  return (
    <div className={`w-full ${className}`}>
      <button
        type="button"
        id="pay-stripe-button"
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-white bg-[#635BFF] hover:bg-[#5851EA] active:bg-[#5149DE] shadow-lg shadow-indigo-500/20 active:scale-[0.99] transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Redirecting to Stripe...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 text-indigo-200" />
            <span>Pay {formattedAmount} with Stripe</span>
          </>
        )}
      </button>

      <div className="flex flex-col items-center justify-center gap-1 mt-2.5 text-center">
        <p className="text-[11px] text-slate-500 font-medium">
          You'll be redirected to Stripe to complete your subscription
        </p>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Secured by Stripe</span>
        </div>
      </div>
    </div>
  );
};