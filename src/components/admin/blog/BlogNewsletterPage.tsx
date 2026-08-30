'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Users,
  CheckCircle2,
  Clock,
  UserX,
  Download,
  Trash2,
  Sliders,
  ExternalLink,
  Search,
  Filter,
  Check,
  AlertTriangle,
  RefreshCw,
  Eye,
  Sparkles,
} from 'lucide-react';
import { PageRoute } from '../../../types';
import { NewsletterSubscriber, NewsletterConfig, BlogPost } from '../../../types/blog';

interface BlogNewsletterPageProps {
  onNavigate: (route: PageRoute) => void;
}

export const BlogNewsletterPage: React.FC<BlogNewsletterPageProps> = ({ onNavigate }) => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<BlogPost[]>([]);
  const [config, setConfig] = useState<NewsletterConfig>({
    autoSendOnPublish: true,
    senderName: 'KDP Studio Academy',
    senderEmail: 'newsletter@kdpstudio.com',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'confirmed' | 'pending' | 'unsubscribed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Campaign State
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'category' | 'admin-test'>('all');
  const [testEmailInput, setTestEmailInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showSendConfirmModal, setShowSendConfirmModal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchNewsletterData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Subscribers
      const subRes = await fetch('/api/admin/blog/newsletter/subscribers');
      const subData = await subRes.json();
      if (Array.isArray(subData?.subscribers)) {
        setSubscribers(subData.subscribers);
      }

      // 2. Fetch Config
      const confRes = await fetch('/api/admin/blog/newsletter/config');
      const confData = await confRes.json();
      if (confData?.config) {
        setConfig(confData.config);
      }

      // 3. Fetch Published Posts for manual sending
      const postRes = await fetch('/api/admin/blog/posts');
      const postData = await postRes.json();
      if (Array.isArray(postData?.posts)) {
        const pub = postData.posts.filter((p: any) => p.status === 'published');
        setPublishedPosts(pub);
        if (pub.length > 0 && !selectedPostId) {
          setSelectedPostId(pub[0].id);
        }
      }
    } catch {
      showToast('❌ Failed loading newsletter management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsletterData();
  }, []);

  // Stats
  const totalCount = subscribers.length;
  const confirmedCount = subscribers.filter((s) => s.status === 'confirmed').length;
  const pendingCount = subscribers.filter((s) => s.status === 'pending').length;
  const unsubscribedCount = subscribers.filter((s) => s.status === 'unsubscribed').length;

  // Filtered subscribers
  const filteredSubscribers = subscribers.filter((s) => {
    if (activeFilter !== 'all' && s.status !== activeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.email.toLowerCase().includes(q) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        s.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Action Handlers
  const handleToggleAutoSend = async (val: boolean) => {
    setConfig((prev) => ({ ...prev, autoSendOnPublish: val }));
    try {
      await fetch('/api/admin/blog/newsletter/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSendOnPublish: val }),
      });
      showToast(`⚙️ Auto-send on publish: ${val ? 'ENABLED' : 'DISABLED'}`);
    } catch {
      showToast('❌ Failed updating settings');
    }
  };

  const handleManualUnsubscribe = async (email: string) => {
    if (!confirm(`Are you sure you want to unsubscribe ${email}?`)) return;
    try {
      await fetch('/api/admin/blog/newsletter/subscribers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'unsubscribe' }),
      });
      showToast(`User ${email} unsubscribed`);
      fetchNewsletterData();
    } catch {
      showToast('❌ Failed to unsubscribe user');
    }
  };

  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!confirm(`Permanently delete subscriber ${email}?`)) return;
    try {
      await fetch('/api/admin/blog/newsletter/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, email }),
      });
      showToast(`Subscriber ${email} removed`);
      fetchNewsletterData();
    } catch {
      showToast('❌ Failed to delete subscriber');
    }
  };

  const handleExportCsv = () => {
    const confirmedOnly = subscribers.filter((s) => s.status === 'confirmed');
    const csvContent = [
      ['Email', 'Name', 'Source', 'Subscribed Date', 'Tags'].join(','),
      ...confirmedOnly.map((s) =>
        [
          `"${s.email}"`,
          `"${s.name || ''}"`,
          `"${s.source}"`,
          `"${new Date(s.subscribedAt).toISOString()}"`,
          `"${(s.tags || []).join(';')}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kdp-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('📥 Exported confirmed subscribers to CSV');
  };

  const handleSendCampaign = async () => {
    if (!selectedPostId) {
      showToast('Please select a published post to send');
      return;
    }

    setIsSending(true);
    setShowSendConfirmModal(false);
    showToast('🚀 Sending newsletter campaign...');

    try {
      const res = await fetch('/api/admin/blog/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPostId,
          target: targetAudience,
          testEmail: targetAudience === 'admin-test' ? testEmailInput : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`🎉 Newsletter dispatched to ${data.sentCount || 0} subscribers!`);
      } else {
        showToast(`❌ Error: ${data?.error || 'Failed sending campaign'}`);
      }
    } catch (err: any) {
      showToast(`❌ Network error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const selectedPost = publishedPosts.find((p) => p.id === selectedPostId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom duration-200">
          {toastMessage}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Mail size={24} className="text-purple-600" />
            <span>Newsletter & Email Campaigns</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Double opt-in subscribers, automated post dispatch, and audience segments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={confirmedCount === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Total Subscribers</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-2xl font-black text-emerald-600">{confirmedCount}</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Confirmed (Active)</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Pending Double Opt-In</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-2xl font-black text-slate-400">{unsubscribedCount}</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Unsubscribed</div>
        </div>
      </div>

      {/* ── Section 1: Dispatch Newsletter Manually ── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Send size={16} className="text-purple-600" />
              <span>Broadcast New Post Newsletter</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an article and notify your confirmed subscribers with formatted rich previews
            </p>
          </div>

          {/* Auto-send setting toggle */}
          <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={config.autoSendOnPublish}
              onChange={(e) => handleToggleAutoSend(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-xs font-bold text-slate-700">Auto-send on new post publish</span>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-800">Select Published Article *</label>
              <select
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 outline-none mt-1"
              >
                {publishedPosts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800">Target Audience Segment</label>
              <div className="space-y-1.5 mt-1 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="targetAudience"
                    checked={targetAudience === 'all'}
                    onChange={() => setTargetAudience('all')}
                    className="text-purple-600"
                  />
                  <span className="font-semibold text-slate-800">
                    All Confirmed Subscribers ({confirmedCount} recipients)
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="targetAudience"
                    checked={targetAudience === 'category'}
                    onChange={() => setTargetAudience('category')}
                    className="text-purple-600"
                  />
                  <span className="font-semibold text-slate-800">
                    Segment by Category: {selectedPost?.category || 'General'}
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="targetAudience"
                    checked={targetAudience === 'admin-test'}
                    onChange={() => setTargetAudience('admin-test')}
                    className="text-purple-600"
                  />
                  <span className="font-semibold text-slate-800">Send Test Email to Admin Only</span>
                </label>
              </div>
            </div>

            {targetAudience === 'admin-test' && (
              <div>
                <label className="text-xs font-bold text-slate-800">Test Email Address</label>
                <input
                  type="email"
                  value={testEmailInput}
                  onChange={(e) => setTestEmailInput(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none mt-1"
                />
              </div>
            )}

            <button
              onClick={() => setShowSendConfirmModal(true)}
              disabled={isSending || !selectedPostId}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send size={14} />
              <span>
                {targetAudience === 'admin-test'
                  ? 'Send Test Email'
                  : `Send Campaign to ${confirmedCount} Subscribers`}
              </span>
            </button>
          </div>

          {/* Email Preview Column */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Live Email Template Preview
            </span>

            {selectedPost ? (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs text-slate-700">
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">
                  {selectedPost.category || 'Publishing Strategy'}
                </span>
                <div className="font-extrabold text-sm text-slate-900">{selectedPost.title}</div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {selectedPost.excerpt || selectedPost.metaDescription || 'No excerpt provided.'}
                </p>
                <div className="text-[10px] text-slate-400">
                  By {selectedPost.authorName || 'KDP Studio Team'} · {selectedPost.readingTimeMinutes || 5} min read
                </div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-[11px]"
                >
                  Read Full Article →
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No post selected.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Subscribers Ledger Table ── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            {(['all', 'confirmed', 'pending', 'unsubscribed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  activeFilter === tab
                    ? 'bg-white text-purple-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subscribers..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-800"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
              <tr>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Source</th>
                <th className="p-3.5">Subscribed</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No subscribers found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{sub.email}</td>
                    <td className="p-3.5 text-slate-500">{sub.name || '—'}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                          sub.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sub.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">{sub.source}</td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(sub.subscribedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {sub.status === 'confirmed' && (
                        <button
                          onClick={() => handleManualUnsubscribe(sub.email)}
                          className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                        >
                          Unsubscribe
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {showSendConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base">
              <Mail size={20} className="text-purple-600" />
              <span>Confirm Campaign Broadcast</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to broadcast <strong>"{selectedPost?.title}"</strong> to{' '}
              <strong>{targetAudience === 'admin-test' ? 'admin email' : `${confirmedCount} confirmed subscribers`}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSendConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCampaign}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
              >
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
