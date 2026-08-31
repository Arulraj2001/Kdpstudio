'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  BookOpen, 
  FileCheck, 
  Layers, 
  Gift, 
  Download, 
  Palette, 
  Search, 
  FileText, 
  BadgeCheck, 
  ChevronDown, 
  ChevronUp, 
  Grid, 
  TrendingUp, 
  Cpu, 
  CheckCircle2, 
  FolderArchive,
  SlidersHorizontal
} from 'lucide-react';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { useGeoStore } from '../../lib/geoStore';
import { formatPrice } from '../../lib/geo';
import { getLivePlanLimits, getLiveFeatureAccess } from '../../lib/planLimits';
import { SEOHead } from '../seo/SEOHead';
import { JsonLd } from '../seo/JsonLd';

interface HomePageViewProps {
  onNavigate: (route: PageRoute) => void;
}

const SOFTWARE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "KDP Studio",
  "description": "All-in-one Amazon KDP self-publishing platform. AI writing studio, print interior formatter, wrap cover generator, and low-content puzzle creator.",
  "url": "https://kdpstudio-aio.web.app",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "AI Book Writer (Gemini 2.0)",
    "Print Interior Formatter with Bleed & Gutters",
    "Spine-Calculated Wrap Cover Designer",
    "Puzzle & Coloring Book Generator",
    "Amazon KDP 7-Keyword SEO Optimizer"
  ]
};

const HOWTO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Create and Publish an Amazon KDP Book with AI",
  "description": "Step-by-step workflow to research, write, format, and publish a print-ready book on Amazon KDP with KDP Studio.",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Pick Your Book Format & Niche",
      "text": "Select from Fiction, Nonfiction, Word Search, Sudoku, Coloring, or Planners with market research."
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Generate Chapter Outline & Manuscript",
      "text": "Draft structured chapters with consistent author voice powered by Google Gemini 2.0."
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Design Spine-Calculated Wrap Cover",
      "text": "Generate print-ready 300 DPI full-wrap cover with calculated spine width and barcode safe zone."
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Export KDP-Compliant Package",
      "text": "Download print-ready PDF interior, wrap cover, 7 Amazon keywords, and BISAC category list."
    }
  ]
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is there really a free plan?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! The free plan includes active book projects, daily AI generation credits, puzzle generation, and print formatting tools. No credit card required."
      }
    },
    {
      "@type": "Question",
      "name": "Are exports 100% compliant with Amazon KDP print requirements?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. All interiors and wrap covers include calculated gutters, 0.125 inch bleed zones, 300 DPI resolution, and barcode safe areas to guarantee zero Amazon print rejections."
      }
    },
    {
      "@type": "Question",
      "name": "Who owns the rights and royalties to created books?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You own 100% of all copyrights, manuscripts, covers, and royalties. KDP Studio takes 0% commission."
      }
    },
    {
      "@type": "Question",
      "name": "Can I generate puzzle books and coloring books?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! KDP Studio includes a built-in generator for Word Search, Sudoku, Word Fit, Color by Number, and High-Resolution Coloring Books with complete answer keys."
      }
    }
  ]
};

