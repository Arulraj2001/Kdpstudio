'use client';

import React from 'react';
import { ColoringSetupView } from '../../../../components/puzzles/ColoringSetupView';

export default function ColoringSetupPage() {
  return (
    <ColoringSetupView
      onBack={() => {
        if (typeof window !== 'undefined') window.location.href = '/puzzles';
      }}
      onStartGenerating={(bookId) => {
        if (typeof window !== 'undefined') window.location.href = `/puzzles/coloring/generating/${bookId}`;
      }}
    />
  );
}
