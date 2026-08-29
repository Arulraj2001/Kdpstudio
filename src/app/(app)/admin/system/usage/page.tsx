'use client';

import React from 'react';
import { AdminGuard } from '../../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../../components/admin/AdminLayout';
import { FeatureUsagePage } from '../../../../../components/admin/system/FeatureUsagePage';

export default function Page() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="Feature Usage Analytics">
        <FeatureUsagePage />
      </AdminLayout>
    </AdminGuard>
  );
}
