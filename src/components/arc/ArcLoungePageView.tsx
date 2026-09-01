import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  ShieldCheck,
  Filter,
  Users,
  Clock,
  ArrowRight,
  FileText,
  Star,
  ExternalLink,
  Flame,
  Award,
} from 'lucide-react';
import { ArcCampaign } from '../../types/arc';
import { getPublicArcCampaigns } from '../../lib/arcService';
import { ArcClaimModal } from './ArcClaimModal';

interface ArcLoungePageViewProps {
  user?: any;
  onNavigate?: (page: string) => void;
}

const GENRES = [
  'All',
  'Non-Fiction / Medical',
  'Fantasy / Romance',
  'Mystery / Thriller',
  'Self-Help / Journal',
  'Sci-Fi',
  'Young Adult',
  'Children’s Books',
];

export const ArcLoungePageView: React.FC<ArcLoungePageViewProps> = ({
  user,
  onNavigate,
}) => {
  const [campaigns, setCampaigns] = useState<ArcCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [claimingCampaign, setClaimingCampaign] = useState<ArcCampaign | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, [selectedGenre, searchQuery]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await getPublicArcCampaigns(selectedGenre, searchQuery);
      setCampaigns(data);
    } catch (err) {
      console.error('Failed to load ARC campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* ─────────────────────────────────────────
          HERO BANNER
         ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-900 via-slate-900 to-slate-950 text-white pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_50%)]" />
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30 backdrop-blur-xs">
            <Sparkles size={13} className="text-purple-400" />
            <span>KDP Studio • Reader Discovery Lounge</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Read Free Advance Books. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-200">
              Shape Tomorrow’s Bestsellers.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Get early access to unreleased manuscripts from independent authors. Download free EPUB/PDF proof copies, read at your own pace, and share your honest thoughts on Amazon.
          </p>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(user ? 'arc-manager' : 'login')}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Are You an Author? Launch Your Book ARC</span>
                <ArrowRight size={15} />
              </button>
            )}

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('newsletter-swaps')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Users size={15} className="text-purple-300" />
                <span>Author Cross-Promos</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          AMAZON & FTC COMPLIANCE NOTICE STRIP
         ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                100% Amazon KDP & FTC Compliant
              </h2>
              <p className="text-[11px] text-slate-500">
                Reviews are completely voluntary. Readers are never compensated, forced, or instructed on star ratings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
            <Award size={14} className="text-purple-600" />
            <span>Honest Reader Community</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          SEARCH & GENRE FILTER BAR
         ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or keyword..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/30"
            />
          </div>

          <div className="text-xs text-slate-500 self-end sm:self-auto font-medium">
            Showing <strong className="text-slate-900">{campaigns.length}</strong> available ARC campaign{campaigns.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGenre(g)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === g
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────
          SPONSORED / AD REVENUE BANNER UNIT (Top Slot)
         ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <div 
          id="arc-lounge-ad-top"
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-200 text-purple-900 px-2 py-0.5 rounded-md">
              Promoted Tool
            </span>
            <span className="text-xs font-bold text-slate-800">
              Format Your Book for Amazon KDP in Under 2 Minutes with AI Interior Engine
            </span>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('formatter')}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors shrink-0 cursor-pointer"
            >
              Try Formatter Free
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────
          CAMPAIGN BOOK CARDS GRID
         ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <BookOpen size={32} className="mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-800">No ARC campaigns found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No books matched your filter criteria. Try selecting another genre or be the first to launch an ARC campaign!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map((c, index) => {
              const slotsLeft = Math.max(0, c.totalSlots - (c.claimedSlots || 0));
              const percentClaimed = Math.min(100, Math.round(((c.claimedSlots || 0) / c.totalSlots) * 100));

              return (
                <React.Fragment key={c.id}>
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Top Meta Strip */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                          {c.genre}
                        </span>

                        {c.featured && (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Flame size={11} className="text-amber-600 fill-amber-600" />
                            <span>Trending ARC</span>
                          </span>
                        )}
                      </div>

                      {/* Cover & Title Row */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-purple-950 to-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs border border-purple-900/40 overflow-hidden">
                          {c.coverUrl ? (
                            <img
                              src={c.coverUrl}
                              alt={c.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen size={20} className="text-purple-300" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                            {c.title}
                          </h3>
                          {c.subtitle && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                              {c.subtitle}
                            </p>
                          )}
                          <p className="text-xs font-medium text-purple-700">
                            By {c.authorName}
                          </p>
                        </div>
                      </div>

                      {/* Blurb */}
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {c.blurb}
                      </p>
                    </div>

                    {/* Footer / Slots & Action */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      {/* Slot Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-600">
                            <strong className="text-purple-700">{slotsLeft}</strong> of {c.totalSlots} slots remaining
                          </span>
                          <span className="text-slate-400">{percentClaimed}% Claimed</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full transition-all"
                            style={{ width: `${percentClaimed}%` }}
                          />
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {c.reviewWindowDays} Day Reading Window
                        </span>
                        <span className="uppercase font-mono font-bold text-slate-600">
                          {c.format} Format
                        </span>
                      </div>

                      {/* Claim Button */}
                      <button
                        type="button"
                        disabled={slotsLeft === 0}
                        onClick={() => setClaimingCampaign(c)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          slotsLeft > 0
                            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs shadow-purple-600/20'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <BookOpen size={14} />
                        <span>{slotsLeft > 0 ? 'Claim Free ARC Copy' : 'Slots Filled'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Interspersed In-Feed Ad Unit after 3rd book */}
                  {index === 2 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center sm:text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          Sponsored Reader Partner
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          Looking for Bestseller Niche Ideas for Your Next Manuscript?
                        </h4>
                        <p className="text-xs text-slate-500">
                          Analyze Amazon category sales velocity, competition scores, and high-royalty keywords with KDP Spy.
                        </p>
                      </div>
                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate('research')}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
                        >
                          Explore Niche Spy
                        </button>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Reader Claim Modal */}
      {claimingCampaign && (
        <ArcClaimModal
          campaign={claimingCampaign}
          user={user}
          onClose={() => setClaimingCampaign(null)}
          onClaimSuccess={() => {
            loadCampaigns();
          }}
        />
      )}
    </div>
  );
};
