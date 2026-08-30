import React from 'react';
import { BlogPageView } from '../../../../../components/public/BlogPageView';
import type { Metadata } from 'next';

export const revalidate = 3600;
export const dynamicParams = true;

interface AuthorPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const authorName = decodeURIComponent(params.slug).replace(/-/g, ' ');
  return {
    title: `${authorName} — Author Profile & Articles | KDP Studio`,
    description: `Read all Amazon KDP publishing tutorials, research reports, and analysis written by ${authorName}.`,
    alternates: {
      canonical: `https://kdpstudio-aio.web.app/blog/author/${params.slug}`,
    },
  };
}

export default function BlogAuthorProfilePage({ params }: AuthorPageProps) {
  return (
    <BlogPageView
      onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }}
      onSelectPost={(slug) => {
        window.location.href = `/blog/${slug}`;
      }}
    />
  );
}
