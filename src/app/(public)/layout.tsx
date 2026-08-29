import React from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { Footer } from '../../components/public/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="public-group-layout" className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased">
      <PublicNavbar onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }} />
      <main className="flex-1 w-full">{children}</main>
      <Footer onNavigate={(route) => {
        window.location.href = route === 'home' ? '/' : `/${route}`;
      }} />
    </div>
  );
}
