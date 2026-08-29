'use client';

import React from 'react';
import { WordSearchDetailView } from '../../../../../components/puzzles/WordSearchDetailView';

export default function WordSearchDetailPage({ params }: { params: { bookId: string } }) {
  const bookId = params?.bookId || '';

  return (
    <WordSearchDetailView
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
