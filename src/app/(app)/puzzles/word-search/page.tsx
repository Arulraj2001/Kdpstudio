'use client';

import React from 'react';
import { WordSearchSetupView } from '../../../../components/puzzles/WordSearchSetupView';

export default function WordSearchSetupPage() {
  return (
    <WordSearchSetupView
      onBack={() => {
        if (typeof window !== 'undefined') window.location.href = '/puzzles';
      }}
      onStartGenerating={(bookId) => {
        if (typeof window !== 'undefined') window.location.href = `/puzzles/word-search/generating/${bookId}`;
      }}
    />
  );
}
