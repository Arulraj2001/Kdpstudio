'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { auth } from '../../../lib/firebase';
import type { FlaggedContentItem } from '../../../types/admin';

// ── Review Modal ─────────────────────────────────────────────────────────────

function ModerationReviewModal({
  item,
  onClose,
  onReviewed,
}: {
  item: FlaggedContentItem;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [verdict, setVerdict] = useState<FlaggedContentItem['verdict']>('false_positive');
  const [noteToUser, setNoteToUser] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flagId: item.id,
          verdict,
          noteToUser,
        }),
      });
      if (!res.ok) throw new Error('Failed to record review verdict');
      onReviewed();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  item.severity === 'high'
                    ? 'bg-red-950 text-red-300 border border-red-500/30'
                    : item.severity === 'medium'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-950 text-blue-300 border border-blue-500/30'
                }`}
              >
                {item.severity} Severity
              </span>
              <span className="text-xs text-slate-400 font-mono">{item.flagType}</span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">Review Flagged Content</h2>
            <p className="text-xs text-slate-400">
              Book: <strong className="text-white">{item.bookTitle}</strong> | Author: {item.userName} ({item.userEmail})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          {/* Flagged snippet */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Flagged Manuscript Excerpt
            </label>
            <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 text-red-200 leading-relaxed font-serif text-sm">
              "{item.flaggedText}"
            </div>
          </div>

          {/* Verdict Options */}
          <div className="space-y-2 pt-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Admin Moderation Verdict
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'false_positive',
                  title: 'False Positive — No action needed',
                  desc: 'Content complies with KDP guidelines; flag dismissed.',
                },
                {
                  id: 'minor_concern',
                  title: 'Minor Concern — Send note to author',
                  desc: 'Inform author of potential KDP rejection risk before publishing.',
                },
                {
                  id: 'policy_violation',
                  title: 'Policy Violation — Formal notice',
                  desc: 'Warn author and keep account under moderation review.',
                },
                {
                  id: 'serious_violation',
                  title: 'Serious Violation — Immediately Ban Account',
                  desc: 'Copyright infringement, abusive content, or intentional scraping abuse.',
                },
              ].map(opt => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    verdict === opt.id
                      ? 'bg-purple-950/30 border-purple-500/40 text-white'
                      : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="verdict"
                    checked={verdict === opt.id}
                    onChange={() => setVerdict(opt.id as any)}
                    className="mt-0.5 text-purple-600 focus:ring-0"
                  />
                  <div>
                    <p className="font-semibold text-xs text-white">{opt.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Note to author */}
          {verdict !== 'false_positive' && (
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Guidance Note to Author (Will be emailed)
              </label>
              <textarea
                rows={3}
                value={noteToUser}
                onChange={e => setNoteToUser(e.target.value)}
                placeholder="Explain the required revision for Amazon KDP compliance..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none font-sans"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-900/40 border border-red-500/40 text-red-300 p-2.5 rounded-lg text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-between items-center bg-black/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-md"
          >
            {saving ? 'Recording…' : 'Confirm Verdict'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export function ContentModerationPage() {
  const [items, setItems] = useState<FlaggedContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<FlaggedContentItem | null>(null);
  const [reviewedFilter, setReviewedFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [toast, setToast] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const reviewedQuery =
        reviewedFilter === 'all' ? '' : reviewedFilter === 'reviewed' ? '?reviewed=true' : '?reviewed=false';

      const res = await fetch(`/api/admin/content${reviewedQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('[ContentModerationPage]', err);
    } finally {
      setLoading(false);
    }
  }, [reviewedFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto relative">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e35] border border-white/10 text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🚩</span> Content Moderation & Policy Review Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Review manuscripts flagged by automated quality audits for Amazon KDP policy concerns
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#1a1a2e] border border-white/10 rounded-lg p-1">
          {[
            { id: 'pending', label: 'Pending Review' },
            { id: 'reviewed', label: 'Reviewed' },
            { id: 'all', label: 'All Items' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setReviewedFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                reviewedFilter === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Book Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Flag Type</th>
                <th className="px-4 py-3">Flagged Excerpt</th>
                <th className="px-4 py-3">Date</th>
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
                    No flagged items found in this queue
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.severity === 'high'
                            ? 'bg-red-950 text-red-400 border border-red-500/30'
                            : item.severity === 'medium'
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-950 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white max-w-[150px] truncate">
                      {item.bookTitle}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200">{item.userName}</p>
                      <p className="text-slate-500 text-[11px] font-mono">{item.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-purple-300">
                      {item.flagType}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-400 font-serif italic">
                      "{item.flaggedText}"
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setActiveItem(item)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition-colors"
                      >
                        {item.reviewed ? 'Review Verdict' : 'Review'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {activeItem && (
        <ModerationReviewModal
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onReviewed={() => {
            fetchItems();
            setToast('✅ Verdict applied');
            setTimeout(() => setToast(''), 3000);
          }}
        />
      )}
    </div>
  );
}
