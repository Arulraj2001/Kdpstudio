import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Lock, 
  ShieldCheck, 
  CreditCard, 
  QrCode, 
  Coffee, 
  AlertCircle, 
  ArrowRight,
  Zap,
  RotateCcw,
  BadgeCheck,
  Globe
} from 'lucide-react';
import { PlanName, BillingCycle, Currency } from '../../types/payment';
import { useAuthStore } from '../../lib/authStore';
import { useGeoStore } from '../../lib/geoStore';
import { PRICING_TABLE, formatPrice } from '../../lib/geo';
import { RazorpayCheckout } from './RazorpayCheckout';
import { PayPalCheckout } from './PayPalCheckout';
import { UpiPayment } from './UpiPayment';
import { BmacButton } from './BmacButton';
import { showPaymentSuccessToast } from '../../lib/postPayment';
import { CurrencySelector } from '../ui/CurrencySelector';

import { useCheckoutStore } from '../../lib/checkoutStore';
import { PageRoute } from '../../types';

interface CheckoutModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultPlan?: PlanName | null;
  defaultBillingCycle?: BillingCycle;
  onNavigate?: (route: PageRoute) => void;
}

const PLAN_META: Record<
  'starter' | 'pro' | 'agency',
  { name: string; tag: string; description: string; highlights: string[] }
