'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { auth } from '../../../lib/firebase';
import type { AdminUserView, AdminUsersResult } from '../../../types/admin';
import { ChangePlanModal } from './ChangePlanModal';

// ── helpers ──────────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-slate-700 text-slate-300',
  starter: 'bg-blue-900/60 text-blue-300',
  pro: 'bg-purple-900/60 text-purple-300',
  agency: 'bg-amber-900/60 text-amber-300',
  lifetime: 'bg-emerald-900/60 text-emerald-300',
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_BADGE[plan] || PLAN_BADGE.free}`}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}

function StatusBadge({ user }: { user: AdminUserView }) {
  if (user.isBanned) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-900/60 text-red-300">Banned</span>;
  if (!user.emailVerified) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300">Unverified</span>;
  const lastSeen = user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
  const isActive = lastSeen > Date.now() - 86400000;
  return isActive
    ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300">Active</span>
    : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">Inactive</span>;
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
              plan: (u.plan || 'free').toLowerCase(),
              billingCycle: u.billingCycle || 'monthly',
              country: u.country || 'Global',
              totalBooks: Number(u.bookCount || u.totalBooks || 0),
              totalRevenuePaid: Number(u.totalRevenuePaid || (u.plan === 'pro' ? 19.99 : u.plan === 'starter' ? 9.99 : 0)),
              createdAt: u.createdAt || new Date().toISOString(),
              lastSeen: u.lastSeen || u.updatedAt || u.createdAt || null,
              isBanned: Boolean(u.isBanned),
              emailVerified: Boolean(u.emailVerified !== false),
              authProvider: u.authProvider || 'password',
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
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">All Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {total > 0 ? `Showing ${start}–${end} of ${total.toLocaleString()} users` : 'Loading…'}
          </p>
        </div>
        <button
          id="export-users-csv-btn"
          onClick={handleExportCSV}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] border border-white/10 hover:border-white/20 rounded-lg text-sm text-slate-300 transition-colors disabled:opacity-50"
        >
          📥 {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Search + Filters */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            id="users-search"
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by email or name prefix…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            id="filter-plan"
            value={planFilter}
            onChange={e => { setPlanFilter(e.target.value); setPage(0); }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500"
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
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="unverified">Unverified</option>
          </select>

          <select
            id="sort-by"
            value={`${sortBy}_${sortOrder}`}
            onChange={e => {
              const [field, order] = e.target.value.split('_');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
              setPage(0);
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="createdAt_desc">Newest first</option>
            <option value="createdAt_asc">Oldest first</option>
            <option value="lastSeen_desc">Recently active</option>
            <option value="plan_asc">Plan (asc)</option>
            <option value="totalRevenuePaid_desc">Most revenue</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['User', 'Plan', 'Country', 'Books', 'Revenue', 'Joined', 'Last Active', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr
                    key={u.uid}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-[160px]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/40 to-indigo-500/40 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
                          {(u.name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate max-w-[140px]">{u.name || '—'}</p>
                          <p className="text-slate-500 text-xs truncate max-w-[140px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Plan */}
                    <td className="px-4 py-3"><PlanBadge plan={u.plan} /></td>
                    {/* Country */}
                    <td className="px-4 py-3 text-slate-400 text-xs">{u.country}</td>
                    {/* Books */}
                    <td className="px-4 py-3 text-slate-300 text-center">{u.totalBooks}</td>
                    {/* Revenue */}
                    <td className="px-4 py-3 text-emerald-400 font-medium">
                      ${u.totalRevenuePaid.toFixed(2)}
                    </td>
                    {/* Joined */}
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                    {/* Last Active */}
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(u.lastSeen)}</td>
                    {/* Status */}
                    <td className="px-4 py-3"><StatusBadge user={u} /></td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          id={`actions-btn-${u.uid}`}
                          onClick={() => setOpenActions(openActions === u.uid ? null : u.uid)}
                          className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors text-xs"
                        >
                          ··· Actions
                        </button>
                        {openActions === u.uid && (
                          <div className="absolute right-0 top-full z-20 mt-1 bg-[#1e1e35] border border-white/10 rounded-lg shadow-xl min-w-[160px] py-1 overflow-hidden">
                            {[
                              { id: 'view', label: '👁️ View Details' },
                              { id: 'upgrade', label: '⬆️ Upgrade Plan' },
                              { id: 'email', label: '✉️ Send Email' },
                              u.isBanned
                                ? { id: 'unban', label: '🔓 Unban User' }
                                : { id: 'ban', label: '🔒 Ban User' },
                              { id: 'delete', label: '🗑️ Delete Account' },
                            ].map(item => (
                              <button
                                key={item.id}
                                id={`action-${item.id}-${u.uid}`}
                                onClick={() => handleUserAction(u, item.id)}
                                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
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
                    className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                      pg === page
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {pg + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
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
