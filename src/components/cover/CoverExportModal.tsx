import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  X,
  Loader2,
} from 'lucide-react';

interface CoverExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverDimensions: {
    totalWidth: number;
    totalHeight: number;
    spineWidth: number;
    trimSize: string;
    pageCount: number;
    paperType: string;
  };
  onExport: (format: 'pdf' | 'jpg') => Promise<void>;
  warnings?: string[];
}

export const CoverExportModal: React.FC<CoverExportModalProps> = ({
  isOpen,
  onClose,
  coverDimensions,
  onExport,
  warnings = [],
}) => {
  const [format, setFormat] = useState<'pdf' | 'jpg'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const widthPx = Math.round(coverDimensions.totalWidth * 300);
  const heightPx = Math.round(coverDimensions.totalHeight * 300);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      await onExport(format);
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-6 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-100 rounded-xl text-purple-700">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Export KDP Print Cover</h2>
              <p className="text-xs text-slate-500 font-medium">
                High-Resolution 300 DPI submission-ready file.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quality Check / Pre-flight Panel */}
        <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200 space-y-2.5 text-xs shadow-2xs">
          <div className="font-bold text-purple-950 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <FileCheck className="w-4 h-4 text-purple-600" />
            <span>KDP Quality & Pre-Flight Validation</span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Resolution</span>
              </span>
              <span className="font-mono font-bold text-slate-900">300 DPI</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>KDP Dimensions</span>
              </span>
              <span className="font-mono font-bold text-slate-900">
                {coverDimensions.totalWidth}" × {coverDimensions.totalHeight}" ({widthPx} × {heightPx} px)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Spine Width</span>
              </span>
              <span className="font-mono font-bold text-purple-700">
                {coverDimensions.spineWidth}" ({coverDimensions.pageCount} pages, {coverDimensions.paperType})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bleed Allowance</span>
              </span>
              <span className="font-mono font-bold text-slate-900">0.125" included</span>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="pt-2 border-t border-amber-200 space-y-1">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-1.5 text-amber-800 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                format === 'pdf'
                  ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold ring-2 ring-purple-600/30 shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold">Print PDF</span>
                <span className="px-1.5 py-0.5 bg-purple-200 text-purple-800 text-[10px] font-mono font-bold rounded">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal">
                Standard format for Amazon KDP Paperback submission.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFormat('jpg')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                format === 'jpg'
                  ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold ring-2 ring-purple-600/30 shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold">High-Res JPG</span>
                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-mono font-bold rounded">
                  300 DPI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal">
                Lossless high-res raster graphic for archiving and review.
              </p>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-download-cover-file"
            onClick={handleDownload}
            disabled={isExporting}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting Cover...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
