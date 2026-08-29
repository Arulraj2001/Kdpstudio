'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/authStore';
import { auth } from '../../lib/firebase';
import { PageRoute } from '../../types';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  CreditCard,
  Clock,
  Coffee,
  Flag,
  FileCheck,
  LifeBuoy,
  Activity,
  HeartPulse,
  Send,
  Sliders,
  ArrowLeft,
  RefreshCw,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  id: PageRoute;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
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
  currentRoute?: PageRoute;
  onNavigate?: (route: PageRoute) => void;
  pendingCounts?: {
    upi: number;
    bmac: number;
    support: number;
    flagged: number;
  };
}

/**
 * AdminLayout — Isolated, full-viewport command center for KDP Studio administration.
 * Features standalone sidebar, header, pending badges, and seamless SPA navigation.
 */
export function AdminLayout({
  children,
  pageTitle = 'Admin Dashboard',
  currentRoute = 'admin',
  onNavigate,
  pendingCounts: explicitPending,
}: AdminLayoutProps) {
  const { user } = useAuthStore();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState('just now');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoPending, setAutoPending] = useState<{
    upi: number;
    bmac: number;
    support: number;
    flagged: number;
  }>({ upi: 0, bmac: 0, support: 0, flagged: 0 });

  const fetchPending = async () => {
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data?.stats?.pending) {
          setAutoPending({
            upi: data.stats.pending.upiCount || 0,
            bmac: data.stats.pending.bmacCount || 0,
            support: data.stats.pending.supportCount || 0,
            flagged: data.stats.pending.flaggedCount || 0,
          });
        }
      }
    } catch {
      // safe fallback
    }
  };

  useEffect(() => {
    if (!explicitPending) {
      fetchPending();
    }
  }, [explicitPending]);

  useEffect(() => {
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);
      if (secs < 60) setTimeAgo(`${secs}s ago`);
      else if (secs < 3600) setTimeAgo(`${Math.floor(secs / 60)}m ago`);
      else setTimeAgo(`${Math.floor(secs / 3600)}h ago`);
    }, 10000);
    return () => clearInterval(interval);
  }, [lastRefreshed]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastRefreshed(new Date());
    setTimeAgo('just now');
    await fetchPending();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const pendingCounts = explicitPending || autoPending;

  const navSections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'admin', label: 'Overview', href: '/admin', icon: LayoutDashboard },
        { id: 'admin-revenue', label: 'Revenue & MRR', href: '/admin/revenue', icon: TrendingUp },
      ],
    },
    {
      title: 'USERS & ACCESS',
      items: [
        { id: 'admin-users', label: 'All Users', href: '/admin/users', icon: Users },
      ],
    },
    {
      title: 'PAYMENT OPERATIONS',
      items: [
        { id: 'admin-payments', label: 'Payment Ledger', href: '/admin/payments', icon: CreditCard },
        {
          id: 'admin-payments-upi',
          label: 'UPI Pending',
          href: '/admin/payments/upi',
          icon: Clock,
          badge: pendingCounts?.upi,
          badgeColor: 'bg-red-500 text-white',
        },
        {
          id: 'admin-payments-bmac',
          label: 'BMaC Queue',
          href: '/admin/payments/bmac',
          icon: Coffee,
          badge: pendingCounts?.bmac,
          badgeColor: 'bg-amber-500 text-slate-900 font-bold',
        },
      ],
    },
    {
      title: 'CONTENT & QUALITY',
      items: [
        {
          id: 'admin-content',
          label: 'Moderation Queue',
          href: '/admin/content',
          icon: Flag,
          badge: pendingCounts?.flagged,
          badgeColor: 'bg-red-500 text-white',
        },
        {
          id: 'admin-content-audits',
          label: 'Audit Reports',
          href: '/admin/content/audits',
          icon: FileCheck,
        },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        {
          id: 'admin-support',
          label: 'Support Center',
          href: '/admin/support',
          icon: LifeBuoy,
          badge: pendingCounts?.support,
          badgeColor: 'bg-blue-500 text-white',
        },
      ],
    },
    {
      title: 'SYSTEM & CONTROL',
      items: [
        { id: 'admin-usage', label: 'Feature Analytics', href: '/admin/system/usage', icon: Activity },
        { id: 'admin-health', label: 'System Health', href: '/admin/system/health', icon: HeartPulse },
        { id: 'admin-broadcast', label: 'Broadcast Email', href: '/admin/system/broadcast', icon: Send },
        { id: 'admin-settings', label: 'App Settings', href: '/admin/system/settings', icon: Sliders },
      ],
    },
  ];

  const handleNavClick = (item: NavItem, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsMobileOpen(false);
    if (onNavigate) {
      onNavigate(item.id);
    } else if (typeof window !== 'undefined') {
      window.location.href = item.href;
    }
  };

  const handleBackToApp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('dashboard');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-[#090a14] text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0d0e1c] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branding & Header */}
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-purple-900/40 shrink-0">
              <ShieldCheck size={20} className="stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-tight leading-tight">
                KDP Studio Admin
              </span>
              <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase">
                Command Center
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={(e) => handleNavClick(item, e)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                        isActive
                          ? 'bg-purple-600/25 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-900/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon
                        size={17}
                        className={`shrink-0 ${
                          isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate flex-1">{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.badgeColor || 'bg-purple-600 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Return to App Button */}
        <div className="p-3 border-t border-slate-800/80 bg-[#090a14]">
          <button
            onClick={handleBackToApp}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft size={15} className="text-purple-400" />
            <span>← Back to User App</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Viewport */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0 min-h-screen bg-[#090a14]">
        {/* Sticky Admin Topbar */}
        <header className="h-16 bg-[#0d0e1c]/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-xs text-slate-400">
              Last synced: <span className="text-slate-300 font-medium">{timeAgo}</span>
            </span>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh real-time data"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-purple-400' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-800/60 rounded-full px-3 py-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-purple-300 font-medium truncate max-w-[160px] sm:max-w-[220px]">
                {user?.email || 'arulraj8637@gmail.com'}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
