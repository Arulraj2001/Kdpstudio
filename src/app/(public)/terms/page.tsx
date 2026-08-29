'use client';

import React from 'react';
import { TermsPageView } from '../../../components/public/TermsPageView';

export default function TermsPage() {
  return (
    <TermsPageView
      onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }}
    />
  );
}
