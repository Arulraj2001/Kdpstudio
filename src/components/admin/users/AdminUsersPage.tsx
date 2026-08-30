'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { auth } from '../../../lib/firebase';
import type { AdminUserView, AdminUsersResult } from '../../../types/admin';
import { ChangePlanModal } from './ChangePlanModal';

// ── helpers ──────────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-slate-100 text-slate-700 border border-slate-200',
  starter: 'bg-blue-50 text-blue-700 border border-blue-200',
  pro: 'bg-purple-50 text-purple-700 border border-purple-200',
  agency: 'bg-amber-50 text-amber-700 border border-amber-200',
  lifetime: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${PLAN_BADGE[plan] || PLAN_BADGE.free}`}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}

function StatusBadge({ user }: { user: AdminUserView }) {
  if (user.isBanned) return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700">Banned</span>;
  if (!user.emailVerified) return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">Unverified</span>;
  const lastSeen = user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
  const isActive = lastSeen > Date.now() - 86400000;
  return isActive
    ? <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">Active</span>
    : <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500">Inactive</span>;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

// ── Component ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openActions, setOpenActions] = useState<string | null>(null);
  const [changePlanUser, setChangePlanUser] = useState<AdminUserView | null>(null);
  const [exporting, setExporting] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (pg = page, sq = search) => {
    setLoading(true);
    let serverSuccess = false;
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (token) {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(pg * PAGE_SIZE),
          sortBy,
          sortOrder,
        });
        if (sq) params.set('search', sq);
        if (planFilter !== 'all') params.set('plan', planFilter);
        if (statusFilter !== 'all') params.set('status', statusFilter);

        const res = await fetch(`/api/admin/users?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data: AdminUsersResult = await res.json();
          setUsers(data.users || []);
          setTotal(data.total || 0);
          serverSuccess = true;
        }
      }
    } catch {
      // fallback
    }

    if (!serverSuccess) {
      try {
        const { db, isFirebaseConfigured } = await import('../../../lib/firebase');
        const { collection, getDocs } = await import('firebase/firestore');
        if (isFirebaseConfigured && db) {
          const snap = await getDocs(collection(db, 'users'));
          let list: AdminUserView[] = snap.docs.map((d) => {
            const u = d.data();
            return {
              uid: d.id,
              email: u.email || '',
              name: u.displayName || u.name || 'User',
              photoURL: u.photoURL || u.photoUrl || null,
              plan: (u.plan || 'free').toLowerCase(),
              planStartDate: u.planStartDate || null,
              planEndDate: u.planEndDate || null,
              billingCycle: u.billingCycle || 'monthly',
              paymentMethod: u.paymentMethod || null,
              country: u.country || 'Global',
              currency: u.currency || 'USD',
              createdAt: u.createdAt || new Date().toISOString(),
              lastSeen: u.lastSeen || u.updatedAt || u.createdAt || null,
              emailVerified: Boolean(u.emailVerified !== false),
              isBanned: Boolean(u.isBanned),
              onboardingComplete: Boolean(u.onboardingComplete),
              totalBooks: Number(u.bookCount || u.totalBooks || 0),
              totalPdfExports: Number(u.totalPdfExports || u.pdfExports || 0),
              totalRevenuePaid: Number(u.totalRevenuePaid || (u.plan === 'pro' ? 19.99 : u.plan === 'starter' ? 9.99 : 0)),
              todayAiGenerations: Number(u.todayAiGenerations || 0),
              todayPdfExports: Number(u.todayPdfExports || 0),
            };
          });

          if (sq) {
            const queryLower = sq.toLowerCase();
            list = list.filter((u) => u.email.toLowerCase().includes(queryLower) || u.name.toLowerCase().includes(queryLower));
          }
          if (planFilter !== 'all') {
            list = list.filter((u) => u.plan === planFilter);
          }

          setTotal(list.length);
          setUsers(list.slice(pg * PAGE_SIZE, (pg + 1) * PAGE_SIZE));
        }
      } catch (err) {
        console.warn('[AdminUsersPage] Client fallback error:', err);
      }
    }

    setLoading(false);
  }, [page, search, planFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers(page, search);
  }, [page, planFilter, statusFilter, sortBy, sortOrder]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(0);
      fetchUsers(0, val);
    }, 300);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/users/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kdpstudio-users-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleUserAction = async (user: AdminUserView, action: string) => {
    setOpenActions(null);
    if (action === 'view') {
      window.location.href = `/admin/users/${user.uid}`;
    } else if (action === 'upgrade') {
      setChangePlanUser(user);
    } else if (action === 'email') {
      window.location.href = `mailto:${user.email}`;
    } else if (action === 'ban' || action === 'unban') {
      const reason = action === 'ban'
        ? window.prompt(`Ban reason for ${user.name}:`)
        : 'Admin unban';
      if (!reason) return;
      const token = await auth?.currentUser?.getIdToken();
      await fetch(`/api/admin/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: action === 'ban' ? 'ban' : 'unban', reason }),
      });
      fetchUsers();
    } else if (action === 'delete') {
      const reason = window.prompt(`Delete reason for ${user.name} (data preserved 60 days):`);
      if (!reason) return;
      if (!window.confirm(`Really delete account for ${user.email}? This cannot be undone.`)) return;
      const token = await auth?.currentUser?.getIdToken();
      await fetch(`/api/admin/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete', reason }),
      });
      fetchUsers();
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Creator Directory</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {total > 0 ? `Showing ${start}–${end} of ${total.toLocaleString()} registered creators` : 'Loading accounts…'}
          </p>
        </div>
        <button
          id="export-users-csv-btn"
          onClick={handleExportCSV}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          📥 {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            id="users-search"
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search creator by name or email address…"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-3 focus:ring-indigo-50 transition-all"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            id="filter-plan"
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(0); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="agency">Agency</option>
            <option value="lifetime">Lifetime</option>
          </select>

          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (24h)</option>
            <option value="banned">Banned</option>
            <option value="unverified">Unverified</option>
          </select>

          <select
            id="sort-by"
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('_');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
              setPage(0);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="createdAt_desc">Newest first</option>
            <option value="createdAt_asc">Oldest first</option>
            <option value="lastSeen_desc">Recently active</option>
            <option value="plan_asc">Plan tier</option>
            <option value="totalRevenuePaid_desc">Most revenue</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200">
                {['Creator', 'Plan', 'Country', 'Books', 'Revenue Paid', 'Joined', 'Last Active', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-medium">
                    No creators match the current filter
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid} className="hover:bg-indigo-50/40 transition-colors">
                    {/* User */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-[170px]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-2xs shrink-0">
                          {(u.name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-900 font-bold truncate max-w-[140px]">{u.name || 'Anonymous'}</p>
                          <p className="text-slate-500 text-xs truncate max-w-[140px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Plan */}
                    <td className="px-4 py-3.5"><PlanBadge plan={u.plan} /></td>
                    {/* Country */}
                    <td className="px-4 py-3.5 text-slate-500 text-xs font-semibold">{u.country}</td>
                    {/* Books */}
                    <td className="px-4 py-3.5 text-slate-700 font-bold text-center">{u.totalBooks}</td>
                    {/* Revenue */}
                    <td className="px-4 py-3.5 text-emerald-600 font-bold">
                      ${u.totalRevenuePaid.toFixed(2)}
                    </td>
                    {/* Joined */}
                    <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                    {/* Last Active */}
                    <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{fmtDate(u.lastSeen)}</td>
                    {/* Status */}
                    <td className="px-4 py-3.5"><StatusBadge user={u} /></td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="relative">
                        <button
                          id={`actions-btn-${u.uid}`}
                          onClick={() => setOpenActions(openActions === u.uid ? null : u.uid)}
                          className="text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 px-2.5 py-1 rounded-lg transition-all text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                          Actions ▾
                        </button>
                        {openActions === u.uid && (
                          <div className="absolute right-0 top-full z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl min-w-[160px] py-1.5 overflow-hidden">
                            {[
                              { id: 'view', label: '👁️ View Details' },
                              { id: 'upgrade', label: '⬆️ Upgrade Plan' },
                              { id: 'email', label: '✉️ Send Email' },
                              u.isBanned
                                ? { id: 'unban', label: '🔓 Unban User' }
                                : { id: 'ban', label: '🔒 Ban User' },
                            ].map((item) => (
                              <button
                                key={item.id}
                                id={`action-${item.id}-${u.uid}`}
                                onClick={() => handleUserAction(u, item.id)}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg disabled:opacity-30 transition-colors shadow-2xs"
            >
              ← Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const pg = totalPages <= 7 ? i : i + Math.max(0, page - 3);
                if (pg >= totalPages) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors ${
                      pg === page
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    {pg + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg disabled:opacity-30 transition-colors shadow-2xs"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Change Plan Modal */}
      {changePlanUser && (
        <ChangePlanModal
          uid={changePlanUser.uid}
          currentPlan={changePlanUser.plan}
          userName={changePlanUser.name}
          onClose={() => setChangePlanUser(null)}
          onSuccess={() => { fetchUsers(); }}
        />
      )}
    </div>
  );
}
