/**
 * KDP Studio — Site-Wide SEO Management Service
 * 
 * Provides real-time dynamic SEO configuration synced with Firestore (appConfig/seoSettings).
 * Supports page-by-page title, meta descriptions, target keywords, OpenGraph images,
 * robots index/noindex directives, XML sitemap weights, and global search engine verification tokens.
 */

import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface PageSEOConfig {
  pageKey: string;
  route: string;
  pageName: string;
  category: 'marketing' | 'tool' | 'legal' | 'content';
  title: string;
  description: string;
  keywords: string[];
  canonicalPath: string;
  ogImage: string;
  ogType: 'website' | 'article' | 'product';
  noindex: boolean;
  sitemapPriority: number; // 0.1 to 1.0
  sitemapChangeFreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  customHeadTags?: string;
}

export interface GlobalSEOConfig {
  version: number;
  updatedAt: string;
  updatedBy: string;
  siteName: string;
  titleTemplate: string; // e.g. "%s | KDP Studio"
  defaultDescription: string;
  defaultKeywords: string[];
  defaultOgImage: string;
  twitterHandle: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  yandexVerification?: string;
  globalHeadScripts?: string;
  pages: Record<string, PageSEOConfig>;
}

// Canonical Default SEO Configuration for All Pages
export const CANONICAL_DEFAULT_SEO: GlobalSEOConfig = {
  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
  siteName: 'KDP Studio',
  titleTemplate: '%s | KDP Studio',
  defaultDescription: 'The complete AI self-publishing suite for Amazon KDP. Write manuscripts with Gemini 2.0, generate 300 DPI wrap covers, typeset print interiors, and build puzzle books.',
  defaultKeywords: [
    'Amazon KDP publishing tool',
    'AI book generator',
    'AI self-publishing studio',
    'KDP interior formatter',
    'KDP cover generator 300 DPI',
    'puzzle book creator software',
    'KDP keyword research tool'
  ],
  defaultOgImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
  twitterHandle: '@kdpstudio',
  googleSiteVerification: '',
  bingSiteVerification: '',
  yandexVerification: '',
  globalHeadScripts: '',
  pages: {
    home: {
      pageKey: 'home',
      route: '/',
      pageName: 'Home Page',
      category: 'marketing',
      title: 'KDP Studio — The Complete AI Self-Publishing Studio for Amazon KDP',
      description: 'From idea to upload-ready book. Write manuscripts with Gemini 2.0, generate 300 DPI wrap covers, format print interiors, and build low-content puzzle books. Start free.',
      keywords: ['Amazon KDP publishing tool', 'AI book generator', 'AI self-publishing studio', 'KDP cover generator', 'create KDP books with AI'],
      canonicalPath: '/',
      ogImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: false,
      sitemapPriority: 1.0,
      sitemapChangeFreq: 'daily'
    },
    features: {
      pageKey: 'features',
      route: '/features',
      pageName: 'Features Deep Dive',
      category: 'marketing',
      title: 'Features — AI Writing, Interior Formatter, Cover Designer & Puzzle Engine | KDP Studio',
      description: 'Explore the full suite of KDP Studio capabilities: Gemini 2.0 manuscript studio, 100% gutter-safe print interior formatter, 300 DPI wrap cover generator, and puzzle maker.',
      keywords: ['KDP interior formatter', 'KDP spine width calculator', 'puzzle book creator software', 'AI manuscript generator', 'Amazon KDP margin calculator'],
      canonicalPath: '/features',
      ogImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
      ogType: 'article',
      noindex: false,
      sitemapPriority: 0.9,
      sitemapChangeFreq: 'weekly'
    },
    pricing: {
      pageKey: 'pricing',
      route: '/pricing',
      pageName: 'Pricing & Plans',
      category: 'marketing',
      title: 'Pricing & Plans — Transparent Plans with 15 Daily Free Credits | KDP Studio',
      description: 'Simple, transparent self-publishing pricing. Start free with 15 daily AI credits, 5 puzzle generations, and 3 book projects. Pro & Agency plans with unlimited AI writing.',
      keywords: ['KDP software pricing', 'free KDP publishing tools', 'BookBolt alternative pricing', 'KDP Studio plans', 'Amazon self publishing cost'],
      canonicalPath: '/pricing',
      ogImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: false,
      sitemapPriority: 0.9,
      sitemapChangeFreq: 'weekly'
    },
    blog: {
      pageKey: 'blog',
      route: '/blog',
      pageName: 'Blog & Guides Hub',
      category: 'content',
      title: 'Amazon KDP Publishing Blog & Strategy Guides | KDP Studio',
      description: 'Actionable Amazon KDP guides, low-content niche strategies, formatting tutorials, and AI publishing case studies written by self-publishing veterans.',
      keywords: ['Amazon KDP publishing guides', 'how to publish on KDP', 'low content book tutorials', 'KDP SEO tips', 'Amazon bestseller strategy'],
      canonicalPath: '/blog',
      ogImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: false,
      sitemapPriority: 0.8,
      sitemapChangeFreq: 'daily'
    },
    about: {
      pageKey: 'about',
      route: '/about',
      pageName: 'About Us',
      category: 'marketing',
      title: 'About KDP Studio — Empowering Independent Authors & Publishers Worldwide',
      description: 'Learn about KDP Studio\'s mission: democratizing self-publishing through cutting-edge Google Gemini AI, precision typesetting math, and publisher-first tooling.',
      keywords: ['about KDP Studio', 'AI self-publishing platform team', 'KDP author software mission'],
      canonicalPath: '/about',
      ogImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: false,
      sitemapPriority: 0.7,
      sitemapChangeFreq: 'monthly'
    },
    contact: {
      pageKey: 'contact',
      route: '/contact',
      pageName: 'Contact & Support',
      category: 'marketing',
      title: 'Contact Support & Author Help Desk | KDP Studio',
      description: 'Need help formatting a book or have questions about your KDP Studio account? Reach out to our dedicated author support desk. We respond within 24 hours.',
      keywords: ['KDP Studio customer support', 'contact KDP Studio', 'publishing support desk'],
      canonicalPath: '/contact',
      ogImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: false,
      sitemapPriority: 0.6,
      sitemapChangeFreq: 'monthly'
    },
    terms: {
      pageKey: 'terms',
      route: '/terms',
      pageName: 'Terms of Service',
      category: 'legal',
      title: 'Terms of Service — 100% Royalty & Copyright Ownership | KDP Studio',
      description: 'Review our terms of service. KDP Studio guarantees 100% user ownership of all manuscripts, covers, and royalties with zero commission.',
      keywords: ['KDP Studio terms of service', 'self publishing terms', 'author copyright terms'],
      canonicalPath: '/terms',
      ogImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: false,
      sitemapPriority: 0.4,
      sitemapChangeFreq: 'yearly'
    },
    privacy: {
      pageKey: 'privacy',
      route: '/privacy',
      pageName: 'Privacy Policy',
      category: 'legal',
      title: 'Privacy Policy — GDPR & Author Data Protection | KDP Studio',
      description: 'Our privacy policy explains how we protect author manuscripts, account credentials, and personal data with enterprise encryption.',
      keywords: ['KDP Studio privacy policy', 'author data privacy', 'GDPR compliance'],
      canonicalPath: '/privacy',
      ogImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: false,
      sitemapPriority: 0.4,
      sitemapChangeFreq: 'yearly'
    },
    changelog: {
      pageKey: 'changelog',
      route: '/changelog',
      pageName: 'Product Changelog',
      category: 'marketing',
      title: 'Product Changelog & Feature Release Notes | KDP Studio',
      description: 'Explore the latest updates, AI model upgrades, new puzzle engines, and formatting enhancements shipped in KDP Studio.',
      keywords: ['KDP Studio changelog', 'new features update', 'AI publishing release notes'],
      canonicalPath: '/changelog',
      ogImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: false,
      sitemapPriority: 0.6,
      sitemapChangeFreq: 'weekly'
    },
    launch: {
      pageKey: 'launch',
      route: '/launch',
      pageName: 'Launch Edition Promotion',
      category: 'marketing',
      title: 'Special Launch Edition — Unlock Extra Daily AI Credits | KDP Studio',
      description: 'Join the KDP Studio official launch celebration. Claim bonus AI manuscript credits, free puzzle generations, and lifetime perks.',
      keywords: ['KDP Studio launch promo', 'early adopter self publishing credits', 'special launch offer'],
      canonicalPath: '/launch',
      ogImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: false,
      sitemapPriority: 0.7,
      sitemapChangeFreq: 'weekly'
    },
    // Tool and Dashboard Pages (Default noindex for private app pages)
    dashboard: {
      pageKey: 'dashboard',
      route: '/dashboard',
      pageName: 'Author Dashboard Hub',
      category: 'tool',
      title: 'Dashboard — Manage Books, Projects & Series | KDP Studio',
      description: 'Your central author command center. View book projects, manage chapter drafts, export files, and track publishing progress.',
      keywords: ['author dashboard', 'KDP project manager'],
      canonicalPath: '/dashboard',
      ogImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: true,
      sitemapPriority: 0.1,
      sitemapChangeFreq: 'monthly'
    },
    studio: {
      pageKey: 'studio',
      route: '/studio',
      pageName: 'AI Manuscript Studio',
      category: 'tool',
      title: 'AI Manuscript Studio — Gemini 2.0 Writing Suite | KDP Studio',
      description: 'Write, expand, outline, and polish full-length books with Google Gemini 2.0 Flash AI and voice consistency memory.',
      keywords: ['AI book writer', 'chapter generator', 'novel writing AI'],
      canonicalPath: '/studio',
      ogImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: true,
      sitemapPriority: 0.1,
      sitemapChangeFreq: 'monthly'
    },
    formatter: {
      pageKey: 'formatter',
      route: '/formatter',
      pageName: 'Interior Formatter & Typesetting',
      category: 'tool',
      title: 'Interior Formatter — Print-Ready PDF with Gutters & Bleed | KDP Studio',
      description: 'Format professional paperback and hardcover interiors with calculated gutter margins, ornamental headings, and drop caps.',
      keywords: ['book interior formatter', 'KDP PDF typesetter', 'gutter calculator'],
      canonicalPath: '/formatter',
      ogImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: true,
      sitemapPriority: 0.1,
      sitemapChangeFreq: 'monthly'
    },
    cover: {
      pageKey: 'cover',
      route: '/cover',
      pageName: 'Wrap Cover & Spine Designer',
      category: 'tool',
      title: 'Wrap Cover Designer — 300 DPI Spine Calculated Generator | KDP Studio',
      description: 'Design complete paperback wraps with front artwork, back blurb, barcode zone, and exact spine math for Amazon KDP.',
      keywords: ['KDP wrap cover maker', 'paperback spine calculator', 'AI book cover generator'],
      canonicalPath: '/cover',
      ogImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: true,
      sitemapPriority: 0.1,
      sitemapChangeFreq: 'monthly'
    },
    puzzles: {
      pageKey: 'puzzles',
      route: '/puzzles',
      pageName: 'Puzzle & Activity Suite',
      category: 'tool',
      title: 'Low-Content Puzzle Suite — Word Search, Sudoku & Coloring | KDP Studio',
      description: 'Generate high-demand puzzle and activity books in bulk with complete solution keys and 300 DPI vector line art.',
      keywords: ['puzzle book generator', 'word search maker', 'sudoku generator'],
      canonicalPath: '/puzzles',
      ogImage: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: true,
      sitemapPriority: 0.1,
      sitemapChangeFreq: 'monthly'
    },
    research: {
      pageKey: 'research',
      route: '/research',
      pageName: 'Amazon KDP Niche Research',
      category: 'tool',
      title: 'Amazon KDP Niche & Keyword Research Tool | KDP Studio',
      description: 'Find profitable Amazon KDP niches, analyze competition scores, estimate BSR royalties, and discover 7 backend keywords.',
      keywords: ['KDP niche research', 'Amazon keyword tool', 'BSR calculator'],
      canonicalPath: '/research',
      ogImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: true,
      sitemapPriority: 0.1,
      sitemapChangeFreq: 'monthly'
    },
    analytics: {
      pageKey: 'analytics',
      route: '/analytics',
      pageName: 'Royalty & Sales Analytics',
      category: 'tool',
      title: 'Royalty Calculator & BSR Analytics | KDP Studio',
      description: 'Calculate Amazon KDP printing costs, royalty payouts across Amazon marketplaces, and track your author publishing goals.',
      keywords: ['KDP royalty calculator', 'Amazon printing costs', 'author analytics'],
      canonicalPath: '/analytics',
      ogImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: true,
      sitemapPriority: 0.1,
      sitemapChangeFreq: 'monthly'
    },
    'brand-kit': {
      pageKey: 'brand-kit',
      route: '/brand-kit',
      pageName: 'Author Brand Kit',
      category: 'tool',
      title: 'Author Brand Kit & Style Guide | KDP Studio',
      description: 'Save custom fonts, color palettes, author pen names, and imprint logos to keep your entire book catalog cohesive.',
      keywords: ['author brand kit', 'book typography presets', 'pen name branding'],
      canonicalPath: '/brand-kit',
      ogImage: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80',
      ogType: 'website',
      noindex: true,
      sitemapPriority: 0.1,
      sitemapChangeFreq: 'monthly'
    }
  }
};

