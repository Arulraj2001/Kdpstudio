/**
 * Buy Me a Coffee (BMaC) Direct Payment Component
 * Allows users to pay via Buy Me a Coffee for exact plan amounts and submit their transaction confirmation.
 */

import React, { useState } from 'react';
import { 
  Coffee, 
  ExternalLink, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  Zap,
  Check,
  HelpCircle
} from 'lucide-react';
import { PlanName, BillingCycle } from '../../types/payment';
import { useAuthStore } from '../../lib/authStore';
import { auth } from '../../lib/firebase';
import { getBmacDetailsForPlan } from '../../lib/bmac';

interface BmacPaymentProps {
  plan: PlanName;
  billingCycle: BillingCycle;
  amount: number; // in USD
  onSubmitted: () => void;
  onBack: () => void;
}

export const BmacPayment: React.FC<BmacPaymentProps> = ({
  plan,
  billingCycle,
  amount,
  onSubmitted,
  onBack,
}) => {
  const { user, refreshUserData } = useAuthStore();

  // Screen states: 1 = Instructions & Direct Link, 2 = Confirmation Submission, 3 = Success
  const [screen, setScreen] = useState<1 | 2 | 3>(1);

  // Screen 2 Form state
  const [supporterEmail, setSupporterEmail] = useState(user?.email || '');
  const [supporterName, setSupporterName] = useState(user?.displayName || user?.name || '');
  const [orderId, setOrderId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [instantMatched, setInstantMatched] = useState(false);

  const rawBmacUrl = 
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BMAC_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BMAC_URL) ||
    'https://buymeacoffee.com/x4kqsD0lkA';

  const planDetails = getBmacDetailsForPlan(plan, billingCycle, amount);
  const targetCoffees = planDetails.coffees;
  const targetAmount = planDetails.amount;

  // Build BMAC URL
  const targetUrl = new URL(rawBmacUrl);
  if (targetCoffees > 1 && !targetUrl.searchParams.has('coffees')) {
    targetUrl.searchParams.set('coffees', targetCoffees.toString());
  }

  const handleSubmitConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailToSubmit = supporterEmail.trim().toLowerCase();
    if (!emailToSubmit || !emailToSubmit.includes('@')) {
      setErrorMsg('Please enter a valid email address used for payment.');
      return;
    }

    setIsSubmitting(true);

    try {
      const uid = user?.uid || auth.currentUser?.uid || 'guest_user';
      let idToken = '';
      if (auth.currentUser) {
        try {
          idToken = await auth.currentUser.getIdToken();
        } catch {}
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch('/api/payment/bmac/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          uid,
          plan,
          billingCycle,
          amount: targetAmount,
          supporterEmail: emailToSubmit,
          supporterName: supporterName.trim(),
          orderId: orderId.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit payment confirmation');
      }

      setInstantMatched(Boolean(data.matched));
      setScreen(3);
      if (data.matched) {
        await refreshUserData();
      }
    } catch (err: any) {
      console.error('[BmacPayment] Error submitting confirmation:', err);
      setErrorMsg(err.message || 'Unable to submit payment confirmation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* ─────────────────────────────────────────
          SCREEN 1: Instructions & Direct Link
         ───────────────────────────────────────── */}
      {screen === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Coffee size={14} className="text-amber-700" />
              Pay via Buy Me a Coffee
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complete your payment on our official Buy Me a Coffee page. Once paid, click <strong>"I've Made the Payment"</strong> to confirm and activate your plan.
            </p>
          </div>

          {/* Amount & Coffee Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FFDE02] via-[#FFD700] to-[#FBBF24] border border-amber-300 shadow-sm text-slate-950 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-xs uppercase tracking-wider font-extrabold text-slate-900/80">
                  {plan.toUpperCase()} PLAN • {billingCycle.toUpperCase()}
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                  {planDetails.title}
                </div>
              </div>
              <span className="shrink-0 bg-slate-950 text-[#FFDE02] text-xs font-black px-3 py-1 rounded-full shadow-xs">
                {planDetails.badgeText}
              </span>
            </div>

            <p className="text-xs font-medium text-slate-900/80">
              {planDetails.subtitle}
            </p>

            <a
              id="bmac-open-checkout-link"
              href={targetUrl.toString()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 active:bg-black text-[#FFDE02] font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>Open Buy Me a Coffee Page</span>
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Crucial Notice */}
          <div className="flex items-start gap-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-slate-600">
            <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Crucial:</strong> Use your registered account email{' '}
              <strong className="text-slate-900 underline">
                ({user?.email || 'your account email'})
              </strong>{' '}
              on Buy Me a Coffee so your payment matches automatically.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              id="bmac-back-btn"
              onClick={onBack}
              className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <button
              type="button"
              id="bmac-proceed-to-confirmation"
              onClick={() => setScreen(2)}
              className="flex-1 py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>I've Made the Payment</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────
          SCREEN 2: Submit Confirmation / Claim
         ───────────────────────────────────────── */}
      {screen === 2 && (
        <form onSubmit={handleSubmitConfirmation} className="space-y-4 animate-in fade-in duration-200">
          <div className="text-center space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Confirm Your Payment
            </h3>
            <p className="text-xs text-slate-500">
              Enter your Buy Me a Coffee supporter email to activate your plan
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="bmac-email-input" className="block text-xs font-bold text-slate-800 mb-1">
                Supporter / Account Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="bmac-email-input"
                type="email"
                value={supporterEmail}
                onChange={(e) => setSupporterEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 text-xs font-medium text-slate-900 bg-white placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                The email you entered on the Buy Me a Coffee payment screen.
              </p>
            </div>

            <div>
              <label htmlFor="bmac-order-input" className="block text-xs font-bold text-slate-800 mb-1">
                Receipt / Order ID or Supporter Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="bmac-order-input"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. Order #123456 or Supporter Name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 text-xs font-medium text-slate-900 bg-white placeholder:text-slate-400"
              />
            </div>

            {/* Summary */}
            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-medium text-slate-700">
              <div>
                Plan: <span className="font-bold capitalize text-slate-900">{plan} ({billingCycle})</span>
              </div>
              <div>
                Amount: <span className="font-black text-purple-900">${targetAmount} ({targetCoffees} {targetCoffees === 1 ? 'Coffee' : 'Coffees'})</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setScreen(1)}
              disabled={isSubmitting}
              className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <button
              type="submit"
              id="bmac-submit-confirmation-btn"
              disabled={isSubmitting}
              className="flex-1 py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Verifying Payment...</span>
                </>
              ) : (
                <>
                  <span>Submit Payment Confirmation</span>
                  <Check size={15} />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────
          SCREEN 3: Success / Verification State
         ───────────────────────────────────────── */}
      {screen === 3 && (
        <div className="text-center space-y-4 py-3 animate-in fade-in zoom-in duration-200">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={26} />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">
              {instantMatched ? 'Payment Verified & Plan Activated!' : 'Payment Confirmation Submitted!'}
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              {instantMatched
                ? `Your ${plan.toUpperCase()} plan is now active! All publishing features and limits have been unlocked.`
                : `We received your confirmation for ${supporterEmail}. As soon as Buy Me a Coffee syncs your donation (typically within 10-30 minutes), your account will activate automatically.`}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 max-w-sm mx-auto space-y-1 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Plan:</span>
              <span className="font-bold text-slate-900 capitalize">{plan} ({billingCycle})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount:</span>
              <span className="font-bold text-slate-900">${targetAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-mono text-slate-800">{supporterEmail}</span>
            </div>
          </div>

          <button
            type="button"
            id="bmac-finish-btn"
            onClick={onSubmitted}
            className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            Done & Return to Workspace
          </button>
        </div>
      )}
    </div>
  );
};
