'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileText,
  ListOrdered,
  BookOpen,
  HelpCircle,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Tag,
  Plus,
  Trash2,
  Sliders,
  Check,
  Zap,
} from 'lucide-react';
import {
  BlogGenerationRequest,
  BlogGenerationResult,
  BlogGenerationType,
  BlogTone,
  BlogOutlineItem,
  BlogSchemaType,
} from '../../../types/blog';
import { generateKeywordSuggestions, generateBlogOutline, generateFullBlogPost } from '../../../lib/aiBlogGenerator';

interface AiDraftGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: BlogGenerationResult) => void;
  existingPosts?: { title: string; slug: string }[];
  initialKeyword?: string;
}

const POST_TYPES: { id: BlogGenerationType; icon: string; title: string; desc: string; bestFor: string; defaultSchema: BlogSchemaType }[] = [
  { id: 'how-to-guide', icon: '📋', title: 'How-To Guide', desc: 'Step-by-step instructional tutorial', bestFor: 'How to create coloring books', defaultSchema: 'HowToArticle' },
  { id: 'listicle', icon: '📊', title: 'Listicle', desc: 'Numbered list format', bestFor: '10 KDP Niches That Make $5K/Mo', defaultSchema: 'Article' },
  { id: 'case-study', icon: '🔬', title: 'Case Study', desc: 'Real-world example with data & proof', bestFor: 'How I Earned $3K First Month', defaultSchema: 'Article' },
  { id: 'comparison', icon: '⚖️', title: 'Comparison', desc: 'Side-by-side comparative teardown', bestFor: 'KDP vs IngramSpark: Full Guide', defaultSchema: 'Article' },
  { id: 'tutorial', icon: '📖', title: 'Tutorial', desc: 'Deep technical walkthrough with examples', bestFor: '300 DPI Cover Design Tutorial', defaultSchema: 'HowToArticle' },
  { id: 'news-analysis', icon: '📰', title: 'News Analysis', desc: 'Industry shifts with expert insights', bestFor: "KDP's New Royalties Explained", defaultSchema: 'NewsArticle' },
  { id: 'ultimate-guide', icon: '📚', title: 'Ultimate Guide', desc: 'Comprehensive evergreen pillar guide', bestFor: 'Complete Guide to KDP Publishing', defaultSchema: 'Article' },
  { id: 'quick-tips', icon: '💡', title: 'Quick Tips', desc: 'Short, high-impact tactical advice', bestFor: '5 Formatting Tips for Beginners', defaultSchema: 'Article' },
];

