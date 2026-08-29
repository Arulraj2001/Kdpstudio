'use client';

import React from 'react';
import { AdminGuard } from '../../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../../components/admin/AdminLayout';
import { AppSettingsPage } from '../../../../../components/admin/system/AppSettingsPage';

export default function Page() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="App Settings">
        <AppSettingsPage />
      </AdminLayout>
    </AdminGuard>
  );
}
