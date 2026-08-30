import React from 'react';
import { BlogPageView } from '../../../components/public/BlogPageView';

// ISR Configuration: Revalidates hourly for fresh content without full redeploy
export const revalidate = 3600;

export default function BlogPage() {
  return (
    <BlogPageView
      onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }}
    />
  );
}
