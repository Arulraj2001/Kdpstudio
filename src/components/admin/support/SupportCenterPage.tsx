'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { auth } from '../../../lib/firebase';
import type { SupportTicket, SupportStats } from '../../../types/admin';

// ── Quick Templates ──────────────────────────────────────────────────────────

const TEMPLATES: Record<string, string> = {
  Billing: `Hi {name},\n\nThanks for reaching out about your billing question. I have reviewed your account and subscription details in our system.\n\n[Explain resolution here]\n\nPlease let us know if you need anything else!`,
  Technical: `Hi {name},\n\nSorry to hear you are experiencing technical difficulties. Could you please share:\n1. The browser you are using\n2. The specific book or chapter where this occurred\n3. Any screenshot or error message shown on screen\n\nWe will investigate immediately!`,
  Feature: `Hi {name},\n\nThanks for the great suggestion! I have forwarded this directly to our product engineering roadmap for consideration in upcoming releases.\n\nWe appreciate you helping make KDP Studio better for indie authors!`,
  General: `Hi {name},\n\nThank you for reaching out to KDP Studio support. \n\n[Your message here]\n\nBest regards,\nKDP Studio Team`,
};

// ── Detail & Reply Modal ─────────────────────────────────────────────────────

function TicketModal({
  ticket,
  onClose,
  onReplied,
}: {
  ticket: SupportTicket;
  onClose: () => void;
  onReplied: () => void;
}) {
  const [replyText, setReplyText] = useState(
    TEMPLATES.General.replace('{name}', ticket.fromName || 'Author')
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleApplyTemplate = (type: string) => {
    const tmpl = TEMPLATES[type] || TEMPLATES.General;
    setReplyText(tmpl.replace('{name}', ticket.fromName || 'Author'));
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/support/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticketId: ticket.id,
          replyText,
        }),
      });
      if (!res.ok) throw new Error('Failed to send reply');
      onReplied();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch email reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
              {ticket.category}
            </span>
            <h2 className="text-base font-bold text-white mt-1">{ticket.subject}</h2>
            <p className="text-xs text-slate-400">
              From: <strong className="text-white">{ticket.fromName}</strong> ({ticket.fromEmail})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* User Message */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span className="font-semibold text-slate-300">Customer Message</span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-slate-200 whitespace-pre-wrap leading-relaxed pt-1">
              {ticket.message}
            </p>
          </div>

          {/* Previous reply if any */}
          {ticket.replyText && (
            <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-4 space-y-1">
              <div className="flex justify-between text-purple-300">
                <span className="font-semibold">Previous Team Reply</span>
                <span>{ticket.repliedAt ? new Date(ticket.repliedAt).toLocaleString() : ''}</span>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed pt-1">
                {ticket.replyText}
              </p>
            </div>
          )}

          {/* Quick Insert Templates */}
          <div className="space-y-1.5 pt-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Insert Reply Template:
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(TEMPLATES).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleApplyTemplate(cat)}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/10 text-[11px] transition-colors"
                >
                  ⚡ {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Reply Area */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Compose Email Reply
            </label>
            <textarea
              rows={6}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-sans leading-relaxed resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-500/40 text-red-300 p-2.5 rounded-lg text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-between items-center bg-black/20">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-xs font-semibold"
          >
            Close
          </button>
          <button
            onClick={handleSendReply}
            disabled={sending || !replyText.trim()}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
          >
            <span>✉️</span> {sending ? 'Dispatching…' : 'Send Email Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Support Center Page ──────────────────────────────────────────────────

export function SupportCenterPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [toast, setToast] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/support?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTickets(data.tickets || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('[SupportCenterPage]', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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
            <span>📬</span> Support Center & Inquiries
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage contact form messages, billing inquiries, and email customer support
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a2e] border border-white/10 hover:border-white/20 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
        >
          <span>🔄</span> Refresh
        </button>
      </div>

      {/* ── Stats Row ── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Total Requests</p>
          <p className="text-2xl font-bold text-white mt-1">{stats?.total ?? 0}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">All-time contact submissions</p>
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Open Tickets</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats?.open ?? 0}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting first response</p>
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Responded</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats?.responded ?? 0}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Reply sent to author</p>
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Avg Turnaround</p>
          <p className="text-2xl font-bold text-purple-300 mt-1">{stats?.avgResponseHours ?? 2.5} hrs</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Response time average</p>
        </div>
      </section>

      {/* ── Filters & Search ── */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1 w-full sm:w-auto">
          {['all', 'open', 'responded', 'closed'].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search email, name, subject…"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* ── Tickets Table ── */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No tickets found for selected filter
                  </td>
                </tr>
              ) : (
                tickets.map(t => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    {/* Status Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'open'
                            ? 'bg-red-900/40 text-red-300 border border-red-500/20'
                            : t.status === 'responded'
                            ? 'bg-amber-900/40 text-amber-300 border border-amber-500/20'
                            : 'bg-emerald-900/40 text-emerald-300'
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{t.fromName}</p>
                        <p className="text-slate-500 font-mono text-[11px]">{t.fromEmail}</p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="text-purple-300 font-semibold">{t.category}</span>
                    </td>

                    {/* Subject */}
                    <td className="px-4 py-3 max-w-xs truncate text-white font-medium">
                      {t.subject}
                    </td>

                    {/* Received */}
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setActiveTicket(t)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition-colors"
                      >
                        {t.status === 'open' ? 'Reply' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {activeTicket && (
        <TicketModal
          ticket={activeTicket}
          onClose={() => setActiveTicket(null)}
          onReplied={() => {
            fetchTickets();
            setToast('✅ Email reply sent to customer');
            setTimeout(() => setToast(''), 3000);
          }}
        />
      )}
    </div>
  );
}
