'use client';

import React from 'react';
import { RoyaltyCalculatorView } from '../../../../components/analytics/RoyaltyCalculatorView';

export default function RoyaltyCalculatorPage() {
  return (
    <div className="p-4 md:p-8">
      <RoyaltyCalculatorView
        onNavigate={(route) => {
          window.location.href = `/${route}`;
        }}
      />
    </div>
  );
}
