'use client';

import React from 'react';
import { BlogPageView } from '../../../components/public/BlogPageView';

export default function BlogPage() {
  return (
    <BlogPageView
      onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }}
    />
  );
}
