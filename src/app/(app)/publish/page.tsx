'use client';

import React from 'react';
import { PublishChecklistView } from '../../../components/publish/PublishChecklistView';

export default function PublishPage() {
  const handleNavigate = (route: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = `/${route === 'home' ? '' : route}`;
    }
  };

  return <PublishChecklistView onNavigate={handleNavigate as any} />;
}
