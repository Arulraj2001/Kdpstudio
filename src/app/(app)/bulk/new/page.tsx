'use client';

import React from 'react';
import { BulkTemplateWizardView } from '../../../../components/bulk/BulkTemplateWizardView';
import { BulkBookType } from '../../../../types/bulk';

export default function BulkNewPage() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const templateId = params?.get('id') || undefined;
  const bookType = (params?.get('type') as BulkBookType) || undefined;

  const handleNavigate = (route: string) => {
    window.location.href = `/${route}`;
  };

  const handleJobCreated = (jobId: string) => {
    window.location.href = `/bulk/job/${jobId}`;
  };

  return (
    <div className="p-4 md:p-8">
      <BulkTemplateWizardView
        initialTemplateId={templateId}
        initialBookType={bookType}
        onBack={() => {
          window.location.href = '/bulk';
        }}
        onNavigate={handleNavigate as any}
        onJobCreated={handleJobCreated}
      />
    </div>
  );
}
