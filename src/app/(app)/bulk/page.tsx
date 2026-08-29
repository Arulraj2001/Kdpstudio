'use client';

import React from 'react';
import { BulkGeneratorHubView } from '../../../components/bulk/BulkGeneratorHubView';

export default function BulkPage() {
  const handleNavigate = (route: string, params?: Record<string, string>) => {
    if (route === 'bulk-template-new') {
      window.location.href = params?.id ? `/bulk/new?id=${params.id}` : '/bulk/new';
    } else if (route === 'pricing') {
      window.location.href = '/pricing';
    } else {
      window.location.href = `/${route}`;
    }
  };

  const handleSelectJob = (jobId: string) => {
    window.location.href = `/bulk/job/${jobId}`;
  };

  const handleSelectTemplate = (templateId: string) => {
    window.location.href = `/bulk/template/${templateId}`;
  };

  const handleEditTemplate = (templateId: string) => {
    window.location.href = `/bulk/new?id=${templateId}`;
  };

  return (
    <div className="p-4 md:p-8">
      <BulkGeneratorHubView
        onNavigate={handleNavigate as any}
        onSelectJob={handleSelectJob}
        onSelectTemplate={handleSelectTemplate}
        onEditTemplate={handleEditTemplate}
      />
    </div>
  );
}
