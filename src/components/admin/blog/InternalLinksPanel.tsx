'use client';

import React, { useState, useEffect } from 'react';
import {
  Link2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Search,
  ArrowRight,
  AlertCircle,
  Layers,
  X,
  FileText,
} from 'lucide-react';
import { BlogPost } from '../../../types/blog';
import {
  InternalLinkSuggestion,
  LinkAnalysisResult,
  PostLinkData,
  findInternalLinkOpportunities,
  analyzePostLinks,
} from '../../../lib/internalLinkService';

interface InternalLinksPanelProps {
  currentPost: Partial<BlogPost>;
  editorContent: string;
  onInsertLink: (slug: string, anchorText: string, mode: 'wrap' | 'append') => void;
}

export const InternalLinksPanel: React.FC<InternalLinksPanelProps> = ({
  currentPost,
  editorContent,
  onInsertLink,
}) => {
  const [allPosts, setAllPosts] = useState<PostLinkData[]>([]);
  const [suggestions, setSuggestions] = useState<InternalLinkSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<LinkAnalysisResult | null>(null);

  // Link Insertion Dialog State
  const [selectedSuggestion, setSelectedSuggestion] = useState<InternalLinkSuggestion | null>(null);
  const [customAnchorText, setCustomAnchorText] = useState<string>('');
  const [insertMode, setInsertMode] = useState<'wrap' | 'append' | 'copy'>('wrap');
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch all post link data on mount
  useEffect(() => {
    fetch('/api/admin/blog/posts')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.posts)) {
          const mapped: PostLinkData[] = data.posts
            .filter((p: any) => p.status === 'published')
            .map((p: any) => ({
              id: p.id,
              slug: p.slug || p.id,
              title: p.title || 'Untitled',
              excerpt: p.excerpt || '',
              category: p.category || '',
              tags: p.tags || [],
              focusKeyword: p.focusKeyword || '',
              secondaryKeywords: p.secondaryKeywords || [],
              wordCount: p.wordCount || 0,
              publishedAt: p.publishedAt || new Date(),
              content: p.content || '',
            }));
          setAllPosts(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Update link analysis live as content changes
  useEffect(() => {
    const res = analyzePostLinks(editorContent, allPosts);
    setAnalysis(res);
  }, [editorContent, allPosts]);

  const handleScanOpportunities = () => {
    setLoading(true);
    setHasScanned(true);

    setTimeout(() => {
      const opps = findInternalLinkOpportunities(
        {
          ...currentPost,
          content: editorContent,
        },
        allPosts
      );
      setSuggestions(opps);
      setLoading(false);
    }, 400);
  };

  const handleOpenInsertModal = (sug: InternalLinkSuggestion) => {
    setSelectedSuggestion(sug);
    setCustomAnchorText(sug.suggestedAnchorText);
    setInsertMode('wrap');
    setCopied(false);
  };

  const handleConfirmInsert = () => {
    if (!selectedSuggestion) return;
    const anchor = customAnchorText.trim() || selectedSuggestion.suggestedAnchorText;

    if (insertMode === 'copy') {
      const htmlSnippet = `<a href="/blog/${selectedSuggestion.slug}">${anchor}</a>`;
      navigator.clipboard.writeText(htmlSnippet);
      setCopied(true);
      setTimeout(() => setSelectedSuggestion(null), 1200);
    } else {
      onInsertLink(selectedSuggestion.slug, anchor, insertMode);
      setSelectedSuggestion(null);
    }
  };

  // Duplicate anchor text warning
  const isAnchorAlreadyUsed = (anchor: string) => {
    if (!analysis) return false;
    return analysis.internalLinks.some((l) => l.anchorText.toLowerCase() === anchor.toLowerCase());
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Link2 size={14} className="text-purple-600" />
            <span>Internal Link Assistant</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Boost topical authority and Google crawl depth
          </p>
        </div>

        <button
          type="button"
          onClick={handleScanOpportunities}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Scanning...' : 'Scan Links'}</span>
        </button>
      </div>

      {/* ── Link Health Summary Card ── */}
      {analysis && (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-800">Link Health Score</span>
            <span className={`px-2 py-0.5 rounded-md border text-[10px] ${analysis.statusColor}`}>
              {analysis.statusLabel}
            </span>
          </div>

          {/* Internal vs External metrics */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="font-extrabold text-slate-900 text-sm">{analysis.totalInternalLinks}</div>
              <div className="text-[10px] text-slate-500 font-medium">Internal Links (Ideal: 2-5)</div>
            </div>
            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="font-extrabold text-slate-900 text-sm">{analysis.externalLinksCount}</div>
              <div className="text-[10px] text-slate-500 font-medium">External Citations</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Suggestions Section ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>Top Opportunity Candidates</span>
          {suggestions.length > 0 && (
            <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
              {suggestions.filter((s) => !s.alreadyLinked).length} unlinked
            </span>
          )}
        </div>

        {!hasScanned && (
          <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
            <Sparkles size={20} className="text-purple-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">Scan for relevant internal link targets</p>
            <p className="text-[11px] text-slate-400">
              Our algorithm matches category, keyword proximity, and published date to find ideal links.
            </p>
            <button
              type="button"
              onClick={handleScanOpportunities}
              className="mt-2 px-4 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer hover:bg-purple-500"
            >
              Scan Now
            </button>
          </div>
        )}

        {hasScanned && suggestions.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
            No published articles found to link to yet. Publish more articles to build an internal network.
          </div>
        )}

        {/* Suggestion Cards */}
        {suggestions.map((sug) => (
          <div
            key={sug.slug}
            className={`p-3 rounded-2xl border transition-all ${
              sug.alreadyLinked
                ? 'bg-slate-50/60 border-slate-200/60 opacity-60'
                : 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs'
            }`}
          >
            {/* Relevance Bar */}
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5">
              <span className="text-purple-700 font-extrabold">{sug.relevanceScore}% Relevance</span>
              {sug.alreadyLinked ? (
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 size={10} /> Already linked
                </span>
              ) : (
                <span className="text-slate-400">Not yet linked</span>
              )}
            </div>

            {/* Post Title & Slug */}
            <div className="font-extrabold text-xs text-slate-900 line-clamp-1">{sug.title}</div>
            <div className="text-[10px] font-mono text-slate-400 truncate">/blog/{sug.slug}</div>

            {/* Reason Badge */}
            <div className="mt-2 text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/70">
              💡 {sug.reason}
            </div>

            {/* Suggested Anchor */}
            <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="text-[11px] text-slate-600 truncate">
                Anchor: <strong className="text-purple-900">"{sug.suggestedAnchorText}"</strong>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`/blog/${sug.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-lg text-slate-400 hover:text-purple-600 transition-colors"
                  title="Preview post in new tab"
                >
                  <ExternalLink size={13} />
                </a>

                <button
                  type="button"
                  onClick={() => handleOpenInsertModal(sug)}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-[11px] border border-purple-200 cursor-pointer transition-colors"
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Active Links in Post Table ── */}
      {analysis && analysis.internalLinks.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <label className="text-xs font-bold text-slate-800">
            Detected Links in Content ({analysis.internalLinks.length})
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {analysis.internalLinks.map((link, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">"{link.anchorText}"</div>
                  <div className="font-mono text-[10px] text-purple-700 truncate">/blog/{link.slug}</div>
                </div>

                {!link.isValid ? (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1 shrink-0">
                    <AlertTriangle size={11} /> Broken Link
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    Valid Link
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Link Insertion Modal ── */}
      {selectedSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Link2 size={16} className="text-purple-600" />
                <span>Insert Link to Post</span>
              </div>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target Details */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedSuggestion.title}</div>
              <div className="font-mono text-[11px] text-purple-700">/blog/{selectedSuggestion.slug}</div>
            </div>

            {/* Editable Anchor Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Anchor Text</label>
              <input
                type="text"
                value={customAnchorText}
                onChange={(e) => setCustomAnchorText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none font-semibold text-slate-900"
              />
              {isAnchorAlreadyUsed(customAnchorText) && (
                <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle size={11} /> You already use this anchor text elsewhere in this article. Use varied text to prevent over-optimization.
                </p>
              )}
            </div>

            {/* Insertion Mode */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800">Placement Option</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="insertMode"
                    checked={insertMode === 'wrap'}
                    onChange={() => setInsertMode('wrap')}
                    className="text-purple-600"
                  />
                  <span className="font-medium text-slate-700">
                    Find and link occurrence of "{customAnchorText}" in content
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="insertMode"
                    checked={insertMode === 'append'}
                    onChange={() => setInsertMode('append')}
                    className="text-purple-600"
                  />
                  <span className="font-medium text-slate-700">
                    Append link section at the end of the post
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="insertMode"
                    checked={insertMode === 'copy'}
                    onChange={() => setInsertMode('copy')}
                    className="text-purple-600"
                  />
                  <span className="font-medium text-slate-700">
                    Copy HTML link tag to clipboard
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSuggestion(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmInsert}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check size={13} /> : <Link2 size={13} />}
                <span>{copied ? 'Copied HTML!' : insertMode === 'copy' ? 'Copy HTML' : 'Insert Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
