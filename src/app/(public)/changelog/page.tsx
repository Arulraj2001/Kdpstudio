'use client';

import React from 'react';
import { ChangelogPageView } from '../../../components/public/ChangelogPageView';

export default function ChangelogPage() {
  return (
    <ChangelogPageView
      onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }}
    />
  );
}
