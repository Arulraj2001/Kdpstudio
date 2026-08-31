'use client';

import React from 'react';
import { AdminGuard } from '../../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../../components/admin/AdminLayout';
import { PlanLimitsAdminPage } from '../../../../../components/admin/system/PlanLimitsAdminPage';

export default function Page() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="Plan Limits & Quota Manager">
        <PlanLimitsAdminPage />
      </AdminLayout>
    </AdminGuard>
  );
}
