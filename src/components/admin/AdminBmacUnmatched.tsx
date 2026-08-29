import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  Search, 
  CheckCircle, 
  Clock, 
  UserCheck, 
  RefreshCw, 
  ExternalLink,
  Zap,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  X
} from 'lucide-react';
import { BmacUnmatchedPayment, getBmacUnmatchedPayments, matchBmacTier } from '../../lib/bmac';
import { useAuthStore } from '../../lib/authStore';

export const AdminBmacUnmatched: React.FC = () => {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<BmacUnmatchedPayment[]>([]);
  const [filter, setFilter] = useState<'all' | 'unmatched' | 'resolved'>('unmatched');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModalPayment, setActiveModalPayment] = useState<BmacUnmatchedPayment | null>(null);
  const [targetEmail, setTargetEmail] = useState('');
  const [targetUid, setTargetUid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/bmac/unmatched', {
        headers: {
          'x-user-email': user?.email || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      } else {
        // Fallback to client-side Firestore/LocalStorage reader
        const fallbackList = await getBmacUnmatchedPayments();
        setPayments(fallbackList);
      }
    } catch (err) {
      console.warn('Could not fetch unmatched payments from API, using fallback:', err);
      const fallbackList = await getBmacUnmatchedPayments();
      setPayments(fallbackList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const filteredPayments = payments.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      return (
        p.supporterEmail.toLowerCase().includes(query) ||
        p.supporterName.toLowerCase().includes(query) ||
        String(p.bmacPaymentId).toLowerCase().includes(query)
      );
    }
    return true;
  });

  const unmatchedCount = payments.filter((p) => p.status === 'unmatched').length;

  const handleOpenMatchModal = (payment: BmacUnmatchedPayment) => {
    setActiveModalPayment(payment);
    setTargetEmail(payment.supporterEmail === 'anonymous@buymeacoffee.com' ? '' : payment.supporterEmail);
    setTargetUid('');
    setFeedback(null);
  };

  const handleExecuteMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalPayment) return;
    if (!targetEmail.trim() && !targetUid.trim()) {
      setFeedback({ type: 'error', message: 'Please provide either a user email or user ID' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/bmac/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          unmatchedId: activeModalPayment.id,
          targetEmail: targetEmail.trim() || undefined,
          targetUid: targetUid.trim() || undefined,
          amount: activeModalPayment.amount,
          supportCoffees: activeModalPayment.supportCoffees,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to match payment');
      }

      setFeedback({ type: 'success', message: data.message || 'Payment successfully matched & reward granted!' });
      setTimeout(() => {
        setActiveModalPayment(null);
        fetchPayments();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'An error occurred while matching payment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewTier = activeModalPayment ? matchBmacTier(activeModalPayment.amount) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Coffee size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Buy Me a Coffee Unmatched Payments
              </h3>
              {unmatchedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                  {unmatchedCount} Unresolved
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Supporter donations where the BMaC email didn't match an active account automatically
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPayments}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilter('unmatched')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              filter === 'unmatched'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Unmatched ({unmatchedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              filter === 'resolved'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Resolved
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search email or supporter..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredPayments.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <Coffee size={32} className="mx-auto text-slate-300 stroke-[1.5]" />
          <p className="text-sm font-semibold text-slate-600">No {filter} BMaC payments</p>
          <p className="text-xs text-slate-400">All incoming supporter donations are matched to active users!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Supporter Email / Name</th>
                <th className="py-3 px-4">Amount & Coffees</th>
                <th className="py-3 px-4">Calculated Reward</th>
                <th className="py-3 px-4">Note / Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPayments.map((p) => {
                const tier = matchBmacTier(p.amount);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.supporterEmail}</div>
                      <div className="text-[11px] text-slate-500">{p.supporterName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-black text-amber-900">${p.amount} USD</div>
                      <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                        <Coffee size={11} />
                        <span>{p.supportCoffees} {p.supportCoffees === 1 ? 'coffee' : 'coffees'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {tier ? (
                        <div className="flex items-center gap-1.5">
                          {tier.reward === 'credits' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1">
                              <Zap size={11} />
                              {tier.credits || p.supportCoffees * 50} Credits
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-bold text-[11px] flex items-center gap-1">
                              <Sparkles size={11} />
                              {tier.plan?.toUpperCase()} ({tier.billingCycle})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {Math.max(10, Math.round(p.amount * 10))} Bonus Credits
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-600 truncate max-w-[200px]" title={p.supportNote}>
                        {p.supportNote ? `"${p.supportNote}"` : <span className="text-slate-400 italic">No note</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {p.status === 'unmatched' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                          Pending Match
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle size={10} />
                            Resolved
                          </span>
                          {p.rewardGranted && (
                            <p className="text-[10px] text-slate-500 font-medium">
                              Granted: {p.rewardGranted}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.status === 'unmatched' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenMatchModal(p)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 ml-auto"
                        >
                          <UserCheck size={13} />
                          <span>Match User</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Resolved by {p.resolvedBy?.split('@')[0] || 'Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Match Modal */}
      {activeModalPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Coffee size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Match BMaC Supporter Payment
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    ${activeModalPayment.amount} USD ({activeModalPayment.supportCoffees} coffees)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Supporter Summary */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs space-y-1 text-amber-950">
              <div className="flex justify-between">
                <span className="text-amber-800">BMaC Email:</span>
                <span className="font-bold">{activeModalPayment.supporterEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-800">Supporter Name:</span>
                <span className="font-bold">{activeModalPayment.supporterName}</span>
              </div>
              {activeModalPayment.supportNote && (
                <div className="flex justify-between pt-1 border-t border-amber-200/60">
                  <span className="text-amber-800">Note:</span>
                  <span className="italic">"{activeModalPayment.supportNote}"</span>
                </div>
              )}
            </div>

            {/* Calculated Reward Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <span className="text-slate-500 font-semibold">Calculated Grant:</span>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                {previewTier?.reward === 'credits' && (
                  <span className="text-amber-700 flex items-center gap-1">
                    <Zap size={14} />
                    {previewTier.credits || activeModalPayment.supportCoffees * 50} Bonus Credits
                  </span>
                )}
                {previewTier?.reward === 'plan' && (
                  <span className="text-purple-700 flex items-center gap-1">
                    <Sparkles size={14} />
                    {previewTier.plan?.toUpperCase()} Plan ({previewTier.billingCycle})
                  </span>
                )}
                {!previewTier && (
                  <span className="text-slate-700">
                    {Math.max(10, Math.round(activeModalPayment.amount * 10))} Bonus Credits
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleExecuteMatch} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  KDP Studio Account Email to Credit
                </label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="author@domain.com"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Or Target User UID (Optional)
                </label>
                <input
                  type="text"
                  value={targetUid}
                  onChange={(e) => setTargetUid(e.target.value)}
                  placeholder="e.g. usr_123456"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {feedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalPayment(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck size={14} />
                  <span>{isSubmitting ? 'Matching...' : 'Apply & Grant Reward'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
