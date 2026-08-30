import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X as XIcon, 
  Sparkles, 
  CreditCard, 
  Globe, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  Zap,
  HelpCircle,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useGeoStore } from '../../lib/geoStore';
import { PRICING_TABLE, formatPrice, Currency } from '../../lib/geo';
import { PageRoute } from '../../types';
import { PlanName, BillingCycle } from '../../types/payment';
import { CurrencySelector } from '../ui/CurrencySelector';
import { useAuthStore } from '../../lib/authStore';
import { RazorpayCheckout } from '../payment/RazorpayCheckout';
import { PayPalCheckout } from '../payment/PayPalCheckout';
import { UpiPayment } from '../payment/UpiPayment';
import { BmacButton } from '../payment/BmacButton';
import { showPaymentSuccessToast } from '../../lib/postPayment';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { SEOHead } from '../seo/SEOHead';
import { JsonLd } from '../seo/JsonLd';

interface PricingPageViewProps {
  onNavigate: (route: PageRoute) => void;
}

const PRICING_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "KDP Studio Pricing",
  "description": "Pricing plans for KDP Studio",
  "url": "https://kdpstudio-aio.web.app/pricing",
  "offers": [
    {
      "@type": "Offer",
      "name": "Free Plan",
      "price": "0",
      "priceCurrency": "USD",
      "description": "1 book project, 3 AI/day"
    },
    {
      "@type": "Offer",
      "name": "Starter Plan",
      "price": "6",
      "priceCurrency": "USD",
      "billingIncrement": "P1M",
      "description": "3 book projects, 20 AI/day"
    },
    {
      "@type": "Offer",
      "name": "Pro Plan",
      "price": "18",
      "priceCurrency": "USD",
      "billingIncrement": "P1M",
      "description": "Unlimited books and AI"
    },
    {
      "@type": "Offer",
      "name": "Agency Plan",
      "price": "49",
      "priceCurrency": "USD",
      "billingIncrement": "P1M",
      "description": "5 seats, batch generator and concierge support"
    }
  ]
};

