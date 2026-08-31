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
import { BmacButton } from '../payment/BmacButton';
import { showPaymentSuccessToast } from '../../lib/postPayment';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { getDynamicPlanFeatures, getGrowthPromo } from '../../lib/planLimits';
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
  const [paymentNotice, setPaymentNotice] = useState<{ type: 'success' | 'cancelled' | 'error'; message: string } | null>(null);
  const growthPromo = getGrowthPromo();

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

  const handleSelectPlan = (planKey: string) => {
    if (!user) {
      onNavigate('signup');
      return;
    }

    if (planKey === 'free') {
      onNavigate('dashboard');
      return;
    }

    useCheckoutStore.getState().open(planKey as PlanName, billingCycle);
  };

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
      a: 'Yes! Indian users are billed in INR (₹) with instant support for UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking, and Indian RuPay/Mastercard/Visa cards.'
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
      a: 'We use Claude AI for lightning-fast writing and metadata generation, along with Google Imagen 3 for high-resolution cover and book illustration generation.'
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div id="pricing-page-view" className="w-full bg-white text-slate-900 font-sans">
      <SEOHead
        pageKey="pricing"
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
      <section className="pt-14 pb-8 sm:pt-16 sm:pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Fair & Transparent
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Start free. Upgrade when you're ready to publish more books.
        </p>
      </section>

      {/* ── VIRAL GROWTH PROMOTION CELEBRATION CARD ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-950 p-6 sm:p-8 text-white border border-purple-400/40 shadow-2xl shadow-purple-950/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                <span>🔥 VIRAL GROWTH PROMO</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                Free accounts get <span className="text-amber-300">20 daily AI credits</span>, <span className="text-cyan-300">10 puzzles</span>, and <span className="text-emerald-300">5 active books!</span>
              </h2>
              <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
                Take advantage of our global creator expansion. Every new free account is automatically granted boosted daily limits with zero expiration.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigate(user ? 'dashboard' : 'signup')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <span>Claim Free Creator Account</span>
                <span className="ml-1.5">→</span>
              </button>
            </div>
          </div>

          {/* 3 Highlight Metric Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/15 text-xs font-semibold">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span><strong>20 AI Generations / Day</strong> (Manuscript & Ideas)</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
              <Zap size={16} className="text-cyan-400 shrink-0" />
              <span><strong>10 Daily Puzzles</strong> (Word Search, Sudoku & Color)</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span><strong>5 Active Book Projects</strong> with 100% Royalties</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Currency Switcher + Billing Toggle (Placed below Promo Card) ── */}
      <div id="pricing-controls" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-xs">
          <span>Currency:</span>
          <CurrencySelector />
        </div>

        {/* Monthly / Annual Toggle */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-xs">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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

      {/* 4 Plan Cards */}
      <section id="pricing-cards" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 scroll-mt-20">
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
                  {getDynamicPlanFeatures('free').map((feat, idx) => (
                    <li key={idx} className={`flex items-center gap-2 ${feat.included ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                      {feat.included ? (
                        <Check size={14} className="text-emerald-600 shrink-0" />
                      ) : (
                        <XIcon size={14} className="text-slate-300 shrink-0" />
                      )}
                      <span>
                        {feat.strong ? <strong>{feat.strong}</strong> : null}
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handleSelectPlan('free')}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {user ? 'Current Plan' : 'Start Free'}
              </button>
            </div>
          </div>

          {/* 2. Starter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Starter</h3>
                <p className="text-xs text-slate-500 mt-1">For part-time self-publishers</p>
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
                  {getDynamicPlanFeatures('starter').map((feat, idx) => (
                    <li key={idx} className={`flex items-center gap-2 ${feat.included ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                      {feat.included ? (
                        <Check size={14} className="text-emerald-600 shrink-0" />
                      ) : (
                        <XIcon size={14} className="text-slate-300 shrink-0" />
                      )}
                      <span>
                        {feat.strong ? <strong>{feat.strong}</strong> : null}
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handleSelectPlan('starter')}
                className="w-full py-2.5 rounded-xl border border-purple-200 text-purple-700 font-bold text-xs hover:bg-purple-50 transition-colors cursor-pointer"
              >
                Upgrade to Starter
              </button>
            </div>
          </div>

          {/* 3. Pro (Popular) */}
          <div className="bg-gradient-to-b from-purple-900 to-indigo-950 rounded-2xl p-6 flex flex-col justify-between text-white shadow-xl shadow-purple-950/30 relative border border-purple-500/40">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
              Most Popular
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-white text-lg">Pro</h3>
                <p className="text-xs text-purple-200 mt-1">For serious indie authors</p>
              </div>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {formatPrice(proPrice, currency)}
                </span>
                <span className="text-xs text-purple-200 font-medium">
                  {billingCycle === 'monthly' ? '/month' : '/year'}
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
                <div className="font-bold text-purple-100">Everything in Starter, plus:</div>
                <ul className="space-y-2.5">
                  {getDynamicPlanFeatures('pro').map((feat, idx) => (
                    <li key={idx} className={`flex items-center gap-2 ${feat.included ? 'text-purple-100' : 'text-purple-400/60 line-through'}`}>
                      {feat.included ? (
                        <Check size={14} className="text-emerald-400 shrink-0" />
                      ) : (
                        <XIcon size={14} className="text-purple-400/40 shrink-0" />
                      )}
                      <span>
                        {feat.strong ? <strong className="text-white">{feat.strong}</strong> : null}
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handleSelectPlan('pro')}
                className="w-full py-3 rounded-xl bg-white text-purple-950 font-black text-xs hover:bg-purple-50 transition-all cursor-pointer shadow-lg hover:shadow-xl active:scale-98"
              >
                Upgrade to Pro
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
                  {getDynamicPlanFeatures('agency').map((feat, idx) => (
                    <li key={idx} className={`flex items-center gap-2 ${feat.included ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                      {feat.included ? (
                        <Check size={14} className="text-emerald-600 shrink-0" />
                      ) : (
                        <XIcon size={14} className="text-slate-300 shrink-0" />
                      )}
                      <span>
                        {feat.strong ? <strong>{feat.strong}</strong> : null}
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handleSelectPlan('agency')}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Contact Us
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── Accepted Payment Methods Section ── */}
      <section className="bg-slate-50 py-16 border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-300">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Bank-Grade 256-Bit SSL Encryption</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Accepted Payment Methods
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Safe, encrypted checkout with instant license activation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* India Column */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs hover:border-purple-300 transition-all">
              <div className="flex items-center gap-2.5 font-black text-base text-slate-900">
                <span className="text-2xl">🇮🇳</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">India Payment Options</h4>
                  <span className="text-[11px] font-medium text-slate-400">Zero surcharge • Instant access</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                UPI (Google Pay, PhonePe, Paytm, BHIM), Indian Net Banking, and Debit/Credit cards.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-bold text-slate-700">
                <span className="px-3 py-1 bg-slate-100 rounded-xl border border-slate-200">UPI Instant</span>
                <span className="px-3 py-1 bg-slate-100 rounded-xl border border-slate-200">Google Pay</span>
                <span className="px-3 py-1 bg-slate-100 rounded-xl border border-slate-200">PhonePe</span>
                <span className="px-3 py-1 bg-slate-100 rounded-xl border border-slate-200">Paytm</span>
                <span className="px-3 py-1 bg-slate-100 rounded-xl border border-slate-200">RuPay</span>
                <span className="px-3 py-1 bg-slate-100 rounded-xl border border-slate-200">Net Banking</span>
              </div>
            </div>

            {/* International Column */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs hover:border-indigo-300 transition-all">
              <div className="flex items-center gap-2.5 font-black text-base text-slate-900">
                <span className="text-2xl">🌍</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">International Payment Options</h4>
                  <span className="text-[11px] font-medium text-slate-400">Global multi-currency checkout</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stripe and Google Pay in USD, GBP, EUR, CAD, AUD with instant license activation.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-bold text-slate-700">
                <span className="px-3 py-1 bg-slate-100 rounded-xl border border-slate-200">Stripe</span>
                <span className="px-3 py-1 bg-slate-100 rounded-xl border border-slate-200">Google Pay</span>
                <span className="px-3 py-1 bg-slate-100 rounded-xl border border-slate-200">Instant Activation</span>
              </div>
            </div>

          </div>

          <div className="pt-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-b from-amber-50/90 via-amber-50/60 to-amber-100/40 border border-amber-200/90 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xs">
              <div className="space-y-1.5 max-w-xl mx-auto">
                <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 border border-amber-300">
                  Bonus Quota Refills
                </span>
                <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Need Extra AI Generations Without Upgrading?
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Buy bonus credits that never expire via Buy Me a Coffee. 1 coffee ($6) = 50 high-priority AI generations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
                <BmacButton variant="credits" showNotice={false} />
                <BmacButton variant="lifetime" showNotice={false} />
              </div>

              <p className="text-xs text-slate-500 font-medium">
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

    </div>
  );
};
