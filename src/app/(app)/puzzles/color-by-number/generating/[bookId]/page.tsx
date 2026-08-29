'use client';

import React from 'react';
import { ColorByNumberGeneratingView } from '../../../../../../components/puzzles/ColorByNumberGeneratingView';

export default function ColorByNumberGeneratingPage({ params }: { params: { bookId: string } }) {
  const bookId = params?.bookId || '';

  return (
    <ColorByNumberGeneratingView
      bookId={bookId}
      onPreviewBook={(id) => {
        if (typeof window !== 'undefined') window.location.href = `/puzzles/color-by-number/${id}`;
      }}
    />
  );
}