> = {
  starter: {
    name: 'Starter',
    tag: 'Essential Tools',
    description: 'Perfect for new self-publishers launching their first books.',
    highlights: [
      '20 AI generations / day',
      '10 PDF interior & 5 cover exports',
      'Puzzle & coloring book engines',
      'Up to 10 active book projects',
    ],
  },
  pro: {
    name: 'Pro',
    tag: 'Most Popular',
    description: 'Everything you need to write, format, and scale on Amazon KDP.',
    highlights: [
      'Unlimited AI writing generations',
      '50 AI Imagen 3 cover arts / day',
      'Full KDP niche & keyword analyzer',
      'Multilingual book translation',
      'Unlimited 300 DPI CMYK exports',
    ],
  },
  agency: {
    name: 'Agency',
    tag: 'Scale & Teams',
    description: 'For power publishers, teams, and high-volume book production.',
    highlights: [
      'Everything in Pro with no limits',
      '3 Team seats with permissions',
      'Bulk interior & cover generator',
      'Commercial copyright & priority SLA',
    ],
  },
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  defaultPlan: propDefaultPlan,
  defaultBillingCycle: propDefaultBillingCycle,
  onNavigate,
}) => {
  const checkoutStore = useCheckoutStore();
  const isOpen = propIsOpen !== undefined ? propIsOpen : checkoutStore.isOpen;
  const handleClose = propOnClose || checkoutStore.close;
  const defaultPlan = propDefaultPlan || checkoutStore.defaultPlan || 'pro';
  const defaultBillingCycle = propDefaultBillingCycle || checkoutStore.defaultBillingCycle || 'monthly';

  const { user, userDoc, refreshUserData } = useAuthStore();
  const { currency } = useGeoStore();

  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'agency'>('pro');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [activePaymentTab, setActivePaymentTab] = useState<string>('default');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Sync props/store when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultPlan && (defaultPlan === 'starter' || defaultPlan === 'pro' || defaultPlan === 'agency')) {
        setSelectedPlan(defaultPlan);
      }
      if (defaultBillingCycle) {
        setBillingCycle(defaultBillingCycle);
      }
      setPaymentError(null);

      // Restore last used payment tab if applicable
      const isINR = currency === 'INR';
      const savedTab = typeof window !== 'undefined' ? localStorage.getItem('kdp_last_payment_tab') : null;
      if (savedTab) {
        setActivePaymentTab(savedTab);
      } else {
        setActivePaymentTab(isINR ? 'razorpay' : 'paypal');
      }
    }
  }, [isOpen, defaultPlan, defaultBillingCycle, currency]);

  if (!isOpen) return null;

  const isINR = currency === 'INR';

  // Calculate pricing
  const monthlyRate = PRICING_TABLE[selectedPlan][currency] || PRICING_TABLE[selectedPlan]['USD'];
  const annualRate = monthlyRate * 10; // 10 months for price of 12 (17% off)
  const currentPrice = billingCycle === 'annual' ? annualRate : monthlyRate;
  const currentPriceDisplay = formatPrice(currentPrice, currency);
  const monthlyEquivalentDisplay = billingCycle === 'annual' 
    ? formatPrice(Math.round(annualRate / 12), currency) 
    : currentPriceDisplay;

  const handleTabChange = (tab: string) => {
    setActivePaymentTab(tab);
    setPaymentError(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kdp_last_payment_tab', tab);
    }
  };

  const handlePaymentSuccess = async () => {
    showPaymentSuccessToast(selectedPlan, currency);
    await refreshUserData();
    handleClose();
  };

  return (
    <div 
      id="unified-checkout-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div 
        id="unified-checkout-modal-container"
        className="relative w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-purple-950/20 overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Top Header Strip */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Upgrade to Kindle Creator Pro
              </h2>
              <p className="text-xs text-slate-500">
                Unlock high-speed AI tools, unlimited exports, and bestseller publishing features
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CurrencySelector />
            <button
              id="checkout-close-btn"
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              aria-label="Close checkout"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Not Logged In Warning */}
        {!user && (
          <div className="p-6 text-center space-y-4 bg-amber-50/70 border-b border-amber-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto">
              <Lock size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Account Required for Upgrade
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Please log in or create your free KDP Studio account so we can bind your subscription and credits to your author profile.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href="/signup"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Sign Up First
              </a>
              <a
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
              >
                Log In
              </a>
            </div>
          </div>
        )}

        {/* Modal Main Body Grid (Left: Plan Selector, Right: Payment Methods) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          
          {/* ─────────────────────────────────────────
              LEFT COLUMN: Plan Selector (approx 35%)
             ───────────────────────────────────────── */}
          <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  1. Choose Your Plan
                </h3>

                {/* Billing Toggle (Monthly / Annual) */}
                <div className="inline-flex items-center p-0.5 bg-slate-200/80 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                      billingCycle === 'annual'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded-full">
                      -17%
                    </span>
                  </button>
                </div>
              </div>

              {/* Plan Cards Stack */}
              <div className="space-y-3">
                {(['starter', 'pro', 'agency'] as const).map((planKey) => {
                  const meta = PLAN_META[planKey];
                  const isSelected = selectedPlan === planKey;
                  const mPrice = PRICING_TABLE[planKey][currency] || PRICING_TABLE[planKey]['USD'];
                  const aPrice = mPrice * 10;
                  const priceToShow = billingCycle === 'annual' ? aPrice : mPrice;

                  return (
                    <div
                      key={planKey}
                      onClick={() => setSelectedPlan(planKey)}
                      className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-purple-600 shadow-md shadow-purple-600/10 ring-2 ring-purple-600/20'
                          : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      {planKey === 'pro' && (
                        <div className="absolute -top-2.5 right-4 bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          <Sparkles size={10} />
                          <span>Most Popular</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900">{meta.name}</span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              • {meta.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {meta.description}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-base font-black text-slate-900">
                            {formatPrice(priceToShow, currency)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            /{billingCycle === 'annual' ? 'year' : 'month'}
                          </div>
                        </div>
                      </div>

                      {/* Selected Highlights */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                          {meta.highlights.map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                              <Check size={13} className="text-purple-600 shrink-0" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Summary Box */}
            <div className="bg-purple-900 text-white rounded-2xl p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-purple-200">Due Today:</span>
                <div className="text-right">
                  <span className="text-2xl font-black">{currentPriceDisplay}</span>
                  <span className="text-xs text-purple-300 font-medium">
                    /{billingCycle === 'annual' ? 'year' : 'month'}
                  </span>
                </div>
              </div>
              {billingCycle === 'annual' && (
                <div className="text-[11px] text-amber-300 font-bold flex items-center justify-between border-t border-purple-800/80 pt-1.5">
                  <span>Equivalent to {monthlyEquivalentDisplay}/mo</span>
                  <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md">
                    2 Months Free
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────
              RIGHT COLUMN: Payment Gateways (approx 65%)
             ───────────────────────────────────────── */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Complete Payment
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Globe size={13} className="text-purple-600" />
                  <span>Showing gateways for <strong>{currency}</strong></span>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              {isINR ? (
                /* INR Tabs: Razorpay, UPI Direct, Buy Me a Coffee */
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTabChange('razorpay')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      activePaymentTab === 'razorpay' || activePaymentTab === 'default'
                        ? 'bg-purple-50/70 border-purple-600 ring-2 ring-purple-600/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard size={16} className="text-purple-700" />
                      <span className="text-xs font-bold text-slate-900">Razorpay</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Cards, UPI, NetBanking
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('upi')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      activePaymentTab === 'upi'
                        ? 'bg-purple-50/70 border-purple-600 ring-2 ring-purple-600/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <QrCode size={16} className="text-emerald-700" />
                      <span className="text-xs font-bold text-slate-900">UPI Direct</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      GPay / PhonePe / QR
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('bmac')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      activePaymentTab === 'bmac'
                        ? 'bg-purple-50/70 border-purple-600 ring-2 ring-purple-600/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Coffee size={16} className="text-amber-700" />
                      <span className="text-xs font-bold text-slate-900">BMaC</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Coffee / Credits
                    </p>
                  </button>
                </div>
              ) : (
                /* International Tabs: PayPal, Buy Me a Coffee Lifetime */
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTabChange('paypal')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      activePaymentTab === 'paypal' || activePaymentTab === 'default'
                        ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard size={16} className="text-blue-700" />
                      <span className="text-xs font-bold text-slate-900">PayPal / Cards</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Pay securely with PayPal account or Debit/Credit Cards
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('bmac')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      activePaymentTab === 'bmac'
                        ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Coffee size={16} className="text-amber-800" />
                      <span className="text-xs font-bold text-slate-900">Buy Me a Coffee</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      One-time lifetime access ($129) or bonus AI credits
                    </p>
                  </button>
                </div>
              )}

              {/* Error Message Box */}
              {paymentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Gateway Interactive Content Area */}
              <div className="pt-2">
                {/* 1. RAZORPAY */}
                {(activePaymentTab === 'razorpay' || (isINR && activePaymentTab === 'default')) && (
                  <div className="space-y-4">
                    <RazorpayCheckout
                      plan={selectedPlan}
                      billingCycle={billingCycle}
                      amount={currentPrice}
                      onSuccess={handlePaymentSuccess}
                      onError={(err) => setPaymentError(err)}
                      onClose={() => {}}
                    />
                  </div>
                )}

                {/* 2. UPI DIRECT */}
                {activePaymentTab === 'upi' && isINR && (
                  <div className="space-y-4">
                    <UpiPayment
                      plan={selectedPlan}
                      billingCycle={billingCycle}
                      amount={currentPrice}
                      onSubmitted={handlePaymentSuccess}
                      onBack={() => setActivePaymentTab('razorpay')}
                    />
                  </div>
                )}

                {/* 3. PAYPAL */}
                {(activePaymentTab === 'paypal' || (!isINR && activePaymentTab === 'default')) && (
                  <div className="space-y-4">
                    <PayPalCheckout
                      plan={selectedPlan}
                      billingCycle={billingCycle}
                      amount={currentPrice}
                      currency={currency}
                      onError={(err) => setPaymentError(err)}
                      onSuccess={handlePaymentSuccess}
                    />
                  </div>
                )}

                {/* 4. BUY ME A COFFEE */}
                {activePaymentTab === 'bmac' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-700" />
                        Buy Me a Coffee Options
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Supporter donations match instantly to your account. Choose between a bonus credit refill or lifetime access:
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <BmacButton variant="credits" showNotice={false} />
                      <BmacButton variant="lifetime" showNotice={true} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security Badges Footer */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  SSL Encrypted
                </span>
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <BadgeCheck size={14} className="text-purple-600" />
                  Firebase Protected
                </span>
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <RotateCcw size={14} className="text-blue-600" />
                  7-Day Refund Policy
                </span>
              </div>
              <span className="text-slate-400">Cancel anytime in 1 click</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
