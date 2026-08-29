/**
 * KDP Studio — Full Content Audit Report View
 * Phase 16C
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  BookOpen,
  Layers,
  FileText,
  BookmarkCheck,
  Sparkles,
  Printer,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Info,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ContentAuditReport } from '../../types/audit';
import { Book, PageRoute } from '../../types';

interface FullAuditReportViewProps {
  report: ContentAuditReport;
  book: Book;
  onBack: () => void;
  onRerunAudit: () => void;
  onNavigateToRoute?: (route: PageRoute) => void;
}

export const FullAuditReportView: React.FC<FullAuditReportViewProps> = ({
  report,
  book,
  onBack,
  onRerunAudit,
  onNavigateToRoute,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'issues'>('all');

  const formattedDate = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return {
        bg: 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300',
        label: 'KDP Ready',
        description: 'Manuscript exhibits high quality and complies with standard Amazon KDP requirements.',
      };
    }
    if (score >= 60) {
      return {
        bg: 'bg-blue-950/80 border-blue-500/80 text-blue-300',
        label: 'Minor Issues',
        description: 'Address recommended warnings below for optimal formatting and reader engagement.',
      };
    }
    if (score >= 40) {
      return {
        bg: 'bg-amber-950/80 border-amber-500/80 text-amber-300',
        label: 'Needs Work',
        description: 'Essential items require attention before submitting to Amazon KDP.',
      };
    }
    return {
      bg: 'bg-rose-950/80 border-rose-500/80 text-rose-300',
      label: 'Major Issues',
      description: 'Critical publishing requirements or formatting errors detected.',
    };
  };

  const scoreBadge = getScoreBadge(report.overallScore);

  // Compile priority action items
  const requiredFixes: string[] = [];
  const recommendedFixes: string[] = [];
  const optionalImprovements: string[] = [];

  if (!report.checks.wordCount.passed) {
    requiredFixes.push(...report.checks.wordCount.suggestions);
  } else if (report.checks.wordCount.severity === 'warning') {
    recommendedFixes.push(...report.checks.wordCount.suggestions);
  }

  if (!report.checks.formatting.passed) {
    requiredFixes.push(...report.checks.formatting.suggestions);
  } else if (report.checks.formatting.severity === 'warning') {
    recommendedFixes.push(...report.checks.formatting.suggestions);
  }

  if (!report.checks.contentCompleteness.passed) {
    requiredFixes.push(...report.checks.contentCompleteness.suggestions);
  } else if (report.checks.contentCompleteness.severity === 'warning') {
    recommendedFixes.push(...report.checks.contentCompleteness.suggestions);
  }

  if (!report.checks.kdpPolicyCompliance.passed) {
    requiredFixes.push(...report.checks.kdpPolicyCompliance.suggestions);
  }

  if (report.checks.grammarQuality.suggestions) {
    recommendedFixes.push(...report.checks.grammarQuality.suggestions);
  }

  if (report.checks.readingLevel.suggestions) {
    optionalImprovements.push(...report.checks.readingLevel.suggestions);
  }
  if (report.checks.genreConsistency.suggestions) {
    optionalImprovements.push(...report.checks.genreConsistency.suggestions);
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Top Navigation & Print Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Book Studio ({book.title})</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRerunAudit}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Re-Run Audit</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={13} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Executive Summary Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/60">
                {report.auditType.toUpperCase()} CONTENT AUDIT
              </span>
              <span className="text-xs text-slate-500">{formattedDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {book.title}
            </h1>
            <p className="text-xs text-slate-400">
              by <span className="text-white font-medium">{book.author || 'Anonymous'}</span> ·{' '}
              {book.genre} · {book.chapters?.length || 0} chapters
            </p>
          </div>

          {/* Large Overall Score Gauge */}
          <div className="flex items-center gap-4 shrink-0">
            <div
              className={`w-24 h-24 rounded-3xl border-2 flex flex-col items-center justify-center font-extrabold shadow-xl ${scoreBadge.bg}`}
            >
              <span className="text-3xl leading-none font-mono">{report.overallScore}</span>
              <span className="text-[10px] uppercase tracking-wider mt-1">/ 100</span>
            </div>

            <div className="space-y-1">
              <div className={`inline-block px-3 py-1 rounded-xl text-xs font-extrabold border ${scoreBadge.bg}`}>
                {scoreBadge.label}
              </div>
              <p className="text-xs font-mono text-purple-300">
                KDP Confidence: <b>{report.kdpReadyConfidence}%</b>
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Processed in {(report.processingTimeMs / 1000).toFixed(1)}s
              </p>
            </div>
          </div>
        </div>

        {/* Readiness Description Callout */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 flex items-start gap-3">
          <Info size={18} className="text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <h4 className="font-bold text-white">Executive Summary</h4>
            <p className="text-slate-300 leading-relaxed">{report.summary}</p>
          </div>
        </div>
      </div>

      {/* Grid of 8 Quality Check Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Word Count Check */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-purple-400" />
              <h3 className="text-sm font-bold text-white">Word Count Analysis</h3>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                report.checks.wordCount.passed
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-rose-950 text-rose-300 border-rose-800'
              }`}
            >
              {report.checks.wordCount.score}/100
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono">
                {report.checks.wordCount.totalWords.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">Total Words</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">{report.checks.wordCount.details}</p>

            {/* Chapter Breakdown Table */}
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 text-[11px]">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-2">Chapter</th>
                    <th className="p-2 text-right">Words</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {report.checks.wordCount.byChapter.map((ch, i) => (
                    <tr key={i} className="hover:bg-slate-900/50">
                      <td className="p-2 text-slate-300 truncate max-w-[180px]">{ch.title}</td>
                      <td className="p-2 text-right font-mono text-slate-400">
                        {ch.words.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card 2: Reading Level (Flesch-Kincaid) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-400" />
              <h3 className="text-sm font-bold text-white">Reading Level (Flesch-Kincaid)</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800">
              Grade {report.checks.readingLevel.grade}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-white capitalize">
                {report.checks.readingLevel.level} Level
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Flesch Score: {report.checks.readingLevel.fleschScore}
              </span>
            </div>

            {/* Reading Level Gauge Bar */}
            <div className="space-y-1">
              <div className="grid grid-cols-5 gap-1 text-[9px] uppercase font-bold text-slate-500 text-center">
                <span>Elem (1-5)</span>
                <span>Middle (6-8)</span>
                <span>High (9-12)</span>
                <span>College (13-16)</span>
                <span>Acad (17+)</span>
              </div>
              <div className="grid grid-cols-5 gap-1 h-2 rounded-full overflow-hidden bg-slate-950 p-0.5 border border-slate-800">
                {['elementary', 'middle-school', 'high-school', 'college', 'academic'].map((lvl) => (
                  <div
                    key={lvl}
                    className={`rounded-xs transition-all ${
                      report.checks.readingLevel.level === lvl ? 'bg-blue-500' : 'bg-slate-850'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">{report.checks.readingLevel.details}</p>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400 font-mono">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                Avg Sentence: <b>{report.checks.readingLevel.averageSentenceLength} words</b>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                Avg Syllables: <b>{report.checks.readingLevel.averageSyllablesPerWord} / word</b>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Grammar Quality */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BookmarkCheck size={18} className="text-purple-400" />
              <h3 className="text-sm font-bold text-white">Grammar Quality</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-800">
              ~{report.checks.grammarQuality.errorCount} Issues
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">{report.checks.grammarQuality.details}</p>

            {/* Sample Errors List */}
            {report.checks.grammarQuality.sampleErrors &&
            report.checks.grammarQuality.sampleErrors.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">Sample Corrections:</span>
                {report.checks.grammarQuality.sampleErrors.slice(0, 3).map((err, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px]"
                  >
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>{err.chapter || 'Manuscript'}</span>
                    </div>
                    <div className="text-rose-400 line-through">"{err.text}"</div>
                    <div className="text-emerald-400 font-medium">→ "{err.suggestion}"</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>No major syntax errors identified.</span>
              </div>
            )}

            <p className="text-[10px] text-slate-500 italic">
              ℹ️ Grammar check is AI-estimated, not a professional proofreading service.
            </p>
          </div>
        </div>

        {/* Card 4: KDP Policy Compliance */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Amazon KDP Compliance</h3>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                report.checks.kdpPolicyCompliance.passed
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-rose-950 text-rose-300 border-rose-800'
              }`}
            >
              {report.checks.kdpPolicyCompliance.passed ? 'COMPLIANT' : 'FLAGGED'}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              {report.checks.kdpPolicyCompliance.details}
            </p>

            {/* Policy Areas Checklist */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {report.checks.kdpPolicyCompliance.policyAreas.map((area, i) => (
                <div
                  key={i}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-[11px]"
                >
                  {area.status === 'clear' ? (
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-rose-400 shrink-0" />
                  )}
                  <span className="text-slate-300 truncate">{area.area}</span>
                </div>
              ))}
            </div>

            {report.checks.kdpPolicyCompliance.flaggedSections &&
              report.checks.kdpPolicyCompliance.flaggedSections.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 space-y-1 text-xs text-rose-300">
                  <span className="font-bold block">Flagged Content Notice:</span>
                  {report.checks.kdpPolicyCompliance.flaggedSections.map((f, idx) => (
                    <div key={idx} className="text-[11px]">
                      <b>{f.chapter}:</b> {f.reason}
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        {/* Card 5: Plagiarism Risk */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white">Originality &amp; Plagiarism Risk</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
              {report.checks.plagiarismRisk.riskLevel} Risk
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">{report.checks.plagiarismRisk.details}</p>

            {/* Prominent Mandatory Disclaimer */}
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/50 space-y-1 text-xs text-amber-200">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <ShieldAlert size={14} />
                <span>Originality Risk Advisory</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/90">
                ⚠️ This is NOT a formal plagiarism detector. AI cannot verify DMCA copyright clearance.
                Always run your manuscript through Copyscape or Turnitin prior to publication.
              </p>
            </div>
          </div>
        </div>

        {/* Card 6: Genre Consistency */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" />
              <h3 className="text-sm font-bold text-white">Genre Consistency</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-800">
              {report.checks.genreConsistency.consistencyScore}% Match
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Declared: <b className="text-white">{report.checks.genreConsistency.expectedGenre}</b>
              </span>
              <span>
                Detected: <b className="text-purple-300">{report.checks.genreConsistency.detectedGenre}</b>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">{report.checks.genreConsistency.details}</p>

            {report.checks.genreConsistency.inconsistentChapters &&
              report.checks.genreConsistency.inconsistentChapters.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400">
                    Chapters with Tone Shift:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {report.checks.genreConsistency.inconsistentChapters.map((c, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Card 7: Content Completeness */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Publishing Completeness</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
              {report.checks.contentCompleteness.score}/100
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              {report.checks.contentCompleteness.details}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                {report.checks.contentCompleteness.hasCopyrightPage ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : (
                  <AlertTriangle size={14} className="text-amber-400" />
                )}
                <span>Copyright Page</span>
              </div>

              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                {report.checks.contentCompleteness.hasTableOfContents ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : (
                  <AlertTriangle size={14} className="text-amber-400" />
                )}
                <span>Table of Contents</span>
              </div>

              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                {report.checks.contentCompleteness.hasAuthorBio ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : (
                  <AlertTriangle size={14} className="text-amber-400" />
                )}
                <span>Author Biography</span>
              </div>

              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                {report.checks.contentCompleteness.frontMatterComplete ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : (
                  <AlertTriangle size={14} className="text-amber-400" />
                )}
                <span>Front Matter Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 8: Structure & Formatting */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Structure &amp; Formatting</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800">
              {report.checks.formatting.score}/100
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">{report.checks.formatting.details}</p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Empty Chapters (0 words):</span>
                <span className="font-mono font-bold text-white">
                  {report.checks.formatting.emptyChapters.length}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Short Chapters (&lt;200 words):</span>
                <span className="font-mono font-bold text-white">
                  {report.checks.formatting.veryShortChapters.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Action Items Checklist */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Priority Action Items</h3>
            <p className="text-xs text-slate-400">
              Recommended edits before exporting or publishing to Amazon KDP
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Fix in Book Studio</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Required Fixes */}
          {requiredFixes.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <XCircle size={14} />
                <span>Required Fixes ({requiredFixes.length})</span>
              </span>
              <div className="space-y-1.5">
                {requiredFixes.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Improvements */}
          {recommendedFixes.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                <span>Recommended Improvements ({recommendedFixes.length})</span>
              </span>
              <div className="space-y-1.5">
                {recommendedFixes.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Enhancements */}
          {optionalImprovements.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Info size={14} />
                <span>Optional Enhancements ({optionalImprovements.length})</span>
              </span>
              <div className="space-y-1.5">
                {optionalImprovements.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {requiredFixes.length === 0 && recommendedFixes.length === 0 && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>Great job! No critical or recommended action items found. Your book is ready for export!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
