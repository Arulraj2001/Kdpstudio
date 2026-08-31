'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Zap,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Grid,
  Search,
  Users,
  ShieldCheck,
  Award,
  Layers,
  Crown,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  PlanTier,
  PlanLimitsConfig,
  DynamicPlanLimitsConfig,
  PLAN_LIMITS,
  FEATURE_ACCESS,
  FEATURE_LABELS,
  fetchDynamicPlanLimits,
  saveDynamicPlanLimits,
} from '../../../lib/planLimits';
import { useAuthStore } from '../../../lib/authStore';

export function PlanLimitsAdminPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active Tier Tab
  const [activeTier, setActiveTier] = useState<PlanTier>('free');

  // Full Dynamic Configuration State
  const [config, setConfig] = useState<DynamicPlanLimitsConfig>({
    version: 1,
    tiers: PLAN_LIMITS,
    featureAccess: FEATURE_ACCESS,
    growthPromo: {
      enabled: true,
      bannerText: '🎉 Special Creator Launch: Free tier upgraded with extra daily AI credits & puzzle generation!',
      extraAiGenerationsBonus: 5,
      extraBookProjectsBonus: 2,
    },
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch from Firestore on mount
  const loadLimits = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDynamicPlanLimits();
      setConfig(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch dynamic plan limits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLimits();
  }, []);

  // Handler for Quota Inputs
  const handleQuotaChange = (
    section: 'daily' | 'monthly' | 'total',
    field: string,
    value: number
  ) => {
    setConfig((prev) => {
      const currentTierConfig = prev.tiers[activeTier] || PLAN_LIMITS[activeTier] || PLAN_LIMITS.free;
      const updatedSection = {
        ...currentTierConfig[section],
        [field]: value,
      };

      return {
        ...prev,
        tiers: {
          ...prev.tiers,
          [activeTier]: {
            ...currentTierConfig,
            [section]: updatedSection,
          },
        },
      };
    });
  };

  // Handler for Feature Access Matrix
  const handleFeatureAccessChange = (featureKey: string, tier: PlanTier) => {
    setConfig((prev) => ({
      ...prev,
      featureAccess: {
        ...prev.featureAccess,
        [featureKey]: tier,
      },
    }));
  };

  // Presets
  const applyPreset = (presetName: 'growth' | 'saas' | 'strict' | 'default') => {
    if (presetName === 'growth') {
      setConfig((prev) => ({
        ...prev,
        tiers: {
          ...prev.tiers,
          free: {
            daily: {
              aiGenerations: 20,
              pdfExports: 5,
              imageGenerations: 5,
              coverExports: 5,
              puzzleGenerations: 10,
              epubExports: 2,
              nicheSearches: 10,
            },
            monthly: {
              aiGenerations: 300,
              pdfExports: 60,
              imageGenerations: 50,
            },
            total: {
              bookProjects: 5,
              bookSeries: 2,
              teamSeats: 1,
              versionHistory: 5,
            },
          },
        },
        featureAccess: {
          ...prev.featureAccess,
          puzzleGenerator: 'free',
          coloringBookGenerator: 'free',
          nicheResearch: 'free',
          epubExport: 'free',
        },
        growthPromo: {
          enabled: true,
          bannerText: '🔥 VIRAL GROWTH PROMO: Free accounts get 20 daily AI credits, 10 puzzles, and 5 active books!',
          extraAiGenerationsBonus: 10,
          extraBookProjectsBonus: 3,
        },
      }));
      showToast('🚀 Loaded "Viral Growth Mode" preset (extra limits applied)');
    } else if (presetName === 'default') {
      setConfig({
        version: config.version,
        tiers: PLAN_LIMITS,
        featureAccess: FEATURE_ACCESS,
        growthPromo: {
          enabled: true,
          bannerText: '🎉 Special Creator Launch: Free tier upgraded with extra daily AI credits & puzzle generation!',
          extraAiGenerationsBonus: 5,
          extraBookProjectsBonus: 2,
        },
      });
      showToast('🔄 Reset all limits to Canonical System Defaults');
    } else if (presetName === 'strict') {
      setConfig((prev) => ({
        ...prev,
        tiers: {
          ...prev.tiers,
          free: {
            daily: {
              aiGenerations: 2,
              pdfExports: 1,
              imageGenerations: 0,
              coverExports: 1,
              puzzleGenerations: 0,
              epubExports: 0,
              nicheSearches: 0,
            },
            monthly: {
              aiGenerations: 20,
              pdfExports: 5,
              imageGenerations: 0,
            },
            total: {
              bookProjects: 1,
              bookSeries: 0,
              teamSeats: 1,
              versionHistory: 0,
            },
          },
        },
        featureAccess: {
          ...prev.featureAccess,
          puzzleGenerator: 'starter',
          coloringBookGenerator: 'starter',
          nicheResearch: 'pro',
          epubExport: 'starter',
        },
      }));
      showToast('🔒 Loaded "Strict Trial Mode"');
    }
  };

  // Save to Firestore
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const adminEmail = user?.email || 'admin';
      await saveDynamicPlanLimits(config, adminEmail);
      showToast('✅ Dynamic plan limits and feature access matrix saved & broadcasted live!');
    } catch (err: any) {
      setError(err?.message || 'Failed to save dynamic plan limits');
    } finally {
      setSaving(false);
    }
  };

  const currentLimits = config.tiers[activeTier] || PLAN_LIMITS[activeTier] || PLAN_LIMITS.free;

  const tierColors: Record<PlanTier, { bg: string; text: string; border: string; badge: string }> = {
    free: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-900' },
    starter: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-900' },
    pro: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-900' },
    agency: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-900' },
    lifetime: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-900' },
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <RefreshCw className="animate-spin text-purple-600 mx-auto" size={28} />
        <p className="text-sm font-semibold text-slate-600">Loading dynamic plan configuration from Firestore...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-700 text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider">
              Admin Command Center
            </span>
            <span className="text-xs text-slate-400">
              v{config.version} • Last updated: {config.updatedAt ? new Date(config.updatedAt).toLocaleDateString() : 'Initial'} by {config.updatedBy || 'System'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <span>⚙️</span> Dynamic Plan Limits & Quota Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Control free tier limits, paid tier quotas, and feature gates live from Firestore. Changes take effect across all users in 0 seconds without code updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadLimits}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Reload from Firestore"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save & Broadcast Live'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Preset Fast-Actions Banner ── */}
      <div className="bg-gradient-to-r from-purple-900 to-slate-900 text-white p-5 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">
              One-Click Growth Presets
            </h3>
          </div>
          <p className="text-xs text-purple-200">
            Instantly calibrate free tier limits to acquire users or switch to balanced monetization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyPreset('growth')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-sm"
          >
            🚀 Viral Growth (Generous Free)
          </button>
          <button
            onClick={() => applyPreset('strict')}
            className="px-3.5 py-1.5 rounded-xl bg-purple-800/80 hover:bg-purple-700 text-white font-bold text-xs transition-all cursor-pointer border border-purple-600/50"
          >
            🔒 Strict Trial Mode
          </button>
          <button
            onClick={() => applyPreset('default')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all cursor-pointer border border-slate-700"
          >
            <RotateCcw size={12} className="inline mr-1" />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* ── Tier Selection Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['free', 'starter', 'pro', 'agency', 'lifetime'] as PlanTier[]).map((tier) => {
          const isActive = activeTier === tier;
          const styling = tierColors[tier];
          return (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm capitalize transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
                isActive
                  ? `${styling.bg} ${styling.text} border-2 ${styling.border} shadow-sm scale-102`
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tier === 'free' && <Sparkles size={16} className="text-emerald-600" />}
              {tier === 'starter' && <BookOpen size={16} className="text-blue-600" />}
              {tier === 'pro' && <Crown size={16} className="text-purple-600" />}
              {tier === 'agency' && <Users size={16} className="text-amber-600" />}
              {tier === 'lifetime' && <Award size={16} className="text-rose-600" />}
              <span>{tier === 'free' ? 'Free Tier (Growth-Led)' : `${tier} Plan`}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${styling.badge}`}>
                {tier === 'free' ? 'Growth' : `$${tier === 'starter' ? '6' : tier === 'pro' ? '18' : tier === 'agency' ? '49' : '129'}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Quota Editing Section for Active Tier ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Daily Quotas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Zap size={16} className="text-purple-600" />
                <span>Daily Quotas</span>
              </h3>
              <p className="text-[11px] text-slate-400">Resets automatically every midnight UTC</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
              {activeTier.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* AI Generations */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">AI Generations / Day</label>
                <button
                  type="button"
                  onClick={() => handleQuotaChange('daily', 'aiGenerations', currentLimits.daily.aiGenerations === -1 ? 15 : -1)}
                  className="text-[10px] text-purple-600 hover:underline font-bold"
                >
                  {currentLimits.daily.aiGenerations === -1 ? 'Set Limited' : 'Set Unlimited (-1)'}
                </button>
              </div>
              <input
                type="number"
                value={currentLimits.daily.aiGenerations}
                onChange={(e) => handleQuotaChange('daily', 'aiGenerations', parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:border-purple-500 outline-none"
              />
              <p className="text-[10px] text-slate-400">-1 indicates unlimited daily credits</p>
            </div>

            {/* PDF Exports */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">PDF Interior Exports / Day</label>
                <button
                  type="button"
                  onClick={() => handleQuotaChange('daily', 'pdfExports', currentLimits.daily.pdfExports === -1 ? 3 : -1)}
                  className="text-[10px] text-purple-600 hover:underline font-bold"
                >
                  {currentLimits.daily.pdfExports === -1 ? 'Set Limited' : 'Set Unlimited (-1)'}
                </button>
              </div>
              <input
                type="number"
                value={currentLimits.daily.pdfExports}
                onChange={(e) => handleQuotaChange('daily', 'pdfExports', parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:border-purple-500 outline-none"
              />
            </div>

            {/* Puzzle Generations */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Puzzle Generations / Day</label>
                <button
                  type="button"
                  onClick={() => handleQuotaChange('daily', 'puzzleGenerations', currentLimits.daily.puzzleGenerations === -1 ? 5 : -1)}
                  className="text-[10px] text-purple-600 hover:underline font-bold"
                >
                  {currentLimits.daily.puzzleGenerations === -1 ? 'Set Limited' : 'Set Unlimited (-1)'}
                </button>
              </div>
              <input
                type="number"
                value={currentLimits.daily.puzzleGenerations}
                onChange={(e) => handleQuotaChange('daily', 'puzzleGenerations', parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:border-purple-500 outline-none"
              />
            </div>

            {/* Cover Exports */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Cover Exports / Day</label>
                <button
                  type="button"
                  onClick={() => handleQuotaChange('daily', 'coverExports', currentLimits.daily.coverExports === -1 ? 3 : -1)}
                  className="text-[10px] text-purple-600 hover:underline font-bold"
                >
                  {currentLimits.daily.coverExports === -1 ? 'Set Limited' : 'Set Unlimited (-1)'}
                </button>
              </div>
              <input
                type="number"
                value={currentLimits.daily.coverExports}
                onChange={(e) => handleQuotaChange('daily', 'coverExports', parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:border-purple-500 outline-none"
              />
            </div>

            {/* ePub Exports */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">ePub Kindle Exports / Day</label>
                <button
                  type="button"
                  onClick={() => handleQuotaChange('daily', 'epubExports', currentLimits.daily.epubExports === -1 ? 1 : -1)}
                  className="text-[10px] text-purple-600 hover:underline font-bold"
                >
                  {currentLimits.daily.epubExports === -1 ? 'Set Limited' : 'Set Unlimited (-1)'}
                </button>
              </div>
              <input
                type="number"
                value={currentLimits.daily.epubExports}
                onChange={(e) => handleQuotaChange('daily', 'epubExports', parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:border-purple-500 outline-none"
              />
            </div>

            {/* Niche Searches */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">KDP Niche Searches / Day</label>
                <button
                  type="button"
                  onClick={() => handleQuotaChange('daily', 'nicheSearches', currentLimits.daily.nicheSearches === -1 ? 5 : -1)}
                  className="text-[10px] text-purple-600 hover:underline font-bold"
                >
                  {currentLimits.daily.nicheSearches === -1 ? 'Set Limited' : 'Set Unlimited (-1)'}
                </button>
              </div>
              <input
                type="number"
                value={currentLimits.daily.nicheSearches ?? 5}
                onChange={(e) => handleQuotaChange('daily', 'nicheSearches', parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Monthly Quotas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-blue-600" />
                <span>Monthly Caps</span>
              </h3>
              <p className="text-[11px] text-slate-400">Monthly billing rollover threshold</p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
              {activeTier.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Monthly AI Generations */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Monthly AI Generations</label>
                <button
                  type="button"
                  onClick={() => handleQuotaChange('monthly', 'aiGenerations', currentLimits.monthly.aiGenerations === -1 ? 150 : -1)}
                  className="text-[10px] text-blue-600 hover:underline font-bold"
                >
                  {currentLimits.monthly.aiGenerations === -1 ? 'Set Limited' : 'Set Unlimited (-1)'}
                </button>
              </div>
              <input
                type="number"
                value={currentLimits.monthly.aiGenerations}
                onChange={(e) => handleQuotaChange('monthly', 'aiGenerations', parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Monthly PDF Exports */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Monthly PDF Exports</label>
                <button
                  type="button"
                  onClick={() => handleQuotaChange('monthly', 'pdfExports', currentLimits.monthly.pdfExports === -1 ? 30 : -1)}
                  className="text-[10px] text-blue-600 hover:underline font-bold"
                >
                  {currentLimits.monthly.pdfExports === -1 ? 'Set Limited' : 'Set Unlimited (-1)'}
                </button>
              </div>
              <input
                type="number"
                value={currentLimits.monthly.pdfExports}
                onChange={(e) => handleQuotaChange('monthly', 'pdfExports', parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Monthly Image Generations */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Monthly Image Generations</label>
                <button
                  type="button"
                  onClick={() => handleQuotaChange('monthly', 'imageGenerations', currentLimits.monthly.imageGenerations === -1 ? 25 : -1)}
                  className="text-[10px] text-blue-600 hover:underline font-bold"
                >
                  {currentLimits.monthly.imageGenerations === -1 ? 'Set Limited' : 'Set Unlimited (-1)'}
                </button>
              </div>
              <input
                type="number"
                value={currentLimits.monthly.imageGenerations}
                onChange={(e) => handleQuotaChange('monthly', 'imageGenerations', parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Account Ceilings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16} className="text-emerald-600" />
                <span>Account Storage Ceilings</span>
              </h3>
              <p className="text-[11px] text-slate-400">Total concurrent assets allowed</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {activeTier.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Book Projects Limit */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Active Book Projects Limit</label>
                <button
                  type="button"
                  onClick={() => handleQuotaChange('total', 'bookProjects', currentLimits.total.bookProjects === -1 ? 3 : -1)}
                  className="text-[10px] text-emerald-600 hover:underline font-bold"
                >
                  {currentLimits.total.bookProjects === -1 ? 'Set Limited' : 'Set Unlimited (-1)'}
                </button>
              </div>
              <input
                type="number"
                value={currentLimits.total.bookProjects}
                onChange={(e) => handleQuotaChange('total', 'bookProjects', parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:border-emerald-500 outline-none"
              />
              <p className="text-[10px] text-slate-400">Total manuscripts user can store simultaneously</p>
            </div>

            {/* Book Series Limit */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Book Series Collections</label>
                <button
                  type="button"
                  onClick={() => handleQuotaChange('total', 'bookSeries', currentLimits.total.bookSeries === -1 ? 1 : -1)}
                  className="text-[10px] text-emerald-600 hover:underline font-bold"
                >
                  {currentLimits.total.bookSeries === -1 ? 'Set Limited' : 'Set Unlimited (-1)'}
                </button>
              </div>
              <input
                type="number"
                value={currentLimits.total.bookSeries}
                onChange={(e) => handleQuotaChange('total', 'bookSeries', parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Version History Limit */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Version History Snapshots</label>
              <input
                type="number"
                value={currentLimits.total.versionHistory}
                onChange={(e) => handleQuotaChange('total', 'versionHistory', parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature Access Matrix Grid ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck size={20} className="text-purple-600" />
              <span>Feature Access Matrix</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign the minimum required subscription tier to unlock each platform feature.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {Object.keys(config.featureAccess).length} Core Features
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(config.featureAccess).map(([featureKey, requiredTier]) => {
            const label = FEATURE_LABELS[featureKey] || featureKey;
            const styling = tierColors[requiredTier as PlanTier] || tierColors.free;

            return (
              <div
                key={featureKey}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-purple-200 transition-all space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${styling.badge}`}>
                      {requiredTier}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{featureKey}</p>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Minimum Tier Required:
                  </label>
                  <select
                    value={requiredTier}
                    onChange={(e) => handleFeatureAccessChange(featureKey, e.target.value as PlanTier)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="free">Free Tier (All Users)</option>
                    <option value="starter">Starter Plan ($6/mo)</option>
                    <option value="pro">Pro Plan ($18/mo)</option>
                    <option value="agency">Agency Plan ($49/mo)</option>
                    <option value="lifetime">Lifetime License</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Growth Promotional Banner Settings ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <span>Special Growth Announcement Banner</span>
            </h2>
            <p className="text-xs text-slate-500">
              Show dynamic bonus text on dashboard for Free users.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.growthPromo?.enabled ?? true}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  growthPromo: {
                    ...(prev.growthPromo || { bannerText: '', extraAiGenerationsBonus: 5, extraBookProjectsBonus: 2 }),
                    enabled: e.target.checked,
                  },
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Banner Announcement Text</label>
            <input
              type="text"
              value={config.growthPromo?.bannerText || ''}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  growthPromo: {
                    ...(prev.growthPromo || { enabled: true, extraAiGenerationsBonus: 5, extraBookProjectsBonus: 2 }),
                    bannerText: e.target.value,
                  },
                }))
              }
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:border-purple-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
