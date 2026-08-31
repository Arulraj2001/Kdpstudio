import React, { useState, useEffect } from 'react';
import { PublicNavbar } from './PublicNavbar';
import { Footer } from './Footer';
import { AdsenseLoader } from '../blog/AdsenseLoader';
import { PageRoute } from '../../types';
import { getAdConfigClient } from '../../lib/blog';

import { ContactModal } from './ContactModal';

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
  const [publisherId, setPublisherId] = useState<string>('');
  const [autoAds, setAutoAds] = useState<boolean>(false);

  useEffect(() => {
    getAdConfigClient()
      .then((config) => {
        if (config?.adsensePublisherId && config.globalAdsEnabled) {
          setPublisherId(config.adsensePublisherId);
          setAutoAds(Boolean(config.autoAdsEnabled));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div id="public-layout" className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased">
      <AdsenseLoader publisherId={publisherId} autoAdsEnabled={autoAds} />
      <PublicNavbar currentRoute={currentRoute} onNavigate={onNavigate} />
      <main className="flex-1 w-full">{children}</main>
      <Footer onNavigate={onNavigate} />
      <ContactModal />
    </div>
  );
};
