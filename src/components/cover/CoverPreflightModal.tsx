import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Barcode,
  X,
  Plus,
  Info,
  ExternalLink,
} from 'lucide-react';
import { generateIsbnBarcodeSvg, runKdpCoverPreflight, KdpPreflightReport } from '../../lib/kdpBarcode';

interface CoverPreflightModalProps {
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
  hasSpineText: boolean;
  onAddBarcodeToCanvas: (svgString: string) => void;
}

export const CoverPreflightModal: React.FC<CoverPreflightModalProps> = ({
  isOpen,
  onClose,
  coverDimensions,
  hasSpineText,
  onAddBarcodeToCanvas,
}) => {
  const [isbnInput, setIsbnInput] = useState('9781234567890');
  const [activeTab, setActiveTab] = useState<'audit' | 'barcode'>('audit');

  if (!isOpen) return null;

  const report: KdpPreflightReport = runKdpCoverPreflight({
    pageCount: coverDimensions.pageCount,
    spineWidth: coverDimensions.spineWidth,
    trimSize: coverDimensions.trimSize,
    hasSpineText,
    paperType: coverDimensions.paperType,
    totalWidth: coverDimensions.totalWidth,
    totalHeight: coverDimensions.totalHeight,
  });

  const barcodeSvg = generateIsbnBarcodeSvg(isbnInput);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 text-slate-900 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">KDP Print Compliance & ISBN Generator</h2>
              <p className="text-xs text-slate-500 font-medium">
                Verify Amazon KDP requirements & generate 100% compliant vector barcodes
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Pre-Flight Quality Audit</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('barcode')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'barcode'
                ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>ISBN-13 Barcode Generator</span>
          </button>
        </div>

        {/* Tab 1: Pre-Flight Quality Audit */}
        {activeTab === 'audit' ? (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Status Summary Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 ${
                report.passed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-red-50 border-red-200 text-red-950'
              }`}
            >
              {report.passed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 shrink-0" />
              )}
              <div>
                <h4 className="text-sm font-bold">
                  {report.passed
                    ? '100% Amazon KDP Print Compliant'
                    : 'Action Required Before KDP Upload'}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {report.passed
                    ? 'All dimensions, bleeds, and spine specifications meet Amazon Paperback standards.'
                    : 'Review the critical rule violations below before submitting your cover.'}
                </p>
              </div>
            </div>

            {/* Critical Errors */}
            {report.errors.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase text-red-600 tracking-wider">
                  Critical Violations ({report.errors.length})
                </div>
                {report.errors.map((err, i) => (
                  <div
                    key={i}
                    className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {report.warnings.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase text-amber-600 tracking-wider">
                  Recommendations & Warnings ({report.warnings.length})
                </div>
                {report.warnings.map((warn, i) => (
                  <div
                    key={i}
                    className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2"
                  >
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Specification Matrix */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Calculated Amazon KDP Specifications
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span>Page Count:</span>
                  <span className="font-mono font-bold text-slate-900">{coverDimensions.pageCount} pages</span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span>Spine Text Allowed:</span>
                  <span className={`font-bold ${report.specs.spineTextAllowed ? 'text-emerald-600' : 'text-red-600'}`}>
                    {report.specs.spineTextAllowed ? 'Yes (≥ 79p)' : 'No (< 79p)'}
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span>Spine Width:</span>
                  <span className="font-mono font-bold text-purple-700">{coverDimensions.spineWidth}"</span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span>Bleed Allowance:</span>
                  <span className="font-mono font-bold text-slate-900">0.125" all sides</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: ISBN-13 Barcode Generator */
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enter 13-Digit ISBN (or 10-Digit)
              </label>
              <input
                type="text"
                value={isbnInput}
                onChange={(e) => setIsbnInput(e.target.value)}
                placeholder="e.g. 9781234567890"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Automatically calculates the EAN-13 check digit and formats standard quiet zones.
              </p>
            </div>

            {/* Live Barcode Vector Preview */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
              <div
                className="shadow-sm rounded-lg overflow-hidden bg-white p-2 border border-slate-200 max-w-[280px]"
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />
              <button
                type="button"
                id="btn-add-isbn-barcode"
                onClick={() => {
                  onAddBarcodeToCanvas(barcodeSvg);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Place Barcode on Back Cover (2" × 1.2")</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
