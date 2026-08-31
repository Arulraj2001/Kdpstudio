import React from 'react';
import { 
  Calculator, 
  Compass, 
  AlertOctagon, 
  QrCode, 
  KeyRound, 
  Search, 
  TrendingUp, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Grid3X3, 
  Palette, 
  Hash, 
  DollarSign, 
  ShieldCheck,
  CheckCircle2,
  Baby,
  UtensilsCrossed,
  Calendar
} from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';
import { JsonLd } from '../seo/JsonLd';
import { SectionShadowTransition } from './SectionShadowTransition';
import { PageRoute } from '../../types';

interface ToolsHubPageViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const ToolsHubPageView: React.FC<ToolsHubPageViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 font-sans pb-24">
      <SEOHead
        pageKey="features"
        title="Free Amazon KDP Creator Tools & Calculators — KDP Studio"
        description="Explore the complete suite of free and pro Amazon KDP self-publishing tools: Royalty Calculator, Reverse ASIN Spy, Negative Review Miner, Lead Magnet QR Studio, and Algorithmic Puzzle Generators."
        canonicalPath="/tools"
      />

      {/* ── HERO HEADER ── */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-14 pb-18 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs sm:text-sm font-bold shadow-lg">
            <Sparkles size={15} className="text-purple-400" />
            <span>Official Amazon KDP Publishing &amp; Intelligence Suite</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight font-display">
            Self-Publishing <span className="font-serif italic font-normal text-purple-400">Power Tools &amp; Engines</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Free, mathematically accurate calculators, competitive market intelligence scanners, vector puzzle creators, and publishing studios built specifically for Amazon KDP authors.
          </p>
        </div>
      </section>
      <SectionShadowTransition type="dark-to-white" />

      {/* ── 4 COLUMNAR TOOL CATEGORIES ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-16">
        
        {/* COLUMN GROUP 1: MARKET RESEARCH & FINANCIAL CALCULATORS (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUMN 1: MARKET RESEARCH & REVERSE ENGINEERING */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    🔍
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Market Research &amp; Competitor Spy</h2>
                    <p className="text-xs text-slate-500">Reverse-engineer bestselling books and reader demand</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Intelligence
                </span>
              </div>

              {/* Tool Item 1: Reverse ASIN Spy */}
              <div 
                onClick={() => onNavigate('asin-spy')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-purple-500 bg-slate-50/60 hover:bg-purple-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass size={18} className="text-purple-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                      Reverse ASIN &amp; BSR Sales Spy
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                    Open Tool →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter any Amazon ASIN or book link to calculate estimated daily sales velocity, monthly royalties, and target sales needed for the #1 rank badge.
                </p>
              </div>

              {/* Tool Item 2: Review Pain-Point Miner */}
              <div 
                onClick={() => onNavigate('review-miner')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-rose-500 bg-slate-50/60 hover:bg-rose-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertOctagon size={18} className="text-rose-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-rose-700 transition-colors">
                      Customer Review &amp; Pain-Point Miner
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-rose-600 group-hover:translate-x-1 transition-transform">
                    Open Tool →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Extract and cluster 1–3 star customer complaints across competitor books. Synthesizes an AI counter-strategy blueprint to build a superior bestseller.
                </p>
              </div>

              {/* Tool Item 3: Niche Research Explorer */}
              <div 
                onClick={() => onNavigate('research')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                      Amazon 7-Keyword &amp; Category Explorer
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                    Open Tool →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Discover high-volume, low-competition keywords and explore profitable Amazon BISAC categories with difficulty scoring.
                </p>
              </div>
            </div>
          </div>

          {/* COLUMN 2: FINANCIAL & ROYALTY CALCULATORS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    💰
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Royalty &amp; Print Cost Engines</h2>
                    <p className="text-xs text-slate-500">Official mathematical Amazon KDP pricing formulas</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Financial
                </span>
              </div>

              {/* Tool Item 1: Live Royalty Calculator */}
              <div 
                onClick={() => onNavigate('royalty-calculator')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator size={18} className="text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                      Live KDP Print Cost &amp; Royalty Calculator
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                    Open Tool →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time Amazon print costs and author royalties for paperbacks, hardcovers, B&amp;W, and color inks across 13 global Amazon marketplaces.
                </p>
              </div>

              {/* Tool Item 2: Lead Magnet & QR Studio */}
              <div 
                onClick={() => onNavigate('lead-magnet')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-purple-500 bg-slate-50/60 hover:bg-purple-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode size={18} className="text-purple-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                      Back-of-Book Lead Magnet &amp; QR Studio
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                    Open Tool →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Design 300 DPI vector bonus download pages with dynamic QR codes to turn passive book buyers into lifelong email subscribers.
                </p>
              </div>

              {/* Tool Item 3: Pricing Sweet-Spot Planner */}
              <div 
                onClick={() => onNavigate('pricing')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-cyan-500 bg-slate-50/60 hover:bg-cyan-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-cyan-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-cyan-700 transition-colors">
                      Pricing Sweet-Spot &amp; Margin Guide
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-cyan-600 group-hover:translate-x-1 transition-transform">
                    View Guide →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Compare paperback pricing strategies ($8.99 vs $12.99) and find optimal profit margins for fiction, non-fiction, and activity books.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* COLUMN GROUP 2: ACTIVITY & PUZZLE STUDIOS (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUMN 3: ALGORITHMIC PUZZLE GENERATORS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    🧩
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Algorithmic Puzzle Studios</h2>
                    <p className="text-xs text-slate-500">Pure algorithmic generation with instant answer keys</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Vector Engine
                </span>
              </div>

              {/* Tool Item 1: Sudoku 9x9 Studio */}
              <div 
                onClick={() => onNavigate('sudoku-generator')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-purple-500 bg-slate-50/60 hover:bg-purple-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Grid3X3 size={18} className="text-purple-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                      Classic 9×9 Sudoku Generator Studio
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                    Open Studio →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate 100% unique 9×9 Sudoku puzzle books across 4 difficulty levels with ready-to-publish vector PDF book exports and 4-per-page answer keys.
                </p>
              </div>

              {/* Tool Item 2: Clued Crossword Studio */}
              <div 
                onClick={() => onNavigate('crossword-generator')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Grid3X3 size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                      Clued Crossword Puzzle Studio
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                    Open Studio →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Create intersecting crossword puzzles with authentic Across &amp; Down numbered clues, themed vocabulary banks, and answer key grids.
                </p>
              </div>

              {/* Tool Item 3: Algorithmic Mazes */}
              <div 
                onClick={() => onNavigate('maze-generator')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                      Algorithmic Maze Generator Studio
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                    Open Studio →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Wilson's algorithm for 100% solvable rectangular, circular, and diamond mazes with instant BFS solution path keys.
                </p>
              </div>

              {/* Tool Item 4: Cryptograms & Ciphers */}
              <div 
                onClick={() => onNavigate('cryptogram-generator')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-purple-500 bg-slate-50/60 hover:bg-purple-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound size={18} className="text-purple-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                      Cryptogram &amp; Substitution Cipher Studio
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                    Open Studio →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Monoalphabetic cipher generator with quote libraries, letter frequency analysis, adjustable hints, and formatted answer sheets.
                </p>
              </div>
            </div>
          </div>

          {/* COLUMN 4: COLORING & ACTIVITY BOOK STUDIOS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                    🎨
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Coloring &amp; Activity Studios</h2>
                    <p className="text-xs text-slate-500">AI line art, word fit, and color-by-number generators</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                  Creative
                </span>
              </div>

              {/* Tool Item 1: Children's Books */}
              <div 
                onClick={() => onNavigate('childrens-book-studio')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-pink-500 bg-slate-50/60 hover:bg-pink-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Baby size={18} className="text-pink-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-pink-700 transition-colors">
                      Children's Illustrated Storyboard Studio
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-pink-600 group-hover:translate-x-1 transition-transform">
                    Open Studio →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  24 &amp; 32-page picture book spreads with character consistency locks and full-bleed 8.5×8.5" PDF manuscript exports.
                </p>
              </div>

              {/* Tool Item 2: Cookbook Studio */}
              <div 
                onClick={() => onNavigate('cookbook-studio')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-amber-500 bg-slate-50/60 hover:bg-amber-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed size={18} className="text-amber-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                      Cookbook &amp; Structured Recipe Studio
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                    Open Studio →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gourmet recipes with macro nutrition, structured ingredients, chef's tips, and 2-column PDF cookbook manuscripts.
                </p>
              </div>

              {/* Tool Item 3: Low-Content Planner */}
              <div 
                onClick={() => onNavigate('planner-studio')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-cyan-500 bg-slate-50/60 hover:bg-cyan-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-cyan-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-cyan-700 transition-colors">
                      Planners, Habit &amp; Journal Studio
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-cyan-600 group-hover:translate-x-1 transition-transform">
                    Open Studio →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Parametric vector daily productivity planners, 10-habit matrices, gratitude journals, and 5mm dot grid interiors with 0.75" gutter safe margins.
                </p>
              </div>

              {/* Tool Item 4: Coloring Books */}
              <div 
                onClick={() => onNavigate('puzzles')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-pink-500 bg-slate-50/60 hover:bg-pink-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette size={18} className="text-pink-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-pink-700 transition-colors">
                      AI Line Art Coloring Book Studio
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-pink-600 group-hover:translate-x-1 transition-transform">
                    Open Studio →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate crisp, 300 DPI vector line art for coloring books (mandalas, animals, fantasy, kids, landscapes).
                </p>
              </div>

              {/* Tool Item 5: Color By Number */}
              <div 
                onClick={() => onNavigate('puzzles')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-amber-500 bg-slate-50/60 hover:bg-amber-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash size={18} className="text-amber-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                      Color By Number Activity Studio
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                    Open Studio →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Convert images into numbered color-by-number matrices with color legend palettes and answer guides.
                </p>
              </div>

              {/* Tool Item 6: Word Fit Crosswords */}
              <div 
                onClick={() => onNavigate('puzzles')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Grid3X3 size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                      Word Fit &amp; Fill-In Studio
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                    Open Studio →
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Create crossword-style word fit puzzles where readers place word lists into intersecting grid patterns.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
