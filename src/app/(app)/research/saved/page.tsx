'use client';

import React from 'react';
import { SavedNichesView } from '../../../../components/research/SavedNichesView';
import { NicheResult } from '../../../../types/niche';

export default function SavedNichesPage() {
  const handleSelectNicheDetail = (niche: NicheResult, savedNicheId: string) => {
    window.location.href = `/research/niche/${niche.id}?savedId=${savedNicheId}`;
  };

  return (
    <SavedNichesView
      onBack={() => {
        window.location.href = '/research';
      }}
      onSelectNicheDetail={handleSelectNicheDetail}
      onNavigate={(route) => {
        window.location.href = `/${route}`;
      }}
    />
  );
}
