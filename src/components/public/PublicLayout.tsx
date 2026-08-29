import React from 'react';
import { PublicNavbar } from './PublicNavbar';
import { Footer } from './Footer';
import { PageRoute } from '../../types';

interface PublicLayoutProps {
  currentRoute?: PageRoute;
  onNavigate: (route: PageRoute) => void;
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  currentRoute = 'home',
  onNavigate,
  children,
}) => {
  return (
    <div id="public-layout" className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased">
      <PublicNavbar currentRoute={currentRoute} onNavigate={onNavigate} />
      <main className="flex-1 w-full">{children}</main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
