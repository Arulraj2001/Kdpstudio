'use client';

import React from 'react';
import { AdminGuard } from '../../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../../components/admin/AdminLayout';
import { UpiQueuePage } from '../../../../../components/admin/payments/UpiQueuePage';

export default function AdminUpiPageRoute() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="UPI Pending Verification">
        <UpiQueuePage />
      </AdminLayout>
    </AdminGuard>
  );
}
