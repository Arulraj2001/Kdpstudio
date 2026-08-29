'use client';

import React from 'react';
import { BulkTemplateDetailView } from '../../../../../components/bulk/BulkTemplateDetailView';

export default function BulkTemplateDetailPage({ params }: { params?: { templateId?: string } }) {
  let templateId = params?.templateId || '';
  if (!templateId && typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/');
    templateId = parts[parts.length - 1] || 'btpl_demo';
  }

  return (
    <div className="p-4 md:p-8">
      <BulkTemplateDetailView
        templateId={templateId}
        onBack={() => {
          window.location.href = '/bulk';
        }}
        onNavigate={(route, navParams) => {
          if (route === 'bulk-template-new') {
            window.location.href = navParams?.id ? `/bulk/new?id=${navParams.id}` : '/bulk/new';
          } else if (route === 'bulk-job-detail') {
            window.location.href = `/bulk/job/${navParams?.id}`;
          } else {
            window.location.href = `/${route}`;
          }
        }}
        onEditTemplate={(tplId) => {
          window.location.href = `/bulk/new?id=${tplId}`;
        }}
        onJobCreated={(jobId) => {
          window.location.href = `/bulk/job/${jobId}`;
        }}
      />
    </div>
  );
}
