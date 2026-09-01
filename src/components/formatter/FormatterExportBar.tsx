import React, { useState } from 'react';
import {
  ContentBlock,
  KdpFormatSettings,
  FormatterStats,
} from '../../types/formatter';
import { downloadDocxFile } from '../../utils/generateDocx';
import { downloadPdfFile } from '../../utils/generatePdf';
import { generateMetadataClipboardString } from '../../utils/calculateStats';
import { useToastStore } from '../../lib/toastStore';
import {
  Download,
  FileDown,
  Copy,
  Check,
  Loader2,
  FileText,
  Sparkles,
} from 'lucide-react';

interface FormatterExportBarProps {
  blocks: ContentBlock[];
  settings: KdpFormatSettings;
  stats: FormatterStats;
  disabled: boolean;
}

export const FormatterExportBar: React.FC<FormatterExportBarProps> = ({
  blocks,
  settings,
  stats,
  disabled,
}) => {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { addToast } = useToastStore();

  const handleDownloadDocx = async () => {
    if (disabled || blocks.length === 0) return;
    setIsExportingDocx(true);

    try {
      await downloadDocxFile(blocks, settings);
      addToast({
        type: 'success',
        title: 'DOCX Generated Successfully',
        message: `Your KDP-ready file (${settings.trimSize}, ${settings.font}) has been downloaded.`,
      });
    } catch (err: any) {
      console.error('DOCX Generation Error:', err);
      addToast({
        type: 'error',
        title: 'DOCX Export Failed',
        message: err?.message || 'Failed to generate Word document.',
      });
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (disabled || blocks.length === 0) return;
    setIsExportingPdf(true);
    try {
      await downloadPdfFile(blocks, settings);
      addToast({
        type: 'success',
        title: 'PDF Generated Successfully',
        message: `Your KDP-ready PDF (${settings.trimSize}, Times-Roman) has been downloaded.`,
      });
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      addToast({
        type: 'error',
        title: 'PDF Export Failed',
        message: err?.message || 'Failed to generate PDF document.',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyMetadata = async () => {
    if (disabled) return;
    try {
      const text = generateMetadataClipboardString(settings, stats);
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      addToast({
        type: 'success',
        title: 'Metadata Copied',
        message: 'KDP Title, Subtitle, Word Count, and Estimated Pages copied to clipboard.',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      addToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Could not access clipboard.',
      });
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Left Info Description */}
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <Sparkles size={16} className="text-purple-600 shrink-0" />
        <span>
          Generates a 100% KDP-compliant DOCX with mirror margins ({settings.margins.inside}" inside, {settings.margins.outside}" outside).
        </span>
      </div>

      {/* Right Export Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
        {/* Copy Metadata Button */}
        <button
          type="button"
          onClick={handleCopyMetadata}
          disabled={disabled}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-purple-300 bg-white hover:bg-purple-50/50 text-slate-700 hover:text-purple-900 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 shadow-2xs"
        >
          {isCopied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
          <span>{isCopied ? 'Copied!' : 'Copy Metadata'}</span>
        </button>

        {/* Download PDF Button */}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={disabled || isExportingPdf}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
        >
          {isExportingPdf ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <FileDown size={15} />
              <span>Download PDF</span>
            </>
          )}
        </button>

        {/* Download DOCX Primary Button */}
        <button
          type="button"
          id="btn-download-kdp-docx"
          onClick={handleDownloadDocx}
          disabled={disabled || isExportingDocx}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          {isExportingDocx ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Generating DOCX...</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>Download DOCX</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
