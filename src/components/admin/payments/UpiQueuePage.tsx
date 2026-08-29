'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { auth } from '../../../lib/firebase';
import type { UpiQueueItem, UpiQueueStats } from '../../../types/admin';

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: string) {
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 86400)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ── Approve Modal ────────────────────────────────────────────────────────────

function UpiApproveModal({
  item,
  onClose,
  onSuccess,
}: {
  item: UpiQueueItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [notes, setNotes] = useState('');
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allChecked = check1 && check2 && check3;

  const handleApprove = async () => {
    if (!allChecked) return;
    setLoading(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/upi/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pendingId: item.id,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to approve payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-emerald-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>✅</span> Approve UPI Payment
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Payment Summary */}
        <div className="bg-white/5 rounded-xl p-3.5 space-y-1 text-xs border border-white/5">
          <div className="flex justify-between">
            <span className="text-slate-500">Customer:</span>
            <span className="text-white font-medium">{item.name} ({item.email})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Plan Requested:</span>
            <span className="text-purple-300 font-semibold uppercase">{item.plan} ({item.billingCycle})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount:</span>
            <span className="text-emerald-400 font-bold text-sm">₹{item.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">UTR Number:</span>
            <span className="font-mono text-white select-all">{item.utrNumber}</span>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="space-y-2.5 bg-emerald-950/20 border border-emerald-500/20 p-3.5 rounded-xl">
          <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">
            Verification Checklist
          </p>
          <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={check1}
              onChange={e => setCheck1(e.target.checked)}
              className="mt-0.5 rounded bg-white/10 border-white/20 text-emerald-500 focus:ring-0"
            />
            <span>I verified this UTR in my UPI / bank app</span>
          </label>
          <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={check2}
              onChange={e => setCheck2(e.target.checked)}
              className="mt-0.5 rounded bg-white/10 border-white/20 text-emerald-500 focus:ring-0"
            />
            <span>Amount matches exactly: ₹{item.amount}</span>
          </label>
          <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={check3}
              onChange={e => setCheck3(e.target.checked)}
              className="mt-0.5 rounded bg-white/10 border-white/20 text-emerald-500 focus:ring-0"
            />
            <span>Payment timestamp matches recent deposit</span>
          </label>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Internal Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Verified on HDFC Statement"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
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
            onClick={handleApprove}
            disabled={!allChecked || loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors shadow-md"
          >
            {loading ? 'Activating…' : '✅ Approve & Activate Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Modal ─────────────────────────────────────────────────────────────

function UpiRejectModal({
  item,
  onClose,
  onSuccess,
}: {
  item: UpiQueueItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState('UTR not found in my UPI app');
  const [actualAmount, setActualAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReject = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      let fullReason = reason;
      if (reason === 'Wrong amount paid' && actualAmount) {
        fullReason = `Wrong amount paid (received ₹${actualAmount}, expected ₹${item.amount})`;
      }

      const res = await fetch('/api/admin/upi/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pendingId: item.id,
          reason: fullReason,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reject payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>❌</span> Reject UPI Payment
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-3 text-xs text-red-300">
          Rejecting will notify the customer via email and cancel this pending activation request.
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Rejection Reason <span className="text-red-400">*</span>
          </label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          >
            <option value="UTR not found in my UPI app">UTR not found in my UPI app</option>
            <option value="Wrong amount paid">Wrong amount paid</option>
            <option value="Duplicate submission (already approved)">Duplicate submission (already approved)</option>
            <option value="UTR already used for another account">UTR already used for another account</option>
            <option value="Suspicious activity">Suspicious activity</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {reason === 'Wrong amount paid' && (
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Actual Amount Paid (₹)
            </label>
            <input
              type="number"
              placeholder={`e.g. ${item.amount / 2}`}
              value={actualAmount}
              onChange={e => setActualAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Internal Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Details for team reference..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 resize-none"
          />
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
            onClick={handleReject}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-md"
          >
            {loading ? 'Rejecting…' : '❌ Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main UPI Queue Page ───────────────────────────────────────────────────────

export function UpiQueuePage() {
  const [stats, setStats] = useState<UpiQueueStats | null>(null);
  const [items, setItems] = useState<UpiQueueItem[]>([]);
  const [history, setHistory] = useState<UpiQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Active Modals
  const [approveItem, setApproveItem] = useState<UpiQueueItem | null>(null);
  const [rejectItem, setRejectItem] = useState<UpiQueueItem | null>(null);
  const [toast, setToast] = useState('');

  const fetchQueue = useCallback(async () => {
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/payments/upi', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data.stats);
      setItems(data.items || []);
      setHistory(data.history || []);
    } catch (err: any) {
      console.error('[UpiQueuePage]', err);
      setError(err.message || 'Failed to load UPI queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchQueue, 60000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setToast('📋 UTR copied to clipboard');
    setTimeout(() => setToast(''), 2500);
  };

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
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Direct UPI Verification Queue</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verify submitted UTR transaction IDs and manually provision creator subscription plans
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live sync active
          </span>
          <button
            onClick={() => { setLoading(true); fetchQueue(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer"
          >
            <span>🔄</span> Refresh Queue
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl px-4 py-3 text-xs font-medium shadow-xs">
          ⚠️ {error}
        </div>
      )}

      {/* ── Stats Row ── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Pending Requests</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1.5">
            {loading ? '…' : stats?.pendingCount ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Requires manual audit</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Amount</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1.5">
            {loading ? '…' : `₹${(stats?.totalAmount ?? 0).toLocaleString()}`}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Awaiting credit approval</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Oldest Pending</p>
          <p className="text-lg font-extrabold text-slate-900 mt-1.5">
            {loading ? '…' : stats?.oldestPending ? timeAgo(stats.oldestPending) : 'None'}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">FIFO queue priority</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Avg Response Time</p>
          <p className="text-lg font-extrabold text-indigo-600 mt-1.5">
            {loading ? '…' : `${stats?.avgVerificationHours ?? 2.4} hrs`}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Past 30 days benchmark</p>
        </div>
      </section>

      {/* ── Pending Table ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Pending Requests (Oldest First)</h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{items.length} pending</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Plan</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">UTR Reference</th>
                <th className="px-4 py-3.5">Screenshot</th>
                <th className="px-4 py-3.5">Submitted</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
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
                    🎉 All caught up! No pending UPI payments.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors">
                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-slate-900 font-bold">{item.name}</p>
                        <a
                          href={`/admin/users/${item.uid}`}
                          className="text-[11px] text-slate-400 hover:text-indigo-600 font-mono"
                        >
                          {item.email}
                        </a>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-indigo-700 uppercase">
                        {item.plan}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {item.billingCycle}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-extrabold text-emerald-600 text-sm">
                      ₹{item.amount.toLocaleString()}
                    </td>

                    {/* UTR */}
                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-900 font-bold select-all">
                          {item.utrNumber}
                        </span>
                        <button
                          onClick={() => copyUtr(item.utrNumber)}
                          className="text-slate-400 hover:text-indigo-600 p-0.5 cursor-pointer"
                          title="Copy UTR"
                        >
                          📋
                        </button>
                      </div>
                    </td>

                    {/* Screenshot */}
                    <td className="px-4 py-3.5">
                      {item.screenshotUrl ? (
                        <a
                          href={item.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold inline-flex items-center gap-1 underline"
                        >
                          🔗 View Proof
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">None</span>
                      )}
                    </td>

                    {/* Submitted */}
                    <td
                      className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-medium"
                      title={new Date(item.submittedAt).toLocaleString()}
                    >
                      {timeAgo(item.submittedAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setApproveItem(item)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => setRejectItem(item)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Collapsible Recently Reviewed History ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recently Reviewed Requests</h3>
            <p className="text-xs text-slate-500">Last 10 approved or rejected UPI payments</p>
          </div>
          <span className="text-slate-400 text-xs font-semibold">{showHistory ? '▲ Hide' : '▼ Show'}</span>
        </button>

        {showHistory && (
          <div className="border-t border-slate-100 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">UTR Number</th>
                  <th className="px-4 py-3">Decision</th>
                  <th className="px-4 py-3">Reviewed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400 font-medium">
                      No reviewed history yet
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-slate-900 font-bold">{h.name}</p>
                        <p className="text-slate-400 font-mono text-[11px]">{h.email}</p>
                      </td>
                      <td className="px-4 py-3 uppercase font-bold text-indigo-700">
                        {h.plan}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-slate-900">₹{h.amount}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 select-all">
                        {h.utrNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            h.status === 'approved'
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                              : 'bg-rose-50 border border-rose-200 text-rose-700'
                          }`}
                        >
                          {h.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                        {h.reviewedAt ? new Date(h.reviewedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modals */}
      {approveItem && (
        <UpiApproveModal
          item={approveItem}
          onClose={() => setApproveItem(null)}
          onSuccess={() => {
            fetchQueue();
            setToast('✅ UPI Payment approved & plan activated');
            setTimeout(() => setToast(''), 3000);
          }}
        />
      )}

      {rejectItem && (
        <UpiRejectModal
          item={rejectItem}
          onClose={() => setRejectItem(null)}
          onSuccess={() => {
            fetchQueue();
            setToast('❌ UPI Payment rejected');
            setTimeout(() => setToast(''), 3000);
          }}
        />
      )}
    </div>
  );
}
