'use client';

import React, { useEffect } from 'react';

interface AdsenseLoaderProps {
  publisherId?: string;
  autoAdsEnabled?: boolean;
}

export const AdsenseLoader: React.FC<AdsenseLoaderProps> = ({
  publisherId,
  autoAdsEnabled = false,
}) => {
  useEffect(() => {
    if (!publisherId) return;

    // Prevent duplicate injection
    const existingScript = document.querySelector('script[src*="adsbygoogle.js"]');
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
    script.async = true;
    script.crossOrigin = 'anonymous';

    if (autoAdsEnabled) {
      script.setAttribute('data-ad-client', publisherId);
    }

    document.head.appendChild(script);
  }, [publisherId, autoAdsEnabled]);

  return null;
};
