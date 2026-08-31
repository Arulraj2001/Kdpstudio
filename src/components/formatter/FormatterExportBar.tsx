import React, { useState } from 'react';
import {
  FileDown,
  FileType,
  Printer,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  BookCheck,
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Book, FormatterSettings, Margins, TrimDimensions } from '../../types/index';
import { ContentAuditReport } from '../../types/audit';
import { exportBookAsPdf } from '../../lib/pdfClientExport';
import { generateDocx } from '../../lib/docxExport';
import { generateBookHtml } from '../../lib/bookHtmlGenerator';
import { AuditPanel } from '../audit/AuditPanel';
import { FullAuditReportView } from '../audit/FullAuditReportView';

interface FormatterExportBarProps {
  book: Book | null;
  settings: FormatterSettings;
  margins: Margins;
  trimDimensions: TrimDimensions;
  estimatedPages: number;
}

export const FormatterExportBar: React.FC<FormatterExportBarProps> = ({
  book,
  settings,
  margins,
  trimDimensions,
  estimatedPages,
}) => {
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState('');
  const [isDocxExporting, setIsDocxExporting] = useState(false);
  const [exportSuccessInfo, setExportSuccessInfo] = useState<{
    filename: string;
    sizeFormatted: string;
    type: string;
  } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Pre-Export Audit States
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditReport, setAuditReport] = useState<ContentAuditReport | null>(null);
  const [isFullReportOpen, setIsFullReportOpen] = useState(false);

  const handleExportPdf = async () => {
    if (!book) return;
    setIsPdfExporting(true);
    setExportError(null);
    setExportSuccessInfo(null);

    try {
      const result = await exportBookAsPdf(
        book,
        settings,
        margins,
        trimDimensions,
        (msg) => setPdfStatusMessage(msg)
      );

      const sizeStr = result.sizeBytes
        ? `${(result.sizeBytes / 1024 / 1024).toFixed(2)} MB`
        : 'Print Document';

      setExportSuccessInfo({
        filename: result.filename,
        sizeFormatted: sizeStr,
        type: 'KDP Print-Ready PDF',
      });
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setExportError(err.message || 'Failed to generate PDF');
    } finally {
      setIsPdfExporting(false);
      setPdfStatusMessage('');
    }
  };

  const handleExportDocx = async () => {
    if (!book) return;
    setIsDocxExporting(true);
    setExportError(null);
    setExportSuccessInfo(null);

    try {
      const blob = await generateDocx(book, settings, margins, trimDimensions);
      const filename = `${book.title ? book.title.toLowerCase().replace(/[^a-z0-9]/gi, '_') : 'manuscript'}.docx`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccessInfo({
        filename,
        sizeFormatted: `${(blob.size / 1024).toFixed(1)} KB`,
        type: 'Word (.docx) Manuscript',
      });
    } catch (err: any) {
      console.error('DOCX export error:', err);
      setExportError(err.message || 'Failed to generate Word document');
    } finally {
      setIsDocxExporting(false);
    }
  };

  const handleOpenPrintPreview = () => {
    if (!book) return;
    const htmlContent = generateBookHtml(book, settings, margins, trimDimensions);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  };

  return (
    <div className="space-y-3">
      {/* Success Notification */}
      {exportSuccessInfo && (
        <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-between text-xs text-green-800 dark:text-green-300 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <span>
              <strong>{exportSuccessInfo.type}</strong> generated successfully! (
              {exportSuccessInfo.filename} — {exportSuccessInfo.sizeFormatted})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setExportSuccessInfo(null)}
            className="text-green-600 hover:text-green-800 dark:text-green-400 font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Notification */}
      {exportError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* Pre-Export Audit Prompt Section */}
      {book && (
        <>
          {!auditReport ? (
            <div className="p-3.5 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-slate-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-2.5 text-slate-800">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <span className="leading-relaxed">
                  <b className="text-indigo-950 font-bold">💡 Pre-Export Quality Check:</b>{' '}
                  <span className="text-slate-700 font-medium">Run a content audit before exporting to catch potential KDP policy flags &amp; formatting gaps.</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 shadow-xs transition-colors cursor-pointer"
              >
                Run Quick Audit
              </button>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm text-white">
              <div className="flex items-center gap-2.5">
                {auditReport.overallScore >= 80 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="text-white font-semibold">
                  {auditReport.overallScore >= 80
                    ? `✅ Last audit passed (${auditReport.overallScore}/100) — ready for KDP export`
                    : `⚠️ Issues found in last audit (${auditReport.overallScore}/100)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFullReportOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  View Audit Report
                </button>
                <button
                  type="button"
                  onClick={() => setIsAuditOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs ml-1 cursor-pointer transition-colors"
                >
                  Re-Run
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Bottom Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
            <BookCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              Ready for Amazon KDP Paperback Upload
            </div>
            <div className="text-xs text-slate-500">
              Formatted according to Amazon KDP bleed, gutter, and safety margin standards.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          {/* Print Preview In New Tab */}
          <button
            type="button"
            id="btn-print-preview"
            onClick={handleOpenPrintPreview}
            disabled={!book}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs"
            title="Open HTML print view in new browser tab"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Preview</span>
          </button>

          {/* Export as DOCX */}
          <button
            type="button"
            id="btn-export-docx"
            onClick={handleExportDocx}
            disabled={!book || isDocxExporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors shadow-2xs"
          >
            {isDocxExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Building .docx...</span>
              </>
            ) : (
              <>
                <FileType className="w-3.5 h-3.5" />
                <span>Export as DOCX</span>
              </>
            )}
          </button>

          {/* Export as PDF */}
          <button
            type="button"
            id="btn-export-pdf"
            onClick={handleExportPdf}
            disabled={!book || isPdfExporting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm disabled:opacity-60 transition-all cursor-pointer"
          >
            {isPdfExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{pdfStatusMessage || 'Generating your PDF...'}</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Export as PDF (KDP Interior)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Audit Panel Drawer */}
      {book && (
        <AuditPanel
          book={book}
          isOpen={isAuditOpen}
          onClose={() => setIsAuditOpen(false)}
          onViewFullReport={(rep) => {
            setAuditReport(rep);
            setIsAuditOpen(false);
            setIsFullReportOpen(true);
          }}
        />
      )}

      {/* Full Page Audit Report Modal */}
      {book && auditReport && isFullReportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto p-4 sm:p-8 animate-fade-in">
          <FullAuditReportView
            report={auditReport}
            book={book}
            onBack={() => setIsFullReportOpen(false)}
            onRerunAudit={() => {
              setIsFullReportOpen(false);
              setIsAuditOpen(true);
            }}
          />
        </div>
      )}
    </div>
  );
};
