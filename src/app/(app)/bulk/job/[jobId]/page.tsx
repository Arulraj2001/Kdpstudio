'use client';

import React from 'react';
import { BulkJobProgressView } from '../../../../../components/bulk/BulkJobProgressView';

export default function BulkJobPage({ params }: { params?: { jobId?: string } }) {
  let jobId = params?.jobId || '';
  if (!jobId && typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/');
    jobId = parts[parts.length - 1] || 'bjob_demo';
  }

  return (
    <div className="p-4 md:p-8">
      <BulkJobProgressView
        jobId={jobId}
        onBack={() => {
          window.location.href = '/bulk';
        }}
        onNavigate={(route) => {
          window.location.href = `/${route}`;
        }}
        onViewResults={(id) => {
          window.location.href = `/bulk/job/${id}/results`;
        }}
      />
    </div>
  );
}
