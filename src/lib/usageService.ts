/**
 * KDP Studio Usage Tracking Service & Plan Gating
 */

import { PLAN_LIMITS, FEATURE_ACCESS, PLAN_RANKS, PlanTier, FEATURE_LABELS } from './planLimits';
import { getUserDocument, updateUserDocument, deductCredit } from './userService';
import { sendUsageWarningEmail, sendQuotaExceededEmail } from './emailService';
import { APP_URL } from './resend';


export interface UsageCheckResult {
  allowed: boolean;
  reason?: 'daily_limit' | 'monthly_limit' | 'plan_required';
  current?: number;
  limit?: number;
  remaining?: number;
  resetTime?: string;
  upgradeRequired?: string;
}

export interface FeatureAccessResult {
  allowed: boolean;
  requiredPlan?: PlanTier;
  message?: string;
}

export interface MetricUsageItem {
  action: string;
  label: string;
  current: number;
  limit: number; // -1 for unlimited
  percentage: number;
  isUnlimited: boolean;
  remaining: number;
}

export interface UsageSummary {
  plan: PlanTier;
  date: string;
  month: string;
  resetTime: string;
  credits?: number;
  daily: Record<string, MetricUsageItem>;
  monthly: Record<string, MetricUsageItem>;
  highestWarningPercent: number;
  criticalWarningAction?: string;
}

/**
 * Returns today's UTC date string: 'YYYY-MM-DD'
 */
