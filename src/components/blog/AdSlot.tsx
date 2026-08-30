'use client';

import React, { useEffect, useRef } from 'react';
import { AdPosition, AdConfig } from '../../types/blog';
import { useAuthStore } from '../../lib/authStore';

interface AdSlotProps {
  positionId: AdPosition;
  adConfig?: AdConfig | null;
  postWordCount?: number;
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  positionId,
  adConfig,
  postWordCount = 0,
  className = '',
}) => {
  const { user, userDoc } = useAuthStore();
  const adRef = useRef<HTMLDivElement>(null);
  const isPushedRef = useRef(false);

  // If no adConfig passed, check default behavior
  if (!adConfig) return null;

  // 1. Check Global Ads Toggle
  if (!adConfig.globalAdsEnabled) return null;

  // 2. Find position configuration
  const position = (adConfig.positions || []).find((p) => p.id === positionId);
  if (!position || !position.enabled) return null;

  // 3. Check minimum word count constraint
  if (position.minWordCount && postWordCount < position.minWordCount) {
    return null;
  }

  // 4. Check user login suppression
  const isLoggedIn = Boolean(user);
  if (position.hideForLoggedIn && isLoggedIn) {
    return null;
  }

  // 5. Check paid plan suppression
  const isPaidUser = Boolean(
    userDoc?.plan && userDoc.plan !== 'free' && userDoc.subscriptionStatus === 'active'
  );
  if (position.hideForPaidUsers && isPaidUser) {
    return null;
  }

  // 6. Check publisher ID
  const publisherId = adConfig.adsensePublisherId?.trim();
  const isDev = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    !publisherId
  );

  useEffect(() => {
    if (isDev || !publisherId || isPushedRef.current) return;

    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
        isPushedRef.current = true;
      }
    } catch (err) {
      console.warn('[AdSlot] Failed to initialize Google AdSense unit:', err);
    }
  }, [isDev, publisherId]);

  // Development Placeholder Display
  if (isDev) {
    return (
      <div
        className={`my-6 p-4 rounded-xl border border-dashed border-purple-300 bg-purple-50/50 text-slate-600 text-center transition-all ${className}`}
        style={{ minHeight: '90px' }}
      >
        <div className="flex flex-col items-center justify-center space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
              AdSense Slot: {position.name || positionId}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            Unit ID: <span className="font-mono text-purple-700">{position.adUnitId || 'Unset (Responsive auto)'}</span> · Min words: {position.minWordCount}w
          </p>
          <span className="text-[9px] font-medium text-slate-400">
            (Visible only in local preview / test mode)
          </span>
        </div>
      </div>
    );
  }

  // Production AdSense Rendering
  return (
    <div
      ref={adRef}
      className={`ad-slot ad-slot-${positionId} my-6 overflow-hidden text-center ${className}`}
      style={{ minHeight: '90px' }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={position.adUnitId || undefined}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
