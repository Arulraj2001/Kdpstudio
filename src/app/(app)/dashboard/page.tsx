'use client';

import React from 'react';
import { DashboardView } from '../../../components/dashboard/DashboardView';

export default function DashboardPage() {
  const handleNavigate = (route: string) => {
    window.location.href = `/${route === 'dashboard' ? 'dashboard' : route}`;
  };

  return <DashboardView onNavigate={handleNavigate as any} onNewBook={() => { window.location.href = '/studio'; }} />;
}
