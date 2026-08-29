/**
 * KDP Studio — Publishing Goals & Milestones Tracker
 * Phase 15B
 */

import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Trophy,
  CheckCircle2,
  Calendar,
  DollarSign,
  Package,
  BookOpen,
  Trash2,
  Edit,
  Sparkles,
  Lock,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { PageRoute } from '../../types';
import { PublishedBook, PublishingGoal } from '../../types/analytics';
import {
  getUserGoals,
  getUserPublishedBooks,
  updateGoalProgress,
  updateGoal,
  deleteGoal,
} from '../../lib/analyticsService';
import { useAuthStore } from '../../lib/authStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { useToastStore } from '../../lib/toastStore';
import { NewGoalModal } from './NewGoalModal';
import { trackFeatureUse } from '../../lib/featureTracker';

interface PublishingGoalsViewProps {
  onBack?: () => void;
  onNavigate?: (route: PageRoute) => void;
}

export const PublishingGoalsView: React.FC<PublishingGoalsViewProps> = ({
  onBack,
  onNavigate,
}) => {
  const { user, userDoc } = useAuthStore();
  const { open } = useCheckoutStore();
  const plan = userDoc?.plan || 'free';
  const isPro = plan === 'pro' || plan === 'agency' || plan === 'lifetime';
  const uid = user?.uid || userDoc?.uid || 'demo-user-123';

  const [goals, setGoals] = useState<PublishingGoal[]>([]);
  const [books, setBooks] = useState<PublishedBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);

  // Celebration Modal
  const [celebratedGoal, setCelebratedGoal] = useState<PublishingGoal | null>(null);

  const loadGoalsData = async () => {
    setIsLoading(true);
    try {
      await updateGoalProgress(uid).catch(() => {});
      const [fetchedGoals, fetchedBooks] = await Promise.all([
        getUserGoals(uid),
        getUserPublishedBooks(uid),
      ]);
      setGoals(fetchedGoals);
      setBooks(fetchedBooks);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGoalsData();
  }, [uid]);

  const activeGoals = goals.filter((g) => g.status === 'active');
  const achievedGoals = goals.filter((g) => g.status === 'achieved');

  const handleMarkComplete = async (goal: PublishingGoal) => {
    const now = new Date().toISOString();
    await updateGoal(goal.id, {
      status: 'achieved',
      achievedDate: now,
      currentValue: goal.targetValue,
    });
    setCelebratedGoal(goal);
    if (user?.uid) {
      trackFeatureUse(user.uid, 'goal_achieved', { goalId: goal.id, title: goal.title }).catch(console.error);
    }
    useToastStore.getState().addToast({ message: 'Goal marked as achieved! 🏆', type: 'success' });
    loadGoalsData();
  };

  const handleDeleteGoal = async (goalId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    await deleteGoal(goalId);
    useToastStore.getState().addToast({ message: 'Goal deleted.', type: 'info' });
    loadGoalsData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Overview</span>
            </button>
          )}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-800/60 flex items-center gap-1">
              <Target size={12} />
              <span>Publishing Roadmap</span>
            </span>
            <span className="text-xs text-slate-400">· {activeGoals.length} Active Goals</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Publishing Goals &amp; Targets
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Set and track revenue, volume, and catalog expansion milestones. Automatic progress updates on every sales entry.
          </p>
        </div>

        <button
          onClick={() => {
            if (!isPro) {
              open('pro');
              return;
            }
            setIsNewGoalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus size={15} />
          <span>New Goal</span>
        </button>
      </div>

      {/* Plan Gate Banner for Free/Starter */}
      {!isPro && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-purple-950/60 to-slate-900 border border-amber-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
              <Lock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  Pro Feature
                </span>
                <h3 className="text-sm font-bold text-white">Publishing Goals require Pro plan</h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Set monthly revenue targets, track units sold towards milestones, and celebrate milestone achievements.
              </p>
            </div>
          </div>

          <button
            onClick={() => open('pro')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-extrabold shadow-md cursor-pointer"
          >
            Upgrade to Pro ➔
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ACTIVE GOALS GRID */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>Active Milestones ({activeGoals.length})</span>
        </h2>

        {activeGoals.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
            <Target size={32} className="text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Active Goals Set</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Set a monthly royalty target or book publishing quota to keep your catalog growing.
            </p>
            <button
              onClick={() => (isPro ? setIsNewGoalOpen(true) : open('pro'))}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
            >
              + Create First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((g) => {
              const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) || 0;
              const remaining = Math.max(0, g.targetValue - g.currentValue);

              return (
                <div
                  key={g.id}
                  className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800/60 text-purple-400 flex items-center justify-center shrink-0">
                          {g.type === 'royalties' || g.type === 'revenue' ? (
                            <DollarSign size={16} />
                          ) : g.type === 'units' ? (
                            <Package size={16} />
                          ) : g.type === 'books-published' ? (
                            <BookOpen size={16} />
                          ) : (
                            <Trophy size={16} />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white line-clamp-1">{g.title}</h3>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {g.period} Target {g.targetDate ? `· Due ${g.targetDate}` : ''}
                          </span>
                        </div>
                      </div>

                      <span className="text-sm font-extrabold text-purple-400 font-mono">
                        {pct}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 80
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                              : pct >= 50
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                              : 'bg-slate-700'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>
                          {g.unit === '$' || g.unit === '₹' || g.unit === '£' || g.unit === '€'
                            ? `${g.unit}${g.currentValue.toLocaleString()}`
                            : `${g.currentValue} ${g.unit}`}
                        </span>
                        <span>
                          Target:{' '}
                          {g.unit === '$' || g.unit === '₹' || g.unit === '£' || g.unit === '€'
                            ? `${g.unit}${g.targetValue.toLocaleString()}`
                            : `${g.targetValue} ${g.unit}`}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span className="text-[11px]">
                        🟡 Active · {remaining} {g.unit} remaining
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleMarkComplete(g)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark Achieved</span>
                    </button>

                    <button
                      onClick={() => handleDeleteGoal(g.id, g.title)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ACHIEVED GOALS SECTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {achievedGoals.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🏆 Achieved Milestones ({achievedGoals.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievedGoals.map((g) => (
              <div
                key={g.id}
                className="p-5 rounded-3xl bg-slate-900/60 border border-emerald-800/40 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{g.title}</h4>
                      <span className="text-[10px] text-emerald-400">
                        Achieved {g.achievedDate ? g.achievedDate.substring(0, 10) : 'Recently'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-emerald-400 font-mono">100%</span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Goal Modal */}
      <NewGoalModal
        uid={uid}
        publishedBooks={books}
        isOpen={isNewGoalOpen}
        onClose={() => setIsNewGoalOpen(false)}
        onSaved={() => loadGoalsData()}
      />

      {/* CELEBRATION MODAL */}
      {celebratedGoal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-8 max-w-sm text-center shadow-2xl space-y-4 animate-scale-in relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <Trophy size={32} className="animate-bounce" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                Milestone Achieved!
              </span>
              <h3 className="text-lg font-extrabold text-white mt-1">
                🎉 Congratulations!
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                You hit your target for <strong className="text-white">"{celebratedGoal.title}"</strong>!
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setCelebratedGoal(null)}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Continue Publishing 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
