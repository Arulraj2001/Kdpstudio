import React, { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Plus,
  BarChart2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { NewsletterSwap } from '../../types/arc';
import {
  getNewsletterSwaps,
  proposeNewsletterSwap,
  respondToNewsletterSwap,
} from '../../lib/arcService';

interface NewsletterSwapHubViewProps {
  user: any;
  onNavigate?: (page: string) => void;
}

export const NewsletterSwapHubView: React.FC<NewsletterSwapHubViewProps> = ({
  user,
  onNavigate,
}) => {
  const [swaps, setSwaps] = useState<NewsletterSwap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    requesterBookTitle: '',
    requesterAmazonUrl: '',
    requesterNewsletterSize: 500,
    requesterGenre: 'Fantasy / Romance',
    targetDateForRequester: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

    recipientAuthorName: 'Damian Blackwood',
    recipientBookTitle: 'The Shadow Court Heir',
    recipientAmazonUrl: 'https://www.amazon.com/dp/B0DF99XX01',
    recipientNewsletterSize: 1200,
    recipientGenre: 'Fantasy / Romance',
    targetDateForRecipient: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Excited to cross-promote with you! My newsletter audience loves spicy dark fantasy with court intrigue.',
  });

  useEffect(() => {
    loadSwaps();
  }, [user]);

  const loadSwaps = async () => {
    setLoading(true);
    try {
      const data = await getNewsletterSwaps();
      setSwaps(data);
    } catch (err) {
      console.error('Failed to load newsletter swaps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await proposeNewsletterSwap({
        requesterAuthorId: user?.uid || 'demo-author-1',
        requesterAuthorName: user?.displayName || 'Independent Author',
        requesterBookTitle: formData.requesterBookTitle.trim() || 'My Next Release',
        requesterAmazonUrl: formData.requesterAmazonUrl.trim() || 'https://www.amazon.com',
        requesterNewsletterSize: Number(formData.requesterNewsletterSize) || 200,
        requesterGenre: formData.requesterGenre,
        targetDateForRequester: formData.targetDateForRequester,

        recipientAuthorId: 'demo-peer-author',
        recipientAuthorName: formData.recipientAuthorName,
        recipientBookTitle: formData.recipientBookTitle,
        recipientAmazonUrl: formData.recipientAmazonUrl,
        recipientNewsletterSize: Number(formData.recipientNewsletterSize) || 500,
        recipientGenre: formData.recipientGenre,
        targetDateForRecipient: formData.targetDateForRecipient,
        notes: formData.notes,
      });

      setShowProposeModal(false);
      loadSwaps();
    } catch (err) {
      console.error('Failed to propose swap:', err);
    }
  };

  const handleRespond = async (swapId: string, status: 'accepted' | 'declined') => {
    await respondToNewsletterSwap(swapId, status);
    setSwaps((prev) =>
      prev.map((s) => (s.id === swapId ? { ...s, status } : s))
    );
  };

  const handleCopyTrackLink = (token: string) => {
    const url = `${window.location.origin}/go/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
              StoryOrigin & BookFunnel Style
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={14} />
              <span>Organic Amazon Verified Sales</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Newsletter & Cross-Promotion Swaps
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Partner with other indie authors in your genre. Swap newsletter shoutouts to tap into each other's subscriber bases, driving real Amazon sales and Verified Purchase reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('arc-lounge')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Users size={15} />
              <span>ARC Reader Lounge</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowProposeModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Propose Cross-Promo Swap</span>
          </button>
        </div>
      </div>

      {/* How it works banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-md border border-purple-800/40 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-300" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            How Indie Author Cross-Promotions Work
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-purple-100">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <strong className="text-white block font-bold">1. Find Matching Audience</strong>
            <p className="text-[11px] leading-relaxed">
              Match with authors writing in the same genre with similar subscriber counts (e.g. 500–2,000 readers).
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <strong className="text-white block font-bold">2. Feature Each Other</strong>
            <p className="text-[11px] leading-relaxed">
              You feature their book in your upcoming newsletter send; they feature yours on their agreed date.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <strong className="text-white block font-bold">3. 100% Organic Sales</strong>
            <p className="text-[11px] leading-relaxed">
              Genuine subscribers click smart tracking links to Amazon, buy directly, and leave organic Verified Purchase reviews.
            </p>
          </div>
        </div>
      </div>

      {/* Active Swaps List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Active & Scheduled Swaps ({swaps.length})
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200/60 animate-pulse" />
            ))}
          </div>
        ) : swaps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
            <Mail size={32} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No active cross-promos yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Propose a swap with another author in your genre to tap into fresh reader audiences.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {swaps.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.status}
                      </span>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {s.requesterGenre}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {s.requesterAuthorName} ↔ {s.recipientAuthorName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Promoting: <strong className="text-slate-800">{s.requesterBookTitle}</strong> &{' '}
                      <strong className="text-slate-800">{s.recipientBookTitle}</strong>
                    </p>
                  </div>

                  {/* Scheduled Dates Strip */}
                  <div className="flex items-center gap-4 text-xs font-semibold bg-slate-50 p-3 rounded-xl border border-slate-200/80 shrink-0">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">You Feature Them On</div>
                      <div className="text-slate-900">{s.targetDateForRequester}</div>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">They Feature You On</div>
                      <div className="text-slate-900">{s.targetDateForRecipient}</div>
                    </div>
                  </div>
                </div>

                {/* Click Tracking & Attribution Bar */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Clicks From Your Newsletter</span>
                      <span className="font-black text-purple-700">{s.requesterClicks || 0} clicks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/go/${s.trackingTokenA}`}
                        className="w-full text-[11px] font-mono bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 truncate"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyTrackLink(s.trackingTokenA)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors shrink-0 cursor-pointer"
                      >
                        {copiedToken === s.trackingTokenA ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Clicks From Partner's Newsletter</span>
                      <span className="font-black text-indigo-700">{s.recipientClicks || 0} clicks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/go/${s.trackingTokenB}`}
                        className="w-full text-[11px] font-mono bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 truncate"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyTrackLink(s.trackingTokenB)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors shrink-0 cursor-pointer"
                      >
                        {copiedToken === s.trackingTokenB ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Propose Modal */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Propose Newsletter Cross-Promotion</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProposeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePropose} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Your Book Title *</label>
                <input
                  type="text"
                  required
                  value={formData.requesterBookTitle}
                  onChange={(e) => setFormData({ ...formData, requesterBookTitle: e.target.value })}
                  placeholder="e.g. Echoes of the Obsidian Throne"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Your Email List Size</label>
                  <input
                    type="number"
                    min={50}
                    value={formData.requesterNewsletterSize}
                    onChange={(e) => setFormData({ ...formData, requesterNewsletterSize: parseInt(e.target.value) || 200 })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Your Feature Date</label>
                  <input
                    type="date"
                    value={formData.targetDateForRequester}
                    onChange={(e) => setFormData({ ...formData, targetDateForRequester: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Your Amazon Book Link</label>
                <input
                  type="url"
                  value={formData.requesterAmazonUrl}
                  onChange={(e) => setFormData({ ...formData, requesterAmazonUrl: e.target.value })}
                  placeholder="https://www.amazon.com/dp/..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Notes for Swap Partner</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProposeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  Submit Swap Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
