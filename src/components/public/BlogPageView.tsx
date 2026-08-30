'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Clock,
  ArrowRight,
  Sparkles,
  Send,
  CheckCircle2,
  Search,
  Filter,
  User,
  Calendar,
  Flame,
  Tag,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { PageRoute } from '../../types';
import { BlogPost, AdConfig } from '../../types/blog';
import { SEOHead } from '../seo/SEOHead';
import { JsonLd } from '../seo/JsonLd';
import { AdSlot } from '../blog/AdSlot';
import { SubscribeInline } from '../blog/SubscribeInline';
import { getAllBlogPosts } from '../../lib/blog';

interface BlogPageViewProps {
  initialCategory?: string;
  onNavigate?: (route: PageRoute) => void;
  onSelectPost?: (slug: string) => void;
}

export const BlogPageView: React.FC<BlogPageViewProps> = ({
  initialCategory,
  onNavigate,
  onSelectPost,
}) => {
  const [posts, setPosts] = useState<BlogPost[]>(() => getAllBlogPosts() as any);
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [urlToast, setUrlToast] = useState<string | null>(null);
  const postsPerPage = 6;

  // Check URL query parameters for confirmation messages
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscribed') === 'true') {
      setUrlToast("🎉 You're confirmed! Welcome to KDP Studio Strategy Academy.");
      setTimeout(() => setUrlToast(null), 6000);
    } else if (params.get('unsubscribed') === 'true') {
      setUrlToast('You have been unsubscribed from blog updates.');
      setTimeout(() => setUrlToast(null), 6000);
    }
  }, []);

  // Fetch live blog posts and ad configuration from Firestore
  useEffect(() => {
    let isMounted = true;

    fetch('/api/blog/posts')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data?.posts) && data.posts.length > 0) {
          setPosts(data.posts);
        }
      })
      .catch(() => {});

    fetch('/api/blog/ads')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.config) {
          setAdConfig(data.config);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute Categories with post counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: posts.length };
    posts.forEach((p) => {
      const cat = p.category || 'Publishing Strategy';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [posts]);

  // Compute Popular Tags
  const popularTags = useMemo(() => {
    const map: Record<string, number> = {};
    posts.forEach((p) => {
      (p.tags || []).forEach((t) => {
        map[t] = (map[t] || 0) + 1;
      });
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t]) => t);
  }, [posts]);

  // Filter Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        (post.category || '').toLowerCase() === selectedCategory.toLowerCase();

      const matchesTag =
        selectedTag === 'All' ||
        (post.tags || []).some((t) => t.toLowerCase() === selectedTag.toLowerCase());

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (post.title || '').toLowerCase().includes(q) ||
        (post.metaDescription || post.excerpt || '').toLowerCase().includes(q) ||
        (post.tags || []).some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [posts, selectedCategory, selectedTag, searchQuery]);

  // Featured Post (First post or marked featured)
  const featuredPost = filteredPosts[0] || posts[0];
  const gridPosts = filteredPosts.slice(1);

  // Pagination
  const totalPages = Math.ceil(gridPosts.length / postsPerPage) || 1;
  const paginatedGridPosts = gridPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const handleOpenPost = (slug: string) => {
    if (onSelectPost) {
      onSelectPost(slug);
    } else {
      window.location.href = `/blog/${slug}`;
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'blog_footer' }),
      });
    } catch {}
    setIsSubscribed(true);
  };

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'KDP Studio Publishing Academy',
    description: 'Proven strategies, niche research frameworks, and formatting guides for Amazon KDP self-publishers.',
    url: 'https://kdpstudio-aio.web.app/blog',
    publisher: {
      '@type': 'Organization',
      name: 'KDP Studio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kdpstudio-aio.web.app/icons/icon-512x512.png',
      },
    },
  };

  return (
    <div className="w-full bg-[#fcfcfd] text-slate-900 font-sans min-h-screen">
      <SEOHead
        title="Amazon KDP Publishing Blog & Strategy Academy | KDP Studio"
        description="Actionable guides and data-backed strategies for Amazon KDP publishers. Niche research, cover formatting, pricing models, and AI tools."
        canonicalPath="/blog"
      />
      <JsonLd id="jsonld-blog" data={blogSchema} />

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-b from-purple-900 via-slate-900 to-slate-950 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto space-y-6 relative z-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-purple-400" />
            <span>KDP Publishing Academy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] max-w-3xl">
            Strategies & Frameworks for <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">6-Figure Indie Authors</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Data-backed niche research, 300 DPI cover design best practices, Amazon keyword ranking breakdowns, and AI publishing automation.
          </p>

          {/* Search Bar in Hero */}
          <div className="max-w-xl relative pt-2">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search topics, niches, keywords (e.g. coloring books)..."
              className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-slate-400 focus:bg-white focus:text-slate-900 focus:outline-none transition-all shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* ── URL Confirmation Toast Banner ── */}
      {urlToast && (
        <div className="bg-emerald-600 text-white font-bold text-xs sm:text-sm py-3 px-4 text-center sticky top-0 z-40 shadow-lg flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 size={16} />
          <span>{urlToast}</span>
        </div>
      )}

      {/* ── Main Layout (70% Grid / 30% Sticky Sidebar) ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* ─────────────────────────────────────────
              MAIN CONTENT COLUMN (70% / 8 cols)
             ───────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* ── Large Featured Post Card ── */}
            {featuredPost && (
              <div
                onClick={() => handleOpenPost(featuredPost.slug)}
                className="group relative rounded-3xl overflow-hidden bg-slate-900 text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer flex flex-col justify-end min-h-[380px] sm:min-h-[440px] border border-slate-800"
              >
                {/* Background Image with Dark Gradient Overlay */}
                <img
                  src={
                    featuredPost.featuredImage?.url ||
                    (featuredPost as any).coverImage ||
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80'
                  }
                  alt={featuredPost.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                {/* Card Content */}
                <div className="relative z-10 p-6 sm:p-8 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-600 text-white shadow-sm">
                      {featuredPost.category || 'Featured'}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      {featuredPost.readingTimeMinutes || 6} min read
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white group-hover:text-purple-300 transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed max-w-2xl">
                    {featuredPost.metaDescription || featuredPost.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{featuredPost.authorName || 'KDP Studio'}</span>
                      <span>•</span>
                      <span>{featuredPost.publishedAt ? new Date(featuredPost.publishedAt).toLocaleDateString() : 'Recently'}</span>
                    </div>
                    <span className="text-purple-300 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Read Article</span>
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* In-Feed Ad Slot */}
            <AdSlot positionId="header" adConfig={adConfig} postWordCount={800} />

            {/* ── 2-Column Post Grid Cards ── */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <h3 className="text-lg font-black text-slate-900">
                  {selectedCategory === 'All' ? 'Latest Guides' : `Articles in ${selectedCategory}`}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {filteredPosts.length} total articles
                </span>
              </div>

              {paginatedGridPosts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <BookOpen size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No matching articles found</p>
                  <p className="text-xs text-slate-400 mt-1">Try selecting a different category or search term.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {paginatedGridPosts.map((p) => {
                    const wordCount = p.wordCount || 800;
                    const isLongRead = wordCount >= 2000;

                    return (
                      <div
                        key={p.slug || p.id}
                        onClick={() => handleOpenPost(p.slug)}
                        className="group bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                      >
                        {/* 16:9 Image Thumbnail */}
                        <div className="relative aspect-[16/9] rounded-2xl bg-slate-100 overflow-hidden">
                          <img
                            src={
                              p.featuredImage?.url ||
                              (p as any).coverImage ||
                              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
                            }
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/90 backdrop-blur-xs text-purple-900 shadow-xs">
                            {p.category || 'Publishing'}
                          </span>
                        </div>

                        {/* Text Information */}
                        <div className="space-y-1.5 flex-1">
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-2 leading-snug">
                            {p.title}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {p.metaDescription || p.excerpt}
                          </p>
                        </div>

                        {/* Meta Tags & Long-read Badge */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{p.readingTimeMinutes || 5} min read</span>
                          {isLongRead && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px]">
                              📖 Long read — {wordCount.toLocaleString()}w
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Traditional Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────
              SIDEBAR COLUMN (30% / 4 cols - Sticky)
             ───────────────────────────────────────── */}
          <aside className="lg:col-span-4 space-y-6 sticky top-20">
            
            {/* Categories Widget */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span>📂</span>
                <span>Categories</span>
              </h4>

              <div className="space-y-1 text-xs font-medium">
                {Object.entries(categoryCounts).map(([cat, count]) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200/80 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            {popularTags.length > 0 && (
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Tag size={13} className="text-purple-600" />
                  <span>Popular Topics</span>
                </h4>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedTag('All');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      selectedTag === 'All' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Tags
                  </button>
                  {popularTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedTag(t);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        selectedTag === t ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sidebar Ad Slot */}
            <AdSlot positionId="sidebar" adConfig={adConfig} postWordCount={800} />

            {/* Newsletter CTA Widget */}
            <div className="pt-2">
              <SubscribeInline source="blog-list" variant="card" />
            </div>
          </aside>
        </div>
      </div>

      {/* ── GDPR & AdSense Disclosure Footer Notice ── */}
      <div className="border-t border-slate-200/60 bg-slate-50 py-6 text-center text-xs text-slate-400 px-4">
        <p className="max-w-2xl mx-auto leading-relaxed">
          <strong>Ad & Affiliate Disclosure:</strong> This site may display advertisements. We participate in the Google AdSense program and other publisher networks to deliver relevant publishing tools and resources.
        </p>
      </div>
    </div>
  );
};
