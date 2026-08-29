'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Cell
} from 'recharts';
import { auth } from '../../../lib/firebase';
import type { FeatureAnalyticsReport } from '../../../types/admin';

// ── Category Color Map ────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  writing: '#a855f7',
  export: '#3b82f6',
  puzzle: '#10b981',
  research: '#f59e0b',
  analytics: '#14b8a6',
  brand: '#ec4899',
  other: '#6b7280',
};

const PLAN_BAR_COLORS = {
  free: '#94a3b8',
  starter: '#3b82f6',
  pro: '#8b5cf6',
  agency: '#f59e0b',
};

// ── Main Component ────────────────────────────────────────────────────────────

export function FeatureUsagePage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [report, setReport] = useState<FeatureAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsageData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/system/usage?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      console.error('[FeatureUsagePage]', err);
      setError(err.message || 'Failed to load feature usage report');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  const topFeatures = report?.topFeatures || [];
  const planUsage = report?.planUsage || [];
  const funnel = report?.funnel || [];
  const distribution = report?.distribution || [];
  const engagement = report?.engagement || { dau: 0, wau: 0, mau: 0, stickinessRatio: 0 };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚡</span> Feature Usage Analytics & Adoption
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Identify engagement drivers, conversion funnels, and feature popularity across creator tiers
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-[#1a1a2e] border border-white/10 rounded-lg p-1">
          {(
            [
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* ── Engagement Metrics ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Daily Active (DAU)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {loading ? '…' : engagement.dau.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Active in past 24 hours</p>
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Weekly Active (WAU)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {loading ? '…' : engagement.wau.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Active in past 7 days</p>
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Monthly Active (MAU)</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            {loading ? '…' : engagement.mau.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Active in past 30 days</p>
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">DAU / MAU Stickiness</p>
          <p className="text-2xl font-bold text-pink-400 mt-1">
            {loading ? '…' : `${engagement.stickinessRatio}%`}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">10–20% is SaaS benchmark</p>
        </div>
      </section>

      {/* ── Top Features Bar Chart ── */}
      <section className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">🔥 Top Features by Usage Count</h2>
            <p className="text-xs text-slate-400">Total recorded user interactions in selected period</p>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"/> Writing</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"/> Export</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"/> Puzzles</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"/> Research</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500"/> Analytics</span>
          </div>
        </div>

        {loading ? (
          <div className="h-64 bg-white/5 rounded-lg animate-pulse" />
        ) : topFeatures.length === 0 ? (
          <p className="text-xs text-slate-500 py-12 text-center">No feature interactions recorded yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={topFeatures}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: '#d1d5db', fontSize: 11 }}
                width={135}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid #ffffff20',
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                formatter={(val: any, name: any, item: any) => [
                  `${val} uses (${item?.payload?.percentageOfUsers ?? 0}% of users)`,
                  'Volume',
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {topFeatures.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[entry.category] || '#6b7280'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* ── Feature Usage by Plan & Funnel ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Plan */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">👥 Feature Usage by Subscription Plan</h2>
          <p className="text-xs text-slate-400 mb-4">Shows which features drive upgrades & retain paid users</p>

          {loading ? (
            <div className="h-64 bg-white/5 rounded-lg animate-pulse" />
          ) : planUsage.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">No plan breakdown available</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={planUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#6b7280', fontSize: 9 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid #ffffff20',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="free" fill={PLAN_BAR_COLORS.free} name="Free" radius={[2, 2, 0, 0]} />
                <Bar dataKey="starter" fill={PLAN_BAR_COLORS.starter} name="Starter" radius={[2, 2, 0, 0]} />
                <Bar dataKey="pro" fill={PLAN_BAR_COLORS.pro} name="Pro" radius={[2, 2, 0, 0]} />
                <Bar dataKey="agency" fill={PLAN_BAR_COLORS.agency} name="Agency" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Feature Conversion Funnel */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">🎯 Publishing Lifecycle Conversion Funnel</h2>
          <p className="text-xs text-slate-400 mb-4">Progression from manuscript creation to print export</p>

          <div className="space-y-3 pt-2">
            {funnel.map((step, idx) => (
              <div key={step.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-600/30 text-purple-300 text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {step.name}
                  </span>
                  <span className="text-slate-400">
                    <strong className="text-white">{step.count}</strong> authors ({step.percentage}%)
                  </span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden flex items-center">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.max(step.percentage, 4)}%` }}
                  />
                </div>
                {step.dropoffPercentage > 0 && (
                  <p className="text-[10px] text-red-400/80 text-right">
                    ▼ {step.dropoffPercentage}% dropoff from step 1
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── User Activity Distribution ── */}
      <section className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-1">📊 User Depth Distribution (Features per Author)</h2>
        <p className="text-xs text-slate-400 mb-4">
          Identifies ghost accounts vs multi-feature power authors
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {distribution.map(b => (
            <div key={b.bucket} className="bg-white/5 border border-white/5 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 font-semibold">{b.bucket}</p>
              <p className="text-xl font-bold text-white mt-1">{b.count}</p>
              <p className="text-[11px] text-purple-300 font-medium">{b.percentage}% of base</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
