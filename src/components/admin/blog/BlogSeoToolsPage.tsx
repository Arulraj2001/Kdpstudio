'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  CheckCircle2,
  FileCode,
  Rss,
  Newspaper,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { PageRoute } from '../../../types';

interface BlogSeoToolsPageProps {
  onNavigate: (route: PageRoute) => void;
}

export const BlogSeoToolsPage: React.FC<BlogSeoToolsPageProps> = ({ onNavigate }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [slugToRevalidate, setSlugToRevalidate] = useState<string>('');
  const [revalidatingSlug, setRevalidatingSlug] = useState<boolean>(false);
  const [revalidatingAll, setRevalidatingAll] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Metrics
  const [postCount, setPostCount] = useState<number>(0);
  const [publishedCount, setPublishedCount] = useState<number>(0);
  const [recentCount, setRecentCount] = useState<number>(0);

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app');

  const sitemapIndexUrl = `${baseUrl}/sitemap-index.xml`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetch('/api/admin/blog/posts')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.posts)) {
          setPostCount(data.posts.length);
          const published = data.posts.filter((p: any) => p.status === 'published');
          setPublishedCount(published.length);

          const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
          const recent = published.filter((p: any) => {
            const time = new Date(p.publishedAt || 0).getTime();
            return time >= twoDaysAgo;
          });
          setRecentCount(recent.length);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(sitemapIndexUrl);
    setCopied(true);
    showToast('📋 Copied Master Sitemap Index URL to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevalidateSlug = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugToRevalidate.trim();
    if (!slug) return;

    setRevalidatingSlug(true);
    try {
      const res = await fetch(`/api/blog/revalidate?slug=${encodeURIComponent(slug)}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`🚀 Successfully revalidated /blog/${slug}`);
        setSlugToRevalidate('');
      } else {
        showToast(`❌ Error: ${data?.error || 'Revalidation failed'}`);
      }
    } catch (err: any) {
      showToast(`❌ Network error: ${err.message}`);
    } finally {
      setRevalidatingSlug(false);
    }
  };

  const handleRevalidateAll = async () => {
    setRevalidatingAll(true);
    showToast('⏳ Revalidating all pages and purging edge cache...');

    try {
      const res = await fetch('/api/blog/revalidate?revalidateAll=true', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showToast('✨ All blog pages, sitemaps, and feeds revalidated successfully');
      } else {
        showToast(`❌ Error: ${data?.error || 'Revalidation failed'}`);
      }
    } catch (err: any) {
      showToast(`❌ Network error: ${err.message}`);
    } finally {
      setRevalidatingAll(false);
    }
  };

  const sitemapsList = [
    {
      title: 'Master Sitemap Index',
      url: '/sitemap-index.xml',
      desc: 'Master directory grouping all child sitemaps (submit this to Search Console)',
      countLabel: '3 Sitemaps',
      icon: <Layers className="text-purple-600" size={18} />,
    },
    {
      title: 'Standard Pages & Blog Sitemap',
      url: '/sitemap.xml',
      desc: 'All public pages, published blog articles, categories, and author profiles',
      countLabel: `${publishedCount} Published Posts`,
      icon: <FileCode className="text-blue-600" size={18} />,
    },
    {
      title: 'Google News Sitemap',
      url: '/news-sitemap.xml',
      desc: 'Time-sensitive articles published in the last 48 hours for rapid news indexing',
      countLabel: `${recentCount} Fresh Articles`,
      icon: <Newspaper className="text-amber-600" size={18} />,
    },
    {
      title: 'Image Sitemap',
      url: '/image-sitemap.xml',
      desc: 'High-resolution book covers and article infographics for Google Images search',
      countLabel: `${publishedCount} Post Covers`,
      icon: <ImageIcon className="text-emerald-600" size={18} />,
    },
    {
      title: 'RSS 2.0 Feed',
      url: '/feed.xml',
      desc: 'Full HTML RSS feed for feed readers, aggregators, and automated syndication',
      countLabel: '20 Latest Posts',
      icon: <Rss className="text-orange-600" size={18} />,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom duration-200">
          {toastMessage}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>🔍</span> Search Console & SEO Tools
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Master XML sitemaps, Google Search Console submission helper, RSS syndication, and on-demand cache rebuilding
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <span>Open Search Console</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* ── Section 1: Master Sitemap Index & Submit to Google ── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>🚀</span>
              <span>Submit to Google Search Console</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit only your <strong>Master Sitemap Index URL</strong>. Google will automatically discover all child sitemaps and fresh posts.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
            ● All Sitemaps Live
          </span>
        </div>

        {/* Copy Master URL Box */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-inner">
          <span className="text-purple-300 truncate">{sitemapIndexUrl}</span>
          <button
            onClick={handleCopyUrl}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-sans text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
            <span>{copied ? 'Copied URL!' : 'Copy URL'}</span>
          </button>
        </div>

        {/* All Sitemaps List */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
            Available XML Sitemaps & Feeds
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {sitemapsList.map((sm) => (
              <div
                key={sm.url}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-purple-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs mt-0.5">
                    {sm.icon}
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                      <span>{sm.title}</span>
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {sm.url}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{sm.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {sm.countLabel}
                  </span>
                  <a
                    href={sm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-white transition-colors"
                    title="Open XML in new tab"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 2: On-Demand Revalidation Controls ── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>⚡</span>
            <span>On-Demand Edge Revalidation & Cache Purging</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Instantly rebuild static HTML pages across edge nodes without waiting for the 1-hour ISR cycle
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          {/* Revalidate Specific Slug */}
          <form onSubmit={handleRevalidateSlug} className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <label className="text-xs font-bold text-slate-800">Rebuild Specific Blog Slug</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={slugToRevalidate}
                onChange={(e) => setSlugToRevalidate(e.target.value)}
                placeholder="profitable-kdp-niches-2026"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white border border-slate-200 focus:border-purple-500 outline-none text-slate-800"
              />
              <button
                type="submit"
                disabled={revalidatingSlug || !slugToRevalidate.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
              >
                {revalidatingSlug ? 'Purging...' : 'Revalidate'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Rebuilds <code>/blog/{slugToRevalidate || '{slug}'}</code> instantly.
            </p>
          </form>

          {/* Revalidate All Pages */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Rebuild Entire Blog & All Sitemaps</span>
              <RefreshCw size={15} className={`text-purple-600 ${revalidatingAll ? 'animate-spin' : ''}`} />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Purges edge cache for the blog directory, all articles, RSS feeds, and dynamic XML sitemaps.
            </p>
            <button
              onClick={handleRevalidateAll}
              disabled={revalidatingAll}
              className="w-full py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {revalidatingAll ? 'Revalidating All... (takes ~1m)' : 'Force Revalidate All Pages'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 3: Crawl Status & Search Console Guidance ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
              Search Indexing Checklist
            </span>
            <h3 className="text-lg font-black tracking-tight mt-1">
              Google Search Console Best Practices
            </h3>
          </div>

          <a
            href="https://search.google.com/search-console/index"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Open Coverage Report</span>
            <ExternalLink size={13} />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-purple-100 pt-1">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>Submit `sitemap-index.xml`</span>
            </div>
            <p className="text-[11px] text-purple-200/80">
              Only submit the index file. Google will automatically poll child sitemaps and images.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>Request Indexing for New Posts</span>
            </div>
            <p className="text-[11px] text-purple-200/80">
              Use URL Inspection in Search Console to request priority indexing right after publishing.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>Monitor Core Web Vitals</span>
            </div>
            <p className="text-[11px] text-purple-200/80">
              All blog pages are optimized for LCP &lt; 2.5s with eager cover image loading.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>Weekly Crawl Error Audits</span>
            </div>
            <p className="text-[11px] text-purple-200/80">
              Inspect Pages &gt; Not Indexed in Search Console weekly to verify zero 404 or canonical issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
