'use client';

import React from 'react';
import { HomePageView } from '../../components/public/HomePageView';

export default function HomePage() {
  return (
    <HomePageView
      onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }}
    />
  );
}
