'use client';

import React from 'react';
import { PrivacyPageView } from '../../../components/public/PrivacyPageView';

export default function PrivacyPage() {
  return (
    <PrivacyPageView
      onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }}
    />
  );
}
