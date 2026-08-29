'use client';

import React from 'react';
import { WordFitSetupView } from '../../../../components/puzzles/WordFitSetupView';

export default function WordFitSetupPage() {
  return (
    <WordFitSetupView
      onBack={() => {
        if (typeof window !== 'undefined') window.location.href = '/puzzles';
      }}
      onStartGenerating={(bookId) => {
        if (typeof window !== 'undefined') window.location.href = `/puzzles/word-fit/generating/${bookId}`;
      }}
    />
  );
}