export function getTodayUtc(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Returns current UTC month string: 'YYYY-MM'
 */
export function getCurrentMonthUtc(): string {
  const now = new Date();
  return now.toISOString().slice(0, 7);
}

/**
 * Check if a plan has access to a specific feature key
 */
export function checkFeatureAccess(plan: string = 'free', feature: string): FeatureAccessResult {
  const normalizedPlan = (plan.toLowerCase() as PlanTier) || 'free';
  const requiredPlan = FEATURE_ACCESS[feature] || 'free';

  const userRank = PLAN_RANKS[normalizedPlan] ?? 0;
  const requiredRank = PLAN_RANKS[requiredPlan] ?? 0;

  if (userRank >= requiredRank) {
    return { allowed: true };
  }

  const featureLabel = FEATURE_LABELS[feature] || feature;
  return {
    allowed: false,
    requiredPlan,
    message: `${featureLabel} requires the ${requiredPlan.toUpperCase()} plan or higher.`,
  };
}

/**
 * Main function called before AI or Export actions
 * Atomically validates and increments usage counters
 */
export async function checkAndIncrementUsage(
  uid: string,
  action: string,
  plan: string = 'free'
): Promise<UsageCheckResult> {
  const resetTime = 'Resets at midnight UTC';
  const normalizedPlan = (plan.toLowerCase() as PlanTier) || 'free';
  const limits = PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS.free;

  const today = getTodayUtc();
  const currentMonth = getCurrentMonthUtc();

  try {
    const userDoc = await getUserDocument(uid);
    if (!userDoc) {
      // User doc not found, fail open
      return { allowed: true, current: 1, limit: limits.daily[action] ?? 3, remaining: 2, resetTime };
    }

    const currentUsage = userDoc.usage || {
      daily: { date: today, aiGenerations: 0, pdfExports: 0, imageGenerations: 0 },
      monthly: { month: currentMonth, aiGenerations: 0, pdfExports: 0, imageGenerations: 0 },
      allTime: { aiGenerations: 0, pdfExports: 0, imageGenerations: 0 },
    };

    let dailyUsage = { ...(currentUsage.daily || {}) };
    let monthlyUsage = { ...(currentUsage.monthly || {}) };
    let allTimeUsage = { ...(currentUsage.allTime || {}) };

    // 1. Reset daily counters if date changed
    if (dailyUsage.date !== today) {
      dailyUsage = {
        date: today,
        aiGenerations: 0,
        pdfExports: 0,
        imageGenerations: 0,
        coverExports: 0,
        puzzleGenerations: 0,
        epubExports: 0,
      };
    }

    // 2. Reset monthly counters if month changed
    if (monthlyUsage.month !== currentMonth) {
      monthlyUsage = {
        month: currentMonth,
        aiGenerations: 0,
        pdfExports: 0,
        imageGenerations: 0,
      };
    }

    // 3. Daily Limit Check
    const dailyLimit = limits.daily[action] !== undefined ? limits.daily[action] : -1;
    const currentDailyVal = Number(dailyUsage[action] || 0);

    if (dailyLimit !== -1 && currentDailyVal >= dailyLimit) {
      // Check if user has available credits to extend quota
      const creditUsed = await deductCredit(uid, 1);
      if (creditUsed) {
        return {
          allowed: true,
          current: currentDailyVal,
          limit: dailyLimit,
          remaining: 0,
          resetTime,
        };
      }

      // Check and dispatch Quota Exceeded Email if not already sent today
      if (userDoc.email && userDoc.lastQuotaExceededDate !== today) {
        const canSend = userDoc.settings?.emailPreferences?.usageWarnings !== false;
        if (canSend) {
          const userEmail = userDoc.email;
          const userName = userDoc.name || userDoc.displayName || userEmail.split('@')[0];
          sendQuotaExceededEmail({
            to: userEmail,
            name: userName,
            feature: FEATURE_LABELS[action] || action,
            limit: dailyLimit,
            resetTime: 'midnight UTC',
            upgradeUrl: `${APP_URL}/pricing`,
            currentPlan: normalizedPlan,
          }).catch(console.error);

          updateUserDocument(uid, { lastQuotaExceededDate: today }).catch(console.error);
        }
      }

      return {
        allowed: false,
        reason: 'daily_limit',
        current: currentDailyVal,
        limit: dailyLimit,
        remaining: 0,
        resetTime,
        upgradeRequired: 'starter',
      };
    }

    // 4. Monthly Limit Check
    const monthlyLimit = limits.monthly[action] !== undefined ? limits.monthly[action] : -1;
    const currentMonthlyVal = Number(monthlyUsage[action] || 0);

    if (monthlyLimit !== -1 && currentMonthlyVal >= monthlyLimit) {
      // Check if user has available credits to extend quota
      const creditUsed = await deductCredit(uid, 1);
      if (creditUsed) {
        return {
          allowed: true,
          current: currentMonthlyVal,
          limit: monthlyLimit,
          remaining: 0,
          resetTime: 'Resets on the 1st of next month',
        };
      }

      return {
        allowed: false,
        reason: 'monthly_limit',
        current: currentMonthlyVal,
        limit: monthlyLimit,
        remaining: 0,
        resetTime: 'Resets on the 1st of next month',
        upgradeRequired: 'pro',
      };
    }

    // 5. Update Counters
    const newDailyVal = currentDailyVal + 1;
    const newMonthlyVal = currentMonthlyVal + 1;
    const newAllTimeVal = Number(allTimeUsage[action] || 0) + 1;

    dailyUsage[action] = newDailyVal;
    monthlyUsage[action] = newMonthlyVal;
    allTimeUsage[action] = newAllTimeVal;

    // Save to Firestore
    await updateUserDocument(uid, {
      usage: {
        daily: dailyUsage as any,
        monthly: monthlyUsage as any,
        allTime: allTimeUsage as any,
      },
    });

    // 6. Check Usage Warning Threshold (70% and 100%)
    if (dailyLimit !== -1 && userDoc.email) {
      const percentage = (newDailyVal / dailyLimit) * 100;
      const canSendWarnings = userDoc.settings?.emailPreferences?.usageWarnings !== false;

      if (canSendWarnings) {
        const userEmail = userDoc.email;
        const userName = userDoc.name || userDoc.displayName || userEmail.split('@')[0];

        if (percentage >= 70 && percentage < 100 && userDoc.lastUsageWarningDate !== today) {
          sendUsageWarningEmail({
            to: userEmail,
            name: userName,
            feature: FEATURE_LABELS[action] || action,
            used: newDailyVal,
            limit: dailyLimit,
            percentage: Math.round(percentage),
            resetTime: 'midnight UTC',
            upgradeUrl: `${APP_URL}/pricing`,
          }).catch(console.error);

          // Push Notification (Phase 20B)
          if (typeof fetch !== 'undefined') {
            fetch('/api/notifications/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uid,
                type: 'quota_warning',
                title: '⚠️ Almost at your limit',
                body: `${Math.max(0, dailyLimit - newDailyVal)} ${FEATURE_LABELS[action] || action} remaining today.`,
                data: { clickUrl: '/pricing' },
              }),
            }).catch(() => {});
          }

          updateUserDocument(uid, { lastUsageWarningDate: today }).catch(console.error);
        } else if (percentage >= 100 && userDoc.lastQuotaExceededDate !== today) {
          sendQuotaExceededEmail({
            to: userEmail,
            name: userName,
            feature: FEATURE_LABELS[action] || action,
            limit: dailyLimit,
            resetTime: 'midnight UTC',
            upgradeUrl: `${APP_URL}/pricing`,
            currentPlan: normalizedPlan,
          }).catch(console.error);

          // Push Notification (Phase 20B)
          if (typeof fetch !== 'undefined') {
            fetch('/api/notifications/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uid,
                type: 'quota_exceeded',
                title: '🛑 Daily limit reached',
                body: `You've used all ${FEATURE_LABELS[action] || action} for today. Resets at midnight UTC.`,
                data: { clickUrl: '/pricing' },
              }),
            }).catch(() => {});
          }

          updateUserDocument(uid, { lastQuotaExceededDate: today }).catch(console.error);
        }
      }
    }

    const remaining = dailyLimit === -1 ? 999999 : Math.max(0, dailyLimit - newDailyVal);

    return {
      allowed: true,
      current: newDailyVal,
      limit: dailyLimit,
      remaining,
      resetTime,
    };
  } catch (error) {
    console.error('Usage check failed - failing open for author reliability:', error);
    return {
      allowed: true,
      current: 1,
      limit: limits.daily[action] ?? 3,
      remaining: 2,
      resetTime,
    };
  }
}

