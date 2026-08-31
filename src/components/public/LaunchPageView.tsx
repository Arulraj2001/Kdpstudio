'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, ArrowRight, Share2, Star, ShieldCheck, Zap, BookOpen } from 'lucide-react';
import { PageRoute } from '../../types';
import { SEOHead } from '../seo/SEOHead';
import { SectionShadowTransition } from './SectionShadowTransition';

interface LaunchPageViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const LaunchPageView: React.FC<LaunchPageViewProps> = ({ onNavigate }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 14,
    minutes: 32,
    seconds: 45,
  });
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Dynamic countdown timer calculating time until next midnight
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyPromo = () => {
    navigator.clipboard.writeText('PRODUCTHUNT40');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleStartWithDiscount = () => {
    if (onNavigate) {
      onNavigate('signup');
    } else {
      window.location.href = '/signup?promo=PRODUCTHUNT40';
    }
  };

  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      <SEOHead
        pageKey="launch"
        title="KDP Studio on Product Hunt 🎉"
        description="Celebrate the launch of KDP Studio on Product Hunt! Get 40% off Pro for 24 hours only."
        canonicalPath="/launch"
      />

      {/* ── Festive Header Banner ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f0f1a] via-[#1e1b4b] to-[#121226] text-white pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 text-center space-y-8">
        
        {/* Ambient Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-bold shadow-lg animate-bounce">
            <span>🎉 We're live on Product Hunt today!</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15] text-white font-display">
            Thank You Product Hunt Community! <br />
            <span className="font-serif italic font-normal bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
              Exclusive 40% Launch Discount
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            KDP Studio is the complete AI-powered publishing suite for Amazon Kindle Direct Publishing. Write with Claude AI, auto-format interiors, and design covers in minutes.
          </p>

          {/* Product Hunt Custom Launch Badge */}
          <div className="pt-3 flex items-center justify-center">
            <a
              href="https://www.producthunt.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#da552f]/10 border border-[#da552f]/40 hover:bg-[#da552f]/20 text-white shadow-xl hover:scale-105 transition-all group"
            >
              {/* Product Hunt Logo Icon */}
              <div className="w-8 h-8 rounded-full bg-[#da552f] flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                P
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-orange-300 uppercase tracking-widest leading-none">
                  FEATURED ON
                </span>
                <span className="text-sm font-extrabold text-white tracking-tight leading-tight mt-0.5 group-hover:text-orange-200 transition-colors">
                  Product Hunt
                </span>
              </div>
              <div className="ml-2 pl-3 border-l border-white/20 flex items-center gap-1.5 text-xs font-bold text-orange-300">
                <span>▲</span>
                <span>Launch Day</span>
              </div>
            </a>
          </div>

          {/* ── 24-Hour Countdown Timer ── */}
          <div className="pt-8 max-w-xl mx-auto">
            <div className="bg-[#17172e] border border-purple-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                  Launch Day Flash Deal
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  🚀 40% OFF Pro Plan for 24 Hours Only
                </h3>
              </div>

              {/* Countdown Digits */}
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-3 text-center">
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hours</div>
                </div>

                <div className="bg-slate-900 border border-white/10 rounded-2xl p-3 text-center">
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Minutes</div>
                </div>

                <div className="bg-slate-900 border border-white/10 rounded-2xl p-3 text-center">
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Seconds</div>
                </div>
              </div>

              {/* Promo Code Box */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between bg-purple-950/60 border border-purple-500/50 rounded-xl p-3 max-w-sm mx-auto">
                  <span className="font-mono text-sm sm:text-base font-black text-purple-300 tracking-wider">
                    PRODUCTHUNT40
                  </span>
                  <button
                    onClick={handleCopyPromo}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <div>
                  <button
                    onClick={handleStartWithDiscount}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-98 text-white font-black text-sm sm:text-base shadow-xl shadow-purple-950/60 cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <span>Claim 40% Off Pro</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>
      <SectionShadowTransition type="dark-to-white" />

      {/* ── Feature Highlights ── */}
      <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 font-serif">
            Why Creators Choose KDP Studio
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Everything needed to go from an idea to live on Amazon KDP in under 20 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-7 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl">
              ⚡
            </div>
            <h3 className="font-bold text-lg text-slate-900">Claude AI</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Generate entire manuscripts, structured chapter outlines, and SEO book descriptions with state-of-the-art multimodal AI.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-7 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">
              📐
            </div>
            <h3 className="font-bold text-lg text-slate-900">KDP Print Math Engine</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Auto-calculate spine thickness, gutter safety boundaries, and export 300 DPI CMYK PDFs that never get rejected by Amazon.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-7 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
              🧩
            </div>
            <h3 className="font-bold text-lg text-slate-900">Puzzle & Activity Suite</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Generate Word Searches, Word Fit matrices, and coloring pages with automated solution appendices for high-margin publishing.
            </p>
          </div>
        </div>

        {/* Share Section */}
        <div className="p-8 rounded-2xl bg-purple-50 border border-purple-200 text-center space-y-4 max-w-xl mx-auto">
          <h3 className="font-bold text-slate-900 text-base">Share your love for KDP Studio</h3>
          <p className="text-xs text-slate-600">
            Tweet about our Product Hunt launch and tag @kdpstudio for an extra 10 bonus AI credits!
          </p>
          <a
            href="https://twitter.com/intent/tweet?text=Just%20found%20@kdpstudio%20on%20@ProductHunt!%20An%20all-in-one%20AI%20publishing%20suite%20for%20Amazon%20KDP.%20Check%20it%20out:%20https://kdpstudio-aio.web.app/launch"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            <Share2 size={14} />
            <span>Tweet About KDP Studio</span>
          </a>
        </div>
      </section>

    </div>
  );
};
