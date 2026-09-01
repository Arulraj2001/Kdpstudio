import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Download, 
  Check, 
  Sliders, 
  Type, 
  Maximize2, 
  BookOpen, 
  ShieldCheck,
  Eye,
  Settings2
} from 'lucide-react';
import { PageRoute } from '../../types';

interface HeroInteractiveSandboxProps {
  onSelectSample?: (sampleGenre: string) => void;
  onNavigate: (route: PageRoute) => void;
}

interface SampleBookData {
  id: string;
  genre: string;
  badge: string;
  title: string;
  subtitle: string;
  chapterTitle: string;
  firstParagraph: string;
  secondParagraph: string;
  runningHeader: string;
}

const SAMPLE_BOOKS: SampleBookData[] = [
  {
    id: 'scifi',
    genre: 'Sci-Fi / Thriller',
    badge: 'Bestseller Fiction',
    title: 'The Lost Horizon Protocol',
    subtitle: 'A Speculative Deep-Sea Thriller',
    chapterTitle: 'Chapter I: The Submerged Signal',
    firstParagraph:
      'The ocean at midnight was an endless plane of obsidian, broken only by the synchronized hum of the research vessel’s sonar ping. Marcus leaned closer to the monitor, his breath misting the tempered glass. The acoustic reflection was returning an impossible geometry—straight right-angles three thousand meters beneath the Arctic shelf.',
    secondParagraph:
      '“Check the telemetry again,” Marcus murmured into his headset, his pulse hammering against his ribs. “Bedrock does not resonate at forty-four kilohertz. Something beneath that trench is powered, and it just recognized our signal.”',
    runningHeader: 'THE LOST HORIZON PROTOCOL',
  },
  {
    id: 'nonfiction',
    genre: 'Self-Help / Non-Fiction',
    badge: 'Authority Framework',
    title: 'The Assertive Mindset',
    subtitle: 'Mastering Confident Communication',
    chapterTitle: 'Chapter 1: The Anatomy of Quiet Influence',
    firstParagraph:
      'Confidence in communication is rarely about volume; it is fundamentally about grounded clarity. When high-performing professionals hesitate in boardroom negotiations, the friction originates not from lack of expertise, but from internalized boundary confusion.',
    secondParagraph:
      'By anchoring your language around verifiable impact rather than emotional defense, you immediately shift conversational dynamics from conflict to constructive executive consensus.',
    runningHeader: 'THE ASSERTIVE MINDSET • CHAPTER 1',
  },
  {
    id: 'romantasy',
    genre: 'Romantasy / Drama',
    badge: 'Epic Fantasy',
    title: 'Crown of Starlight and Ash',
    subtitle: 'The Obsidian Throne Chronicles',
    chapterTitle: 'Chapter I: Blood on the Marble',
    firstParagraph:
      'Rain drummed violently against the stained-glass cathedral as Lady Seraphina adjusted the obsidian dagger hidden beneath her velvet sleeves. The solstice court had gathered to celebrate peace, completely oblivious that the coronation bells were scheduled to ring for an execution.',
    secondParagraph:
      'Prince Ronald’s eyes caught hers across the banquet hall. He knew her secret, and worse—he was stepping forward through the crowd with an expression of reckless amusement.',
    runningHeader: 'CROWN OF STARLIGHT AND ASH',
  },
];

type TrimSizeOption = '6x9' | '5.5x8.5' | '8.5x11';
type FontOption = 'Garamond' | 'Cormorant' | 'Playfair' | 'Inter';
type OrnamentOption = 'fleuron' | 'stars' | 'diamond' | 'line';

