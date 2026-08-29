'use client';

import React from 'react';
import { AnalyticsOverviewView } from '../../../components/analytics/AnalyticsOverviewView';

export default function AnalyticsPage() {
  const handleNavigate = (route: string) => {
    if (route === 'analytics-calculator') {
      window.location.href = '/analytics/calculator';
    } else if (route === 'analytics-goals') {
      window.location.href = '/analytics/goals';
    } else {
      window.location.href = `/${route}`;
    }
  };

  const handleSelectBook = (bookId: string) => {
    window.location.href = `/analytics/book/${bookId}`;
  };

  return (
    <div className="p-4 md:p-8">
      <AnalyticsOverviewView
        onNavigate={handleNavigate as any}
        onSelectBook={handleSelectBook}
      />
    </div>
  );
}
