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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Feature Usage Analytics & Adoption</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Identify engagement drivers, conversion funnels, and feature popularity across creator tiers
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-white border border-slate-200/90 rounded-2xl p-1 shadow-2xs">
          {(
            [
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl px-4 py-3 text-xs font-medium shadow-xs">
          ⚠️ {error}
        </div>
      )}

      {/* ── Engagement Metrics ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Daily Active (DAU)</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1.5">
            {loading ? '…' : engagement.dau.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Active in past 24 hours</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Weekly Active (WAU)</p>
          <p className="text-2xl font-extrabold text-sky-600 mt-1.5">
            {loading ? '…' : engagement.wau.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Active in past 7 days</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Monthly Active (MAU)</p>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1.5">
            {loading ? '…' : engagement.mau.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Active in past 30 days</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">DAU / MAU Stickiness</p>
          <p className="text-2xl font-extrabold text-violet-600 mt-1.5">
            {loading ? '…' : `${engagement.stickinessRatio}%`}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">10–20% is SaaS benchmark</p>
        </div>
      </section>

      {/* ── Top Features Bar Chart ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">🔥 Top Features by Usage Frequency</h3>
            <p className="text-xs text-slate-500">Total recorded user interactions in selected period</p>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"/> Writing</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"/> Export</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"/> Puzzles</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"/> Research</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500"/> Analytics</span>
          </div>
        </div>

        {loading ? (
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
        ) : topFeatures.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 text-center font-medium">No feature interactions recorded yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={topFeatures}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                width={135}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
                formatter={(val: any, name: any, item: any) => [
                  `${val} uses (${item?.payload?.percentageOfUsers ?? 0}% of users)`,
                  'Volume',
                ]}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {topFeatures.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[entry.category] || '#64748b'}
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
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">👥 Feature Usage by Subscription Plan</h3>
          <p className="text-xs text-slate-500 mb-4">Shows which features drive upgrades & retain paid users</p>

          {loading ? (
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ) : planUsage.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center font-medium">No plan breakdown available</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={planUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Bar dataKey="free" fill={PLAN_BAR_COLORS.free} name="Free" radius={[3, 3, 0, 0]} />
                <Bar dataKey="starter" fill={PLAN_BAR_COLORS.starter} name="Starter" radius={[3, 3, 0, 0]} />
                <Bar dataKey="pro" fill={PLAN_BAR_COLORS.pro} name="Pro" radius={[3, 3, 0, 0]} />
                <Bar dataKey="agency" fill={PLAN_BAR_COLORS.agency} name="Agency" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Feature Conversion Funnel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">🎯 Publishing Lifecycle Funnel</h3>
          <p className="text-xs text-slate-500 mb-4">Progression from manuscript draft to print export</p>

          <div className="space-y-3.5 pt-2">
            {funnel.map((step, idx) => (
              <div key={step.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-800 font-bold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] flex items-center justify-center font-extrabold border border-indigo-200">
                      {idx + 1}
                    </span>
                    {step.name}
                  </span>
                  <span className="text-slate-500 font-medium">
                    <strong className="text-slate-900 font-bold">{step.count}</strong> creators ({step.percentage}%)
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex items-center">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                    style={{ width: `${Math.max(step.percentage, 4)}%` }}
                  />
                </div>
                {step.dropoffPercentage > 0 && (
                  <p className="text-[10px] text-rose-600 text-right font-semibold">
                    ▼ {step.dropoffPercentage}% dropoff from step 1
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── User Activity Distribution ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">📊 Creator Depth Distribution (Tools per Creator)</h3>
        <p className="text-xs text-slate-500 mb-4">
          Identifies casual single-tool users vs multi-feature power authors
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {distribution.map((b) => (
            <div key={b.bucket} className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 font-bold">{b.bucket}</p>
              <p className="text-xl font-extrabold text-slate-900 mt-1">{b.count}</p>
              <p className="text-[11px] text-indigo-700 font-bold">{b.percentage}% of base</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
