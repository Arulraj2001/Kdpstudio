'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  Star, 
  ChevronDown, 
  ShieldCheck,
  CheckCircle2
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
  "description": "All-in-one Amazon KDP publishing platform. AI writing studio, print interior formatter, cover generator, and low-content puzzle creator.",
  "url": "https://kdpstudio-aio.web.app",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "AI Book Writer",
    "Interior Formatter",
    "Cover Designer",
    "KDP Metadata Optimizer"
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
        "text": "Yes. The free plan includes 1 active book project, 3 AI generations per day, and basic formatting tools. No credit card is needed to sign up."
      }
    },
    {
      "@type": "Question",
      "name": "Can I publish on Amazon KDP with this?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. All exports are KDP-ready PDFs with calculated gutters, margins, and 300 DPI covers that upload directly to Amazon KDP without additional formatting."
      }
    },
    {
      "@type": "Question",
      "name": "What AI powers KDP Studio?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Google Gemini 2.0 powers manuscript writing, outline generation, and niche research, while Google Imagen 3 generates cover art and coloring book illustrations."
      }
    }
  ]
};

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "KDP Studio",
  "url": "https://kdpstudio-aio.web.app",
  "logo": "https://kdpstudio-aio.web.app/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@kdpstudio.com"
  },
  "sameAs": [
    "https://twitter.com/kdpstudio",
    "https://linkedin.com/company/kdpstudio"
  ]
};

