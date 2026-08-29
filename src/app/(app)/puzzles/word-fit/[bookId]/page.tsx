'use client';

import React from 'react';
import { WordFitDetailView } from '../../../../../components/puzzles/WordFitDetailView';

export default function WordFitDetailPage({ params }: { params: { bookId: string } }) {
  const bookId = params?.bookId || '';

  return (
    <WordFitDetailView
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
