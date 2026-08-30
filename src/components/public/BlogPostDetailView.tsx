'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, ArrowLeft, ArrowRight, Share2, Sparkles, Check, ChevronRight, Bookmark, Twitter, Linkedin, BookOpen, Layers } from 'lucide-react';
import { PageRoute } from '../../types';
import { SEOHead } from '../seo/SEOHead';
import { JsonLd } from '../seo/JsonLd';
import { getBlogPost, getBlogPostsByCategory, getAllBlogPosts, BlogPost } from '../../lib/blog';

interface BlogPostDetailViewProps {
  slug: string;
  onNavigate: (route: PageRoute) => void;
  onSelectPost: (slug: string) => void;
}

interface TocItem {
  id: string;
  text: string;
}

export const BlogPostDetailView: React.FC<BlogPostDetailViewProps> = ({ slug, onNavigate, onSelectPost }) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTocId, setActiveTocId] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const initial = getBlogPost(slug) || getAllBlogPosts()[0];
    setPost(initial);
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Fetch from API to get Firestore updates
    fetch(`/api/blog/posts/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.post) {
          setPost(data.post);
          if (data.post.id) {
            fetch('/api/blog/view', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ postId: data.post.id }),
            }).catch(() => {});
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, Math.round(progress))));
      }

      // Track active TOC section
      const headings = document.querySelectorAll('.prose-custom h2');
      let currentActive = '';
      headings.forEach((h) => {
        const rect = h.getBoundingClientRect();
        if (rect.top <= 160) {
          currentActive = h.id || h.textContent || '';
        }
      });
      if (currentActive) {
        setActiveTocId(currentActive);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Extract Table of Contents items from rendered content
  const tocItems = useMemo<TocItem[]>(() => {
    if (!post) return [];
    const div = document.createElement('div');
    div.innerHTML = post.content;
    const h2Elements = div.querySelectorAll('h2');
    return Array.from(h2Elements).map((h, i) => {
      const text = h.textContent || `Section ${i + 1}`;
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return { id, text };
    });
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const relatedPosts = getBlogPostsByCategory(post.category)
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: 'KDP Studio Editorial Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'KDP Studio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kdpstudio-aio.web.app/og-image.png',
      },
    },
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const scrollToSection = (id: string) => {
    const headings = document.querySelectorAll('.prose-custom h2');
    headings.forEach((h) => {
      const headingId = (h.textContent || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (headingId === id || h.textContent === id) {
        const top = h.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  };

  return (
    <div className="w-full bg-[#fdfdfd] text-slate-900 font-sans min-h-screen">
      {/* ── Fixed Reading Progress Bar ── */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-slate-100 z-50">
        <div
          className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <SEOHead
        title={`${post.title} — KDP Studio Blog`}
        description={post.description}
        canonicalPath={`/blog/${post.slug}`}
        ogType="article"
      />
      <JsonLd id="jsonld-article" data={articleSchema} />

      {/* ── Breadcrumb Bar ── */}
      <div className="border-b border-slate-200/80 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs text-slate-500">
          <nav className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-purple-600 font-medium transition-colors cursor-pointer"
            >
              Home
            </button>
            <ChevronRight size={13} className="text-slate-400 shrink-0" />
            <button
              onClick={() => onNavigate('blog')}
              className="hover:text-purple-600 font-medium transition-colors cursor-pointer"
            >
              Blog
            </button>
            <ChevronRight size={13} className="text-slate-400 shrink-0" />
            <span className="text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-md">
              {post.category}
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-mono text-[11px] text-slate-400 font-semibold">
              {scrollProgress}% READ
            </span>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24">
        
        {/* ── Article Header (Hero) ── */}
        <header className="max-w-3xl mx-auto xl:max-w-none xl:mx-0 pb-10 border-b border-slate-200/80 space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold tracking-wide uppercase">
              {post.category}
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
              <Clock size={13} className="text-purple-500" /> {post.readTime}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-xs font-medium">
              Updated {post.date}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.18]">
            {post.title}
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
            {post.description}
          </p>

          {/* Author info & tags */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-sm">
                ✍️
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 leading-tight">
                  {post.author}
                </div>
                <div className="text-xs text-slate-500">
                  Publishing Research & Strategy Desk
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* ── 2-Column Editorial Layout ── */}
        <div className="pt-10 flex flex-col xl:flex-row items-start justify-between gap-12">
          
          {/* ── Main Article Reader Column ── */}
          <main className="max-w-[720px] mx-auto xl:mx-0 w-full min-w-0">
            
            {/* Formatted Markdown Prose */}
            <article
              className="prose-custom"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* ── In-Article High-Converting CTA Card ── */}
            <div className="my-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0f0f1a] via-[#1e1b4b] to-[#121226] text-white shadow-2xl border border-purple-500/40 relative overflow-hidden space-y-5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles size={14} className="text-purple-400" />
                  <span>KDP Publishing Automation</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Launch your next bestselling book in minutes
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                  KDP Studio automatically writes chapters with Gemini AI, formats 300 DPI print-ready interiors, creates cover spreads, and extracts top Amazon keywords.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => onNavigate('signup')}
                    className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-purple-900/50 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Start Free — 1 Book Included</span>
                    <ArrowRight size={16} />
                  </button>
                  <span className="text-xs text-slate-400">No credit card required</span>
                </div>
              </div>
            </div>

            {/* ── Author Bio Box ── */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-sm">
                📚
              </div>
              <div className="space-y-1.5">
                <div className="font-bold text-sm text-slate-900">
                  Published by KDP Studio Editorial Desk
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We empower indie authors and self-publishers with automated AI generation, exact Amazon KDP trim calculations, and actionable niche analytics to scale profitable digital publishing catalogs.
                </p>
              </div>
            </div>

          </main>

          {/* ── Sticky Sidebar on Desktop ── */}
          <aside className="w-80 shrink-0 sticky top-20 self-start space-y-6 hidden xl:block">
            
            {/* Table of Contents Box */}
            {tocItems.length > 0 && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Layers size={14} className="text-purple-600" />
                  <span>Table of Contents</span>
                </div>
                <nav className="space-y-2">
                  {tocItems.map((item, idx) => {
                    const isActive = activeTocId === item.id || activeTocId === item.text;
                    return (
                      <button
                        key={idx}
                        onClick={() => scrollToSection(item.id)}
                        className={`block text-left w-full text-xs transition-all leading-snug py-1 cursor-pointer truncate ${
                          isActive
                            ? 'font-bold text-purple-600 pl-2 border-l-2 border-purple-600'
                            : 'text-slate-600 hover:text-slate-900 font-medium pl-0'
                        }`}
                      >
                        {item.text}
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Social Share Card */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Share this article
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:text-purple-600 transition-colors shadow-xs"
                >
                  <Twitter size={15} />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:text-purple-600 transition-colors shadow-xs"
                >
                  <Linkedin size={15} />
                </a>
              </div>
            </div>

            {/* Free Trial Mini Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900 text-white space-y-3 shadow-lg">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">
                Build with AI
              </span>
              <h4 className="font-bold text-sm text-white leading-snug">
                Write, Format & Publish Your KDP Book Today
              </h4>
              <p className="text-[11px] text-purple-100 leading-relaxed">
                Generate high-converting covers, interiors, and descriptions in 20 minutes.
              </p>
              <button
                onClick={() => onNavigate('signup')}
                className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Try KDP Studio Free →
              </button>
            </div>

          </aside>

        </div>

        {/* ── Related Articles ── */}
        {relatedPosts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-slate-200 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Recommended Reading
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  More tactical publishing guides from our editorial library
                </p>
              </div>
              <button
                onClick={() => onNavigate('blog')}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View all articles</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <div
                  key={rel.slug}
                  onClick={() => onSelectPost(rel.slug)}
                  className="p-6 rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all cursor-pointer bg-white space-y-4 flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {rel.category}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {rel.readTime}
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-slate-900 group-hover:text-purple-600 transition-colors leading-snug">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {rel.description}
                    </p>
                  </div>
                  <div className="text-xs text-purple-600 font-bold flex items-center gap-1 pt-2 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
                    <span>Read Guide</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
