'use client';

import React from 'react';
import { PricingPageView } from '../../../components/public/PricingPageView';

export default function PricingPage() {
  return (
    <PricingPageView
      onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }}
    />
  );
}
