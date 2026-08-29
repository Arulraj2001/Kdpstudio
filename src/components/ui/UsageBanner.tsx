import React, { useState, useEffect } from 'react';
import { AlertTriangle, Sparkles, X, AlertCircle, Clock } from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { getUserUsageSummary, UsageSummary } from '../../lib/usageService';
import { useUpgradeModal } from '../../lib/upgradeModalStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { FEATURE_LABELS } from '../../lib/planLimits';

interface UsageBannerProps {
  onNavigateToPricing?: () => void;
}

export const UsageBanner: React.FC<UsageBannerProps> = ({ onNavigateToPricing }) => {
  const { user, userDoc } = useAuthStore();
  const { open } = useUpgradeModal();
  const { open: openCheckout } = useCheckoutStore();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check session dismissal flag
    if (typeof window !== 'undefined' && sessionStorage.getItem('kdp_usage_banner_dismissed')) {
      setIsDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    getUserUsageSummary(user.uid, userDoc?.plan || 'free').then((res) => {
      setSummary(res);
    });
  }, [user, userDoc]);

  if (isDismissed || !summary || summary.highestWarningPercent < 70) {
    return null;
  }

  // Find the single most critical item
  const criticalAction = summary.criticalWarningAction || 'aiGenerations';
  const metric = summary.daily[criticalAction];
  if (!metric || metric.isUnlimited) return null;

  const percent = summary.highestWarningPercent;
  const isAtLimit = percent >= 100;
  const isHighWarning = percent >= 90;
  const isModerateWarning = percent >= 70;

  const actionLabel = FEATURE_LABELS[criticalAction] || criticalAction;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('kdp_usage_banner_dismissed', 'true');
    }
  };

  const handleUpgrade = () => {
    openCheckout(summary.plan === 'free' ? 'starter' : 'pro');
  };


  // Styling based on severity
  let bannerBg = 'bg-amber-50 border-amber-200 text-amber-900';
  let badgeBg = 'bg-amber-200 text-amber-950';
  let btnBg = 'bg-amber-600 hover:bg-amber-700 text-white';
  let IconComponent = AlertCircle;

  if (isAtLimit) {
    bannerBg = 'bg-rose-50 border-rose-200 text-rose-950';
    badgeBg = 'bg-rose-200 text-rose-950';
    btnBg = 'bg-rose-600 hover:bg-rose-700 text-white';
    IconComponent = AlertTriangle;
  } else if (isHighWarning) {
    bannerBg = 'bg-orange-50 border-orange-200 text-orange-950';
    badgeBg = 'bg-orange-200 text-orange-950';
    btnBg = 'bg-orange-600 hover:bg-orange-700 text-white';
    IconComponent = AlertTriangle;
  }

  return (
    <div
      id="usage-warning-banner"
      className={`w-full px-4 py-2.5 border-b flex items-center justify-between gap-3 text-xs transition-all duration-200 ${bannerBg}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <IconComponent size={16} className="shrink-0 animate-pulse" />
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide shrink-0 ${badgeBg}`}>
            {isAtLimit ? 'Limit Reached' : `${percent}% Used`}
          </span>
          <span className="font-semibold truncate">
            {isAtLimit
              ? `You've used all ${metric.limit} ${actionLabel} for today.`
              : `You've used ${metric.current} of ${metric.limit} ${actionLabel} today.`}{' '}
            <span className="opacity-75 font-normal hidden sm:inline">
              Resets daily at midnight UTC.
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleUpgrade}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${btnBg}`}
        >
          <Sparkles size={12} />
          <span>Upgrade</span>
        </button>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 transition-colors"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
