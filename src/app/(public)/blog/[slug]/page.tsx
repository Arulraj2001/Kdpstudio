import React from 'react';
import { BlogPostDetailView } from '../../../../components/public/BlogPostDetailView';
import { getAllSlugs, getBlogPostBySlug } from '../../../../lib/blogService';
import type { Metadata } from 'next';

// ISR Configuration: Revalidates every hour, allows on-demand rendering for newly published posts
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const slugs = await getAllSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (err) {
    console.warn('[generateStaticParams] Falling back to default slugs:', err);
    return [{ slug: 'kdp-niches-2026' }];
  }
}

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) {
    return {
      title: 'Post Not Found | KDP Studio Academy',
      description: 'The requested publishing guide could not be found.',
    };
  }

  return {
    title: `${post.metaTitle || post.title} | KDP Studio`,
    description: post.metaDescription || post.excerpt,
    alternates: {
      canonical: post.canonicalUrl || `https://kdpstudio-aio.web.app/blog/${post.slug}`,
    },
    openGraph: {
      title: post.ogTitle || post.metaTitle || post.title,
      description: post.ogDescription || post.metaDescription || post.excerpt,
      images: post.ogImage ? [{ url: post.ogImage }] : undefined,
      type: 'article',
      publishedTime: typeof post.publishedAt === 'string' ? post.publishedAt : undefined,
      authors: post.authorName ? [post.authorName] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.twitterTitle || post.metaTitle || post.title,
      description: post.twitterDescription || post.metaDescription || post.excerpt,
      images: post.twitterImage ? [post.twitterImage] : undefined,
    },
    robots: {
      index: !post.noIndex,
      follow: !post.noIndex,
    },
  };
}

export default function BlogPostPage({ params }: PageProps) {
  return (
    <BlogPostDetailView
      slug={params.slug}
      onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }}
      onSelectPost={(newSlug) => {
        window.location.href = `/blog/${newSlug}`;
      }}
    />
  );
}
