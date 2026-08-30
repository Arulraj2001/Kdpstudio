'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/layout/TopBar';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && !user && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
    }
  }, [user, isInitialized]);

  const handleNavigate = (route: PageRoute) => {
    if (typeof window !== 'undefined') {
      window.location.href = `/${route === 'home' ? '' : route}`;
    }
  };

  const handleNewBook = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/studio';
    }
  };

  if (isInitialized && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div id="app-group-layout" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Sidebar
        currentRoute="dashboard"
        onRouteChange={handleNavigate}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <TopBar
        currentRoute="dashboard"
        onOpenMobileMenu={() => setIsOpenMobile(true)}
        onNewBook={handleNewBook}
        onNavigate={handleNavigate}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <main
        className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
