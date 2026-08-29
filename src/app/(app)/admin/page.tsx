'use client';

import React from 'react';
import { AdminPageView } from '../../../components/admin/AdminPageView';

export default function AdminPage() {
  const handleNavigate = (route: string) => {
    window.location.href = `/${route}`;
  };

  return <AdminPageView onNavigate={handleNavigate as any} />;
}
