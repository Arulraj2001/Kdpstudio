import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX, Type, Maximize2, ChevronDown, Moon, Wind, Waves, CloudRain, TreePine } from 'lucide-react';

interface ZenModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode; // The Tiptap EditorContent
  wordCount: number;
  chapterTitle: string;
}

type AmbientSound = 'none' | 'rain' | 'forest' | 'waves' | 'cafe' | 'wind';
type FontPreset = 'serif' | 'modern' | 'mono' | 'humanist';

const AMBIENT_SOUNDS: { id: AmbientSound; label: string; Icon: React.ElementType; emoji: string }[] = [
  { id: 'none', label: 'Silence', Icon: VolumeX, emoji: '🔇' },
  { id: 'rain', label: 'Rain', Icon: CloudRain, emoji: '🌧️' },
  { id: 'forest', label: 'Forest', Icon: TreePine, emoji: '🌲' },
  { id: 'waves', label: 'Ocean', Icon: Waves, emoji: '🌊' },
  { id: 'wind', label: 'Wind', Icon: Wind, emoji: '💨' },
];

const FONT_PRESETS: { id: FontPreset; label: string; fontFamily: string; desc: string }[] = [
  { id: 'serif', label: 'Serif', fontFamily: "'Georgia', 'Times New Roman', serif", desc: 'Classic literary' },
  { id: 'modern', label: 'Modern', fontFamily: "'Inter', 'Helvetica Neue', sans-serif", desc: 'Clean & clear' },
  { id: 'mono', label: 'Mono', fontFamily: "'JetBrains Mono', 'Courier New', monospace", desc: 'Distraction-free' },
  { id: 'humanist', label: 'Humanist', fontFamily: "'Palatino Linotype', 'Palatino', serif", desc: 'Elegant & warm' },
];

const BACKGROUNDS: { id: string; label: string; style: React.CSSProperties }[] = [
  { id: 'dark', label: 'Dark', style: { backgroundColor: '#0f172a' } },
  { id: 'warm', label: 'Warm', style: { backgroundColor: '#1c1008' } },
  { id: 'dim', label: 'Dim', style: { backgroundColor: '#1e1e2e' } },
  { id: 'sepia', label: 'Sepia', style: { backgroundColor: '#2d2012' } },
  { id: 'forest', label: 'Forest', style: { backgroundColor: '#0d1f0f' } },
];

// Fake ambient sound descriptions (actual audio would need real audio files)
const AMBIENT_DESC: Record<AmbientSound, string> = {
  none: 'Pure silence',
  rain: 'Gentle rainfall',
  forest: 'Birds & rustling leaves',
  waves: 'Rolling ocean waves',
  cafe: 'Coffee shop murmur',
  wind: 'Soft breeze',
};

