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
} from 'lucide-react';
import { Book, FormatterSettings, Margins, TrimDimensions } from '../../types/index';
import { exportBookAsPdf } from '../../lib/pdfClientExport';
import { generateDocx } from '../../lib/docxExport';
import { generateBookHtml } from '../../lib/bookHtmlGenerator';

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
      setExportError(err.message || 'Failed to export DOCX');
    } finally {
      setIsDocxExporting(false);
    }
  };

  const handleOpenPrintPreview = () => {
    if (!book) return;
    const fullHtml = generateBookHtml(book, settings, margins, trimDimensions);
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(fullHtml);
      win.document.close();
    }
  };

  return (
    <div className="space-y-3">
      {/* Success Notification Banner */}
      {exportSuccessInfo && (
        <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-between text-xs text-green-900 dark:text-green-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <span className="font-bold">{exportSuccessInfo.type} generated successfully!</span>
              <span className="text-green-700 dark:text-green-300 ml-2">
                ({exportSuccessInfo.filename} — {exportSuccessInfo.sizeFormatted}, ~{estimatedPages} pages)
              </span>
            </div>
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

      {/* Main Bottom Bar */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
            <BookCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              Ready for Amazon KDP Paperback Upload
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Formatted according to Amazon KDP bleed, gutter, and safety margin standards.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Print Preview In New Tab */}
          <button
            type="button"
            id="btn-print-preview"
            onClick={handleOpenPrintPreview}
            disabled={!book}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            title="Open HTML print view in new browser tab"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Print Preview</span>
          </button>

          {/* Export as DOCX */}
          <button
            type="button"
            id="btn-export-docx"
            onClick={handleExportDocx}
            disabled={!book || isDocxExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 disabled:opacity-50 transition-colors"
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
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-md disabled:opacity-60 transition-all cursor-pointer"
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
    </div>
  );
};
