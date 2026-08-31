import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Download,
  X,
  Sparkles,
  Layers,
  Rotate3d,
  Tablet,
  Check,
  Loader2,
} from 'lucide-react';

interface Cover3DMockupModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasDataUrl: string | null;
  bookTitle: string;
  spineWidthInch: number;
}

export type MockupStyle =
  | 'standing'
  | 'hero_angle'
  | 'hardcover'
  | 'floating'
  | 'duo_tablet'
  | 'flat_lay';

export type MockupBackdrop =
  | 'studio'
  | 'dark'
  | 'wood'
  | 'marble'
  | 'transparent';

export const Cover3DMockupModal: React.FC<Cover3DMockupModalProps> = ({
  isOpen,
  onClose,
  canvasDataUrl,
  bookTitle,
  spineWidthInch,
}) => {
  const [mockupStyle, setMockupStyle] = useState<MockupStyle>('standing');
  const [backdrop, setBackdrop] = useState<MockupBackdrop>('studio');
  const [isExporting, setIsExporting] = useState(false);
  const [renderedPreviewUrl, setRenderedPreviewUrl] = useState<string | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Re-render canvas whenever style, backdrop, or canvasDataUrl changes
  useEffect(() => {
    if (!isOpen || !canvasDataUrl) return;

    const fullImg = new Image();
    fullImg.crossOrigin = 'anonymous';
    fullImg.src = canvasDataUrl;
    fullImg.onload = () => {
      render3DMockup(fullImg);
    };
  }, [isOpen, canvasDataUrl, mockupStyle, backdrop]);

  const render3DMockup = (fullImg: HTMLImageElement) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const size = 1600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    // 1. Draw Background
    drawBackdrop(ctx, size, backdrop);

    // 2. Extract Slices from full wrap cover:
    // Full wrap is: [Back Cover] [Spine] [Front Cover]
    const fullW = fullImg.width;
    const fullH = fullImg.height;

    // Approximate slice ratios based on standard full wrap layout
    // Spine is centered, front cover is on the right
    const spineRatio = Math.max(0.04, Math.min(0.18, (spineWidthInch || 0.6) / 13.0));
    const coverRatio = (1 - spineRatio) / 2;

    const frontX = Math.round(fullW * (coverRatio + spineRatio));
    const frontW = Math.round(fullW * coverRatio);
    const spineX = Math.round(fullW * coverRatio);
    const spineW = Math.round(fullW * spineRatio);

    // 3. Render Selected 3D Mockup Preset
    switch (mockupStyle) {
      case 'standing':
        renderStandingPaperback(ctx, size, fullImg, frontX, frontW, spineX, spineW, fullH);
        break;
      case 'hero_angle':
        renderHeroAngle(ctx, size, fullImg, frontX, frontW, spineX, spineW, fullH);
        break;
      case 'hardcover':
        renderHardcover(ctx, size, fullImg, frontX, frontW, spineX, spineW, fullH);
        break;
      case 'floating':
        renderFloatingBook(ctx, size, fullImg, frontX, frontW, spineX, spineW, fullH);
        break;
      case 'duo_tablet':
        renderDuoTablet(ctx, size, fullImg, frontX, frontW, spineX, spineW, fullH);
        break;
      case 'flat_lay':
        renderFlatLay(ctx, size, fullImg, frontX, frontW, spineX, spineW, fullH);
        break;
      default:
        renderStandingPaperback(ctx, size, fullImg, frontX, frontW, spineX, spineW, fullH);
    }

    try {
      const dataUrl = canvas.toDataURL('image/png');
      setRenderedPreviewUrl(dataUrl);
    } catch (e) {
      console.error('Failed to capture mockup preview:', e);
    }
  };

  // ----------------------------------------------------
  // BACKDROP DRAWING
  // ----------------------------------------------------
  const drawBackdrop = (ctx: CanvasRenderingContext2D, size: number, bg: MockupBackdrop) => {
    if (bg === 'transparent') return;

    if (bg === 'studio') {
      const grad = ctx.createRadialGradient(size / 2, size * 0.45, size * 0.1, size / 2, size / 2, size * 0.7);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#f1f5f9');
      grad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    } else if (bg === 'dark') {
      const grad = ctx.createRadialGradient(size / 2, size * 0.45, size * 0.1, size / 2, size / 2, size * 0.8);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.6, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    } else if (bg === 'wood') {
      // Warm Oak Wood effect
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#78350f');
      grad.addColorStop(0.5, '#92400e');
      grad.addColorStop(1, '#451a03');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Wood plank lines
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 3;
      for (let y = 100; y < size; y += 120) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
      }
    } else if (bg === 'marble') {
      // Clean Luxury Marble
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(0.5, '#e2e8f0');
      grad.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Vein lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, size * 0.2);
      ctx.bezierCurveTo(size * 0.3, size * 0.4, size * 0.7, size * 0.1, size, size * 0.3);
      ctx.stroke();
    }
  };

  // ----------------------------------------------------
  // PRESET 1: STANDING PAPERBACK
  // ----------------------------------------------------
  const renderStandingPaperback = (
    ctx: CanvasRenderingContext2D,
    size: number,
    img: HTMLImageElement,
    fX: number,
    fW: number,
    sX: number,
    sW: number,
    fH: number
  ) => {
    const bookH = 880;
    const bookW = 580;
    const spineWidth = 90;
    const centerX = size / 2 + 30;
    const centerY = size / 2;

    // Floor Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX - 20, centerY + bookH / 2 + 40, bookW * 0.65, 45, -0.05, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.filter = 'blur(22px)';
    ctx.fill();
    ctx.restore();

    // 1. Draw 3D Spine
    ctx.save();
    ctx.translate(centerX - bookW / 2, centerY - bookH / 2 + 10);
    ctx.transform(1, 0.1, 0, 0.98, 0, 0);

    ctx.drawImage(img, sX, 0, sW, fH, -spineWidth, 0, spineWidth, bookH);

    // Spine shading
    const spineGrad = ctx.createLinearGradient(-spineWidth, 0, 0, 0);
    spineGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
    spineGrad.addColorStop(0.3, 'rgba(0,0,0,0.1)');
    spineGrad.addColorStop(0.9, 'rgba(255,255,255,0.15)');
    spineGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = spineGrad;
    ctx.fillRect(-spineWidth, 0, spineWidth, bookH);
    ctx.restore();

    // 2. Draw 3D Front Cover
    ctx.save();
    ctx.translate(centerX - bookW / 2, centerY - bookH / 2 + 10);
    ctx.transform(0.94, -0.06, 0, 0.96, 0, 0);

    // Rounded right corners on cover
    ctx.beginPath();
    ctx.roundRect(0, 0, bookW, bookH, [0, 8, 8, 0]);
    ctx.clip();

    ctx.drawImage(img, fX, 0, fW, fH, 0, 0, bookW, bookH);

    // Glossy Light Sheen Reflection
    const sheen = ctx.createLinearGradient(0, 0, bookW, bookH);
    sheen.addColorStop(0, 'rgba(255,255,255,0.25)');
    sheen.addColorStop(0.4, 'rgba(255,255,255,0.05)');
    sheen.addColorStop(0.7, 'rgba(0,0,0,0.05)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, bookW, bookH);

    // Right edge white pages thickness hint
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(bookW - 4, 0, 4, bookH);

    ctx.restore();
  };

  // ----------------------------------------------------
  // PRESET 2: HERO ANGLE (3/4 with Page Stack)
  // ----------------------------------------------------
  const renderHeroAngle = (
    ctx: CanvasRenderingContext2D,
    size: number,
    img: HTMLImageElement,
    fX: number,
    fW: number,
    sX: number,
    sW: number,
    fH: number
  ) => {
    const bookH = 860;
    const bookW = 600;
    const pagesDepth = 90;
    const centerX = size / 2 - 30;
    const centerY = size / 2;

    // Ambient Floor Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX + 60, centerY + bookH / 2 + 50, bookW * 0.7, 50, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.filter = 'blur(25px)';
    ctx.fill();
    ctx.restore();

    // 1. Draw Page Stack on Right
    ctx.save();
    ctx.translate(centerX + bookW / 2 - 20, centerY - bookH / 2 + 40);
    ctx.transform(0.8, -0.15, 0, 0.95, 0, 0);

    const pagesGrad = ctx.createLinearGradient(0, 0, pagesDepth, 0);
    pagesGrad.addColorStop(0, '#f1f5f9');
    pagesGrad.addColorStop(0.5, '#e2e8f0');
    pagesGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = pagesGrad;
    ctx.fillRect(0, 0, pagesDepth, bookH);

    // Individual page texture lines
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
    ctx.lineWidth = 1;
    for (let y = 8; y < bookH; y += 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(pagesDepth, y);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw Front Cover
    ctx.save();
    ctx.translate(centerX - bookW / 2, centerY - bookH / 2);
    ctx.transform(0.92, -0.08, 0, 0.96, 0, 0);

    ctx.beginPath();
    ctx.roundRect(0, 0, bookW, bookH, [2, 6, 6, 2]);
    ctx.clip();
    ctx.drawImage(img, fX, 0, fW, fH, 0, 0, bookW, bookH);

    // Diagonal Glass Highlight
    const sheen = ctx.createLinearGradient(0, 0, bookW, bookH);
    sheen.addColorStop(0, 'rgba(255,255,255,0.3)');
    sheen.addColorStop(0.35, 'rgba(255,255,255,0.08)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, bookW, bookH);
    ctx.restore();
  };

  // ----------------------------------------------------
  // PRESET 3: HARDCOVER EDITION
  // ----------------------------------------------------
  const renderHardcover = (
    ctx: CanvasRenderingContext2D,
    size: number,
    img: HTMLImageElement,
    fX: number,
    fW: number,
    sX: number,
    sW: number,
    fH: number
  ) => {
    const bookH = 900;
    const bookW = 600;
    const spineWidth = 100;
    const centerX = size / 2 + 20;
    const centerY = size / 2;

    // Heavy Hardcover Drop Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX - 10, centerY + bookH / 2 + 45, bookW * 0.7, 50, -0.05, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.filter = 'blur(28px)';
    ctx.fill();
    ctx.restore();

    // Hardcover Spine Casing
    ctx.save();
    ctx.translate(centerX - bookW / 2, centerY - bookH / 2 + 10);
    ctx.transform(1, 0.08, 0, 0.98, 0, 0);

    // Spine overhang border
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-spineWidth - 4, -4, spineWidth + 4, bookH + 8);
    ctx.drawImage(img, sX, 0, sW, fH, -spineWidth, 0, spineWidth, bookH);

    const spineGrad = ctx.createLinearGradient(-spineWidth, 0, 0, 0);
    spineGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
    spineGrad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    spineGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = spineGrad;
    ctx.fillRect(-spineWidth, 0, spineWidth, bookH);
    ctx.restore();

    // Hardcover Front Board (Casing overhanging 6px)
    ctx.save();
    ctx.translate(centerX - bookW / 2, centerY - bookH / 2 + 10);
    ctx.transform(0.95, -0.05, 0, 0.97, 0, 0);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, -5, bookW + 10, bookH + 10);

    ctx.drawImage(img, fX, 0, fW, fH, 0, 0, bookW, bookH);

    // Embossed gold/white bevel rim
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, bookW, bookH);

    // Glossy varnish
    const sheen = ctx.createLinearGradient(0, 0, bookW, bookH);
    sheen.addColorStop(0, 'rgba(255,255,255,0.35)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, bookW, bookH);
    ctx.restore();
  };

  // ----------------------------------------------------
  // PRESET 4: FLOATING BOOK
  // ----------------------------------------------------
  const renderFloatingBook = (
    ctx: CanvasRenderingContext2D,
    size: number,
    img: HTMLImageElement,
    fX: number,
    fW: number,
    sX: number,
    sW: number,
    fH: number
  ) => {
    const bookH = 820;
    const bookW = 550;
    const centerX = size / 2;
    const centerY = size / 2 - 40;

    // Distant Ambient Occlusion Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + bookH / 2 + 150, bookW * 0.75, 45, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.filter = 'blur(40px)';
    ctx.fill();
    ctx.restore();

    // Floating Angle
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((-6 * Math.PI) / 180);
    ctx.translate(-bookW / 2, -bookH / 2);

    ctx.beginPath();
    ctx.roundRect(0, 0, bookW, bookH, 8);
    ctx.clip();
    ctx.drawImage(img, fX, 0, fW, fH, 0, 0, bookW, bookH);

    const sheen = ctx.createLinearGradient(0, 0, bookW, bookH);
    sheen.addColorStop(0, 'rgba(255,255,255,0.3)');
    sheen.addColorStop(0.6, 'rgba(255,255,255,0.05)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, bookW, bookH);
    ctx.restore();
  };

  // ----------------------------------------------------
  // PRESET 5: BOOK + TABLET DUO (Print + E-Book)
  // ----------------------------------------------------
  const renderDuoTablet = (
    ctx: CanvasRenderingContext2D,
    size: number,
    img: HTMLImageElement,
    fX: number,
    fW: number,
    sX: number,
    sW: number,
    fH: number
  ) => {
    // 1. Standing Paperback on Left
    const bookH = 780;
    const bookW = 500;
    const spineWidth = 70;
    const bookCenterX = size * 0.38;
    const centerY = size / 2 + 20;

    // Book Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(bookCenterX, centerY + bookH / 2 + 35, bookW * 0.6, 40, -0.05, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.filter = 'blur(20px)';
    ctx.fill();
    ctx.restore();

    // Spine
    ctx.save();
    ctx.translate(bookCenterX - bookW / 2, centerY - bookH / 2 + 10);
    ctx.transform(1, 0.08, 0, 0.98, 0, 0);
    ctx.drawImage(img, sX, 0, sW, fH, -spineWidth, 0, spineWidth, bookH);
    ctx.restore();

    // Front Cover
    ctx.save();
    ctx.translate(bookCenterX - bookW / 2, centerY - bookH / 2 + 10);
    ctx.transform(0.95, -0.05, 0, 0.97, 0, 0);
    ctx.drawImage(img, fX, 0, fW, fH, 0, 0, bookW, bookH);
    ctx.restore();

    // 2. Modern Tablet on Right
    const tabW = 460;
    const tabH = 640;
    const tabX = size * 0.62;
    const tabY = centerY + 30;

    // Tablet Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(tabX, tabY + tabH / 2 + 25, tabW * 0.55, 30, 0.05, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.filter = 'blur(18px)';
    ctx.fill();
    ctx.restore();

    // Tablet Body (Space Grey Aluminum)
    ctx.save();
    ctx.translate(tabX - tabW / 2, tabY - tabH / 2);
    ctx.transform(0.96, 0.04, 0, 0.98, 0, 0);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(0, 0, tabW, tabH, 24);
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Tablet Screen (Bezel inset 20px)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(20, 20, tabW - 40, tabH - 40, 10);
    ctx.clip();
    ctx.drawImage(img, fX, 0, fW, fH, 20, 20, tabW - 40, tabH - 40);

    // Screen Glare reflection
    const glare = ctx.createLinearGradient(0, 0, tabW, tabH);
    glare.addColorStop(0, 'rgba(255,255,255,0.3)');
    glare.addColorStop(0.3, 'rgba(255,255,255,0.05)');
    glare.addColorStop(1, 'transparent');
    ctx.fillStyle = glare;
    ctx.fillRect(20, 20, tabW - 40, tabH - 40);
    ctx.restore();

    ctx.restore();
  };

  // ----------------------------------------------------
  // PRESET 6: FLAT LAY DESK
  // ----------------------------------------------------
  const renderFlatLay = (
    ctx: CanvasRenderingContext2D,
    size: number,
    img: HTMLImageElement,
    fX: number,
    fW: number,
    sX: number,
    sW: number,
    fH: number
  ) => {
    const bookH = 920;
    const bookW = 620;
    const centerX = size / 2;
    const centerY = size / 2;

    // Floor Cast Shadow
    ctx.save();
    ctx.translate(centerX + 25, centerY + 30);
    ctx.rotate((12 * Math.PI) / 180);
    ctx.translate(-bookW / 2, -bookH / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.filter = 'blur(30px)';
    ctx.fillRect(0, 0, bookW, bookH);
    ctx.restore();

    // Angled Desk Book
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((12 * Math.PI) / 180);
    ctx.translate(-bookW / 2, -bookH / 2);

    ctx.beginPath();
    ctx.roundRect(0, 0, bookW, bookH, 8);
    ctx.clip();
    ctx.drawImage(img, fX, 0, fW, fH, 0, 0, bookW, bookH);

    const sheen = ctx.createLinearGradient(0, 0, bookW, bookH);
    sheen.addColorStop(0, 'rgba(255,255,255,0.25)');
    sheen.addColorStop(0.5, 'transparent');
    sheen.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, bookW, bookH);
    ctx.restore();
  };

  // ----------------------------------------------------
  // DOWNLOAD ACTION
  // ----------------------------------------------------
  const handleDownloadMockup = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${(bookTitle || 'Book').toLowerCase().replace(/\s+/g, '-')}-3d-mockup-${mockupStyle}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download mockup error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full p-6 space-y-6 text-slate-900 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-100 rounded-xl text-purple-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">3D Book Mockup Studio</h2>
              <p className="text-xs text-slate-500 font-medium">
                High-Resolution Photorealistic 3D Renders for Amazon A+, Instagram &amp; Social Marketing
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
          {/* Main 3D Viewport with Offscreen/Render Canvas */}
          <div className="lg:col-span-2 rounded-2xl flex items-center justify-center p-4 relative min-h-[420px] bg-slate-100 border border-slate-200 overflow-hidden">
            {/* Real Canvas Rendering Target */}
            <canvas
              ref={previewCanvasRef}
              className="max-h-[420px] max-w-full object-contain rounded-xl shadow-lg"
            />
          </div>

          {/* Controls Panel */}
          <div className="space-y-5 flex flex-col justify-between">
            {/* 1. Mockup Styles */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                1. 3D Mockup Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMockupStyle('standing')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    mockupStyle === 'standing'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">Paperback Standing</div>
                  <div className="text-[10px] text-slate-400">Spine + Front</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMockupStyle('hero_angle')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    mockupStyle === 'hero_angle'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">Hero 3/4 Angle</div>
                  <div className="text-[10px] text-slate-400">Pages Stack Edge</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMockupStyle('hardcover')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    mockupStyle === 'hardcover'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">Hardcover Edition</div>
                  <div className="text-[10px] text-slate-400">Thick Casing &amp; Foil</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMockupStyle('floating')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    mockupStyle === 'floating'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">Floating Dynamic</div>
                  <div className="text-[10px] text-slate-400">Hovering Shadow</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMockupStyle('duo_tablet')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    mockupStyle === 'duo_tablet'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">Book + Tablet Duo</div>
                  <div className="text-[10px] text-slate-400">Print + E-Reader</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMockupStyle('flat_lay')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    mockupStyle === 'flat_lay'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">Flat Lay Desk</div>
                  <div className="text-[10px] text-slate-400">Top-Down Cast</div>
                </button>
              </div>
            </div>

            {/* 2. Studio Backdrops */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                2. Studio Backdrop
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setBackdrop('studio')}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    backdrop === 'studio'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Studio Grey
                </button>

                <button
                  type="button"
                  onClick={() => setBackdrop('dark')}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    backdrop === 'dark'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Dark Slate
                </button>

                <button
                  type="button"
                  onClick={() => setBackdrop('wood')}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    backdrop === 'wood'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Warm Wood
                </button>

                <button
                  type="button"
                  onClick={() => setBackdrop('marble')}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    backdrop === 'marble'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Marble Desk
                </button>

                <button
                  type="button"
                  onClick={() => setBackdrop('transparent')}
                  className={`col-span-2 py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    backdrop === 'transparent'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Transparent PNG (No Background)
                </button>
              </div>
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
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering High-Res Mockup...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Exact High-Res 3D Mockup</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
