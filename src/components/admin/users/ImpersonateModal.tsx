'use client';

import React, { useState } from 'react';
import { auth } from '../../../lib/firebase';
import { startImpersonation } from '../ImpersonationBanner';

interface ImpersonateModalProps {
  uid: string;
  name: string;
  email: string;
  onClose: () => void;
}

export function ImpersonateModal({ uid, name, email, onClose }: ImpersonateModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBegin = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/users/${uid}/impersonate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create token');

      // Start impersonation — signs in as target user and redirects
      await startImpersonation(uid, name, email, data.customToken);
    } catch (err: any) {
      setError(err.message || 'Impersonation failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-900/40 border border-red-500/30 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Impersonate User</h2>
            <p className="text-sm text-red-400">Dangerous action — read carefully</p>
          </div>
        </div>

        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-5 space-y-2">
          <p className="text-sm text-white">
            You are about to view the app as <strong className="text-red-300">{name}</strong>.
          </p>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            <li>All actions you take <strong>WILL affect their real account</strong>.</li>
            <li>A red banner will remind you that you are impersonating.</li>
            <li>Click "Stop Impersonating" to return to your admin account.</li>
          </ul>
          <p className="text-xs text-slate-500 mt-2">
            Impersonating: <code className="text-slate-400">{email}</code>
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-300 mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            id="begin-impersonation-btn"
            onClick={handleBegin}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            {loading ? 'Starting…' : 'Begin Impersonation'}
          </button>
        </div>
      </div>
    </div>
  );
}
