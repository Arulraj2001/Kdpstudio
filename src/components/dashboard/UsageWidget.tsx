import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  Layers, 
  Puzzle, 
  BookOpen, 
  ArrowUpRight, 
  Clock,
  CheckCircle2,
  Infinity,
  Zap,
  Coffee
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { getUserUsageSummary, UsageSummary, MetricUsageItem } from '../../lib/usageService';
import { useUpgradeModal } from '../../lib/upgradeModalStore';
import { PageRoute } from '../../types';

interface UsageWidgetProps {
  onNavigateToPricing?: () => void;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  aiGenerations: <Sparkles size={14} className="text-purple-600" />,
  pdfExports: <FileText size={14} className="text-blue-600" />,
  imageGenerations: <ImageIcon size={14} className="text-emerald-600" />,
  coverExports: <Layers size={14} className="text-amber-600" />,
  puzzleGenerations: <Puzzle size={14} className="text-indigo-600" />,
  epubExports: <BookOpen size={14} className="text-rose-600" />,
};

export const UsageWidget: React.FC<UsageWidgetProps> = ({ onNavigateToPricing }) => {
  const { user, userDoc } = useAuthStore();
  const { open } = useUpgradeModal();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setIsLoading(true);
    getUserUsageSummary(user.uid, userDoc?.plan || 'free')
      .then((res) => setSummary(res))
      .finally(() => setIsLoading(false));
  }, [user, userDoc]);

  const plan = summary?.plan || (userDoc?.plan?.toLowerCase() as any) || 'free';
  const isFreePlan = plan === 'free';

  const trackedKeys = ['aiGenerations', 'pdfExports', 'imageGenerations', 'coverExports'];

  const handleRowClick = (item: MetricUsageItem) => {
    if (item.percentage >= 100 || isFreePlan) {
      open({
        trigger: item.percentage >= 100 ? 'limit_reached' : 'feature_locked',
        feature: item.label,
        requiredPlan: isFreePlan ? 'starter' : 'pro',
        usageInfo: {
          current: item.current,
          limit: item.limit,
          resetTime: summary?.resetTime,
        },
      });
    }
  };

  const handleUpgradeClick = () => {
    if (onNavigateToPricing) {
      onNavigateToPricing();
    } else {
      open({
        trigger: 'feature_locked',
        feature: 'Unlimited AI & PDF Exports',
        requiredPlan: 'pro',
      });
    }
  };

  // Color helper for progress bar
  const getProgressBarColor = (percentage: number, isUnlimited: boolean) => {
    if (isUnlimited) return 'bg-purple-500';
    if (percentage >= 100) return 'bg-rose-500';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Sparkles size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Today's Usage
            </h3>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider border border-slate-200">
          {plan} Plan
        </span>
      </div>

      {/* Usage Rows */}
      <div className="space-y-3 pt-1">
        {trackedKeys.map((key) => {
          const item = summary?.daily[key];
          if (!item) return null;

          const barColor = getProgressBarColor(item.percentage, item.isUnlimited);

          return (
            <div
              key={key}
              onClick={() => handleRowClick(item)}
              className="space-y-1.5 cursor-pointer group p-1 -mx-1 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center">
                    {ACTION_ICONS[key] || <Sparkles size={12} />}
                  </div>
                  <span className="font-semibold text-slate-800 text-[11px]">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  {item.isUnlimited ? (
                    <span className="flex items-center gap-1 text-purple-600">
                      <Infinity size={13} />
                      <span className="text-[10px]">Unlimited</span>
                    </span>
                  ) : (
                    <span className={item.percentage >= 100 ? 'text-rose-600' : 'text-slate-600'}>
                      {item.current} <span className="text-slate-400 font-normal">/ {item.limit}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{
                    width: item.isUnlimited ? '100%' : `${Math.min(100, Math.max(item.current > 0 ? 5 : 0, item.percentage))}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info & Upgrade Prompt */}
      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
        {/* Credits Balance & Refill */}
        <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/80 rounded-xl px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Zap size={12} />
            </div>
            <div>
              <span className="font-bold text-amber-950 text-[11px]">
                {summary?.credits ?? userDoc?.credits ?? 0} Bonus Credits
              </span>
              <p className="text-[10px] text-amber-700 leading-tight">
                Refills when daily limits run out
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUpgradeClick}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-200/70 hover:bg-amber-200 px-2 py-1 rounded-lg transition-colors"
          >
            <Coffee size={11} />
            <span>Get Credits</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>Resets daily at midnight UTC</span>
          </div>
        </div>

        {isFreePlan && (
          <button
            type="button"
            onClick={handleUpgradeClick}
            className="text-left text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 group pt-0.5"
          >
            <span>Upgrade to Pro for unlimited generations</span>
            <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
