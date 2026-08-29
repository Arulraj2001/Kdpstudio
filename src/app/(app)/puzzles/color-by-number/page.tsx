'use client';

import React from 'react';
import { ColorByNumberSetupView } from '../../../../components/puzzles/ColorByNumberSetupView';

export default function ColorByNumberSetupPage() {
  return (
    <ColorByNumberSetupView
      onBack={() => {
        if (typeof window !== 'undefined') window.location.href = '/puzzles';
      }}
      onStartGenerating={(bookId) => {
        if (typeof window !== 'undefined') window.location.href = `/puzzles/color-by-number/generating/${bookId}`;
      }}
    />
  );
}
