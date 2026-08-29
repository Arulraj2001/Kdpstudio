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
  accent = 'text-slate-900',
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
      className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shadow-xs"
      title={tooltip}
    >
      <div>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</p>
        <p className={`text-2xl lg:text-3xl font-extrabold mt-1.5 tracking-tight ${accent}`}>{value}</p>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
        {sub && <span className="text-slate-500 font-medium">{sub}</span>}
        {growth !== undefined && (
          <span
            className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
              growth >= 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'
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
  return <div className={`bg-slate-200/80 rounded-2xl animate-pulse ${className}`} />;
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header with period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Revenue & Financial Analytics</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time MRR, lifetime value, gateway volume, and growth projections
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-white border border-slate-200/90 rounded-2xl p-1 shadow-2xs">
          {(['today', 'week', 'month', 'year', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                period === p
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-4 py-3 text-sm shadow-xs">
          ℹ️ {error} — showing live client ledger
        </div>
      )}

      {/* ── Key Metrics Grid ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <MetricCard
              label="MRR"
              value={fmt(summary?.mrr ?? 0)}
              sub="Monthly Recurring Revenue"
              growth={summary?.revenueGrowth}
              accent="text-emerald-600"
              tooltip="Sum of all active recurring subscription tiers"
            />
            <MetricCard
              label="Net Period Revenue"
              value={fmt(summary?.netRevenue ?? 0)}
              sub={`Gross: ${fmt(summary?.totalRevenue ?? 0)}`}
              accent="text-slate-900"
            />
            <MetricCard
              label="Refunds & Disputes"
              value={fmt(summary?.refundsAmount ?? 0)}
              sub={`${summary?.refundsCount ?? 0} refunded orders`}
              accent={(summary?.refundsAmount ?? 0) > 0 ? 'text-amber-600' : 'text-slate-400'}
            />
            <MetricCard
              label="ARR"
              value={fmt(summary?.arr ?? 0)}
              sub="Annualized Run Rate"
              accent="text-indigo-600"
              tooltip="MRR multiplied by 12"
            />
            <MetricCard
              label="Active Paid Users"
              value={(summary?.activePaidUsers ?? 0).toLocaleString()}
              sub={`Starter: ${summary?.paidUsersByPlan.starter ?? 0} · Pro: ${
                summary?.paidUsersByPlan.pro ?? 0
              } · Agency: ${summary?.paidUsersByPlan.agency ?? 0}`}
              accent="text-sky-600"
            />
            <MetricCard
              label="Monthly Churn Rate"
              value={`${summary?.churnRate ?? 0}%`}
              sub={`${summary?.churnedUsers ?? 0} cancelled accounts`}
              accent={
                (summary?.churnRate ?? 0) > 5 ? 'text-rose-600' : 'text-slate-900'
              }
            />
            <MetricCard
              label="ARPU"
              value={fmt(summary?.averageRevenuePerUser ?? 0)}
              sub="Avg Revenue Per User"
              accent="text-slate-900"
            />
            <MetricCard
              label="Est. Lifetime Value"
              value={fmt(summary?.lifetimeValue ?? 0)}
              sub="Projected LTV / User"
              accent="text-violet-600"
            />
          </>
        )}
      </section>

      {/* ── Revenue Chart (90 Days with 7D MA) ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">💰 Revenue Trajectory Over Time</h3>
            <p className="text-xs text-slate-500">
              Daily revenue in USD with 7-day smoothed trend line
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200">
            {[
              { days: 30, label: '30D' },
              { days: 90, label: '90D' },
              { days: 180, label: '6M' },
              { days: 365, label: '1Y' },
            ].map((tab) => (
              <button
                key={tab.days}
                onClick={() => setChartDays(tab.days)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  chartDays === tab.days
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
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
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm font-medium">
            No revenue recorded for selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyRevenue}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
                interval={Math.ceil(dailyRevenue.length / 10)}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) => `$${v}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  color: '#0f172a',
                }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                labelStyle={{ fontWeight: 700, color: '#0f172a' }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px', fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fill="url(#revenueGrad)"
                strokeWidth={2}
                name="Daily Revenue"
              />
              <Line
                type="monotone"
                dataKey="movingAvg7"
                stroke="#6366f1"
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
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">🍩 Revenue by Subscription Plan</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution across creator tiers</p>

          {loading ? (
            <Skeleton className="h-52" />
          ) : planData.length === 0 ? (
            <p className="text-sm text-slate-400 py-12 text-center font-medium">No plan breakdown available</p>
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
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                      formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 w-full space-y-2.5">
                {planData.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-slate-700 font-semibold">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-900 font-bold">${p.value.toFixed(2)}</span>
                      <span className="text-slate-400 font-medium w-10 text-right">
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
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">💳 Revenue by Payment Gateway</h3>
          <p className="text-xs text-slate-500 mb-4">Volume processed per provider</p>

          {loading ? (
            <Skeleton className="h-52" />
          ) : gatewayData.length === 0 ? (
            <p className="text-sm text-slate-400 py-12 text-center font-medium">No gateway breakdown available</p>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={gatewayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="gateway" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]}>
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
      <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">📉 Churn Analysis & Feedback</h3>
            <p className="text-xs text-slate-500">
              Why creators cancel their subscription and retention insights
            </p>
          </div>
          <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full font-bold">
            {summary?.churnRate ?? 0}% Churn Rate
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reason Bars */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Top Cancellation Reasons
            </p>
            {(summary?.cancellationReasons || []).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No recorded cancellations</p>
            ) : (
              (summary?.cancellationReasons || []).map((r) => (
                <div key={r.reason} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-medium">{r.reason}</span>
                    <span className="text-slate-900 font-bold">{r.percentage}% ({r.count})</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${r.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cancelled Subscriptions Table */}
          <div className="lg:col-span-2 overflow-x-auto">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Recent Cancellations
            </p>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <th className="pb-2.5">Creator</th>
                  <th className="pb-2.5">Plan</th>
                  <th className="pb-2.5">Amount</th>
                  <th className="pb-2.5">Reason</th>
                  <th className="pb-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(summary?.cancelledSubscriptions || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                      No cancellations in this period 🎉
                    </td>
                  </tr>
                ) : (
                  summary?.cancelledSubscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold text-slate-900">{s.userName}</td>
                      <td className="py-2.5 capitalize font-medium">{s.plan}</td>
                      <td className="py-2.5 font-bold text-slate-900">${s.amount.toFixed(2)}</td>
                      <td className="py-2.5 text-rose-600 font-medium">{s.reason}</td>
                      <td className="py-2.5 text-slate-400 font-medium">
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
      <section className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 border border-indigo-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🔮</span>
          <h3 className="text-sm font-bold text-slate-900">Compound Revenue Projections</h3>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
            Compound Model
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-4">
          At an estimated <strong className="text-indigo-700 font-bold">{Math.round(growthRate * 100)}%</strong> monthly growth rate based on current platform momentum:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-2xs">
            <p className="text-xs text-slate-500 font-semibold">In 3 Months</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{fmt(projected3m)}/mo</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">~{fmt(projected3m * 12)} ARR</p>
          </div>
          <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-2xs">
            <p className="text-xs text-slate-500 font-semibold">In 6 Months</p>
            <p className="text-xl font-extrabold text-indigo-600 mt-1">{fmt(projected6m)}/mo</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">~{fmt(projected6m * 12)} ARR</p>
          </div>
          <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-2xs">
            <p className="text-xs text-slate-500 font-semibold">In 12 Months</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-1">{fmt(projected12m)}/mo</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">~{fmt(projected12m * 12)} ARR</p>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 italic mt-4">
          ℹ️ Disclaimer: Projection model based on current growth trajectory. MRR is calculated from active subscriptions.
        </p>
      </section>
    </div>
  );
}
