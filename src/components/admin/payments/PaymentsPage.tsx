'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { auth } from '../../../lib/firebase';
import type { AdminPaymentRow, AdminPaymentsResult } from '../../../types/admin';

// ── Helpers ──────────────────────────────────────────────────────────────────

const GATEWAY_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  razorpay: { label: 'Razorpay', bg: 'bg-blue-950/60 border-blue-500/30', text: 'text-blue-300' },
  paypal: { label: 'PayPal', bg: 'bg-indigo-950/60 border-indigo-500/30', text: 'text-indigo-300' },
  upi: { label: 'UPI Direct', bg: 'bg-emerald-950/60 border-emerald-500/30', text: 'text-emerald-300' },
  bmac: { label: 'BMaC', bg: 'bg-amber-950/60 border-amber-500/30', text: 'text-amber-300' },
};

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  completed: { label: 'Completed', bg: 'bg-emerald-900/40 text-emerald-300', text: '' },
  pending: { label: 'Pending', bg: 'bg-amber-900/40 text-amber-300', text: '' },
  failed: { label: 'Failed', bg: 'bg-red-900/40 text-red-300', text: '' },
  refunded: { label: 'Refunded', bg: 'bg-purple-900/40 text-purple-300', text: '' },
  cancelled: { label: 'Cancelled', bg: 'bg-slate-700 text-slate-400', text: '' },
};

// ── Modals ───────────────────────────────────────────────────────────────────

