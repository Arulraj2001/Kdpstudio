'use client';

import React, { useState } from 'react';
import { auth } from '../../../lib/firebase';

interface ChangePlanModalProps {
  uid: string;
  currentPlan: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PLANS = [
  { id: 'free', label: 'Free', color: 'text-slate-400 border-slate-600', price: '$0/mo' },
  { id: 'starter', label: 'Starter', color: 'text-blue-400 border-blue-600', price: '$9/mo' },
  { id: 'pro', label: 'Pro', color: 'text-purple-400 border-purple-600', price: '$29/mo' },
  { id: 'agency', label: 'Agency', color: 'text-amber-400 border-amber-600', price: '$79/mo' },
  { id: 'lifetime', label: 'Lifetime', color: 'text-emerald-400 border-emerald-600', price: 'One-time' },
];

const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'annual', label: 'Annual' },
  { id: 'lifetime', label: 'Lifetime' },
];

export function ChangePlanModal({
  uid, currentPlan, userName, onClose, onSuccess,
}: ChangePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update_plan',
          plan: selectedPlan,
          billingCycle,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Change Plan</h2>
            <p className="text-sm text-slate-400">{userName}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl">✕</button>
        </div>

        {/* Plan selector */}
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Plan</p>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map(plan => (
              <button
                key={plan.id}
                id={`plan-option-${plan.id}`}
                onClick={() => setSelectedPlan(plan.id)}
                className={`border rounded-lg p-2.5 text-center transition-all ${
                  selectedPlan === plan.id
                    ? `${plan.color} bg-white/5 border-current`
                    : 'border-white/10 text-slate-500 hover:border-white/20'
                }`}
              >
                <p className={`text-sm font-semibold ${selectedPlan === plan.id ? '' : 'text-slate-400'}`}>
                  {plan.label}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">{plan.price}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Billing cycle */}
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Billing Cycle</p>
          <div className="flex gap-2">
            {BILLING_CYCLES.map(cycle => (
              <button
                key={cycle.id}
                id={`billing-${cycle.id}`}
                onClick={() => setBillingCycle(cycle.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                  billingCycle === cycle.id
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                {cycle.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-2 mb-4">
          <label htmlFor="plan-reason" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Reason <span className="text-red-400">*</span>
          </label>
          <textarea
            id="plan-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Complimentary Pro for beta testing"
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {/* Warning */}
        <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-400 mb-4">
          ℹ️ This will <strong>NOT</strong> create a payment charge. Use only for manual grants, refunds, or compensations.
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-3">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            id="apply-plan-change-btn"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            {loading ? 'Applying…' : 'Apply Plan Change'}
          </button>
        </div>
      </div>
    </div>
  );
}
