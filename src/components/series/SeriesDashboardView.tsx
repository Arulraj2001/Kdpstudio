/**
 * Series Dashboard View — Lists all user series with progress, plan banner, and empty states.
 * Phase 12B — KDP Studio
 */

import React, { useEffect } from 'react';
import { 
  BookMarked, 
  Plus, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Bookmark, 
  ExternalLink,
  Lock,
  Crown
} from 'lucide-react';
import { useSeriesStore } from '../../lib/seriesStore';
import { useAuthStore } from '../../lib/authStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { PageRoute } from '../../types';

interface SeriesDashboardViewProps {
  onNavigate: (route: PageRoute, params?: Record<string, string>) => void;
}

export const SeriesDashboardView: React.FC<SeriesDashboardViewProps> = ({ onNavigate }) => {
  const { user, userDoc } = useAuthStore();
  const { seriesList, isLoading, loadUserSeries, selectSeries } = useSeriesStore();
  const { open: openCheckout } = useCheckoutStore();

  const plan = userDoc?.plan || 'free';
  const isFree = plan === 'free';
  const isStarter = plan === 'starter';
  const isProOrAbove = plan === 'pro' || plan === 'agency' || (plan as string) === 'lifetime';

  useEffect(() => {
    if (user?.uid) {
      loadUserSeries(user.uid);
    }
  }, [user?.uid, loadUserSeries]);

  const handleCreateClick = () => {
    if (isFree) {
      openCheckout('starter');
      return;
    }
    if (isStarter && seriesList.length >= 1) {
      openCheckout('pro');
      return;
    }
    onNavigate('series-new');
  };

  const handleManageSeries = async (seriesId: string) => {
    await selectSeries(seriesId);
    onNavigate('series-detail', { id: seriesId });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
            <CheckCircle2 size={12} />
            <span>Complete</span>
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <Sparkles size={12} />
            <span>Active</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock size={12} />
            <span>Planning</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <BookMarked size={22} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Book Series Manager</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Organize your books into series for consistent branding, cover continuity, and Amazon discoverability.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateClick}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-purple-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>New Series</span>
        </button>
      </div>

      {/* Plan Gate / Capacity Banner */}
      {isFree && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Lock size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Series Manager is available on Starter & Pro plans</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Group your books into series, manage spine continuity, share KDP keywords, and generate Series Bibles.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openCheckout('starter')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
          >
            Upgrade to Starter
          </button>
        </div>
      )}

      {isStarter && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-indigo-950 font-medium">
            <Crown size={16} className="text-indigo-600 shrink-0" />
            <span>
              <strong>Starter Plan:</strong> You can create <strong>1 series</strong> on your current plan ({seriesList.length}/1 used).
            </span>
          </div>
          {seriesList.length >= 1 && (
            <button
              type="button"
              onClick={() => openCheckout('pro')}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0"
            >
              Upgrade to Pro for Unlimited
            </button>
          )}
        </div>
      )}

      {/* Series List or Empty State */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium mt-3">Loading your book series...</p>
        </div>
      ) : seriesList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-inner">
            <Layers size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-900">No book series yet</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            Series help you build a recognizable author brand and boost read-through rates. Readers who finish Book 1 can immediately dive into Book 2.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleCreateClick}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={18} />
              <span>Create Your First Series</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {seriesList.map((series) => {
            const topColor = series.colorScheme.primaryColors?.[0] || series.colorScheme.palette?.[0] || '#7c3aed';
            const createdCount = series.bookIds.length;
            const totalCount = Math.max(series.totalVolumes, createdCount);

            return (
              <div
                key={series.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Top Color Bar */}
                  <div
                    className="h-3 w-full transition-all"
                    style={{ backgroundColor: topColor }}
                  />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
                          {series.genre}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 truncate mt-0.5 group-hover:text-purple-600 transition-colors">
                          {series.title}
                        </h3>
                        {series.subtitle && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{series.subtitle}</p>
                        )}
                      </div>
                      {getStatusBadge(series.status)}
                    </div>

                    {series.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                        {series.description}
                      </p>
                    )}

                    {/* Books Progress Grid */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-slate-700">Volumes Progress:</span>
                        <span className="font-bold text-slate-900">
                          {createdCount} of {totalCount} volumes created
                        </span>
                      </div>

                      {/* Visual Blocks Strip */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {Array.from({ length: totalCount }).map((_, idx) => {
                          const isCreated = idx < createdCount;
                          const volColor = series.colorScheme.primaryColors?.[idx] || topColor;
                          return (
                            <div
                              key={idx}
                              title={`Volume ${idx + 1}: ${isCreated ? 'Created' : 'Planned'}`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all"
                              style={{
                                backgroundColor: isCreated ? volColor : '#f8fafc',
                                color: isCreated ? '#ffffff' : '#94a3b8',
                                borderColor: isCreated ? volColor : '#e2e8f0',
                              }}
                            >
                              {idx + 1}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 font-medium">
                    Layout: <strong className="text-slate-700 capitalize">{series.coverStyle.layout}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleManageSeries(series.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-purple-50 text-purple-700 hover:text-purple-800 border border-slate-200 hover:border-purple-200 font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <span>Manage Series</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
