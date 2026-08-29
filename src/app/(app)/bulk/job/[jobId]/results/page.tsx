'use client';

import React from 'react';
import { BulkJobResultsView } from '../../../../../../components/bulk/BulkJobResultsView';

export default function BulkJobResultsPage({ params }: { params?: { jobId?: string } }) {
  let jobId = params?.jobId || '';
  if (!jobId && typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/');
    // e.g. /bulk/job/bjob_123/results -> parts[parts.length - 2]
    jobId = parts[parts.length - 2] || 'bjob_demo';
  }

  return (
    <div className="p-4 md:p-8">
      <BulkJobResultsView
        jobId={jobId}
        onBack={() => {
          window.location.href = `/bulk/job/${jobId}`;
        }}
        onNavigate={(route) => {
          window.location.href = `/${route}`;
        }}
      />
    </div>
  );
}
