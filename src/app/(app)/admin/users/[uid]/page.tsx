'use client';

import React from 'react';
import { AdminGuard } from '../../../../../components/admin/AdminGuard';
import { AdminLayout } from '../../../../../components/admin/AdminLayout';
import { UserDetailPage } from '../../../../../components/admin/users/UserDetailPage';

interface PageProps {
  params: { uid: string };
}

export default function UserDetailRoute({ params }: PageProps) {
  const uid = params?.uid || (typeof window !== 'undefined'
    ? window.location.pathname.split('/').pop() || ''
    : '');

  return (
    <AdminGuard>
      <AdminLayout pageTitle="User Detail">
        <UserDetailPage uid={uid} />
      </AdminLayout>
    </AdminGuard>
  );
}