export const ZenModeOverlay: React.FC<ZenModeOverlayProps> = ({
  isOpen,
  onClose,
  children,
  wordCount,
  chapterTitle,
}) => {
  const [ambient, setAmbient] = useState<AmbientSound>('rain');
  const [fontPreset, setFontPreset] = useState<FontPreset>('serif');
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.9);
  const [bg, setBg] = useState('dark');
  const [showControls, setShowControls] = useState(true);
  const [showTypewriterCursor, setShowTypewriterCursor] = useState(true);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedBg = BACKGROUNDS.find((b) => b.id === bg) || BACKGROUNDS[0];
  const selectedFont = FONT_PRESETS.find((f) => f.id === fontPreset) || FONT_PRESETS[0];

  // Auto-hide controls after 3s of inactivity
  useEffect(() => {
    if (!isOpen) return;
    resetControlsTimer();
  }, [isOpen]);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 4000);
  };

  const handleMouseMove = () => resetControlsTimer();

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Typewriter cursor blink
  useEffect(() => {
    const t = setInterval(() => setShowTypewriterCursor((v) => !v), 530);
    return () => clearInterval(t);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={selectedBg.style}
      onMouseMove={handleMouseMove}
    >
      {/* Top Fade Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-16 z-10 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${bg === 'warm' ? '#1c1008' : bg === 'sepia' ? '#2d2012' : bg === 'forest' ? '#0d1f0f' : bg === 'dim' ? '#1e1e2e' : '#0f172a'}dd, transparent)` }}
      />

      {/* Header Controls Bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3 transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold backdrop-blur-md transition-all"
          >
            <X className="w-3.5 h-3.5" /> Exit Zen
          </button>
          <span className="text-white/40 text-xs truncate max-w-[150px]">{chapterTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <div className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs font-mono">
            {wordCount.toLocaleString()} words
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-y-auto flex justify-center pt-16 pb-24 px-4">
        <div
          className="w-full max-w-2xl"
          style={{
            fontFamily: selectedFont.fontFamily,
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            color: '#e2e8f0',
          }}
        >
          {/* Typewriter-style chapter title */}
          <h1
            className="text-center font-bold mb-8 opacity-50 text-lg"
            style={{ fontFamily: selectedFont.fontFamily }}
          >
            {chapterTitle}
          </h1>

          {/* Injected Tiptap editor (styled via global CSS override in zen mode) */}
          <div className="zen-editor-content">
            {children}
          </div>

          {/* Typewriter cursor line */}
          <div className="mt-4 flex items-center gap-2 opacity-30">
            <span
              className="inline-block w-0.5 h-5 bg-white"
              style={{ opacity: showTypewriterCursor ? 1 : 0, transition: 'opacity 0.1s' }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Controls Panel */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
      >
        <div className="mx-auto max-w-3xl px-4 pb-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Font Controls */}
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Type className="w-3 h-3" /> Typography
                </p>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {FONT_PRESETS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFontPreset(f.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                        fontPreset === f.id ? 'bg-white/30 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setFontSize(Math.max(14, fontSize - 1))} className="w-6 h-6 rounded text-white/60 hover:text-white hover:bg-white/10 text-sm flex items-center justify-center">−</button>
                  <span className="text-white/60 text-xs font-mono w-8 text-center">{fontSize}px</span>
                  <button onClick={() => setFontSize(Math.min(28, fontSize + 1))} className="w-6 h-6 rounded text-white/60 hover:text-white hover:bg-white/10 text-sm flex items-center justify-center">+</button>
                </div>
              </div>

              {/* Background */}
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Moon className="w-3 h-3" /> Background
                </p>
                <div className="flex gap-1.5">
                  {BACKGROUNDS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBg(b.id)}
                      title={b.label}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${bg === b.id ? 'border-white scale-110' : 'border-white/20 hover:border-white/50'}`}
                      style={b.style}
                    />
                  ))}
                </div>
              </div>

              {/* Ambient Sound */}
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Ambient
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {AMBIENT_SOUNDS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setAmbient(s.id)}
                      title={AMBIENT_DESC[s.id]}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                        ambient === s.id ? 'bg-white/30 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
                {ambient !== 'none' && (
                  <p className="text-white/30 text-[10px] mt-1">{AMBIENT_DESC[ambient]}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle global CSS override for zen editor */}
      <style>{`
        .zen-editor-content .ProseMirror {
          background: transparent !important;
          color: #e2e8f0 !important;
          border: none !important;
          outline: none !important;
          padding: 0 !important;
          min-height: unset !important;
          caret-color: #a78bfa;
        }
        .zen-editor-content .ProseMirror p {
          margin-bottom: 1.2em;
        }
        .zen-editor-content .ProseMirror h1,
        .zen-editor-content .ProseMirror h2,
        .zen-editor-content .ProseMirror h3 {
          color: #f1f5f9;
        }
        .zen-editor-content .ProseMirror blockquote {
          border-left: 2px solid rgba(167,139,250,0.4);
          padding-left: 1rem;
          color: #94a3b8;
          font-style: italic;
        }
        .zen-editor-content .ProseMirror ::selection {
          background: rgba(167,139,250,0.3);
        }
      `}</style>
    </div>
  );
};
