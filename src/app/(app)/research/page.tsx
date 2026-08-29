'use client';

import React from 'react';
import { NicheResearchView } from '../../../components/research/NicheResearchView';
import { NicheResult } from '../../../types/niche';

export default function ResearchPage() {
  const handleNavigate = (route: string, params?: Record<string, string>) => {
    if (params?.id) {
      window.location.href = `/research/niche/${params.id}`;
    } else if (route === 'research-saved') {
      window.location.href = '/research/saved';
    } else {
      window.location.href = `/${route}`;
    }
  };

  const handleSelectNicheDetail = (niche: NicheResult, savedNicheId?: string) => {
    window.location.href = `/research/niche/${niche.id}${savedNicheId ? `?savedId=${savedNicheId}` : ''}`;
  };

  return (
    <NicheResearchView
      onNavigate={handleNavigate as any}
      onSelectNicheDetail={handleSelectNicheDetail}
    />
  );
}
