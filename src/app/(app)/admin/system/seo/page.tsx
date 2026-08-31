'use client';

import React from 'react';
import { AdminGuard } from '../../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../../components/admin/AdminLayout';
import { SiteSeoAdminPage } from '../../../../../components/admin/system/SiteSeoAdminPage';

export default function Page() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="Site-Wide SEO & Meta Manager">
        <SiteSeoAdminPage />
      </AdminLayout>
    </AdminGuard>
  );
}
