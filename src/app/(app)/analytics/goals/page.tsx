'use client';

import React from 'react';
import { PublishingGoalsView } from '../../../../components/analytics/PublishingGoalsView';

export default function AnalyticsGoalsPage() {
  return (
    <div className="p-4 md:p-8">
      <PublishingGoalsView
        onBack={() => {
          window.location.href = '/analytics';
        }}
        onNavigate={(route) => {
          window.location.href = `/${route}`;
        }}
      />
    </div>
  );
}
