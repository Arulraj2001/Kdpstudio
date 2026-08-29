'use client';

import React from 'react';
import { KdpAssistantView } from '../../../components/kdp/KdpAssistantView';

export default function KdpPage() {
  const handleNavigate = (route: string) => {
    window.location.href = `/${route}`;
  };

  return <KdpAssistantView onNavigate={handleNavigate as any} />;
}
