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
    <div className="p-6 space-y-6 max-w-7xl mx-auto relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e35] border border-white/10 text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header with Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🕐</span> UPI Pending Verification Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verify UTR numbers from Indian UPI bank transfers and activate instant access
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Auto-refreshing every 60s
          </span>
          <button
            onClick={() => { setLoading(true); fetchQueue(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a2e] border border-white/10 hover:border-white/20 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* ── Stats Row ── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Pending Requests</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {loading ? '…' : stats?.pendingCount ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Requires manual verification</p>
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Total Amount</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {loading ? '…' : `₹${(stats?.totalAmount ?? 0).toLocaleString()}`}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting credit approval</p>
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Oldest Pending</p>
          <p className="text-lg font-bold text-white mt-1">
            {loading ? '…' : stats?.oldestPending ? timeAgo(stats.oldestPending) : 'None'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">FIFO queue priority</p>
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Avg Response Time</p>
          <p className="text-lg font-bold text-purple-300 mt-1">
            {loading ? '…' : `${stats?.avgVerificationHours ?? 2.4} hrs`}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Past 30 days benchmark</p>
        </div>
      </section>

      {/* ── Pending Table ── */}
      <section className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Pending Requests (Oldest First)</h2>
          <span className="text-xs text-slate-500">{items.length} items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">UTR Reference</th>
                <th className="px-4 py-3">Screenshot</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    🎉 All caught up! No pending UPI payments.
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <a
                          href={`/admin/users/${item.uid}`}
                          className="text-[11px] text-slate-500 hover:text-purple-300 font-mono"
                        >
                          {item.email}
                        </a>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-purple-300 uppercase">
                        {item.plan}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {item.billingCycle}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-emerald-400 text-sm">
                      ₹{item.amount.toLocaleString()}
                    </td>

                    {/* UTR */}
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white font-bold select-all">
                          {item.utrNumber}
                        </span>
                        <button
                          onClick={() => copyUtr(item.utrNumber)}
                          className="text-slate-500 hover:text-white"
                          title="Copy UTR"
                        >
                          📋
                        </button>
                      </div>
                    </td>

                    {/* Screenshot */}
                    <td className="px-4 py-3">
                      {item.screenshotUrl ? (
                        <a
                          href={item.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1 underline"
                        >
                          🔗 View Image
                        </a>
                      ) : (
                        <span className="text-slate-600 text-xs">None</span>
                      )}
                    </td>

                    {/* Submitted */}
                    <td
                      className="px-4 py-3 whitespace-nowrap text-slate-400"
                      title={new Date(item.submittedAt).toLocaleString()}
                    >
                      {timeAgo(item.submittedAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setApproveItem(item)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => setRejectItem(item)}
                          className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold rounded-lg transition-colors"
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
      <section className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-white/3 transition-colors"
        >
          <div>
            <h2 className="text-sm font-semibold text-white">Recently Reviewed Requests</h2>
            <p className="text-xs text-slate-500">Last 10 approved or rejected UPI payments</p>
          </div>
          <span className="text-slate-400 text-sm">{showHistory ? '▲ Hide' : '▼ Show'}</span>
        </button>

        {showHistory && (
          <div className="border-t border-white/10 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 uppercase font-semibold">
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Plan</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">UTR Number</th>
                  <th className="px-4 py-2.5">Decision</th>
                  <th className="px-4 py-2.5">Reviewed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      No reviewed history yet
                    </td>
                  </tr>
                ) : (
                  history.map(h => (
                    <tr key={h.id} className="hover:bg-white/5">
                      <td className="px-4 py-2.5">
                        <p className="text-white font-medium">{h.name}</p>
                        <p className="text-slate-500 font-mono text-[11px]">{h.email}</p>
                      </td>
                      <td className="px-4 py-2.5 uppercase font-semibold text-purple-300">
                        {h.plan}
                      </td>
                      <td className="px-4 py-2.5 font-bold">₹{h.amount}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400 select-all">
                        {h.utrNumber}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            h.status === 'approved'
                              ? 'bg-emerald-900/40 text-emerald-300'
                              : 'bg-red-900/40 text-red-300'
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
