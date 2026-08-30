import React from 'react';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { Footer } from '../../components/public/Footer';
import { AdsenseLoader } from '../../components/blog/AdsenseLoader';
import { getAdConfig } from '../../lib/blogService';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let publisherId = '';
  let autoAds = false;

  try {
    const config = await getAdConfig();
    if (config?.globalAdsEnabled && config.adsensePublisherId) {
      publisherId = config.adsensePublisherId;
      autoAds = Boolean(config.autoAdsEnabled);
    }
  } catch {}

  return (
    <div id="public-group-layout" className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased">
      <AdsenseLoader publisherId={publisherId} autoAdsEnabled={autoAds} />
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
