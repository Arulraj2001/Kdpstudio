'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { auth } from '../../../lib/firebase';
import type { BroadcastJob, BroadcastAudienceFilter } from '../../../types/admin';

export function BroadcastEmailPage() {
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [audienceType, setAudienceType] = useState<BroadcastAudienceFilter['type']>('all');
  const [country, setCountry] = useState('');
  const [specificEmailsText, setSpecificEmailsText] = useState('');
  const [excludeUnsubscribed, setExcludeUnsubscribed] = useState(true);
  const [excludeBanned, setExcludeBanned] = useState(true);

  const [previewMode, setPreviewMode] = useState(false);
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [history, setHistory] = useState<BroadcastJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [activeJob, setActiveJob] = useState<BroadcastJob | null>(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  // 1. Fetch estimated recipient count
  const fetchAudienceCount = useCallback(async () => {
    try {
      const token = await auth?.currentUser?.getIdToken();
      const specificEmails = specificEmailsText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/broadcast/audience-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          audience: {
            type: audienceType,
            country: country || undefined,
            specificEmails: specificEmails.length > 0 ? specificEmails : undefined,
            excludeUnsubscribed,
            excludeBanned,
          },
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setEstimatedCount(data.count ?? 0);
    } catch {
      // ignore
    }
  }, [audienceType, country, specificEmailsText, excludeUnsubscribed, excludeBanned]);

  // 2. Fetch broadcast history
  const fetchHistory = useCallback(async () => {
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/broadcast', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setHistory(data.history || []);
      const running = data.history?.find((j: BroadcastJob) => j.status === 'sending');
      if (running) setActiveJob(running);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchAudienceCount();
  }, [fetchAudienceCount]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Handle Test Send
  const handleSendTest = async () => {
    if (!subject.trim() || !bodyMarkdown.trim()) {
      setError('Please provide subject and email content');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/broadcast/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject,
          preheader,
          bodyMarkdown,
          isTest: true,
        }),
      });
      if (!res.ok) throw new Error('Test send failed');
      setToast('✅ Test broadcast sent to Admin Email');
      setTimeout(() => setToast(''), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Real Broadcast Send
  const handleConfirmSend = async () => {
    if (confirmInput.trim().toUpperCase() !== 'SEND') return;
    setLoading(true);
    setError('');
    setConfirmModalOpen(false);
    setConfirmInput('');

    try {
      const token = await auth?.currentUser?.getIdToken();
      const specificEmails = specificEmailsText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/broadcast/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject,
          preheader,
          bodyMarkdown,
          audience: {
            type: audienceType,
            country: country || undefined,
            specificEmails: specificEmails.length > 0 ? specificEmails : undefined,
            excludeUnsubscribed,
            excludeBanned,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to dispatch broadcast');
      const data = await res.json();
      setToast(`🚀 Broadcast queued for ${data.totalRecipients} authors`);
      setTimeout(() => setToast(''), 4000);
      fetchHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Cancel
  const handleCancelJob = async (jobId: string) => {
    try {
      const token = await auth?.currentUser?.getIdToken();
      await fetch('/api/admin/broadcast/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId }),
      });
      setToast('🛑 Broadcast cancelled');
      setActiveJob(null);
      fetchHistory();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto relative">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e35] border border-white/10 text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📢</span> Broadcast Email System
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Dispatch platform updates, new feature announcements, and system alerts to authors
        </p>
      </div>

      {/* ── CRITICAL WARNING BANNER ── */}
      <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div className="text-xs text-red-200 leading-relaxed">
          <strong className="text-red-100 font-bold block mb-0.5">BROADCAST WARNING:</strong>
          Emails sent from this terminal go to real users directly via Resend transactional pipeline.
          There is NO undo once dispatched. Always use <strong>Send Test Email</strong> first to verify layout, links, and tone.
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* ── Active Sending Progress ── */}
      {activeJob && (
        <div className="bg-[#1a1a2e] border border-purple-500/30 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex justify-between items-center text-xs">
            <div>
              <span className="text-purple-400 font-bold uppercase tracking-wider">Sending In Progress…</span>
              <p className="text-white font-medium mt-0.5">{activeJob.subject}</p>
            </div>
            <button
              onClick={() => handleCancelJob(activeJob.id)}
              className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-300 rounded text-xs font-semibold transition-colors"
            >
              Cancel Remaining
            </button>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{
                width: `${activeJob.targetCount > 0 ? (activeJob.sentCount / activeJob.targetCount) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Sent: {activeJob.sentCount} / {activeJob.targetCount}</span>
            <span>Batch rate: 100 recipients / min</span>
          </div>
        </div>
      )}

      {/* ── Compose & Audience ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Compose Form */}
        <div className="lg:col-span-2 space-y-5 bg-[#1a1a2e] border border-white/10 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Compose Message
            </h2>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  !previewMode ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  previewMode ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Preview HTML
              </button>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <label className="font-semibold text-slate-300">Subject Line (Required)</label>
              <span className={`text-[10px] ${subject.length > 130 ? 'text-amber-400' : 'text-slate-500'}`}>
                {subject.length} / 150
              </span>
            </div>
            <input
              type="text"
              maxLength={150}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. ✨ New Feature: Amazon A+ Content Generator is Live!"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Preheader */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Preheader Text <span className="text-slate-500 font-normal">(Inbox preview snippet)</span>
            </label>
            <input
              type="text"
              value={preheader}
              onChange={e => setPreheader(e.target.value)}
              placeholder="Design stunning A+ brand stories for your Amazon KDP books in 30 seconds"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Email Body <span className="text-slate-500 font-normal">(Markdown supported)</span>
            </label>

            {!previewMode ? (
              <textarea
                rows={10}
                value={bodyMarkdown}
                onChange={e => setBodyMarkdown(e.target.value)}
                placeholder="Write your email announcement in markdown..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono leading-relaxed resize-none"
              />
            ) : (
              <div className="min-h-[200px] bg-white text-slate-900 rounded-xl p-5 text-xs leading-relaxed overflow-y-auto">
                <p className="text-[11px] text-slate-400 mb-3 italic">{preheader}</p>
                <div
                  dangerouslySetInnerHTML={{
                    __html: bodyMarkdown
                      .replace(/^# (.*$)/gim, '<h1 class="text-base font-bold mb-2">$1</h1>')
                      .replace(/^## (.*$)/gim, '<h2 class="text-sm font-bold mb-1">$1</h2>')
                      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />
              </div>
            )}
          </div>

          {/* Send Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3 justify-between">
            <button
              type="button"
              onClick={handleSendTest}
              disabled={loading || !subject.trim() || !bodyMarkdown.trim()}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>🧪</span> Send Test Email
            </button>

            <button
              type="button"
              onClick={() => setConfirmModalOpen(true)}
              disabled={loading || !subject.trim() || !bodyMarkdown.trim() || (estimatedCount === 0)}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-lg flex items-center gap-1.5"
            >
              <span>🚀</span> Dispatch Broadcast
            </button>
          </div>
        </div>

        {/* Right: Target Audience */}
        <div className="space-y-5 bg-[#1a1a2e] border border-white/10 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">
              2. Target Audience
            </h2>

            {/* Audience Radios */}
            <div className="space-y-2 text-xs text-slate-300">
              {[
                { id: 'all', label: 'All Registered Users' },
                { id: 'paid', label: 'All Paid Subscribers' },
                { id: 'free', label: 'Free Plan Users Only' },
                { id: 'starter', label: 'Starter Plan Users' },
                { id: 'pro', label: 'Pro Plan Users' },
                { id: 'agency', label: 'Agency / Lifetime Users' },
                { id: 'country', label: 'Users by Country' },
                { id: 'specific_emails', label: 'Specific Email List' },
              ].map(opt => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 cursor-pointer hover:text-white p-1 rounded transition-colors"
                >
                  <input
                    type="radio"
                    name="audience"
                    checked={audienceType === opt.id}
                    onChange={() => setAudienceType(opt.id as any)}
                    className="text-purple-600 focus:ring-0"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Country input */}
            {audienceType === 'country' && (
              <div className="pt-1">
                <input
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value.toUpperCase())}
                  placeholder="2-letter country code (e.g. IN, US, GB)"
                  className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                />
              </div>
            )}

            {/* Specific emails input */}
            {audienceType === 'specific_emails' && (
              <div className="pt-1 space-y-1">
                <label className="text-[11px] text-slate-400">One email per line:</label>
                <textarea
                  rows={4}
                  value={specificEmailsText}
                  onChange={e => setSpecificEmailsText(e.target.value)}
                  placeholder="author1@example.com&#10;author2@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-white font-mono"
                />
              </div>
            )}

            {/* Exclusions */}
            <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={excludeUnsubscribed}
                  onChange={e => setExcludeUnsubscribed(e.target.checked)}
                />
                <span>Exclude unsubscribed users</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={excludeBanned}
                  onChange={e => setExcludeBanned(e.target.checked)}
                />
                <span>Exclude banned users</span>
              </label>
            </div>
          </div>

          {/* Count Badge */}
          <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-4 text-center">
            <p className="text-xs text-purple-300 font-semibold">Estimated Recipients</p>
            <p className="text-3xl font-bold text-white mt-1">
              {estimatedCount !== null ? estimatedCount.toLocaleString() : '…'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Authors will receive this broadcast</p>
          </div>
        </div>
      </div>

      {/* ── Broadcast History Table ── */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">📜 Broadcast Dispatch History</h2>
          <span className="text-xs text-slate-500">{history.length} dispatched</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">Dispatched</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Recipients</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No broadcasts dispatched yet
                  </td>
                </tr>
              ) : (
                history.map(job => (
                  <tr key={job.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-white max-w-xs truncate">
                      {job.subject}
                    </td>
                    <td className="px-4 py-3 uppercase font-mono text-[11px] text-purple-300">
                      {job.audience?.type || 'all'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {job.sentCount} / {job.targetCount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          job.status === 'completed'
                            ? 'bg-emerald-900/40 text-emerald-300'
                            : job.status === 'sending'
                            ? 'bg-purple-900/40 text-purple-300'
                            : 'bg-red-900/40 text-red-300'
                        }`}
                      >
                        {job.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-red-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🚨</span> Confirm Live Broadcast Dispatch
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to dispatch an email to{' '}
              <strong className="text-white">{estimatedCount} real users</strong>.
              This action cannot be undone.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs space-y-1">
              <p className="text-slate-400">Subject: <span className="text-white font-medium">{subject}</span></p>
              <p className="text-slate-400">Target: <span className="text-purple-300 uppercase font-mono">{audienceType}</span></p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-semibold block">
                Type <strong>SEND</strong> to authorize:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                placeholder="SEND"
                className="w-full bg-white/5 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono text-center tracking-widest uppercase font-bold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                disabled={confirmInput.trim().toUpperCase() !== 'SEND'}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors shadow-lg"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
