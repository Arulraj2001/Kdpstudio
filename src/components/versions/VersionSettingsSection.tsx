/**
 * KDP Studio — Version History Settings Section
 * Phase 16B
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  Camera,
  Calendar,
  Bell,
  HardDrive,
  ShieldCheck,
  Sparkles,
  Lock,
  Save,
  Check,
  Loader2,
} from 'lucide-react';
import { VersionHistoryConfig } from '../../types/versions';
import { getVersionConfig, saveVersionConfig, SNAPSHOT_LIMITS } from '../../lib/versionService';
import { useAuthStore } from '../../lib/authStore';
import { useToastStore } from '../../lib/toastStore';
import { useCheckoutStore } from '../../lib/checkoutStore';

export const VersionSettingsSection: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const userPlan = user?.plan || 'free';
  const openCheckout = useCheckoutStore((state) => state.open);

  const isFreePlan = userPlan === 'free';
  const isStarter = userPlan === 'starter';
  const isProOrAbove = userPlan === 'pro' || userPlan === 'agency' || userPlan === 'lifetime';

  const [config, setConfig] = useState<VersionHistoryConfig>({
    uid: user?.uid || '',
    autoSnapshotOnExport: true,
    autoSnapshotDaily: false,
    retentionDays: null,
    notifyOnAutoSnapshot: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      if (!user?.uid) return;
      setIsLoading(true);
      try {
        const loaded = await getVersionConfig(user.uid);
        setConfig(loaded);
      } catch (err) {
        console.warn('Failed to load version config:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, [user?.uid]);

  const handleSave = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await saveVersionConfig(user.uid, config);
      useToastStore.getState().addToast({
        message: 'Version history settings saved! 💾',
        type: 'success',
      });
    } catch (err: any) {
      useToastStore.getState().addToast({
        message: err.message || 'Failed to save settings',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-950 border border-purple-800/60 text-purple-400 flex items-center justify-center">
            <History size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Version History &amp; Backups</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
                {userPlan.toUpperCase()}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Configure automatic snapshots, backup schedules, and retention policies
            </p>
          </div>
        </div>
      </div>

      {/* Plan Limits Card */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>
              {isFreePlan && 'Version history not available on Free plan'}
              {isStarter && '5 snapshots per book · Manual & Export auto-saves'}
              {userPlan === 'pro' && '30 snapshots per book · Daily backups & export saves'}
              {(userPlan === 'agency' || userPlan === 'lifetime') &&
                'Unlimited snapshots per book · Full enterprise retention'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isFreePlan
              ? 'Upgrade to preserve book versions, restore accidental formatting changes, and track diffs.'
              : 'Snapshots are securely stored with automatic FIFO cleanup when plan limits are reached.'}
          </p>
        </div>

        {isFreePlan && (
          <button
            type="button"
            onClick={() => openCheckout('starter')}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Upgrade to Starter</span>
          </button>
        )}
      </div>

      {/* Settings Options Form (Gated for Starter+) */}
      {isFreePlan ? (
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
          <Lock size={24} className="text-slate-500 mx-auto" />
          <p className="text-xs text-slate-400">
            Automated snapshot settings are unlocked on Starter, Pro, and Agency plans.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Toggle 1: Auto Snapshot on Export */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800 gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Camera size={14} className="text-purple-400" />
                <span>Auto-snapshot on Export</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Automatically save a snapshot every time you export a PDF or EPUB manuscript.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={config.autoSnapshotOnExport}
                onChange={(e) => setConfig({ ...config, autoSnapshotOnExport: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Toggle 2: Daily Backup (Pro+) */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800 gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-400" />
                  <span>Daily Cloud Backup</span>
                </span>
                {!isProOrAbove && (
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-800">
                    Pro
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Save an automatic daily backup snapshot of all active manuscripts at 2:00 AM UTC.
              </p>
            </div>

            <label
              className={`relative inline-flex items-center ${
                isProOrAbove ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
              } shrink-0`}
            >
              <input
                type="checkbox"
                disabled={!isProOrAbove}
                checked={isProOrAbove && config.autoSnapshotDaily}
                onChange={(e) => setConfig({ ...config, autoSnapshotDaily: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Toggle 3: Notifications (Pro+) */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800 gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Bell size={14} className="text-amber-400" />
                  <span>Notify on Auto-Snapshot</span>
                </span>
                {!isProOrAbove && (
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-800">
                    Pro
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Show a notification badge when automated background snapshots are created.
              </p>
            </div>

            <label
              className={`relative inline-flex items-center ${
                isProOrAbove ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
              } shrink-0`}
            >
              <input
                type="checkbox"
                disabled={!isProOrAbove}
                checked={isProOrAbove && config.notifyOnAutoSnapshot}
                onChange={(e) => setConfig({ ...config, notifyOnAutoSnapshot: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Radio: Retention Policy (Pro+) */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <HardDrive size={14} className="text-cyan-400" />
                <span>Retention Policy</span>
              </span>
              {!isProOrAbove && (
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-800">
                  Pro
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { label: 'Forever', value: null },
                { label: '90 Days', value: 90 },
                { label: '180 Days', value: 180 },
                { label: '1 Year', value: 365 },
              ].map((opt) => {
                const isSelected = config.retentionDays === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={!isProOrAbove}
                    onClick={() => setConfig({ ...config, retentionDays: opt.value })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                      isSelected
                        ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    } ${!isProOrAbove ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Snapshots are stored securely in Google Cloud / Firebase.
            </span>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Version Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
