'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  DollarSign,
  Eye,
  Megaphone,
  Sliders,
  Check,
  Zap,
} from 'lucide-react';
import { PageRoute } from '../../../types';
import { AdConfig, AdPositionConfig, AdPosition } from '../../../types/blog';
import { DEFAULT_AD_POSITIONS } from '../../../lib/blogUtils';

interface BlogAdSettingsPageProps {
  onNavigate: (route: PageRoute) => void;
}

export const BlogAdSettingsPage: React.FC<BlogAdSettingsPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [revalidating, setRevalidating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State
  const [globalAdsEnabled, setGlobalAdsEnabled] = useState<boolean>(false);
  const [adsensePublisherId, setAdsensePublisherId] = useState<string>('');
  const [autoAdsEnabled, setAutoAdsEnabled] = useState<boolean>(false);
  const [positions, setPositions] = useState<AdPositionConfig[]>(DEFAULT_AD_POSITIONS);
  const [totalViews, setTotalViews] = useState<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Current Ad Configuration & Analytics
  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/blog/ads');
      const data = await res.json();
      if (data?.config) {
        setGlobalAdsEnabled(Boolean(data.config.globalAdsEnabled));
        setAdsensePublisherId(data.config.adsensePublisherId || '');
        setAutoAdsEnabled(Boolean(data.config.autoAdsEnabled));
        if (Array.isArray(data.config.positions) && data.config.positions.length > 0) {
          // Merge with default positions to guarantee all 8 positions exist
          const map = new Map<string, AdPositionConfig>();
          DEFAULT_AD_POSITIONS.forEach((p) => map.set(p.id, { ...p }));
          data.config.positions.forEach((p: AdPositionConfig) => map.set(p.id, { ...p }));
          setPositions(Array.from(map.values()));
        }
      }

      // Fetch posts to compute total view count for revenue estimator
      const postRes = await fetch('/api/admin/blog/posts');
      const postData = await postRes.json();
      if (Array.isArray(postData?.posts)) {
        const sum = postData.posts.reduce((acc: number, p: any) => acc + (p.viewCount || 0), 0);
        setTotalViews(sum);
      }
    } catch (err) {
      console.error('Failed to load ad config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Validation Check: Publisher ID format
  const isPublisherIdValid = Boolean(
    adsensePublisherId && /^ca-pub-\d{16}$/i.test(adsensePublisherId.trim())
  );

  // Enabled Count & Duplication Detection
  const enabledCount = positions.filter((p) => p.enabled).length;

  const duplicateUnitIds = useMemo(() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    positions.forEach((p) => {
      if (p.adUnitId && p.adUnitId.trim()) {
        const id = p.adUnitId.trim();
        if (seen.has(id)) duplicates.add(id);
        else seen.add(id);
      }
    });
    return duplicates;
  }, [positions]);

  // Position updates
  const handleUpdatePosition = (
    id: string,
    field: keyof AdPositionConfig,
    value: any
  ) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Save Configuration to Backend
  const handleSave = async () => {
    setSaving(true);
    const payload: AdConfig = {
      globalAdsEnabled,
      adsensePublisherId: adsensePublisherId.trim(),
      autoAdsEnabled,
      positions,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    };

    try {
      const res = await fetch('/api/admin/blog/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to save configuration');
      }

      showToast('✅ Ad configuration saved successfully');
    } catch (err: any) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Force Revalidate All Cached Articles
  const handleForceRevalidate = async () => {
    setRevalidating(true);
    try {
      const res = await fetch('/api/blog/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revalidateAll: true }),
      });
      const data = await res.json();
      if (data?.revalidated) {
        showToast('🚀 Cache purged & all blog posts revalidated');
      } else {
        showToast('ℹ️ Revalidation triggered across edge nodes');
      }
    } catch {
      showToast('❌ Revalidation failed');
    } finally {
      setRevalidating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-semibold text-sm">Loading ad configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom duration-200">
          {toastMessage}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>📢</span> Google AdSense & Ad Placement
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                globalAdsEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {globalAdsEnabled ? '● Ads Live' : '○ Global Off'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Control publisher IDs, slot unit placements, and audience suppression rules
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleForceRevalidate}
            disabled={revalidating}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Purge static edge cache for all posts"
          >
            <RefreshCw size={13} className={revalidating ? 'animate-spin' : ''} />
            <span>{revalidating ? 'Revalidating...' : 'Force Revalidate'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* ── AdSense Setup Section ── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-6">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          AdSense Publisher Credentials & Master Switch
        </h2>

        {/* Missing Publisher ID Warning Box */}
        {!adsensePublisherId && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">Google AdSense account required</div>
              <p className="text-amber-800 leading-relaxed">
                Enter your AdSense Publisher ID below to serve live responsive ads. In test mode, placeholder preview blocks are shown automatically.
              </p>
              <a
                href="https://support.google.com/adsense/answer/105516"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-700 font-bold hover:underline"
              >
                <span>Find your Publisher ID in AdSense ↗</span>
              </a>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Publisher ID Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-800">AdSense Publisher ID</label>
              {adsensePublisherId && (
                <span className={`text-[10px] font-bold ${isPublisherIdValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {isPublisherIdValid ? '✅ Valid Format' : '⚠️ Format: ca-pub-1234567890123456'}
                </span>
              )}
            </div>
            <input
              type="text"
              value={adsensePublisherId}
              onChange={(e) => setAdsensePublisherId(e.target.value)}
              placeholder="ca-pub-1234567890123456"
              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none text-slate-800"
            />
          </div>

          {/* Master Global Switch */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-slate-900">Master Global Ads Switch</div>
              <div className="text-[11px] text-slate-500">Instantly enables or disables ads across all pages</div>
            </div>
            <button
              onClick={() => setGlobalAdsEnabled(!globalAdsEnabled)}
              className={`w-14 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                globalAdsEnabled ? 'bg-purple-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  globalAdsEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Auto Ads Toggle */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold text-slate-900">Enable Google Auto Ads</div>
            <div className="text-[11px] text-slate-500">Allows Google AI to dynamically insert responsive placements</div>
          </div>
          <input
            type="checkbox"
            checked={autoAdsEnabled}
            onChange={(e) => setAutoAdsEnabled(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* ── Ad Positions Manager Table ── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs space-y-0">
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Manual Ad Placements Manager ({enabledCount} active)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configure per-slot unit IDs and suppression rules
            </p>
          </div>

          {enabledCount > 3 && (
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
              ⚠️ {enabledCount} slots active (AdSense recommends max 3 per page)
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-bold uppercase border-b border-slate-100 bg-slate-50/40">
                <th className="p-3.5">Position & Location</th>
                <th className="p-3.5 min-w-[170px]">Ad Unit ID</th>
                <th className="p-3.5 text-center">Enabled</th>
                <th className="p-3.5">Hide Rules</th>
                <th className="p-3.5">Min Words</th>
                <th className="p-3.5 text-right">Status Preview</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {positions.map((pos) => {
                const isDuplicate = pos.adUnitId && duplicateUnitIds.has(pos.adUnitId.trim());

                return (
                  <tr key={pos.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Name & Location */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{pos.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{pos.description}</div>
                    </td>

                    {/* Ad Unit ID */}
                    <td className="p-3.5">
                      <input
                        type="text"
                        value={pos.adUnitId || ''}
                        onChange={(e) => handleUpdatePosition(pos.id, 'adUnitId', e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-50 border border-slate-200 outline-none text-slate-800"
                      />
                      {isDuplicate && (
                        <div className="text-[10px] text-amber-600 mt-0.5">⚠️ Duplicate unit ID</div>
                      )}
                    </td>

                    {/* Enabled Toggle */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={pos.enabled}
                        onChange={(e) => handleUpdatePosition(pos.id, 'enabled', e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                      />
                    </td>

                    {/* Hide Rules */}
                    <td className="p-3.5 space-y-1">
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(pos.hideForLoggedIn)}
                          onChange={(e) => handleUpdatePosition(pos.id, 'hideForLoggedIn', e.target.checked)}
                          className="w-3.5 h-3.5 text-purple-600 rounded"
                        />
                        <span>Logged-in users</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(pos.hideForPaidUsers)}
                          onChange={(e) => handleUpdatePosition(pos.id, 'hideForPaidUsers', e.target.checked)}
                          className="w-3.5 h-3.5 text-purple-600 rounded"
                        />
                        <span>Paid subscribers</span>
                      </label>
                    </td>

                    {/* Min Word Count */}
                    <td className="p-3.5">
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={pos.minWordCount || 0}
                        onChange={(e) => handleUpdatePosition(pos.id, 'minWordCount', parseInt(e.target.value, 10) || 0)}
                        className="w-20 px-2 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 outline-none font-mono"
                      />
                    </td>

                    {/* Status Preview */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      {!globalAdsEnabled ? (
                        <span className="text-[11px] text-slate-400 font-medium">⚫ Global Off</span>
                      ) : !pos.enabled ? (
                        <span className="text-[11px] text-slate-400 font-medium">⚫ Slot Disabled</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check size={11} />
                          <span>Will Show</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Revenue Estimate Card ── */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950 text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="text-emerald-400" size={20} />
            <h3 className="font-extrabold text-sm uppercase tracking-wider">Estimated Monthly Ad Impressions</h3>
          </div>
          <span className="text-xs text-purple-300 font-mono">
            {totalViews.toLocaleString()} total views
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="text-2xl font-black text-white">
              {(totalViews * 3).toLocaleString()}
            </div>
            <div className="text-xs text-purple-200">Estimated Monthly Ad Impressions (3 units / page)</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="text-2xl font-black text-emerald-400">
              ${Math.round((totalViews * 3 * 1.5) / 1000)} – ${Math.round((totalViews * 3 * 3.5) / 1000)} / mo
            </div>
            <div className="text-xs text-purple-200">Projected Revenue Range (at $1.50–$3.50 RPM)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
