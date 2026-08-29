'use client';

import React from 'react';
import { WordSearchGeneratingView } from '../../../../../../components/puzzles/WordSearchGeneratingView';

export default function WordSearchGeneratingPage({ params }: { params: { bookId: string } }) {
  const bookId = params?.bookId || '';

  return (
    <WordSearchGeneratingView
      bookId={bookId}
      onPreviewBook={(id) => {
        if (typeof window !== 'undefined') window.location.href = `/puzzles/word-search/${id}`;
      }}
    />
  );
}
