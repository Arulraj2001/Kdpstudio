'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Share2,
  Sparkles,
  Check,
  ChevronRight,
  Bookmark,
  Twitter,
  Linkedin,
  Globe,
  BookOpen,
  Layers,
  ShieldCheck,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  ListOrdered,
  HelpCircle,
  Flame,
} from 'lucide-react';
import { PageRoute } from '../../types';
import { BlogPost, BlogAuthor, BlogTocItem, AdConfig } from '../../types/blog';
import { SEOHead } from '../seo/SEOHead';
import { JsonLd } from '../seo/JsonLd';
import { AdSlot } from '../blog/AdSlot';
import { SocialShare } from '../blog/SocialShare';
import { SubscribeInline } from '../blog/SubscribeInline';
import { injectAdMarkers } from '../../lib/injectAds';
import { generateTableOfContents, countWords, calculateReadingTime } from '../../lib/blogUtils';
import { getBlogPost, getAllBlogPosts } from '../../lib/blog';

interface BlogPostDetailViewProps {
  slug: string;
  onNavigate: (route: PageRoute) => void;
  onSelectPost: (slug: string) => void;
}

export const BlogPostDetailView: React.FC<BlogPostDetailViewProps> = ({
  slug,
  onNavigate,
  onSelectPost,
}) => {
  const [post, setPost] = useState<BlogPost | any>(null);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTocId, setActiveTocId] = useState<string>('');
  const [isTocOpen, setIsTocOpen] = useState<boolean>(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showExitPopup, setShowExitPopup] = useState<boolean>(false);

  const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'true';

  // ── Fetch Post Data & Ad Configuration ──
  useEffect(() => {
    let isMounted = true;
    const initialSeed = getBlogPost(slug) || getAllBlogPosts()[0];
    setPost(initialSeed);
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Fetch ad settings
    fetch('/api/blog/ads')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.config) {
          setAdConfig(data.config);
        }
      })
      .catch(() => {});

    // Fetch all posts for related posts & sidebar
    fetch('/api/blog/posts')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data?.posts)) {
          setAllPosts(data.posts);
        }
      })
      .catch(() => {});

    // Fetch specific post from Firestore
    const fetchUrl = isPreview ? `/api/blog/posts/${slug}?preview=true` : `/api/blog/posts/${slug}`;
    fetch(fetchUrl)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.post) {
          setPost(data.post);
          // Only increment view count in production/live mode, not in preview
          if (data.post.id && !isPreview) {
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
  }, [slug, isPreview]);

  // ── Scroll Progress & Active Heading Tracker ──
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, Math.round(progress))));
      }

      // Track active TOC section
      const headings = document.querySelectorAll('.blog-content h2, .blog-content h3');
      let currentActive = '';
      headings.forEach((h) => {
        const rect = h.getBoundingClientRect();
        if (rect.top <= 180) {
          currentActive = h.id || '';
        }
      });
      if (currentActive) {
        setActiveTocId(currentActive);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Exit-Intent Popup Detection (Desktop Only, 30s Dwell) ──
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < 1024) return;
    const isSubscribed = localStorage.getItem('kdp_newsletter_subscribed');
    const dismissedAt = localStorage.getItem('kdp_exit_popup_dismissed');
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    if (isSubscribed || (dismissedAt && Date.now() - Number(dismissedAt) < sevenDaysMs)) {
      return;
    }

    let isEligible = false;
    const timer = setTimeout(() => {
      isEligible = true;
    }, 30000); // 30s dwell time

    const handleMouseLeave = (e: MouseEvent) => {
      if (isEligible && e.clientY <= 5) {
        setShowExitPopup(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // ── Extract Table of Contents items ──
  const tocItems = useMemo<BlogTocItem[]>(() => {
    if (!post?.content) return [];
    if (post.tableOfContents && post.tableOfContents.length > 0) {
      return post.tableOfContents;
    }
    return generateTableOfContents(post.content);
  }, [post?.content, post?.tableOfContents]);

  // ── Inject In-Article Ad Chunks ──
  const contentChunks = useMemo<string[]>(() => {
    if (!post?.content) return [];
    const wordCount = post.wordCount || countWords(post.content);
    return injectAdMarkers(post.content, wordCount);
  }, [post?.content, post?.wordCount]);

  // ── Related Posts in Same Category ──
  const relatedPosts = useMemo<BlogPost[]>(() => {
    if (!post) return [];
    const sourceList = allPosts.length > 0 ? allPosts : (getAllBlogPosts() as any);
    return sourceList
      .filter((p: any) => p.slug !== post.slug && (p.category === post.category || !post.category))
      .slice(0, 3);
  }, [post, allPosts]);

  if (!post) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-12 h-12 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Loading publishing guide...</h2>
      </div>
    );
  }

  const postTitle = post.title || 'KDP Publishing Guide';
  const postDesc = post.metaDescription || post.excerpt || post.description || '';
  const postCategory = post.category || 'Publishing Strategy';
  const authorName = post.authorName || 'KDP Studio Team';
  const authorCreds = post.authorCredentials || 'KDP Publishing Specialist';
  const authorBio = post.authorBio || post.authorShortBio || `${authorName} specializes in high-earning Amazon KDP book publishing strategies.`;
  const postWords = post.wordCount || countWords(post.content || '');
  const readTime = post.readingTimeMinutes || calculateReadingTime(post.content || '');
  const coverUrl = post.featuredImage?.url || post.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80';
  const coverAlt = post.featuredImage?.alt || postTitle;
  const coverCaption = post.featuredImage?.caption || '';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: postTitle,
        text: postDesc,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // ── JSON-LD Structured Data Schema Markup ──
  const articleSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': post.schemaType || 'Article',
    headline: postTitle,
    description: postDesc,
    datePublished: post.publishedAt || post.date || new Date().toISOString(),
    dateModified: post.updatedAt || post.publishedAt || new Date().toISOString(),
    dateReviewed: post.lastReviewedAt || null,
    reviewedBy: post.reviewedBy ? {
      '@type': 'Person',
      name: post.reviewedBy,
    } : undefined,
    author: {
      '@type': 'Person',
      name: authorName,
      description: authorCreds,
      url: `https://kdpstudio-aio.web.app/blog`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'KDP Studio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kdpstudio-aio.web.app/icons/icon-512x512.png',
      },
    },
    image: {
      '@type': 'ImageObject',
      url: coverUrl,
      width: 1200,
      height: 630,
      description: coverAlt,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://kdpstudio-aio.web.app/blog/${post.slug}`,
    },
    wordCount: postWords,
    timeRequired: `PT${readTime}M`,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'Blog',
      name: 'KDP Studio Blog',
      url: 'https://kdpstudio-aio.web.app/blog',
    },
    citation: post.sources?.map((s: any) => ({
      '@type': 'CreativeWork',
      name: s.title,
      url: s.url,
    })) || [],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kdpstudio-aio.web.app' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://kdpstudio-aio.web.app/blog' },
      { '@type': 'ListItem', position: 3, name: postCategory, item: `https://kdpstudio-aio.web.app/blog?category=${encodeURIComponent(postCategory)}` },
      { '@type': 'ListItem', position: 4, name: postTitle, item: `https://kdpstudio-aio.web.app/blog/${post.slug}` },
    ],
  };

  const faqSchema = post.faqItems && post.faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqItems.map((faq: any) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  return (
    <div className="w-full bg-[#fcfcfd] text-slate-900 font-sans min-h-screen">
      {/* ── Fixed Reading Progress Bar ── */}
      <div className="fixed top-0 left-0 w-full h-[3.5px] bg-slate-100 z-50">
        <div
          className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ── Preview Mode Banner (for Admin verification) ── */}
      {isPreview && (
        <div className="bg-amber-500 text-slate-950 font-bold text-xs py-2.5 px-4 text-center sticky top-0 z-40 shadow-md flex items-center justify-center gap-2">
          <span>⚠️ PREVIEW MODE</span>
          <span className="font-medium">
            — This post is not published yet. Views are not counted and search indexing is blocked.
          </span>
        </div>
      )}

      {/* ── SEO Metadata & Structured Data ── */}
      <SEOHead
        title={`${post.metaTitle || postTitle} | KDP Studio Blog`}
        description={postDesc}
        canonicalPath={`/blog/${post.slug}`}
        ogType="article"
        noindex={isPreview || Boolean(post.noIndex)}
      />
      <JsonLd id="jsonld-article" data={articleSchema} />
      <JsonLd id="jsonld-breadcrumb" data={breadcrumbSchema} />
      {faqSchema && <JsonLd id="jsonld-faq" data={faqSchema} />}

      {/* ── Breadcrumb Header Bar ── */}
      <div className="border-b border-slate-200/80 bg-white sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
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
            <span className="text-purple-700 font-semibold truncate">{postCategory}</span>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-purple-600 bg-slate-100 hover:bg-purple-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              title="Share article"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span>{copied ? 'Copied Link!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Article & Sticky Sidebar Layout ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* ─────────────────────────────────────────
              MAIN CONTENT COLUMN (65% / 8 cols)
             ───────────────────────────────────────── */}
          <article className="lg:col-span-8 space-y-8">
            
            {/* Category & EEAT Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                {postCategory}
              </span>

              {post.isExpertReviewed && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
                  title="This article was reviewed by a publishing expert for accuracy"
                >
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Expert Reviewed {post.reviewedBy ? `by ${post.reviewedBy}` : ''}</span>
                </span>
              )}
            </div>

            {/* Post Title (H1, Large Serif) */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] font-serif">
              {postTitle}
            </h1>

            {/* Subtitle / Excerpt */}
            {postDesc && (
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
                {postDesc}
              </p>
            )}

            {/* Author Byline & Meta Info */}
            <div className="flex items-center gap-3.5 py-4 border-y border-slate-200/80 text-xs text-slate-600">
              <div className="w-11 h-11 rounded-full bg-purple-100 border border-purple-200 overflow-hidden shrink-0 flex items-center justify-center">
                {post.authorPhotoUrl ? (
                  <img src={post.authorPhotoUrl} alt={authorName} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-purple-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{authorName}</span>
                  <span className="text-slate-400 font-normal">•</span>
                  <span className="text-slate-500 font-medium">{authorCreds}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-slate-400 mt-0.5 text-[11px]">
                  <span>Published {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</span>
                  <span>•</span>
                  <span>{readTime} min read</span>
                  <span>•</span>
                  <span>{postWords.toLocaleString()} words</span>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md">
              <img
                src={coverUrl}
                alt={coverAlt}
                className="w-full aspect-[16/9] object-cover"
                loading="eager"
              />
              {coverCaption && (
                <div className="p-2.5 bg-slate-50 text-[11px] text-slate-500 text-center italic border-t border-slate-200/60">
                  {coverCaption}
                </div>
              )}
            </div>

            {/* Header Ad Slot */}
            <AdSlot positionId="header" adConfig={adConfig} postWordCount={postWords} />

            {/* Collapsible Table of Contents Box */}
            {tocItems.length >= 2 && (
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 shadow-2xs space-y-3">
                <button
                  onClick={() => setIsTocOpen(!isTocOpen)}
                  className="w-full flex items-center justify-between font-extrabold text-sm text-slate-900 uppercase tracking-wider cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span>📋</span>
                    <span>In This Article</span>
                    <span className="text-xs text-purple-600 lowercase font-normal">({tocItems.length} topics)</span>
                  </div>
                  {isTocOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isTocOpen && (
                  <ol className="space-y-2 pt-2 border-t border-slate-200/60 text-xs sm:text-sm text-slate-700">
                    {tocItems.map((item, idx) => (
                      <li
                        key={item.id || idx}
                        style={{ paddingLeft: `${(item.level - 2) * 16}px` }}
                        className="leading-snug"
                      >
                        <a
                          href={`#${item.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            scrollToHeading(item.id);
                          }}
                          className={`hover:text-purple-600 transition-colors flex items-start gap-2 ${
                            activeTocId === item.id ? 'text-purple-700 font-bold' : ''
                          }`}
                        >
                          <span className="text-slate-400 font-mono text-xs">{idx + 1}.</span>
                          <span>{item.text}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {/* ── Article Content with In-Article Ad Placements ── */}
            <div className="blog-content prose-custom text-slate-800 space-y-6 text-[17px] sm:text-[18px] leading-[1.8]">
              {contentChunks.map((chunk, i) => (
                <React.Fragment key={i}>
                  <div dangerouslySetInnerHTML={{ __html: chunk }} />

                  {/* Ad 1 (at ~300 words) */}
                  {i === 0 && contentChunks.length > 1 && (
                    <AdSlot positionId="in-article-1" adConfig={adConfig} postWordCount={postWords} />
                  )}

                  {/* Ad 2 (at ~60% mark) */}
                  {i === Math.floor(contentChunks.length / 2) && contentChunks.length > 2 && (
                    <AdSlot positionId="in-article-2" adConfig={adConfig} postWordCount={postWords} />
                  )}

                  {/* Ad 3 (at ~85% mark for long-form) */}
                  {i === contentChunks.length - 2 && contentChunks.length >= 4 && (
                    <AdSlot positionId="in-article-3" adConfig={adConfig} postWordCount={postWords} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* ── EEAT Sources & Citations Box ── */}
            {post.sources && post.sources.length > 0 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-purple-50/40 border border-purple-200/80 shadow-2xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-2">
                  <span>📚</span>
                  <span>Sources & Verified References</span>
                </h3>
                <ol className="space-y-2 text-xs text-slate-700">
                  {post.sources.map((src: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-purple-600 font-bold">[{idx + 1}]</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-900">{src.title}</span>
                        {src.publisher && <span className="text-slate-500"> — {src.publisher}</span>}
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1.5 text-purple-700 hover:underline inline-flex items-center gap-0.5 font-medium"
                          >
                            <span>↗ Source Link</span>
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Last Reviewed Notice */}
            {post.lastReviewedAt && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-purple-600" />
                  <span>
                    Last reviewed for accuracy: <strong>{new Date(post.lastReviewedAt).toLocaleDateString()}</strong>
                    {post.reviewedBy ? ` by ${post.reviewedBy}` : ''}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 hidden sm:inline">Regularly updated for Amazon KDP standards</span>
              </div>
            )}

            {/* ── Large Author Box ── */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-20 h-20 rounded-full bg-purple-100 border-2 border-purple-300 overflow-hidden shrink-0 flex items-center justify-center">
                {post.authorPhotoUrl ? (
                  <img src={post.authorPhotoUrl} alt={authorName} className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-purple-600" />
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">{authorName}</h4>
                    <p className="text-xs text-purple-700 font-bold">{authorCreds}</p>
                  </div>
                  {post.authorLinkedinUrl || post.authorTwitterUrl ? (
                    <div className="flex items-center justify-center sm:justify-end gap-2 text-slate-400">
                      {post.authorLinkedinUrl && (
                        <a href={post.authorLinkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">
                          <Linkedin size={15} />
                        </a>
                      )}
                      {post.authorTwitterUrl && (
                        <a href={post.authorTwitterUrl} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">
                          <Twitter size={15} />
                        </a>
                      )}
                    </div>
                  ) : null}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {authorBio}
                </p>

                {post.authorExpertise && post.authorExpertise.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 justify-center sm:justify-start">
                    {post.authorExpertise.map((exp: string) => (
                      <span key={exp} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {exp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── FAQ Section (if FAQ items configured) ── */}
            {post.faqItems && post.faqItems.length > 0 && (
              <div className="space-y-4 pt-6">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <HelpCircle className="text-purple-600" />
                  <span>Frequently Asked Questions</span>
                </h3>

                <div className="space-y-2.5">
                  {post.faqItems.map((faq: any, idx: number) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all"
                      >
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full p-4 text-left font-bold text-sm sm:text-base text-slate-900 flex items-center justify-between gap-3 cursor-pointer hover:text-purple-600"
                        >
                          <span>{faq.question}</span>
                          {isOpen ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Newsletter Subscribe Card ── */}
            <div className="pt-4">
              <SubscribeInline
                source="blog-post"
                tags={[postCategory, ...(post.tags || [])]}
                variant="card"
              />
            </div>

            {/* ── Related Posts Section ── */}
            {relatedPosts.length > 0 && (
              <div className="space-y-4 pt-8 border-t border-slate-200/80">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  You Might Also Like
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedPosts.map((rPost: any) => (
                    <div
                      key={rPost.slug || rPost.id}
                      onClick={() => onSelectPost(rPost.slug)}
                      className="group p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer space-y-2 flex flex-col justify-between"
                    >
                      <div className="aspect-[16/10] rounded-xl bg-slate-100 overflow-hidden">
                        <img
                          src={rPost.featuredImage?.url || rPost.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'}
                          alt={rPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                          {rPost.category || 'Strategy'}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-purple-600 line-clamp-2 leading-snug">
                          {rPost.title}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {rPost.readingTimeMinutes || 5} min read
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Between Posts & Footer Ad Slots */}
            <AdSlot positionId="between-posts" adConfig={adConfig} postWordCount={postWords} />
            <AdSlot positionId="footer" adConfig={adConfig} postWordCount={postWords} />
          </article>

          {/* ─────────────────────────────────────────
              SIDEBAR COLUMN (35% / 4 cols - Desktop Sticky)
             ───────────────────────────────────────── */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6 sticky top-20">
            
            {/* Sticky Mini TOC */}
            {tocItems.length >= 2 && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <ListOrdered size={14} className="text-purple-600" />
                  <span>Table of Contents</span>
                </h4>
                <div className="space-y-1.5 text-xs max-h-60 overflow-y-auto pr-1">
                  {tocItems.map((item, idx) => (
                    <a
                      key={item.id || idx}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToHeading(item.id);
                      }}
                      className={`block py-1 px-2 rounded-lg transition-colors truncate ${
                        activeTocId === item.id
                          ? 'bg-purple-50 text-purple-700 font-bold border-l-2 border-purple-600'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Sidebar Ad Slot */}
            <AdSlot positionId="sidebar" adConfig={adConfig} postWordCount={postWords} />

            {/* Sidebar Newsletter Minimal Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-800">
                📬 Free KDP Tips
              </span>
              <p className="text-xs text-slate-600">
                Join our newsletter for weekly niche analysis and publishing tutorials.
              </p>
              <SubscribeInline source="sidebar" variant="minimal" />
            </div>

            {/* Compact Author Summary */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-purple-100 overflow-hidden shrink-0">
                  {post.authorPhotoUrl ? (
                    <img src={post.authorPhotoUrl} alt={authorName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} className="text-purple-600 m-2" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{authorName}</div>
                  <div className="text-[10px] text-slate-500">{authorCreds}</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                {authorBio}
              </p>
            </div>

            {/* CTA Box */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl space-y-3 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/20 rounded-full blur-xl" />
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                Publish Faster
              </span>
              <h4 className="text-base font-black tracking-tight leading-snug">
                Publish Profitable KDP Books in Minutes with AI
              </h4>
              <p className="text-xs text-purple-200/80 leading-relaxed">
                Generate 300 DPI puzzle interiors, custom spine covers, and keyword niches automatically.
              </p>
              <button
                onClick={() => onNavigate('signup')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95"
              >
                Start Free Trial →
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Sticky Left Sidebar on Desktop & Fixed Bottom Bar on Mobile ── */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-30 hidden xl:block">
        <SocialShare
          postId={post?.id}
          url={typeof window !== 'undefined' ? window.location.href : `https://kdpstudio-aio.web.app/blog/${post?.slug}`}
          title={postTitle}
          excerpt={postDesc}
          tags={post?.tags || []}
          initialShareCount={post?.shareCount || 0}
        />
      </div>

      {/* Mobile Floating Share Bar */}
      <div className="xl:hidden">
        <SocialShare
          postId={post?.id}
          url={typeof window !== 'undefined' ? window.location.href : `https://kdpstudio-aio.web.app/blog/${post?.slug}`}
          title={postTitle}
          excerpt={postDesc}
          tags={post?.tags || []}
          initialShareCount={post?.shareCount || 0}
        />
      </div>

      {/* ── Exit-Intent Popup (Desktop Only) ── */}
      {showExitPopup && (
        <SubscribeInline
          source="blog-exit-popup"
          variant="popup"
          onClosePopup={() => {
            setShowExitPopup(false);
            if (typeof window !== 'undefined') {
              localStorage.setItem('kdp_exit_popup_dismissed', String(Date.now()));
            }
          }}
        />
      )}
    </div>
  );
};
