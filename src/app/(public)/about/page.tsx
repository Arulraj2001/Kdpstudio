'use client';

import React from 'react';
import { AboutPageView } from '../../../components/public/AboutPageView';

export default function AboutPage() {
  return (
    <AboutPageView
      onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }}
    />
  );
}
