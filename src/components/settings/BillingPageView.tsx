import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Calendar, 
  ArrowUpRight, 
  Zap, 
  Receipt,
  Download,
  AlertCircle,
  Clock,
  Coffee,
  ChevronDown,
  ChevronUp,
  X,
  Printer,
  CheckCircle2,
  Lock,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useGeoStore } from '../../lib/geoStore';
import { PRICING_TABLE, formatPrice } from '../../lib/geo';
import { PageRoute } from '../../types';
import { CurrencySelector } from '../ui/CurrencySelector';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { getUserPaymentHistory } from '../../lib/paymentService';
import { PaymentRecord, PlanName } from '../../types/payment';
import { BmacButton } from '../payment/BmacButton';
import { UsageWidget } from '../dashboard/UsageWidget';

interface BillingPageViewProps {
  onNavigate?: (route: PageRoute) => void;
}

const GATEWAY_BADGE_STYLE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  razorpay: { label: 'Razorpay', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  paypal: { label: 'PayPal', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  upi: { label: 'UPI Direct', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  bmac: { label: 'Buy Me a Coffee', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
};

const PLAN_BADGE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  free: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  starter: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  pro: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  agency: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  lifetime: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
};

export const BillingPageView: React.FC<BillingPageViewProps> = ({ onNavigate }) => {
  const { user, userDoc, refreshUserData } = useAuthStore();
  const { currency, getFormattedPrice } = useGeoStore();
  const checkout = useCheckoutStore();

  const currentPlan = (userDoc?.plan?.toLowerCase() as PlanName) || 'free';
  const planNameUpper = currentPlan.toUpperCase();
  const isPaidPlan = currentPlan !== 'free';
  const isCancelled = Boolean(userDoc?.subscriptionCancelled);

  // States
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  
  // Cancellation state
  const [isCancelSectionOpen, setIsCancelSectionOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Too expensive');
  const [cancelNotes, setCancelNotes] = useState('');
  const [confirmCancelText, setConfirmCancelText] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Fetch payment history
  useEffect(() => {
    if (!user?.uid) {
      setLoadingPayments(false);
      return;
    }

    getUserPaymentHistory(user.uid)
      .then((records) => {
        setPayments(records);
      })
      .catch((err) => console.warn('Failed to load payment history:', err))
      .finally(() => setLoadingPayments(false));
  }, [user]);

  // Billing end date formatting
  const planEndDateStr = userDoc?.planEndDate
    ? new Date(userDoc.planEndDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Handle Cancel Subscription
  const handleCancelSubscription = async () => {
    if (confirmCancelText.trim() !== 'CANCEL' || !user?.uid) {
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      const res = await fetch('/api/payment/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
        },
        body: JSON.stringify({
          uid: user.uid,
          reason: cancelReason,
          notes: cancelNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      setCancelSuccessMsg(
        `Subscription cancelled. You will retain ${planNameUpper} access until ${planEndDateStr || 'the end of your billing cycle'}.`
      );
      await refreshUserData();
      setIsCancelSectionOpen(false);
    } catch (err: any) {
      setCancelError(err.message || 'An error occurred while cancelling your subscription.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrintReceipt = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const planBadgeStyle = PLAN_BADGE_STYLE[currentPlan] || PLAN_BADGE_STYLE.pro;

  return (
    <div id="billing-settings-view" className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Subscription & Billing Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your publishing plan, monthly usage quotas, bonus credits, and invoice receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Billing Currency:</span>
          <CurrencySelector />
        </div>
      </div>

      {/* ─────────────────────────────────────────
          SECTION 1 — Current Plan Overview
         ───────────────────────────────────────── */}
      <div id="billing-current-plan" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${planBadgeStyle.bg} ${planBadgeStyle.text} ${planBadgeStyle.border}`}>
                {planNameUpper} PLAN
              </span>

              {isPaidPlan && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  isCancelled ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isCancelled ? 'Cancels at Period End' : 'Active Subscription'}
                </span>
              )}
            </div>

            <h3 className="text-2xl font-black text-slate-900 pt-1">
              {currentPlan === 'free'
                ? 'Kindle Creator Free Tier'
                : `Kindle Creator ${planNameUpper} Edition`}
            </h3>

            <p className="text-xs text-slate-600 max-w-lg">
              {currentPlan === 'free'
                ? 'Standard author tools with daily quota resets. Upgrade for unlimited AI writing and 300 DPI exports.'
                : `Active publishing tier with full access to formatting engines, multilingual translation, and cover generation.`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id="billing-upgrade-plan-btn"
              type="button"
              onClick={() => checkout.open(currentPlan === 'free' ? 'pro' : 'agency')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Sparkles size={16} />
              <span>{currentPlan === 'free' ? 'Upgrade Plan' : 'Change / Upgrade Plan'}</span>
            </button>
          </div>
        </div>

        {/* Subscription Meta Details Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Cost</div>
            <div className="text-xl font-black text-slate-900">
              {currentPlan === 'free' 
                ? '₹0 / $0' 
                : getFormattedPrice(currentPlan, currency)}
            </div>
            <div className="text-[11px] text-slate-500">
              {currentPlan === 'free' ? 'Always Free' : 'Billed Monthly / Annual'}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isCancelled ? 'Access Valid Until' : 'Next Renewal Date'}
            </div>
            <div className="text-xl font-black text-slate-900">
              {planEndDateStr || 'Continuous'}
            </div>
            <div className="text-[11px] text-slate-500">
              {isCancelled ? 'Reverts to Free tier afterwards' : 'Renews automatically'}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Method</div>
            <div className="text-xl font-black text-slate-900">
              {userDoc?.paymentFailed ? 'Payment Issue' : isPaidPlan ? 'Card / UPI / PayPal' : 'Free Account'}
            </div>
            <div className="text-[11px] text-slate-500">
              {userDoc?.paymentFailed ? '⚠️ Please update payment details' : 'Secure gateway link'}
            </div>
          </div>
        </div>

        {/* Cancellation Message Banner if active */}
        {cancelSuccessMsg && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertCircle size={16} className="shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong>Cancellation confirmed:</strong> {cancelSuccessMsg}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────
          SECTION 2 — Usage This Month & Bonus Credits
         ───────────────────────────────────────── */}
      <div id="billing-usage-section" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Monthly Usage Quotas</h3>
            <p className="text-xs text-slate-500">
              Real-time monitoring of your daily and monthly generation limits.
            </p>
          </div>

          {/* Credits Badge & Buy More */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black flex items-center gap-1.5">
              <Zap size={14} className="text-amber-600" />
              <span>{userDoc?.credits || 0} Bonus Credits</span>
            </div>

            <BmacButton variant="credits" showNotice={false} />
          </div>
        </div>

        {/* Usage Visual Bars */}
        <UsageWidget onNavigateToPricing={() => checkout.open()} />
      </div>

      {/* ─────────────────────────────────────────
          SECTION 3 — Payment History & Receipts
         ───────────────────────────────────────── */}
      <div id="billing-payment-history" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Payment History & Invoices</h3>
            <p className="text-xs text-slate-500">
              Download tax receipts and view all completed transactions.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {payments.length} Transaction{payments.length === 1 ? '' : 's'}
          </span>
        </div>

        {loadingPayments ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-purple-600" />
            <span>Loading payment records...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-10 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt size={22} />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-800">No Payments Yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once you upgrade or purchase bonus credits, your official receipts and transaction details will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Date</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Gateway</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const gatewayStyle = GATEWAY_BADGE_STYLE[p.gateway] || GATEWAY_BADGE_STYLE.razorpay;
                  const dateFormatted = p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pl-2 font-medium text-slate-900">{dateFormatted}</td>
                      <td className="py-3.5 font-bold uppercase text-slate-800">{p.plan}</td>
                      <td className="py-3.5 font-black text-slate-900">
                        {p.currency === 'INR' ? `₹${(p.amount / 100).toFixed(0)}` : `$${(p.amount / 100).toFixed(2)}`}
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${gatewayStyle.bg} ${gatewayStyle.text} ${gatewayStyle.border}`}>
                          {gatewayStyle.label}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : p.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(p)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          <Receipt size={12} />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────
          SECTION 4 — Cancel Subscription Accordion
         ───────────────────────────────────────── */}
      {isPaidPlan && !isCancelled && (
        <div id="billing-cancel-subscription" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
          <button
            type="button"
            onClick={() => setIsCancelSectionOpen(!isCancelSectionOpen)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cancel Subscription
              </h3>
              <p className="text-xs text-slate-500">
                Turn off recurring billing and revert to the free plan at the end of your billing cycle.
              </p>
            </div>
            <div className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              {isCancelSectionOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {isCancelSectionOpen && (
            <div className="pt-4 border-t border-slate-100 space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <strong>Important Notice:</strong> Your plan will remain active with full {planNameUpper} features until{' '}
                <span className="font-bold">{planEndDateStr || 'the end of your current cycle'}</span>. After that, your account will move to the Free tier. Your books and projects are always preserved safely.
              </div>

              {/* Cancellation Reason Form */}
              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Why are you cancelling? (Help us improve)
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
                  >
                    <option value="Too expensive">Too expensive</option>
                    <option value="Not using enough">Not using enough</option>
                    <option value="Missing features">Missing features</option>
                    <option value="Found alternative">Found alternative tool</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Tell us more (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={cancelNotes}
                    onChange={(e) => setCancelNotes(e.target.value)}
                    placeholder="What could we have done better?"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-rose-700">
                    Type <span className="underline font-mono">CANCEL</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmCancelText}
                    onChange={(e) => setConfirmCancelText(e.target.value)}
                    placeholder="CANCEL"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50/40 text-xs font-mono font-bold text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                {cancelError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                    {cancelError}
                  </div>
                )}

                <button
                  type="button"
                  disabled={confirmCancelText.trim() !== 'CANCEL' || isCancelling}
                  onClick={handleCancelSubscription}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isCancelling ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>Confirm Subscription Cancellation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────
          RECEIPT MODAL (Printable PDF View)
         ───────────────────────────────────────── */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Printable Receipt Div */}
            <div id="printable-receipt-card" className="space-y-6 p-4 border border-slate-100 rounded-2xl bg-slate-50/40">
              
              {/* Receipt Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                      KC
                    </div>
                    <span className="text-base font-black text-slate-900">Kindle Creator</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Amazon KDP Author Publishing Studio</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                    Payment Receipt
                  </span>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">{selectedReceipt.id}</div>
                </div>
              </div>

              {/* Receipt Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Billed To</span>
                  <div className="font-bold text-slate-900">{user?.displayName || 'Author'}</div>
                  <div className="text-slate-600 text-[11px]">{user?.email || 'customer@kdpstudio.app'}</div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Payment Date</span>
                  <div className="font-bold text-slate-900">
                    {new Date(selectedReceipt.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-slate-600 text-[11px]">Via {selectedReceipt.gateway.toUpperCase()}</div>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t border-b border-slate-200 py-3 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>KDP Studio {selectedReceipt.plan.toUpperCase()} Plan Subscription</span>
                  <span>
                    {selectedReceipt.currency === 'INR'
                      ? `₹${(selectedReceipt.amount / 100).toFixed(0)}`
                      : `$${(selectedReceipt.amount / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Billing cycle: {selectedReceipt.billingCycle} • Status: {selectedReceipt.status}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between font-black text-base text-slate-900">
                <span>Total Amount Paid</span>
                <span className="text-purple-600">
                  {selectedReceipt.currency === 'INR'
                    ? `₹${(selectedReceipt.amount / 100).toFixed(0)}`
                    : `$${(selectedReceipt.amount / 100).toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Receipt Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>Print / Save PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
