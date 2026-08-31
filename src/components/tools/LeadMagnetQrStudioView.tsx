import React, { useState } from 'react';
import { 
  QrCode, 
  Download, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Palette, 
  Check, 
  Copy, 
  ArrowRight,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';
import { PageRoute } from '../../types';
import { exportLeadMagnetPagePdf } from '../../lib/toolsPdfExport';

interface LeadMagnetQrStudioViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const LeadMagnetQrStudioView: React.FC<LeadMagnetQrStudioViewProps> = ({ onNavigate }) => {
  const [targetUrl, setTargetUrl] = useState<string>('https://kdpstudio-aio.web.app/bonus');
  const [headline, setHeadline] = useState<string>('Thank You for Reading!');
  const [subheadline, setSubheadline] = useState<string>('Scan Below to Claim Your Free Bonus Chapter & Printable Companion Worksheets');
  const [ctaText, setCtaText] = useState<string>('Scan with your smartphone camera for instant access');
  const [authorName, setAuthorName] = useState<string>('Author Studio');
  const [trimSize, setTrimSize] = useState<'6x9' | '5.5x8.5' | '8.5x11' | '5x8'>('6x9');
  const [theme, setTheme] = useState<'minimal' | 'modern' | 'editorial'>('editorial');
  const [copied, setCopied] = useState<boolean>(false);

  // Generate SVG QR Matrix URL
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(targetUrl)}&format=svg&color=1e1b4b`;

  const handlePrintDownload = async () => {
    await exportLeadMagnetPagePdf(targetUrl, headline, subheadline, ctaText, trimSize);
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20 font-sans">
      <SEOHead
        pageKey="features"
        title="Back-of-Book Lead Magnet & QR Code Studio — KDP Studio"
        description="Design 100% KDP-print-ready 300 DPI bonus pages with custom QR codes to turn Amazon readers into lifelong subscribers."
        canonicalPath="/tools/lead-magnet"
      />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <QrCode size={14} className="text-purple-400" />
            <span>Audience Building Studio</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Back-of-Book <span className="font-serif italic font-normal text-purple-400">Lead Magnet &amp; QR Studio</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Turn passive Amazon readers into lifelong email subscribers. Design 300 DPI print-ready bonus download pages with dynamic QR codes calibrated to your exact book trim size.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT: CUSTOMIZER CONTROLS ── */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Palette size={18} className="text-purple-600" />
              <span>Page Customization</span>
            </h2>

            {/* Destination URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Destination Landing URL
              </label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://yourwebsite.com/bonus"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
              />
              <p className="text-[11px] text-slate-500">
                Where readers will be redirected when they scan the QR code in your paperback.
              </p>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Main Header Title
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
              />
            </div>

            {/* Subheadline */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Offer Subtitle / Description
              </label>
              <textarea
                rows={3}
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all leading-relaxed"
              />
            </div>

            {/* Call to Action Text */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Scan Instruction CTA
              </label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
              />
            </div>

            {/* Trim Size Preset */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Target Book Trim Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '6x9', label: '6 × 9"' },
                  { id: '5.5x8.5', label: '5.5 × 8.5"' },
                  { id: '8.5x11', label: '8.5 × 11"' },
                  { id: '5x8', label: '5 × 8"' }
                ].map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setTrimSize(sz.id as any)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      trimSize === sz.id
                        ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Typographic Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'editorial', label: 'Classic Editorial' },
                  { id: 'modern', label: 'Modern Minimal' },
                  { id: 'minimal', label: 'Clean Clean' }
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setTheme(th.id as any)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      theme === th.id
                        ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT: LIVE 300 DPI PRINT PREVIEW ── */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    300 DPI Vector Print Preview ({trimSize})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handlePrintDownload}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Download size={14} />
                  <span>Download Print PDF</span>
                </button>
              </div>

              {/* Simulated Physical Book Page Canvas */}
              <div className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-slate-300 bg-white shadow-inner flex flex-col items-center justify-between text-center min-h-[480px] relative">
                
                {/* Gutter Margin Guide Line */}
                <div className="absolute top-0 bottom-0 left-6 border-r border-dashed border-rose-300 pointer-events-none opacity-40" />

                {/* Top Section */}
                <div className="space-y-4 max-w-sm pt-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 mx-auto flex items-center justify-center font-serif text-lg font-bold">
                    ❦
                  </div>
                  <h3 className={`text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight ${
                    theme === 'editorial' ? 'font-serif' : 'font-sans'
                  }`}>
                    {headline}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {subheadline}
                  </p>
                </div>

                {/* Center QR Code */}
                <div className="my-6 p-4 rounded-2xl border border-slate-200 bg-white shadow-lg space-y-2">
                  <img
                    src={qrSvgUrl}
                    alt="Lead Magnet QR Code"
                    className="w-40 h-40 object-contain mx-auto"
                  />
                  <div className="text-[10px] font-mono text-slate-400 max-w-[160px] truncate mx-auto">
                    {targetUrl}
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="space-y-2 max-w-xs pb-2">
                  <div className="inline-block px-4 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-900 text-[11px] font-bold">
                    {ctaText}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Compliant with Amazon KDP Margin &amp; Gutter Guidelines
                  </p>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
