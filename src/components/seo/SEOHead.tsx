'use client';

import React, { useEffect } from 'react';

export interface SEOHeadProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  noindex?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  languages?: Record<string, string>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = 'Create, format and publish Amazon KDP books with AI. Write chapters, design covers, generate puzzles, and optimize metadata — all in one tool.',
  canonicalPath,
  noindex = false,
  ogImage = '/og-image.png',
  ogType = 'website',
  languages,
}) => {
  useEffect(() => {
    // 1. Update Document Title
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

    // 2. Meta Description
    setMetaTag('name', 'description', description);

    // 3. Robots
    setMetaTag(
      'name',
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    );

    // 4. OpenGraph
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:site_name', 'KDP Studio');

    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kdpstudio-aio.web.app';
    const canonicalUrl = canonicalPath ? `${appUrl}${canonicalPath}` : window.location.href;
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', ogImage.startsWith('http') ? ogImage : `${appUrl}${ogImage}`);

    // 5. Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage.startsWith('http') ? ogImage : `${appUrl}${ogImage}`);
    setMetaTag('name', 'twitter:creator', '@kdpstudio');

    // 6. Canonical Link Tag
    if (canonicalPath) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonicalUrl;
    }

    // 7. Hreflang Tags (if specified)
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
  }, [title, description, canonicalPath, noindex, ogImage, ogType, languages]);

  return null;
};
