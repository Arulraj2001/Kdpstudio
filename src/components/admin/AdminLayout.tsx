'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/authStore';
import { auth } from '../../lib/firebase';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: number;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pendingCounts?: {
    upi: number;
    bmac: number;
    support: number;
    flagged: number;
  };
}

/**
 * AdminLayout — wraps all admin pages with its own dark sidebar
 * and top bar. Completely separate from the main app sidebar.
 */
export function AdminLayout({ children, pageTitle = 'Dashboard', pendingCounts: explicitPending }: AdminLayoutProps) {
  const { user } = useAuthStore();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState('just now');
  const [autoPending, setAutoPending] = useState<{
    upi: number;
    bmac: number;
    support: number;
    flagged: number;
  }>({ upi: 0, bmac: 0, support: 0, flagged: 0 });

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = await auth?.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch('/api/admin/overview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.stats?.pending) {
          setAutoPending({
            upi: data.stats.pending.upiCount || 0,
            bmac: data.stats.pending.bmacCount || 0,
            support: data.stats.pending.supportCount || 0,
            flagged: data.stats.pending.flaggedCount || 0,
          });
        }
      } catch {
        // ignore
      }
    };

    if (!explicitPending) {
      fetchPending();
    }
  }, [explicitPending]);

  const pendingCounts = explicitPending || autoPending;

  useEffect(() => {
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);
      if (secs < 60) setTimeAgo(`${secs}s ago`);
      else if (secs < 3600) setTimeAgo(`${Math.floor(secs / 60)}m ago`);
      else setTimeAgo(`${Math.floor(secs / 3600)}h ago`);
    }, 10000);
    return () => clearInterval(interval);
  }, [lastRefreshed]);

  const handleRefresh = () => {
    setLastRefreshed(new Date());
    setTimeAgo('just now');
    window.location.reload();
  };

  const currentPath =
    typeof window !== 'undefined' ? window.location.pathname : '/admin';

  const navSections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { icon: '📊', label: 'Dashboard', href: '/admin' },
        { icon: '📈', label: 'Revenue', href: '/admin/revenue' },
      ],
    },
    {
      title: 'USERS',
      items: [
        { icon: '👥', label: 'All Users', href: '/admin/users' },
        { icon: '🚫', label: 'Banned Users', href: '/admin/users/banned' },
      ],
    },
    {
      title: 'PAYMENTS',
      items: [
        { icon: '💳', label: 'All Payments', href: '/admin/payments' },
        {
          icon: '🕐',
          label: 'UPI Pending',
          href: '/admin/payments/upi',
          badge: pendingCounts?.upi,
          badgeColor: 'bg-red-500',
        },
        {
          icon: '☕',
          label: 'BMaC Unmatched',
          href: '/admin/payments/bmac',
          badge: pendingCounts?.bmac,
          badgeColor: 'bg-amber-500',
        },
      ],
    },
    {
      title: 'CONTENT',
      items: [
        {
          icon: '🚩',
          label: 'Flagged Content',
          href: '/admin/content',
          badge: pendingCounts?.flagged,
          badgeColor: 'bg-red-500',
        },
        { icon: '📋', label: 'Audit Reports', href: '/admin/content/audits' },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        {
          icon: '📬',
          label: 'Contact Forms',
          href: '/admin/support',
          badge: pendingCounts?.support,
          badgeColor: 'bg-blue-500',
        },
        { icon: '📧', label: 'Email Logs', href: '/admin/support/emails' },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { icon: '⚡', label: 'Feature Usage', href: '/admin/system/usage' },
        { icon: '🔧', label: 'System Health', href: '/admin/system/health' },
        { icon: '📢', label: 'Broadcast Email', href: '/admin/system/broadcast' },
        { icon: '⚙️', label: 'App Settings', href: '/admin/system/settings' },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return currentPath === '/admin';
    return currentPath.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-[#0f0f1a] text-white">
      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className="w-60 flex-shrink-0 bg-[#0f0f1a] border-r border-white/10 flex flex-col fixed top-0 left-0 h-full z-40 overflow-y-auto"
      >
        {/* Branding */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold">
              K
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">KDP Studio Admin</p>
              <p className="text-[10px] text-slate-500">v1.0 · Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5">
          {navSections.map(section => (
            <div key={section.title}>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1.5 px-2">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const active = isActive(item.href);
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all group ${
                        active
                          ? 'bg-purple-600/20 text-purple-300'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="text-base leading-none">{item.icon}</span>
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${
                            item.badgeColor || 'bg-purple-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Back to App */}
        <div className="px-3 py-4 border-t border-white/10">
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span>←</span>
            <span>Back to App</span>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 bg-[#12121f] border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-30">
          <h1 className="text-base font-semibold text-white">{pageTitle}</h1>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">
              Last refreshed: {timeAgo}
            </span>
            <button
              id="admin-refresh-btn"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
            <div className="flex items-center gap-2 bg-purple-900/30 border border-purple-500/20 rounded-full px-3 py-1">
              <span className="text-purple-400 text-xs">👤 Admin:</span>
              <span className="text-purple-300 text-xs font-medium">
                {user?.email || '—'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-[#0d0d1a]">
          {children}
        </main>
      </div>
    </div>
  );
}
