import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, Copy, Check, AlertCircle, Plus, RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import { useBookStore } from '../../lib/store';

interface KeywordIdea {
  keyword: string;
  searchIntent: 'Commercial' | 'Transactional' | 'Informational' | 'Navigational';
  competition: 'Low' | 'Medium' | 'High';
  relevanceScore: number;
  explanation: string;
}

export const KeywordsTab: React.FC = () => {
  const { currentBook, updateBook } = useBookStore();

  const [slots, setSlots] = useState<string[]>([
    'epic fantasy adventure novels',
    'sword and sorcery bestsellers',
    'magic quest kindle unlimited',
    'young adult fantasy series',
    'dark sorcery paperback fiction',
    'mythological mystery stories',
    'bestselling fantasy box set',
  ]);

  const [suggestions, setSuggestions] = useState<KeywordIdea[]>([
    { keyword: 'epic dark fantasy with magic system', searchIntent: 'Commercial', competition: 'Medium', relevanceScore: 97, explanation: 'High commercial volume for fantasy readers' },
    { keyword: 'sword and sorcery grimdark fiction', searchIntent: 'Transactional', competition: 'Low', relevanceScore: 95, explanation: 'Specific high-converting reader trope' },
    { keyword: 'dragons and royal court intrigue', searchIntent: 'Transactional', competition: 'Low', relevanceScore: 94, explanation: 'Popular organic discovery phrase' },
    { keyword: 'kindle unlimited fantasy audiobooks', searchIntent: 'Commercial', competition: 'High', relevanceScore: 92, explanation: 'High buyer volume in KU ecosystem' },
    { keyword: 'coming of age hero fantasy quest', searchIntent: 'Informational', competition: 'Medium', relevanceScore: 90, explanation: 'Classic trope query' },
    { keyword: 'mythological creatures fantasy adventure', searchIntent: 'Commercial', competition: 'Low', relevanceScore: 89, explanation: 'Great for ranking in niche categories' },
    { keyword: 'anti hero chosen one dark fantasy', searchIntent: 'Transactional', competition: 'Low', relevanceScore: 88, explanation: 'Targeted long-tail query' },
    { keyword: 'bestselling modern mythic fiction', searchIntent: 'Navigational', competition: 'Medium', relevanceScore: 86, explanation: 'Broad reader preference' },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSlotIndex, setCopiedSlotIndex] = useState<number | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync with current book keywords if present
  useEffect(() => {
    if (currentBook?.metadata?.keywords && currentBook.metadata.keywords.length > 0) {
      const padded = [...currentBook.metadata.keywords];
      while (padded.length < 7) padded.push('');
      setSlots(padded.slice(0, 7));
    }
  }, [currentBook?.id]);

  const handleGenerateKeywords = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/kdp/keywords', {
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
      if (data.success && data.keywords) {
        setSuggestions(data.keywords);
      }
    } catch (err) {
      console.error('Error suggesting keywords:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateSlot = (index: number, val: string) => {
    const updated = [...slots];
    updated[index] = val;
    setSlots(updated);
  };

  const handleAddKeywordToSlot = (keywordText: string, targetIndex?: number) => {
    const updated = [...slots];
    if (targetIndex !== undefined && targetIndex >= 0 && targetIndex < 7) {
      updated[targetIndex] = keywordText;
    } else {
      // Find first empty slot or replace slot 0
      const emptyIdx = updated.findIndex((s) => s.trim() === '');
      if (emptyIdx !== -1) {
        updated[emptyIdx] = keywordText;
      } else {
        updated[6] = keywordText;
      }
    }
    setSlots(updated);
  };

  const handleAutoFillTop7 = () => {
    if (suggestions.length === 0) return;
    const top7 = suggestions.slice(0, 7).map((s) => s.keyword);
    while (top7.length < 7) top7.push('');
    setSlots(top7);
  };

  const handleClearSlot = (index: number) => {
    const updated = [...slots];
    updated[index] = '';
    setSlots(updated);
  };

  const handleCopySlot = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSlotIndex(index);
    setTimeout(() => setCopiedSlotIndex(null), 1500);
  };

  const handleCopyAll = () => {
    const text = slots.filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleSaveToBook = () => {
    if (!currentBook) return;
    updateBook(currentBook.id, {
      metadata: {
        ...currentBook.metadata,
        keywords: slots.filter(Boolean),
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const getIntentBadgeColor = (intent: string) => {
    switch (intent) {
      case 'Commercial':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Transactional':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Informational':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getCompetitionBadgeColor = (comp: string) => {
    switch (comp) {
      case 'Low':
        return 'bg-emerald-100 text-emerald-800';
      case 'Medium':
        return 'bg-amber-100 text-amber-800';
      case 'High':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div id="kdp-keywords-tab" className="space-y-6">
      {/* Top Banner / Guidelines */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Tag size={18} className="text-purple-600" />
            <span>7 Amazon KDP Backend Keywords</span>
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Amazon KDP allows exactly <strong>7 search keyword boxes</strong>. Each box has a strict{' '}
            <strong>50-character limit</strong>. Use long-tail keyword phrases describing your tropes, subgenre, and
            target reader search queries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleGenerateKeywords}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Analyzing Search Data...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>AI Suggest 20 Keywords</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyAll}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {copiedAll ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>Copy All 7</span>
          </button>

          {currentBook && (
            <button
              onClick={handleSaveToBook}
              className="px-3.5 py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              {savedSuccess ? <Check size={14} className="text-emerald-600" /> : <Check size={14} />}
              <span>Save to Book</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Slots (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Your 7 Amazon KDP Keyword Slots
            </h4>
            <button
              onClick={handleAutoFillTop7}
              className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 hover:underline"
            >
              Auto-fill Top 7 Ideas
            </button>
          </div>

          <div className="space-y-3">
            {slots.map((kw, idx) => {
              const charLen = kw.length;
              const isOverLimit = charLen > 50;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all ${
                    isOverLimit
                      ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
                      : kw.trim()
                      ? 'bg-slate-50/80 border-slate-200 focus-within:border-purple-400 focus-within:bg-white'
                      : 'bg-white border-dashed border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] flex items-center justify-center font-extrabold">
                        {idx + 1}
                      </span>
                      <span>Slot {idx + 1}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isOverLimit
                            ? 'bg-rose-100 text-rose-700 font-bold'
                            : charLen > 45
                            ? 'bg-amber-100 text-amber-800'
                            : 'text-slate-500'
                        }`}
                      >
                        {charLen} / 50 chars
                      </span>

                      {kw.trim() && (
                        <>
                          <button
                            onClick={() => handleCopySlot(kw, idx)}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                            title="Copy"
                          >
                            {copiedSlotIndex === idx ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                          <button
                            onClick={() => handleClearSlot(idx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                            title="Clear slot"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={kw}
                    onChange={(e) => handleUpdateSlot(idx, e.target.value)}
                    placeholder={`e.g. ${
                      idx === 0
                        ? 'epic high fantasy adventure series'
                        : idx === 1
                        ? 'magic system dragons worldbuilding'
                        : 'enter backend keyword phrase...'
                    }`}
                    className="w-full text-xs font-medium bg-transparent border-0 p-0 focus:ring-0 text-slate-800 placeholder:text-slate-400"
                  />

                  {isOverLimit && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-rose-600">
                      <AlertCircle size={11} />
                      <span>Exceeds Amazon 50-character limit! Remove {charLen - 50} chars.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right AI Ideas Bank (7 cols) */}
        <div className="lg:col-span-7 space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-600" />
                <span>AI Ranked Search Keyword Ideas ({suggestions.length})</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Click any suggestion to instantly inject it into an empty slot.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {suggestions.map((idea, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50/40 border border-slate-200/80 hover:border-purple-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-purple-900">
                      "{idea.keyword}"
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">({idea.keyword.length} chars)</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold border ${getIntentBadgeColor(
                        idea.searchIntent
                      )}`}
                    >
                      {idea.searchIntent}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-semibold ${getCompetitionBadgeColor(idea.competition)}`}>
                      {idea.competition} Comp
                    </span>
                    <span className="text-slate-500">
                      Score: <strong className="text-purple-700">{idea.relevanceScore}%</strong>
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">{idea.explanation}</p>
                </div>

                {/* Quick Add Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => handleAddKeywordToSlot(idea.keyword)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-purple-700 hover:bg-purple-600 hover:text-white rounded-lg transition-colors flex items-center gap-1 shadow-2xs whitespace-nowrap"
                    title="Add to first empty slot"
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
