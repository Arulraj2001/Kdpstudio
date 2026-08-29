import React, { useState, useEffect } from 'react';
import { Layers, Sparkles, Search, Check, Plus, Trash2, RefreshCw, ExternalLink, Award } from 'lucide-react';
import { useBookStore } from '../../lib/store';
import { BISAC_CATEGORIES, BisacCategory } from '../../lib/kdpCategories';

interface SuggestedCategory {
  bisacCode: string;
  categoryName: string;
  amazonBrowsePath: string;
  competitionLevel: 'Low' | 'Medium' | 'High';
  rankingViability: string;
  reason: string;
}

export const CategoriesTab: React.FC = () => {
  const { currentBook, updateBook } = useBookStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMajor, setFilterMajor] = useState<string>('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Books > Science Fiction & Fantasy > Fantasy > Epic',
    'Books > Literature & Fiction > Action & Adventure',
  ]);

  const [aiSuggestions, setAiSuggestions] = useState<SuggestedCategory[]>([
    {
      bisacCode: 'FIC009020',
      categoryName: 'Fiction / Fantasy / Epic',
      amazonBrowsePath: 'Books > Science Fiction & Fantasy > Fantasy > Epic',
      competitionLevel: 'Medium',
      rankingViability: 'High (#1 Orange Banner reachable with ~25 sales/day)',
      reason: 'Perfect sub-genre alignment for high-converting fantasy readers.',
    },
    {
      bisacCode: 'FIC002000',
      categoryName: 'Fiction / Action & Adventure',
      amazonBrowsePath: 'Books > Literature & Fiction > Action & Adventure',
      competitionLevel: 'Low',
      rankingViability: 'Very High (Low saturation sub-niche)',
      reason: 'Helps your book rank on broader discovery lists without competing against ultra-famous titans.',
    },
    {
      bisacCode: 'FIC028010',
      categoryName: 'Fiction / Science Fiction / Space Opera',
      amazonBrowsePath: 'Books > Science Fiction & Fantasy > Science Fiction > Space Opera',
      competitionLevel: 'Low',
      rankingViability: 'High (Great crossover appeal)',
      reason: 'Attracts readers looking for expansive worldbuilding and high-stakes drama.',
    },
  ]);

  // Sync with book metadata
  useEffect(() => {
    if (currentBook?.metadata?.categories && currentBook.metadata.categories.length > 0) {
      setSelectedCategories(currentBook.metadata.categories);
    }
  }, [currentBook?.id]);

  const handleGenerateCategories = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/kdp/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentBook?.title || 'Echoes of Eternity',
          subtitle: currentBook?.subtitle || '',
          genre: currentBook?.genre || 'Fantasy',
          description: currentBook?.metadata?.description || '',
        }),
      });

      const data = await res.json();
      if (data.success && data.categories) {
        setAiSuggestions(data.categories);
      }
    } catch (err) {
      console.error('Error suggesting categories:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddCategory = (path: string) => {
    if (selectedCategories.includes(path)) return;
    if (selectedCategories.length >= 3) {
      // Replace last one
      setSelectedCategories([selectedCategories[0], selectedCategories[1], path]);
    } else {
      setSelectedCategories([...selectedCategories, path]);
    }
  };

  const handleRemoveCategory = (index: number) => {
    setSelectedCategories(selectedCategories.filter((_, i) => i !== index));
  };

  const handleSaveToBook = () => {
    if (!currentBook) return;
    updateBook(currentBook.id, {
      metadata: {
        ...currentBook.metadata,
        categories: selectedCategories,
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Filtered BISAC Catalog
  const filteredCatalog = BISAC_CATEGORIES.filter((cat) => {
    const matchesMajor = filterMajor === 'All' || cat.majorCategory === filterMajor;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      cat.name.toLowerCase().includes(q) ||
      cat.browseNodePath.toLowerCase().includes(q) ||
      cat.code.toLowerCase().includes(q) ||
      cat.keywords.some((k) => k.includes(q));

    return matchesMajor && matchesQuery;
  });

  const getCompColor = (level: string) => {
    if (level === 'Low') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (level === 'Medium') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  return (
    <div id="kdp-categories-tab" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers size={18} className="text-purple-600" />
            <span>KDP BISAC Categories & Amazon Browse Nodes</span>
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Amazon allows you to choose up to <strong>3 primary categories</strong> during book setup. Choosing specific,
            low-competition categories maximizes your odds of getting the coveted <strong>#1 Bestseller Orange Ribbon</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGenerateCategories}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Finding Best Niche Categories...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>AI Suggest Niche Categories</span>
              </>
            )}
          </button>

          {currentBook && (
            <button
              onClick={handleSaveToBook}
              className="px-3.5 py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              {savedSuccess ? <Check size={14} className="text-emerald-600" /> : <Check size={14} />}
              <span>Save Categories</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Categories Display Card */}
      <div className="bg-gradient-to-br from-purple-900/5 to-indigo-900/5 p-5 rounded-2xl border border-purple-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Award size={15} className="text-purple-600" />
            <span>Your Selected KDP Categories ({selectedCategories.length} / 3 Selected)</span>
          </h4>
          <span className="text-[11px] text-slate-500">KDP limits books to 3 categories per format</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[0, 1, 2].map((slotIdx) => {
            const path = selectedCategories[slotIdx];
            return (
              <div
                key={slotIdx}
                className={`p-3.5 rounded-xl border transition-all ${
                  path
                    ? 'bg-white border-purple-200 shadow-xs'
                    : 'bg-white/50 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs'
                }`}
              >
                {path ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                        Category {slotIdx + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveCategory(slotIdx)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                        title="Remove category"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 leading-snug break-words">{path}</p>
                  </div>
                ) : (
                  <span>+ Empty Category Slot {slotIdx + 1}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Category Recommendations & Searchable Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: AI Recommendations (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-600" />
              <span>AI Recommended High-Rank Niches</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Curated categories with low competition where your book can achieve top visibility.
            </p>
          </div>

          <div className="space-y-3">
            {aiSuggestions.map((sug, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-purple-300 space-y-2 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{sug.bisacCode}</span>
                    <h5 className="text-xs font-bold text-slate-900">{sug.categoryName}</h5>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCompColor(sug.competitionLevel)}`}>
                    {sug.competitionLevel} Comp
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700">
                  {sug.amazonBrowsePath}
                </div>

                <div className="text-[11px] text-purple-900 font-medium bg-purple-50 p-2 rounded-lg border border-purple-100">
                  🏆 {sug.rankingViability}
                </div>

                <p className="text-[11px] text-slate-600 leading-tight">{sug.reason}</p>

                <button
                  onClick={() => handleAddCategory(sug.amazonBrowsePath)}
                  disabled={selectedCategories.includes(sug.amazonBrowsePath)}
                  className="w-full py-1.5 px-3 bg-white hover:bg-purple-600 hover:text-white text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {selectedCategories.includes(sug.amazonBrowsePath) ? (
                    <>
                      <Check size={13} />
                      <span>Already Selected</span>
                    </>
                  ) : (
                    <>
                      <Plus size={13} />
                      <span>Add to My Categories</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Searchable BISAC Catalog (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Full BISAC & Amazon Category Catalog
              </h4>
              <p className="text-[11px] text-slate-500">Search over official Amazon publishing subject codes</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-semibold">
              {['All', 'Fiction', 'Non-Fiction', 'Young Adult'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterMajor(f)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterMajor === f ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category, keywords (e.g. fantasy, thriller, self-help, investing)..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
            />
          </div>

          {/* Catalog list */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredCatalog.map((cat, index) => {
              const isSelected = selectedCategories.includes(cat.browseNodePath);
              return (
                <div
                  key={index}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-purple-50/50 border-purple-300'
                      : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500">{cat.code}</span>
                      <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono">{cat.browseNodePath}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cat.keywords.map((kw, i) => (
                        <span key={i} className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddCategory(cat.browseNodePath)}
                    disabled={isSelected}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-purple-600 hover:text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check size={13} />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus size={13} />
                        <span>Select</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
