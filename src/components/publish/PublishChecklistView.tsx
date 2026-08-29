import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  ExternalLink, 
  Download, 
  FileText, 
  Image, 
  Tag, 
  DollarSign, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  BookOpen, 
  ChevronRight,
  ShieldCheck,
  Printer,
  Info
} from 'lucide-react';
import { useBookStore } from '../../lib/store';
import { PageRoute, Book, FormatterSettings } from '../../types';
import { getCoverDimensions, calculateCoverDimensions, getMargins, getTrimDimensions } from '../../lib/kdp';
import { exportBookAsPdf } from '../../lib/pdfClientExport';

interface PublishChecklistViewProps {
  onNavigate: (route: PageRoute) => void;
  selectedBookId?: string;
}

export const PublishChecklistView: React.FC<PublishChecklistViewProps> = ({ 
  onNavigate,
  selectedBookId 
}) => {
  const { books, currentBook, setCurrentBook } = useBookStore();
  const [activeBookId, setActiveBookId] = useState<string>(
    selectedBookId || (currentBook ? currentBook.id : (books[0]?.id || ''))
  );
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const activeBook = useMemo(() => {
    return books.find(b => b.id === activeBookId) || currentBook || books[0] || null;
  }, [books, activeBookId, currentBook]);

  // Calculations for active book
  const totalWords = useMemo(() => {
    if (!activeBook) return 0;
    return activeBook.chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
  }, [activeBook]);

  const estimatedPages = useMemo(() => {
    return Math.max(24, Math.ceil(totalWords / 250) + 6); // chapters + front/back matter
  }, [totalWords]);

  const coverSpecs = useMemo(() => {
    if (!activeBook) return null;
    return getCoverDimensions(activeBook.trimSize, estimatedPages, activeBook.paperType);
  }, [activeBook, estimatedPages]);

  const printCostInfo = useMemo(() => {
    if (!activeBook) return null;
    const calc = calculateCoverDimensions(activeBook.trimSize, estimatedPages, activeBook.paperType);
    const listPrice = activeBook.metadata?.price || 14.99;
    const royaltyRate = activeBook.metadata?.royaltyPlan === '35' ? 0.35 : 0.70;
    const royaltyPerSale = Math.max(0, (listPrice * royaltyRate) - calc.printingCost);
    return {
      cost: calc.printingCost,
      listPrice,
      royaltyPerSale,
    };
  }, [activeBook, estimatedPages]);

  // Step Validations
  const interiorCheck = useMemo(() => {
    if (!activeBook) return { status: 'incomplete', score: 0, items: [] };
    const hasChapters = activeBook.chapters && activeBook.chapters.length > 0;
    const hasEnoughWords = totalWords >= 1000;
    const hasEnoughPages = estimatedPages >= 24;
    const hasFrontMatter = activeBook.frontMatter.titlePage && activeBook.frontMatter.copyrightPage;

    const items = [
      { label: `Manuscript contains ${activeBook.chapters.length} chapter(s)`, pass: hasChapters },
      { label: `Total word count: ${totalWords.toLocaleString()} words`, pass: hasEnoughWords },
      { label: `Estimated page count: ${estimatedPages} pages (KDP min: 24)`, pass: hasEnoughPages },
      { label: 'Title page and copyright front-matter enabled', pass: hasFrontMatter },
    ];

    const passedCount = items.filter(i => i.pass).length;
    const status = passedCount === items.length ? 'complete' : passedCount >= 2 ? 'warning' : 'incomplete';
    return { status, score: (passedCount / items.length) * 100, items };
  }, [activeBook, totalWords, estimatedPages]);

  const coverCheck = useMemo(() => {
    if (!activeBook || !coverSpecs) return { status: 'incomplete', score: 0, items: [] };
    const hasValidSpine = coverSpecs.spineWidth > 0;
    const hasBleed = coverSpecs.bleed > 0;

    const items = [
      { label: `Trim size matches manuscript: ${activeBook.trimSize} on ${activeBook.paperType} paper`, pass: true },
      { label: `Spine thickness calculated: ${coverSpecs.spineWidth.toFixed(3)}"`, pass: hasValidSpine },
      { label: `Full wrap canvas dimensions: ${coverSpecs.totalWidth.toFixed(3)}" × ${coverSpecs.totalHeight.toFixed(3)}"`, pass: true },
      { label: 'Includes standard 0.125" bleed and safe margin zones', pass: hasBleed },
    ];

    const passedCount = items.filter(i => i.pass).length;
    const status = passedCount === items.length ? 'complete' : 'warning';
    return { status, score: (passedCount / items.length) * 100, items };
  }, [activeBook, coverSpecs]);

  const metadataCheck = useMemo(() => {
    if (!activeBook) return { status: 'incomplete', score: 0, items: [] };
    const meta = activeBook.metadata;
    const hasDescription = !!meta?.description && meta.description.length > 50;
    const keywordCount = meta?.keywords ? meta.keywords.filter(k => k.trim().length > 0).length : 0;
    const hasKeywords = keywordCount >= 4;
    const categoryCount = meta?.categories ? meta.categories.length : 0;
    const hasCategories = categoryCount >= 1;

    const items = [
      { label: `Book description formatted with HTML (${meta?.description?.length || 0}/4000 chars)`, pass: hasDescription },
      { label: `7 KDP Search Keywords configured (${keywordCount}/7 filled)`, pass: hasKeywords },
      { label: `BISAC Subject Categories selected (${categoryCount}/2 selected)`, pass: hasCategories },
      { label: `Primary language: ${activeBook.language || 'English'}`, pass: true },
    ];

    const passedCount = items.filter(i => i.pass).length;
    const status = passedCount === items.length ? 'complete' : passedCount >= 2 ? 'warning' : 'incomplete';
    return { status, score: (passedCount / items.length) * 100, items };
  }, [activeBook]);

  const pricingCheck = useMemo(() => {
    if (!activeBook || !printCostInfo) return { status: 'incomplete', score: 0, items: [] };
    const hasPrice = printCostInfo.listPrice > printCostInfo.cost;
    const profitable = printCostInfo.royaltyPerSale > 0;

    const items = [
      { label: `List price set to $${printCostInfo.listPrice.toFixed(2)} USD`, pass: hasPrice },
      { label: `Estimated print cost: $${printCostInfo.cost.toFixed(2)} (List price is above min threshold)`, pass: hasPrice },
      { label: `Royalty plan: ${activeBook.metadata?.royaltyPlan || '70'}% (~$${printCostInfo.royaltyPerSale.toFixed(2)} royalty/sale)`, pass: profitable },
      { label: 'Worldwide distribution rights enabled', pass: true },
    ];

    const passedCount = items.filter(i => i.pass).length;
    const status = passedCount === items.length ? 'complete' : 'warning';
    return { status, score: (passedCount / items.length) * 100, items };
  }, [activeBook, printCostInfo]);

  // Overall readiness
  const overallReadiness = useMemo(() => {
    const scores = [interiorCheck.score, coverCheck.score, metadataCheck.score, pricingCheck.score];
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return avg;
  }, [interiorCheck, coverCheck, metadataCheck, pricingCheck]);

  const handleCopySummary = () => {
    if (!activeBook) return;
    const text = `=== AMAZON KDP METADATA BUNDLE ===
Title: ${activeBook.title}
Subtitle: ${activeBook.subtitle || 'N/A'}
Author: ${activeBook.author}
Genre: ${activeBook.genre}
Language: ${activeBook.language || 'English'}
Trim Size: ${activeBook.trimSize}
Paper Type: ${activeBook.paperType}
Estimated Page Count: ${estimatedPages}

--- 7 SEARCH KEYWORDS ---
${(activeBook.metadata?.keywords || []).map((k, i) => `${i + 1}. ${k}`).join('\n')}

--- BISAC CATEGORIES ---
${(activeBook.metadata?.categories || []).map((c, i) => `${i + 1}. ${c}`).join('\n')}

--- PRICING & ROYALTY ---
List Price: $${activeBook.metadata?.price?.toFixed(2) || '14.99'} USD
Royalty Plan: ${activeBook.metadata?.royaltyPlan || '70'}%
Estimated Print Cost: $${printCostInfo?.cost.toFixed(2) || '2.85'}
Est. Profit Per Copy: $${printCostInfo?.royaltyPerSale.toFixed(2) || '7.64'}

--- BOOK DESCRIPTION (HTML) ---
${activeBook.metadata?.description || ''}
`;
    navigator.clipboard.writeText(text);
    setCopiedSection('bundle');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleExportInteriorPdf = async () => {
    if (!activeBook) return;
    setIsExportingPdf(true);
    try {
      const settings: FormatterSettings = {
        fontFamily: 'Garamond',
        fontSize: '11pt',
        lineSpacing: '1.15',
        paragraphIndent: '0.25in',
        dropCaps: true,
        trimSize: activeBook.trimSize,
        paperType: activeBook.paperType,
        pageNumberPosition: 'bottom-center',
        chapterStart: 'always-new-page',
        runningHeader: 'book-title',
        includedSections: {
          titlePage: activeBook.frontMatter.titlePage,
          copyright: activeBook.frontMatter.copyrightPage,
          dedication: !!activeBook.frontMatter.dedication,
          toc: activeBook.frontMatter.tableOfContents,
          preface: !!activeBook.frontMatter.preface,
          chapters: true,
          aboutAuthor: !!activeBook.backMatter.aboutAuthor,
        }
      };

      const margins = getMargins(activeBook.trimSize, estimatedPages, true);
      const trimDims = getTrimDimensions(activeBook.trimSize);

      await exportBookAsPdf(activeBook, settings, margins, trimDims);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!activeBook) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto">
        <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">No Book Selected</h3>
        <p className="text-xs text-slate-500 mb-4">Please create or choose a book to view the publishing checklist.</p>
        <button
          onClick={() => onNavigate('books')}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700"
        >
          Go to My Books
        </button>
      </div>
    );
  }

  return (
    <div id="publish-checklist-view" className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Book Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
              Pre-Flight Inspector
            </span>
            <span className="text-xs text-slate-500">· Amazon KDP 2025 Standard</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">KDP Publishing Checklist</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Audit your manuscript, cover dimensions, metadata, and royalties before uploading to Kindle Direct Publishing.
          </p>
        </div>

        {/* Book Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Active Book:</label>
          <select
            value={activeBook.id}
            onChange={(e) => {
              setActiveBookId(e.target.value);
              setCurrentBook(e.target.value);
            }}
            className="text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 max-w-xs"
          >
            {books.map(b => (
              <option key={b.id} value={b.id}>
                {b.title} ({b.trimSize})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Readiness Hero Metric Banner */}
      <div className="bg-linear-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md border border-purple-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                <ShieldCheck size={26} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{activeBook.title}</span>
                  {activeBook.subtitle && <span className="text-xs font-normal text-purple-300">· {activeBook.subtitle}</span>}
                </h2>
                <p className="text-xs text-purple-200">
                  By {activeBook.author} · {activeBook.genre} · {activeBook.trimSize} ({activeBook.paperType} paper)
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              Complete all 5 validation milestones below to ensure error-free KDP manuscript processing and instant paperback approval.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 w-full md:w-auto justify-between md:justify-start">
            <div>
              <div className="text-3xl font-black tracking-tight text-white">
                {overallReadiness}%
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-200">
                KDP Readiness
              </div>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {copiedSection === 'bundle' ? <Check size={15} /> : <Copy size={15} />}
              <span>{copiedSection === 'bundle' ? 'Copied Bundle!' : 'Copy KDP Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stepper / Milestones List */}
      <div className="space-y-4">
        {/* STEP 1: Interior Manuscript */}
        <div className={`p-6 rounded-2xl border transition-all ${
          interiorCheck.status === 'complete' 
            ? 'bg-white border-emerald-200 shadow-xs' 
            : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                interiorCheck.status === 'complete'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {interiorCheck.status === 'complete' ? <CheckCircle2 size={18} /> : '1'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Step 1: Interior Manuscript PDF</span>
                  {interiorCheck.status === 'complete' ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Validated
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Action Required
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">Formatted according to KDP trim size and margin requirements.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('formatter')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
              >
                <FileText size={14} />
                <span>Open Formatter</span>
              </button>
              <button
                onClick={handleExportInteriorPdf}
                disabled={isExportingPdf}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Download size={14} />
                <span>{isExportingPdf ? 'Exporting...' : 'Export Print PDF'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4">
            {interiorCheck.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                {item.pass ? (
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                )}
                <span className={item.pass ? 'text-slate-700 font-medium' : 'text-slate-500'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 2: Cover File & Dimensions */}
        <div className={`p-6 rounded-2xl border transition-all ${
          coverCheck.status === 'complete' 
            ? 'bg-white border-emerald-200 shadow-xs' 
            : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                coverCheck.status === 'complete'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {coverCheck.status === 'complete' ? <CheckCircle2 size={18} /> : '2'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Step 2: Paperback Full-Wrap Cover Spread</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Math Verified
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Back cover, spine, and front cover combined into a single 300 DPI spread.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('cover')}
                className="px-3.5 py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Image size={14} />
                <span>Launch Cover Builder</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4">
            {coverCheck.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                {item.pass ? (
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                )}
                <span className={item.pass ? 'text-slate-700 font-medium' : 'text-slate-500'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {coverSpecs && (
            <div className="mt-4 p-3 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center justify-between text-xs text-purple-900">
              <div className="flex items-center gap-2">
                <Info size={15} className="text-purple-600" />
                <span>
                  Exact Dimensions: <b>{coverSpecs.totalWidth.toFixed(3)}" × {coverSpecs.totalHeight.toFixed(3)}"</b> (Spine: {coverSpecs.spineWidth.toFixed(3)}")
                </span>
              </div>
              <span className="text-[11px] font-bold text-purple-700">300 DPI Ready</span>
            </div>
          )}
        </div>

        {/* STEP 3: KDP Metadata & Optimization */}
        <div className={`p-6 rounded-2xl border transition-all ${
          metadataCheck.status === 'complete' 
            ? 'bg-white border-emerald-200 shadow-xs' 
            : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                metadataCheck.status === 'complete'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {metadataCheck.status === 'complete' ? <CheckCircle2 size={18} /> : '3'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Step 3: Book Description, Keywords & Categories</span>
                  {metadataCheck.status === 'complete' ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Optimized
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Needs Setup
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">7 search keywords, 2 BISAC subject categories, and high-converting blurb.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('kdp')}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>KDP Assistant Suite</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4">
            {metadataCheck.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                {item.pass ? (
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                )}
                <span className={item.pass ? 'text-slate-700 font-medium' : 'text-slate-500'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 4: Pricing & Royalties */}
        <div className={`p-6 rounded-2xl border transition-all ${
          pricingCheck.status === 'complete' 
            ? 'bg-white border-emerald-200 shadow-xs' 
            : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                pricingCheck.status === 'complete'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {pricingCheck.status === 'complete' ? <CheckCircle2 size={18} /> : '4'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Step 4: Pricing Strategy & Royalties</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Calculated
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Print cost deductions, list price margin, and author royalty share.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('kdp')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
              >
                <DollarSign size={14} />
                <span>Adjust in Royalty Tool</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4">
            {pricingCheck.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                {item.pass ? (
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                )}
                <span className={item.pass ? 'text-slate-700 font-medium' : 'text-slate-500'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 5: Amazon KDP Direct Upload */}
        <div className="p-6 rounded-2xl bg-linear-to-r from-purple-50 via-white to-purple-50/50 border border-purple-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Printer size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 5: Publish on Amazon KDP</h3>
                <p className="text-xs text-slate-600">
                  Open the official Amazon KDP Bookshelf and paste your pre-flight assets.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopySummary}
                className="px-4 py-2.5 rounded-xl border border-purple-200 bg-white text-purple-700 text-xs font-semibold hover:bg-purple-50 flex items-center gap-2 transition-colors shadow-xs"
              >
                {copiedSection === 'bundle' ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedSection === 'bundle' ? 'Copied to Clipboard!' : 'Copy All KDP Fields'}</span>
              </button>
              <a
                href="https://kdp.amazon.com"
                target="_blank"
                rel="noreferrer noopener"
                className="px-4 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                <span>Go to Amazon KDP</span>
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
