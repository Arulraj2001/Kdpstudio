'use client';

import React from 'react';
import { AdminGuard } from '../../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../../components/admin/AdminLayout';
import { AuditReportsPage } from '../../../../../components/admin/content/AuditReportsPage';

export default function Page() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="Audit Reports">
        <AuditReportsPage />
      </AdminLayout>
    </AdminGuard>
  );
}
