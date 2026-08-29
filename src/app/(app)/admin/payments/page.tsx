'use client';

import React from 'react';
import { AdminGuard } from '../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../components/admin/AdminLayout';
import { PaymentsPage } from '../../../../components/admin/payments/PaymentsPage';

export default function AdminPaymentsPageRoute() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="Payment History">
        <PaymentsPage />
      </AdminLayout>
    </AdminGuard>
  );
}
