'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../lib/authStore';

const ADMIN_EMAIL = (import.meta as any).env?.VITE_ADMIN_EMAIL || '';

interface Props {
  children: React.ReactNode;
}

/**
 * AdminGuard — wraps all admin pages.
 * Redirects to /dashboard if the current user is not the admin.
 */
export function AdminGuard({ children }: Props) {
  const { user, isLoading, isInitialized } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isInitialized) return;
    setChecking(false);
  }, [isInitialized]);

  if (!isInitialized || checking || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  // Check admin email — compare against env var or common admin email
  const adminEmailEnv = ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'arulraj8637@gmail.com';
  const isAdmin = user.email?.toLowerCase() === adminEmailEnv.toLowerCase();

  if (!isAdmin) {
    if (typeof window !== 'undefined') window.location.href = '/dashboard';
    return null;
  }

  return <>{children}</>;
}
