import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  Check, 
  Star, 
  BookOpen, 
  Edit3, 
  Layout, 
  Image as ImageIcon, 
  Tag, 
  Puzzle, 
  Smartphone, 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  Users
} from 'lucide-react';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { useGeoStore } from '../../lib/geoStore';
import { formatPrice } from '../../lib/geo';

interface HomePageViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const HomePageView: React.FC<HomePageViewProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const { currency, getFormattedPrice } = useGeoStore();
  const [activeBookTab, setActiveBookTab] = useState<'non-fiction' | 'childrens' | 'coloring' | 'puzzle'>('non-fiction');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleStart = () => {
    if (user) {
      onNavigate('dashboard');
    } else {
      onNavigate('signup');
    }
  };

  const BOOK_TYPE_CONTENT = {
    'non-fiction': {
      title: 'Non-Fiction & Self-Help Guides',
      desc: 'Create structured step-by-step guides, finance handbooks, recipe books, and memoirs with automated chapter outlines and citations.',
      bullets: [
        'AI outlines and full chapter generation in minutes',
        'Auto-generated Table of Contents, Preface, and Back Matter',
        'Standard 6×9" or 5.5×8.5" trim formatting with perfect margins'
      ],
      previewColor: 'from-blue-600 to-indigo-700',
      badge: 'Bestseller Niche',
      tag: '6×9" Non-Fiction',
    },
    'childrens': {
      title: "Children's Illustrated Storybooks",
      desc: 'Craft charming bedtime stories, educational tales, and early reader adventures with character consistency and vibrant full-bleed layouts.',
      bullets: [
        'Age-appropriate rhyming and narrative pacing assistant',
        'Full-bleed 8.5×8.5" and 8.5×11" trim size calculation',
        'Integrated AI image generator for colorful character scenes'
      ],
      previewColor: 'from-amber-500 to-orange-600',
      badge: 'High Royalties',
      tag: "8.5×8.5\" Children's",
    },
    'coloring': {
      title: 'Adult & Kids Coloring Books',
      desc: 'Build clean, high-resolution line art books, mandala collections, and mindfulness activity pages formatted for Amazon print engines.',
      bullets: [
        'Crisp black & white single-sided layout with blank backs',
        'Automated bleed and gutter calculations for thick paper',
        'Direct prompt engineering for clean line-art generation'
      ],
      previewColor: 'from-emerald-600 to-teal-700',
      badge: 'Low Content',
      tag: '8.5×11" Coloring',
    },
    'puzzle': {
      title: 'Word Search, Sudoku & Activity Books',
      desc: 'Produce engaging word search puzzles, sudoku grids, mazes, and solution index pages in seconds with custom word lists.',
      bullets: [
        'Word Search & Sudoku puzzle generator with solution keys',
        'Automatic page numbering and solution section indexing',
        'Rapid batch generation for fast KDP low-content launching'
      ],
      previewColor: 'from-purple-600 to-violet-800',
      badge: 'Fastest Launch',
      tag: '8.5×11" Puzzle Book',
    },
  };

  const currentTab = BOOK_TYPE_CONTENT[activeBookTab];

  return (
    <div id="home-page-view" className="w-full bg-white text-slate-900 font-sans selection:bg-purple-500 selection:text-white">
      
      {/* ─────────────────────────────────────────
          Section 1 — Hero: Dark purple-to-indigo gradient
         ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f0f1a] via-[#161430] to-[#1e1b4b] text-white pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8">
        
        {/* Background ambient lighting */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-7">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-semibold backdrop-blur-md animate-pulse">
            <Sparkles size={14} className="text-purple-300" />
            <span>Now with Google Gemini 2.0 & Imagen AI</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white">
            Create KDP-Ready Books <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-purple-100 to-indigo-200">
              in Minutes, Not Months
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            AI-powered writing, formatting, cover design and metadata — your complete Amazon KDP publishing suite in one place.
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-start-free-btn"
              onClick={handleStart}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-98 text-white font-bold text-base shadow-xl shadow-purple-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>{user ? 'Go to Your Studio' : 'Start Free — No credit card'}</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700 text-white font-semibold text-base backdrop-blur-sm transition-colors cursor-pointer"
            >
              <Play size={16} className="fill-current text-purple-400" />
              <span>See How It Works</span>
            </button>
          </div>

          {/* Trust sub-note */}
          <p className="text-xs text-slate-400 pt-1">
            Free plan available · No credit card required · Cancel anytime
          </p>

          {/* Floating Dashboard Preview Card */}
          <div className="pt-8 sm:pt-12 max-w-4xl mx-auto">
            <div className="relative rounded-2xl p-2 bg-gradient-to-b from-slate-700/60 to-slate-900/80 border border-slate-700/80 shadow-2xl shadow-purple-950/80 transform hover:scale-[1.01] transition-transform duration-300">
              <div className="bg-[#0f172a] rounded-xl overflow-hidden border border-slate-800 p-4 sm:p-6 text-left">
                {/* Browser top-bar mockup */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-xs text-slate-500 font-mono">kdpstudio.app/studio/manuscript-01</span>
                  </div>
                  <span className="text-[11px] font-bold text-purple-400 bg-purple-950/80 px-2.5 py-0.5 rounded border border-purple-800">
                    KDP Print Ready: 6×9" White (224 pgs)
                  </span>
                </div>

                {/* Grid inside dashboard mock */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>1. AI Chapter Studio</span>
                      <span className="text-emerald-400 text-[10px]">● Draft Synced</span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed font-serif italic line-clamp-3">
                      "The morning mist clung to the Himalayan peaks as Dev made his fateful choice..."
                    </div>
                    <div className="text-[10px] text-purple-400 font-semibold">14,280 words · 8 Chapters</div>
                  </div>

                  <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>2. KDP Margin Inspector</span>
                      <span className="text-purple-400 text-[10px]">Amazon Verified</span>
                    </div>
                    <div className="text-[10px] text-slate-400 space-y-1">
                      <div>Gutter: <span className="text-white font-mono">0.625 in</span></div>
                      <div>Spine: <span className="text-white font-mono">0.505 in</span></div>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[100%]" />
                    </div>
                  </div>

                  <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>3. Full Cover Spread</span>
                      <span className="text-amber-400 text-[10px]">Print PDF</span>
                    </div>
                    <div className="h-12 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 rounded border border-purple-700/50 flex items-center justify-center text-[11px] font-bold text-purple-200">
                      Front + Spine + Barcode Area
                    </div>
                    <div className="text-[10px] text-slate-400">Resolution: 300 DPI CMYK</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────
          Section 2 — Stats Bar (id="stats")
         ───────────────────────────────────────── */}
      <section id="stats" className="w-full bg-white border-y border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">10,000+</div>
            <div className="text-xs sm:text-sm text-slate-500 font-medium">Self-Publishers</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight">50,000+</div>
            <div className="text-xs sm:text-sm text-slate-500 font-medium">Books Created</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-amber-500 flex items-center justify-center gap-1 tracking-tight">
              <span>4.9</span>
              <Star size={20} className="fill-amber-500" />
            </div>
            <div className="text-xs sm:text-sm text-slate-500 font-medium">Author Rating</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">20 min</div>
            <div className="text-xs sm:text-sm text-slate-500 font-medium">Average Book Time</div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          Section 3 — Features (id="features")
         ───────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Publishing Suite
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Everything You Need to Publish
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            From blank page to KDP-ready book — all in one platform
          </p>
        </div>

        {/* 6 feature cards in 3×2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Card 1 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <Edit3 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                ✍️ AI Book Writing
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Write entire chapters with AI assistance or type manually. Rich text editor with formatting tools, chapter re-ordering, and real-time word counting.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-purple-600">
              <span>Try Book Studio</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Layout size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                📐 Interior Formatter
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Auto-calculate KDP margins, gutter dimensions, spine width, and typography. Export 300 DPI print-ready interior PDFs in standard 5×8, 6×9, or 8.5×11 trim sizes.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-blue-600">
              <span>Calculate KDP Margins</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <ImageIcon size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                🎨 Cover Builder
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Design full cover spreads — front, spine, and back. AI prompt-driven artwork generation, barcode safe-zone guides, and exact pixel dimensions calculated for page count.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-indigo-600">
              <span>Design Full Spread</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Tag size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                🏷️ KDP Metadata Tools
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate high-converting 7 backend keywords, HTML-formatted Amazon book descriptions, best-ranking BISAC categories, and localized pricing strategies.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span>Optimize Metadata</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all">
                <Puzzle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                🧩 Puzzle Generator
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Create word searches, sudoku matrices, coloring books, and activity pages with automated solution appendices — the highest velocity KDP publishing niche.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-amber-600">
              <span>Generate Puzzles</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all">
                <Smartphone size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                📱 EPUB & Kindle Export
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Export validated reflowable EPUB 3 files for Kindle eBook publishing alongside your paperback and hardcover editions with zero re-formatting needed.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-rose-600">
              <span>Export eBook & Print</span>
              <ArrowRight size={13} />
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────
          Section 4 — How It Works (id="how-it-works")
         ───────────────────────────────────────── */}
      <section id="how-it-works" className="bg-[#0f0f1a] text-white py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950 px-3 py-1 rounded-full border border-purple-800">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              From Idea to Published in 3 Steps
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Publishing on Amazon KDP no longer takes months of manual formatting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-slate-900/80 rounded-2xl p-8 border border-slate-800 relative space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center text-xl font-black">
                1
              </div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>💡 Describe Your Book</span>
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Enter your book topic, target genre, tone of voice, audience, and trim size. Takes less than 30 seconds to configure.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/80 rounded-2xl p-8 border border-slate-800 relative space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center text-xl font-black">
                2
              </div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>⚡ AI Generates Everything</span>
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Gemini AI writes chapter drafts, generates cover illustrations, validates gutter margins, and formats headings with one click.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/80 rounded-2xl p-8 border border-slate-800 relative space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-xl font-black">
                3
              </div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📤 Download & Publish</span>
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Export verified KDP-ready interior PDF, 300 DPI full cover PDF, and copy-paste Amazon metadata directly into KDP.
              </p>
            </div>

          </div>

          <div className="text-center pt-4">
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-xl shadow-purple-900/50 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Build Your First Manuscript</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          Section 5 — Book Types: Tabbed Explorer
         ───────────────────────────────────────── */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Publishing Formats
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            What Will You Create?
          </h2>
          <p className="text-slate-600 text-base">
            Optimized workflows for every popular self-publishing genre on Amazon.
          </p>
        </div>

        {/* 4 Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {(['non-fiction', 'childrens', 'coloring', 'puzzle'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveBookTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeBookTab === tab
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab === 'non-fiction' && '📖 Non-Fiction'}
              {tab === 'childrens' && "🧒 Children's"}
              {tab === 'coloring' && '🎨 Coloring'}
              {tab === 'puzzle' && '🧩 Puzzles'}
            </button>
          ))}
        </div>

        {/* Tab Detail Showcase */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200/90 p-6 sm:p-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                {currentTab.badge}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {currentTab.tag}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              {currentTab.title}
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed">
              {currentTab.desc}
            </p>

            <ul className="space-y-3">
              {currentTab.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-colors"
              >
                <span>Create this type</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Illustrated preview */}
          <div className="relative">
            <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${currentTab.previewColor} p-6 text-white shadow-xl flex flex-col justify-between`}>
              <div className="flex items-center justify-between text-xs font-bold text-white/90">
                <span>KDP Studio Auto-Formatter</span>
                <span>300 DPI Export</span>
              </div>
              <div className="space-y-2 text-center py-4">
                <div className="text-xl sm:text-2xl font-black">{currentTab.title}</div>
                <div className="text-xs text-white/80">Automated Layout & Pre-Flight Validation</div>
              </div>
              <div className="bg-black/20 rounded-lg p-2.5 backdrop-blur-xs flex items-center justify-between text-[11px] font-mono">
                <span>Gutter: 0.5 in</span>
                <span>Bleed: 0.125 in</span>
                <span>Status: READY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          Section 6 — Pricing Preview
         ───────────────────────────────────────── */}
      <section className="bg-slate-50 py-20 sm:py-28 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Transparent Plans
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Start Free, Scale When Ready
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Simple pricing in your local currency. Upgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            
            {/* Free */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-lg">Free Plan</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    {formatPrice(0, currency)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/forever</span>
                </div>
                <p className="text-xs text-slate-500">Perfect to test formatting & AI capabilities</p>
                <ul className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-purple-600" /> 1 Book Project
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-purple-600" /> 3 AI Generations / day
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-purple-600" /> 1 PDF Export / day
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-purple-600" /> Basic Cover Builder
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onNavigate('signup')}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-50"
              >
                Start Free
              </button>
            </div>

            {/* Pro - Highlighted */}
            <div className="bg-white rounded-2xl border-2 border-purple-600 p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
                Most Popular
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-purple-700 text-lg">Pro Plan</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    {getFormattedPrice('pro')}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/month</span>
                </div>
                <p className="text-xs text-slate-500">For serious authors & full-time KDP creators</p>
                <ul className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <li className="flex items-center gap-2 font-semibold text-slate-900">
                    <Check size={15} className="text-purple-600" /> Unlimited Book Projects
                  </li>
                  <li className="flex items-center gap-2 font-semibold text-slate-900">
                    <Check size={15} className="text-purple-600" /> Unlimited AI Generations
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-purple-600" /> Unlimited Print PDF Exports
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-purple-600" /> AI Image Generation (Imagen 3)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-purple-600" /> EPUB Kindle & Puzzle Generator
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onNavigate('pricing')}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30"
              >
                Start with Pro
              </button>
            </div>

            {/* Agency */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-lg">Agency Plan</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    {getFormattedPrice('agency')}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/month</span>
                </div>
                <p className="text-xs text-slate-500">For publishing agencies & author collectives</p>
                <ul className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <li className="flex items-center gap-2 font-semibold text-slate-900">
                    <Check size={15} className="text-purple-600" /> 3 Team Member Seats
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-purple-600" /> Everything in Pro Unlimited
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-purple-600" /> Priority Concierge Support
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-purple-600" /> Brand Kit & Shared Library
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onNavigate('contact')}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-50"
              >
                Contact Us
              </button>
            </div>

          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => onNavigate('pricing')}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline inline-flex items-center gap-1"
            >
              <span>See full pricing matrix & localized payment methods</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          Section 7 — Testimonials
         ───────────────────────────────────────── */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Real Authors
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Loved by 10,000+ KDP Publishers
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            From first-time authors to full-time six-figure KDP publishers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Testimonial 1 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "I published my first book in one evening using KDP Studio. The cover builder alone saved me ₹15,000 in design costs."
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                PM
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">Priya M.</div>
                <div className="text-[11px] text-slate-500">Non-Fiction Author · Chennai, India</div>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "The puzzle book generator is incredible. I published 8 word search books in a single weekend."
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                JK
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">James K.</div>
                <div className="text-[11px] text-slate-500">KDP Publisher · United Kingdom</div>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "Finally a tool that understands KDP's exact requirements. No more margin errors or cover rejections."
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                SL
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">Sarah L.</div>
                <div className="text-[11px] text-slate-500">Children's Book Author · Canada</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────
          Section 8 — Final CTA: Purple gradient
         ───────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Ready to Publish Your First Book?
          </h2>
          <p className="text-purple-100 text-sm sm:text-base max-w-xl mx-auto">
            Join 10,000+ authors who use KDP Studio every day to format, design, and launch Amazon bestsellers.
          </p>
          <div className="pt-2">
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-purple-900 font-black text-sm sm:text-base shadow-xl hover:bg-purple-50 active:scale-98 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles size={16} className="text-purple-600" />
              <span>Start Free Today</span>
              <ArrowRight size={16} />
            </button>
          </div>
          <p className="text-xs text-purple-200">
            Free plan includes 1 book project, 3 AI generations daily
          </p>
        </div>
      </section>

    </div>
  );
};
