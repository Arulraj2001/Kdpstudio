'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ArrowLeft, Send, Check } from 'lucide-react';
import { PageRoute } from '../../types';
import { SEOHead } from '../seo/SEOHead';

interface ChangelogPageViewProps {
  onNavigate?: (route: PageRoute) => void;
}

interface ChangelogVersion {
  version: string;
  date: string;
  badge?: string;
  features: string[];
  improvements: string[];
  fixes: string[];
}

export const ChangelogPageView: React.FC<ChangelogPageViewProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const versions: ChangelogVersion[] = [
    {
      version: 'v2.4.0',
      date: 'August 2026',
      badge: 'Latest Release',
      features: [
        'Claude AI & Imagen 3 Integration — Ultra-fast AI drafting, chapter expansion, and high-fidelity cover illustration generation.',
        'Dynamic IP Geolocation & Localized Pricing — Auto-detects visitor country and displays localized pricing in INR (₹), USD ($), GBP (£), EUR (€), CAD (CA$), and AUD (A$).',
        'Multi-Gateway Payment Engine — Direct checkouts for Razorpay, UPI (GPay/PhonePe), PayPal, and Buy Me a Coffee with automated activation webhooks.'
      ],
      improvements: [
        'Automated KDP Pre-Flight Inspector — Live calculation of exact spine thickness, gutter safety margins, and 300 DPI resolution checks.',
        'Full Cover Spread Generator — Integrated front, spine, and back cover builder with automatic barcode safe zones.',
        'Enhanced EPUB 3 Export — Clean reflowable markup ready for immediate Kindle eBook publishing.'
      ],
      fixes: [
        'Fixed: Resolved currency price formatting lookups across all preview components.',
        'Fixed: Word search grid generator now accurately calculates solution intersections.',
        'Fixed: Session persistence across browser reloads via full history state synchronization.'
      ]
    },
    {
      version: 'v2.1.0',
      date: 'July 2026',
      badge: 'Major Update',
      features: [
        'Puzzle & Activity Book Suite — Generate 20+ variations of Word Searches, Word Fit matrices, and Color by Number with auto-generated solution keys.',
        'Multi-Chapter Studio Workspace — Rich text chapter writing environment with auto-save, tone improvement, and word counts.',
        'Admin System Dashboard — Complete user management, subscription overrides, impersonation banners, and revenue metrics.'
      ],
      improvements: [
        'Interior PDF generation is now 40% faster using client-side vector compilation.',
        'Added 4-step onboarding wizard for personalized author genre routing.'
      ],
      fixes: [
        'Fixed: Resolved margin overflow on 8.5×11" full-bleed trim size.',
        'Fixed: Improved token revocation on admin ban actions.'
      ]
    },
    {
      version: 'v1.5.0',
      date: 'June 2026',
      badge: 'Initial Launch',
      features: [
        'Core KDP Formatter Engine — Auto-formatting for standard 5×8", 6×9", and 8.5×11" paperback sizes.',
        'Amazon Keyword & Category Optimizer — High-ranking 7 backend keyword research tool and BISAC category picker.',
        'Free Forever Tier — 1 active book project and daily AI generation credits with zero credit card required.'
      ],
      improvements: [
        'Added 100% unbranded print-ready PDF exports for Pro subscribers.',
        'Created initial templates for Non-Fiction, Fiction, and Children\'s books.'
      ],
      fixes: [
        'Initial stability improvements and user authentication flows.'
      ]
    }
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  };

  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      <SEOHead
        pageKey="changelog"
        title="Changelog — KDP Studio"
        description="Latest updates, features, and improvements to KDP Studio."
        canonicalPath="/changelog"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
        
        {/* Header */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider border border-purple-200">
            <Sparkles size={14} className="text-purple-600" />
            <span>Product Updates</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
            Changelog &amp; <span className="font-serif italic font-normal text-purple-600">Product Evolution</span>
          </h1>
          <p className="text-base text-slate-600">
            What's new in KDP Studio. We ship updates, new models, and performance improvements every week.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
            <span>Follow for live updates:</span>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">
              Twitter / X ↗
            </a>
            <span>•</span>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">
              YouTube ↗
            </a>
          </div>
        </div>

        {/* Timeline Layout */}
        <div className="relative border-l-2 border-purple-200 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-16">
          {versions.map((ver, idx) => (
            <div key={ver.version} className="relative space-y-6">
              
              {/* Timeline Indicator Dot */}
              <div className="absolute -left-[31px] sm:-left-[47px] top-1 w-5 h-5 rounded-full bg-purple-600 border-4 border-white shadow-md flex items-center justify-center" />

              {/* Version & Date Header */}
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {ver.version}
                </h2>
                <span className="text-xs sm:text-sm font-semibold text-slate-500">
                  — {ver.date}
                </span>
                {ver.badge && (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold uppercase tracking-wider border border-purple-200">
                    {ver.badge}
                  </span>
                )}
              </div>

              {/* Categorized Lists */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6">
                
                {/* 🟢 New Features */}
                {ver.features.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-700">
                        New Features
                      </h3>
                    </div>
                    <ul className="space-y-2.5 pl-4 text-xs sm:text-sm text-slate-700 font-normal leading-relaxed list-disc">
                      {ver.features.map((feat, i) => (
                        <li key={i}>{feat}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 🔵 Improvements */}
                {ver.improvements.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                      <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-700">
                        Improvements
                      </h3>
                    </div>
                    <ul className="space-y-2.5 pl-4 text-xs sm:text-sm text-slate-700 font-normal leading-relaxed list-disc">
                      {ver.improvements.map((imp, i) => (
                        <li key={i}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 🔴 Bug Fixes */}
                {ver.fixes.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-700">
                        Bug Fixes
                      </h3>
                    </div>
                    <ul className="space-y-2.5 pl-4 text-xs sm:text-sm text-slate-700 font-normal leading-relaxed list-disc">
                      {ver.fixes.map((fix, i) => (
                        <li key={i}>{fix}</li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>

            </div>
          ))}
        </div>

        {/* Subscribe Section at Bottom */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-8 text-center space-y-4 max-w-2xl mx-auto shadow-xl">
          <h3 className="text-xl sm:text-2xl font-bold">Get notified of new features</h3>
          <p className="text-xs sm:text-sm text-purple-200 max-w-md mx-auto">
            Be the first to test new AI models, formatting templates, and publishing automation tools.
          </p>

          {subscribed ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/60 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500">
              <Check size={16} />
              <span>You're all set! You will receive new version announcements.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto pt-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 bg-slate-800 border border-purple-400/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-300"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition-colors shrink-0"
              >
                Notify Me
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
