import React from 'react';
import { BlogPageView } from '../../../../../components/public/BlogPageView';
import type { Metadata } from 'next';

export const revalidate = 3600;
export const dynamicParams = true;

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const categoryName = decodeURIComponent(params.category);
  return {
    title: `${categoryName} Articles & Guides | KDP Studio Blog`,
    description: `Browse all expert publishing guides, research data, and tutorials in ${categoryName}.`,
    alternates: {
      canonical: `https://kdpstudio-aio.web.app/blog/category/${params.category}`,
    },
  };
}

export default function BlogCategoryPage({ params }: CategoryPageProps) {
  const categoryName = decodeURIComponent(params.category);

  return (
    <BlogPageView
      initialCategory={categoryName}
      onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }}
      onSelectPost={(slug) => {
        window.location.href = `/blog/${slug}`;
      }}
    />
  );
}
