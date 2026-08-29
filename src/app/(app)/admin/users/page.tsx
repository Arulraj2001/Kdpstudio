'use client';

import React from 'react';
import { AdminGuard } from '../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../components/admin/AdminLayout';
import { AdminUsersPage } from '../../../../components/admin/users/AdminUsersPage';

export default function UsersPage() {
  return (
    <AdminGuard>
      <AdminLayout pageTitle="All Users">
        <AdminUsersPage />
      </AdminLayout>
    </AdminGuard>
  );
}
