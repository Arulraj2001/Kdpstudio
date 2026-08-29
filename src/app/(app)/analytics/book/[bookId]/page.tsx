'use client';

import React from 'react';
import { BookDetailAnalyticsView } from '../../../../../components/analytics/BookDetailAnalyticsView';

export default function BookAnalyticsDetailPage({ params }: { params?: { bookId?: string } }) {
  let bookId = params?.bookId || '';
  if (!bookId && typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/');
    bookId = parts[parts.length - 1] || 'pub_demo';
  }

  return (
    <div className="p-4 md:p-8">
      <BookDetailAnalyticsView
        bookId={bookId}
        onBack={() => {
          window.location.href = '/analytics';
        }}
        onNavigate={(route) => {
          window.location.href = `/${route}`;
        }}
      />
    </div>
  );
}
