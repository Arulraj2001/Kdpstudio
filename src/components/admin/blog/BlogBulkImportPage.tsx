'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Layers,
  FileCode,
  Check,
  AlertCircle,
  Copy,
  FolderDown,
  Sparkles,
} from 'lucide-react';
import { PageRoute } from '../../../types';
import { BlogAuthor, BlogStatus, BulkImportPost, BulkImportResult, BulkImportError } from '../../../types/blog';
import { validateBulkImport } from '../../../lib/bulkImportValidator';

interface BlogBulkImportPageProps {
  onNavigate: (route: PageRoute) => void;
}

export const BlogBulkImportPage: React.FC<BlogBulkImportPageProps> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [activeInputTab, setActiveInputTab] = useState<'paste' | 'upload'>('paste');
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonValidation, setJsonValidation] = useState<{
    valid: boolean;
    postCount: number;
    error?: string;
  }>({ valid: false, postCount: 0 });

  // Default Settings & Options
  const [defaultAuthorId, setDefaultAuthorId] = useState<string>('');
  const [defaultStatus, setDefaultStatus] = useState<BlogStatus>('draft');
  const [defaultCategory, setDefaultCategory] = useState<string>('Publishing Strategy');
  const [generateSlugs, setGenerateSlugs] = useState<boolean>(true);
  const [convertMarkdown, setConvertMarkdown] = useState<boolean>(true);
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [autoCalculateMetrics, setAutoCalculateMetrics] = useState<boolean>(true);

  // Validation Result (Step 2)
  const [validationResult, setValidationResult] = useState<BulkImportResult | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'valid' | 'invalid' | 'duplicates'>('valid');
  const [duplicateResolutions, setDuplicateResolutions] = useState<Record<string, 'skip' | 'overwrite' | 'suffix'>>({});

  // Execution State (Step 3)
  const [importing, setImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [totalToImport, setTotalToImport] = useState<number>(0);
  const [currentActionTitle, setCurrentActionTitle] = useState<string>('');
  const [importCounts, setImportCounts] = useState<{ success: number; failed: number; skipped: number }>({
    success: 0,
    failed: 0,
    skipped: 0,
  });
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Authors List
  useEffect(() => {
    fetch('/api/blog/authors')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.authors) && data.authors.length > 0) {
          setAuthors(data.authors);
          setDefaultAuthorId(data.authors[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Debounced Live JSON Syntax Validator
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = jsonText.trim();
      if (!trimmed) {
        setJsonValidation({ valid: false, postCount: 0 });
        return;
      }

      try {
        const parsed = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) {
          setJsonValidation({
            valid: false,
            postCount: 0,
            error: 'Root JSON structure must be an Array [...]',
          });
          return;
        }

        setJsonValidation({
          valid: true,
          postCount: parsed.length,
        });
      } catch (err: any) {
        setJsonValidation({
          valid: false,
          postCount: 0,
          error: err.message || 'Invalid JSON syntax',
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [jsonText]);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showToast('❌ Please select a valid .json file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('❌ File exceeds maximum 10MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      setActiveInputTab('paste');
      showToast(`📄 Loaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  // Step 1 -> Step 2: Validate & Preview
  const handleValidateAndPreview = async () => {
    if (!jsonValidation.valid) return;

    try {
      const parsedPosts = JSON.parse(jsonText);
      const res = await fetch('/api/admin/blog/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts: parsedPosts,
          options: {
            defaultStatus,
            defaultCategory,
            convertMarkdown,
            generateSlugs,
            skipDuplicates,
          },
        }),
      });

      const data = await res.json();
      if (data?.result) {
        setValidationResult(data.result);
        // Default duplicate resolution
        const dupResMap: Record<string, 'skip' | 'overwrite' | 'suffix'> = {};
        (data.result.duplicates || []).forEach((dup: any) => {
          dupResMap[dup.slug] = 'skip';
        });
        setDuplicateResolutions(dupResMap);
        setCurrentStep(2);
        if (data.result.validCount > 0) setActivePreviewTab('valid');
        else if (data.result.errorCount > 0) setActivePreviewTab('invalid');
      } else {
        // Fallback to client validation
        const clientResult = validateBulkImport(parsedPosts, {
          defaultStatus,
          defaultCategory,
          convertMarkdown,
          generateSlugs,
          skipDuplicates,
        });
        setValidationResult(clientResult);
        setCurrentStep(2);
      }
    } catch (err: any) {
      showToast(`❌ Validation error: ${err.message}`);
    }
  };

  // Step 2 -> Step 3: Start Sequential Import
  const handleStartImport = async () => {
    if (!validationResult || validationResult.validPosts.length === 0) {
      showToast('❌ No valid posts to import');
      return;
    }

    setCurrentStep(3);
    setImporting(true);
    setIsComplete(false);
    setImportProgress(0);
    setTotalToImport(validationResult.validPosts.length);
    setImportCounts({ success: 0, failed: 0, skipped: 0 });
    setImportLogs([]);

    const authorObj = authors.find((a) => a.id === defaultAuthorId);
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < validationResult.validPosts.length; i++) {
      const post = validationResult.validPosts[i];
      setCurrentActionTitle(`Importing: "${post.title}"`);
      setImportProgress(i + 1);

      try {
        const payload = {
          ...post,
          authorId: post.authorId || defaultAuthorId || undefined,
          authorName: post.authorName || authorObj?.name || 'KDP Studio Team',
          authorCredentials: post.authorCredentials || authorObj?.credentials || 'KDP Specialist',
          authorPhotoUrl: post.authorPhotoUrl || authorObj?.photoUrl || null,
          status: post.status || defaultStatus,
          category: post.category || defaultCategory,
        };

        const res = await fetch('/api/admin/blog/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data?.id) {
          successCount++;
          setImportLogs((prev) => [
            `✅ Row ${i + 1}: "${post.title}" → /blog/${data.slug || post.slug}`,
            ...prev,
          ]);
        } else {
          failedCount++;
          setImportLogs((prev) => [
            `❌ Row ${i + 1}: Failed to import "${post.title}" (${data?.error || 'Database error'})`,
            ...prev,
          ]);
        }
      } catch (err: any) {
        failedCount++;
        setImportLogs((prev) => [
          `❌ Row ${i + 1}: Network error on "${post.title}" (${err.message})`,
          ...prev,
        ]);
      }

      setImportCounts({ success: successCount, failed: failedCount, skipped: skippedCount });
      // Small tick delay to show smooth visual progress
      await new Promise((r) => setTimeout(r, 60));
    }

    setImporting(false);
    setIsComplete(true);
    setCurrentActionTitle('All posts processed successfully!');

    // Trigger on-demand ISR revalidation for the fresh articles
    try {
      await fetch('/api/blog/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revalidateAll: true }),
      });
    } catch {}
  };

  // Download Error Report CSV
  const handleDownloadErrorReport = () => {
    if (!validationResult || validationResult.errors.length === 0) return;

    const headers = ['Row', 'Title', 'Field', 'Error', 'Value'];
    const rows = validationResult.errors.map((e) => [
      e.row,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${e.field}"`,
      `"${e.message.replace(/"/g, '""')}"`,
      `"${String(e.value || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kdp-blog-import-errors-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('⬇️ Downloaded Error Report CSV');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom duration-200">
          {toastMessage}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>📦</span> Bulk Article Ingestion Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Import hundreds of articles from JSON or Markdown frontmatter with validation, TOC generation, and auto-slugging
          </p>
        </div>

        <button
          onClick={() => onNavigate('admin-blog')}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Posts</span>
        </button>
      </div>

      {/* ── 3-Step Wizard Navigation Stepper ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { step: 1, label: '1. Upload or Paste JSON', desc: 'Input payload' },
          { step: 2, label: '2. Validation & Preview', desc: 'Verify data' },
          { step: 3, label: '3. Real-Time Import', desc: 'Firestore execution' },
        ].map((s) => (
          <div
            key={s.step}
            className={`p-3 sm:p-4 rounded-2xl border transition-all ${
              currentStep === s.step
                ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-2xs'
                : currentStep > s.step
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            <div className="text-xs sm:text-sm font-extrabold flex items-center gap-2">
              {currentStep > s.step ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    currentStep === s.step ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {s.step}
                </span>
              )}
              <span className="truncate">{s.label}</span>
            </div>
            <div className="text-[11px] opacity-75 mt-0.5 hidden sm:block">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────
          STEP 1: Upload / Paste & Configuration
         ───────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-5">
            {/* Input Method Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveInputTab('paste')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeInputTab === 'paste'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Paste JSON Array
                </button>
                <button
                  onClick={() => setActiveInputTab('upload')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeInputTab === 'upload'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Upload .json File
                </button>
              </div>

              {/* Sample Downloads */}
              <div className="flex items-center gap-2">
                <a
                  href="/blog-import-sample.json"
                  download="blog-import-sample.json"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  title="Download sample JSON file"
                >
                  <FolderDown size={13} />
                  <span>Sample JSON</span>
                </a>
                <a
                  href="/blog-import-sample.md"
                  download="blog-import-sample.md"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  title="Download Markdown sample"
                >
                  <FileCode size={13} />
                  <span>Sample MD</span>
                </a>
              </div>
            </div>

            {/* Tab 1: Paste Textarea */}
            {activeInputTab === 'paste' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-800">JSON Posts Payload (Array of objects)</label>
                  {jsonValidation.valid ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 size={13} />
                      <span>{jsonValidation.postCount} posts detected</span>
                    </span>
                  ) : jsonValidation.error ? (
                    <span className="text-rose-600 font-semibold text-[11px] truncate max-w-xs">
                      ❌ {jsonValidation.error}
                    </span>
                  ) : null}
                </div>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder="[\n  {\n    &quot;title&quot;: &quot;10 Profitable KDP Niches in 2026&quot;,\n    &quot;slug&quot;: &quot;profitable-kdp-niches-2026&quot;,\n    &quot;content&quot;: &quot;&lt;h2&gt;Niche 1...&lt;/h2&gt;&quot;,\n    &quot;category&quot;: &quot;Publishing Strategy&quot;,\n    &quot;status&quot;: &quot;published&quot;\n  }\n]"
                  rows={14}
                  className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 leading-relaxed placeholder:text-slate-300"
                />
              </div>
            ) : (
              /* Tab 2: Upload Dropzone */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-300 bg-purple-50/40 rounded-3xl p-10 text-center hover:bg-purple-50/80 transition-colors cursor-pointer space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload size={36} className="mx-auto text-purple-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Click or Drag & Drop .json File</h3>
                  <p className="text-xs text-slate-500 mt-1">Accepts standard JSON array format up to 10MB</p>
                </div>
              </div>
            )}

            {/* ── Default Fallback Settings & Options ── */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Default Ingestion Settings & Options
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Default Author */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Default Author</label>
                  <select
                    value={defaultAuthorId}
                    onChange={(e) => setDefaultAuthorId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 outline-none font-semibold mt-1"
                  >
                    {authors.map((auth) => (
                      <option key={auth.id} value={auth.id}>
                        {auth.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Default Status */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Default Status</label>
                  <select
                    value={defaultStatus}
                    onChange={(e) => setDefaultStatus(e.target.value as BlogStatus)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 outline-none font-semibold mt-1"
                  >
                    <option value="draft">Draft (Safe)</option>
                    <option value="published">Published (Live)</option>
                    <option value="review">In Review</option>
                  </select>
                </div>

                {/* Default Category */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Default Category</label>
                  <select
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 outline-none font-semibold mt-1"
                  >
                    <option value="Publishing Strategy">Publishing Strategy</option>
                    <option value="Niche Research">Niche Research</option>
                    <option value="Cover Design">Cover Design</option>
                    <option value="Formatting & Interior">Formatting & Interior</option>
                    <option value="Marketing & Royalties">Marketing & Royalties</option>
                  </select>
                </div>
              </div>

              {/* Checkbox Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60 text-xs">
                <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateSlugs}
                    onChange={(e) => setGenerateSlugs(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span>Generate URL slugs from titles if missing</span>
                </label>

                <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={convertMarkdown}
                    onChange={(e) => setConvertMarkdown(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span>Convert Markdown syntax into clean HTML</span>
                </label>

                <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span>Skip duplicate slugs without failing the batch</span>
                </label>

                <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCalculateMetrics}
                    onChange={(e) => setAutoCalculateMetrics(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span>Auto-calculate reading time, word count & TOC</span>
                </label>
              </div>
            </div>

            {/* Validation Action */}
            <div className="flex items-center justify-end pt-2">
              <button
                onClick={handleValidateAndPreview}
                disabled={!jsonValidation.valid}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/30 flex items-center gap-2 disabled:opacity-40 cursor-pointer transition-all active:scale-95"
              >
                <span>Validate & Preview ({jsonValidation.postCount} Posts)</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────
          STEP 2: Validation Preview & Error Inspection
         ───────────────────────────────────────── */}
      {currentStep === 2 && validationResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-4">
              <CheckCircle2 size={32} className="text-emerald-600 shrink-0" />
              <div>
                <div className="text-2xl font-black">{validationResult.validCount}</div>
                <div className="text-xs font-semibold text-emerald-800">Valid Posts Ready</div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-950 flex items-center gap-4">
              <XCircle size={32} className="text-rose-600 shrink-0" />
              <div>
                <div className="text-2xl font-black">{validationResult.errorCount}</div>
                <div className="text-xs font-semibold text-rose-800">Errors Detected</div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center gap-4">
              <AlertTriangle size={32} className="text-amber-600 shrink-0" />
              <div>
                <div className="text-2xl font-black">{validationResult.duplicateCount}</div>
                <div className="text-xs font-semibold text-amber-800">Duplicate Slugs</div>
              </div>
            </div>
          </div>

          {/* Validation Tabs Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs space-y-0">
            <div className="flex items-center justify-between border-b border-slate-200/80 p-3 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePreviewTab('valid')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    activePreviewTab === 'valid'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Valid Posts ({validationResult.validCount})
                </button>
                <button
                  onClick={() => setActivePreviewTab('invalid')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    activePreviewTab === 'invalid'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Invalid ({validationResult.errorCount})
                </button>
                <button
                  onClick={() => setActivePreviewTab('duplicates')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    activePreviewTab === 'duplicates'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Duplicates ({validationResult.duplicateCount})
                </button>
              </div>

              {validationResult.errors.length > 0 && (
                <button
                  onClick={handleDownloadErrorReport}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Error CSV</span>
                </button>
              )}
            </div>

            {/* TAB: Valid Posts Table */}
            {activePreviewTab === 'valid' && (
              <div className="overflow-x-auto p-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase border-b border-slate-100 pb-2">
                      <th className="pb-2">#</th>
                      <th className="pb-2">Title</th>
                      <th className="pb-2">Slug</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Focus Keyword</th>
                      <th className="pb-2">Words</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {validationResult.validPosts.slice(0, 10).map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 font-bold text-slate-900 max-w-xs truncate">{p.title}</td>
                        <td className="py-2.5 font-mono text-purple-700 text-[11px]">{p.slug}</td>
                        <td className="py-2.5">{p.category || defaultCategory}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 uppercase">
                            {p.status || defaultStatus}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-500 font-mono text-[11px]">{p.focusKeyword || '—'}</td>
                        <td className="py-2.5 font-mono">{p.wordCount || 800}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {validationResult.validPosts.length > 10 && (
                  <div className="p-3 text-center text-xs text-slate-400 border-t border-slate-100 font-medium">
                    + {validationResult.validPosts.length - 10} more valid posts ready to import
                  </div>
                )}
              </div>
            )}

            {/* TAB: Invalid Posts Errors Table */}
            {activePreviewTab === 'invalid' && (
              <div className="overflow-x-auto p-4">
                {validationResult.errors.length === 0 ? (
                  <div className="p-8 text-center text-emerald-600 font-bold text-xs">
                    ✨ No validation errors found! All posts conform to specifications.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold uppercase border-b border-slate-100 pb-2">
                        <th className="pb-2">Row #</th>
                        <th className="pb-2">Title</th>
                        <th className="pb-2">Field</th>
                        <th className="pb-2">Error Message</th>
                        <th className="pb-2">Provided Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {validationResult.errors.map((err, idx) => (
                        <tr key={idx} className="hover:bg-rose-50/50">
                          <td className="py-2.5 font-mono text-rose-600 font-bold">Row {err.row}</td>
                          <td className="py-2.5 font-bold text-slate-900 max-w-[180px] truncate">
                            {err.title || 'Untitled'}
                          </td>
                          <td className="py-2.5 font-mono text-slate-600">{err.field}</td>
                          <td className="py-2.5 text-rose-600 font-semibold">{err.message}</td>
                          <td className="py-2.5 font-mono text-slate-400 text-[11px] truncate max-w-[140px]">
                            {String(err.value || '—')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB: Duplicates Table */}
            {activePreviewTab === 'duplicates' && (
              <div className="overflow-x-auto p-4 space-y-3">
                {validationResult.duplicates.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    ✨ No duplicate slugs detected against existing database records.
                  </div>
                ) : (
                  validationResult.duplicates.map((dup, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{dup.title}</div>
                        <div className="font-mono text-amber-700 text-[11px]">/blog/{dup.slug}</div>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-semibold">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`dup-${dup.slug}`}
                            checked={duplicateResolutions[dup.slug] === 'skip'}
                            onChange={() =>
                              setDuplicateResolutions({ ...duplicateResolutions, [dup.slug]: 'skip' })
                            }
                            className="text-purple-600"
                          />
                          <span>Skip</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`dup-${dup.slug}`}
                            checked={duplicateResolutions[dup.slug] === 'suffix'}
                            onChange={() =>
                              setDuplicateResolutions({ ...duplicateResolutions, [dup.slug]: 'suffix' })
                            }
                            className="text-purple-600"
                          />
                          <span>Import with "-2"</span>
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
            >
              ← Back to Payload
            </button>

            <button
              onClick={handleStartImport}
              disabled={validationResult.validCount === 0}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              <span>Start Ingestion ({validationResult.validCount} Posts)</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────
          STEP 3: Real-Time Execution Progress & Logs
         ───────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isComplete ? '🎉 Bulk Ingestion Complete!' : 'Importing Articles...'}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{currentActionTitle}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-purple-700">
                  {importProgress} / {totalToImport}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Articles processed</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-150"
                style={{ width: `${Math.round((importProgress / (totalToImport || 1)) * 100)}%` }}
              />
            </div>

            {/* Counters */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="text-lg font-black text-emerald-700">{importCounts.success}</div>
                <div className="text-[11px] font-bold text-emerald-900">Imported</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                <div className="text-lg font-black text-rose-700">{importCounts.failed}</div>
                <div className="text-[11px] font-bold text-rose-900">Failed</div>
              </div>
              <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200">
                <div className="text-lg font-black text-slate-700">{importCounts.skipped}</div>
                <div className="text-[11px] font-bold text-slate-900">Skipped</div>
              </div>
            </div>

            {/* Monospace Execution Log */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Log Stream</label>
              <div className="p-4 bg-slate-900 rounded-2xl font-mono text-xs text-slate-200 h-64 overflow-y-auto space-y-1.5 border border-slate-800 shadow-inner">
                {importLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Complete Actions */}
            {isComplete && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <span className="text-xs text-emerald-700 font-bold">
                  ✨ {importCounts.success} posts live on blog & ISR cache purged
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      setJsonText('');
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Import More
                  </button>
                  <button
                    onClick={() => onNavigate('admin-blog')}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    View All Posts →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
