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
  label, value, sub, accent, urgent, icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  urgent?: boolean;
  icon?: string;
}) {
  return (
    <div
      className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
        urgent
          ? 'border-rose-300 bg-rose-50/30 hover:border-rose-400'
          : 'border-slate-200/80 hover:border-indigo-300'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider truncate">{label}</p>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <div>
        <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${accent || 'text-slate-900'}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 font-medium mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200/80 rounded-2xl ${className}`} />;
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminOverviewPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const ACTIVITY_PAGE_SIZE = 10;

  const fetchData = useCallback(async () => {
    let loadedFromApi = false;
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/overview', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.stats) {
          setStats(data.stats);
          setActivity(data.activity || []);
          setError(null);
          loadedFromApi = true;
        }
      }
    } catch {
      // Fallback
    }

    if (!loadedFromApi && isFirebaseConfigured && db) {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const total = usersSnap.size;
        let newToday = 0;
        let newThisWeek = 0;
        let activeToday = 0;
        const now = Date.now();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

        const planDistribution = { free: 0, starter: 0, pro: 0, agency: 0, lifetime: 0 };

        usersSnap.docs.forEach((d) => {
          const u = d.data();
          const plan = (u.plan || 'free').toLowerCase() as keyof typeof planDistribution;
          if (planDistribution[plan] !== undefined) planDistribution[plan]++;
          else planDistribution.free++;

          const created = u.createdAt || '';
          if (created >= oneDayAgo) newToday++;
          if (created >= sevenDaysAgo) newThisWeek++;

          const lastSeen = u.lastSeen || u.updatedAt || u.createdAt || '';
          if (lastSeen >= oneDayAgo) activeToday++;
        });

        // Revenue calculation mock
        const mrr = (planDistribution.starter * 9.99) + (planDistribution.pro * 19.99) + (planDistribution.agency * 49.99);

        setStats({
          users: { total, newToday, newThisWeek, activeToday },
          revenue: {
            mrr,
            todayRevenue: 0,
            thisMonthRevenue: 0,
            totalRevenue: 0,
            pendingUpiUsd: 0,
          },
          planDistribution,
          pending: { upiCount: 0, bmacCount: 0, supportCount: 0, flaggedCount: 0 },
          signupTrend: [],
          systemHealth: { overallStatus: 'healthy', geminiLatencyMs: 0, errorRatePercent: 0, activeJobs: 0 },
        });
      } catch (err: any) {
        console.warn(err);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const planDist = stats
    ? Object.entries(stats.planDistribution).map(([plan, count]) => ({
        name: plan.charAt(0).toUpperCase() + plan.slice(1),
        value: count,
        color: PLAN_COLORS[plan] || '#64748b',
      }))
    : [];

  const totalUsers = planDist.reduce((s, p) => s + p.value, 0) || 1;
  const visibleActivity = activity.slice(0, activityPage * ACTIVITY_PAGE_SIZE);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-4 py-3 text-sm shadow-xs flex items-center gap-2">
          <span>ℹ️</span> <span>{error} — showing live client sync</span>
        </div>
      )}

      {/* ── Key Metrics Row 1 — Users ── */}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Audience & User Growth
          </h2>
          <span className="text-xs text-slate-500 font-medium">Real-time stats</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : (
            <>
              <StatCard
                label="Total Registered"
                value={stats?.users.total.toLocaleString() ?? 0}
                sub="All time creators"
                accent="text-slate-900"
                icon="👥"
              />
              <StatCard
                label="New Today"
                value={stats?.users.newToday ?? 0}
                sub="Since 00:00 UTC"
                accent="text-emerald-600"
                icon="✨"
              />
              <StatCard
                label="New This Week"
                value={stats?.users.newThisWeek ?? 0}
                sub="Last 7 rolling days"
                accent="text-indigo-600"
                icon="📈"
              />
              <StatCard
                label="Active Creators"
                value={stats?.users.activeToday ?? 0}
                sub="Active in last 24h"
                accent="text-sky-600"
                icon="⚡"
              />
            </>
          )}
        </div>
      </section>

      {/* ── Key Metrics Row 2 — Revenue ── */}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Financial & Recurring Revenue
          </h2>
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            ● Live Ledger
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : (
            <>
              <StatCard
                label="MRR (Projected)"
                value={fmt(stats?.revenue.mrr ?? 0)}
                sub="Monthly recurring run rate"
                accent="text-emerald-600"
                icon="💳"
              />
              <StatCard
                label="Today's Revenue"
                value={fmt((stats?.revenue as any)?.todayRevenue ?? 0)}
                sub="Cleared payments today"
                accent="text-indigo-600"
                icon="💵"
              />
              <StatCard
                label="This Month"
                value={fmt(stats?.revenue.thisMonthRevenue ?? 0)}
                sub="Gross month-to-date"
                accent="text-slate-900"
                icon="📊"
              />
              <StatCard
                label="Pending UPI"
                value={fmt(stats?.revenue.pendingUpiUsd ?? 0)}
                sub="Awaiting admin verification"
                accent="text-amber-600"
                icon="⏳"
                urgent={(stats?.revenue.pendingUpiUsd ?? 0) > 0}
              />
            </>
          )}
        </div>
      </section>

      {/* ── Quick Action Badges ── */}
      {!loading && stats && (
        <section className="flex flex-wrap items-center gap-3 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Action Queues:
          </span>
          {stats.pending.upiCount > 0 ? (
            <a
              href="/admin/payments/upi"
              className="flex items-center gap-2 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              ⏳ {stats.pending.upiCount} UPI Verification{stats.pending.upiCount !== 1 ? 's' : ''} Needed
            </a>
          ) : null}
          {stats.pending.bmacCount > 0 ? (
            <a
              href="/admin/payments/bmac"
              className="flex items-center gap-2 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              ☕ {stats.pending.bmacCount} Unmatched BMaC Tip{stats.pending.bmacCount !== 1 ? 's' : ''}
            </a>
          ) : null}
          {stats.pending.supportCount > 0 ? (
            <a
              href="/admin/support"
              className="flex items-center gap-2 bg-indigo-50 border border-indigo-300 hover:bg-indigo-100 text-indigo-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              📬 {stats.pending.supportCount} Open Support Ticket{stats.pending.supportCount !== 1 ? 's' : ''}
            </a>
          ) : null}
          {stats.pending.flaggedCount > 0 ? (
            <a
              href="/admin/content"
              className="flex items-center gap-2 bg-rose-50 border border-rose-300 hover:bg-rose-100 text-rose-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              🚩 {stats.pending.flaggedCount} Moderation Flag{stats.pending.flaggedCount !== 1 ? 's' : ''}
            </a>
          ) : null}
          {!stats.pending.upiCount &&
            !stats.pending.bmacCount &&
            !stats.pending.supportCount &&
            !stats.pending.flaggedCount && (
            <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <span>✅</span> <span>All system verification queues are clear and up to date</span>
            </div>
          )}
        </section>
      )}

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">📈 Platform Growth Trajectory</h3>
              <p className="text-xs text-slate-500">Daily creator registrations and subscription conversions</p>
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats?.signupTrend || []}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="signups" stroke="#6366f1" fill="url(#signupGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">🍩 Subscription Tier</h3>
          </div>
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={planDist} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                  {planDist.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Activity Feed ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">⚡ Live Platform Event Stream</h3>
            <p className="text-xs text-slate-500">Real-time audit log of user registrations, upgrades, and system actions</p>
          </div>
          <span className="text-xs text-slate-500 font-medium bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
            Auto-sync: 30s
          </span>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500 text-xs font-medium">No recent events logged</p>
          </div>
        ) : (
          <div className="space-y-1 divide-y divide-slate-100">
            {visibleActivity.map((event) => (
              <div key={event.id} className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-indigo-50/40 transition-colors">
                <span className="text-lg w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  {ACTIVITY_ICONS[event.type] || '📌'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 font-medium">{event.description}</p>
                </div>
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap shrink-0">
                  {timeAgo(event.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