export const HeroInteractiveSandbox: React.FC<HeroInteractiveSandboxProps> = ({
  onNavigate,
}) => {
  const [selectedBookIndex, setSelectedBookIndex] = useState(0);
  const [trimSize, setTrimSize] = useState<TrimSizeOption>('6x9');
  const [fontOption, setFontOption] = useState<FontOption>('Garamond');
  const [ornament, setOrnament] = useState<OrnamentOption>('fleuron');
  const [dropCapEnabled, setDropCapEnabled] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  const activeBook = SAMPLE_BOOKS[selectedBookIndex];

  const getFontFamilyClass = (font: FontOption) => {
    switch (font) {
      case 'Garamond':
        return 'font-serif';
      case 'Cormorant':
        return 'font-serif italic';
      case 'Playfair':
        return 'font-serif tracking-tight';
      case 'Inter':
        return 'font-sans';
      default:
        return 'font-serif';
    }
  };

  const renderOrnament = (opt: OrnamentOption) => {
    switch (opt) {
      case 'fleuron':
        return <span className="text-sm tracking-widest text-purple-700 select-none">❦ ❦ ❦</span>;
      case 'stars':
        return <span className="text-xs tracking-widest text-purple-700 select-none">★ ★ ★</span>;
      case 'diamond':
        return <span className="text-xs tracking-widest text-purple-700 select-none">❖ ❖ ❖</span>;
      case 'line':
        return <span className="text-xs tracking-widest text-slate-400 select-none">─────────</span>;
    }
  };

  const getTrimLabel = (t: TrimSizeOption) => {
    switch (t) {
      case '6x9':
        return '6″ × 9″ Standard Paperback';
      case '5.5x8.5':
        return '5.5″ × 8.5″ Digest Fiction';
      case '8.5x11':
        return '8.5″ × 11″ Large Format';
    }
  };

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleProceedToStudio = () => {
    setShowExportModal(false);
    onNavigate('signup');
  };

  return (
    <div className="w-full rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/70 border border-white/20 bg-slate-900/95 text-white p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Top Header Bar with Live Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-400/30">
                Live Interactive Sandbox
              </span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Zero Sign-Up Required
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
              Test Typesetting &amp; 300 DPI KDP Formatting Live
            </h3>
          </div>
        </div>

        {/* Genre Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
          {SAMPLE_BOOKS.map((b, idx) => (
            <button
              key={b.id}
              onClick={() => setSelectedBookIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedBookIndex === idx
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {b.genre.split('/')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-white/10 text-xs">
        {/* Trim Size */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Maximize2 size={12} className="text-purple-400" />
            <span>Trim Size</span>
          </label>
          <select
            value={trimSize}
            onChange={(e) => setTrimSize(e.target.value as TrimSizeOption)}
            className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-white font-medium focus:outline-none focus:border-purple-400 cursor-pointer"
          >
            <option value="6x9">6″ × 9″ Standard</option>
            <option value="5.5x8.5">5.5″ × 8.5″ Digest</option>
            <option value="8.5x11">8.5″ × 11″ Large</option>
          </select>
        </div>

        {/* Font Choice */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Type size={12} className="text-purple-400" />
            <span>Typeface</span>
          </label>
          <select
            value={fontOption}
            onChange={(e) => setFontOption(e.target.value as FontOption)}
            className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-white font-medium focus:outline-none focus:border-purple-400 cursor-pointer"
          >
            <option value="Garamond">Classic Garamond</option>
            <option value="Cormorant">Cormorant Elegant</option>
            <option value="Playfair">Playfair Display</option>
            <option value="Inter">Modern Clean Sans</option>
          </select>
        </div>

        {/* Ornament */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Sparkles size={12} className="text-purple-400" />
            <span>Scene Divider</span>
          </label>
          <select
            value={ornament}
            onChange={(e) => setOrnament(e.target.value as OrnamentOption)}
            className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-white font-medium focus:outline-none focus:border-purple-400 cursor-pointer"
          >
            <option value="fleuron">Fleuron Ornaments ❦</option>
            <option value="stars">Three Stars ★★★</option>
            <option value="diamond">Flourish Diamonds ❖</option>
            <option value="line">Minimalist Rule ──</option>
          </select>
        </div>

        {/* Drop-Cap Toggle */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Settings2 size={12} className="text-purple-400" />
            <span>Initial Drop-Cap</span>
          </label>
          <button
            type="button"
            onClick={() => setDropCapEnabled(!dropCapEnabled)}
            className={`w-full p-2 rounded-lg font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
              dropCapEnabled
                ? 'bg-purple-600/30 border-purple-400 text-purple-300'
                : 'bg-slate-900 border-white/15 text-slate-400'
            }`}
          >
            <Check size={14} className={dropCapEnabled ? 'opacity-100' : 'opacity-0'} />
            <span>{dropCapEnabled ? 'Drop-Cap ON' : 'Drop-Cap OFF'}</span>
          </button>
        </div>
      </div>

      {/* Simulated High-Resolution Paperback Spread */}
      <div className="relative rounded-2xl bg-amber-50/95 text-slate-900 p-4 sm:p-8 lg:p-10 shadow-2xl border-4 border-slate-800 transition-all">
        {/* Book Spine Center Shadow */}
        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/15 via-black/25 to-black/15 pointer-events-none z-10 shadow-inner" />

        {/* Top Info Bar on Book */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 pb-4 border-b border-slate-300/80 mb-6 font-mono">
          <span className="flex items-center gap-1 font-bold text-purple-900">
            <ShieldCheck size={13} className="text-emerald-700" />
            Amazon KDP Print Certified: {getTrimLabel(trimSize)}
          </span>
          <span className="hidden sm:inline text-slate-500">
            Gutter Margin: 0.75″ • Outside: 0.5″ • Bleed: 0.125″ • 300 DPI
          </span>
        </div>

        {/* The 2-Page Layout Spread */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 text-left relative">
          
          {/* Left Page (Verso) */}
          <div className="space-y-4 pr-0 md:pr-4">
            <div className="text-center space-y-2 pb-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 font-mono">
                {activeBook.title}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                {activeBook.chapterTitle}
              </h2>
              <div className="py-1">{renderOrnament(ornament)}</div>
            </div>

            <div className={`text-xs sm:text-sm leading-relaxed text-slate-800 text-justify ${getFontFamilyClass(fontOption)}`}>
              {dropCapEnabled ? (
                <p>
                  <span className="float-left text-4xl sm:text-5xl font-black leading-none pr-2 pt-1 font-serif text-purple-900">
                    {activeBook.firstParagraph.charAt(0)}
                  </span>
                  {activeBook.firstParagraph.slice(1)}
                </p>
              ) : (
                <p>{activeBook.firstParagraph}</p>
              )}
            </div>

            <div className="text-center pt-6 text-[10px] font-mono text-slate-400">
              — 1 —
            </div>
          </div>

          {/* Right Page (Recto) */}
          <div className="space-y-4 pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-slate-300/60 pt-6 md:pt-0">
            <div className="text-center pb-3 border-b border-slate-200 text-[10px] font-bold tracking-widest text-slate-500 font-mono">
              {activeBook.runningHeader}
            </div>

            <div className={`text-xs sm:text-sm leading-relaxed text-slate-800 text-justify space-y-3 ${getFontFamilyClass(fontOption)}`}>
              <p>{activeBook.secondParagraph}</p>
              <p className="text-slate-600 italic">
                “Every formatted line generated in KDP Studio preserves rigorous typographic margins, widow/orphan suppression, and micro-kerning algorithms compliant with Amazon KDP print engines.”
              </p>
            </div>

            <div className="text-center pt-8 text-[10px] font-mono text-slate-400">
              — 2 —
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Sandbox Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          <span>
            Current preview: <strong>{activeBook.title}</strong> in <strong>{trimSize}</strong> with <strong>{fontOption}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportClick}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Download size={14} className="text-purple-400" />
            <span>Export 300 DPI PDF</span>
          </button>

          <button
            onClick={() => onNavigate('signup')}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Customize This Book in Studio</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* High-Converting 1-Click Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 text-slate-900 text-center space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 mx-auto flex items-center justify-center shadow-inner">
              <Download size={28} />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
                Ready to Print (300 DPI)
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Download Your KDP Interior
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your custom typesetting for <strong>{activeBook.title}</strong> ({trimSize}, {fontOption}) has been formatted to exact Amazon KDP specifications.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>300 DPI Vector PDF print-ready interior</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>Calculated gutter margins &amp; bleed clearance</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>100% Commercial rights &amp; zero royalties taken</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleProceedToStudio}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-purple-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Save Book &amp; Download Free PDF</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold py-1 cursor-pointer"
              >
                Continue testing sandbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
