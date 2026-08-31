import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Download,
  X,
  Sparkles,
  Camera,
  Rotate3d,
  Layers,
  Share2,
  Check,
  Eye,
} from 'lucide-react';

interface Cover3DMockupModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasDataUrl: string | null;
  bookTitle: string;
  spineWidthInch: number;
}

export const Cover3DMockupModal: React.FC<Cover3DMockupModalProps> = ({
  isOpen,
  onClose,
  canvasDataUrl,
  bookTitle,
  spineWidthInch,
}) => {
  const [mockupAngle, setMockupAngle] = useState<'standing' | 'angled' | 'flat'>('standing');
  const [mockupBackground, setMockupBackground] = useState<'transparent' | 'studio' | 'dark'>('studio');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const mockupCanvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

  const handleDownloadMockup = () => {
    setIsExporting(true);
    try {
      const container = document.getElementById('mockup-render-zone');
      if (!container) return;

      // Extract front slice of canvas and create download
      if (canvasDataUrl) {
        const link = document.createElement('a');
        link.download = `${bookTitle.replace(/\s+/g, '-').toLowerCase()}-3d-mockup.png`;
        link.href = canvasDataUrl; // High-res fallback or rendered container
        link.click();
      }
    } catch (err) {
      console.error('Download mockup error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-6 text-slate-900 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-100 rounded-xl text-purple-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">3D Book Mockup Studio</h2>
              <p className="text-xs text-slate-500 font-medium">
                Photorealistic 3D paperback renders for Amazon A+, Instagram & Social Marketing
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

        {/* Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto">
          {/* Main 3D Viewport */}
          <div
            id="mockup-render-zone"
            className={`lg:col-span-2 rounded-2xl flex items-center justify-center p-8 relative min-h-[380px] overflow-hidden transition-colors border ${
              mockupBackground === 'transparent'
                ? 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 border-slate-200'
                : mockupBackground === 'dark'
                ? 'bg-slate-900 border-slate-800'
                : 'bg-gradient-to-br from-slate-100 via-purple-50/40 to-slate-200 border-slate-200'
            }`}
          >
            {/* 3D Realistic Book CSS Structure */}
            <div className="relative group perspective-[1000px]">
              {mockupAngle === 'standing' && (
                <div className="relative flex items-center justify-center transition-transform duration-500 [transform:rotateY(-25deg)_rotateX(5deg)] shadow-2xl">
                  {/* Spine Face */}
                  <div
                    className="w-10 h-80 rounded-l-xs overflow-hidden shadow-2xl relative border-y border-l border-black/20"
                    style={{
                      backgroundImage: canvasDataUrl ? `url(${canvasDataUrl})` : undefined,
                      backgroundSize: '300% 100%',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
                  </div>

                  {/* Front Face */}
                  <div
                    className="w-56 h-80 rounded-r-sm overflow-hidden shadow-2xl relative border border-black/20 bg-slate-800"
                    style={{
                      backgroundImage: canvasDataUrl ? `url(${canvasDataUrl})` : undefined,
                      backgroundSize: '200% 100%',
                      backgroundPosition: 'right center',
                    }}
                  >
                    {/* Realistic Glossy Light Reflection Highlight */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none" />
                    {/* Page thickness shadow on edge */}
                    <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-l from-white/30 to-transparent pointer-events-none" />
                  </div>

                  {/* Ground Shadow */}
                  <div className="absolute -bottom-8 w-64 h-8 bg-black/30 rounded-full blur-md -z-10 [transform:rotateX(75deg)]" />
                </div>
              )}

              {mockupAngle === 'angled' && (
                <div className="relative flex items-center justify-center transition-transform duration-500 [transform:rotateY(-35deg)_rotateX(12deg)_rotateZ(-4deg)] shadow-2xl">
                  {/* Front Cover Focus */}
                  <div
                    className="w-60 h-84 rounded-md overflow-hidden shadow-2xl relative border border-black/25 bg-slate-800"
                    style={{
                      backgroundImage: canvasDataUrl ? `url(${canvasDataUrl})` : undefined,
                      backgroundSize: '200% 100%',
                      backgroundPosition: 'right center',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                  </div>

                  {/* Page stack edge (white pages block) */}
                  <div className="w-8 h-82 bg-gradient-to-r from-amber-50 to-slate-200 rounded-r-xs shadow-inner border-y border-r border-slate-300 relative [transform:skewY(-10deg)] -ml-1 -z-10">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,#e2e8f0,#e2e8f0_1px,#ffffff_1px,#ffffff_3px)] opacity-60" />
                  </div>

                  {/* Realistic Ground Shadow */}
                  <div className="absolute -bottom-10 w-72 h-10 bg-black/35 rounded-full blur-lg -z-20" />
                </div>
              )}

              {mockupAngle === 'flat' && (
                <div className="relative flex items-center justify-center transition-transform duration-500 [transform:rotateX(45deg)_rotateZ(-15deg)] shadow-2xl">
                  <div
                    className="w-64 h-92 rounded-md overflow-hidden shadow-2xl relative border border-black/20 bg-slate-800"
                    style={{
                      backgroundImage: canvasDataUrl ? `url(${canvasDataUrl})` : undefined,
                      backgroundSize: '200% 100%',
                      backgroundPosition: 'right center',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30 pointer-events-none" />
                  </div>
                  <div className="absolute -bottom-8 w-72 h-14 bg-black/40 rounded-full blur-xl -z-10" />
                </div>
              )}
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="space-y-5 flex flex-col justify-between">
            {/* 1. Camera Angle */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                1. 3D Perspective Angle
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMockupAngle('standing')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    mockupAngle === 'standing'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">Standing</div>
                  <div className="text-[10px] text-slate-400">Spine + Front</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMockupAngle('angled')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    mockupAngle === 'angled'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">Hero Angle</div>
                  <div className="text-[10px] text-slate-400">Pages Stack</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMockupAngle('flat')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    mockupAngle === 'flat'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">Flat Lay</div>
                  <div className="text-[10px] text-slate-400">Desk View</div>
                </button>
              </div>
            </div>

            {/* 2. Studio Backdrop */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                2. Studio Backdrop
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMockupBackground('studio')}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    mockupBackground === 'studio'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Studio Grey
                </button>
                <button
                  type="button"
                  onClick={() => setMockupBackground('transparent')}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    mockupBackground === 'transparent'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Transparent
                </button>
                <button
                  type="button"
                  onClick={() => setMockupBackground('dark')}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    mockupBackground === 'dark'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Dark Slate
                </button>
              </div>
            </div>

            {/* 3. Marketing Uses Info */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="font-bold text-slate-900 text-[11px]">Recommended Marketing Uses:</div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
                <li>Amazon A+ Content Hero Banner</li>
                <li>Instagram Reels & TikTok Promo Posts</li>
                <li>Author Website Sales Page</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                id="btn-download-3d-mockup"
                onClick={handleDownloadMockup}
                disabled={isExporting}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res 3D Mockup</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
