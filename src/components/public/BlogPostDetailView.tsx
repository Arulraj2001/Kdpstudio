'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ArrowLeft, ArrowRight, Share2, Sparkles, BookOpen, Check } from 'lucide-react';
import { PageRoute } from '../../types';
import { SEOHead } from '../seo/SEOHead';
import { JsonLd } from '../seo/JsonLd';
import { getBlogPost, getBlogPostsByCategory, getAllBlogPosts, BlogPost } from '../../lib/blog';

interface BlogPostDetailViewProps {
  slug: string;
  onNavigate: (route: PageRoute) => void;
  onSelectPost: (slug: string) => void;
}

export const BlogPostDetailView: React.FC<BlogPostDetailViewProps> = ({ slug, onNavigate, onSelectPost }) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const found = getBlogPost(slug) || getAllBlogPosts()[0];
    setPost(found);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      name: 'KDP Studio',
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

  return (
    <div className="w-full bg-white text-slate-900 font-sans relative">
      {/* ── Fixed Reading Progress Bar ── */}
      <div
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-purple-600 to-indigo-600 z-50 transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />

      <SEOHead
        title={post.title}
        description={post.description}
        canonicalPath={`/blog/${post.slug}`}
        ogType="article"
      />
      <JsonLd id="jsonld-article" data={articleSchema} />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 space-y-12">
        
        {/* Back Link */}
        <div>
          <button
            onClick={() => onNavigate('blog')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-purple-600 hover:text-purple-700 cursor-pointer group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to all articles</span>
          </button>
        </div>

        {/* ── Article Header ── */}
        <header className="space-y-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider border border-purple-200">
            <span>{post.category}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {post.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-slate-500 font-medium border-y border-slate-100 py-3">
            <span>By <strong className="text-slate-900">{post.author}</strong></span>
            <span>•</span>
            <span>Published on {post.date}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> {post.readTime}
            </span>
            <span>•</span>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-bold cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-600">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </header>

        {/* ── Article Content with Custom Prose Styling ── */}
        <div className="max-w-[700px] mx-auto text-slate-800 leading-relaxed text-base sm:text-lg space-y-6">
          <div
            className="prose-custom space-y-6"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* ── In-Article High-Converting CTA Box ── */}
          <div className="my-10 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-purple-500/30 space-y-4">
            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={16} />
              <span>Amazon KDP Publishing Made Simple</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              Want to publish your own bestselling KDP book?
            </h3>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              KDP Studio handles AI chapter writing, automated gutter margins, 300 DPI cover spreads, and keyword optimization — all in one tool.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('signup')}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-bold text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Try KDP Studio Free</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Author Box ── */}
        <div className="max-w-[700px] mx-auto p-6 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">
            📚
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-900">Written by KDP Studio Team</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              We help self-publishers and authors create, format, and scale profitable book businesses on Amazon KDP using artificial intelligence and automated print layout algorithms.
            </p>
          </div>
        </div>

        {/* ── Related Posts ── */}
        {relatedPosts.length > 0 && (
          <div className="max-w-4xl mx-auto pt-10 border-t border-slate-200 space-y-6">
            <h3 className="text-2xl font-bold text-slate-900">You might also like</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <div
                  key={rel.slug}
                  onClick={() => onSelectPost(rel.slug)}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer bg-white space-y-3 flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      {rel.category}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors leading-snug">
                      {rel.title}
                    </h4>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>{rel.readTime}</span>
                    <span className="text-purple-600 font-bold group-hover:translate-x-0.5 transition-transform">Read →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </article>
    </div>
  );
};
