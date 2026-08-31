'use client';

import React, { useEffect } from 'react';
import { getLivePageSEO, getLiveGlobalSEO } from '../../lib/seoService';

export interface SEOHeadProps {
  pageKey?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalPath?: string;
  noindex?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  languages?: Record<string, string>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  pageKey,
  title: propTitle,
  description: propDescription,
  keywords: propKeywords,
  canonicalPath: propCanonicalPath,
  noindex: propNoindex,
  ogImage: propOgImage,
  ogType: propOgType = 'website',
  languages,
}) => {
  useEffect(() => {
    // 1. Fetch live admin-configured SEO parameters with prop fallbacks
    const liveConfig = getLivePageSEO(pageKey, {
      title: propTitle,
      description: propDescription,
      keywords: propKeywords,
      canonicalPath: propCanonicalPath,
      noindex: propNoindex,
      ogImage: propOgImage,
      ogType: propOgType
    });

    const globalConfig = getLiveGlobalSEO();

    const title = liveConfig.title || propTitle || globalConfig.siteName;
    const description = liveConfig.description || propDescription || globalConfig.defaultDescription;
    const keywords = liveConfig.keywords || propKeywords || globalConfig.defaultKeywords;
    const canonicalPath = liveConfig.canonicalPath || propCanonicalPath;
    const noindex = liveConfig.noindex !== undefined ? liveConfig.noindex : (propNoindex ?? false);
    const ogImage = liveConfig.ogImage || propOgImage || globalConfig.defaultOgImage;
    const ogType = liveConfig.ogType || propOgType || 'website';

    // 2. Format Document Title
    const formattedTitle = title.includes('KDP Studio') ? title : `${title} | KDP Studio`;
    document.title = formattedTitle;

    // Helper to get or create meta tag
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // 3. Meta Description & Keywords
    setMetaTag('name', 'description', description);
    if (keywords && keywords.length > 0) {
      setMetaTag('name', 'keywords', Array.isArray(keywords) ? keywords.join(', ') : keywords);
    }

    // 4. Robots Directives
    setMetaTag(
      'name',
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    );

    // 5. OpenGraph Tags
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kdpstudio-aio.web.app';
    const canonicalUrl = canonicalPath ? `${appUrl}${canonicalPath}` : window.location.href;

    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:site_name', globalConfig.siteName || 'KDP Studio');
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', ogImage.startsWith('http') ? ogImage : `${appUrl}${ogImage}`);

    // 6. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage.startsWith('http') ? ogImage : `${appUrl}${ogImage}`);
    setMetaTag('name', 'twitter:creator', globalConfig.twitterHandle || '@kdpstudio');

    // 7. Search Engine Verification Codes (if active)
    if (globalConfig.googleSiteVerification) {
      setMetaTag('name', 'google-site-verification', globalConfig.googleSiteVerification);
    }
    if (globalConfig.bingSiteVerification) {
      setMetaTag('name', 'msvalidate.01', globalConfig.bingSiteVerification);
    }

    // 8. Canonical Link Tag
    if (canonicalPath) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonicalUrl;
    }

    // 9. Hreflang Tags (if specified)
    if (languages) {
      Object.entries(languages).forEach(([lang, path]) => {
        const langUrl = `${appUrl}${path}`;
        let link = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`) as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'alternate';
          link.hreflang = lang;
          document.head.appendChild(link);
        }
        link.href = langUrl;
      });
    }
  }, [pageKey, propTitle, propDescription, propKeywords, propCanonicalPath, propNoindex, propOgImage, propOgType, languages]);

  return null;
};
