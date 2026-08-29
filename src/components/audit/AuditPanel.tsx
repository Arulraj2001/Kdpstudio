/**
 * KDP Studio — Content Audit Drawer Panel
 * Phase 16C
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  BookOpen,
  Layers,
  FileText,
  BookmarkCheck,
  Loader2,
  Clock,
  Zap,
} from 'lucide-react';
import { ContentAuditReport, AuditCheck } from '../../types/audit';
import { Book } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { useToastStore } from '../../lib/toastStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { compileBasicReport } from '../../lib/audit/localChecks';

interface AuditPanelProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onViewFullReport: (report: ContentAuditReport) => void;
}

const RUNNING_STEPS = [
  'Counting words and structure...',
  'Checking completeness & metadata...',
  'Analyzing syntax & readability...',
  'Calculating Flesch-Kincaid reading level...',
  'Checking Amazon KDP policy compliance...',
  'Verifying originality & genre consistency...',
];

export const AuditPanel: React.FC<AuditPanelProps> = ({
  book,
  isOpen,
  onClose,
  onViewFullReport,
}) => {
  const user = useAuthStore((state) => state.user);
  const userPlan = user?.plan || 'free';
  const openCheckout = useCheckoutStore((state) => state.open);

  const isFreePlan = userPlan === 'free';
  const isProOrAbove = userPlan === 'pro' || userPlan === 'agency' || userPlan === 'lifetime';

  const [auditType, setAuditType] = useState<'basic' | 'full'>(() => (isProOrAbove ? 'full' : 'basic'));
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [report, setReport] = useState<ContentAuditReport | null>(null);
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);

  // Cycling progress step text
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setStepIndex((prev) => (prev + 1) % RUNNING_STEPS.length);
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!isOpen) return null;

  const handleRunAudit = async () => {
    if (isFreePlan) {
      openCheckout('starter');
      return;
    }

    setIsRunning(true);
    setStepIndex(0);

    try {
      if (auditType === 'basic' || !isProOrAbove) {
        // Run locally with slight artificial delay for fluid UX
        await new Promise((r) => setTimeout(r, 600));
        const basicReport = compileBasicReport(book, user?.uid || 'user');
        setReport(basicReport);
        useToastStore.getState().addToast({
          message: 'Basic Content Audit completed!',
          type: 'success',
        });
      } else {
        // Run full AI Audit API
        const res = await fetch('/api/audit/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.uid || '',
          },
          body: JSON.stringify({
            bookId: book.id,
            auditType: 'full',
            book,
          }),
        });

        const data = await res.json();
        if (data.report) {
          setReport(data.report);
          useToastStore.getState().addToast({
            message: 'Full AI Content Audit completed!',
            type: 'success',
          });
        } else {
          throw new Error(data.error || 'Audit generation failed');
        }
      }
    } catch (err: any) {
      console.warn('Audit error, running local fallback:', err);
      const fallbackReport = compileBasicReport(book, user?.uid || 'user');
      setReport(fallbackReport);
      useToastStore.getState().addToast({
        message: 'Completed local audit check',
        type: 'info',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500 bg-emerald-950/40';
    if (score >= 60) return 'text-blue-400 border-blue-500 bg-blue-950/40';
    if (score >= 40) return 'text-amber-400 border-amber-500 bg-amber-950/40';
    return 'text-rose-400 border-rose-500 bg-rose-950/40';
  };

  const getScoreBadgeText = (score: number) => {
    if (score >= 80) return 'KDP Ready';
    if (score >= 60) return 'Minor Issues';
    if (score >= 40) return 'Needs Work';
    return 'Major Issues';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-84 sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-slide-left overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800/60 text-purple-400 flex items-center justify-center">
              <Search size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Content Audit</h3>
              <p className="text-[11px] text-slate-400">Quality &amp; KDP Compliance Check</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Free Plan Lock Gate */}
        {isFreePlan ? (
          <div className="p-6 text-center flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-purple-950/80 border border-purple-800/60 text-purple-400 flex items-center justify-center">
              <Lock size={26} />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Unlock Content Audit</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Catch formatting issues, reading grade level, and KDP policy flags before submitting
                to Amazon.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                openCheckout('starter');
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Upgrade to Starter ($9/mo)</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Top Config & Trigger */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/30 space-y-3 shrink-0">
              {/* Pro Audit Mode Selector */}
              {isProOrAbove && (
                <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setAuditType('basic')}
                    className={`py-1.5 rounded-lg font-semibold transition-all ${
                      auditType === 'basic'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Basic (Local)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditType('full')}
                    className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                      auditType === 'full'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    <Sparkles size={12} />
                    <span>Full AI Audit</span>
                  </button>
                </div>
              )}

              {/* Run Audit Button */}
              <button
                type="button"
                onClick={handleRunAudit}
                disabled={isRunning}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Analyzing Manuscript...</span>
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    <span>{report ? 'Re-Run Audit' : 'Run Content Audit'}</span>
                  </>
                )}
              </button>

              {auditType === 'full' && isProOrAbove && !isRunning && !report && (
                <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                  <Zap size={11} className="text-purple-400" />
                  <span>Uses 1 AI generation token from quota</span>
                </p>
              )}
            </div>

            {/* Scrollable Results Area */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {isRunning ? (
                <div className="py-16 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-900/40 animate-ping opacity-25" />
                    <div className="w-16 h-16 rounded-full border-4 border-t-purple-500 border-r-purple-500 border-b-slate-800 border-l-slate-800 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">Running Content Analysis</p>
                    <p className="text-[11px] text-purple-400 font-mono animate-pulse">
                      {RUNNING_STEPS[stepIndex]}
                    </p>
                  </div>
                </div>
              ) : !report ? (
                <div className="py-12 text-center space-y-4 text-slate-400">
                  <div className="w-14 h-14 rounded-3xl bg-slate-950 border border-slate-800 text-slate-600 flex items-center justify-center mx-auto">
                    <ShieldCheck size={28} />
                  </div>
                  <div className="space-y-1 max-w-[240px] mx-auto">
                    <h4 className="text-xs font-bold text-slate-300">No Audit Performed Yet</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Run an audit to check reading grade, word counts, formatting, grammar quality,
                      and Amazon KDP compliance.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-scale-in">
                  {/* Overall Score Gauge Card */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Overall Quality Score</span>
                      <span className="font-mono text-slate-500">
                        {(report.processingTimeMs / 1000).toFixed(1)}s
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <div
                        className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-extrabold ${getScoreColor(
                          report.overallScore
                        )}`}
                      >
                        <span className="text-xl leading-none">{report.overallScore}</span>
                        <span className="text-[9px] uppercase tracking-wider mt-0.5">/100</span>
                      </div>

                      <div className="text-left space-y-0.5">
                        <span
                          className={`text-xs font-extrabold px-2 py-0.5 rounded-md border ${getScoreColor(
                            report.overallScore
                          )}`}
                        >
                          {getScoreBadgeText(report.overallScore)}
                        </span>
                        <p className="text-[11px] text-slate-400 font-semibold pt-1">
                          KDP Confidence: {report.kdpReadyConfidence}%
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed text-left border-t border-slate-900 pt-2.5">
                      {report.summary}
                    </p>
                  </div>

                  {/* Individual Check Rows List */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                      Audit Quality Breakdown
                    </span>

                    {/* Checks array mapping */}
                    {[
                      { key: 'wordCount', data: report.checks.wordCount, icon: BookOpen },
                      { key: 'completeness', data: report.checks.contentCompleteness, icon: CheckCircle2 },
                      { key: 'formatting', data: report.checks.formatting, icon: Layers },
                      { key: 'readingLevel', data: report.checks.readingLevel, icon: FileText },
                      { key: 'grammarQuality', data: report.checks.grammarQuality, icon: BookmarkCheck },
                      { key: 'kdpCompliance', data: report.checks.kdpPolicyCompliance, icon: ShieldCheck },
                      { key: 'plagiarism', data: report.checks.plagiarismRisk, icon: AlertTriangle },
                      { key: 'genre', data: report.checks.genreConsistency, icon: Sparkles },
                    ].map(({ key, data, icon: Icon }) => {
                      const isExpanded = expandedCheckId === key;
                      const isPass = data.severity === 'pass';
                      const isWarning = data.severity === 'warning';
                      const isFail = data.severity === 'fail';

                      return (
                        <div
                          key={key}
                          className="rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedCheckId(isExpanded ? null : key)}
                            className="w-full p-3 text-left flex items-center justify-between gap-2 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isPass && <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />}
                              {isWarning && <AlertTriangle size={15} className="text-amber-400 shrink-0" />}
                              {isFail && <XCircle size={15} className="text-rose-400 shrink-0" />}
                              {data.severity === 'info' && <Icon size={15} className="text-purple-400 shrink-0" />}

                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-white truncate">{data.name}</h5>
                                <p className="text-[10px] text-slate-400 truncate">{data.details}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {data.score !== null && (
                                <span className="font-mono text-[10px] text-slate-400 font-semibold">
                                  {data.score}/100
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronDown size={14} className="text-slate-500" />
                              ) : (
                                <ChevronRight size={14} className="text-slate-500" />
                              )}
                            </div>
                          </button>

                          {/* Expanded Details Panel */}
                          {isExpanded && (
                            <div className="p-3 bg-slate-900/60 border-t border-slate-850 space-y-2 text-xs text-slate-300">
                              <p className="text-[11px] leading-relaxed text-slate-400">{data.details}</p>

                              {data.suggestions && data.suggestions.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <span className="text-[10px] uppercase font-bold text-amber-400 block">
                                    Recommendations:
                                  </span>
                                  <ul className="space-y-1 text-[11px] text-slate-300 list-disc pl-4">
                                    {data.suggestions.map((s, i) => (
                                      <li key={i}>{s}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {data.affectedChapters && data.affectedChapters.length > 0 && (
                                <div className="pt-1">
                                  <span className="text-[10px] uppercase font-bold text-purple-400 block">
                                    Affected Chapters:
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {data.affectedChapters.map((c, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800"
                                      >
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* View Full Report CTA */}
                  <button
                    type="button"
                    onClick={() => onViewFullReport(report)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View Full Audit Report</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
