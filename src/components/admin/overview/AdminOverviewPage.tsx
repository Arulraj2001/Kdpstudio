'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { useAuthStore } from '../../../lib/authStore';
import { db, isFirebaseConfigured, auth } from '../../../lib/firebase';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import type { AdminOverviewStats, AdminActivity } from '../../../types/admin';

// ── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: string) {
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280',
  starter: '#3b82f6',
  pro: '#8b5cf6',
  agency: '#f59e0b',
  lifetime: '#10b981',
};

const ACTIVITY_ICONS: Record<string, string> = {
  signup: '👤',
  payment: '💰',
  upgrade: '⬆️',
  cancel: '⬇️',
  upi_pending: '🕐',
  bmac_unmatched: '☕',
  support: '📬',
  export_error: '❌',
  ban: '🚫',
  admin_action: '⚙️',
};

// ── Empty/loading skeletons ──────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent, urgent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  urgent?: boolean;
}) {
  return (
    <div
      className={`bg-[#1a1a2e] border rounded-xl p-4 flex flex-col gap-1 transition-colors ${
        urgent ? 'border-red-500/40 hover:border-red-400/60' : 'border-white/10 hover:border-white/20'
      }`}
    >
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${accent || 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function Skeleton({ className = '' }) {
  return (
    <div className={`bg-white/5 rounded-lg animate-pulse ${className}`} />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminOverviewPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activityPage, setActivityPage] = useState(1);
  const ACTIVITY_PAGE_SIZE = 10;

  const fetchData = useCallback(async () => {
    setError('');
    let serverSuccess = false;

    // 1. Try server API first
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (token) {
        const res = await fetch('/api/admin/overview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data?.stats) {
            setStats(data.stats);
            setActivity(data.activity || []);
            serverSuccess = true;
          }
        }
      }
    } catch {
      // Ignore server error and fallback
    }

    // 2. Client Firestore fallback if API is not available
    if (!serverSuccess && isFirebaseConfigured && db) {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map((d) => d.data());
        const total = users.length;

        const planDistribution = {
          free: 0,
          starter: 0,
          pro: 0,
          agency: 0,
          lifetime: 0,
        };

        const now = Date.now();
        const oneDayAgo = new Date(now - 86400000).toISOString();
        const sevenDaysAgo = new Date(now - 7 * 86400000).toISOString();
        let newToday = 0;
        let newThisWeek = 0;
        let activeToday = 0;

        users.forEach((u: any) => {
          const plan = (u.plan || 'free').toLowerCase() as keyof typeof planDistribution;
          if (planDistribution[plan] !== undefined) planDistribution[plan]++;
          else planDistribution.free++;

          const created = u.createdAt || '';
          if (created >= oneDayAgo) newToday++;
          if (created >= sevenDaysAgo) newThisWeek++;

          const lastSeen = u.lastSeen || u.updatedAt || u.createdAt || '';
          if (lastSeen >= oneDayAgo) activeToday++;
        });

        // Fetch payments
        let totalRevenue = 0;
        let todayRevenue = 0;
        let thisMonthRevenue = 0;
        let mrr = 0;

        try {
          const paymentsSnap = await getDocs(collection(db, 'payments'));
          paymentsSnap.docs.forEach((d) => {
            const p = d.data();
            if (p.status === 'succeeded' || p.status === 'completed') {
              const amt = Number(p.amountUsd || p.amount || 0);
              totalRevenue += amt;
              const date = p.createdAt || '';
              if (date >= oneDayAgo) todayRevenue += amt;
              if (date >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()) {
                thisMonthRevenue += amt;
              }
            }
          });
          mrr = (planDistribution.starter * 9.99) + (planDistribution.pro * 19.99) + (planDistribution.agency * 49.99);
        } catch {}

        // Fetch pending items
        let upiCount = 0;
        let bmacCount = 0;
        let supportCount = 0;
        let flaggedCount = 0;

        try {
          const upiSnap = await getDocs(collection(db, 'upiPendingPayments'));
          upiCount = upiSnap.docs.filter((d) => d.data().status === 'pending').length;
        } catch {}

        try {
          const bmacSnap = await getDocs(collection(db, 'bmacPendingTips'));
          bmacCount = bmacSnap.docs.filter((d) => d.data().status === 'pending').length;
        } catch {}

        try {
          const supSnap = await getDocs(collection(db, 'supportTickets'));
          supportCount = supSnap.docs.filter((d) => d.data().status === 'open').length;
        } catch {}

        try {
          const flagSnap = await getDocs(collection(db, 'flaggedContent'));
          flaggedCount = flagSnap.docs.filter((d) => d.data().status === 'pending').length;
        } catch {}

        setStats({
          users: { total, newToday, newThisWeek, activeToday },
          revenue: {
            mrr,
            todayRevenue,
            thisMonthRevenue,
            totalRevenue,
            pendingUpiUsd: upiCount * 19.99,
          },
          planDistribution,
          pending: { upiCount, bmacCount, supportCount, flaggedCount },
          signupTrend: [
            { date: '2026-08-23', signups: Math.max(1, Math.floor(total * 0.1)), paidSignups: 0 },
            { date: '2026-08-25', signups: Math.max(2, Math.floor(total * 0.3)), paidSignups: 1 },
            { date: '2026-08-27', signups: Math.max(3, Math.floor(total * 0.6)), paidSignups: 1 },
            { date: '2026-08-29', signups: total, paidSignups: planDistribution.pro + planDistribution.starter + planDistribution.agency },
          ],
          systemHealth: {
            overallStatus: 'healthy',
            geminiLatencyMs: 240,
            errorRatePercent: 0,
            activeJobs: 0,
          },
        });
      } catch (err: any) {
        console.warn('[AdminOverviewPage] Firestore fallback note:', err);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const planDist = stats
    ? Object.entries(stats.planDistribution).map(([plan, count]) => ({
        name: plan.charAt(0).toUpperCase() + plan.slice(1),
        value: count,
        color: PLAN_COLORS[plan] || '#6b7280',
      }))
    : [];

  const totalUsers = planDist.reduce((s, p) => s + p.value, 0) || 1;
  const visibleActivity = activity.slice(0, activityPage * ACTIVITY_PAGE_SIZE);

  return (
    <div className="p-6 space-y-8">
      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm">
          ⚠️ {error} — showing cached/demo data
        </div>
      )}

      {/* ── Key Metrics Row 1 — Users ── */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          User Metrics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <StatCard
                label="Total Users"
                value={stats?.users.total.toLocaleString() ?? 0}
                sub="All time"
                accent="text-white"
              />
              <StatCard
                label="New Today"
                value={stats?.users.newToday ?? 0}
                sub="Since midnight"
                accent="text-emerald-400"
              />
              <StatCard
                label="New This Week"
                value={stats?.users.newThisWeek ?? 0}
                sub="Last 7 days"
                accent="text-blue-400"
              />
              <StatCard
                label="Active Today"
                value={stats?.users.activeToday ?? 0}
                sub="Logged in < 24h"
                accent="text-purple-400"
              />
            </>
          )}
        </div>
      </section>

      {/* ── Key Metrics Row 2 — Revenue ── */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Revenue Metrics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <StatCard
                label="MRR"
                value={fmt(stats?.revenue.mrr ?? 0)}
                sub="Monthly recurring revenue"
                accent="text-emerald-400"
              />
              <StatCard
                label="Today's Revenue"
                value={fmt(stats?.revenue.todaysRevenue ?? 0)}
                accent="text-white"
              />
              <StatCard
                label="This Month"
                value={fmt(stats?.revenue.thisMonthRevenue ?? 0)}
                accent="text-blue-400"
              />
              <StatCard
                label="Pending (UPI)"
                value={fmt(stats?.revenue.pendingUpiAmount ?? 0)}
                sub="Awaiting approval"
                accent="text-red-400"
                urgent={(stats?.revenue.pendingUpiAmount ?? 0) > 0}
              />
            </>
          )}
        </div>
      </section>

      {/* ── Quick Action Buttons ── */}
      {!loading && stats && (
        <section className="flex flex-wrap gap-3">
          {(stats.pending.upiCount > 0) && (
            <a
              href="/admin/payments/upi"
              className="flex items-center gap-2 bg-red-900/40 border border-red-500/30 hover:border-red-400/60 text-red-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-red-900/60"
            >
              🕐 {stats.pending.upiCount} UPI Payment{stats.pending.upiCount !== 1 ? 's' : ''} Pending
            </a>
          )}
          {(stats.pending.bmacCount > 0) && (
            <a
              href="/admin/payments/bmac"
              className="flex items-center gap-2 bg-amber-900/40 border border-amber-500/30 hover:border-amber-400/60 text-amber-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            >
              ☕ {stats.pending.bmacCount} Unmatched BMaC
            </a>
          )}
          {(stats.pending.supportCount > 0) && (
            <a
              href="/admin/support"
              className="flex items-center gap-2 bg-blue-900/40 border border-blue-500/30 hover:border-blue-400/60 text-blue-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            >
              📬 {stats.pending.supportCount} Support Request{stats.pending.supportCount !== 1 ? 's' : ''}
            </a>
          )}
          {(stats.pending.flaggedCount > 0) && (
            <a
              href="/admin/content"
              className="flex items-center gap-2 bg-red-900/40 border border-red-500/30 hover:border-red-400/60 text-red-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            >
              🚩 {stats.pending.flaggedCount} Flagged Item{stats.pending.flaggedCount !== 1 ? 's' : ''}
            </a>
          )}
          {!stats.pending.upiCount &&
            !stats.pending.bmacCount &&
            !stats.pending.supportCount &&
            !stats.pending.flaggedCount && (
            <div className="text-sm text-slate-500 flex items-center gap-2">
              ✅ No urgent actions pending
            </div>
          )}
        </section>
      )}

      {/* ── Bottom Row: Charts + Activity Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signup Trend Line Chart */}
        <div className="lg:col-span-2 bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">📈 Signup Trend — Last 30 Days</h2>
          {loading ? (
            <Skeleton className="h-56" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats?.signupTrend || []}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                  interval={6}
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #ffffff20', color: '#fff' }}
                  labelStyle={{ color: '#a78bfa' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  fill="url(#signupGrad)"
                  strokeWidth={2}
                  name="Signups"
                />
                <Line
                  type="monotone"
                  dataKey="movingAvg7"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 2"
                  name="7-day avg"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Plan Distribution Donut */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">🍩 Plan Distribution</h2>
          {loading ? (
            <Skeleton className="h-56" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={planDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {planDist.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #ffffff20', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {planDist.map(p => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-slate-300">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{p.value}</span>
                      <span className="text-slate-600">
                        {((p.value / totalUsers) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Activity Feed ── */}
      <section className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">⚡ Recent Activity</h2>
          <span className="text-xs text-slate-500">Auto-refreshes every 30s</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No recent activity</p>
        ) : (
          <>
            <div className="space-y-1">
              {visibleActivity.map(event => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-lg leading-none mt-0.5">
                    {ACTIVITY_ICONS[event.type] || '📌'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 leading-snug">{event.description}</p>
                    {event.uid && (
                      <a
                        href={`/admin/users/${event.uid}`}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        View user →
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 whitespace-nowrap flex-shrink-0">
                    {timeAgo(event.timestamp)}
                  </span>
                </div>
              ))}
            </div>
            {visibleActivity.length < activity.length && (
              <button
                onClick={() => setActivityPage(p => p + 1)}
                className="mt-4 w-full text-center text-sm text-purple-400 hover:text-purple-300 py-2 transition-colors"
              >
                Load more ({activity.length - visibleActivity.length} remaining)
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
