'use client';

import React from 'react';
import { ColoringDetailView } from '../../../../../components/puzzles/ColoringDetailView';

export default function ColoringDetailPage({ params }: { params: { bookId: string } }) {
  const bookId = params?.bookId || '';

  return (
    <ColoringDetailView
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
