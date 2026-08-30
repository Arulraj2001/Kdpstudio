import React from 'react';
import type { Metadata } from 'next';
import { BlogPageView } from '../../../components/public/BlogPageView';

// ISR Configuration: Revalidates hourly for fresh content without full redeploy
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app';
  return {
    title: 'Amazon KDP Publishing Blog & Strategy Academy | KDP Studio',
    description: 'Data-backed guides, keyword research breakdowns, and cover formatting frameworks for Amazon KDP publishers.',
    alternates: {
      canonical: `${baseUrl}/blog`,
      types: {
        'application/rss+xml': `${baseUrl}/feed.xml`,
      },
    },
  };
}

export default function BlogPage() {
  return (
    <BlogPageView
      onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }}
    />
  );
}