function PaymentDetailModal({
  payment,
  onClose,
  onRefundClick,
}: {
  payment: AdminPaymentRow;
  onClose: () => void;
  onRefundClick: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(payment.rawJson || JSON.stringify(payment, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🧾</span> Payment Transaction Details
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{payment.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Main summary grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
            <div>
              <p className="text-xs text-slate-500">Amount Paid</p>
              <p className="text-lg font-bold text-emerald-400">
                {payment.currency} {payment.amount.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-400">≈ ${payment.amountUSD.toFixed(2)} USD</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Gateway</p>
              <p className="text-sm font-semibold text-white capitalize mt-0.5">{payment.gateway}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <span
                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
                  STATUS_BADGES[payment.status]?.bg || 'bg-slate-700 text-slate-300'
                }`}
              >
                {payment.status.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500">Plan</p>
              <p className="text-sm font-semibold text-purple-300 capitalize mt-0.5">
                {payment.plan} ({payment.billingCycle})
              </p>
            </div>
          </div>

          {/* User info */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Customer Information
            </h3>
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="text-white font-medium">{payment.userName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-white font-mono">{payment.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">User ID:</span>
                <a
                  href={`/admin/users/${payment.uid}`}
                  className="text-purple-400 hover:text-purple-300 font-mono"
                >
                  {payment.uid} →
                </a>
              </div>
            </div>
          </div>

          {/* Gateway details */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Gateway Identifiers
            </h3>
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Payment / Tx ID:</span>
                <span className="text-slate-300 select-all">{payment.gatewayPaymentId}</span>
              </div>
              {payment.gatewaySubscriptionId && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Subscription ID:</span>
                  <span className="text-slate-300 select-all">{payment.gatewaySubscriptionId}</span>
                </div>
              )}
              {payment.gatewayCustomerId && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Customer ID:</span>
                  <span className="text-slate-300 select-all">{payment.gatewayCustomerId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Created:</span>
                <span className="text-slate-300 font-sans">{new Date(payment.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Raw JSON Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Raw Metadata Payload
              </h3>
              <button
                onClick={handleCopyJson}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                {copied ? '✅ Copied' : '📋 Copy JSON'}
              </button>
            </div>
            <pre className="bg-[#0f0f1a] border border-white/10 rounded-lg p-3 text-[11px] text-slate-400 overflow-x-auto max-h-40 font-mono">
              {payment.rawJson}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-between items-center bg-black/20">
          <div>
            {payment.status === 'completed' && (
              <button
                onClick={() => {
                  onClose();
                  onRefundClick();
                }}
                className="px-3.5 py-2 bg-red-950/60 border border-red-500/30 text-red-300 hover:bg-red-900/60 text-xs font-semibold rounded-lg transition-colors"
              >
                💸 Issue Refund
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function RefundModal({
  payment,
  onClose,
  onSuccess,
}: {
  payment: AdminPaymentRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState<number>(payment.amount);
  const [reason, setReason] = useState('Customer request');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProcessRefund = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: payment.id,
          amount,
          reason,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refund failed');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const getGatewayWarning = () => {
    if (payment.gateway === 'razorpay') {
      return '⚠️ Refund will be executed immediately via the Razorpay Refunds API.';
    }
    if (payment.gateway === 'paypal') {
      return '⚠️ Refund will be executed immediately via the PayPal REST API.';
    }
    if (payment.gateway === 'upi') {
      return 'ℹ️ UPI refunds are manual. This will record the refund in the database, but you must transfer the money back in your UPI app.';
    }
    return 'ℹ️ Buy Me a Coffee refunds must be handled inside the BMaC dashboard.';
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>💸</span> Issue Refund
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-3 text-xs text-red-300">
          {getGatewayWarning()}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Refund Amount ({payment.currency})
          </label>
          <input
            type="number"
            step="0.01"
            max={payment.amount}
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Original payment: {payment.currency} {payment.amount.toFixed(2)}
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Refund Reason <span className="text-red-400">*</span>
          </label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          >
            <option value="Customer request">Customer request</option>
            <option value="Duplicate payment">Duplicate payment</option>
            <option value="Service issue">Service issue</option>
            <option value="Fraudulent charge">Fraudulent charge</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Internal Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Approved via Zendesk ticket #409"
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
            onClick={handleProcessRefund}
            disabled={loading || amount <= 0 || amount > payment.amount}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-md"
          >
            {loading ? 'Processing…' : `Confirm Refund`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export function PaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [gateway, setGateway] = useState('all');
  const [plan, setPlan] = useState('all');
  const [status, setStatus] = useState('all');
  const [currency, setCurrency] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals & Export state
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentRow | null>(null);
  const [refundTarget, setRefundTarget] = useState<AdminPaymentRow | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPayments = useCallback(
    async (pg = page, sq = search) => {
      setLoading(true);
      try {
        const token = await auth?.currentUser?.getIdToken();
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(pg * PAGE_SIZE),
        });

        if (sq) params.set('search', sq);
        if (gateway !== 'all') params.set('gateway', gateway);
        if (plan !== 'all') params.set('plan', plan);
        if (status !== 'all') params.set('status', status);
        if (currency !== 'all') params.set('currency', currency);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        const res = await fetch(`/api/admin/payments?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: AdminPaymentsResult = await res.json();
        setPayments(data.payments || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error('[PaymentsPage]', err);
      } finally {
        setLoading(false);
      }
    },
    [page, search, gateway, plan, status, currency, startDate, endDate]
  );

  useEffect(() => {
    fetchPayments(page, search);
  }, [page, gateway, plan, status, currency, startDate, endDate]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(0);
      fetchPayments(0, val);
    }, 300);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (gateway !== 'all') params.set('gateway', gateway);
      if (plan !== 'all') params.set('plan', plan);
      if (status !== 'all') params.set('status', status);
      if (currency !== 'all') params.set('currency', currency);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/admin/payments/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kdpstudio-payments-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast('✅ Payments exported to CSV');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const copyTxId = (txId: string) => {
    navigator.clipboard.writeText(txId);
    setToast('📋 Transaction ID copied');
    setTimeout(() => setToast(''), 2500);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e35] border border-white/10 text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>💳</span> Payment History & Transactions
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {total > 0
              ? `Showing ${start}–${end} of ${total.toLocaleString()} transactions across all gateways`
              : 'All processed creator transactions'}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={exporting || total === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] border border-white/10 hover:border-white/20 rounded-lg text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50"
        >
          📥 {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* ── Filters Bar ── */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by customer email, name, transaction ID, or payment ID…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Gateway Filter */}
          <select
            value={gateway}
            onChange={e => { setGateway(e.target.value); setPage(0); }}
            className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Gateways</option>
            <option value="razorpay">Razorpay</option>
            <option value="paypal">PayPal</option>
            <option value="upi">UPI Direct</option>
            <option value="bmac">Buy Me a Coffee</option>
          </select>

          {/* Plan Filter */}
          <select
            value={plan}
            onChange={e => { setPlan(e.target.value); setPage(0); }}
            className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="agency">Agency</option>
            <option value="lifetime">Lifetime</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(0); }}
            className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>

          {/* Currency Filter */}
          <select
            value={currency}
            onChange={e => { setCurrency(e.target.value); setPage(0); }}
            className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Currencies</option>
            <option value="USD">USD ($)</option>
            <option value="INR">INR (₹)</option>
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
            <option value="CAD">CAD (C$)</option>
            <option value="AUD">AUD (A$)</option>
          </select>

          {/* Start & End Date */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">From</span>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(0); }}
              className="bg-transparent text-xs text-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">To</span>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPage(0); }}
              className="bg-transparent text-xs text-slate-300 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Payments Table ── */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Gateway</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No transactions match your search filters
                  </td>
                </tr>
              ) : (
                payments.map(p => {
                  const gw = GATEWAY_BADGES[p.gateway] || {
                    label: p.gateway,
                    bg: 'bg-slate-700',
                    text: 'text-slate-300',
                  };
                  const st = STATUS_BADGES[p.status] || {
                    label: p.status,
                    bg: 'bg-slate-700 text-slate-300',
                    text: '',
                  };

                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}{' '}
                        <span className="text-[10px] text-slate-600">
                          {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="max-w-[160px]">
                          <p className="text-white font-medium truncate">{p.userName || 'Author'}</p>
                          <a
                            href={`/admin/users/${p.uid}`}
                            className="text-[11px] text-slate-500 hover:text-purple-300 truncate block font-mono"
                          >
                            {p.userEmail}
                          </a>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <span className="capitalize font-semibold text-purple-300">
                          {p.plan}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {p.billingCycle}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-white font-semibold">
                          {p.currency} {p.amount.toFixed(2)}
                        </p>
                        {p.currency !== 'USD' && (
                          <p className="text-[10px] text-slate-500">
                            (${p.amountUSD.toFixed(2)} USD)
                          </p>
                        )}
                      </td>

                      {/* Gateway Badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${gw.bg} ${gw.text}`}
                        >
                          {gw.label}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg}`}
                        >
                          {st.label}
                        </span>
                      </td>

                      {/* Monospace TxID */}
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[100px]" title={p.gatewayPaymentId}>
                            {p.gatewayPaymentId}
                          </span>
                          <button
                            onClick={() => copyTxId(p.gatewayPaymentId)}
                            className="text-slate-600 hover:text-slate-300 p-0.5"
                            title="Copy Transaction ID"
                          >
                            📋
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded text-[11px] font-medium transition-colors"
                          >
                            Details
                          </button>
                          {p.status === 'completed' && (
                            <button
                              onClick={() => setRefundTarget(p)}
                              className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-red-300 rounded text-[11px] font-medium transition-colors"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onRefundClick={() => setRefundTarget(selectedPayment)}
        />
      )}

      {refundTarget && (
        <RefundModal
          payment={refundTarget}
          onClose={() => setRefundTarget(null)}
          onSuccess={() => {
            fetchPayments();
            setToast('✅ Refund processed successfully');
            setTimeout(() => setToast(''), 3000);
          }}
        />
      )}
    </div>
  );
}
