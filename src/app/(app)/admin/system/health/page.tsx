'use client';

import React from 'react';
import { AdminGuard } from '../../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../../components/admin/AdminLayout';
import { SystemHealthPage } from '../../../../../components/admin/system/SystemHealthPage';

export default function Page() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="System Health">
        <SystemHealthPage />
      </AdminLayout>
    </AdminGuard>
  );
}
