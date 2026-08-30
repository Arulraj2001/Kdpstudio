'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Check, AlertCircle, Sparkles, BookOpen, Search, Zap, X, ShieldCheck } from 'lucide-react';

interface SubscribeInlineProps {
  source?: string;
  tags?: string[];
  variant?: 'minimal' | 'card' | 'popup';
  onClosePopup?: () => void;
}

export const SubscribeInline: React.FC<SubscribeInlineProps> = ({
  source = 'blog-footer',
  tags = [],
  variant = 'minimal',
  onClosePopup,
}) => {
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: name.trim() || null,
          source,
          tags,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Subscription failed');
      }

      setSuccessMessage(data.message || '✅ Check your inbox to confirm your subscription!');
      setEmail('');
      setName('');

      if (typeof window !== 'undefined') {
        localStorage.setItem('kdp_newsletter_subscribed', 'true');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // VARIANT 1: Minimal Form (Footer & Sidebar)
  // ─────────────────────────────────────────
  if (variant === 'minimal') {
    if (successMessage) {
      return (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              required
              className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-slate-900 shadow-2xs font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 transition-all active:scale-95"
          >
            <span>{loading ? 'Sending...' : 'Subscribe'}</span>
            <Sparkles size={13} />
          </button>
        </div>

        {errorMessage && (
          <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
            <AlertCircle size={12} /> {errorMessage}
          </p>
        )}
      </form>
    );
  }

  // ─────────────────────────────────────────
  // VARIANT 2: Full Benefit Card (Mid-article / Sidebar)
  // ─────────────────────────────────────────
  if (variant === 'card') {
    return (
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl space-y-5">
        <div className="space-y-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
            📬 Weekly Publisher Digest
          </span>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
            Get Amazon KDP Publishing Strategies
          </h3>
          <p className="text-xs text-purple-200/90 leading-relaxed">
            Join 5,000+ indie authors receiving tested low-content niches, cover design frameworks, and royalty calculators.
          </p>
        </div>

        {/* 3 Key Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-purple-100">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <BookOpen size={14} className="text-purple-300 shrink-0" />
            <span className="font-semibold text-[11px]">Weekly Publishing Playbooks</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Search size={14} className="text-amber-300 shrink-0" />
            <span className="font-semibold text-[11px]">High-Margin Niche Breakdowns</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Zap size={14} className="text-emerald-300 shrink-0" />
            <span className="font-semibold text-[11px]">Formatting & Algorithm Guides</span>
          </div>
        </div>

        {successMessage ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name (optional)"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-purple-200/60 focus:bg-white/20 focus:border-purple-300 outline-none"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address..."
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-purple-200/60 focus:bg-white/20 focus:border-purple-300 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white text-slate-950 font-black text-xs hover:bg-slate-100 transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Subscribing...' : 'Subscribe Free →'}</span>
            </button>

            {errorMessage && (
              <p className="text-[11px] text-rose-300 font-semibold flex items-center gap-1">
                <AlertCircle size={12} /> {errorMessage}
              </p>
            )}

            <p className="text-[10px] text-purple-300/60 text-center flex items-center justify-center gap-1">
              <ShieldCheck size={12} />
              <span>Zero spam. Double opt-in verification. Unsubscribe in 1-click anytime.</span>
            </p>
          </form>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────
  // VARIANT 3: Exit-Intent Popup
  // ─────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
        <button
          onClick={onClosePopup}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-2xl shadow-inner">
            📚
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Before You Go — Level Up Your KDP Books
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Get our weekly Amazon KDP strategy playbook, trending niche alerts, and cover formatting checklists.
            </p>
          </div>

          {successMessage ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check size={16} className="text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5 pt-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                required
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none text-slate-900 font-medium"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Subscribing...' : 'Get Free KDP Guides →'}</span>
              </button>

              {errorMessage && (
                <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle size={12} /> {errorMessage}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
