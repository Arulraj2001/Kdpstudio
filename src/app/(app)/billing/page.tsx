'use client';

import React from 'react';
import { BillingPageView } from '../../../components/settings/BillingPageView';

export default function BillingPage() {
  const handleNavigate = (route: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = `/${route === 'home' ? '' : route}`;
    }
  };

  return <BillingPageView onNavigate={handleNavigate as any} />;
}