export const PricingPageView: React.FC<PricingPageViewProps> = ({ onNavigate }) => {
  const { currency, location, pricingTable, pricingOverrides, initPricingListener, fetchPricing } = useGeoStore();
  const { user } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<{ plan: PlanName; amount: number; currency: Currency } | null>(null);
  const [activeGatewayTab, setActiveGatewayTab] = useState<'paypal' | 'razorpay' | 'upi'>('razorpay');
  const [paymentNotice, setPaymentNotice] = useState<{ type: 'success' | 'cancelled' | 'error'; message: string } | null>(null);

  // Initialize and refresh real-time pricing on page mount
  useEffect(() => {
    initPricingListener?.();
    fetchPricing?.();
  }, [initPricingListener, fetchPricing]);

  const currKey = (['INR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD'].includes(currency) ? currency : 'USD') as Currency;
  const isIndia = currKey === 'INR' || location?.country === 'IN' || location?.countryName === 'India';

  // Check URL query params for payment returns
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('payment') === 'success') {
      const plan = (params.get('plan') as PlanName) || 'pro';
      showPaymentSuccessToast(plan, currKey);
      setPaymentNotice({
        type: 'success',
        message: `Your ${plan.toUpperCase()} plan is now active! All premium publishing and AI features are ready.`,
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('cancelled') === 'true') {
      setPaymentNotice({
        type: 'cancelled',
        message: 'Payment checkout was cancelled. You have not been charged.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('error')) {
      const err = params.get('error');
      setPaymentNotice({
        type: 'error',
        message: err === 'payment_failed' ? 'Payment could not be processed. Please try again or choose another payment method.' : `Payment error: ${err}`,
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [currKey]);

  useEffect(() => {
    setActiveGatewayTab(isIndia ? 'razorpay' : 'paypal');
  }, [isIndia]);
  
  const currentTable = pricingTable || PRICING_TABLE;
  const starterMonthly = currentTable.starter?.[currKey] ?? PRICING_TABLE.starter[currKey];
  const proMonthly = currentTable.pro?.[currKey] ?? PRICING_TABLE.pro[currKey];
  const agencyMonthly = currentTable.agency?.[currKey] ?? PRICING_TABLE.agency[currKey];

  let starterAnnual = Math.round(starterMonthly * 10);
  let proAnnual = Math.round(proMonthly * 10);
  let agencyAnnual = Math.round(agencyMonthly * 10);

  if (currKey === 'USD' && pricingOverrides) {
    if (pricingOverrides.starterAnnual) starterAnnual = pricingOverrides.starterAnnual;
    if (pricingOverrides.proAnnual) proAnnual = pricingOverrides.proAnnual;
    if (pricingOverrides.agencyAnnual) agencyAnnual = pricingOverrides.agencyAnnual;
  } else if (currKey === 'INR' && pricingOverrides) {
    if (pricingOverrides.starterAnnualInr) starterAnnual = pricingOverrides.starterAnnualInr;
    if (pricingOverrides.proAnnualInr) proAnnual = pricingOverrides.proAnnualInr;
    if (pricingOverrides.agencyAnnualInr) agencyAnnual = pricingOverrides.agencyAnnualInr;
  }

  const starterPrice = billingCycle === 'monthly' ? starterMonthly : starterAnnual;
  const proPrice = billingCycle === 'monthly' ? proMonthly : proAnnual;
  const agencyPrice = billingCycle === 'monthly' ? agencyMonthly : agencyAnnual;

  const faqs = [
    {
      q: 'Can I cancel anytime?',
      a: 'Yes, you can cancel directly from your account settings at any moment. Your plan remains completely active with all features until the end of your prepaid billing period.'
    },
    {
      q: 'Is there a free trial?',
      a: 'The Free plan is your trial. You can start creating your first manuscript, calculating spine dimensions, and formatting interior pages with no credit card required.'
    },
    {
      q: 'What happens when I hit my daily limit?',
      a: 'Your daily generation counters reset automatically every day at midnight UTC (00:00 UTC). You can also upgrade instantly to Starter or Pro for higher or unlimited limits.'
    },
    {
      q: 'Do you offer refunds?',
      a: 'We offer full refunds within 7 days of purchase if the platform did not work as expected or failed to export your requested format.'
    },
    {
      q: 'Can I pay in Indian Rupees?',
      a: 'Yes! Indian users are billed in INR (₹) via Razorpay with support for UPI (Google Pay, PhonePe, Paytm), Net Banking, and Indian RuPay/Mastercard/Visa cards.'
    },
    {
      q: 'What is the Lifetime deal?',
      a: 'The Lifetime deal provides permanent, one-time payment access to all Pro features with no recurring subscriptions. Available for a limited promotional window.'
    },
    {
      q: 'Do I own the books I create?',
      a: 'Yes, 100%. You retain full commercial rights, copyrights, and royalties to all manuscript interiors, PDF exports, and cover spreads you create with KDP Studio.'
    },
    {
      q: 'What AI model powers KDP Studio?',
      a: 'We use Google Gemini 2.0 Flash for lightning-fast writing and metadata generation, along with Google Imagen 3 for high-resolution cover and book illustration generation.'
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleSelectPlan = (planKey: string) => {
    if (planKey === 'free') {
      if (user) onNavigate('dashboard');
      else onNavigate('signup');
      return;
    }

    if (!user) {
      onNavigate('signup');
      return;
    }

    useCheckoutStore.getState().open(planKey as PlanName, billingCycle);
  };

  return (
    <div id="pricing-page-view" className="w-full bg-white text-slate-900 font-sans">
      <SEOHead
        title="Pricing — KDP Studio"
        description="Simple, transparent pricing for KDP Studio. Free plan available. Starter from $6/month. Pro from $18/month. No credit card required."
        canonicalPath="/pricing"
      />
      <JsonLd id="jsonld-pricing" data={PRICING_SCHEMA} />
      
      {/* Alert Banner if redirected with status */}
      {paymentNotice && (
        <div className={`w-full py-3 px-4 sm:px-6 flex items-center justify-between text-sm font-medium border-b ${
          paymentNotice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : paymentNotice.type === 'cancelled'
            ? 'bg-amber-50 text-amber-900 border-amber-200'
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {paymentNotice.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {paymentNotice.type === 'cancelled' && <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />}
              {paymentNotice.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              <span>{paymentNotice.message}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setPaymentNotice(null)}
              className="text-xs uppercase font-bold tracking-wider opacity-60 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <section className="pt-16 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Fair & Transparent
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          Start free. Upgrade when you're ready to publish more books.
        </p>

        {/* Currency Switcher + Billing Toggle */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <span>Currency:</span>
            <CurrencySelector />
          </div>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-extrabold">
                2 Months Free (Save 20%)
              </span>
            </button>
          </div>

        </div>
      </section>

      {/* 4 Plan Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          
          {/* 1. Free */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Free</h3>
                <p className="text-xs text-slate-500 mt-1">For exploring KDP publishing</p>
              </div>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {formatPrice(0, currency)}
                </span>
                <span className="text-xs text-slate-500 font-medium">/forever</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                <div className="font-bold text-slate-700">Included Features:</div>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span><strong>1</strong> Book Project</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span><strong>3</strong> AI Generations / day</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span><strong>1</strong> PDF Export / day</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Cover Builder (View only)</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">
                    <XIcon size={14} className="text-slate-300 shrink-0" />
                    <span>AI Image Generation</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">
                    <XIcon size={14} className="text-slate-300 shrink-0" />
                    <span>EPUB Kindle Export</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">
                    <XIcon size={14} className="text-slate-300 shrink-0" />
                    <span>Puzzle & Activity Books</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">
                    <XIcon size={14} className="text-slate-300 shrink-0" />
                    <span>Watermark-free Exports</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handleSelectPlan('free')}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Start Free
              </button>
            </div>
          </div>

          {/* 2. Starter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Starter</h3>
                <p className="text-xs text-slate-500 mt-1">For regular indie authors</p>
              </div>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {formatPrice(starterPrice, currency)}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {billingCycle === 'monthly' ? '/month' : '/year'}
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                <div className="font-bold text-slate-700">Included Features:</div>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span><strong>10</strong> Book Projects</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span><strong>20</strong> AI Generations / day</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span><strong>10</strong> PDF Exports / day</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Cover Builder (Basic)</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>EPUB Kindle Export</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Puzzle & Activity Books</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Watermark-free Exports</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">
                    <XIcon size={14} className="text-slate-300 shrink-0" />
                    <span>AI Image Generation</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handleSelectPlan('starter')}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm"
              >
                Start with Starter
              </button>
            </div>
          </div>

          {/* 3. Pro (Most Popular) */}
          <div className="bg-white rounded-2xl border-2 border-purple-600 p-6 flex flex-col justify-between shadow-xl relative scale-102">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-black uppercase px-3 py-0.8 rounded-full tracking-wider shadow-sm">
              Most Popular
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-purple-700 text-lg">Pro Plan</h3>
                <p className="text-xs text-slate-500 mt-1">For full-time self-publishers</p>
              </div>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {formatPrice(proPrice, currency)}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {billingCycle === 'monthly' ? '/month' : '/year'}
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                <div className="font-bold text-purple-700">Everything in Starter +</div>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-2 text-slate-900 font-semibold">
                    <Check size={14} className="text-purple-600 shrink-0" />
                    <span><strong>Unlimited</strong> Book Projects</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-900 font-semibold">
                    <Check size={14} className="text-purple-600 shrink-0" />
                    <span><strong>Unlimited</strong> AI Generations</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-900 font-semibold">
                    <Check size={14} className="text-purple-600 shrink-0" />
                    <span><strong>Unlimited</strong> PDF Exports</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-purple-600 shrink-0" />
                    <span>Cover Builder (Full Spread)</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-purple-600 shrink-0" />
                    <span><strong>Google Imagen 3</strong> AI Art</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-purple-600 shrink-0" />
                    <span>AI Language Translator</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-purple-600 shrink-0" />
                    <span>Priority Support Response</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handleSelectPlan('pro')}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all"
              >
                Start with Pro
              </button>
            </div>
          </div>

          {/* 4. Agency */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Agency</h3>
                <p className="text-xs text-slate-500 mt-1">For teams & publishing houses</p>
              </div>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {formatPrice(agencyPrice, currency)}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {billingCycle === 'monthly' ? '/month' : '/year'}
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                <div className="font-bold text-slate-700">Included Features:</div>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-2 text-slate-900 font-semibold">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span><strong>3</strong> Team Member Seats</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Everything in Pro Unlimited</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Brand Kit & Shared Style Guide</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Dedicated Account Manager</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>Custom Trim & Spine Profiles</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handleSelectPlan('agency')}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Contact Us
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Payment Methods Section */}
      <section className="bg-slate-50 py-16 border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">
              Accepted Payment Methods
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Safe, encrypted checkout with instant license activation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* India Column */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <span className="text-lg">🇮🇳</span>
                <span>India Payment Options</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Razorpay, UPI (Google Pay, PhonePe, Paytm, BHIM), all Indian Debit/Credit cards, and Net Banking.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold text-slate-700">
                <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">UPI Instant</span>
                <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">Razorpay</span>
                <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">RuPay / Visa</span>
                <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">Net Banking</span>
              </div>
            </div>

            {/* International Column */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <span className="text-lg">🌍</span>
                <span>International Payment Options</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                PayPal, Stripe, Mastercard, Visa, American Express, Apple Pay, and Google Pay in USD, GBP, EUR, CAD, AUD.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold text-slate-700">
                <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">PayPal</span>
                <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">Credit / Debit</span>
                <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">Apple Pay</span>
                <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">Stripe</span>
              </div>
            </div>

          </div>

          <div className="pt-4 max-w-2xl mx-auto">
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 text-center space-y-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900">
                  Bonus Quota Refills
                </span>
                <h4 className="text-base font-black text-slate-900">
                  Need Extra AI Generations Without Upgrading?
                </h4>
                <p className="text-xs text-slate-600">
                  Buy bonus credits that never expire via Buy Me a Coffee. 1 coffee ($6) = 50 high-priority AI generations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-1">
                <BmacButton variant="credits" showNotice={false} />
                <BmacButton variant="lifetime" showNotice={false} />
              </div>

              <p className="text-[11px] text-slate-500">
                Credits never expire and activate automatically when you use your KDP Studio account email at checkout.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 italic">
            Direct UPI payment available — contact support after signup for instant manual activation.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 sm:py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Got Questions? We Have Answers.
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left font-bold text-sm sm:text-base text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp size={18} className="text-purple-600 shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Checkout Modal */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setSelectedPlanForCheckout(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                  Secure Checkout
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-100 bg-purple-900/40 px-2 py-0.5 rounded-full">
                  {billingCycle}
                </span>
              </div>

              <h3 className="text-2xl font-black text-white capitalize">
                {selectedPlanForCheckout.plan} Plan
              </h3>
              <p className="text-xs text-purple-100 mt-1">
                Instant activation of all premium publishing and AI generation tools.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Total summary */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
                <div>
                  <div className="text-xs font-bold text-purple-900">Total Subscription</div>
                  <div className="text-[11px] text-purple-600">
                    Billed in {selectedPlanForCheckout.currency}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-purple-950">
                    {formatPrice(selectedPlanForCheckout.amount, selectedPlanForCheckout.currency)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {billingCycle === 'annual' ? 'for 12 months' : 'per month'}
                  </div>
                </div>
              </div>

              {/* Payment Gateway Selector Tabs */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-700">Select Payment Method</div>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveGatewayTab('paypal')}
                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeGatewayTab === 'paypal'
                        ? 'bg-white text-sky-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.006.402 5.43 0 5.933 0h7.828c2.992 0 5.412.75 6.469 2.233.978 1.373.978 3.327.02 5.864-.139.37-.306.732-.501 1.082-.016.03-.033.06-.051.09-.916 1.488-2.316 2.502-4.161 3.016 1.956.494 3.019 1.83 2.593 4.025-.561 2.893-2.923 4.417-7.02 4.417H9.288a.641.641 0 0 0-.633.541l-.988 4.793a.64.64 0 0 1-.591.376z" fill="#003087" />
                    </svg>
                    <span className="truncate">PayPal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveGatewayTab('razorpay')}
                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeGatewayTab === 'razorpay'
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard size={13} className="text-indigo-600 shrink-0" />
                    <span className="truncate">Razorpay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveGatewayTab('upi')}
                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeGatewayTab === 'upi'
                        ? 'bg-white text-purple-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded bg-purple-600 text-white flex items-center justify-center text-[8px] font-black shrink-0">₹</span>
                    <span className="truncate">UPI QR</span>
                  </button>
                </div>
              </div>

              {/* Active Gateway Checkout */}
              {activeGatewayTab === 'paypal' ? (
                <div className="space-y-2">
                  <PayPalCheckout
                    plan={selectedPlanForCheckout.plan}
                    billingCycle={billingCycle}
                    amount={selectedPlanForCheckout.amount}
                    currency={selectedPlanForCheckout.currency}
                    onError={(err) => {
                      setPaymentNotice({
                        type: 'error',
                        message: err,
                      });
                      setSelectedPlanForCheckout(null);
                    }}
                  />
                </div>
              ) : activeGatewayTab === 'upi' ? (
                <div className="space-y-2">
                  <UpiPayment
                    plan={selectedPlanForCheckout.plan}
                    billingCycle={billingCycle}
                    amount={selectedPlanForCheckout.currency === 'INR' 
                      ? selectedPlanForCheckout.amount 
                      : (selectedPlanForCheckout.plan === 'starter' 
                          ? starterPrice
                          : selectedPlanForCheckout.plan === 'agency'
                          ? agencyPrice
                          : proPrice)}
                    onSubmitted={() => {
                      setSelectedPlanForCheckout(null);
                      setPaymentNotice({
                        type: 'success',
                        message: 'UPI payment submitted for manual verification. We will email you once approved!',
                      });
                    }}
                    onBack={() => setSelectedPlanForCheckout(null)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <RazorpayCheckout
                    plan={selectedPlanForCheckout.plan}
                    billingCycle={billingCycle}
                    amount={selectedPlanForCheckout.currency === 'INR' 
                      ? selectedPlanForCheckout.amount 
                      : (selectedPlanForCheckout.plan === 'starter' 
                          ? starterPrice
                          : selectedPlanForCheckout.plan === 'agency'
                          ? agencyPrice
                          : proPrice)}
                    onSuccess={() => {
                      setSelectedPlanForCheckout(null);
                      onNavigate('dashboard');
                    }}
                    onError={(err) => {
                      console.warn('Checkout error:', err);
                    }}
                    onClose={() => setSelectedPlanForCheckout(null)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
