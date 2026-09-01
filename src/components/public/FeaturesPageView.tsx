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
  Wand2,
  Users,
  Share2,
  Lock,
  UploadCloud,
  FileCode,
  Tag
} from 'lucide-react';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { SEOHead } from '../seo/SEOHead';
import { JsonLd } from '../seo/JsonLd';
import { SectionShadowTransition } from './SectionShadowTransition';
import { AuthorIpShieldBanner } from '../ui/AuthorIpShieldBanner';

interface FeaturesPageViewProps {
  onNavigate: (route: PageRoute) => void;
}

type FeatureCategory = 'all' | 'ai' | 'formatting' | 'covers' | 'puzzles' | 'marketing' | 'security';

export const FeaturesPageView: React.FC<FeaturesPageViewProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState<FeatureCategory>('all');

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
    "description": "Comprehensive feature breakdown of KDP Studio: AI manuscript drafting, print interior formatting, wrap cover generator, low-content puzzle creator, ARC reader lounge, newsletter swaps, and Amazon SEO suite.",
    "url": "https://kdpstudio-aio.web.app/features",
    "applicationCategory": "BusinessApplication"
  };

  const categories: { id: FeatureCategory; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'all', label: 'All Features', icon: Sparkles },
    { id: 'ai', label: 'AI Writing & Blueprints', icon: Cpu },
    { id: 'formatting', label: 'Typesetting & Margins', icon: FileText },
    { id: 'covers', label: 'Cover & Spine Art', icon: Palette },
    { id: 'puzzles', label: 'Puzzles & Low-Content', icon: Grid },
    { id: 'marketing', label: 'ARC Lounge & Swaps', icon: Users },
    { id: 'security', label: 'Importer & Security', icon: ShieldCheck },
  ];

  return (
    <div className="w-full bg-white text-slate-900 font-sans selection:bg-purple-600 selection:text-white">
      {/* SEO Metadata */}
      <SEOHead
        pageKey="features"
        title="Features — The Complete AI Self-Publishing Studio | KDP Studio"
        description="Explore the full suite of KDP Studio features: Claude AI writing, print interior formatter with KDP bleed & gutter math, 300 DPI wrap covers, puzzle engine, ARC reader lounge, and newsletter cross-promotions."
        canonicalPath="/features"
      />
      <JsonLd id="jsonld-features" data={FEATURES_SCHEMA} />

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HERO HEADER
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-20 pb-20 sm:pt-24 sm:pb-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
        
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
            <span>Engineered specifically for Amazon KDP &amp; Print-On-Demand Publishers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto font-display">
            Every Tool You Need to Build, <br className="hidden sm:inline" />
            <span className="font-serif italic font-normal bg-gradient-to-r from-purple-300 via-violet-200 to-indigo-300 bg-clip-text text-transparent">
              Format, Promote &amp; Publish Bestsellers
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Eliminate fragmented software, expensive ghostwriters, and Amazon print rejections. KDP Studio unifies research, AI writing, interior typesetting, wrap covers, algorithmic puzzles, advance reader copies (ARCs), and newsletter swaps into one cohesive cloud platform.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStart}
              className="btn-md-cta w-full sm:w-auto inline-flex items-center justify-center gap-2"
            >
              <span>{user ? 'Open Studio Dashboard' : 'Start Free with 15 Daily Credits'}</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="btn-md w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              View Plan Quotas
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50 scale-102 border border-purple-400'
                      : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : 'text-purple-400'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      
      <SectionShadowTransition type="dark-to-white" />

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. DEEP FEATURE BREAKDOWN MODULES
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        
        {/* MODULE 1: AI WRITING STUDIO */}
        {(activeCategory === 'all' || activeCategory === 'ai') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
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
                  <span><strong>Tone &amp; Style Memory:</strong> Keeps narrative pacing and vocabulary consistent across 300+ pages.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                  <span><strong>Fiction &amp; Nonfiction Specializations:</strong> Character conflict arcs or framework callout boxes.</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6">
              <div className="card-md bg-slate-900 text-white p-6 space-y-4 shadow-xl border border-slate-800">
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
        )}

        {/* MODULE 2: PRINT INTERIOR FORMATTER */}
        {(activeCategory === 'all' || activeCategory === 'formatting') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="card-md bg-white p-6 space-y-4 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-bold text-slate-900">
                  <span>KDP Print Margin Visualizer</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">0.125″ Bleed Verified</span>
                </div>
                <div className="aspect-[4/3] rounded-2xl bg-amber-50/50 border border-amber-200/60 p-6 flex flex-col justify-between relative font-serif text-slate-800 shadow-inner">
                  <div className="text-center text-[11px] font-sans tracking-widest text-slate-400 uppercase">
                    THE MIDNIGHT ANTIQUARIAN • CHAPTER IV
                  </div>
                  <div className="space-y-2 text-xs leading-relaxed">
                    <div className="text-3xl font-bold float-left mr-2 leading-none text-purple-900 font-serif">
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

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black uppercase tracking-wider">
                <FileText size={14} className="text-indigo-600" />
                <span>Automated Typesetting &amp; Gutters</span>
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
                  <span><strong>16 Industry Trim Presets:</strong> 5″×8″, 5.5″×8.5″, 6″×9″, 8.5″×11″, and square formats.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* MODULE 3: FULL WRAP COVER DESIGNER */}
        {(activeCategory === 'all' || activeCategory === 'covers') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
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
                  <span><strong>Barcode &amp; Price Safe Zone:</strong> Automatic compliance with Amazon KDP barcode placement box.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-rose-600 shrink-0" />
                  <span><strong>Full 300 DPI High-Res PDF:</strong> Ready for immediate upload without pixelation warnings.</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6">
              <div className="card-md bg-slate-950 p-4 space-y-3 text-white shadow-xl border border-slate-800">
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
        )}

        {/* MODULE 4: PUZZLE & ACTIVITY BOOK ENGINE */}
        {(activeCategory === 'all' || activeCategory === 'puzzles') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="card-md bg-white p-6 space-y-4 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-bold text-slate-900">
                  <span>Word Search, Sudoku &amp; Mazes</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Answer Keys Included</span>
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

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                <Grid size={14} className="text-emerald-600" />
                <span>Low-Content Publishing Suite</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Automated Puzzle &amp; Activity Book Engine
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
                  <span><strong>Multi-Puzzle Suite:</strong> Word Search, Sudoku, Mazes, Cryptograms, Word Fit, Color by Number.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span><strong>Complete Back-of-Book Solutions:</strong> Formatted 4-up or 6-up solution grids automatically generated.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* MODULE 5: ARC READER LOUNGE & DISCOVERY PORTAL (NEW) */}
        {(activeCategory === 'all' || activeCategory === 'marketing') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider">
                <Users size={14} className="text-purple-600" />
                <span>100% KDP &amp; FTC Compliant</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight font-display">
                ARC Reader Lounge &amp; <span className="font-serif italic font-normal text-purple-600">Advance Copy Portal</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Connect directly with avid readers eager to discover early books in your genre. Authors launch controlled Advance Review Copy (ARC) campaigns with slot limits, while readers download proofs with automatic FTC disclosure copying.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-700">
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                  <span><strong>Zero Direct Review Swaps:</strong> Completely compliant with Amazon anti-manipulation policies.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                  <span><strong>1-Click FTC Disclosure Copying:</strong> Pre-formats required voluntary review statements.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                  <span><strong>Controlled Slot Caps:</strong> Set 25, 50, or 100 review copy limits with anti-piracy watermarking.</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6">
              <div className="card-md bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-6 space-y-4 shadow-xl border border-purple-500/30">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                  <span className="font-bold text-purple-300">Active ARC Campaign</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-400/30">
                    23 / 50 Claimed
                  </span>
                </div>
                <div className="space-y-2 bg-slate-900/80 p-4 rounded-xl border border-white/10 text-xs">
                  <div className="font-bold text-white text-sm">Echoes of the Obsidian Throne</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Epic Romantasy • 380 Pages • EPUB &amp; PDF Proof Copies
                  </p>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full w-[46%]" />
                  </div>
                </div>
                <div className="p-3 bg-purple-950/60 rounded-xl border border-purple-800/40 text-[11px] text-purple-200">
                  <strong>Compliant Disclaimer Included:</strong> "I received an Advance Review Copy from KDP Studio and am leaving this review voluntarily."
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 6: NEWSLETTER CROSS-PROMOTION SWAP HUB (NEW) */}
        {(activeCategory === 'all' || activeCategory === 'marketing') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="card-md bg-white p-6 space-y-4 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-bold text-slate-900">
                  <span>Author Newsletter Cross-Promo</span>
                  <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">Tracking Active</span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Your Feature: The Assertive Mindset</span>
                      <span className="text-emerald-600 font-mono">+142 Clicks</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Scheduled for Sept 15 in Author Jane's Newsletter (1,200 Subs)</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>You Feature: The Habit Engine</span>
                      <span className="text-purple-600 font-mono">+98 Clicks</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Scheduled for Sept 22 in Your Newsletter (850 Subs)</p>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-400 text-center">
                  Tracking Link: kdpstudio-aio.web.app/go/trk-a-8f2e
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black uppercase tracking-wider">
                <Share2 size={14} className="text-indigo-600" />
                <span>StoryOrigin &amp; BookFunnel Style</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Newsletter Cross-Promotion Swap Hub
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Supercharge your Amazon sales rank (BSR) through peer newsletter swaps. Partner with authors writing in the same genre to feature each other's books on designated mailing dates.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-700">
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />
                  <span><strong>Generates Verified Purchase Reviews:</strong> Real subscribers buy directly on Amazon.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />
                  <span><strong>Attribution Click Tracking:</strong> High-speed 302 redirects track exact click volumes.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />
                  <span><strong>Genre Matchmaking:</strong> Filter peers by list size and genre alignment.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* MODULE 7: ENTERPRISE MANUSCRIPT IMPORTER (NEW) */}
        {(activeCategory === 'all' || activeCategory === 'security') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                <UploadCloud size={14} className="text-emerald-600" />
                <span>Multi-Format Importer</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight font-display">
                Intelligent Manuscript Importer &amp; <span className="font-serif italic font-normal text-emerald-700">Chapter Splitter</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Already have a finished book in Word or Scrivener? Import `.docx`, `.epub`, `.md`, or `.txt` files directly into KDP Studio. Our structural parser auto-detects Roman numerals, named chapters, front matter, and rich GFM tables.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-700">
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span><strong>Preserves Rich Formatting:</strong> Retains tables, exercise checklists, bold, italics, and scene breaks.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span><strong>Flexible Import Strategies:</strong> Choose to replace existing chapters or append new ones.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span><strong>Batch Selection &amp; Rollback:</strong> Inspect, reorder, or bulk-delete chapters before committing.</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6">
              <div className="card-md bg-white p-6 space-y-4 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <FileCode size={16} className="text-emerald-600" />
                    <span>Parsed Manuscript Chapters</span>
                  </div>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                    14 Chapters Detected
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {['Chapter 1: The First Step', 'Chapter 2: The Rising Action', 'Chapter 3: The Crossroads', 'Chapter 4: The Climax'].map((title, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-600" />
                        <span className="font-semibold text-slate-800">{title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">1,420 words</span>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 text-center font-medium">
                  Supports Microsoft Word (.docx), EPUB (.epub), Markdown (.md), and TXT (.txt)
                </div>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. AUTHOR INTELLECTUAL PROPERTY & SECURITY SHIELD
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-slate-50 border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <AuthorIpShieldBanner />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. EXPANDED FEATURE COMPARISON MATRIX
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
              Why Creators Choose KDP Studio Over <br className="hidden sm:inline" />
              <span className="font-serif italic font-normal text-purple-600">Fragmented Subscriptions</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Authors spend over $700 every year buying separate tools for writing, formatting, covers, puzzles, and promotion. See how KDP Studio consolidates them all.
            </p>
          </div>

          <div className="card-md bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-slate-900 text-white p-4 sm:p-5 text-xs sm:text-sm font-bold">
              <div>Publishing Capability</div>
              <div className="text-purple-400 text-center">KDP Studio Suite</div>
              <div className="text-slate-400 text-center">Fragmented Tools (Atticus, Vellum, BookFunnel)</div>
            </div>

            {[
              { cap: 'Manuscript Generation (Claude AI)', studio: 'Included (Outlines & Chapters)', trad: 'Weeks of writing or $2,000 ghostwriter' },
              { cap: 'KDP Margin & Gutter Math', studio: 'Automated 100% Gutter Safe', trad: 'Manual Adobe InDesign math' },
              { cap: '300 DPI Wrap Cover & Spine', studio: 'Calculated from Page Count', trad: '$300-$800 Freelance Designer' },
              { cap: 'Puzzle & Activity Book Suite', studio: 'Built-in 1-Click Generator', trad: 'BookBolt ($240/year)' },
              { cap: 'ARC Reader Discovery Lounge', studio: 'Included (Compliant reader claims)', trad: 'Separate ARC platforms ($100+/yr)' },
              { cap: 'Newsletter Cross-Promotions', studio: 'Included (Attribution click tracking)', trad: 'StoryOrigin / BookFunnel ($100-$300/yr)' },
              { cap: 'Word (.docx) & EPUB Importer', studio: 'Included with Chapter Detection', trad: 'Atticus ($147) or Vellum ($249)' },
              { cap: 'Author IP & Privacy Guarantee', studio: 'Zero AI Training on Manuscripts', trad: 'Often unspecified by AI tools' },
              { cap: 'Royalties & Copyrights', studio: '100% Yours Forever', trad: 'Often split with agencies' },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-3 p-4 sm:p-4.5 text-xs sm:text-sm items-center border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}>
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
              className="btn-md-cta px-10 py-3.5 inline-flex items-center gap-2"
            >
              <span>{user ? 'Open Studio Dashboard' : 'Get Started Free with KDP Studio'}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
