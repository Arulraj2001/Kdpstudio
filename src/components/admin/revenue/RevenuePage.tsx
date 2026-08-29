'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, Line, BarChart, Bar,
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { useAuthStore } from '../../../lib/authStore';
import { auth } from '../../../lib/firebase';
import type { RevenueSummary, DailyRevenueItem } from '../../../types/admin';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

const PLAN_COLORS: Record<string, string> = {
  Free: '#6b7280',
  Starter: '#3b82f6',
  Pro: '#8b5cf6',
  Agency: '#f59e0b',
  Lifetime: '#10b981',
};

const GATEWAY_COLORS: Record<string, string> = {
  RAZORPAY: '#3b82f6',
  PAYPAL: '#1d4ed8',
  UPI: '#10b981',
  BMAC: '#f59e0b',
  OTHER: '#6b7280',
};

// ── UI Subcomponents ─────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  growth,
  accent = 'text-white',
  tooltip,
}: {
  label: string;
  value: string | number;
  sub?: string;
  growth?: number;
  accent?: string;
  tooltip?: string;
}) {
  return (
    <div
      className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all shadow-sm"
      title={tooltip}
    >
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
        <p className={`text-2xl lg:text-3xl font-bold mt-1.5 ${accent}`}>{value}</p>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-xs">
        {sub && <span className="text-slate-400">{sub}</span>}
        {growth !== undefined && (
          <span
            className={`font-semibold px-1.5 py-0.5 rounded ${
              growth >= 0 ? 'text-emerald-400 bg-emerald-950/40' : 'text-red-400 bg-red-950/40'
            }`}
          >
            {growth >= 0 ? `+${growth}%` : `${growth}%`}
          </span>
        )}
      </div>
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 rounded-lg animate-pulse ${className}`} />;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function RevenuePage() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [chartDays, setChartDays] = useState<number>(90);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRevenueData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/revenue?period=${period}&days=${chartDays}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSummary(data.summary);
      setDailyRevenue(data.dailyRevenue || []);
    } catch (err: any) {
      console.error('[RevenuePage]', err);
      setError(err.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, [user, period, chartDays]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  // Compound projections
  const mrr = summary?.mrr ?? 0;
  const growthRate = Math.max(summary?.revenueGrowth ?? 0, 5) / 100; // minimum 5% for visualization
  const projected3m = mrr * Math.pow(1 + growthRate, 3);
  const projected6m = mrr * Math.pow(1 + growthRate, 6);
  const projected12m = mrr * Math.pow(1 + growthRate, 12);

  // Plan distribution for donut
  const planData = (summary?.revenueByPlan || []).map(p => ({
    name: p.plan,
    value: p.revenue,
    color: PLAN_COLORS[p.plan] || '#8b5cf6',
  }));

  // Gateway distribution for bar
  const gatewayData = (summary?.revenueByGateway || []).map(g => ({
    gateway: g.gateway,
    revenue: g.revenue,
    count: g.transactionCount,
    color: GATEWAY_COLORS[g.gateway] || '#6b7280',
  }));

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header with Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📈</span> Revenue & Performance Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time MRR, lifetime value, gateway payouts, and subscriber churn
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#1a1a2e] border border-white/10 rounded-lg p-1">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7D' },
              { id: 'month', label: '30D' },
              { id: 'year', label: '1Y' },
              { id: 'all', label: 'All' },
            ] as const
          ).map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === p.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ── 6 Key Metrics Cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <MetricCard
              label="MRR"
              value={fmt(summary?.mrr ?? 0)}
              sub="Monthly Recurring"
              growth={summary?.revenueGrowth}
              accent="text-emerald-400"
              tooltip="Monthly recurring revenue from active subscriptions"
            />
            <MetricCard
              label="ARR"
              value={fmt(summary?.arr ?? 0)}
              sub="Annualized Run Rate"
              accent="text-blue-400"
              tooltip="MRR multiplied by 12"
            />
            <MetricCard
              label="Paid Users"
              value={(summary?.activePaidUsers ?? 0).toLocaleString()}
              sub={`Starter: ${summary?.paidUsersByPlan.starter ?? 0} · Pro: ${
                summary?.paidUsersByPlan.pro ?? 0
              } · Agency: ${summary?.paidUsersByPlan.agency ?? 0}`}
              accent="text-purple-400"
            />
            <MetricCard
              label="Churn Rate"
              value={`${summary?.churnRate ?? 0}%`}
              sub={`${summary?.churnedUsers ?? 0} cancelled`}
              accent={
                (summary?.churnRate ?? 0) > 5 ? 'text-red-400' : 'text-slate-200'
              }
            />
            <MetricCard
              label="ARPU"
              value={fmt(summary?.averageRevenuePerUser ?? 0)}
              sub="Avg Revenue / User"
              accent="text-amber-400"
            />
            <MetricCard
              label="Est. LTV"
              value={fmt(summary?.lifetimeValue ?? 0)}
              sub="Est. Lifetime Value"
              accent="text-pink-400"
            />
          </>
        )}
      </section>

      {/* ── Revenue Chart (90 Days with 7D MA) ── */}
      <section className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-semibold text-white">💰 Revenue Over Time</h2>
            <p className="text-xs text-slate-400">
              Daily revenue in USD with 7-day smoothed trend line
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 rounded-lg p-1 border border-white/5">
            {[
              { days: 30, label: '30D' },
              { days: 90, label: '90D' },
              { days: 180, label: '6M' },
              { days: 365, label: '1Y' },
            ].map(tab => (
              <button
                key={tab.days}
                onClick={() => setChartDays(tab.days)}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  chartDays === tab.days
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : dailyRevenue.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
            No revenue recorded for selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyRevenue}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickFormatter={v => v.slice(5)}
                interval={Math.ceil(dailyRevenue.length / 10)}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickFormatter={v => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid #ffffff20',
                  color: '#fff',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                labelStyle={{ color: '#a78bfa' }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fill="url(#revenueGrad)"
                strokeWidth={1.5}
                name="Daily Revenue"
              />
              <Line
                type="monotone"
                dataKey="movingAvg7"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={false}
                name="7-Day Moving Avg"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* ── Plan & Gateway Breakdown Charts ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut: Revenue by Plan */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">🍩 Revenue by Subscription Plan</h2>
          <p className="text-xs text-slate-500 mb-4">Distribution across creator tiers</p>

          {loading ? (
            <Skeleton className="h-52" />
          ) : planData.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">No plan breakdown available</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-48 h-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {planData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#1a1a2e',
                        border: '1px solid #ffffff20',
                        color: '#fff',
                        borderRadius: '6px',
                      }}
                      formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 w-full space-y-2.5">
                {planData.map(p => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-slate-300 font-medium">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold">${p.value.toFixed(2)}</span>
                      <span className="text-slate-500 w-10 text-right">
                        {summary?.totalRevenue
                          ? `${((p.value / summary.totalRevenue) * 100).toFixed(0)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar: Revenue by Gateway */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">💳 Revenue by Payment Gateway</h2>
          <p className="text-xs text-slate-500 mb-4">Volume processed per provider</p>

          {loading ? (
            <Skeleton className="h-52" />
          ) : gatewayData.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">No gateway breakdown available</p>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={gatewayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="gateway" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid #ffffff20',
                    color: '#fff',
                    borderRadius: '6px',
                  }}
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {gatewayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ── Churn Analysis & Cancellation Reasons ── */}
      <section className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">📉 Churn Analysis & Feedback</h2>
            <p className="text-xs text-slate-500">
              Why authors cancel their subscription and churn breakdown
            </p>
          </div>
          <span className="text-xs bg-red-950/40 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full font-semibold">
            {summary?.churnRate ?? 0}% Churn Rate
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reason Bars */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Cancellation Reasons
            </p>
            {(summary?.cancellationReasons || []).map(r => (
              <div key={r.reason} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">{r.reason}</span>
                  <span className="text-slate-400 font-semibold">{r.percentage}% ({r.count})</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${r.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Cancelled Subscriptions Table */}
          <div className="lg:col-span-2 overflow-x-auto">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Recent Cancellations
            </p>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 uppercase">
                  <th className="pb-2">User</th>
                  <th className="pb-2">Plan</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Reason</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {(summary?.cancelledSubscriptions || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No cancellations in this period 🎉
                    </td>
                  </tr>
                ) : (
                  summary?.cancelledSubscriptions.map(s => (
                    <tr key={s.id} className="hover:bg-white/5">
                      <td className="py-2.5 font-medium text-white">{s.userName}</td>
                      <td className="py-2.5 capitalize">{s.plan}</td>
                      <td className="py-2.5">${s.amount.toFixed(2)}</td>
                      <td className="py-2.5 text-red-300">{s.reason}</td>
                      <td className="py-2.5 text-slate-500">
                        {new Date(s.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Revenue Projections ── */}
      <section className="bg-gradient-to-br from-[#1e1b4b] to-[#1a1a2e] border border-purple-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🔮</span>
          <h2 className="text-base font-semibold text-white">Revenue Projections</h2>
          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
            Compound Model
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          At an estimated <strong className="text-purple-300">{Math.round(growthRate * 100)}%</strong> monthly growth rate based on current momentum:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3.5">
            <p className="text-xs text-slate-400">In 3 Months</p>
            <p className="text-xl font-bold text-white mt-1">{fmt(projected3m)}/mo</p>
            <p className="text-[10px] text-slate-500 mt-0.5">~{fmt(projected3m * 12)} ARR</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3.5">
            <p className="text-xs text-slate-400">In 6 Months</p>
            <p className="text-xl font-bold text-purple-300 mt-1">{fmt(projected6m)}/mo</p>
            <p className="text-[10px] text-slate-500 mt-0.5">~{fmt(projected6m * 12)} ARR</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3.5">
            <p className="text-xs text-slate-400">In 12 Months</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{fmt(projected12m)}/mo</p>
            <p className="text-[10px] text-slate-500 mt-0.5">~{fmt(projected12m * 12)} ARR</p>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 italic mt-3">
          ℹ️ Disclaimer: Projection only — not a guarantee. MRR is calculated from active subscriptions and may vary slightly from actual gateway settlements.
        </p>
      </section>
    </div>
  );
}
