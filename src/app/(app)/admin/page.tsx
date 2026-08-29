'use client';

import React from 'react';
import { AdminGuard } from '../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AdminOverviewPage } from '../../../components/admin/overview/AdminOverviewPage';

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="Dashboard">
        <AdminOverviewPage />
      </AdminLayout>
    </AdminGuard>
  );
}
