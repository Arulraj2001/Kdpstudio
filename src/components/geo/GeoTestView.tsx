import React from 'react';
import { 
  Globe, 
  CreditCard, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Info
} from 'lucide-react';
import { useGeoStore } from '../../lib/geoStore';
import { 
  SUPPORTED_CURRENCIES, 
  PRICING_TABLE, 
  Currency, 
  PlanName 
} from '../../lib/geo';

export const GeoTestView: React.FC = () => {
  const {
    location,
    currency,
    paymentMethods,
    isDetecting,
    manualOverride,
    initLocation,
    setCurrencyManually,
    resetToAutoDetection,
    getFormattedPrice
  } = useGeoStore();

  const plans: { key: PlanName; name: string; desc: string; badge?: string }[] = [
    { key: 'free', name: 'Free Tier', desc: '1 book project, basic exports' },
    { key: 'starter', name: 'Starter Plan', desc: 'Up to 3 books, standard cover generator' },
    { key: 'pro', name: 'Pro Author', desc: 'Unlimited books, full KDP AI suite & 300 DPI exports', badge: 'Most Popular' },
    { key: 'agency', name: 'Publisher Agency', desc: 'Multi-author imprint tools & bulk exports' },
    { key: 'lifetime', name: 'Lifetime Access', desc: 'Pay once, own all future updates forever', badge: 'Best Value' },
  ];

  const currentFlag = SUPPORTED_CURRENCIES.find(c => c.code === currency)?.flag || '🌐';

  return (
    <div id="geo-test-view" className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
              Phase 8A Test Suite
            </span>
            <span className="text-xs text-slate-500">· Geolocation & Currency Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            IP Geolocation & Localized Pricing Inspector
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Test real-time IP detection from ipapi.co, currency mapping, localized pricing matrix, and payment gateway routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="force-redetect-btn"
            onClick={() => initLocation(true)}
            disabled={isDetecting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={isDetecting ? 'animate-spin' : ''} />
            <span>{isDetecting ? 'Detecting IP...' : 'Force Re-detect IP'}</span>
          </button>

          {manualOverride && (
            <button
              onClick={() => resetToAutoDetection()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <span>Reset to Auto</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Detection Metrics & Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Country & IP */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Detected Country</span>
            <Globe size={18} className="text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentFlag}</span>
              <span className="text-xl font-bold text-slate-900">
                {location?.countryName || 'United States'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Country Code: <span className="font-bold text-purple-700">{location?.country || 'US'}</span> · IP: {location?.ip || 'Hidden/Local'}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              Timezone: {location?.timezone || 'UTC'}
            </p>
          </div>
        </div>

        {/* Currency & Mode */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Currency</span>
            <Zap size={18} className="text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-slate-900">{currency}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                manualOverride 
                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {manualOverride ? 'Manual Override' : 'Auto-detected'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Raw IP currency: <span className="font-mono font-medium">{location?.currency || 'USD'}</span>
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Gateways</span>
            <CreditCard size={18} className="text-indigo-600" />
          </div>
          <div className="space-y-1.5">
            {paymentMethods.map((method) => {
              const labels: Record<string, string> = {
                stripe: 'Stripe / Global Cards',
                upi: 'UPI / QR Payments (India)',
                bmac: 'Buy Me a Coffee / International',
              };
              return (
                <div key={method} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span className="capitalize">{labels[method] || method}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Manual Switcher Buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Manual Currency Testing Switcher
          </h3>
          <span className="text-xs text-slate-500">Simulate user visiting from different regions</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {SUPPORTED_CURRENCIES.map((c) => {
            const isSelected = c.code === currency;
            return (
              <button
                key={c.code}
                onClick={() => setCurrencyManually(c.code)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pricing Matrix Preview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active Pricing Table for {currency}
            </h3>
            <p className="text-xs text-slate-500">
              Real-time prices shown to users based on detected or selected currency
            </p>
          </div>
          <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
            Formatted Currency: {currency}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {plans.map((p) => {
            const priceFormatted = getFormattedPrice(p.key);
            const isPro = p.key === 'pro';
            const isLifetime = p.key === 'lifetime';

            return (
              <div
                key={p.key}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isPro 
                    ? 'bg-purple-50/50 border-purple-300 shadow-xs' 
                    : isLifetime
                    ? 'bg-amber-50/40 border-amber-300 shadow-xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                    {p.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-600 text-white">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-4">{p.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/80">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {priceFormatted}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {p.key === 'lifetime' ? 'one-time payment' : p.key === 'free' ? 'forever free' : '/month'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Location Data Inspector */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Debug Raw State Dump
            </h4>
          </div>
          <span className="text-[11px] font-mono text-purple-400">useGeoStore State</span>
        </div>
        <pre className="text-xs font-mono bg-slate-950 p-4 rounded-xl text-emerald-400 overflow-x-auto border border-slate-800">
          {JSON.stringify(
            {
              location,
              currency,
              paymentMethods,
              manualOverride,
              isDetecting,
              pricingInCurrency: {
                free: getFormattedPrice('free'),
                starter: getFormattedPrice('starter'),
                pro: getFormattedPrice('pro'),
                agency: getFormattedPrice('agency'),
                lifetime: getFormattedPrice('lifetime'),
              },
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
};
