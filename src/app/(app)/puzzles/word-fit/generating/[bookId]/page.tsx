'use client';

import React from 'react';
import { WordFitGeneratingView } from '../../../../../../components/puzzles/WordFitGeneratingView';

export default function WordFitGeneratingPage({ params }: { params: { bookId: string } }) {
  const bookId = params?.bookId || '';

  return (
    <WordFitGeneratingView
      bookId={bookId}
      onPreviewBook={(id) => {
        if (typeof window !== 'undefined') window.location.href = `/puzzles/word-fit/${id}`;
      }}
    />
  );
}
