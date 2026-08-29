'use client';

import React from 'react';
import { AdminGuard } from '../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../components/admin/AdminLayout';
import { RevenuePage } from '../../../../components/admin/revenue/RevenuePage';

export default function AdminRevenuePageRoute() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="Revenue & MRR Analytics">
        <RevenuePage />
      </AdminLayout>
    </AdminGuard>
  );
}
