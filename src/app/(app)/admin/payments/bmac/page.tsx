'use client';

import React from 'react';
import { AdminGuard } from '../../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../../components/admin/AdminLayout';
import { BmacQueuePage } from '../../../../../components/admin/payments/BmacQueuePage';

export default function AdminBmacPageRoute() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="Buy Me a Coffee Queue">
        <BmacQueuePage />
      </AdminLayout>
    </AdminGuard>
  );
}