export const HomePageView: React.FC<HomePageViewProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const { currency, getFormattedPrice, initPricingListener, fetchPricing } = useGeoStore();
  const [ideaInput, setIdeaInput] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Initialize and refresh dynamic pricing on mount
  useEffect(() => {
    initPricingListener?.();
    fetchPricing?.();
  }, [initPricingListener, fetchPricing]);

  const handleStart = () => {
    if (user) {
      onNavigate('dashboard');
    } else {
      onNavigate('signup');
    }
  };

  const handleIdeaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ideaInput.trim()) {
      try {
        sessionStorage.setItem('kdp_seed_idea', ideaInput.trim());
      } catch {}
    }
    handleStart();
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const freeLimits = getLivePlanLimits('free');

  // Real Photographic Books Built with KDP Studio
  const flagshipBooks = [
    {
      id: 'fiction',
      title: 'High Plains Mercy',
      subtitle: 'A Modern Western Mystery',
      genre: 'Fiction / Mystery',
      pages: '390 pages',
      trim: '7″ × 10″ Paperback Wrap',
      quality: '100/100',
      description: 'A 390-page modern western thriller with a complete 18-chapter plotted arc, voice-consistent prose, and spine-calculated wrap.',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    },
    {
      id: 'nonfiction',
      title: 'Digital Boundaries',
      subtitle: 'For Remote & Hybrid Leaders',
      genre: 'Nonfiction Framework',
      pages: '174 pages',
      trim: '5.5″ × 8.5″ Digest',
      quality: '99/100',
      description: 'Actionable productivity masterclass with chaptered framework summary boxes, shutdown rituals, and typeset running headers.',
      imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200'
    },
    {
      id: 'cookbook',
      title: 'The Artisanal Sourdough',
      subtitle: '85 Heritage Flour Formulas',
      genre: 'Cookbook & Culinary',
      pages: '182 pages',
      trim: '8.25″ × 11″ Gloss',
      quality: '98/100',
      description: '85 structured recipe spreads with ingredient tables, step-by-step methods, and glossy full-color paperback spread.',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      badgeColor: 'text-orange-700 bg-orange-50 border-orange-200'
    },
    {
      id: 'wordsearch',
      title: 'True Crime Word Search',
      subtitle: '100 Themed Puzzles',
      genre: 'Activity / Puzzles',
      pages: '140 pages',
      trim: '8.5″ × 11″ Large Print',
      quality: '100/100',
      description: '100 large-print crime-themed word searches with theme-pure word banks, calculated gutters, and complete answer keys.',
      imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200'
    },
    {
      id: 'coloring',
      title: 'Mindful Forest Mandalas',
      subtitle: '60 Vector Line Illustrations',
      genre: 'Adult Coloring Book',
      pages: '124 pages',
      trim: '8.5″ × 11″ Premium',
      quality: '97/100',
      description: '60 crisp 300 DPI vector line-art pages with single-sided bleed protection and print-ready PDF export.',
      imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    }
  ];

  // 12 Showcase Genre Book Covers for Infinite Marquee
  const marqueeCovers = [
    { title: 'The Midnight Antiquarian', genre: 'Gothic Thriller', pages: '340p', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80' },
    { title: 'Atomic Focus Framework', genre: 'Nonfiction Guide', pages: '180p', imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80' },
    { title: 'Artisanal Sourdough Secrets', genre: 'Cookbook', pages: '182p', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80' },
    { title: 'True Crime Word Search', genre: 'Word Search', pages: '140p', imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&q=80' },
    { title: 'Mindful Forest Mandalas', genre: 'Coloring Book', pages: '124p', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80' },
    { title: 'Shadows Over Oxford', genre: 'Dark Academia', pages: '310p', imageUrl: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=600&q=80' },
    { title: 'The 90-Day Author Planner', genre: 'Journal', pages: '200p', imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=600&q=80' },
    { title: 'Quantum Horizons 2088', genre: 'Sci-Fi Novel', pages: '410p', imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80' },
    { title: 'Little Star Bedtime Tales', genre: "Children's Book", pages: '48p', imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80' },
    { title: 'Calm Senior Sudoku 300', genre: 'Sudoku Book', pages: '160p', imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80' },
    { title: 'Letters to the Rose Garden', genre: 'Romance Novel', pages: '290p', imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80' },
    { title: 'SaaS Bootstrapping Bible', genre: 'Business Book', pages: '220p', imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80' },
  ];

  return (
    <div className="w-full bg-white text-slate-900 font-sans selection:bg-purple-600 selection:text-white">
      {/* SEO Head & JSON-LD Structured Data */}
      <SEOHead
        pageKey="home"
        title="KDP Studio — The Complete AI Self-Publishing Studio for Amazon KDP"
        description="From blank idea to upload-ready Amazon KDP book. Write manuscripts with Gemini 2.0, generate 300 DPI wrap covers, format print interiors, and build puzzle books. Free plan available."
        canonicalPath="/"
        languages={{ en: '/', 'x-default': '/' }}
      />
      <JsonLd id="jsonld-software" data={SOFTWARE_SCHEMA} />
      <JsonLd id="jsonld-howto" data={HOWTO_SCHEMA} />
      <JsonLd id="jsonld-faq" data={FAQ_SCHEMA} />

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HERO SECTION (Tighter Vertical Spacing + Ambient Glow + Interactive Prompt)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-8 pb-12 sm:pt-12 sm:pb-16">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Subtle CSS Grid Background */}
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

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold backdrop-blur-md shadow-lg shadow-emerald-950/40">
            <BadgeCheck size={15} className="text-emerald-400" />
            <span>Official Amazon KDP Publishing Suite • 100% Bleed & Gutter Compliant</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] max-w-4xl mx-auto">
            From Idea to Upload-Ready Book — <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-purple-300 via-violet-200 to-indigo-300 bg-clip-text text-transparent">
              The Complete AI Studio
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Create your manuscript, typeset print interiors, generate spine-calculated 300 DPI wrap covers, and download a complete KDP publishing package in minutes.
          </p>

          {/* ── Interactive 60-Second "Try Your Idea" Input Box ── */}
          <div className="max-w-2xl mx-auto pt-1">
            <form 
              onSubmit={handleIdeaSubmit}
              className="flex flex-col sm:flex-row items-stretch gap-2 p-1.5 rounded-2xl bg-white/[0.07] border border-white/[0.18] backdrop-blur-md shadow-2xl shadow-purple-950/60 focus-within:border-purple-400 transition-all"
            >
              <div className="flex items-center flex-1 min-w-0 px-3">
                <Sparkles size={18} className="text-purple-400 shrink-0 mr-2.5 animate-pulse" />
                <input
                  type="text"
                  maxLength={140}
                  value={ideaInput}
                  onChange={(e) => setIdeaInput(e.target.value)}
                  placeholder="Type your book idea… e.g. 50 Calming Sudoku Puzzles for Seniors"
                  className="w-full bg-transparent text-white placeholder:text-slate-400 text-xs sm:text-sm py-2.5 outline-none"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95"
              >
                <span>Try It Free</span>
                <ArrowRight size={15} />
              </button>
            </form>
            <p className="mt-2 text-[11px] text-slate-400">
              Get an instant preview concept in about 60 seconds — no credit card required.
            </p>
          </div>

          {/* Trust Value Props */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-1 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-1.5">
              <Gift size={15} className="text-emerald-400" />
              <span><strong>{freeLimits.daily.aiGenerations} daily AI credits</strong> included free</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-400" />
              <span>100% Royalties & Copyright Ownership</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileCheck size={15} className="text-emerald-400" />
              <span>Guaranteed Zero Bleed Rejections</span>
            </div>
          </div>

          {/* ── 3D Hero Product Composite Preview ── */}
          <div className="pt-6 max-w-5xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/80 border border-white/15 bg-slate-900/90 p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                
                {/* Left: Open Interior Spread */}
                <div className="md:col-span-7 rounded-2xl overflow-hidden shadow-lg border border-white/10 relative group">
                  <img
                    src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80"
                    alt="Open book interior formatting spread with drop caps"
                    className="w-full h-56 sm:h-72 object-cover rounded-2xl transition-transform duration-500 group-hover:scale-103"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-4 text-left">
                    <span className="text-[10px] font-mono uppercase font-bold text-purple-300">
                      Typeset Interior PDF
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      Drop caps, chapter fleurons & mathematically calculated 0.750″ binding gutters
                    </span>
                  </div>
                </div>

                {/* Right: Spine-Calculated Wrap Cover */}
                <div className="md:col-span-5 rounded-2xl overflow-hidden shadow-lg border border-white/10 relative group">
                  <img
                    src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80"
                    alt="Print ready paperback wrap book cover"
                    className="w-full h-56 sm:h-72 object-cover rounded-2xl transition-transform duration-500 group-hover:scale-103"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-4 text-left">
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-300">
                      300 DPI Wrap Cover
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      Front artwork, calculated spine width & barcode safe zone
                    </span>
                  </div>
                </div>

              </div>

              {/* Floating Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4 text-[11px] font-bold">
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  ✓ 0.125″ Bleed Safe
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  ✓ 300 DPI High-Res PDF
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  ✓ Google Gemini 2.0 Core
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  ✓ Amazon 7-Keywords Included
                </span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. REAL BOOK PROOF: "Books We Actually Built With KDP Studio"
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black uppercase tracking-wider">
              <BadgeCheck size={14} className="text-emerald-600" />
              <span>Real Builds, Not Generic Mockups</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Books We Actually Built With It
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Every book below was produced end-to-end inside KDP Studio — manuscript, formatted interior PDF, and spine-calculated wrap cover — passing our 100-point Amazon KDP pre-flight audit.
            </p>
          </div>

          {/* Flagship Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flagshipBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl hover:border-purple-300 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                    <img
                      src={book.imageUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md ${book.badgeColor}`}>
                        {book.genre}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                        Quality {book.quality}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-2">
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs font-semibold text-purple-600">
                      {book.subtitle}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {book.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 mt-2 text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-purple-600" />
                  <span>{book.pages} • {book.trim}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={handleStart}
              className="px-7 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Build Your Own Book Now</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. INFINITE GENRE COVER MARQUEE (12+ Real Covers with Hover Lift)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-950 text-white overflow-hidden relative">
        <div className="max-w-4xl mx-auto px-4 text-center mb-8 space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Covers That Look Like You Hired a Top Agency
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Genre-aware artwork, clean typography, and precise spine calculations for every trim size and page count.
          </p>
        </div>

        {/* Scrolling Marquee Container */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee gap-6 py-4">
            {[...marqueeCovers, ...marqueeCovers].map((cover, idx) => (
              <div
                key={idx}
                className="w-44 sm:w-52 shrink-0 group select-none transition-all duration-300 hover:-translate-y-2 cursor-pointer"
                onClick={handleStart}
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 book-shadow flex flex-col justify-between">
                  <img
                    src={cover.imageUrl}
                    alt={cover.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="book-spine-highlight" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-3 flex flex-col justify-between text-white">
                    <div className="text-[9px] font-black uppercase tracking-wider text-purple-300">
                      {cover.genre}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black leading-tight text-white">
                        {cover.title}
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-300 pt-1.5 border-t border-white/15 mt-1">
                        <span>{cover.pages}</span>
                        <span>300 DPI</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs font-bold text-slate-300 mt-2.5 group-hover:text-purple-400 transition-colors">
                  {cover.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. THE COMPLETE PUBLISHING PACKAGE (1-Click Exploded ZIP View)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 border border-purple-300 text-purple-800 text-xs font-black uppercase tracking-wider">
              <FolderArchive size={14} className="text-purple-600" />
              <span>1-Click Ready to Upload</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Everything You Need to Publish — In One ZIP
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
              You don't just get a raw text file. You get a professionally formatted, pre-flight audited publishing bundle ready for instant Amazon KDP upload.
            </p>
          </div>

          {/* Exploded Package Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Interior PDF */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 hover:border-purple-400 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <FileText size={22} />
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-[10px] font-mono font-black">
                  PDF • 300 DPI
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">1. Print-Ready Interior PDF</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ornamental chapter headings, drop caps, header/footer running heads, and mathematically calculated gutter margins to prevent text swallowing in binding.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold text-purple-800 border-t border-slate-200/70">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">0.125″ Bleed Safe</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">KDP Gutter Math</span>
              </div>
            </div>

            {/* 2. Wrap Cover Spread */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 hover:border-indigo-400 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Palette size={22} />
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-[10px] font-mono font-black">
                  WRAP PDF • CMYK
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">2. Spine-Calculated Wrap Cover</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Full spread PDF including front artwork, back cover marketing blurb, barcode safe zone, and exact spine width calculated from your page count and paper type.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold text-indigo-800 border-t border-slate-200/70">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">300 DPI High-Res</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">Barcode Safe Zone</span>
              </div>
            </div>

            {/* 3. SEO & 7 Keywords */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 hover:border-emerald-400 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Search size={22} />
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-mono font-black">
                  TXT & HTML
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">3. Amazon 7-Keyword Strategy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  High-intent keyword strings tailored for Amazon search algorithms, 3 primary/secondary BISAC categories, and formatted HTML book description ready to paste.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold text-emerald-800 border-t border-slate-200/70">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">7 Keyword Strings</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">BISAC Categories</span>
              </div>
            </div>

            {/* 4. Kindle ePub */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 hover:border-amber-400 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <BookOpen size={22} />
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-mono font-black">
                  EPUB 3.0
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">4. Kindle Reflowable ePub</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Validated ePub eBook package ready for Kindle Direct Publishing with working Table of Contents, responsive images, and typography tags.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold text-amber-800 border-t border-slate-200/70">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">Reflowable Layout</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">Kindle Tested</span>
              </div>
            </div>

            {/* 5. Pre-flight Quality Audit */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 hover:border-rose-400 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <ShieldCheck size={22} />
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-mono font-black">
                  100/100 AUDIT
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">5. KDP Pre-Flight Quality Audit</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automated checks against Amazon print guidelines: font embedding verification, minimum margin clearances, bleed validation, and image compression checks.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold text-rose-800 border-t border-slate-200/70">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">100-Point Audit</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">Zero Rejections</span>
              </div>
            </div>

            {/* 6. Instant ZIP Download */}
            <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 p-6 rounded-3xl text-white space-y-4 flex flex-col justify-between shadow-xl border border-purple-500/30">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-600/30">
                  <Download size={22} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">6. One-Click ZIP Download</h3>
                <p className="text-xs text-purple-200 leading-relaxed">
                  All production assets organized into structured folders with an upload checklist to guide you through your Amazon KDP dashboard in 5 minutes.
                </p>
              </div>
              <button
                onClick={handleStart}
                className="w-full py-3 rounded-xl bg-white text-slate-950 hover:bg-purple-50 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Download Sample Package</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. SIX STEPS FROM IDEA TO PUBLISHED BOOK (Redesigned Interactive Workflow)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-800 text-xs font-black uppercase tracking-wider">
              <SlidersHorizontal size={14} className="text-indigo-600" />
              <span>Studio Pipeline</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Six Steps From Idea to Published Book
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
              You don't need publishing experience. Follow the guided step-by-step studio workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                num: '01', 
                icon: Grid,
                title: 'Pick Your Book Format', 
                desc: 'Select from Fiction, Nonfiction, Word Search, Sudoku, Coloring Books, or Planners — each with specialized layout workflows and trim defaults.',
                badge: 'Format Selection'
              },
              { 
                num: '02', 
                icon: TrendingUp,
                title: 'AI Niche & Market Research', 
                desc: 'Discover profitable Amazon KDP keywords, analyze competitor sales ranks, and identify audience demand before writing a single word.',
                badge: 'Demand Analysis'
              },
              { 
                num: '03', 
                icon: Cpu,
                title: 'Generate Manuscript & Interior', 
                desc: 'Draft chapter outlines and full manuscript sections with voice-consistent Gemini 2.0 AI. Edit, refine, and lock chapters seamlessly.',
                badge: 'Gemini 2.0 Core'
              },
              { 
                num: '04', 
                icon: Palette,
                title: 'Design 300 DPI Wrap Cover', 
                desc: 'Generate genre-aware artwork with exact spine thickness math (pages × 0.002252″), crisp typography, and full paperback wrap spread.',
                badge: 'Spine Math'
              },
              { 
                num: '05', 
                icon: ShieldCheck,
                title: 'Pre-Flight Quality Audit', 
                desc: 'Run automated compliance verification across 100 checkpoints to guarantee zero margin, gutter, or bleed rejections on Amazon KDP print presses.',
                badge: '100% Zero-Reject'
              },
              { 
                num: '06', 
                icon: FolderArchive,
                title: 'Download & Publish', 
                desc: 'Download your full upload-ready ZIP and upload directly to Amazon KDP, keeping 100% of all royalties with zero publisher commissions.',
                badge: '100% Royalties'
              },
            ].map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-lg hover:border-purple-300 transition-all duration-300 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-black text-xs flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                        {step.num}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {step.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <StepIcon size={18} className="text-purple-600 shrink-0" />
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                        {step.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-purple-600 transition-colors">
                    <span>Guided Studio Stage {step.num}</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => onNavigate('features')}
              className="px-8 py-3.5 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
            >
              <span>Explore All Studio Features in Depth</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. PRICING PREVIEW (Connected to Live Firestore Limits)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Start Free, Scale as You Publish
            </h2>
            <p className="text-sm text-slate-600">
              No hidden fees. 100% royalty ownership. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Free */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col justify-between shadow-xs space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xl">Free Tier</h3>
                  <span className="text-2xl">🌱</span>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-black text-slate-900">
                    {formatPrice(0, currency)}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Free forever, no credit card required</p>
                </div>
                <ul className="space-y-3 text-xs text-slate-700 font-semibold pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span><strong>{freeLimits.total.bookProjects}</strong> Active Book Projects</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span><strong>{freeLimits.daily.aiGenerations}</strong> Daily AI Generation Runs</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span><strong>{freeLimits.daily.pdfExports}</strong> Daily PDF Exports</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span><strong>{freeLimits.daily.puzzleGenerations}</strong> Daily Puzzle & Activity Generations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>Spine Width & Gutter Calculator</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleStart}
                className="w-full py-3.5 rounded-2xl border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold text-sm transition-all cursor-pointer"
              >
                Start Free
              </button>
            </div>

            {/* Pro (Most Popular) */}
            <div className="bg-slate-950 text-white rounded-3xl border-2 border-purple-500 p-8 flex flex-col justify-between shadow-2xl shadow-purple-950/50 space-y-6 relative scale-103">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-[11px] px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                Most Popular
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-xl">Pro Plan</h3>
                  <span className="text-2xl">⚡</span>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-black text-white">
                    {getFormattedPrice('pro')}
                    <span className="text-sm font-normal text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-purple-300 font-medium">For serious indie authors & publishers</p>
                </div>
                <ul className="space-y-3 text-xs text-slate-200 font-semibold pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-purple-400 shrink-0" />
                    <span><strong>Unlimited</strong> Book Projects</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-purple-400 shrink-0" />
                    <span><strong>Unlimited</strong> AI Writing with Gemini 2.0</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-purple-400 shrink-0" />
                    <span><strong>Google Imagen 3</strong> AI Cover Art</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-purple-400 shrink-0" />
                    <span>Amazon Niche & Keyword Analysis</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-purple-400 shrink-0" />
                    <span>100% Unbranded 300 DPI PDF Exports</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onNavigate('pricing')}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/40 transition-all cursor-pointer"
              >
                Start with Pro
              </button>
            </div>

            {/* Agency */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col justify-between shadow-xs space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xl">Agency Plan</h3>
                  <span className="text-2xl">🚀</span>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-black text-slate-900">
                    {getFormattedPrice('agency')}
                    <span className="text-sm font-normal text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">For publishing teams & high volume</p>
                </div>
                <ul className="space-y-3 text-xs text-slate-700 font-semibold pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>Everything in Pro Unlimited</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span><strong>5 Team Member Seats</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>Bulk Batch Series Generator</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>Brand Kit & Shared Style Guide</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>Dedicated VIP Account Manager</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onNavigate('pricing')}
                className="w-full py-3.5 rounded-2xl border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold text-sm transition-all cursor-pointer"
              >
                View Full Pricing
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          7. FAQ ACCORDION
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Got questions about publishing with KDP Studio?
          </p>
        </div>

        <div className="space-y-3">
          {[
            { q: 'Is there really a free plan?', a: 'Yes! The free plan includes active book projects, daily AI generation credits, puzzle generation, and print formatting tools with zero credit card required.' },
            { q: 'Are exports 100% compliant with Amazon KDP print requirements?', a: 'Yes. All interiors and wrap covers include calculated gutters, 0.125 inch bleed zones, 300 DPI resolution, and barcode safe areas to guarantee zero Amazon print rejections.' },
            { q: 'Who owns the rights and royalties to created books?', a: 'You own 100% of all copyrights, manuscripts, covers, and royalties. KDP Studio takes 0% commission.' },
            { q: 'Can I generate puzzle books and coloring books?', a: 'Yes! KDP Studio includes a built-in generator for Word Search, Sudoku, Word Fit, Color by Number, and High-Resolution Coloring Books with complete answer keys.' },
          ].map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 text-left font-bold text-sm sm:text-base text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} className="text-purple-600 shrink-0" /> : <ChevronDown size={18} className="text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          8. FINAL CALL TO ACTION BANNER
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 text-white py-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ready to Publish Your Next Book?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Join authors, publishers, and creators creating books with KDP Studio. Start with free credits today.
          </p>
          <div className="pt-2">
            <button
              onClick={handleStart}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-purple-600/30 transition-all cursor-pointer inline-flex items-center gap-2.5 active:scale-95"
            >
              <span>{user ? 'Open Studio Dashboard' : 'Start Publishing Free'}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
