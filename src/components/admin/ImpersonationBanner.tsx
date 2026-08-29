'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/authStore';
import { auth } from '../../lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

interface ImpersonationData {
  uid: string;
  name: string;
  email: string;
}

const STORAGE_KEY = 'adminImpersonating';
const ADMIN_TOKEN_KEY = 'adminOriginalToken';

/**
 * ImpersonationBanner — renders a fixed red top banner when
 * an admin is currently impersonating another user.
 * Must be mounted in the root App.tsx to appear on every page.
 */
export function ImpersonationBanner() {
  const [impersonating, setImpersonating] = useState<ImpersonationData | null>(null);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        setImpersonating(JSON.parse(data));
      } catch { /* ignore */ }
    }

    // Listen for storage changes (other tabs)
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          try { setImpersonating(JSON.parse(e.newValue)); } catch { /* ignore */ }
        } else {
          setImpersonating(null);
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (!impersonating) return null;

  const handleStop = async () => {
    setStopping(true);
    try {
      // Sign back in as admin using stored token if available
      const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (adminToken && auth) {
        try {
          await signInWithCustomToken(auth, adminToken);
        } catch { /* fallback: just sign out */ }
      }

      // Clear impersonation state
      const targetUid = impersonating.uid;
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setImpersonating(null);

      // Redirect back to admin
      window.location.href = `/admin/users/${targetUid}`;
    } catch (err) {
      console.error('Failed to stop impersonation:', err);
      // Force clear and redirect
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setImpersonating(null);
      window.location.href = '/admin';
    } finally {
      setStopping(false);
    }
  };

  return (
    <div
      id="impersonation-banner"
      className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-2 flex items-center justify-between shadow-lg"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-lg">⚠️</span>
        <span>
          IMPERSONATING:{' '}
          <strong>{impersonating.name}</strong>{' '}
          <span className="opacity-80">({impersonating.email})</span>
        </span>
      </div>
      <button
        id="stop-impersonation-btn"
        onClick={handleStop}
        disabled={stopping}
        className="bg-white text-red-600 font-semibold text-xs px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-60"
      >
        {stopping ? 'Stopping…' : 'Stop Impersonating'}
      </button>
    </div>
  );
}

/** Call this to start impersonating a user (after receiving custom token). */
export async function startImpersonation(
  targetUid: string,
  targetName: string,
  targetEmail: string,
  customToken: string
) {
  if (typeof window === 'undefined' || !auth) return;

  // Save impersonation data
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ uid: targetUid, name: targetName, email: targetEmail })
  );

  // Sign in as the target user
  try {
    await signInWithCustomToken(auth, customToken);
  } catch (err) {
    console.error('[ImpersonationBanner] signInWithCustomToken failed:', err);
    localStorage.removeItem(STORAGE_KEY);
    throw err;
  }

  window.location.href = '/dashboard';
}
