'use client';

import React from 'react';
import { OnboardingView } from '../../../components/onboarding/OnboardingView';

export default function OnboardingPage() {
  const handleNavigate = (route: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = `/${route === 'home' ? '' : route}`;
    }
  };

  return <OnboardingView onNavigate={handleNavigate as any} />;
}