export const HomePageView: React.FC<HomePageViewProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const { currency, getFormattedPrice, initPricingListener, fetchPricing } = useGeoStore();
  const [activeBookTab, setActiveBookTab] = useState<'non-fiction' | 'childrens' | 'coloring' | 'puzzle'>('non-fiction');
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

  const handleScrollTo = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div className="w-full bg-white text-slate-900 font-sans selection:bg-purple-500 selection:text-white">
      {/* SEO Head & JSON-LD Structured Data */}
      <SEOHead
        title="KDP Studio — Create & Publish KDP Books with AI"
        description="The complete AI publishing suite for Amazon KDP. Write books, format interiors, design covers, and optimize metadata. Free plan available."
        canonicalPath="/"
        languages={{
          en: '/',
          'x-default': '/',
        }}
      />
      <JsonLd id="jsonld-software" data={SOFTWARE_SCHEMA} />
      <JsonLd id="jsonld-faq" data={FAQ_SCHEMA} />
      <JsonLd id="jsonld-org" data={ORGANIZATION_SCHEMA} />

      
      {/* ─────────────────────────────────────────────────────────────────────────────
          STEP 2: HERO SECTION (Dark Gradient + Grid + Floating Preview)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f0f1a] via-[#1a1638] to-[#0f0f1a] text-white pt-20 pb-28 sm:pt-28 sm:pb-36">
        {/* Subtle CSS Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Badge: Powered by Google Gemini AI */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300 text-xs sm:text-sm font-semibold backdrop-blur-md shadow-lg shadow-purple-950/50 hover:border-purple-400 transition-colors">
            <Sparkles size={14} className="text-purple-400" />
            <span>✨ Powered by Google Gemini AI</span>
          </div>

          {/* Headline (Split White + Purple/Indigo Gradient) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Publish KDP Books <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
              Faster Than Ever
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Write with AI, format for print, design covers, and optimize your Amazon listing — all in one tool.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-bold text-base shadow-xl shadow-purple-600/30 hover:shadow-purple-500/50 transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>{user ? 'Go to Dashboard' : 'Start Publishing Free'}</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => handleScrollTo('how-it-works')}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-base border border-white/20 hover:border-white/40 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>See How It Works</span>
              <span>→</span>
            </button>
          </div>

          {/* Trust line below buttons */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-400" /> Free plan available
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-400" /> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-400" /> Cancel anytime
            </span>
          </div>

          {/* Social Proof Stats */}
          <div className="pt-6 border-t border-white/10 max-w-2xl mx-auto flex items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-semibold text-slate-300">
            <div>
              <span className="text-white font-black text-sm sm:text-base">10,000+</span> Authors
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div>
              <span className="text-white font-black text-sm sm:text-base">50,000+</span> Books Created
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-1">
              <span className="text-amber-400">4.9★</span> Rating
            </div>
          </div>

          {/* High-Fidelity Floating Dashboard Preview Card */}
          <div className="pt-10 sm:pt-14 relative max-w-5xl mx-auto">
            <div className="rounded-3xl p-1.5 bg-gradient-to-b from-purple-500/50 via-indigo-500/30 to-purple-500/10 shadow-2xl shadow-purple-950/80 animate-float">
              <div className="rounded-[22px] bg-[#0c0c16] border border-white/10 overflow-hidden text-left shadow-inner">
                {/* Browser/Window Header */}
                <div className="bg-[#141424] px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-3 text-[11px] font-mono text-slate-400 hidden sm:inline">
                      kdpstudio.io/studio/manuscript-editor
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-purple-900/60 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                      ⚡ Gemini 2.0 Active
                    </span>
                  </div>
                </div>

                {/* Dashboard Workspace Mockup Body */}
                <div className="grid grid-cols-12 min-h-[380px] sm:min-h-[460px] text-xs">
                  {/* Left Sidebar Mockup */}
                  <div className="hidden sm:block sm:col-span-3 bg-[#111122] border-r border-white/10 p-4 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                      <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                        📚
                      </div>
                      <span className="font-bold text-white truncate text-xs">Mindful Living 101</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chapters</div>
                      <div className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 font-medium">
                        1. The Morning Ritual
                      </div>
                      <div className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:bg-white/5 font-medium">
                        2. Cultivating Presence
                      </div>
                      <div className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:bg-white/5 font-medium">
                        3. Digital Detox Habits
                      </div>
                      <div className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:bg-white/5 font-medium">
                        4. Evening Reflection
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-2">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Export Settings</div>
                      <div className="flex items-center justify-between text-slate-300 text-[11px]">
                        <span>Trim Size:</span>
                        <span className="text-purple-400 font-bold">6×9" (Non-Bleed)</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300 text-[11px]">
                        <span>Word Count:</span>
                        <span className="text-emerald-400 font-bold">14,280 words</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Editor Center */}
                  <div className="col-span-12 sm:col-span-6 bg-[#0c0c16] p-5 sm:p-7 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg sm:text-xl font-black text-white">Chapter 1: The Morning Ritual</span>
                        <span className="text-[10px] text-slate-400">Page 1 of 124</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-xs sm:text-sm font-serif">
                        "The way you spend your first sixty minutes sets the emotional trajectory for the entire day. Rather than reaching for a glowing smartphone screen, begin with silence, gratitude, and a deliberate intention..."
                      </p>
                      <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-2.5">
                        <Sparkles size={16} className="text-purple-400 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-purple-200">
                          <strong className="text-purple-300">AI Assistant generated:</strong> 3 practical exercises added to strengthen chapter engagement and reader retention.
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1.5">
                          <Sparkles size={12} />
                          <span>AI Continue Writing</span>
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 font-semibold text-[11px]">
                          Improve Tone
                        </button>
                      </div>
                      <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                        <Check size={12} /> Auto-Saved
                      </span>
                    </div>
                  </div>

                  {/* Right Assistant / KDP Inspector Mockup */}
                  <div className="hidden sm:block sm:col-span-3 bg-[#111122] border-l border-white/10 p-4 space-y-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-400" />
                      <span>KDP Print Inspector</span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-[#17172e] border border-emerald-500/30 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                          <span>Gutter Margin</span>
                          <span>0.375" (Exact)</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Calculated for 124 page count</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#17172e] border border-purple-500/30 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-purple-300">
                          <span>Spine Width</span>
                          <span>0.280"</span>
                        </div>
                        <p className="text-[10px] text-slate-400">White paper standard 50lb</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#17172e] border border-indigo-500/30 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300">
                          <span>300 DPI Cover</span>
                          <span>Ready</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Full wrap PDF with bleed</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={handleStart}
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-[11px] text-center shadow-md shadow-purple-900/30 cursor-pointer"
                      >
                        Export KDP Package →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          STEP 3: SOCIAL PROOF BAR (Clean White, Compact Badges)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Trusted by publishers worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center justify-center text-xs sm:text-sm font-semibold text-slate-700">
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-amber-500">⭐⭐⭐⭐⭐</span>
              <span>4.9/5 (200+ reviews)</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span>📚</span>
              <span>50,000+ books published</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span>🌍</span>
              <span>Publishers in 45+ countries</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span>⚡</span>
              <span>Created in &lt; 20 minutes</span>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          STEP 4: FEATURES SECTION (Alternating 4-Part Layout with CSS Mockups)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider border border-purple-200/60">
              EVERYTHING YOU NEED
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              One Tool. Complete Pipeline.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-normal">
              From blank page to KDP listing — without switching between apps.
            </p>
          </div>

          {/* Feature 1: AI Writing (Text Left, Visual Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="px-3 py-1 rounded-md bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
                AI Writing
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-snug">
                Write Entire Books with AI
              </h3>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Describe your chapter topic and let Google Gemini write it. Or paste your own content. Supports 10+ languages with contextual tone tuning.
              </p>
              <ul className="space-y-3 font-medium text-slate-700 text-sm sm:text-base">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>Chapter-by-chapter AI generation</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>Continue writing from where you left off</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>Select text → improve, shorten, or rewrite</span>
                </li>
              </ul>
              <button 
                onClick={handleStart}
                className="pt-2 text-purple-600 hover:text-purple-700 font-bold text-sm sm:text-base inline-flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Start Writing Free</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Visual: CSS Text Editor Mockup */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-[#0f0f1a] p-6 text-white border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="font-mono text-slate-300">Chapter_2_Draft.kdp</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 font-semibold text-[10px]">
                    AI Active
                  </span>
                </div>
                <div className="bg-[#18182c] rounded-xl p-4 border border-purple-500/30 text-xs text-slate-300 font-serif leading-relaxed">
                  <p className="italic text-purple-300 pb-2">"Prompt: Expand on actionable time-management hacks for entrepreneurs."</p>
                  <p>
                    "1. Time-boxing high-leverage tasks into uninterrupted 90-minute blocks.<br/>
                    2. Conducting weekly energy audits rather than mere hour tracking..."
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-2">
                    <span className="text-[11px] px-2.5 py-1 rounded bg-purple-600 text-white font-bold">AI Write</span>
                    <span className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-300">Rewrite</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">1,842 words</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Interior Formatting (Visual Left, Text Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Visual: CSS Book Spread & Margins */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-2xl bg-slate-900 p-6 text-white border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <span>Interior PDF Preview</span>
                  <span className="text-emerald-400 font-mono font-bold">Gutter: 0.375" | Bleed: 0.125"</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white text-slate-900 rounded-lg p-4 text-[10px] space-y-2 border-2 border-dashed border-indigo-400 relative">
                    <div className="h-2 w-16 bg-slate-300 rounded" />
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-200 rounded" />
                      <div className="h-1.5 w-5/6 bg-slate-200 rounded" />
                      <div className="h-1.5 w-4/6 bg-slate-200 rounded" />
                    </div>
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-slate-400">14</span>
                  </div>
                  <div className="bg-white text-slate-900 rounded-lg p-4 text-[10px] space-y-2 border-2 border-dashed border-indigo-400 relative">
                    <div className="h-2 w-16 bg-slate-300 rounded" />
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-200 rounded" />
                      <div className="h-1.5 w-5/6 bg-slate-200 rounded" />
                      <div className="h-1.5 w-4/6 bg-slate-200 rounded" />
                    </div>
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-slate-400">15</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 text-center">
                  ✅ 100% compliant with Amazon KDP print engine guidelines
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
              <span className="px-3 py-1 rounded-md bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider">
                Interior Formatting
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-snug">
                KDP-Exact Margins, Automatically
              </h3>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Forget the complicated KDP formatting guide. We calculate margins, spine width, and gutter automatically based on your page count and trim size.
              </p>
              <ul className="space-y-3 font-medium text-slate-700 text-sm sm:text-base">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>6 industry standard trim sizes supported</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>Auto-gutter calculated from dynamic page count</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>Print-ready 300 DPI PDF in one click</span>
                </li>
              </ul>
              <button 
                onClick={() => onNavigate(user ? 'formatter' : 'signup')}
                className="pt-2 text-indigo-600 hover:text-indigo-700 font-bold text-sm sm:text-base inline-flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Try the Formatter</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Feature 3: Cover Builder (Text Left, Visual Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="px-3 py-1 rounded-md bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
                Cover Builder
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-snug">
                Design Covers That Sell
              </h3>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Full cover spread builder — front, spine, and back. Auto-calculates spine width with barcode safety margins. Built-in Google Imagen AI creates eye-catching art.
              </p>
              <ul className="space-y-3 font-medium text-slate-700 text-sm sm:text-base">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>Drag-and-drop canvas editor with typography presets</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>AI image generation built in (Google Imagen 3)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>Export at 300 DPI full-bleed print-ready PDF</span>
                </li>
              </ul>
              <button 
                onClick={() => onNavigate(user ? 'cover' : 'signup')}
                className="pt-2 text-purple-600 hover:text-purple-700 font-bold text-sm sm:text-base inline-flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Design a Cover</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Visual: CSS Cover Builder Mockup */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-[#0f0f1a] p-6 text-white border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <span>Cover Spread Preview (Front + Spine + Back)</span>
                  <span className="text-purple-400 font-bold">300 DPI CMYK</span>
                </div>
                <div className="grid grid-cols-12 gap-1 bg-gradient-to-r from-purple-900 via-indigo-900 to-violet-950 rounded-xl p-4 min-h-[160px] border border-purple-500/40 text-center">
                  <div className="col-span-5 border border-white/20 rounded p-2 flex flex-col justify-between text-[9px] text-slate-300">
                    <span>Back Cover Blurb</span>
                    <div className="w-10 h-6 bg-white/30 rounded self-start mt-auto" />
                  </div>
                  <div className="col-span-2 border-x border-white/30 flex items-center justify-center text-[8px] font-bold text-purple-200">
                    <span className="rotate-90 whitespace-nowrap">TITLE • AUTHOR</span>
                  </div>
                  <div className="col-span-5 border border-white/20 rounded p-2 flex flex-col justify-center items-center text-[10px] font-bold text-white">
                    <span className="text-xs font-black">THE ART OF FOCUS</span>
                    <span className="text-[8px] text-purple-300 mt-1">A Masterclass</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Puzzle Books (Visual Left, Text Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Visual: CSS Puzzle Grid */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-2xl bg-slate-900 p-6 text-white border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="font-bold text-purple-400">Word Search #12: Mindfulness</span>
                  <span className="text-slate-400 text-[10px]">15×15 Grid</span>
                </div>
                <div className="grid grid-cols-8 gap-1.5 text-center font-mono text-xs text-slate-300 font-bold bg-[#141426] p-4 rounded-xl border border-white/10">
                  <span className="p-1 rounded bg-purple-600 text-white">P</span>
                  <span className="p-1 rounded bg-purple-600 text-white">E</span>
                  <span className="p-1 rounded bg-purple-600 text-white">A</span>
                  <span className="p-1 rounded bg-purple-600 text-white">C</span>
                  <span className="p-1 rounded bg-purple-600 text-white">E</span>
                  <span className="p-1">K</span>
                  <span className="p-1">L</span>
                  <span className="p-1">M</span>
                  <span className="p-1">B</span>
                  <span className="p-1">R</span>
                  <span className="p-1">E</span>
                  <span className="p-1">A</span>
                  <span className="p-1">T</span>
                  <span className="p-1">H</span>
                  <span className="p-1">E</span>
                  <span className="p-1">O</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>✅ Answer keys auto-generated</span>
                  <span>⚡ 20 batch puzzles ready</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
              <span className="px-3 py-1 rounded-md bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
                Puzzle Books
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-snug">
                Generate Entire Puzzle Books
              </h3>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Word search, coloring books, and word fit puzzles — generate 20+ variations in one batch. The fastest, most profitable low-content KDP publishing niche.
              </p>
              <ul className="space-y-3 font-medium text-slate-700 text-sm sm:text-base">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>AI-generated themed word lists and grids</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>Bulk generation for high-volume publishers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>KDP-ready interior PDF with complete solution index</span>
                </li>
              </ul>
              <button 
                onClick={() => onNavigate(user ? 'puzzles' : 'signup')}
                className="pt-2 text-purple-600 hover:text-purple-700 font-bold text-sm sm:text-base inline-flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Generate Puzzle Books</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          STEP 5: HOW IT WORKS SECTION (Dark #0f0f1a, 3 Steps)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-[#0f0f1a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">
              SIMPLE PUBLISHING PIPELINE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              From Idea to Published <br />
              <span className="text-purple-400">In Three Steps</span>
            </h2>
          </div>

          {/* 3 Step Cards Horizontal Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-[#16162a] rounded-2xl p-8 border border-white/10 space-y-4 relative group hover:border-purple-500/50 transition-all">
              <span className="text-6xl sm:text-7xl font-black text-purple-900/40 absolute top-4 right-6 pointer-events-none group-hover:text-purple-800/40 transition-colors">
                01
              </span>
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xl">
                💡
              </div>
              <h3 className="text-xl font-bold text-white">Describe Your Book</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Tell us the topic, genre, audience, and style. Takes 30 seconds.
              </p>
              <p className="text-xs text-purple-300 font-medium pt-2">
                Works for fiction, non-fiction, coloring books, puzzle books, and more.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#16162a] rounded-2xl p-8 border border-white/10 space-y-4 relative group hover:border-purple-500/50 transition-all">
              <span className="text-6xl sm:text-7xl font-black text-purple-900/40 absolute top-4 right-6 pointer-events-none group-hover:text-purple-800/40 transition-colors">
                02
              </span>
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xl">
                ⚡
              </div>
              <h3 className="text-xl font-bold text-white">AI Builds Everything</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Gemini writes your chapters. Imagen creates illustrations. We format the interior and design the layout.
              </p>
              <p className="text-xs text-purple-300 font-medium pt-2">
                Real-time preview with automated KDP margins & spine calculation.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#16162a] rounded-2xl p-8 border border-white/10 space-y-4 relative group hover:border-purple-500/50 transition-all">
              <span className="text-6xl sm:text-7xl font-black text-purple-900/40 absolute top-4 right-6 pointer-events-none group-hover:text-purple-800/40 transition-colors">
                03
              </span>
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xl">
                📤
              </div>
              <h3 className="text-xl font-bold text-white">Export & Publish</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Download your KDP-ready interior PDF and cover. Upload directly to Amazon. Start earning.
              </p>
              <p className="text-xs text-purple-300 font-medium pt-2">
                Includes keyword optimizer and SEO book description tags.
              </p>
            </div>

          </div>

          {/* Mini Testimonial Callout */}
          <div className="max-w-2xl mx-auto text-center p-6 rounded-2xl bg-purple-950/40 border border-purple-500/30">
            <p className="text-slate-200 text-sm sm:text-base font-serif italic">
              "I published my first book in one evening. The whole process took less than 2 hours."
            </p>
            <p className="text-purple-400 text-xs font-semibold mt-2">
              — Priya M., Chennai · Non-Fiction Author
            </p>
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          STEP 6: BOOK TYPES SHOWCASE (4 Interactive Tabs)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section id="book-types" className="py-24 sm:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              What Will You Create?
            </h2>
            <p className="text-slate-600 text-base">
              Choose your format to see tailored tools, word targets, and profit estimations.
            </p>
          </div>

          {/* Tab Selection Row */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveBookTab('non-fiction')}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeBookTab === 'non-fiction'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>📖</span>
              <span>Non-Fiction</span>
            </button>

            <button
              onClick={() => setActiveBookTab('childrens')}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeBookTab === 'childrens'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🧒</span>
              <span>Children's</span>
            </button>

            <button
              onClick={() => setActiveBookTab('coloring')}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeBookTab === 'coloring'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🎨</span>
              <span>Coloring</span>
            </button>

            <button
              onClick={() => setActiveBookTab('puzzle')}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeBookTab === 'puzzle'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🧩</span>
              <span>Puzzles</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 sm:p-10 transition-all">
            {activeBookTab === 'non-fiction' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900">Non-Fiction & Self-Help</h3>
                  <p className="text-slate-600 text-sm">
                    Structured guides, finance books, and handbooks with AI research assistance.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-2">✅ AI-powered chapter writing & expansion</li>
                    <li className="flex items-center gap-2">✅ Deep research & citation assistant</li>
                    <li className="flex items-center gap-2">✅ KDP keyword optimizer & description builder</li>
                    <li className="flex items-center gap-2">✅ Print-ready 6×9" interior PDF & EPUB for Kindle</li>
                  </ul>
                  <button onClick={handleStart} className="pt-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer shadow-sm">
                    <span>Create a Non-Fiction Book</span>
                    <span>→</span>
                  </button>
                </div>
                <div className="md:col-span-5 grid grid-cols-1 gap-3">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500 uppercase">Average Book</span>
                    <p className="text-base font-bold text-slate-900">40,000 words</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500 uppercase">Time to Complete</span>
                    <p className="text-base font-bold text-purple-600">2-4 hours with AI</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500 uppercase">Typical Price</span>
                    <p className="text-base font-bold text-slate-900">$9.99 - $14.99</p>
                  </div>
                </div>
              </div>
            )}

            {activeBookTab === 'childrens' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900">Children's Illustrated Stories</h3>
                  <p className="text-slate-600 text-sm">
                    Vibrant bedtime tales, early readers, and picture storybooks with character consistency.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-2">✅ Illustrated story generation with rhyming pacing</li>
                    <li className="flex items-center gap-2">✅ Age-appropriate language filter (Ages 3-8)</li>
                    <li className="flex items-center gap-2">✅ Colorful AI artwork per page with character lock</li>
                    <li className="flex items-center gap-2">✅ 8.5×8.5" and 8.5×11" full-bleed layouts</li>
                  </ul>
                  <button onClick={handleStart} className="pt-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer shadow-sm">
                    <span>Create a Children's Book</span>
                    <span>→</span>
                  </button>
                </div>
                <div className="md:col-span-5 grid grid-cols-1 gap-3">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500 uppercase">Typical Length</span>
                    <p className="text-base font-bold text-slate-900">500 - 2,000 words</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500 uppercase">Time to Complete</span>
                    <p className="text-base font-bold text-purple-600">1-2 hours</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500 uppercase">Typical Price</span>
                    <p className="text-base font-bold text-slate-900">$7.99 - $12.99</p>
                  </div>
                </div>
              </div>
            )}

            {activeBookTab === 'coloring' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900">Coloring & Activity Books</h3>
                  <p className="text-slate-600 text-sm">
                    Adult mandalas, children's line art, and mindfulness activity pages.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-2">✅ AI line art generation in 12 distinct art styles</li>
                    <li className="flex items-center gap-2">✅ 10-40 illustrations per batch</li>
                    <li className="flex items-center gap-2">✅ Automatic blank back pages (prevents bleed-through)</li>
                    <li className="flex items-center gap-2">✅ 8.5×8.5" and 8.5×11" high-resolution exports</li>
                  </ul>
                  <button onClick={handleStart} className="pt-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer shadow-sm">
                    <span>Create a Coloring Book</span>
                    <span>→</span>
                  </button>
                </div>
                <div className="md:col-span-5 grid grid-cols-1 gap-3">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500 uppercase">Volume</span>
                    <p className="text-base font-bold text-slate-900">10-40 illustrations / book</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500 uppercase">Time to Complete</span>
                    <p className="text-base font-bold text-purple-600">30-60 minutes</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500 uppercase">Typical Price</span>
                    <p className="text-base font-bold text-slate-900">$6.99 - $12.99</p>
                  </div>
                </div>
              </div>
            )}

            {activeBookTab === 'puzzle' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900">Puzzle & Word Search Books</h3>
                  <p className="text-slate-600 text-sm">
                    Word searches, word fit puzzles, and color by number with automated solution keys.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-2">✅ Themed word search & word fit generators</li>
                    <li className="flex items-center gap-2">✅ AI-generated niche word lists</li>
                    <li className="flex items-center gap-2">✅ Complete answer key index automatically appended</li>
                    <li className="flex items-center gap-2">✅ Bulk generation (20+ variations in one click)</li>
                  </ul>
                  <button onClick={handleStart} className="pt-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer shadow-sm">
                    <span>Create a Puzzle Book</span>
                    <span>→</span>
                  </button>
                </div>
                <div className="md:col-span-5 grid grid-cols-1 gap-3">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500 uppercase">Puzzles</span>
                    <p className="text-base font-bold text-slate-900">15-50 puzzles / book</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500 uppercase">Time to Complete</span>
                    <p className="text-base font-bold text-purple-600">15-30 minutes</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500 uppercase">Typical Price</span>
                    <p className="text-base font-bold text-slate-900">$5.99 - $9.99</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          STEP 7: TESTIMONIALS SECTION (Light Grey #f9fafb, 3 Cards)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32 bg-[#f9fafb] border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              What Publishers Are Saying
            </h2>
            <p className="text-slate-600 text-base">
              Real authors publishing on Amazon KDP using our complete suite.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-5 flex flex-col justify-between relative">
              <div className="space-y-3">
                <div className="text-amber-500 text-sm">⭐⭐⭐⭐⭐</div>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-serif">
                  "I published my first book in one evening. The AI writing tools are incredible — it actually understood my topic and wrote in my authentic voice."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm">
                  PM
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Priya M.</h4>
                  <p className="text-xs text-slate-500">Non-Fiction Author, Chennai · Published 3 books</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-5 flex flex-col justify-between relative">
              <div className="space-y-3">
                <div className="text-amber-500 text-sm">⭐⭐⭐⭐⭐</div>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-serif">
                  "The puzzle book generator is a game changer. I created 15 word search books with different themes in one afternoon. They're all live on Amazon now."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  JK
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">James K.</h4>
                  <p className="text-xs text-slate-500">KDP Publisher, United Kingdom · Published 22 books</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-5 flex flex-col justify-between relative">
              <div className="space-y-3">
                <div className="text-amber-500 text-sm">⭐⭐⭐⭐⭐</div>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-serif">
                  "Finally, a tool that actually understands KDP's requirements. No more margin errors, no more cover rejections. Just clean, ready-to-upload files."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm">
                  SL
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Sarah L.</h4>
                  <p className="text-xs text-slate-500">Children's Book Author, Canada · Published 8 books</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          STEP 8: PRICING PREVIEW & FAQ ACCORDION (3 Cards + geoStore pricing)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600 text-base">
              Start free. Upgrade when ready.
            </p>
          </div>

          {/* 3 Plan Cards: Free, Pro (Most Popular), Agency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Free Plan */}
            <div className="rounded-2xl bg-white border border-slate-200 p-8 flex flex-col justify-between shadow-xs space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-lg">Free Plan</h3>
                  <span className="text-xl">🌱</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-slate-900">
                    {formatPrice(0, currency)}
                  </div>
                  <p className="text-xs text-slate-500">Free forever, no credit card required</p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">✅ <strong>{getLivePlanLimits('free').total.bookProjects}</strong> active book project{getLivePlanLimits('free').total.bookProjects > 1 ? 's' : ''}</li>
                  <li className="flex items-center gap-2">✅ <strong>{getLivePlanLimits('free').daily.aiGenerations}</strong> AI generation runs / day</li>
                  <li className="flex items-center gap-2">✅ <strong>{getLivePlanLimits('free').daily.pdfExports}</strong> PDF exports / day</li>
                  {getLiveFeatureAccess('puzzleGenerator') === 'free' && (
                    <li className="flex items-center gap-2">✅ <strong>{getLivePlanLimits('free').daily.puzzleGenerations}</strong> puzzle generations / day</li>
                  )}
                  <li className="flex items-center gap-2">✅ Cover layout presets & spine calculator</li>
                  <li className="flex items-center gap-2">✅ Watermarked PDF export</li>
                </ul>
              </div>
              <button 
                onClick={handleStart}
                className="w-full py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-900 font-bold text-sm transition-colors cursor-pointer"
              >
                Start Free
              </button>
            </div>

            {/* Pro Plan (Most Popular) */}
            <div className="rounded-2xl bg-[#0f0f1a] text-white border-2 border-purple-500 p-8 flex flex-col justify-between shadow-xl shadow-purple-950/50 space-y-6 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                Most Popular
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-lg">Pro Plan</h3>
                  <span className="text-xl">⚡</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-white">
                    {getFormattedPrice('pro')}
                    <span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-purple-300">For serious authors & publishers</p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 font-medium pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2">✅ Unlimited book projects</li>
                  <li className="flex items-center gap-2">✅ Unlimited AI writing with Gemini 2.0</li>
                  <li className="flex items-center gap-2">✅ AI Cover Art generation (Imagen 3)</li>
                  <li className="flex items-center gap-2">✅ Amazon Niche & Keyword Research</li>
                  <li className="flex items-center gap-2">✅ 100% unbranded 300 DPI exports</li>
                </ul>
              </div>
              <button 
                onClick={handleStart}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all shadow-md shadow-purple-900/40 cursor-pointer"
              >
                Start with Pro
              </button>
            </div>

            {/* Agency Plan */}
            <div className="rounded-2xl bg-white border border-slate-200 p-8 flex flex-col justify-between shadow-xs space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-lg">Agency Plan</h3>
                  <span className="text-xl">🚀</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-slate-900">
                    {getFormattedPrice('agency')}
                    <span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-slate-500">For high-volume KDP agencies</p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">✅ Everything in Pro</li>
                  <li className="flex items-center gap-2">✅ Bulk Batch Generator (20 books/batch)</li>
                  <li className="flex items-center gap-2">✅ 5 Team member seats</li>
                  <li className="flex items-center gap-2">✅ Priority rendering & support</li>
                  <li className="flex items-center gap-2">✅ White-label export capability</li>
                </ul>
              </div>
              <button 
                onClick={handleStart}
                className="w-full py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-900 font-bold text-sm transition-colors cursor-pointer"
              >
                Get Agency
              </button>
            </div>

          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => onNavigate('pricing')}
              className="text-purple-600 hover:text-purple-700 font-bold text-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>See full feature comparison</span>
              <span>→</span>
            </button>
          </div>

          {/* FAQ Accordion Preview */}
          <div className="max-w-3xl mx-auto pt-10 border-t border-slate-200/80 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 text-center mb-6">
              Frequently Asked Questions
            </h3>

            {/* Q1 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleFaq(1)}
                className="w-full p-4 text-left font-bold text-sm text-slate-900 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
              >
                <span>Is there really a free plan?</span>
                <ChevronDown size={18} className={`text-slate-500 transition-transform ${openFaqIndex === 1 ? 'rotate-180' : ''}`} />
              </button>
              {openFaqIndex === 1 && (
                <div className="p-4 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                  Yes. The free plan includes 1 active book project, 3 AI generations per day, and basic formatting tools. No credit card is needed to sign up.
                </div>
              )}
            </div>

            {/* Q2 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleFaq(2)}
                className="w-full p-4 text-left font-bold text-sm text-slate-900 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
              >
                <span>Can I publish on Amazon KDP with this?</span>
                <ChevronDown size={18} className={`text-slate-500 transition-transform ${openFaqIndex === 2 ? 'rotate-180' : ''}`} />
              </button>
              {openFaqIndex === 2 && (
                <div className="p-4 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                  Yes. All exports are KDP-ready PDFs with calculated gutters, margins, and 300 DPI covers that upload directly to Amazon KDP without additional formatting.
                </div>
              )}
            </div>

            {/* Q3 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleFaq(3)}
                className="w-full p-4 text-left font-bold text-sm text-slate-900 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
              >
                <span>What AI powers KDP Studio?</span>
                <ChevronDown size={18} className={`text-slate-500 transition-transform ${openFaqIndex === 3 ? 'rotate-180' : ''}`} />
              </button>
              {openFaqIndex === 3 && (
                <div className="p-4 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                  Google Gemini 2.0 powers manuscript writing, outline generation, and niche research, while Google Imagen 3 generates cover art and coloring book illustrations.
                </div>
              )}
            </div>

          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          STEP 9: FINAL CTA SECTION (Purple Gradient, Big White Button, Emojis)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-gradient-to-r from-purple-700 via-indigo-700 to-violet-800 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Your First Book is Waiting
          </h2>
          <p className="text-purple-100 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Join 10,000+ authors who use KDP Studio to publish faster, smarter, and more profitably on Amazon.
          </p>
          <div className="pt-2">
            <button
              onClick={handleStart}
              className="px-9 py-4 rounded-xl bg-white hover:bg-slate-100 active:scale-98 text-purple-900 font-extrabold text-base shadow-2xl shadow-purple-950/60 hover:shadow-white/20 transition-all cursor-pointer inline-flex items-center gap-2 group"
            >
              <span>Start Publishing for Free</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <p className="text-xs text-purple-200">
            No credit card · Free plan forever · Cancel paid plans anytime
          </p>
          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-purple-200">
            <span>📖 🧒 🎨 🧩 📓</span>
            <span className="font-semibold">All book types supported</span>
          </div>
        </div>
      </section>

    </div>
  );
};
