/**
 * Admin UPI Payments Approval Management Component
 * Allows administrators to inspect, verify, approve, or reject manual UPI transactions.
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  AlertCircle, 
  Image as ImageIcon,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  X
} from 'lucide-react';
import { UpiPendingPayment } from '../../types/payment';
import { getPendingUpiPayments } from '../../lib/paymentService';
import { useAuthStore } from '../../lib/authStore';

export const AdminUpiPayments: React.FC = () => {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<UpiPendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Modals state
  const [selectedForApprove, setSelectedForApprove] = useState<UpiPendingPayment | null>(null);
  const [selectedForReject, setSelectedForReject] = useState<UpiPendingPayment | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Action loading states
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Rejection form
  const [rejectReason, setRejectReason] = useState<string>('UTR not found');
  const [rejectNotes, setRejectNotes] = useState<string>('');

  const adminEmail = (typeof process !== 'undefined' && process.env?.ADMIN_EMAIL) || 'arulraj8637@gmail.com';
  const isAuthorized = user?.email?.toLowerCase() === adminEmail.toLowerCase();

  const fetchPendingPayments = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const list = await getPendingUpiPayments();
      setPayments(list);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.warn('[AdminUpiPayments] Error fetching payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchPendingPayments();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleConfirmApprove = async () => {
    if (!selectedForApprove) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/upi/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || adminEmail,
        },
        body: JSON.stringify({
          pendingId: selectedForApprove.id,
          adminEmail: user?.email || adminEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve payment');
      }

      setSuccessMsg(`Payment for ${selectedForApprove.name} (₹${selectedForApprove.amount}) approved & plan upgraded.`);
      setSelectedForApprove(null);
      await fetchPendingPayments();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Error approving payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedForReject) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/upi/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || adminEmail,
        },
        body: JSON.stringify({
          pendingId: selectedForReject.id,
          reason: rejectReason,
          notes: rejectNotes,
          adminEmail: user?.email || adminEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject payment');
      }

      setSuccessMsg(`Payment for ${selectedForReject.name} marked as rejected.`);
      setSelectedForReject(null);
      setRejectNotes('');
      await fetchPendingPayments();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Error rejecting payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimeAgo = (timeString: any) => {
    if (!timeString) return 'recently';
    const date = typeof timeString === 'string' ? new Date(timeString) : new Date();
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div id="admin-upi-payments" className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">
              UPI Direct Payments Approval Queue
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
              payments.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Pending: {payments.length}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Verify manual UTR submissions against bank statement and activate user subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            type="button"
            onClick={fetchPendingPayments}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Pending List"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-purple-600' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Table */}
      {payments.length === 0 ? (
        <div className="py-12 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div className="text-sm font-bold text-slate-800">All caught up!</div>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            There are currently no pending UPI manual verification requests in the queue.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Plan & Cycle</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">UTR Reference</th>
                <th className="py-3 px-4">Screenshot</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* User */}
                  <td className="py-3.5 px-4 font-medium">
                    <div className="font-bold text-slate-900">{p.name || 'Author'}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{p.email}</div>
                  </td>

                  {/* Plan */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 capitalize">
                      {p.plan} ({p.billingCycle})
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4">
                    <span className="font-black text-slate-900 text-sm">
                      ₹{p.amount?.toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* UTR */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded w-fit">
                      <span>{p.utrNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyUtr(p.utrNumber)}
                        className="text-slate-400 hover:text-purple-600 cursor-pointer"
                        title="Copy UTR"
                      >
                        {copiedUtr === p.utrNumber ? (
                          <Check size={12} className="text-emerald-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Screenshot */}
                  <td className="py-3.5 px-4">
                    {p.screenshotUrl ? (
                      <button
                        type="button"
                        onClick={() => setSelectedScreenshot(p.screenshotUrl)}
                        className="text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 underline cursor-pointer"
                      >
                        <ImageIcon size={13} />
                        <span>View</span>
                      </button>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>

                  {/* Submitted */}
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatTimeAgo(p.submittedAt)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedForApprove(p)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 size={13} />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedForReject(p)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─────────────────────────────────────────
          APPROVE CONFIRMATION MODAL
         ───────────────────────────────────────── */}
      {selectedForApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <ShieldCheck size={20} />
                <span>Confirm Plan Approval</span>
              </div>
              <button 
                onClick={() => setSelectedForApprove(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to approve the UPI transaction of{' '}
              <strong className="text-slate-900 font-black">₹{selectedForApprove.amount}</strong> for{' '}
              <strong className="text-slate-900">{selectedForApprove.name}</strong>?
            </p>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-700">
              <div>Plan: <strong className="capitalize">{selectedForApprove.plan} ({selectedForApprove.billingCycle})</strong></div>
              <div>Email: <strong>{selectedForApprove.email}</strong></div>
              <div>UTR Reference: <strong className="font-mono">{selectedForApprove.utrNumber}</strong></div>
            </div>

            <p className="text-[11px] text-slate-500">
              This will immediately upgrade the user's account to <strong>{selectedForApprove.plan}</strong> plan and send a confirmation email.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedForApprove(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Confirm Approve</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────
          REJECT REASON MODAL
         ───────────────────────────────────────── */}
      {selectedForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <ShieldAlert size={20} />
                <span>Reject UPI Payment</span>
              </div>
              <button 
                onClick={() => setSelectedForReject(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select the reason for rejecting payment for <strong>{selectedForReject.name}</strong> (UTR: {selectedForReject.utrNumber}).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white"
                >
                  <option value="UTR not found">UTR not found in bank statement</option>
                  <option value="Wrong amount paid">Wrong amount paid</option>
                  <option value="Duplicate submission">Duplicate submission</option>
                  <option value="Suspicious activity">Suspicious activity</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Notes (Optional)</label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="e.g. Transferred ₹199 instead of ₹499"
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedForReject(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                <span>Reject Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────
          SCREENSHOT PREVIEW MODAL
         ───────────────────────────────────────── */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Payment Screenshot</span>
              <button 
                onClick={() => setSelectedScreenshot(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 flex items-center justify-center bg-slate-50">
              <img 
                src={selectedScreenshot} 
                alt="Payment receipt proof" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
