/**
 * KDP Studio — Saved Niches Management View
 * Phase 13B
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  Search,
  LayoutGrid,
  List,
  Trash2,
  ExternalLink,
  BookOpen,
  ArrowLeft,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { SavedNiche, SavedNicheStatus, NicheResult } from '../../types/niche';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { useToastStore } from '../../lib/toastStore';
import {
  getUserSavedNiches,
  updateSavedNiche,
  deleteSavedNiche,
} from '../../lib/nicheService';

interface SavedNichesViewProps {
  onBack: () => void;
  onSelectNicheDetail: (niche: NicheResult, savedNicheId: string) => void;
  onNavigate: (route: PageRoute) => void;
}

export const SavedNichesView: React.FC<SavedNichesViewProps> = ({
  onBack,
  onSelectNicheDetail,
  onNavigate,
}) => {
  const { user, userDoc } = useAuthStore();
  const uid = user?.uid || userDoc?.uid || 'demo-user-123';

  const [savedNiches, setSavedNiches] = useState<SavedNiche[]>([]);
  const [statusFilter, setStatusFilter] = useState<SavedNicheStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'status'>('score');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNiches();
  }, [uid]);

  const loadNiches = async () => {
    setIsLoading(true);
    try {
      const data = await getUserSavedNiches(uid);
      setSavedNiches(data);
    } catch (e) {
      console.warn('Failed to fetch saved niches:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSavedNiche(id);
      setSavedNiches((prev) => prev.filter((s) => s.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      useToastStore.getState().addToast({ message: 'Niche deleted from saved list.', type: 'info' });
    } catch (e) {
      useToastStore.getState().addToast({ message: 'Failed to delete niche', type: 'error' });
    }
  };

  const handleStatusChange = async (id: string, newStatus: SavedNicheStatus) => {
    try {
      await updateSavedNiche(id, { status: newStatus });
      setSavedNiches((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
      useToastStore.getState().addToast({ message: `Status updated to ${newStatus}`, type: 'success' });
    } catch (e) {
      useToastStore.getState().addToast({ message: 'Failed to update status', type: 'error' });
    }
  };

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedIds.length === filteredNiches.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNiches.map((n) => n.id));
    }
  };

  const handleBulkStatus = async (newStatus: SavedNicheStatus) => {
    if (!selectedIds.length) return;
    for (const id of selectedIds) {
      await updateSavedNiche(id, { status: newStatus });
    }
    setSavedNiches((prev) =>
      prev.map((s) => (selectedIds.includes(s.id) ? { ...s, status: newStatus } : s))
    );
    useToastStore.getState().addToast({ message: `Updated ${selectedIds.length} niches to ${newStatus}`, type: 'success' });
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    for (const id of selectedIds) {
      await deleteSavedNiche(id);
    }
    setSavedNiches((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
    useToastStore.getState().addToast({ message: `Deleted ${selectedIds.length} niches`, type: 'info' });
    setSelectedIds([]);
  };

  const filteredNiches = useMemo(() => {
    return savedNiches
      .filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const title = item.nicheResult?.nicheTitle?.toLowerCase() || '';
          const category = item.nicheResult?.category?.toLowerCase() || '';
          return title.includes(q) || category.includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          return (b.nicheResult?.opportunityScore || 0) - (a.nicheResult?.opportunityScore || 0);
        }
        if (sortBy === 'date') {
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
        }
        return (a.status || '').localeCompare(b.status || '');
      });
  }, [savedNiches, statusFilter, searchQuery, sortBy]);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'considering':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
      case 'researching':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      case 'writing':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'published':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'abandoned':
        return 'bg-slate-900 text-slate-500 border-slate-800';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400 bg-emerald-950/80 border-emerald-700/60';
    if (score >= 40) return 'text-amber-400 bg-amber-950/80 border-amber-700/60';
    return 'text-rose-400 bg-rose-950/80 border-rose-700/60';
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 text-slate-100 space-y-6">
      {/* Top Breadcrumb */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Back to Niche Research</span>
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Star size={24} className="text-amber-400 fill-amber-400" />
            Starred & Saved Niches
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            {savedNiches.length} book niches curated for your publishing pipeline
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {(['all', 'considering', 'researching', 'writing', 'published', 'abandoned'] as const).map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-850'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter saved niches by title or category..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden"
            >
              <option value="score">Opportunity Score</option>
              <option value="date">Date Saved</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 text-xs text-purple-200">
            <span>{selectedIds.length} niches selected</span>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => handleBulkStatus(e.target.value as any)}
                defaultValue=""
                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200"
              >
                <option value="" disabled>
                  Change Status...
                </option>
                <option value="considering">Considering</option>
                <option value="researching">Researching</option>
                <option value="writing">Writing</option>
                <option value="published">Published</option>
                <option value="abandoned">Abandoned</option>
              </select>

              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid or List View */}
      {filteredNiches.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Star size={32} className="mx-auto mb-3 opacity-30 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-300">
            {statusFilter === 'all'
              ? 'No saved niches found'
              : `No niches in "${statusFilter}" status`}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Explore the Niche Research tool and click "Save Niche" on any promising Amazon category.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNiches.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => onSelectNicheDetail(item.nicheResult, item.id)}
                className={`p-5 rounded-2xl bg-slate-900/90 border transition-all flex flex-col justify-between cursor-pointer group shadow-lg ${
                  isSelected ? 'border-purple-500 bg-purple-950/20' : 'border-slate-800 hover:border-purple-500/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIds((prev) =>
                          isSelected ? prev.filter((i) => i !== item.id) : [...prev, item.id]
                        );
                      }}
                      className="text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {isSelected ? <CheckSquare size={16} className="text-purple-400" /> : <Square size={16} />}
                    </button>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>

                    <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold ${getScoreColor(item.nicheResult?.opportunityScore || 70)}`}>
                      {item.nicheResult?.opportunityScore}/100
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 leading-snug line-clamp-2">
                    {item.nicheResult?.nicheTitle}
                  </h3>

                  <p className="text-[11px] text-slate-400 capitalize mt-1">
                    {item.nicheResult?.category?.replace('-', ' ')} • {item.nicheResult?.subcategory}
                  </p>

                  {item.nicheResult?.verdict && (
                    <p className="mt-2 text-xs text-slate-300 italic line-clamp-2">
                      "{item.nicheResult.verdict}"
                    </p>
                  )}

                  {item.linkedBookId && (
                    <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-700/50 text-[10px] text-emerald-300 font-medium">
                      <BookOpen size={11} /> Linked to active book
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500">
                    Saved {new Date(item.savedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectNicheDetail(item.nicheResult, item.id);
                      }}
                      className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Open Report
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3 w-10">
                  <button onClick={handleSelectAll} className="cursor-pointer">
                    {selectedIds.length === filteredNiches.length && filteredNiches.length > 0 ? (
                      <CheckSquare size={15} className="text-purple-400" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                </th>
                <th className="p-3">Score</th>
                <th className="p-3">Niche Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Saved Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredNiches.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectNicheDetail(item.nicheResult, item.id)}
                  className="hover:bg-slate-850/60 transition-colors cursor-pointer"
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() =>
                        setSelectedIds((prev) =>
                          prev.includes(item.id)
                            ? prev.filter((i) => i !== item.id)
                            : [...prev, item.id]
                        )
                      }
                      className="rounded bg-slate-900 border-slate-700 cursor-pointer"
                    />
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold border ${getScoreColor(item.nicheResult?.opportunityScore || 70)}`}>
                      {item.nicheResult?.opportunityScore}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-white max-w-xs truncate">
                    {item.nicheResult?.nicheTitle}
                  </td>
                  <td className="p-3 text-slate-400 capitalize">
                    {item.nicheResult?.category?.replace('-', ' ')}
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border focus:outline-hidden ${getStatusBadge(item.status)}`}
                    >
                      <option value="considering">Considering</option>
                      <option value="researching">Researching</option>
                      <option value="writing">Writing</option>
                      <option value="published">Published</option>
                      <option value="abandoned">Abandoned</option>
                    </select>
                  </td>
                  <td className="p-3 text-slate-500">
                    {new Date(item.savedAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
