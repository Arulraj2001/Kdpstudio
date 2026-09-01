import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
  BarChart3,
  Flame,
  Pause,
  Play,
} from 'lucide-react';
import { ArcCampaign, ArcClaim } from '../../types/arc';
import {
  getAuthorArcCampaigns,
  createArcCampaign,
  updateArcCampaign,
  deleteArcCampaign,
  getCampaignClaims,
} from '../../lib/arcService';
import { useBookStore } from '../../lib/store';

interface AuthorArcManagerViewProps {
  user: any;
  onNavigate?: (page: string) => void;
}

export const AuthorArcManagerView: React.FC<AuthorArcManagerViewProps> = ({
  user,
  onNavigate,
}) => {
  const { books } = useBookStore();
  const [campaigns, setCampaigns] = useState<ArcCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [claimsMap, setClaimsMap] = useState<Record<string, ArcClaim[]>>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // New Campaign Form State
  const [formData, setFormData] = useState({
    bookId: '',
    title: '',
    subtitle: '',
    authorName: user?.displayName || '',
    genre: 'Non-Fiction / Medical',
    blurb: '',
    pageCount: 180,
    format: 'both' as 'epub' | 'pdf' | 'both',
    totalSlots: 25,
    reviewWindowDays: 14,
    amazonAsin: '',
    amazonUrl: '',
    watermarkingEnabled: true,
    screeningQuestion: '',
    targetMarketplace: 'US',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAuthorCampaigns();
  }, [user]);

  const loadAuthorCampaigns = async () => {
    setLoading(true);
    try {
      const data = await getAuthorArcCampaigns(user?.uid || 'demo-author-1');
      setCampaigns(data);

      // Load claims for each campaign
      const newClaimsMap: Record<string, ArcClaim[]> = {};
      for (const c of data) {
        const claims = await getCampaignClaims(c.id);
        newClaimsMap[c.id] = claims;
      }
      setClaimsMap(newClaimsMap);
    } catch (err) {
      console.error('Failed to load author ARC campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExistingBook = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setFormData({ ...formData, bookId: selectedId });
    if (!selectedId) return;

    const matched = books.find((b) => b.id === selectedId);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        bookId: matched.id,
        title: matched.title || prev.title,
        subtitle: matched.subtitle || prev.subtitle,
        authorName: matched.author || prev.authorName,
        genre: matched.genre || prev.genre,
        blurb: matched.description || prev.blurb,
        amazonAsin: matched.asin || prev.amazonAsin,
      }));
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.blurb.trim()) {
      setFormError('Please enter a book title and description/blurb.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await createArcCampaign(user?.uid || 'demo-author-1', {
        authorName: formData.authorName.trim() || 'Independent Author',
        authorEmail: user?.email,
        bookId: formData.bookId || undefined,
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim() || undefined,
        genre: formData.genre,
        blurb: formData.blurb.trim(),
        pageCount: Number(formData.pageCount) || 150,
        format: formData.format,
        totalSlots: Number(formData.totalSlots) || 25,
        reviewWindowDays: Number(formData.reviewWindowDays) || 14,
        amazonAsin: formData.amazonAsin.trim() || undefined,
        amazonUrl: formData.amazonUrl.trim() || undefined,
        watermarkingEnabled: formData.watermarkingEnabled,
        targetMarketplace: formData.targetMarketplace,
        status: 'active',
        screeningQuestion: formData.screeningQuestion.trim() || undefined,
      });

      setShowCreateModal(false);
      loadAuthorCampaigns();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (campaign: ArcCampaign) => {
    const nextStatus = campaign.status === 'active' ? 'paused' : 'active';
    await updateArcCampaign(campaign.id, { status: nextStatus });
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaign.id ? { ...c, status: nextStatus } : c))
    );
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this ARC campaign?')) return;
    await deleteArcCampaign(campaignId);
    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
  };

  const handleCopyLoungeLink = (campaign: ArcCampaign) => {
    const url = `${window.location.origin}/arc-lounge?search=${encodeURIComponent(campaign.title)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(campaign.id);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Metrics
  const totalSlots = campaigns.reduce((acc, c) => acc + c.totalSlots, 0);
  const totalClaimed = campaigns.reduce((acc, c) => acc + (c.claimedSlots || 0), 0);
  const totalReviewed = Object.values(claimsMap).flat().filter((c) => c.status === 'reviewed').length;
  const reviewRate = totalClaimed > 0 ? Math.round((totalReviewed / totalClaimed) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────
          HEADER SECTION
         ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
              KDP Launchpad Engine
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={14} />
              <span>Amazon & FTC Compliant</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ARC Campaign Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Distribute safe digital advance review copies to verified community readers before or right after launch to generate authentic Amazon customer reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('arc-lounge')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <BookOpen size={15} />
              <span>Visit Public Lounge</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Launch New ARC Campaign</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          OVERVIEW KPI STAT CARDS
         ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Campaigns</span>
            <BookOpen size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {campaigns.filter((c) => c.status === 'active').length}
          </div>
          <div className="text-[11px] text-slate-500">Live in Public Lounge</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Reader Copies Claimed</span>
            <Users size={16} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalClaimed} <span className="text-xs font-normal text-slate-400">/ {totalSlots}</span>
          </div>
          <div className="text-[11px] text-slate-500">Distributed to readers</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Reviews Reported</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalReviewed}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">Voluntary Amazon reviews</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Feedback Rate</span>
            <BarChart3 size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {reviewRate}%
          </div>
          <div className="text-[11px] text-slate-500">Industry avg is ~20%</div>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          CAMPAIGN LIST
         ───────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Your Book Campaigns ({campaigns.length})
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200/60 animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
            <BookOpen size={32} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No ARC campaigns created yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Launch your first campaign to distribute digital review copies to avid readers before your launch date.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Create Campaign</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => {
              const claims = claimsMap[c.id] || [];
              const isExpanded = expandedCampaignId === c.id;
              const slotsLeft = Math.max(0, c.totalSlots - (c.claimedSlots || 0));
              const percentClaimed = Math.min(100, Math.round(((c.claimedSlots || 0) / c.totalSlots) * 100));

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                >
                  <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Left details */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-14 h-20 rounded-lg bg-gradient-to-br from-purple-900 to-indigo-950 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-purple-800/40">
                        {c.coverUrl ? (
                          <img src={c.coverUrl} alt={c.title} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          'ARC'
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              c.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {c.status}
                          </span>
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                            {c.genre}
                          </span>
                          {c.watermarkingEnabled && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              Watermarked
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {c.title}
                        </h3>

                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-0.5">
                          <span>{c.claimedSlots || 0} / {c.totalSlots} Slots Claimed</span>
                          <span>•</span>
                          <span>{c.reviewWindowDays} Days Window</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">{claims.filter((cl) => cl.status === 'reviewed').length} Reviews</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyLoungeLink(c)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {copiedLink === c.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        <span>{copiedLink === c.id ? 'Copied' : 'Share Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                        title={c.status === 'active' ? 'Pause campaign' : 'Activate campaign'}
                      >
                        {c.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                        title="Delete campaign"
                      >
                        <Trash2 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedCampaignId(isExpanded ? null : c.id)}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{claims.length} Readers</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Claims Drawer */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-5 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Reader Claims & Voluntary Feedback ({claims.length})
                      </h4>

                      {claims.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No readers have claimed this book yet. Share your lounge link with book bloggers or beta readers!
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                              <tr>
                                <th className="pb-2">Reader Name</th>
                                <th className="pb-2">Email</th>
                                <th className="pb-2">Claimed Date</th>
                                <th className="pb-2">Status</th>
                                <th className="pb-2">Amazon Review Proof</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {claims.map((claim) => (
                                <tr key={claim.id} className="py-2">
                                  <td className="py-2 font-medium text-slate-900">{claim.readerName}</td>
                                  <td className="py-2 text-slate-500 font-mono">{claim.readerEmail}</td>
                                  <td className="py-2 text-slate-500">
                                    {new Date(claim.claimedAt).toLocaleDateString()}
                                  </td>
                                  <td className="py-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                        claim.status === 'reviewed'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {claim.status}
                                    </span>
                                  </td>
                                  <td className="py-2">
                                    {claim.reviewUrl ? (
                                      <a
                                        href={claim.reviewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-600 font-bold hover:underline inline-flex items-center gap-1"
                                      >
                                        <span>View Review</span>
                                        <ExternalLink size={11} />
                                      </a>
                                    ) : (
                                      <span className="text-slate-400 italic">Pending voluntary review</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────
          LAUNCH NEW ARC CAMPAIGN MODAL
         ───────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Launch New ARC Campaign</h3>
                  <p className="text-xs text-slate-500">100% Amazon KDP & FTC Compliant Setup</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Book Picker from Store */}
              {books.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Pick from Your KDP Studio Library (Optional Auto-Fill)
                  </label>
                  <select
                    value={formData.bookId}
                    onChange={handleSelectExistingBook}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  >
                    <option value="">-- Manual Entry or Pick a Book --</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} {b.author ? `by ${b.author}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Book Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. The Assertive Nurse"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Author Name</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Genre Category</label>
                  <select
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  >
                    <option value="Non-Fiction / Medical">Non-Fiction / Medical</option>
                    <option value="Fantasy / Romance">Fantasy / Romance</option>
                    <option value="Mystery / Thriller">Mystery / Thriller</option>
                    <option value="Self-Help / Journal">Self-Help / Journal</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Young Adult">Young Adult</option>
                    <option value="Children’s Books">Children’s Books</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Total ARC Reader Slots</label>
                  <input
                    type="number"
                    min={5}
                    max={250}
                    value={formData.totalSlots}
                    onChange={(e) => setFormData({ ...formData, totalSlots: parseInt(e.target.value) || 25 })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Book Description / Blurb *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.blurb}
                  onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
                  placeholder="Hook readers with a gripping summary of your book..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Amazon ASIN / Link (Optional)</label>
                  <input
                    type="text"
                    value={formData.amazonAsin}
                    onChange={(e) => setFormData({ ...formData, amazonAsin: e.target.value })}
                    placeholder="e.g. B0DF92KC81"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Reading Window (Days)</label>
                  <input
                    type="number"
                    min={7}
                    max={60}
                    value={formData.reviewWindowDays}
                    onChange={(e) => setFormData({ ...formData, reviewWindowDays: parseInt(e.target.value) || 14 })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>
              </div>

              {/* Watermarking Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="wm-check"
                  checked={formData.watermarkingEnabled}
                  onChange={(e) => setFormData({ ...formData, watermarkingEnabled: e.target.checked })}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="wm-check" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Enable Anti-Piracy Watermarking (stamps reader email on proof pages)
                </label>
              </div>

              {/* Compliance Note */}
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-[11px] text-purple-900 leading-relaxed">
                <strong>Compliance Note:</strong> By launching this campaign, you acknowledge that Amazon reviews must remain strictly voluntary. KDP Studio provides reader access without requiring a 5-star rating or mandatory review.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Launching...' : 'Publish to ARC Lounge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
