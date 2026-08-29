'use client';

import React from 'react';
import { AdminGuard } from '../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../components/admin/AdminLayout';
import { SupportCenterPage } from '../../../../components/admin/support/SupportCenterPage';

export default function Page() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="Support Center">
        <SupportCenterPage />
      </AdminLayout>
    </AdminGuard>
  );
}
