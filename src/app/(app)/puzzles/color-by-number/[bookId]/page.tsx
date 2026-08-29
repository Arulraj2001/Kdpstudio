'use client';

import React from 'react';
import { ColorByNumberDetailView } from '../../../../../components/puzzles/ColorByNumberDetailView';

export default function ColorByNumberDetailPage({ params }: { params: { bookId: string } }) {
  const bookId = params?.bookId || '';

  return (
    <ColorByNumberDetailView
      bookId={bookId}
      onBack={() => {
        if (typeof window !== 'undefined') window.location.href = '/puzzles';
      }}
      onNavigateToBooks={() => {
        if (typeof window !== 'undefined') window.location.href = '/books';
      }}
    />
  );
}
