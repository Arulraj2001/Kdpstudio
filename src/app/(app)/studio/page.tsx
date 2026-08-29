'use client';

import React from 'react';
import { StudioView } from '../../../components/studio/StudioView';

export default function StudioPage() {
  const handleNavigate = (route: string) => {
    window.location.href = `/${route}`;
  };

  return <StudioView onNavigateToRoute={handleNavigate as any} />;
}
