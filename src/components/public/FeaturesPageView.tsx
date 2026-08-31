'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  BookOpen, 
  FileText, 
  Palette, 
  Search, 
  Download, 
  Zap, 
  Layers, 
  Cpu, 
  Grid, 
  TrendingUp, 
  BadgeCheck, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  FileCheck,
  RefreshCw,
  FolderZip,
  Wand2
} from 'lucide-react';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { SEOHead } from '../seo/SEOHead';
import { JsonLd } from '../seo/JsonLd';
import { SectionShadowTransition } from './SectionShadowTransition';

interface FeaturesPageViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const FeaturesPageView: React.FC<FeaturesPageViewProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState<'all' | 'ai' | 'formatting' | 'covers' | 'puzzles' | 'seo'>('all');

  const handleStart = () => {
    if (user) {
      onNavigate('dashboard');
    } else {
      onNavigate('signup');
    }
  };

  const FEATURES_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "KDP Studio Features",
    "description": "Comprehensive feature breakdown of KDP Studio: AI manuscript drafting, print interior formatting, wrap cover generator, low-content puzzle creator, and Amazon SEO suite.",
    "url": "https://kdpstudio-aio.web.app/features",
    "applicationCategory": "BusinessApplication"
  };

  return (
    <div className="w-full bg-white text-slate-900 font-sans selection:bg-purple-600 selection:text-white">
      {/* SEO Metadata */}
      <SEOHead
        pageKey="features"
        title="Features — The Complete AI Self-Publishing Studio | KDP Studio"
        description="Explore the full suite of KDP Studio features: Claude AI writing studio, print interior formatter with KDP bleed & gutter math, 300 DPI wrap cover generator, and low-content puzzle engine."
        canonicalPath="/features"
      />
      <JsonLd id="jsonld-features" data={FEATURES_SCHEMA} />

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HERO HEADER
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
        
        {/* Subtle CSS Grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px'
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300 text-xs sm:text-sm font-semibold backdrop-blur-md shadow-lg shadow-purple-950/50">
            <Sparkles size={14} className="text-purple-400" />
            <span>Engineered specifically for Amazon KDP & Print-On-Demand Publishers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto font-display">
            Every Tool You Need to Build, <br className="hidden sm:inline" />
            <span className="font-serif italic font-normal bg-gradient-to-r from-purple-300 via-violet-200 to-indigo-300 bg-clip-text text-transparent">
              Format & Publish Bestsellers
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate fragmented tools, expensive freelancers, and Amazon print rejections. KDP Studio unifies research, AI writing, interior typesetting, cover art, and metadata into one guided workflow.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-purple-600/30 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>{user ? 'Open Studio Dashboard' : 'Start Free with 15 Daily Credits'}</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm sm:text-base border border-white/20 transition-all cursor-pointer"
            >
              View Plan Quotas
            </button>
          </div>
        </div>
      </section>
      <SectionShadowTransition type="dark-to-white" />

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. DEEP FEATURE BREAKDOWN MODULES
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28">
        
        {/* MODULE 1: AI WRITING STUDIO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider">
              <Cpu size={14} className="text-purple-600" />
              <span>Claude AI Core</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight font-display">
              AI Manuscript Studio with <span className="font-serif italic font-normal text-purple-600">Consistent Author Voice</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Never get stuck on a blank page. Generate deeply researched book blueprints, complete 15+ chapter outlines, and draft prose chapter-by-chapter while retaining your established tone, target audience persona, and style guide.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-700">
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                <span><strong>Multi-Pass Chapter Generation:</strong> Draft, expand scenes, and auto-polish in 1 click.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                <span><strong>Tone & Style Memory:</strong> Keeps narrative pacing and vocabulary consistent across 300+ pages.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                <span><strong>Fiction & Nonfiction Specializations:</strong> Character arc plotting or framework callout boxes.</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 text-white p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                <span className="font-mono text-purple-400 font-bold">Chapter 04: The Memory Engine</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-800">Voice Locked</span>
              </div>
              <div className="space-y-2 text-xs font-serif text-slate-300 leading-relaxed italic bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <p>
                  "The archives of the Old City did not hum with machinery; they whispered with parchment. When Evelyn reached the fourteenth shelf, the dust seemed charged with something older than ink..."
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 text-center text-[11px] font-semibold">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-purple-400 font-mono">1,840</div>
                  <div className="text-[10px] text-slate-400">Words Drafted</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-emerald-400 font-mono">0.98</div>
                  <div className="text-[10px] text-slate-400">Flow Score</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-indigo-400 font-mono">18 / 18</div>
                  <div className="text-[10px] text-slate-400">Outline Synced</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODULE 2: PRINT INTERIOR FORMATTER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-bold text-slate-900">
                <span>KDP Print Margin Visualizer</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">0.125″ Bleed Verified</span>
              </div>
              <div className="aspect-[4/3] rounded-2xl bg-amber-50/40 border border-amber-200/60 p-6 flex flex-col justify-between relative font-serif text-slate-800">
                <div className="text-center text-[11px] font-sans tracking-widest text-slate-400 uppercase">
                  THE MIDNIGHT ANTIQUARIAN • CHAPTER IV
                </div>
                <div className="space-y-2 text-xs leading-relaxed">
                  <div className="text-3xl font-bold float-left mr-2 leading-none text-slate-900 font-serif">
                    T
                  </div>
                  <p className="text-[11px] text-slate-700">
                    he heavy mahogany doors opened onto a room that defied the geometry of the street outside. Vaulted ceilings vanished into indigo shadow, where brass chandeliers hung cold.
                  </p>
                </div>
                <div className="text-center text-[10px] font-sans text-slate-400">
                  — 47 —
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                <span>Inside Gutter: 0.750″</span>
                <span>Outside Margin: 0.500″</span>
                <span>Trim: 6″ × 9″</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black uppercase tracking-wider">
              <FileText size={14} className="text-indigo-600" />
              <span>Automated Typesetting & Gutters</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Zero-Rejection Print Interior Formatter
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Amazon KDP rejects thousands of uploads daily due to improper inner gutters and bleed cutoffs. KDP Studio uses automated paper math to calculate gutter depth dynamically based on your page count, trim size, and paper color.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-700">
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />
                <span><strong>Ornamental Typography:</strong> Drop caps, chapter motifs, fleurons, and running headers.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />
                <span><strong>Exact Gutter Math:</strong> Guaranteed binding clearance so readers never struggle to read spine edges.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />
                <span><strong>Industry Trim Presets:</strong> 5″×8″, 5.5″×8.5″, 6″×9″, 8.5″×11″, and square 8.25″ formats.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* MODULE 3: FULL WRAP COVER DESIGNER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider">
              <Palette size={14} className="text-rose-600" />
              <span>Google Imagen 3 Integration</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Spine-Calculated Wrap Cover Designer
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Generate 300 DPI paperback wraps including front cover art, back cover marketing copy, author bio, barcode safe zone, and mathematically accurate spine thickness.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-700">
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-rose-600 shrink-0" />
                <span><strong>Automatic Spine Thickness:</strong> Computed precisely from page count × 0.002252″ white paper density.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-rose-600 shrink-0" />
                <span><strong>Barcode & Price Safe Zone:</strong> Automatic compliance with Amazon KDP barcode placement box.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-rose-600 shrink-0" />
                <span><strong>Full 300 DPI High-Res PDF:</strong> Ready for immediate upload without pixelation warnings.</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-950 p-4 space-y-3 text-white">
              <div className="aspect-[16/9] rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-white/10 flex items-stretch p-3 text-center text-xs relative overflow-hidden">
                {/* Back Cover */}
                <div className="flex-1 border-r border-dashed border-white/20 p-2 flex flex-col justify-between text-left">
                  <div className="text-[8px] text-slate-400 leading-tight">
                    "A masterpiece of atmospheric dread..."
                  </div>
                  <div className="w-10 h-6 bg-white/10 rounded border border-white/20 self-end text-[7px] flex items-center justify-center font-mono">
                    BARCODE
                  </div>
                </div>
                {/* Spine */}
                <div className="w-8 border-r border-dashed border-white/20 flex items-center justify-center">
                  <span className="rotate-90 text-[8px] font-mono whitespace-nowrap tracking-wider text-purple-300">
                    THE MIDNIGHT ANTIQUARIAN
                  </span>
                </div>
                {/* Front Cover */}
                <div className="flex-1 p-2 flex flex-col justify-between">
                  <div className="text-[10px] font-black text-purple-300 uppercase">Thriller</div>
                  <div className="text-xs font-black leading-tight">The Midnight Antiquarian</div>
                  <div className="text-[8px] text-slate-400 font-mono">KDP Studio Edition</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-2">
                <span>Spine Width: 0.765″</span>
                <span>Bleed: 0.125″</span>
                <span>Resolution: 300 DPI</span>
              </div>
            </div>
          </div>
        </div>

        {/* MODULE 4: PUZZLE & ACTIVITY BOOK ENGINE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-bold text-slate-900">
                <span>Word Search & Sudoku Engine</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Answer Key Included</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-center text-xs font-bold text-slate-800">
                {['M','Y','S','T','E','R','Y','A','U','T','H','O','R','K','D','P','B','O','O','K','S','T','U','D','I','O','P','U','B','L','I','S','H','E','R','S'].map((letter, i) => (
                  <div key={i} className={`p-1.5 rounded ${i % 7 === 0 ? 'bg-purple-100 text-purple-800' : 'bg-white'}`}>
                    {letter}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span>100 Themed Word Searches</span>
                <span>Vector Line Coloring Pages</span>
                <span>4 Sudoku Difficulty Levels</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
              <Grid size={14} className="text-emerald-600" />
              <span>Low-Content Publishing Suite</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Automated Puzzle & Activity Book Engine
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Low-content books are one of the most profitable Amazon KDP categories. Generate complete 100+ page puzzle books in seconds with auto-placed solutions and bleed-safe layouts.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-700">
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span><strong>Theme-Pure Word Banks:</strong> Generate high-intent niche word searches (True Crime, Botany, 90s Nostalgia).</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span><strong>Multi-Puzzle Types:</strong> Word Search, Sudoku, Word Fit, Color by Number, and Coloring Books.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span><strong>Complete Back-of-Book Solutions:</strong> Formatted 4-up or 6-up solution grids automatically generated.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* MODULE 5: AMAZON KDP NICHE & 7-KEYWORD INTELLIGENCE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider">
              <Search size={14} className="text-amber-600" />
              <span>Algorithm Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Amazon KDP Niche & 7-Keyword Suite
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Great books fail without discoverability. Get high-converting Amazon search keywords, targeted BISAC category assignments, and A+ Content descriptions ready to paste into your KDP dashboard.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-700">
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-amber-600 shrink-0" />
                <span><strong>7 Optimized Keyword Strings:</strong> Algorithmically composed to maximize search impression share.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-amber-600 shrink-0" />
                <span><strong>BISAC Category Matcher:</strong> Find low-competition subcategories to rank #1 Bestseller quickly.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-amber-600 shrink-0" />
                <span><strong>Formatted HTML Description:</strong> Bold tags, bullet lists, and headline hooks ready to copy-paste.</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 p-6 space-y-4 text-white text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-amber-400">Amazon 7-Keyword Matrix</span>
                <span className="text-slate-400 font-mono text-[10px]">High Intent • Low Competition</span>
              </div>
              <div className="space-y-2">
                {[
                  'cozy mystery bookstore secrets amateur sleuth',
                  'gothic crime thriller large print novel',
                  'french country manor murder mystery series',
                  'page turner detective investigation historical',
                  'whodunit suspense fiction bestseller books'
                ].map((kw, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-[11px]">
                    <span className="text-slate-200 truncate">{kw}</span>
                    <span className="text-emerald-400 shrink-0 text-[10px] font-bold">Vol 14.2k</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. FEATURE COMPARISON MATRIX
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Why Creators Choose KDP Studio
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Compare KDP Studio against traditional fragmented publishing workflows.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="grid grid-cols-3 bg-slate-900 text-white p-4 sm:p-6 text-xs sm:text-sm font-bold">
              <div>Publishing Capability</div>
              <div className="text-purple-400 text-center">KDP Studio</div>
              <div className="text-slate-400 text-center">Traditional Method</div>
            </div>

            {[
              { cap: 'Manuscript Generation (Claude AI)', studio: 'Included (Instant Outline & Chapters)', trad: 'Weeks of writing or $2,000 ghostwriter' },
              { cap: 'KDP Margin & Gutter Math', studio: 'Automated 100% Gutter Safe', trad: 'Manual Adobe InDesign math' },
              { cap: '300 DPI Wrap Cover & Spine', studio: 'Calculated from Page Count', trad: '$300-$800 Freelance Designer' },
              { cap: 'Puzzle & Activity Book Engine', studio: 'Built-in 1-Click Generator', trad: 'Separate paid puzzle subscriptions' },
              { cap: 'Amazon 7-Keywords & Categories', studio: 'AI Niche Search Volume', trad: 'Manual keyword guessing' },
              { cap: 'Royalties & Copyrights', studio: '100% Yours Forever', trad: 'Often split with agencies' },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-3 p-4 sm:p-5 text-xs sm:text-sm items-center border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}>
                <div className="font-bold text-slate-900">{row.cap}</div>
                <div className="text-purple-700 font-semibold text-center flex items-center justify-center gap-1.5">
                  <Check size={16} className="text-purple-600 shrink-0" />
                  <span>{row.studio}</span>
                </div>
                <div className="text-slate-500 text-center text-xs">{row.trad}</div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <button
              onClick={handleStart}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-purple-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>{user ? 'Open Studio Dashboard' : 'Get Started Free'}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
