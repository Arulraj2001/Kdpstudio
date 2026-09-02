'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plus,
  Trash2,
  Layers,
  Image as ImageIcon,
  Link as LinkIcon,
  Globe,
  Share2,
  Calendar,
  User,
  ShieldCheck,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Check,
} from 'lucide-react';
import { BlogPost, BlogAuthor, BlogStatus, BlogSchemaType, BlogFaqItem, BlogHowToStep, BlogSource, AdPositionConfig, BlogGenerationResult } from '../../../types/blog';
import { PageRoute } from '../../../types';
import { calculateSeoScore, SeoScoreResult } from '../../../lib/seoScorer';
import { generateSlug } from '../../../lib/blogUtils';
import { AiDraftGenerator } from './AiDraftGenerator';
import { executeAiEditorAction } from '../../../lib/aiBlogGenerator';
import { InternalLinksPanel } from './InternalLinksPanel';
import { getBlogPost, createBlogPost, updateBlogPost, getAllAuthors } from '../../../lib/blogService';

interface BlogPostEditorProps {
  postId?: string; // If provided -> edit mode, if undefined -> create mode
  onNavigate: (route: PageRoute) => void;
}

export const BlogPostEditor: React.FC<BlogPostEditorProps> = ({ postId, onNavigate }) => {
  const [loading, setLoading] = useState<boolean>(Boolean(postId));
  const [saving, setSaving] = useState<boolean>(false);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isAiDraft, setIsAiDraft] = useState<boolean>(false);
  const [inlineAiLoading, setInlineAiLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'seo' | 'social' | 'schema' | 'eeat' | 'links' | 'settings'>('seo');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unsaved LocalStorage restore prompt
  const [showRestorePrompt, setShowRestorePrompt] = useState<boolean>(false);
  const [localSavedTime, setLocalSavedTime] = useState<string>('');

  // Slug editing & Confirmation Modal
  const [isEditingSlug, setIsEditingSlug] = useState<boolean>(false);
  const [showSlugWarningModal, setShowSlugWarningModal] = useState<boolean>(false);
  const [slugConfirmInput, setSlugConfirmInput] = useState<string>('');
  const [pendingSlug, setPendingSlug] = useState<string>('');

  // Low SEO Score Confirmation Modal
  const [showLowSeoModal, setShowLowSeoModal] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [excerpt, setExcerpt] = useState<string>('');
  const [status, setStatus] = useState<BlogStatus>('draft');
  const [category, setCategory] = useState<string>('Publishing Strategy');
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>(['KDP', 'Self-Publishing']);
  const [tagInput, setTagInput] = useState<string>('');

  // Author & EEAT
  const [authorId, setAuthorId] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('KDP Studio Team');
  const [authorCredentials, setAuthorCredentials] = useState<string>('KDP Publishing Specialist');
  const [authorPhotoUrl, setAuthorPhotoUrl] = useState<string | null>(null);
  const [lastReviewedAt, setLastReviewedAt] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reviewedBy, setReviewedBy] = useState<string>('');
  const [isExpertReviewed, setIsExpertReviewed] = useState<boolean>(false);
  const [sources, setSources] = useState<BlogSource[]>([]);
  const [internalNotes, setInternalNotes] = useState<string>('');

  // Media
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string>('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState<string>('');
  const [featuredImageCaption, setFeaturedImageCaption] = useState<string>('');

  // SEO Fields
  const [focusKeyword, setFocusKeyword] = useState<string>('');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [secKwInput, setSecKwInput] = useState<string>('');
  const [metaTitle, setMetaTitle] = useState<string>('');
  const [metaDescription, setMetaDescription] = useState<string>('');
  const [canonicalUrl, setCanonicalUrl] = useState<string>('');
  const [noIndex, setNoIndex] = useState<boolean>(false);

  // Social
  const [ogTitle, setOgTitle] = useState<string>('');
  const [ogDescription, setOgDescription] = useState<string>('');
  const [ogImage, setOgImage] = useState<string>('');
  const [twitterTitle, setTwitterTitle] = useState<string>('');
  const [twitterDescription, setTwitterDescription] = useState<string>('');
  const [twitterImage, setTwitterImage] = useState<string>('');

  // Schema
  const [schemaType, setSchemaType] = useState<BlogSchemaType>('Article');
  const [faqItems, setFaqItems] = useState<BlogFaqItem[]>([]);
  const [howToSteps, setHowToSteps] = useState<BlogHowToStep[]>([]);

  // Ads & Schedule
  const [adsEnabled, setAdsEnabled] = useState<boolean>(true);
  const [adOverrides, setAdOverrides] = useState<Record<string, boolean>>({});
  const [publishImmediately, setPublishImmediately] = useState<boolean>(true);
  const [scheduledDate, setScheduledDate] = useState<string>('');

  const [originalStatus, setOriginalStatus] = useState<BlogStatus>('draft');
  const [lastSavedNotice, setLastSavedNotice] = useState<string>('Not saved yet');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Authors List
  useEffect(() => {
    getAllAuthors()
      .then((authorList) => {
        if (Array.isArray(authorList) && authorList.length > 0) {
          setAuthors(authorList);
          if (!authorId && !postId) {
            setAuthorId(authorList[0].id);
            setAuthorName(authorList[0].name);
            setAuthorCredentials(authorList[0].credentials);
            setAuthorPhotoUrl(authorList[0].photoUrl);
          }
        }
      })
      .catch(() => {});
  }, [authorId, postId]);

  // Load existing post if editing
  useEffect(() => {
    if (!postId) {
      // Check local storage draft for new post
      const savedDraft = localStorage.getItem('kdp_blog_draft_new');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setLocalSavedTime(parsed.savedAt || 'earlier session');
          setShowRestorePrompt(true);
        } catch {}
      }
      return;
    }

    setLoading(true);
    getBlogPost(postId)
      .then((found) => {
        if (found) {
          setTitle(found.title || '');
          setSlug(found.slug || '');
          setContent(found.content || '');
          setExcerpt(found.excerpt || '');
          setStatus(found.status || 'draft');
          setOriginalStatus(found.status || 'draft');
          setCategory(found.category || 'Publishing Strategy');
          setTags(found.tags || []);
          setAuthorId(found.authorId || '');
          setAuthorName(found.authorName || 'KDP Studio Team');
          setAuthorCredentials(found.authorCredentials || '');
          setAuthorPhotoUrl(found.authorPhotoUrl || null);
          setLastReviewedAt(found.lastReviewedAt ? String(found.lastReviewedAt).slice(0, 10) : '');
          setReviewedBy(found.reviewedBy || '');
          setIsExpertReviewed(Boolean(found.isExpertReviewed));
          setSources(found.sources || []);
          setInternalNotes(found.internalNotes || '');
          setFeaturedImageUrl(found.featuredImage?.url || '');
          setFeaturedImageAlt(found.featuredImage?.alt || '');
          setFeaturedImageCaption(found.featuredImage?.caption || '');
          setFocusKeyword(found.focusKeyword || '');
          setSecondaryKeywords(found.secondaryKeywords || []);
          setMetaTitle(found.metaTitle || '');
          setMetaDescription(found.metaDescription || '');
          setCanonicalUrl(found.canonicalUrl || '');
          setNoIndex(Boolean(found.noIndex));
          setOgTitle(found.ogTitle || '');
          setOgDescription(found.ogDescription || '');
          setOgImage(found.ogImage || '');
          setTwitterTitle(found.twitterTitle || '');
          setTwitterDescription(found.twitterDescription || '');
          setTwitterImage(found.twitterImage || '');
          setSchemaType(found.schemaType || 'Article');
          setFaqItems(found.faqItems || []);
          setHowToSteps(found.howToSteps || []);
          setAdsEnabled(found.adsEnabled !== false);
          if (Array.isArray(found.adOverrides)) {
            const map: Record<string, boolean> = {};
            found.adOverrides.forEach((ao: any) => {
              map[ao.positionId] = ao.enabled;
            });
            setAdOverrides(map);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load post for editing:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [postId]);

  // Auto-generate slug as title changes (for new draft posts)
  useEffect(() => {
    if (!postId && originalStatus === 'draft' && !isEditingSlug && title) {
      setSlug(generateSlug(title));
    }
  }, [title, postId, originalStatus, isEditingSlug]);

  // 30-Second Local Auto-Save
  useEffect(() => {
    const interval = setInterval(() => {
      if (!title && !content) return;
      const draftKey = postId ? `kdp_blog_draft_${postId}` : 'kdp_blog_draft_new';
      const payload = {
        title,
        slug,
        content,
        excerpt,
        category,
        tags,
        focusKeyword,
        metaTitle,
        metaDescription,
        savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      localStorage.setItem(draftKey, JSON.stringify(payload));
      setLastSavedNotice(`Draft auto-saved at ${payload.savedAt}`);
    }, 30000);

    return () => clearInterval(interval);
  }, [postId, title, slug, content, excerpt, category, tags, focusKeyword, metaTitle, metaDescription]);

  // Restore Draft Handler
  const handleRestoreDraft = () => {
    const draftKey = postId ? `kdp_blog_draft_${postId}` : 'kdp_blog_draft_new';
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const p = JSON.parse(savedDraft);
        if (p.title) setTitle(p.title);
        if (p.slug) setSlug(p.slug);
        if (p.content) setContent(p.content);
        if (p.excerpt) setExcerpt(p.excerpt);
        if (p.category) setCategory(p.category);
        if (p.tags) setTags(p.tags);
        if (p.focusKeyword) setFocusKeyword(p.focusKeyword);
        if (p.metaTitle) setMetaTitle(p.metaTitle);
        if (p.metaDescription) setMetaDescription(p.metaDescription);
        showToast('✅ Restored unsaved draft');
      } catch {}
    }
    setShowRestorePrompt(false);
  };

  const handleDiscardDraft = () => {
    const draftKey = postId ? `kdp_blog_draft_${postId}` : 'kdp_blog_draft_new';
    localStorage.removeItem(draftKey);
    setShowRestorePrompt(false);
  };

  // Live SEO & EEAT Scoring
  const currentPostDraft: Partial<BlogPost> = useMemo(() => {
    return {
      title,
      slug,
      content,
      excerpt,
      focusKeyword,
      secondaryKeywords,
      metaTitle,
      metaDescription,
      authorName,
      authorId,
      featuredImage: featuredImageUrl ? { url: featuredImageUrl, alt: featuredImageAlt, caption: featuredImageCaption, width: 1200, height: 630 } : null,
      schemaType,
      isExpertReviewed,
      reviewedBy,
      sources,
      tableOfContents: [],
    };
  }, [
    title,
    slug,
    content,
    excerpt,
    focusKeyword,
    secondaryKeywords,
    metaTitle,
    metaDescription,
    authorName,
    authorId,
    featuredImageUrl,
    featuredImageAlt,
    featuredImageCaption,
    schemaType,
    isExpertReviewed,
    reviewedBy,
    sources,
  ]);

  const seoResult: SeoScoreResult = useMemo(() => {
    return calculateSeoScore(currentPostDraft);
  }, [currentPostDraft]);

  // Handle Slug Change Warning for Published Posts
  const handleInitiateSlugEdit = () => {
    if (originalStatus === 'published') {
      setShowSlugWarningModal(true);
      setPendingSlug(slug);
      setSlugConfirmInput('');
    } else {
      setIsEditingSlug(true);
    }
  };

  const handleConfirmSlugChange = () => {
    if (slugConfirmInput.trim().toUpperCase() === 'CHANGE SLUG') {
      setSlug(generateSlug(pendingSlug));
      setIsEditingSlug(true);
      setShowSlugWarningModal(false);
      showToast('⚠️ Slug modified for published post');
    }
  };

  // Author Change Handler
  const handleSelectAuthor = (id: string) => {
    const selected = authors.find((a) => a.id === id);
    if (selected) {
      setAuthorId(selected.id);
      setAuthorName(selected.name);
      setAuthorCredentials(selected.credentials);
      setAuthorPhotoUrl(selected.photoUrl);
    }
  };

  // Tags & Keywords Handlers
  const handleAddTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.replace(',', '').trim();
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleAddSecondaryKw = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && secKwInput.trim()) {
      e.preventDefault();
      const clean = secKwInput.replace(',', '').trim();
      if (!secondaryKeywords.includes(clean)) {
        setSecondaryKeywords([...secondaryKeywords, clean]);
      }
      setSecKwInput('');
    }
  };

  const handleRemoveSecondaryKw = (k: string) => {
    setSecondaryKeywords(secondaryKeywords.filter((item) => item !== k));
  };

  // FAQ & HowTo Handlers
  const handleAddFaq = () => {
    setFaqItems([...faqItems, { question: '', answer: '' }]);
  };

  const handleUpdateFaq = (index: number, field: 'question' | 'answer', val: string) => {
    const next = [...faqItems];
    next[index][field] = val;
    setFaqItems(next);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== index));
  };

  const handleAddSource = () => {
    setSources([...sources, { title: '', url: '', publisher: '', publishedDate: '' }]);
  };

  const handleUpdateSource = (index: number, field: keyof BlogSource, val: string) => {
    const next = [...sources];
    next[index] = { ...next[index], [field]: val };
    setSources(next);
  };

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  // Core Save / Publish Dispatcher
  const executeSave = async (targetStatus: BlogStatus) => {
    if (!title.trim()) {
      showToast('❌ Post title is required');
      return;
    }
    if (!content.trim()) {
      showToast('❌ Post content is required');
      return;
    }

    setSaving(true);

    const overridesArray = Object.entries(adOverrides).map(([positionId, enabled]) => ({
      positionId,
      enabled,
    }));

    const payload: any = {
      title: title.trim(),
      slug: slug || generateSlug(title),
      content,
      excerpt: excerpt.trim() || undefined,
      status: targetStatus,
      category,
      tags,
      authorId: authorId || undefined,
      authorName,
      authorCredentials,
      authorPhotoUrl,
      lastReviewedAt: lastReviewedAt || undefined,
      reviewedBy: reviewedBy.trim() || undefined,
      isExpertReviewed,
      sources,
      internalNotes,
      featuredImage: featuredImageUrl
        ? {
            url: featuredImageUrl,
            alt: featuredImageAlt || title,
            caption: featuredImageCaption,
            width: 1200,
            height: 630,
          }
        : null,
      focusKeyword: focusKeyword.trim() || undefined,
      secondaryKeywords,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      canonicalUrl: canonicalUrl.trim() || undefined,
      noIndex,
      ogTitle: ogTitle.trim() || undefined,
      ogDescription: ogDescription.trim() || undefined,
      ogImage: ogImage.trim() || undefined,
      twitterTitle: twitterTitle.trim() || undefined,
      twitterDescription: twitterDescription.trim() || undefined,
      twitterImage: twitterImage.trim() || undefined,
      schemaType,
      faqItems,
      howToSteps,
      adsEnabled,
      adOverrides: overridesArray,
      publishedAt:
        targetStatus === 'published'
          ? publishImmediately
            ? new Date().toISOString()
            : scheduledDate || new Date().toISOString()
          : null,
    };

    try {
      if (postId) {
        // Update
        await updateBlogPost(postId, payload, 'admin@kdpstudio.io');
        setStatus(targetStatus);
        setOriginalStatus(targetStatus);
        showToast(targetStatus === 'published' ? '🎉 Post published!' : '💾 Draft updated!');
      } else {
        // Create
        const newId = await createBlogPost(payload, 'admin@kdpstudio.io');
        localStorage.removeItem('kdp_blog_draft_new');
        setStatus(targetStatus);
        setOriginalStatus(targetStatus);
        showToast(targetStatus === 'published' ? '🎉 Post published!' : '💾 Draft saved!');
        if (newId) {
          setTimeout(() => {
            onNavigate('admin-blog');
          }, 900);
        }
      }
    } catch (err: any) {
      console.error('Save error:', err);
      showToast(`❌ Error: ${err.message || 'Failed to save post'}`);
    } finally {
      setSaving(false);
      setShowLowSeoModal(false);
    }
  };

  const handleApplyAiDraft = (result: BlogGenerationResult) => {
    setTitle(result.title);
    setSlug(result.slug);
    setContent(result.content);
    setMetaTitle(result.metaTitle || result.title);
    setMetaDescription(result.metaDescription);
    setExcerpt(result.excerpt);
    setFocusKeyword(result.focusKeyword);
    if (result.secondaryKeywords?.length) setSecondaryKeywords(result.secondaryKeywords);
    if (result.tags?.length) setTags(result.tags);
    if (result.faqItems?.length) setFaqItems(result.faqItems);
    if (result.suggestedSources?.length) setSources(result.suggestedSources);
    if (result.howToSteps?.length) setHowToSteps(result.howToSteps);
    setIsAiDraft(true);
    showToast('✨ AI draft applied! Review before publishing.');
  };

  const handleRunInlineAi = async (action: 'rewrite' | 'statistics' | 'shorten' | 'expand' | 'factcheck') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
    let selected = '';
    if (textarea) {
      selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    }
    if (!selected.trim()) {
      showToast('ℹ️ Please highlight/select text in the article editor first');
      return;
    }

    setInlineAiLoading(true);
    showToast(`🤖 Running AI ${action}...`);
    try {
      const enhanced = await executeAiEditorAction(action, selected);
      if (textarea && enhanced) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = textarea.value.substring(0, start) + enhanced + textarea.value.substring(end);
        setContent(newContent);
        showToast(`✨ Section updated with AI ${action}`);
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setInlineAiLoading(false);
    }
  };

  const handleInsertInternalLink = (slug: string, anchorText: string, mode: 'wrap' | 'append') => {
    const linkHtml = `<a href="/blog/${slug}">${anchorText}</a>`;
    if (mode === 'append') {
      setContent((c) => c + `\n<p><strong>Related Guide:</strong> ${linkHtml}</p>`);
      showToast(`🔗 Appended link to /blog/${slug}`);
    } else {
      const regex = new RegExp(`(${anchorText.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'i');
      if (regex.test(content)) {
        const newContent = content.replace(regex, linkHtml);
        setContent(newContent);
        showToast(`🔗 Linked "${anchorText}" to /blog/${slug}`);
      } else {
        setContent((c) => c + `\n<p><strong>Related:</strong> ${linkHtml}</p>`);
        showToast(`ℹ️ Anchor text not found directly. Appended link to /blog/${slug}`);
      }
    }
  };

  const handleTriggerPublish = () => {
    if (seoResult.score < 40) {
      setShowLowSeoModal(true);
    } else {
      executeSave('published');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-semibold text-sm">Loading post editor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom duration-200">
          {toastMessage}
        </div>
      )}

      {/* ── Unsaved Draft Restore Banner ── */}
      {showRestorePrompt && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <span>You have an unsaved local draft from <strong>{localSavedTime}</strong>. Would you like to restore it?</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDiscardDraft}
              className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-black/5"
            >
              Discard
            </button>
            <button
              onClick={handleRestoreDraft}
              className="px-3.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm"
            >
              Restore Draft
            </button>
          </div>
        </div>
      )}

      {/* ── Slug Warning Modal for Published Posts ── */}
      {showSlugWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl space-y-4 border border-rose-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-base">
              <AlertTriangle size={22} />
              <span>Critical SEO Warning</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This post is currently <strong>Published</strong>. Changing its URL slug will break existing external backlinks, invalidate Google search results, and destroy SEO ranking history.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Type <span className="font-mono text-rose-600 font-black">CHANGE SLUG</span> to confirm:
              </label>
              <input
                type="text"
                value={slugConfirmInput}
                onChange={(e) => setSlugConfirmInput(e.target.value)}
                placeholder="CHANGE SLUG"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-mono focus:border-rose-500 outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSlugWarningModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSlugChange}
                disabled={slugConfirmInput.trim().toUpperCase() !== 'CHANGE SLUG'}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 cursor-pointer"
              >
                Confirm URL Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Low SEO Score Modal ── */}
      {showLowSeoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl space-y-4 border border-amber-200">
            <div className="flex items-center gap-2.5 text-amber-600 font-bold text-base">
              <AlertCircle size={22} />
              <span>Low SEO Score ({seoResult.score}/100)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your article's current SEO & EEAT score is <strong>{seoResult.score}/100 ({seoResult.grade})</strong>. Publishing now may reduce organic search rankings.
            </p>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 space-y-1">
              <div className="font-bold">Top Recommendations:</div>
              {seoResult.checks
                .filter((c) => c.status === 'fail')
                .slice(0, 2)
                .map((c) => (
                  <div key={c.id}>• {c.hint}</div>
                ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLowSeoModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Keep Editing
              </button>
              <button
                onClick={() => executeSave('published')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
              >
                Publish Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Bar / Action Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('admin-blog')}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Back to Blog Posts"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {postId ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="font-medium">{lastSavedNotice}</span>
              <span>•</span>
              <span className="capitalize font-bold text-purple-700">{status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Sparkles size={14} className="text-purple-600" />
            <span>AI Generate</span>
          </button>

          <button
            onClick={() => window.open(`/blog/${slug}?preview=true`, '_blank')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>

          <button
            onClick={() => executeSave('draft')}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            onClick={handleTriggerPublish}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Send size={14} />
            <span>{status === 'published' ? 'Update & Revalidate' : 'Publish Post'}</span>
          </button>
        </div>
      </div>

      {/* ── AI Watermark Warning Banner ── */}
      {isAiDraft && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-600 shrink-0" />
            <span>✨ AI-Generated Draft — Review and customize content before publishing to live blog.</span>
          </div>
          <button
            onClick={() => setIsAiDraft(false)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 cursor-pointer"
          >
            Dismiss Watermark
          </button>
        </div>
      )}

      {/* ── 3-Column Studio Grid Layout (60% / 40%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─────────────────────────────────────────
            LEFT COLUMN (60% / 7 cols): Content Editor
           ───────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Post Title Input (28px) */}
          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title (e.g. 10 Profitable KDP Niches in 2026)..."
              className="w-full px-4 py-3 text-xl sm:text-2xl font-black text-slate-900 bg-white border border-slate-200/80 rounded-2xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-300 shadow-2xs"
            />

            {/* Slug Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 min-w-0 font-mono text-slate-600">
                <span className="text-slate-400 font-bold">URL:</span>
                <span className="text-purple-700 font-bold">/blog/</span>
                {isEditingSlug ? (
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    onBlur={() => setIsEditingSlug(false)}
                    className="px-2 py-0.5 bg-white border border-purple-400 rounded outline-none font-mono text-purple-900 font-bold"
                    autoFocus
                  />
                ) : (
                  <span className="font-bold truncate text-slate-800">{slug || 'your-slug-here'}</span>
                )}
              </div>

              <button
                onClick={handleInitiateSlugEdit}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
              >
                {isEditingSlug ? 'Done' : 'Edit Slug'}
              </button>
            </div>
          </div>

          {/* HTML / Tiptap Rich Content Area */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs space-y-0">
            {/* Rich Editor Toolbar */}
            <div className="p-2 border-b border-slate-200/80 bg-slate-50/80 flex flex-wrap items-center gap-1 text-xs text-slate-700">
              <button
                type="button"
                onClick={() => setContent((c) => c + '\n<h2>New Subheading</h2>\n<p>Add section content here...</p>')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold"
              >
                + H2
              </button>
              <button
                type="button"
                onClick={() => setContent((c) => c + '\n<h3>Key Takeaway</h3>\n<p>Details here...</p>')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold"
              >
                + H3
              </button>
              <button
                type="button"
                onClick={() => setContent((c) => c + '\n<blockquote><p>Actionable advice quote...</p></blockquote>')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-medium"
              >
                “ Quote
              </button>
              <button
                type="button"
                onClick={() => setContent((c) => c + '\n<ul>\n  <li>Step 1</li>\n  <li>Step 2</li>\n</ul>')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-medium"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter Image URL:');
                  if (url) setContent((c) => c + `\n<figure><img src="${url}" alt="Illustration" /><figcaption>Chart description</figcaption></figure>`);
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1 font-medium"
              >
                <ImageIcon size={12} />
                <span>Image</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const link = prompt('Enter URL:');
                  if (link) setContent((c) => c + ` <a href="${link}" target="_blank" rel="noopener noreferrer">Resource Link</a> `);
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1 font-medium"
              >
                <LinkIcon size={12} />
                <span>Link</span>
              </button>

              {/* Inline AI Actions */}
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <button
                type="button"
                onClick={() => handleRunInlineAi('rewrite')}
                disabled={inlineAiLoading}
                className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold flex items-center gap-1 border border-purple-200 cursor-pointer disabled:opacity-50"
                title="Select text and click to rewrite"
              >
                <Sparkles size={11} />
                <span>Rewrite</span>
              </button>
              <button
                type="button"
                onClick={() => handleRunInlineAi('statistics')}
                disabled={inlineAiLoading}
                className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 cursor-pointer disabled:opacity-50"
                title="Select text and click to add statistics"
              >
                + Stats
              </button>
              <button
                type="button"
                onClick={() => handleRunInlineAi('shorten')}
                disabled={inlineAiLoading}
                className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 cursor-pointer disabled:opacity-50"
              >
                Shorten
              </button>
              <button
                type="button"
                onClick={() => handleRunInlineAi('expand')}
                disabled={inlineAiLoading}
                className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 cursor-pointer disabled:opacity-50"
              >
                Expand
              </button>
              <button
                type="button"
                onClick={() => handleRunInlineAi('factcheck')}
                disabled={inlineAiLoading}
                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 cursor-pointer disabled:opacity-50"
                title="Select text to fact-check against KDP policies"
              >
                Fact Check
              </button>
            </div>

            {/* Content Textarea / HTML WYSIWYG View */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article content here in HTML or Markdown..."
              rows={18}
              className="w-full p-4 text-sm font-sans leading-relaxed text-slate-800 outline-none resize-y border-none focus:ring-0 placeholder:text-slate-300 font-mono"
            />

            {/* Word Count & Read Time Bar */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-3">
                <span>{seoResult.wordCount} words</span>
                <span>•</span>
                <span>{Math.max(1, Math.ceil(seoResult.wordCount / 238))} min read</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Tiptap / HTML Engine
              </div>
            </div>
          </div>

          {/* Featured Image Section */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon size={14} className="text-purple-600" />
              <span>Featured Cover Image (1200×630px)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {/* Preview Thumbnail */}
              <div className="sm:col-span-1">
                <div className="w-full aspect-video rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400">
                  {featuredImageUrl ? (
                    <img src={featuredImageUrl} alt={featuredImageAlt || title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-3">
                      <ImageIcon size={24} className="mx-auto mb-1 opacity-50" />
                      <span className="text-[10px]">No image set</span>
                    </div>
                  )}
                </div>
              </div>

              {/* URL & Alt Text Inputs */}
              <div className="sm:col-span-2 space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Image URL</label>
                  <input
                    type="text"
                    value={featuredImageUrl}
                    onChange={(e) => setFeaturedImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none text-slate-800 mt-1 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Alt Text (Required for SEO)</label>
                    <input
                      type="text"
                      value={featuredImageAlt}
                      onChange={(e) => setFeaturedImageAlt(e.target.value)}
                      placeholder="e.g. Amazon KDP market chart"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none text-slate-800 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Caption (Optional)</label>
                    <input
                      type="text"
                      value={featuredImageCaption}
                      onChange={(e) => setFeaturedImageCaption(e.target.value)}
                      placeholder="e.g. Source: KDP Studio 2026"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none text-slate-800 mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────
            RIGHT COLUMN (40% / 5 cols): Tabbed Panels & Publish
           ───────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Tab Navigation Header */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="grid grid-cols-6 border-b border-slate-200/80 text-center text-xs font-bold">
              {[
                { id: 'seo', label: 'SEO', badge: seoResult.score },
                { id: 'social', label: 'Social' },
                { id: 'schema', label: 'Schema' },
                { id: 'eeat', label: 'EEAT' },
                { id: 'links', label: 'Links' },
                { id: 'settings', label: 'Settings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 transition-colors flex flex-col items-center justify-center cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className="text-[10px] font-black px-1.5 rounded-full text-white mt-0.5"
                      style={{ backgroundColor: seoResult.gradeColor }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-5 space-y-4">
              
              {/* ── TAB 1: SEO ── */}
              {activeTab === 'seo' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Focus Keyword & Live Density */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">Focus Target Keyword</label>
                      <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {seoResult.keywordDensity}% density ({seoResult.keywordDensity >= 0.5 && seoResult.keywordDensity <= 2.5 ? 'Optimal' : 'Needs tuning'})
                      </span>
                    </div>
                    <input
                      type="text"
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      placeholder="e.g. profitable kdp niches"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none text-slate-900 font-semibold"
                    />
                  </div>

                  {/* SEO Score Card */}
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">Search Engine Optimization</div>
                      <div className="text-[11px] text-slate-500 capitalize">{seoResult.grade} ({seoResult.score}/100)</div>
                    </div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white shadow-sm"
                      style={{ backgroundColor: seoResult.gradeColor }}
                    >
                      {seoResult.score}
                    </div>
                  </div>

                  {/* Live Google Search Snippet Preview */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Google Search Snippet Preview</label>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                      <div className="text-[11px] text-emerald-700 truncate">
                        https://kdpstudio-aio.web.app › blog › {slug || 'niches-2026'}
                      </div>
                      <div className="text-sm font-semibold text-[#1a0dab] line-clamp-1 hover:underline cursor-pointer">
                        {metaTitle || title || 'Post Title | KDP Studio'}
                      </div>
                      <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {metaDescription || excerpt || 'Search snippet preview summary description will appear here in Google SERP results...'}
                      </div>
                    </div>
                  </div>

                  {/* Meta Title with 60-Char Counter */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-800">Meta Title</label>
                      <span className={`font-mono text-[11px] font-bold ${
                        metaTitle.length >= 50 && metaTitle.length <= 60
                          ? 'text-emerald-600'
                          : metaTitle.length >= 40 && metaTitle.length <= 70
                          ? 'text-amber-600'
                          : 'text-rose-500'
                      }`}>
                        {metaTitle.length}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Title for Google search results..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none text-slate-800"
                    />
                  </div>

                  {/* Meta Description with 160-Char Counter */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-800">Meta Description</label>
                      <span className={`font-mono text-[11px] font-bold ${
                        metaDescription.length >= 140 && metaDescription.length <= 160
                          ? 'text-emerald-600'
                          : metaDescription.length >= 120 && metaDescription.length <= 175
                          ? 'text-amber-600'
                          : 'text-rose-500'
                      }`}>
                        {metaDescription.length}/160
                      </span>
                    </div>
                    <textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Compelling 140-160 character summary for search engines..."
                      rows={3}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none text-slate-800"
                    />
                  </div>

                  {/* Secondary Keywords Chips */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">Secondary LSI Keywords</label>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {secondaryKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <span>{kw}</span>
                          <button onClick={() => handleRemoveSecondaryKw(kw)} className="text-slate-400 hover:text-rose-600">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={secKwInput}
                      onChange={(e) => setSecKwInput(e.target.value)}
                      onKeyDown={handleAddSecondaryKw}
                      placeholder="Type keyword and press Enter or comma..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 outline-none text-slate-800"
                    />
                  </div>

                  {/* SEO Checklist */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-800">Optimization Checklist</div>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {seoResult.checks.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 text-[11px] leading-snug"
                        >
                          {c.status === 'pass' ? (
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          ) : c.status === 'warning' ? (
                            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-800 flex items-center justify-between">
                              <span>{c.label}</span>
                              <span className="text-[10px] text-slate-400">{c.points}/{c.maxPoints} pts</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{c.hint}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 2: SOCIAL ── */}
              {activeTab === 'social' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">Open Graph (Facebook & LinkedIn)</h4>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">OG Title</label>
                      <input
                        type="text"
                        value={ogTitle}
                        onChange={(e) => setOgTitle(e.target.value)}
                        placeholder={metaTitle || title || 'OG Title'}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">OG Description</label>
                      <textarea
                        value={ogDescription}
                        onChange={(e) => setOgDescription(e.target.value)}
                        placeholder={metaDescription || excerpt || 'OG Description'}
                        rows={2}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none mt-1"
                      />
                    </div>

                    {/* Social Preview Card */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                      <div className="aspect-video bg-slate-100 overflow-hidden flex items-center justify-center">
                        {ogImage || featuredImageUrl ? (
                          <img src={ogImage || featuredImageUrl} alt="Social preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-400">Social Cover Image</span>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50 space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">kdpstudio-aio.web.app</div>
                        <div className="font-bold text-xs text-slate-900 line-clamp-1">{ogTitle || metaTitle || title || 'Post Title'}</div>
                        <div className="text-[11px] text-slate-600 line-clamp-2">{ogDescription || metaDescription || excerpt}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: SCHEMA ── */}
              {activeTab === 'schema' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">Structured Data Schema Type</label>
                    <select
                      value={schemaType}
                      onChange={(e) => setSchemaType(e.target.value as BlogSchemaType)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none font-semibold text-slate-800"
                    >
                      <option value="Article">Article (Standard Blog Post)</option>
                      <option value="HowToArticle">HowTo Article (Step-by-step tutorial)</option>
                      <option value="FAQPage">FAQ Page (Includes rich Q&A dropdowns in Google)</option>
                      <option value="NewsArticle">News Article (Industry updates)</option>
                      <option value="Review">Review (Book/Tool comparison)</option>
                    </select>
                  </div>

                  {/* FAQ Items Builder */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">FAQ Rich Snippets ({faqItems.length})</label>
                      <button
                        onClick={handleAddFaq}
                        className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add FAQ</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {faqItems.map((faq, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 relative group">
                          <button
                            onClick={() => handleRemoveFaq(idx)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 p-1"
                            title="Remove FAQ"
                          >
                            <Trash2 size={13} />
                          </button>
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                            placeholder={`Q${idx + 1}: Question...`}
                            className="w-[90%] px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 outline-none font-semibold text-slate-800"
                          />
                          <textarea
                            value={faq.answer}
                            onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                            placeholder="Answer text..."
                            rows={2}
                            className="w-full px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 outline-none text-slate-700"
                          />
                        </div>
                      ))}
                      {faqItems.length === 0 && (
                        <div className="text-center p-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                          No FAQs added yet. Click "+ Add FAQ" to generate Google FAQPage rich snippets.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 4: EEAT ── */}
              {activeTab === 'eeat' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Author Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">Attributed Author</label>
                    <select
                      value={authorId}
                      onChange={(e) => handleSelectAuthor(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none font-semibold text-slate-800"
                    >
                      {authors.map((auth) => (
                        <option key={auth.id} value={auth.id}>
                          {auth.name} ({auth.credentials || 'Author'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Expert Reviewed Toggle */}
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Expert Reviewed Badge</div>
                      <div className="text-[11px] text-slate-500">Displays verified badge & reviewer credentials</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isExpertReviewed}
                      onChange={(e) => setIsExpertReviewed(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                    />
                  </div>

                  {isExpertReviewed && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Reviewed By (Name & Title)</label>
                      <input
                        type="text"
                        value={reviewedBy}
                        onChange={(e) => setReviewedBy(e.target.value)}
                        placeholder="e.g. Senior Publishing Editor"
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none mt-1"
                      />
                    </div>
                  )}

                  {/* Sources / Citations Builder */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">Citations & References ({sources.length})</label>
                      <button
                        onClick={handleAddSource}
                        className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add Source</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {sources.map((src, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 relative">
                          <button
                            onClick={() => handleRemoveSource(idx)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 size={13} />
                          </button>
                          <input
                            type="text"
                            value={src.title}
                            onChange={(e) => handleUpdateSource(idx, 'title', e.target.value)}
                            placeholder="Source Title (e.g. Amazon KDP Royalty Table)"
                            className="w-[90%] px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 outline-none font-semibold text-slate-800"
                          />
                          <input
                            type="text"
                            value={src.url}
                            onChange={(e) => handleUpdateSource(idx, 'url', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 outline-none font-mono text-slate-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-800">Editorial Internal Notes</label>
                    <textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Private notes for team and review history..."
                      rows={2}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-700"
                    />
                  </div>
                </div>
              )}

              {/* ── TAB 5: INTERNAL LINKS ── */}
              {activeTab === 'links' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <InternalLinksPanel
                    currentPost={{ id: postId, slug, title, category, tags, focusKeyword }}
                    editorContent={content}
                    onInsertLink={handleInsertInternalLink}
                  />
                </div>
              )}

              {/* ── TAB 6: SETTINGS & ADS ── */}
              {activeTab === 'settings' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">Category</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none font-semibold text-slate-800"
                      >
                        <option value="Publishing Strategy">Publishing Strategy</option>
                        <option value="Niche Research">Niche Research</option>
                        <option value="Cover Design">Cover Design</option>
                        <option value="Formatting & Interior">Formatting & Interior</option>
                        <option value="Marketing & Royalties">Marketing & Royalties</option>
                        <option value="Amazon KDP Updates">Amazon KDP Updates</option>
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">Tags</label>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <span>{t}</span>
                          <button onClick={() => handleRemoveTag(t)} className="text-slate-400 hover:text-rose-600">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Type tag and press Enter..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-800"
                    />
                  </div>

                  {/* AdSense Settings */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Google AdSense on Post</div>
                        <div className="text-[11px] text-slate-500">Master switch for in-content ad blocks</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={adsEnabled}
                        onChange={(e) => setAdsEnabled(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* No-Index Toggle */}
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-rose-900">Search Engine No-Index</div>
                      <div className="text-[10px] text-rose-700">Hides post from Google crawler indexing</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={noIndex}
                      onChange={(e) => setNoIndex(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────
              RIGHT COLUMN BOTTOM: Publish & Action Panel
             ───────────────────────────────────────── */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Publish Controls</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  status === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : status === 'review'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {status}
              </span>
            </div>

            {/* Schedule / Timing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Publish Immediately</span>
                <input
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
              </div>

              {!publishImmediately && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Schedule Date / Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none font-mono"
                  />
                </div>
              )}
            </div>

            {/* Main CTA Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleTriggerPublish}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Send size={15} />
                <span>{status === 'published' ? 'Update & Revalidate' : 'Publish to Blog'}</span>
              </button>

              <button
                onClick={() => executeSave('draft')}
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save size={14} />
                <span>Save as Draft</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Blog Draft Generator Studio Modal ── */}
      <AiDraftGenerator
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApply={handleApplyAiDraft}
        initialKeyword={focusKeyword || title}
      />
    </div>
  );
};