export const AiDraftGenerator: React.FC<AiDraftGeneratorProps> = ({
  isOpen,
  onClose,
  onApply,
  existingPosts = [],
  initialKeyword = '',
}) => {
  // Phase Management
  const [phase, setPhase] = useState<'setup' | 'outline-edit' | 'generating' | 'review'>('setup');

  // Form State
  const [keyword, setKeyword] = useState<string>(initialKeyword || '');
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [loadingKeywords, setLoadingKeywords] = useState<boolean>(false);
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState<string>('');
  const [postType, setPostType] = useState<BlogGenerationType>('how-to-guide');
  const [targetWordCount, setTargetWordCount] = useState<number>(1800);
  const [tone, setTone] = useState<BlogTone>('authoritative');
  const [audience, setAudience] = useState<string>('Amazon KDP self-publishers');
  const [schemaType, setSchemaType] = useState<BlogSchemaType>('HowToArticle');
  const [includeFaq, setIncludeFaq] = useState<boolean>(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [customOutlineText, setCustomOutlineText] = useState<string>('');

  // Outline Editing State (Phase 1.5)
  const [editableOutline, setEditableOutline] = useState<BlogOutlineItem[]>([]);
  const [loadingOutline, setLoadingOutline] = useState<boolean>(false);

  // Generation & Review State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [generationResult, setGenerationResult] = useState<BlogGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialKeyword && !keyword) {
      setKeyword(initialKeyword);
    }
  }, [initialKeyword]);

  if (!isOpen) return null;

  // Keyword suggestions fetcher
  const handleGetKeywordSuggestions = async () => {
    if (!keyword.trim()) return;
    setLoadingKeywords(true);
    try {
      const suggestions = await generateKeywordSuggestions(keyword.trim());
      setKeywordSuggestions(suggestions);
    } catch (err) {
      console.warn('Failed keyword suggestions:', err);
    } finally {
      setLoadingKeywords(false);
    }
  };

  // Add Secondary Keyword
  const handleAddSecondaryKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSecondaryKeyword.trim()) {
      e.preventDefault();
      const trimmed = newSecondaryKeyword.trim();
      if (!secondaryKeywords.includes(trimmed)) {
        setSecondaryKeywords([...secondaryKeywords, trimmed]);
      }
      setNewSecondaryKeyword('');
    }
  };

  // Generate Outline Only
  const handleGenerateOutlineOnly = async () => {
    if (!keyword.trim()) return;
    setLoadingOutline(true);
    setError(null);
    try {
      const outline = await generateBlogOutline(keyword.trim(), postType, targetWordCount, audience);
      setEditableOutline(outline);
      setPhase('outline-edit');
    } catch (err: any) {
      setError(err.message || 'Failed to generate outline');
    } finally {
      setLoadingOutline(false);
    }
  };

  // Start Full Generation
  const handleStartGeneration = async (useOutlineString?: string) => {
    if (!keyword.trim()) return;
    setPhase('generating');
    setCurrentStepIndex(0);
    setError(null);

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < 6 ? prev + 1 : prev));
    }, 4500);

    try {
      const reqPayload: BlogGenerationRequest = {
        keyword: keyword.trim(),
        secondaryKeywords,
        postType,
        targetWordCount,
        tone,
        audience,
        includeSchema: schemaType,
        includeFaq,
        outline: useOutlineString || customOutlineText || undefined,
      };

      const result = await generateFullBlogPost(reqPayload, existingPosts);
      clearInterval(stepInterval);
      setGenerationResult(result);
      setPhase('review');
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || 'Generation failed. Please try again.');
      setPhase('setup');
    }
  };

  // Apply to post editor
  const handleApplyToEditor = () => {
    if (!generationResult) return;

    // Replace INTERNAL:{slug} with clean /blog/{slug} URLs
    const processedHtml = generationResult.content.replace(
      /href=['"]INTERNAL:([^'"]+)['"]/g,
      "href='/blog/$1'"
    );

    onApply({
      ...generationResult,
      content: processedHtml,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* ── Modal Header ── */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                AI Blog Post Draft Studio
              </h2>
              <p className="text-xs text-slate-500">
                Generate 1,800+ word EEAT-optimized articles with HTML headings, FAQs, and schema markup
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Body Content ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ─────────────────────────────────────────
              PHASE 1: Setup Form
             ───────────────────────────────────────── */}
          {phase === 'setup' && (
            <div className="space-y-6">
              
              {/* Section 1: Keywords */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-extrabold text-slate-900">Focus Target Keyword *</label>
                    <button
                      type="button"
                      onClick={handleGetKeywordSuggestions}
                      disabled={loadingKeywords || !keyword.trim()}
                      className="text-purple-700 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <Sparkles size={13} />
                      <span>{loadingKeywords ? 'Thinking...' : 'Get Suggestions'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. word search books kdp"
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none mt-1 text-slate-800"
                  />
                </div>

                {/* Keyword Suggestions Chips */}
                {keywordSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {keywordSuggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setKeyword(sug)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 cursor-pointer transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                )}

                {/* Secondary Keywords Input */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Secondary LSI Keywords (Press Enter to add)</label>
                  <input
                    type="text"
                    value={newSecondaryKeyword}
                    onChange={(e) => setNewSecondaryKeyword(e.target.value)}
                    onKeyDown={handleAddSecondaryKeyword}
                    placeholder="e.g. puzzle interior 300 dpi, amazon royalties..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none mt-1 text-slate-800"
                  />
                  {secondaryKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {secondaryKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <span>{kw}</span>
                          <button
                            type="button"
                            onClick={() => setSecondaryKeywords(secondaryKeywords.filter((_, idx) => idx !== i))}
                            className="hover:text-rose-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Post Type (2x4 Grid of Cards) */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-900">Post Type & Format</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {POST_TYPES.map((pt) => (
                    <div
                      key={pt.id}
                      onClick={() => {
                        setPostType(pt.id);
                        setSchemaType(pt.defaultSchema);
                      }}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        postType === pt.id
                          ? 'bg-purple-50 border-purple-400 text-purple-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-purple-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-lg">{pt.icon}</div>
                      <div className="font-extrabold text-xs mt-1">{pt.title}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{pt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Content Target Length & Tone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                {/* Word Count */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Target Length</label>
                  <select
                    value={targetWordCount}
                    onChange={(e) => setTargetWordCount(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 outline-none font-semibold mt-1"
                  >
                    <option value={800}>800 words (Quick tips)</option>
                    <option value={1200}>1,200 words (Standard)</option>
                    <option value={1800}>1,800 words (In-depth guide ★)</option>
                    <option value={2500}>2,500 words (Pillar evergreen)</option>
                  </select>
                </div>

                {/* Tone */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Writing Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as BlogTone)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 outline-none font-semibold mt-1"
                  >
                    <option value="authoritative">Authoritative (Expert)</option>
                    <option value="conversational">Conversational (Friendly)</option>
                    <option value="educational">Educational (Teacher)</option>
                    <option value="motivational">Motivational (Inspiring)</option>
                    <option value="analytical">Analytical (Data-driven)</option>
                  </select>
                </div>

                {/* Schema */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Schema Markup</label>
                  <select
                    value={schemaType}
                    onChange={(e) => setSchemaType(e.target.value as BlogSchemaType)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 outline-none font-semibold mt-1"
                  >
                    <option value="Article">Article</option>
                    <option value="HowToArticle">HowToArticle</option>
                    <option value="FAQPage">FAQPage</option>
                    <option value="NewsArticle">NewsArticle</option>
                  </select>
                </div>
              </div>

              {/* Section 4: Advanced Options (Collapsible) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full p-3.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Sliders size={14} className="text-purple-600" />
                    <span>Advanced Custom Outline & Target Audience</span>
                  </div>
                  {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isAdvancedOpen && (
                  <div className="p-4 space-y-3 bg-white border-t border-slate-200">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Target Audience Description</label>
                      <input
                        type="text"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="Amazon KDP self-publishers, indie authors..."
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white outline-none mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Custom Outline (Optional Headings)</label>
                      <textarea
                        value={customOutlineText}
                        onChange={(e) => setCustomOutlineText(e.target.value)}
                        placeholder="## Introduction\n## Niche Research Step 1\n## Formatting at 300 DPI\n## Pricing and Royalties\n## Conclusion"
                        rows={4}
                        className="w-full p-2.5 font-mono text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white outline-none mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Disclaimer Notice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                <span>AI draft lands in Draft status. Always verify KDP policy guidelines before publishing.</span>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────
              PHASE 1.5: Interactive Outline Editor
             ───────────────────────────────────────── */}
          {phase === 'outline-edit' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Review & Customize Outline
                  </h3>
                  <p className="text-xs text-slate-500">Edit headings or reorder before generating full article</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditableOutline([
                      ...editableOutline,
                      { level: 2, heading: 'New Section Heading', summary: 'Covers key actionable insights.', estimatedWords: 250 },
                    ])
                  }
                  className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 text-xs font-bold flex items-center gap-1 hover:bg-purple-100 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Section</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {editableOutline.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-1">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={item.heading}
                        onChange={(e) => {
                          const updated = [...editableOutline];
                          updated[idx].heading = e.target.value;
                          setEditableOutline(updated);
                        }}
                        className="w-full px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 outline-none text-slate-900"
                      />
                      <input
                        type="text"
                        value={item.summary}
                        onChange={(e) => {
                          const updated = [...editableOutline];
                          updated[idx].summary = e.target.value;
                          setEditableOutline(updated);
                        }}
                        className="w-full px-2.5 py-1 text-[11px] rounded-lg bg-white/60 border border-slate-200/60 outline-none text-slate-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditableOutline(editableOutline.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer mt-1"
                      title="Remove section"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────
              PHASE 2: Generation Progress
             ───────────────────────────────────────── */}
          {phase === 'generating' && (
            <div className="py-10 text-center space-y-6 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center mx-auto animate-bounce">
                <Sparkles size={24} className="text-purple-600" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  Crafting Long-Form Article for "{keyword}"
                </h3>
                <p className="text-xs text-slate-500">Claude AI is analyzing EEAT guidelines & drafting content</p>
              </div>

              {/* Animated Progress Steps */}
              <div className="max-w-md mx-auto space-y-2 text-left text-xs">
                {[
                  '1. Structuring semantic H2/H3 outline...',
                  '2. Writing introduction & problem hook...',
                  '3. Generating in-depth implementation framework...',
                  '4. Injecting Amazon KDP royalty calculations...',
                  '5. Formulating search FAQ questions & answers...',
                  '6. Creating SEO metadata & schema markup...',
                  '7. Mapping internal links to existing posts...',
                ].map((stepText, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                      currentStepIndex === idx
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-2xs'
                        : currentStepIndex > idx
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800 font-medium'
                        : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
                    }`}
                  >
                    {currentStepIndex > idx ? (
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    ) : currentStepIndex === idx ? (
                      <RefreshCw size={15} className="text-purple-600 animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className="truncate">{stepText}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────
              PHASE 3: Review & Apply Draft
             ───────────────────────────────────────── */}
          {phase === 'review' && generationResult && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Top Score Banner */}
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-purple-600/30">
                    {generationResult.seoScore}
                  </div>
                  <div>
                    <div className="text-xs font-black text-purple-900 uppercase">Pre-Computed SEO Score</div>
                    <div className="text-xs text-purple-700 font-medium">
                      {generationResult.wordCount.toLocaleString()} words · {generationResult.estimatedReadingTime} min read
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {generationResult.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-white text-slate-700 text-[10px] font-bold border border-purple-200">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Title & Metadata Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Generated Title:</span>
                  <div className="font-extrabold text-sm text-slate-900">{generationResult.title}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Meta Description:</span>
                  <div className="text-slate-600 leading-relaxed">{generationResult.metaDescription}</div>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-purple-700">
                  <span>URL Slug:</span>
                  <span className="font-bold">/blog/{generationResult.slug}</span>
                </div>
              </div>

              {/* Content Preview Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Article Content HTML Preview</label>
                <div
                  className="p-4 rounded-2xl border border-slate-200 bg-white max-h-56 overflow-y-auto prose-custom text-xs text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: generationResult.content }}
                />
              </div>

              {/* FAQs Preview */}
              {generationResult.faqItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-purple-600" />
                    <span>Generated FAQ Schema Items ({generationResult.faqItems.length})</span>
                  </span>
                  <div className="space-y-1">
                    {generationResult.faqItems.map((faq, i) => (
                      <div key={i} className="text-slate-700">
                        <strong>Q: {faq.question}</strong>
                        <p className="text-slate-500 text-[11px]">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Modal Footer Controls ── */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          {phase === 'setup' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateOutlineOnly}
                  disabled={!keyword.trim() || loadingOutline}
                  className="px-4 py-2 rounded-xl border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 text-xs font-bold cursor-pointer disabled:opacity-40"
                >
                  {loadingOutline ? 'Building...' : '📋 Outline Only'}
                </button>

                <button
                  type="button"
                  onClick={() => handleStartGeneration()}
                  disabled={!keyword.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Sparkles size={14} />
                  <span>Generate Full Article</span>
                </button>
              </div>
            </>
          )}

          {phase === 'outline-edit' && (
            <>
              <button
                type="button"
                onClick={() => setPhase('setup')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={() => {
                  const outlineStr = editableOutline
                    .map((item) => `## ${item.heading}\n${item.summary}`)
                    .join('\n\n');
                  handleStartGeneration(outlineStr);
                }}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Use This Outline & Generate Post</span>
              </button>
            </>
          )}

          {phase === 'review' && (
            <>
              <button
                type="button"
                onClick={() => setPhase('setup')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                🔄 Regenerate
              </button>

              <button
                type="button"
                onClick={handleApplyToEditor}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={14} />
                <span>Apply Draft to Editor</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
