'use client';

import React from 'react';
import { AdminGuard } from '../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../components/admin/AdminLayout';
import { ContentModerationPage } from '../../../../components/admin/content/ContentModerationPage';

export default function Page() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="Content Moderation">
        <ContentModerationPage />
      </AdminLayout>
    </AdminGuard>
  );
}
