'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { auth } from '../../../lib/firebase';
import type { BmacQueueItem, AdminUserView } from '../../../types/admin';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getBmacTierDescription(amount: number, coffees: number): string {
  if (amount >= 149 || coffees >= 30) {
    return 'Lifetime Pro Access (100% full access)';
  }
  if (amount >= 79 || coffees >= 16) {
    return 'Agency Plan (1 month access)';
  }
  if (amount >= 29 || coffees >= 6) {
    return 'Pro Plan (1 month access)';
  }
  if (amount >= 9 || coffees >= 2) {
    return 'Starter Plan (1 month access)';
  }
  return '50 Bonus AI Credits';
}

// ── Match to User Modal ──────────────────────────────────────────────────────

function MatchBmacModal({
  item,
  onClose,
  onSuccess,
}: {
  item: BmacQueueItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState(item.supporterEmail || '');
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (item.supporterEmail) {
      searchUsers(item.supporterEmail);
    }
  }, [item.supporterEmail, searchUsers]);

  const handleMatch = async () => {
    if (!selectedUser) return;
    setLoading(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/bmac/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          unmatchedId: item.id,
          bmacPaymentId: item.bmacPaymentId,
          targetUid: selectedUser.uid,
          amount: item.amount,
          supportCoffees: item.supportCoffees,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Matching failed');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to match BMaC payment');
    } finally {
      setLoading(false);
    }
  };

  const rewardDesc = getBmacTierDescription(item.amount, item.supportCoffees);

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-amber-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>☕</span> Match BMaC Supporter to User
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Supporter Summary */}
        <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3.5 space-y-1 text-xs text-amber-200">
          <p className="font-semibold text-white">
            Supporter: {item.supporterName} ({item.supporterEmail || 'No email'})
          </p>
          <p>
            Donation: <strong>${item.amount}</strong> ({item.supportCoffees} coffees)
          </p>
          {item.message && (
            <p className="italic text-slate-300 mt-1 border-t border-amber-500/10 pt-1">
              "{item.message}"
            </p>
          )}
        </div>

        {/* Reward preview */}
        <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-3.5 text-xs space-y-1">
          <p className="text-slate-400">Matched Tier Reward:</p>
          <p className="text-sm font-bold text-purple-300">🎁 {rewardDesc}</p>
        </div>

        {/* Search Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 block">
            Search Target User Account
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                searchUsers(e.target.value);
              }}
              placeholder="Search by email or name..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searching && (
              <span className="absolute right-3 top-2.5 text-xs text-slate-500">Searching…</span>
            )}
          </div>

          {/* User Results */}
          {!selectedUser && users.length > 0 && (
            <div className="bg-[#121222] border border-white/10 rounded-lg max-h-36 overflow-y-auto divide-y divide-white/5">
              {users.map(u => (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  className="w-full text-left p-2.5 hover:bg-white/5 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">{u.name}</p>
                    <p className="text-slate-500 font-mono">{u.email}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-white/10 px-2 py-0.5 rounded text-slate-300">
                    {u.plan}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected User Display */}
        {selectedUser && (
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center text-sm">
                {(selectedUser.name || selectedUser.email || '?')[0].toUpperCase()}
              </div>
              <div className="text-xs">
                <p className="text-white font-semibold">{selectedUser.name}</p>
                <p className="text-slate-400 font-mono">{selectedUser.email}</p>
                <p className="text-[10px] text-emerald-400 mt-0.5">Current Plan: {selectedUser.plan}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-white/5 rounded"
            >
              Change
            </button>
          </div>
        )}

        {/* Irreversible Warning */}
        <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-3 text-[11px] text-red-300">
          ⚠️ <strong>Irreversible Action:</strong> The reward will be immediately credited and applied to the user's account.
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500/40 text-red-300 text-xs p-2.5 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleMatch}
            disabled={!selectedUser || loading}
            className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors shadow-md"
          >
            {loading ? 'Applying Reward…' : 'Match & Apply Reward'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main BMaC Queue Page ──────────────────────────────────────────────────────

export function BmacQueuePage() {
  const [items, setItems] = useState<BmacQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeItem, setActiveItem] = useState<BmacQueueItem | null>(null);
  const [toast, setToast] = useState('');

  const fetchBmacQueue = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/payments/bmac', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (err: any) {
      console.error('[BmacQueuePage]', err);
      setError(err.message || 'Failed to load BMaC queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBmacQueue();
  }, [fetchBmacQueue]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Buy Me a Coffee Unmatched Ledger</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Supporter donations and one-time tips waiting to be linked to creator accounts
          </p>
        </div>

        <button
          onClick={fetchBmacQueue}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer"
        >
          <span>🔄</span> Refresh Ledger
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl px-4 py-3 text-xs font-medium shadow-xs">
          ⚠️ {error}
        </div>
      )}

      {/* ── Unmatched Table ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Unmatched Donations</h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{items.length} unassigned</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3.5">Supporter</th>
                <th className="px-4 py-3.5">Donation</th>
                <th className="px-4 py-3.5">Coffees</th>
                <th className="px-4 py-3.5">Matched Tier</th>
                <th className="px-4 py-3.5">Message</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-medium">
                    🎉 All Buy Me a Coffee payments have been matched!
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const reward = getBmacTierDescription(item.amount, item.supportCoffees);
                  return (
                    <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors">
                      {/* Supporter */}
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-slate-900 font-bold">{item.supporterName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {item.supporterEmail || 'No email given'}
                          </p>
                        </div>
                      </td>

                      {/* Donation */}
                      <td className="px-4 py-3.5 font-extrabold text-amber-600 text-sm">
                        ${item.amount}
                      </td>

                      {/* Coffees */}
                      <td className="px-4 py-3.5 text-slate-700 font-bold">
                        ☕ {item.supportCoffees}
                      </td>

                      {/* Matched Tier */}
                      <td className="px-4 py-3.5">
                        <span className="text-indigo-700 font-bold">
                          {reward}
                        </span>
                      </td>

                      {/* Message */}
                      <td className="px-4 py-3.5 max-w-[200px] truncate text-slate-500 italic">
                        {item.message || '—'}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-400 font-medium whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setActiveItem(item)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                        >
                          Match to User
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Match Modal */}
      {activeItem && (
        <MatchBmacModal
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onSuccess={() => {
            fetchBmacQueue();
            setToast('✅ BMaC payment matched & reward applied');
            setTimeout(() => setToast(''), 3000);
          }}
        />
      )}
    </div>
  );
}
