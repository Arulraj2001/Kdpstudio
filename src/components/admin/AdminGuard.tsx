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
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#090a14] px-4">
        <div className="bg-[#121324] border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-2xl mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-slate-400 text-sm mb-6">
            You must be logged in as an administrator to access the KDP Studio Admin Console.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-purple-950/50"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Check admin email — compare against env var or common admin email
  const adminEmailEnv = (import.meta as any).env?.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'arulraj8637@gmail.com';
  const isAdmin = user.email?.toLowerCase() === adminEmailEnv.toLowerCase();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#090a14] px-4">
        <div className="bg-[#121324] border border-amber-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-2xl mx-auto mb-4">
            🛡️
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Admin Access Restricted</h2>
          <p className="text-slate-400 text-sm mb-6">
            The account <span className="text-amber-300 font-semibold">{user.email}</span> does not have administrator privileges.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 transition-colors shadow-lg"
          >
            Return to User Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
