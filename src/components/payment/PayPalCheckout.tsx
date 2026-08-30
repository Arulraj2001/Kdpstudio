/**
 * PayPal Checkout Component
 * Initiates subscription creation on the server and redirects the buyer to PayPal's approval portal.
 */

import React, { useState } from 'react';
import { PlanName, BillingCycle, Currency } from '../../types/payment';
import { useAuthStore } from '../../lib/authStore';
import { auth } from '../../lib/firebase';
import { Loader2, ShieldCheck } from 'lucide-react';
import { formatPrice } from '../../lib/geo';

interface PayPalCheckoutProps {
  plan: PlanName;
  billingCycle: BillingCycle;
  amount: number;
  currency: Currency;
  onError: (error: string) => void;
  onSuccess?: () => void;
  className?: string;
}

export const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({
  plan,
  billingCycle,
  amount,
  currency,
  onError,
  className = '',
}) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayPalPayment = async () => {
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
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch('/api/payment/paypal/create-subscription', {
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
        throw new Error(errData.error || 'Failed to create PayPal subscription');
      }

      const { approvalUrl } = await res.json();

      if (!approvalUrl) {
        throw new Error('No approval URL returned from PayPal service');
      }

      // Redirect user to PayPal checkout / approval URL
      window.location.href = approvalUrl;
    } catch (err: any) {
      console.error('[PayPalCheckout] Initiation error:', err);
      setIsLoading(false);
      onError(err.message || 'Unable to open PayPal payment page');
    }
  };

  const formattedAmount = formatPrice(amount, currency);

  return (
    <div className={`w-full ${className}`}>
      <button
        type="button"
        id="pay-paypal-button"
        onClick={handlePayPalPayment}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-slate-900 bg-[#FFC439] hover:bg-[#F2BA36] active:bg-[#E2AD30] shadow-lg shadow-amber-500/10 active:scale-[0.99] transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
            <span>Redirecting to PayPal...</span>
          </>
        ) : (
          <>
            {/* PayPal Icon SVG */}
            <svg
              className="w-5 h-5 text-[#003087]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.006.402 5.43 0 5.933 0h7.828c2.992 0 5.412.75 6.469 2.233.978 1.373.978 3.327.02 5.864-.139.37-.306.732-.501 1.082-.016.03-.033.06-.051.09-.916 1.488-2.316 2.502-4.161 3.016 1.956.494 3.019 1.83 2.593 4.025-.561 2.893-2.923 4.417-7.02 4.417H9.288a.641.641 0 0 0-.633.541l-.988 4.793a.64.64 0 0 1-.591.376z" fill="#003087" />
              <path d="M19.748 7.097c-.916 1.488-2.316 2.502-4.161 3.016 1.956.494 3.019 1.83 2.593 4.025-.561 2.893-2.923 4.417-7.02 4.417H9.288a.641.641 0 0 0-.633.541l-1.579 7.653a.641.641 0 0 1-.633-.74L9.55 12.02c.062-.499.486-.901.989-.901h3.181c3.153 0 5.617-.79 6.028-2.946.33-1.728-.506-2.835-2.023-3.076z" fill="#0079C1" />
            </svg>
            <span>Pay {formattedAmount} with PayPal</span>
          </>
        )}
      </button>

      <div className="flex flex-col items-center justify-center gap-1 mt-2.5 text-center">
        <p className="text-[11px] text-slate-500 font-medium">
          You'll be redirected to PayPal to complete your subscription
        </p>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>Secured by PayPal Payments</span>
        </div>
      </div>
    </div>
  );
};
