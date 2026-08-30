'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { auth } from '../../../lib/firebase';
import type { AppConfigData, FeatureFlagsConfig, MaintenanceConfig, PlanPricingConfig } from '../../../types/admin';

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

  const apiKeys = config?.apiKeys || {
    gemini: false,
    imagen: false,
    razorpay: false,
    paypal: false,
    resend: false,
    firebaseAdmin: false,
  };

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
      <section className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              4. Emergency Plan Pricing Override (USD & INR)
            </h2>
            <p className="text-xs text-slate-400">
              Dynamically overrides plan pricing in real-time across public pages and checkout without rebuilds
            </p>
          </div>
          <button
            onClick={() => saveSettings('update_pricing', { pricing }, 'Pricing table')}
            disabled={savingSection === 'Pricing table'}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {savingSection === 'Pricing table' ? 'Saving…' : 'Save Pricing'}
          </button>
        </div>

        {/* USD Pricing Row */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">USD ($) Pricing Overrides</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400">Starter Monthly ($)</label>
              <input
                type="number"
                value={pricing.starterMonthly || 6}
                onChange={e => setPricing(prev => ({ ...prev, starterMonthly: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Starter Annual ($)</label>
              <input
                type="number"
                value={pricing.starterAnnual || 60}
                onChange={e => setPricing(prev => ({ ...prev, starterAnnual: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Pro Monthly ($)</label>
              <input
                type="number"
                value={pricing.proMonthly || 18}
                onChange={e => setPricing(prev => ({ ...prev, proMonthly: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Pro Annual ($)</label>
              <input
                type="number"
                value={pricing.proAnnual || 180}
                onChange={e => setPricing(prev => ({ ...prev, proAnnual: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Agency Monthly ($)</label>
              <input
                type="number"
                value={pricing.agencyMonthly || 49}
                onChange={e => setPricing(prev => ({ ...prev, agencyMonthly: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Agency Annual ($)</label>
              <input
                type="number"
                value={pricing.agencyAnnual || 490}
                onChange={e => setPricing(prev => ({ ...prev, agencyAnnual: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Lifetime Deal ($)</label>
              <input
                type="number"
                value={pricing.lifetime || 129}
                onChange={e => setPricing(prev => ({ ...prev, lifetime: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* INR Pricing Row */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">INR (₹) Pricing Overrides (UPI & Razorpay)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400">Starter Monthly (₹)</label>
              <input
                type="number"
                value={pricing.starterMonthlyInr || 499}
                onChange={e => setPricing(prev => ({ ...prev, starterMonthlyInr: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Starter Annual (₹)</label>
              <input
                type="number"
                value={pricing.starterAnnualInr || 4990}
                onChange={e => setPricing(prev => ({ ...prev, starterAnnualInr: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Pro Monthly (₹)</label>
              <input
                type="number"
                value={pricing.proMonthlyInr || 1499}
                onChange={e => setPricing(prev => ({ ...prev, proMonthlyInr: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Pro Annual (₹)</label>
              <input
                type="number"
                value={pricing.proAnnualInr || 14990}
                onChange={e => setPricing(prev => ({ ...prev, proAnnualInr: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Agency Monthly (₹)</label>
              <input
                type="number"
                value={pricing.agencyMonthlyInr || 3999}
                onChange={e => setPricing(prev => ({ ...prev, agencyMonthlyInr: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Agency Annual (₹)</label>
              <input
                type="number"
                value={pricing.agencyAnnualInr || 39990}
                onChange={e => setPricing(prev => ({ ...prev, agencyAnnualInr: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Lifetime Deal (₹)</label>
              <input
                type="number"
                value={pricing.lifetimeInr || 9999}
                onChange={e => setPricing(prev => ({ ...prev, lifetimeInr: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
