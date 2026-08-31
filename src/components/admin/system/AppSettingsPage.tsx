'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { auth } from '../../../lib/firebase';
import type { AppConfigData, FeatureFlagsConfig, MaintenanceConfig, PlanPricingConfig } from '../../../types/admin';
import { 
  convertUsdToInr, 
  convertInrToUsd, 
  calculateInternationalCurrencies, 
  PRICING_TABLE, 
  PlanName 
} from '../../../lib/geo';
import { RotateCcw, Globe, Sparkles } from 'lucide-react';

export function AppSettingsPage() {
  const [config, setConfig] = useState<AppConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  // Editable states
  const [features, setFeatures] = useState<FeatureFlagsConfig>({
    puzzleGenerators: true,
    nicheResearch: true,
    bulkGenerator: true,
    contentAudit: true,
    analytics: true,
    versionHistory: true,
    aiWriting: true,
  });

  const [maintenance, setMaintenance] = useState<MaintenanceConfig>({
    enabled: false,
    message: 'KDP Studio is currently undergoing scheduled maintenance. We will be right back.',
  });

  const [pricing, setPricing] = useState<PlanPricingConfig>({
    starterMonthly: 6,
    starterAnnual: 60,
    proMonthly: 18,
    proAnnual: 180,
    agencyMonthly: 49,
    agencyAnnual: 490,
    lifetime: 129,
    starterMonthlyInr: 499,
    starterAnnualInr: 4990,
    proMonthlyInr: 1499,
    proAnnualInr: 14990,
    agencyMonthlyInr: 3999,
    agencyAnnualInr: 39990,
    lifetimeInr: 9999,
  });

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/system/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load settings');
      const data: AppConfigData = await res.json();
      setConfig(data);
      if (data.features) setFeatures(data.features);
      if (data.maintenance) setMaintenance(data.maintenance);
      if (data.pricing) setPricing(prev => ({ ...prev, ...data.pricing }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveSettings = async (action: string, payload: any, sectionName: string) => {
    setSavingSection(sectionName);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/system/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setToast(`✅ ${sectionName} updated successfully`);
      setTimeout(() => setToast(''), 3500);
      fetchConfig();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingSection(null);
    }
  };

  // Two-way interactive sync handlers
  const updateUsdPrice = (field: 'starterMonthly' | 'proMonthly' | 'agencyMonthly' | 'lifetime', val: number) => {
    const plan = (field === 'lifetime' ? 'lifetime' : field.replace('Monthly', '')) as PlanName;
    const inrVal = convertUsdToInr(plan, val);
    
    if (field === 'starterMonthly') {
      setPricing(prev => ({
        ...prev,
        starterMonthly: val,
        starterAnnual: val * 10,
        starterMonthlyInr: inrVal,
        starterAnnualInr: inrVal * 10,
      }));
    } else if (field === 'proMonthly') {
      setPricing(prev => ({
        ...prev,
        proMonthly: val,
        proAnnual: val * 10,
        proMonthlyInr: inrVal,
        proAnnualInr: inrVal * 10,
      }));
    } else if (field === 'agencyMonthly') {
      setPricing(prev => ({
        ...prev,
        agencyMonthly: val,
        agencyAnnual: val * 10,
        agencyMonthlyInr: inrVal,
        agencyAnnualInr: inrVal * 10,
      }));
    } else if (field === 'lifetime') {
      setPricing(prev => ({
        ...prev,
        lifetime: val,
        lifetimeInr: inrVal,
      }));
    }
  };

  const updateInrPrice = (field: 'starterMonthlyInr' | 'proMonthlyInr' | 'agencyMonthlyInr' | 'lifetimeInr', val: number) => {
    const plan = (field === 'lifetimeInr' ? 'lifetime' : field.replace('MonthlyInr', '')) as PlanName;
    const usdVal = convertInrToUsd(plan, val);

    if (field === 'starterMonthlyInr') {
      setPricing(prev => ({
        ...prev,
        starterMonthlyInr: val,
        starterAnnualInr: val * 10,
        starterMonthly: usdVal,
        starterAnnual: usdVal * 10,
      }));
    } else if (field === 'proMonthlyInr') {
      setPricing(prev => ({
        ...prev,
        proMonthlyInr: val,
        proAnnualInr: val * 10,
        proMonthly: usdVal,
        proAnnual: usdVal * 10,
      }));
    } else if (field === 'agencyMonthlyInr') {
      setPricing(prev => ({
        ...prev,
        agencyMonthlyInr: val,
        agencyAnnualInr: val * 10,
        agencyMonthly: usdVal,
        agencyAnnual: usdVal * 10,
      }));
    } else if (field === 'lifetimeInr') {
      setPricing(prev => ({
        ...prev,
        lifetimeInr: val,
        lifetime: usdVal,
      }));
    }
  };

  const resetToCanonicalDefaults = () => {
    setPricing({
      starterMonthly: 6,
      starterAnnual: 60,
      proMonthly: 18,
      proAnnual: 180,
      agencyMonthly: 49,
      agencyAnnual: 490,
      lifetime: 129,
      starterMonthlyInr: 499,
      starterAnnualInr: 4990,
      proMonthlyInr: 1499,
      proAnnualInr: 14990,
      agencyMonthlyInr: 3999,
      agencyAnnualInr: 39990,
      lifetimeInr: 9999,
    });
  };

  const apiKeys = config?.apiKeys || {
    gemini: false,
    imagen: false,
    razorpay: false,
    paypal: false,
    resend: false,
    firebaseAdmin: false,
  };

  // Compute live international preview rates
  const starterIntl = calculateInternationalCurrencies('starter', pricing.starterMonthly || 6);
  const proIntl = calculateInternationalCurrencies('pro', pricing.proMonthly || 18);
  const agencyIntl = calculateInternationalCurrencies('agency', pricing.agencyMonthly || 49);
  const lifetimeIntl = calculateInternationalCurrencies('lifetime', pricing.lifetime || 129);

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto relative">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e35] border border-white/10 text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>⚙️</span> Global App Configuration & Feature Flags
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Emergency kill switches, maintenance mode, pricing overrides, and integration credentials status
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* ── Dynamic Plan Limits & Quotas Callout Card ── */}
      <div className="bg-gradient-to-r from-purple-900/60 to-indigo-950/60 border border-purple-500/30 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Dynamic Plan Limits & Quota Management
            </h3>
          </div>
          <p className="text-xs text-purple-200">
            Control Free tier bonuses, daily AI credits, puzzle quotas, and feature gates live from Firestore without code changes.
          </p>
        </div>
        <a
          href="/admin/system/limits"
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
        >
          <span>Open Plan Limits Manager</span>
          <span>→</span>
        </a>
      </div>

      {/* ── 1. Feature Flags (Kill Switches) ── */}
      <section className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Platform Feature Flags (Kill Switches)
            </h2>
            <p className="text-xs text-slate-400">
              Immediately disable features without code deployment if an upstream API or bug occurs
            </p>
          </div>
          <button
            onClick={() => saveSettings('update_features', { features }, 'Feature flags')}
            disabled={savingSection === 'Feature flags'}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {savingSection === 'Feature flags' ? 'Saving…' : 'Save Flags'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          {[
            { key: 'puzzleGenerators', label: 'Puzzle & Activity Book Generators', desc: 'Word Search, Color by Number, Coloring' },
            { key: 'nicheResearch', label: 'Niche Research & Keyword Finder', desc: 'BSR Estimator and Competition Explorer' },
            { key: 'bulkGenerator', label: 'Bulk Series Batch Generation', desc: 'Large CSV automated book synthesizer' },
            { key: 'contentAudit', label: 'AI Content Audit & KDP Compliance', desc: 'Automated policy inspection' },
            { key: 'analytics', label: 'Royalty & Sales Analytics', desc: 'KDP sales log and publishing goals' },
            { key: 'versionHistory', label: 'Manuscript Version History', desc: 'Snapshots, diffs, and restore' },
            { key: 'aiWriting', label: 'AI Chapter Writing & Expansion', desc: 'Gemini 2.5 Flash chapter generation' },
          ].map(item => {
            const isEnabled = (features as any)[item.key] ?? true;
            return (
              <div
                key={item.key}
                className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-white/10 transition-colors"
              >
                <div>
                  <p className="font-semibold text-white">{item.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFeatures(prev => ({ ...prev, [item.key]: !isEnabled }))}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    isEnabled ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 2. Maintenance Mode ── */}
      <section className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Maintenance Mode & Downtime Banner
            </h2>
            <p className="text-xs text-slate-400">
              Temporarily show a friendly maintenance screen to non-admin visitors
            </p>
          </div>
          <button
            onClick={() => saveSettings('update_maintenance', { maintenance }, 'Maintenance settings')}
            disabled={savingSection === 'Maintenance settings'}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {savingSection === 'Maintenance settings' ? 'Saving…' : 'Save Maintenance'}
          </button>
        </div>

        <div className="space-y-4 pt-1 text-xs">
          <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-4">
            <div>
              <p className="font-semibold text-white">Enable Maintenance Mode</p>
              <p className="text-[11px] text-slate-400">Admin email ({auth?.currentUser?.email}) will still have full access</p>
            </div>
            <button
              type="button"
              onClick={() => setMaintenance(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                maintenance.enabled ? 'bg-red-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  maintenance.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Maintenance Notice Message</label>
            <textarea
              rows={3}
              value={maintenance.message}
              onChange={e => setMaintenance(prev => ({ ...prev, message: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none font-sans"
            />
          </div>
        </div>
      </section>

      {/* ── 3. API Keys & Credentials Status ── */}
      <section className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">
          3. API Credentials Status (Environment)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          {[
            { name: 'Google Gemini 2.5 AI', configured: apiKeys.gemini },
            { name: 'Imagen 3 Image Model', configured: apiKeys.imagen },
            { name: 'Razorpay Gateway (IN)', configured: apiKeys.razorpay },
            { name: 'PayPal REST Gateway (INTL)', configured: apiKeys.paypal },
            { name: 'Resend Transactional Email', configured: apiKeys.resend },
            { name: 'Firebase Admin SDK', configured: apiKeys.firebaseAdmin },
          ].map(k => (
            <div key={k.name} className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center justify-between">
              <span className="text-slate-300 font-medium">{k.name}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  k.configured
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                }`}
              >
                {k.configured ? 'CONFIGURED' : 'NOT DETECTED'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Plan Pricing Overrides ── */}
      <section className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <span>4. Emergency Plan Pricing Override (USD & INR Auto-Sync)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Change either USD ($) or INR (₹) — the other currency and all international rates (GBP, EUR, CAD, AUD) will auto-calculate and update in real-time.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={resetToCanonicalDefaults}
              type="button"
              className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={() => saveSettings('update_pricing', { pricing }, 'Pricing table')}
              disabled={savingSection === 'Pricing table'}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-md"
            >
              {savingSection === 'Pricing table' ? 'Saving…' : 'Save & Publish Pricing'}
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* Starter Plan Card */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-white text-sm">Starter Plan</span>
              <span className="text-[10px] text-purple-400 font-mono">10 Projects</span>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-slate-400 block mb-1">Monthly USD ($)</label>
                <input
                  type="number"
                  value={pricing.starterMonthly || 6}
                  onChange={e => updateUsdPrice('starterMonthly', Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/10 rounded px-2.5 py-1.5 text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-emerald-400 block mb-1">Monthly INR (₹)</label>
                <input
                  type="number"
                  value={pricing.starterMonthlyInr || 499}
                  onChange={e => updateInrPrice('starterMonthlyInr', Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/10 rounded px-2.5 py-1.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Annual ($)</span>
                  <span className="font-mono text-slate-300 font-bold">${pricing.starterAnnual || 60}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Annual (₹)</span>
                  <span className="font-mono text-emerald-300 font-bold">₹{pricing.starterAnnualInr || 4990}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Plan Card */}
          <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-4 space-y-3 relative shadow-inner">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
              <span className="font-bold text-purple-200 text-sm">Pro Plan</span>
              <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">POPULAR</span>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-slate-400 block mb-1">Monthly USD ($)</label>
                <input
                  type="number"
                  value={pricing.proMonthly || 18}
                  onChange={e => updateUsdPrice('proMonthly', Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/10 rounded px-2.5 py-1.5 text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-emerald-400 block mb-1">Monthly INR (₹)</label>
                <input
                  type="number"
                  value={pricing.proMonthlyInr || 1499}
                  onChange={e => updateInrPrice('proMonthlyInr', Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/10 rounded px-2.5 py-1.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="pt-2 border-t border-purple-500/20 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Annual ($)</span>
                  <span className="font-mono text-slate-300 font-bold">${pricing.proAnnual || 180}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Annual (₹)</span>
                  <span className="font-mono text-emerald-300 font-bold">₹{pricing.proAnnualInr || 14990}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Agency Plan Card */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-white text-sm">Agency Plan</span>
              <span className="text-[10px] text-indigo-400 font-mono">Teams</span>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-slate-400 block mb-1">Monthly USD ($)</label>
                <input
                  type="number"
                  value={pricing.agencyMonthly || 49}
                  onChange={e => updateUsdPrice('agencyMonthly', Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/10 rounded px-2.5 py-1.5 text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-emerald-400 block mb-1">Monthly INR (₹)</label>
                <input
                  type="number"
                  value={pricing.agencyMonthlyInr || 3999}
                  onChange={e => updateInrPrice('agencyMonthlyInr', Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/10 rounded px-2.5 py-1.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Annual ($)</span>
                  <span className="font-mono text-slate-300 font-bold">${pricing.agencyAnnual || 490}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Annual (₹)</span>
                  <span className="font-mono text-emerald-300 font-bold">₹{pricing.agencyAnnualInr || 39990}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lifetime Deal Card */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
              <span className="font-bold text-amber-300 text-sm">Lifetime Deal</span>
              <span className="text-[10px] bg-amber-500 text-black font-bold px-2 py-0.5 rounded-full">1-TIME</span>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-slate-400 block mb-1">One-Time USD ($)</label>
                <input
                  type="number"
                  value={pricing.lifetime || 129}
                  onChange={e => updateUsdPrice('lifetime', Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/10 rounded px-2.5 py-1.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-emerald-400 block mb-1">One-Time INR (₹)</label>
                <input
                  type="number"
                  value={pricing.lifetimeInr || 9999}
                  onChange={e => updateInrPrice('lifetimeInr', Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/10 rounded px-2.5 py-1.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="pt-2 border-t border-amber-500/20 text-[11px] text-slate-400">
                <span>BMaC Coffees: <strong className="text-white font-mono">{Math.ceil((pricing.lifetime || 129) / 3)}</strong></span>
              </div>
            </div>
          </div>

        </div>

        {/* Live International Rates Auto-Calculated Preview Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Globe size={15} className="text-purple-400" />
            <span>Live International Rates (Auto-Calculated from Current Inputs)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2 pr-4 font-semibold">Plan</th>
                  <th className="py-2 px-3 font-semibold">🇺🇸 USD ($)</th>
                  <th className="py-2 px-3 font-semibold">🇮🇳 INR (₹)</th>
                  <th className="py-2 px-3 font-semibold">🇬🇧 GBP (£)</th>
                  <th className="py-2 px-3 font-semibold">🇪🇺 EUR (€)</th>
                  <th className="py-2 px-3 font-semibold">🇨🇦 CAD (CA$)</th>
                  <th className="py-2 px-3 font-semibold">🇦🇺 AUD (A$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-slate-200">
                <tr>
                  <td className="py-2 pr-4 font-sans font-bold text-white">Starter</td>
                  <td className="py-2 px-3 text-purple-300 font-bold">${pricing.starterMonthly || 6}</td>
                  <td className="py-2 px-3 text-emerald-300 font-bold">₹{pricing.starterMonthlyInr || 499}</td>
                  <td className="py-2 px-3">£{starterIntl.GBP}</td>
                  <td className="py-2 px-3">€{starterIntl.EUR}</td>
                  <td className="py-2 px-3">CA${starterIntl.CAD}</td>
                  <td className="py-2 px-3">A${starterIntl.AUD}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-sans font-bold text-purple-300">Pro</td>
                  <td className="py-2 px-3 text-purple-300 font-bold">${pricing.proMonthly || 18}</td>
                  <td className="py-2 px-3 text-emerald-300 font-bold">₹{pricing.proMonthlyInr || 1499}</td>
                  <td className="py-2 px-3">£{proIntl.GBP}</td>
                  <td className="py-2 px-3">€{proIntl.EUR}</td>
                  <td className="py-2 px-3">CA${proIntl.CAD}</td>
                  <td className="py-2 px-3">A${proIntl.AUD}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-sans font-bold text-white">Agency</td>
                  <td className="py-2 px-3 text-purple-300 font-bold">${pricing.agencyMonthly || 49}</td>
                  <td className="py-2 px-3 text-emerald-300 font-bold">₹{pricing.agencyMonthlyInr || 3999}</td>
                  <td className="py-2 px-3">£{agencyIntl.GBP}</td>
                  <td className="py-2 px-3">€{agencyIntl.EUR}</td>
                  <td className="py-2 px-3">CA${agencyIntl.CAD}</td>
                  <td className="py-2 px-3">A${agencyIntl.AUD}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-sans font-bold text-amber-300">Lifetime</td>
                  <td className="py-2 px-3 text-purple-300 font-bold">${pricing.lifetime || 129}</td>
                  <td className="py-2 px-3 text-emerald-300 font-bold">₹{pricing.lifetimeInr || 9999}</td>
                  <td className="py-2 px-3">£{lifetimeIntl.GBP}</td>
                  <td className="py-2 px-3">€{lifetimeIntl.EUR}</td>
                  <td className="py-2 px-3">CA${lifetimeIntl.CAD}</td>
                  <td className="py-2 px-3">A${lifetimeIntl.AUD}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
