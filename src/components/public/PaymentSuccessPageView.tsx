import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  LayoutDashboard, 
  Loader2, 
  AlertTriangle, 
  Mail, 
  HelpCircle,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { PlanName } from '../../types/payment';
import { useAuthStore } from '../../lib/authStore';
import { pollUntilPlanUpgraded, showPaymentSuccessToast } from '../../lib/postPayment';
import { PageRoute } from '../../types';

interface PaymentSuccessPageViewProps {
  onNavigate?: (route: PageRoute) => void;
  planParam?: string;
  gatewayParam?: string;
}

const UNLOCKED_PERKS: Record<string, string[]> = {
  starter: [
    '✨ 20 Daily AI Generations (300/month)',
    '🎨 10 PDF Interior & 5 Cover Exports per day',
    '🧩 Puzzle, Sudoku & Coloring Book Engines',
    '📁 Up to 10 Active Book Projects in Cloud',
  ],
  pro: [
    '✨ Unlimited AI Writing & Chapter Generation',
    '🎨 50 AI Imagen 3 Ultra Cover Arts per day',
    '🌍 Book Translator in 20+ Languages',
    '📊 KDP Niche & Bestseller Keyword Analyzer',
    '🖨️ Unlimited 300 DPI CMYK Print PDF Exports',
  ],
  agency: [
    '✨ Unlimited Everything with Zero Quota Restrictions',
    '👥 3 Team Member Workspace Seats',
    '⚡ Bulk Interior & Cover Automation Suite',
    '🛡️ Commercial Copyright & Priority SLA Support',
  ],
  lifetime: [
    '✨ Lifetime Pro Membership — Zero Recurring Subscriptions',
    '🎨 50 AI Imagen 3 Ultra Cover Arts per day',
    '🌍 Book Translator in 20+ Languages',
    '🖨️ Unlimited 300 DPI CMYK Print PDF Exports',
  ],
};

export const PaymentSuccessPageView: React.FC<PaymentSuccessPageViewProps> = ({
  onNavigate,
  planParam,
  gatewayParam,
}) => {
  const { user, userDoc, refreshUserData } = useAuthStore();

  // Extract query parameters from URL if not passed in props
  const [targetPlan, setTargetPlan] = useState<PlanName>('pro');
  const [gateway, setGateway] = useState<string>('paypal');
  const [status, setStatus] = useState<'polling' | 'success' | 'timeout'>('polling');

  useEffect(() => {
    let p = planParam;
    let g = gatewayParam;

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (!p) p = urlParams.get('plan') || undefined;
      if (!g) g = urlParams.get('gateway') || undefined;
    }

    const resolvedPlan = (p?.toLowerCase() as PlanName) || 'pro';
    setTargetPlan(resolvedPlan);
    setGateway(g || 'paypal');

    // Run polling
    let isCancelled = false;

    async function executePoll() {
      setStatus('polling');
      try {
        const upgraded = await pollUntilPlanUpgraded(resolvedPlan, 10, 3000);
        if (isCancelled) return;

        if (upgraded) {
          setStatus('success');
          showPaymentSuccessToast(resolvedPlan);
        } else {
          // Check if user already has this plan or higher
          await refreshUserData();
          const currentPlan = useAuthStore.getState().userDoc?.plan || '';
          if (currentPlan.toLowerCase() === resolvedPlan) {
            setStatus('success');
          } else {
            setStatus('timeout');
          }
        }
      } catch (e) {
        if (!isCancelled) setStatus('timeout');
      }
    }

    executePoll();

    return () => {
      isCancelled = true;
    };
  }, [planParam, gatewayParam, refreshUserData]);

  const planTitle = targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1);
  const perks = UNLOCKED_PERKS[targetPlan] || UNLOCKED_PERKS.pro;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-xl shadow-purple-900/5 p-6 sm:p-10 text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* 1. Polling State */}
        {status === 'polling' && (
          <div className="space-y-6 py-6">
            <div className="w-20 h-20 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto ring-8 ring-purple-50/50">
              <Loader2 size={38} className="animate-spin text-purple-600" />
            </div>
            
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                Verifying Payment
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Activating your {planTitle} Plan...
              </h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                We're confirming your transaction with {gateway.toUpperCase()} and syncing your publishing features. This takes just a few seconds.
              </p>
            </div>

            <div className="w-full max-w-xs mx-auto bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full w-2/3 animate-pulse rounded-full" />
            </div>
          </div>
        )}

        {/* 2. Success State */}
        {status === 'success' && (
          <div className="space-y-6">
            {/* Animated Checkmark Circle */}
            <div className="relative w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50 animate-in zoom-in-50 duration-300">
              <CheckCircle2 size={44} className="stroke-[2.5]" />
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs">
                ✨
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Payment Confirmed
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Welcome to {planTitle} Plan! 🎉
              </h2>
              <p className="text-sm text-slate-600">
                Your account has been upgraded successfully. All features and quotas are live!
              </p>
            </div>

            {/* Unlocked Capabilities Box */}
            <div className="text-left bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Unlocked on your account:
              </div>
              <div className="space-y-2">
                {perks.map((perk, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('dashboard') : (window.location.href = '/dashboard')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                <LayoutDashboard size={16} />
                <span>Go to Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('studio') : (window.location.href = '/studio')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all cursor-pointer"
              >
                <BookOpen size={16} />
                <span>Create Your First Book</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Timeout State */}
        {status === 'timeout' && (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto ring-8 ring-amber-50">
              <AlertTriangle size={36} />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                Payment Received
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Activation Taking A Little Longer
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                Your payment was received securely. Webhook synchronization occasionally takes 2–5 minutes depending on the payment provider. Check your email for the receipt.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1 text-left">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-purple-600" />
                What happens next?
              </div>
              <p>
                Your plan will activate automatically in the background. You can safely proceed to your dashboard now.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('dashboard') : (window.location.href = '/dashboard')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <LayoutDashboard size={16} />
                <span>Go to Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('contact') : (window.location.href = '/contact')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all cursor-pointer"
              >
                <HelpCircle size={16} />
                <span>Contact Support</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