/**
 * Get aggregated usage summary for dashboard and banner displays
 */
export async function getUserUsageSummary(uid: string, fallbackPlan: string = 'free'): Promise<UsageSummary> {
  const today = getTodayUtc();
  const currentMonth = getCurrentMonthUtc();
  const resetTime = 'Resets at midnight UTC';

  let userPlan: PlanTier = (fallbackPlan.toLowerCase() as PlanTier) || 'free';
  let userCredits = 0;
  let dailyUsage: Record<string, any> = {};
  let monthlyUsage: Record<string, any> = {};

  try {
    const userDoc = await getUserDocument(uid);
    if (userDoc) {
      userPlan = (userDoc.plan?.toLowerCase() as PlanTier) || userPlan;
      userCredits = Number(userDoc.credits || 0);
      if (userDoc.usage?.daily?.date === today) {
        dailyUsage = userDoc.usage.daily;
      }
      if (userDoc.usage?.monthly?.month === currentMonth) {
        monthlyUsage = userDoc.usage.monthly;
      }
    }
  } catch (err) {
    console.warn('Could not load user doc for usage summary:', err);
  }

  const limits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;
  const trackedActions = ['aiGenerations', 'pdfExports', 'imageGenerations', 'coverExports', 'puzzleGenerations', 'epubExports'];

  const dailyResult: Record<string, MetricUsageItem> = {};
  const monthlyResult: Record<string, MetricUsageItem> = {};
  let highestWarningPercent = 0;
  let criticalWarningAction: string | undefined;

  for (const act of trackedActions) {
    const dLimit = limits.daily[act] !== undefined ? limits.daily[act] : -1;
    const dCurrent = Number(dailyUsage[act] || 0);
    const dUnlimited = dLimit === -1;
    const dPercent = dUnlimited ? 0 : Math.min(100, Math.round((dCurrent / Math.max(1, dLimit)) * 100));

    dailyResult[act] = {
      action: act,
      label: FEATURE_LABELS[act] || act,
      current: dCurrent,
      limit: dLimit,
      percentage: dPercent,
      isUnlimited: dUnlimited,
      remaining: dUnlimited ? 999999 : Math.max(0, dLimit - dCurrent),
    };

    if (!dUnlimited && dPercent > highestWarningPercent) {
      highestWarningPercent = dPercent;
      criticalWarningAction = act;
    }
  }

  const monthlyActions = ['aiGenerations', 'pdfExports', 'imageGenerations'];
  for (const act of monthlyActions) {
    const mLimit = limits.monthly[act] !== undefined ? limits.monthly[act] : -1;
    const mCurrent = Number(monthlyUsage[act] || 0);
    const mUnlimited = mLimit === -1;
    const mPercent = mUnlimited ? 0 : Math.min(100, Math.round((mCurrent / Math.max(1, mLimit)) * 100));

    monthlyResult[act] = {
      action: act,
      label: FEATURE_LABELS[act] || act,
      current: mCurrent,
      limit: mLimit,
      percentage: mPercent,
      isUnlimited: mUnlimited,
      remaining: mUnlimited ? 999999 : Math.max(0, mLimit - mCurrent),
    };
  }

  return {
    plan: userPlan,
    date: today,
    month: currentMonth,
    resetTime,
    credits: userCredits,
    daily: dailyResult,
    monthly: monthlyResult,
    highestWarningPercent,
    criticalWarningAction,
  };
}