// In-Memory Real-Time State with LocalStorage Fallback
let inMemorySEOConfig: GlobalSEOConfig | null = (() => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('kdp_dynamic_seo_config');
      if (cached) return JSON.parse(cached);
    } catch {}
  }
  return null;
})();

let isSubscribed = false;

/**
 * Initialize real-time Firestore synchronization for SEO configuration
 */
export function initSEOSubscription(): () => void {
  if (isSubscribed || typeof window === 'undefined') {
    return () => {};
  }

  try {
    const configDocRef = doc(db, 'appConfig', 'seoSettings');
    isSubscribed = true;

    const unsubscribe = onSnapshot(
      configDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as GlobalSEOConfig;
          inMemorySEOConfig = {
            ...CANONICAL_DEFAULT_SEO,
            ...data,
            pages: {
              ...CANONICAL_DEFAULT_SEO.pages,
              ...(data.pages || {})
            }
          };
          try {
            localStorage.setItem('kdp_dynamic_seo_config', JSON.stringify(inMemorySEOConfig));
          } catch {}
        } else {
          inMemorySEOConfig = CANONICAL_DEFAULT_SEO;
        }
      },
      (err) => {
        console.warn('[SEO Service] Failed to sync Firestore SEO settings, using cache:', err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('[SEO Service] Subscription init error:', err);
    return () => {};
  }
}

/**
 * Get live SEO configuration for a specific page with zero-latency fallback
 */
export function getLivePageSEO(pageKey?: string, fallback?: Partial<PageSEOConfig>): PageSEOConfig {
  const currentGlobal = inMemorySEOConfig || CANONICAL_DEFAULT_SEO;
  const canonicalPage = pageKey && currentGlobal.pages[pageKey] ? currentGlobal.pages[pageKey] : currentGlobal.pages.home;

  return {
    ...canonicalPage,
    ...(fallback || {}),
    title: fallback?.title || canonicalPage.title,
    description: fallback?.description || canonicalPage.description,
    keywords: fallback?.keywords && fallback.keywords.length > 0 ? fallback.keywords : canonicalPage.keywords,
    ogImage: fallback?.ogImage || canonicalPage.ogImage || currentGlobal.defaultOgImage,
    canonicalPath: fallback?.canonicalPath || canonicalPage.canonicalPath
  };
}

/**
 * Get global SEO configuration
 */
export function getLiveGlobalSEO(): GlobalSEOConfig {
  return inMemorySEOConfig || CANONICAL_DEFAULT_SEO;
}

/**
 * Save updated SEO configuration to Firestore
 */
export async function saveGlobalSEOConfig(config: GlobalSEOConfig, updatedBy = 'admin'): Promise<void> {
  const payload: GlobalSEOConfig = {
    ...config,
    version: (config.version || 1) + 1,
    updatedAt: new Date().toISOString(),
    updatedBy
  };

  const configDocRef = doc(db, 'appConfig', 'seoSettings');
  await setDoc(configDocRef, payload, { merge: true });

  inMemorySEOConfig = payload;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('kdp_dynamic_seo_config', JSON.stringify(payload));
    } catch {}
  }
}

/**
 * Generate XML Sitemap string from current active configuration
 */
export function generateSitemapXml(baseUrl = 'https://kdpstudio-aio.web.app'): string {
  const currentGlobal = inMemorySEOConfig || CANONICAL_DEFAULT_SEO;
  const publicPages = Object.values(currentGlobal.pages).filter((p) => !p.noindex);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const page of publicPages) {
    const loc = page.route === '/' ? baseUrl : `${baseUrl}${page.route}`;
    xml += `  <url>\n`;
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>${page.sitemapChangeFreq || 'weekly'}</changefreq>\n`;
    xml += `    <priority>${page.sitemapPriority.toFixed(1)}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}
