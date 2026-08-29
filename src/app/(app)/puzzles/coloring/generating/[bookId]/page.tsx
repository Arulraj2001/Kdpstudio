'use client';

import React from 'react';
import { ColoringGeneratingView } from '../../../../../../components/puzzles/ColoringGeneratingView';

export default function ColoringGeneratingPage({ params }: { params: { bookId: string } }) {
  const bookId = params?.bookId || '';

  return (
    <ColoringGeneratingView
      bookId={bookId}
      onPreviewBook={(id) => {
        if (typeof window !== 'undefined') window.location.href = `/puzzles/coloring/${id}`;
      }}
    />
  );
}
