import React from 'react';
import { 
  X, 
  Sparkles, 
  Zap, 
  Clock, 
  Check, 
  ArrowRight, 
  Lock, 
  ShieldCheck,
  Star
} from 'lucide-react';
import { useUpgradeModal } from '../../lib/upgradeModalStore';
import { useGeoStore } from '../../lib/geoStore';
import { useAuthStore } from '../../lib/authStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { PlanTier } from '../../lib/planLimits';
import { PlanName } from '../../types/payment';

interface UpgradeModalProps {
  onNavigateToPricing?: () => void;
}

const PLAN_FEATURES_MAP: Record<string, string[]> = {
  starter: [
    '20 AI generations / day (300/mo)',
    '10 PDF interior & 5 Cover exports',
    'Puzzle & Coloring Book engines',
    'Up to 10 active book projects',
  ],
  pro: [
    'Unlimited AI writing & PDF exports',
    '50 AI Imagen 3 cover arts / day',
    'KDP Niche & Keyword Analysis',
    'Multilingual book translation',
  ],
  agency: [
    'Unlimited AI, covers & PDF exports',
    '3 Team seats with role permissions',
    'Bulk interior & cover generator',
    'White-label copyright & branding',
  ],
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onNavigateToPricing }) => {
  const { isOpen, config, close } = useUpgradeModal();
  const { userDoc } = useAuthStore();
  const { getFormattedPrice } = useGeoStore();
  const { open: openCheckout } = useCheckoutStore();

  if (!isOpen) return null;

  const currentPlan = (userDoc?.plan?.toLowerCase() as PlanTier) || 'free';
  const targetPlan = (config.requiredPlan?.toLowerCase() as PlanTier) || (currentPlan === 'free' ? 'starter' : 'pro');
  const targetPlanName = targetPlan === 'starter' ? 'Starter' : targetPlan === 'pro' ? 'Pro' : 'Agency';

  const priceFormatted = getFormattedPrice(targetPlan as any);
  const planFeatures = PLAN_FEATURES_MAP[targetPlan] || PLAN_FEATURES_MAP.pro;

  const handleUpgradeClick = () => {
    close();
    openCheckout(targetPlan as PlanName);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-purple-950/20 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Accent Header Banner */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 p-6 text-white relative">
          <button
            onClick={close}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              {config.trigger === 'limit_reached' ? <Zap size={18} /> : <Lock size={18} />}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-200 bg-white/10 px-2 py-0.5 rounded-full border border-white/15">
              {config.trigger === 'limit_reached' ? 'Daily Limit Reached' : 'Premium Feature'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {config.trigger === 'limit_reached'
              ? "You've reached your daily limit"
              : `${config.feature || 'This Feature'} is available on ${targetPlanName}`}
          </h2>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {config.trigger === 'limit_reached' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
                <Clock className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold">
                    You have used all {config.usageInfo?.limit || config.usageInfo?.current || 'available'} {config.feature || 'generations'} for today.
                  </p>
                  <p className="text-amber-700 mt-0.5">
                    {config.usageInfo?.resetTime || 'Resets at midnight UTC (00:00 UTC)'}.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Unlock with {targetPlanName} Plan:
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {planFeatures.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Upgrade to the <span className="font-bold text-purple-700">{targetPlanName} Plan</span> to immediately unlock <span className="font-bold text-slate-900">{config.feature}</span> and take your publishing workflow to the next level.
              </p>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900">{targetPlanName} Plan Includes:</span>
                  <span className="text-xs font-extrabold text-purple-700">{priceFormatted} / mo</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {planFeatures.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                      <Star size={13} className="text-purple-600 fill-purple-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pricing & CTA Controls */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {config.trigger === 'limit_reached' ? (
              <button
                type="button"
                onClick={close}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Wait until tomorrow
              </button>
            ) : (
              <button
                type="button"
                onClick={close}
                className="w-full sm:w-1/3 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Maybe later
              </button>
            )}

            <button
              type="button"
              onClick={handleUpgradeClick}
              className="w-full sm:flex-1 py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              <span>
                Upgrade to {targetPlanName} ({priceFormatted})
              </span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Trust guarantee */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Cancel anytime • 7-day money-back guarantee</span>
          </div>

        </div>

      </div>
    </div>
  );
};
