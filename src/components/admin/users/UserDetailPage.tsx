'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { auth } from '../../../lib/firebase';
import type { AdminUserDetail } from '../../../types/admin';
import { ChangePlanModal } from './ChangePlanModal';
import { ImpersonateModal } from './ImpersonateModal';

// ── helpers ──────────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-slate-700 text-slate-300',
  starter: 'bg-blue-900/60 text-blue-300',
  pro: 'bg-purple-900/60 text-purple-300',
  agency: 'bg-amber-900/60 text-amber-300',
  lifetime: 'bg-emerald-900/60 text-emerald-300',
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-slate-500 flex-shrink-0 mt-0.5 w-36">{label}</span>
      <span className={`text-sm text-slate-200 text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

const TABS = ['Overview', 'Books', 'Payments', 'Usage History', 'Admin Notes'];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  uid: string;
}

export function UserDetailPage({ uid }: Props) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showImpersonate, setShowImpersonate] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [toast, setToast] = useState('');

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AdminUserDetail = await res.json();
      setUser(data);
      setNotes(data.adminNotes || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAction = async (action: string, reason?: string) => {
    if (!user) return;
    const r = reason || window.prompt(`Reason for ${action} on ${user.name}:`);
    if (!r) return;
    const token = await auth?.currentUser?.getIdToken();
    const res = await fetch(`/api/admin/users/${uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, reason: r }),
    });
    if (res.ok) {
      showToast(`✅ Action "${action}" completed`);
      fetchUser();
    } else {
      const d = await res.json();
      showToast(`❌ ${d.error || 'Failed'}`);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    const token = await auth?.currentUser?.getIdToken();
    await fetch(`/api/admin/users/${uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'update_notes', notes }),
    });
    setSavingNotes(false);
    showToast('✅ Notes saved');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('📋 Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 rounded-lg p-4">
          {error || 'User not found'}
        </div>
        <a href="/admin/users" className="text-purple-400 hover:text-purple-300 text-sm mt-4 inline-block">
          ← Back to Users
        </a>
      </div>
    );
  }

  const daysSinceJoined = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / 86400000
  );

  return (
    <div className="p-6 space-y-6 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e35] border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg shadow-xl">
          {toast}
        </div>
      )}

      {/* Back link */}
      <a
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
      >
        ← Back to Users
      </a>

      {/* ── Header ── */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-white/10 flex items-center justify-center text-3xl font-bold text-purple-300 flex-shrink-0">
            {(user.name || user.email || '?')[0].toUpperCase()}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{user.name || '—'}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PLAN_BADGE[user.plan] || PLAN_BADGE.free}`}>
                {user.plan.toUpperCase()}
              </span>
              {user.isBanned && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-900/60 text-red-300">BANNED</span>
              )}
              {!user.emailVerified && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-900/60 text-amber-300">UNVERIFIED</span>
              )}
            </div>
            <p className="text-slate-400 mt-0.5">{user.email}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-1">
            <a
              href={`mailto:${user.email}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg text-sm text-slate-300 transition-colors"
            >
              ✉️ Send Email
            </a>
            <button
              id="change-plan-btn"
              onClick={() => setShowChangePlan(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-900/30 border border-purple-500/20 hover:border-purple-400/40 rounded-lg text-sm text-purple-300 transition-colors"
            >
              ⬆️ Change Plan
            </button>
            {user.isBanned ? (
              <button
                id="unban-btn"
                onClick={() => handleAction('unban', 'Admin unban')}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-900/30 border border-emerald-500/20 hover:border-emerald-400/40 rounded-lg text-sm text-emerald-300 transition-colors"
              >
                🔓 Unban
              </button>
            ) : (
              <button
                id="ban-btn"
                onClick={() => handleAction('ban')}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-900/30 border border-red-500/20 hover:border-red-400/40 rounded-lg text-sm text-red-300 transition-colors"
              >
                🔒 Ban User
              </button>
            )}
            <button
              id="delete-account-btn"
              onClick={() => handleAction('delete')}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-900/30 border border-red-500/20 hover:border-red-400/40 rounded-lg text-sm text-red-300 transition-colors"
            >
              🗑️ Delete
            </button>
            <button
              id="impersonate-btn"
              onClick={() => setShowImpersonate(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-900/30 border border-amber-500/20 hover:border-amber-400/40 rounded-lg text-sm text-amber-300 transition-colors"
            >
              👤 Impersonate
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-white/10">
          {[
            { label: 'Books Created', value: user.totalBooks },
            { label: 'PDFs Exported', value: user.totalPdfExports },
            { label: 'Revenue Paid', value: `$${user.totalRevenuePaid.toFixed(2)}` },
            { label: 'Days Since Joined', value: daysSinceJoined },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-white/10">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab}
              id={`tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-purple-500 text-purple-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Personal Info */}
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Personal Info</h3>
            <InfoRow
              label="UID"
              value={
                <span
                  className="font-mono text-xs text-purple-300 cursor-pointer hover:text-purple-200"
                  onClick={() => copyToClipboard(user.uid)}
                  title="Click to copy"
                >
                  {user.uid.slice(0, 20)}…
                </span>
              }
            />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Verified" value={user.emailVerified ? '✅ Yes' : '❌ No'} />
            <InfoRow label="Country" value={`${user.country} (${user.currency})`} />
            <InfoRow label="Timezone" value={user.timezone} />
            <InfoRow label="Onboarding" value={user.onboardingComplete ? '✅ Complete' : 'Pending'} />
            <InfoRow label="Referral Code" value={user.referralCode} mono />
            <InfoRow label="Referred By" value={user.referredBy || '—'} />
          </div>

          {/* Plan Info */}
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Plan Info</h3>
            <InfoRow
              label="Current Plan"
              value={
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLAN_BADGE[user.plan] || PLAN_BADGE.free}`}>
                  {user.plan.toUpperCase()}
                </span>
              }
            />
            <InfoRow label="Billing Cycle" value={user.billingCycle || '—'} />
            <InfoRow label="Plan Start" value={fmtDate(user.planStartDate)} />
            <InfoRow label="Plan End" value={fmtDate(user.planEndDate)} />
            <InfoRow label="Payment Method" value={user.paymentMethod || '—'} />
            <InfoRow label="Subscription ID" value={user.subscriptionId || '—'} mono />
            <InfoRow label="Sub Cancelled" value={user.subscriptionCancelled ? 'Yes' : 'No'} />
          </div>

          {/* Today's Usage */}
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Today's Usage</h3>
            <InfoRow label="AI Generations" value={user.todayAiGenerations} />
            <InfoRow label="PDF Exports" value={user.todayPdfExports} />
            {user.adminNotes && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-slate-500 mb-1">Admin Notes</p>
                <p className="text-sm text-slate-300 italic">{user.adminNotes.slice(0, 120)}{user.adminNotes.length > 120 ? '…' : ''}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Books ── */}
      {activeTab === 'Books' && (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Title', 'Type', 'Status', 'Words', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {user.books.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No books</td></tr>
              ) : user.books.map(b => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-4 py-3 text-slate-200 font-medium">{b.title}</td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{b.type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      b.status === 'published' ? 'bg-emerald-900/40 text-emerald-400'
                      : 'bg-slate-700 text-slate-400'
                    }`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{b.wordCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400">{fmtDate(b.createdAt)}</td>
                  <td className="px-4 py-3">
                    <a href={`/studio/${b.id}`} className="text-xs text-purple-400 hover:text-purple-300">Open →</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Payments ── */}
      {activeTab === 'Payments' && (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Date', 'Plan', 'Amount', 'Gateway', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {user.payments.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No payments</td></tr>
              ) : user.payments.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-4 py-3 text-slate-400">{fmtDate(p.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-200 capitalize">{p.plan}</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">
                    {p.currency} {p.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{p.gateway}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === 'completed' ? 'bg-emerald-900/40 text-emerald-400'
                      : p.status === 'pending' ? 'bg-amber-900/40 text-amber-400'
                      : 'bg-red-900/40 text-red-400'
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Usage History ── */}
      {activeTab === 'Usage History' && (
        <div className="space-y-5">
          {user.usageHistory.length > 0 && (
            <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">AI Generations — Last 30 Days</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[...user.usageHistory].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #ffffff20', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="aiGenerations" stroke="#8b5cf6" strokeWidth={2} dot={false} name="AI Gens" />
                  <Line type="monotone" dataKey="pdfExports" stroke="#3b82f6" strokeWidth={2} dot={false} name="PDFs" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Date', 'AI Generations', 'PDF Exports', 'Image Generations'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {user.usageHistory.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">No usage history</td></tr>
                ) : user.usageHistory.map(d => (
                  <tr key={d.date} className="border-b border-white/5 hover:bg-white/3">
                    <td className="px-4 py-3 text-slate-400">{d.date}</td>
                    <td className="px-4 py-3 text-purple-400">{d.aiGenerations}</td>
                    <td className="px-4 py-3 text-blue-400">{d.pdfExports}</td>
                    <td className="px-4 py-3 text-emerald-400">{d.imageGenerations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Admin Notes ── */}
      {activeTab === 'Admin Notes' && (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Private Admin Notes</h3>
            <p className="text-xs text-slate-500">These notes are NOT visible to the user.</p>
          </div>
          <textarea
            id="admin-notes-textarea"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={8}
            placeholder="Add private notes about this user…"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none"
          />
          {user.adminNotesUpdatedAt && (
            <p className="text-xs text-slate-600">
              Last updated: {fmtDate(user.adminNotesUpdatedAt)}
            </p>
          )}
          <button
            id="save-notes-btn"
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            {savingNotes ? 'Saving…' : 'Save Notes'}
          </button>
        </div>
      )}

      {/* Modals */}
      {showChangePlan && (
        <ChangePlanModal
          uid={uid}
          currentPlan={user.plan}
          userName={user.name}
          onClose={() => setShowChangePlan(false)}
          onSuccess={() => { fetchUser(); showToast('✅ Plan updated'); }}
        />
      )}
      {showImpersonate && (
        <ImpersonateModal
          uid={uid}
          name={user.name}
          email={user.email}
          onClose={() => setShowImpersonate(false)}
        />
      )}
    </div>
  );
}
