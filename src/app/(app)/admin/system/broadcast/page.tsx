'use client';

import React from 'react';
import { AdminGuard } from '../../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../../components/admin/AdminLayout';
import { BroadcastEmailPage } from '../../../../../components/admin/system/BroadcastEmailPage';

export default function Page() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="Broadcast Email">
        <BroadcastEmailPage />
      </AdminLayout>
    </AdminGuard>
  );
}
