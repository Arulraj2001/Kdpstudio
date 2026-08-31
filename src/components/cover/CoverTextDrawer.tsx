import React, { useState } from 'react';
import {
  Type,
  X,
  Search,
  Sparkles,
  Award,
  BookOpen,
  AlignLeft,
  RotateCw,
  Star,
  Quote,
} from 'lucide-react';

export interface TextPresetItem {
  id: string;
  title: string;
  category: 'title' | 'subtitle' | 'author' | 'spine' | 'review' | 'series';
  sampleText: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fill: string;
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: string;
  backgroundColor?: string;
  stroke?: string;
  strokeWidth?: number;
  angle?: number;
  description: string;
  isSpine?: boolean;
}

export const TEXT_PRESETS: TextPresetItem[] = [
  // 1. TITLES
  {
    id: 'title-cinematic-serif',
    title: 'Cinematic Bestseller Title',
    category: 'title',
    sampleText: 'THE LAST KINGDOM',
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 38,
    fontWeight: 'bold',
    fill: '#ffffff',
    letterSpacing: 4,
    textAlign: 'center',
    description: 'Majestic all-caps serif for epic fantasy, historical & thriller fiction',
  },
  {
    id: 'title-modern-sans',
    title: 'Modern Bold Sans',
    category: 'title',
    sampleText: 'ATOMIC HABITS',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 42,
    fontWeight: '900',
    fill: '#fcd34d',
    letterSpacing: 2,
    textAlign: 'center',
    description: 'Ultra-bold high-impact sans for non-fiction, business & sci-fi',
  },
  {
    id: 'title-thriller-impact',
    title: 'Thriller / Crime Impact',
    category: 'title',
    sampleText: 'DARK SILENCE',
    fontFamily: 'Impact, Oswald, sans-serif',
    fontSize: 44,
    fontWeight: 'bold',
    fill: '#ef4444',
    letterSpacing: 3,
    textAlign: 'center',
    description: 'Aggressive condensed title for mystery, thriller & horror',
  },
  {
    id: 'title-romance-script',
    title: 'Romance Elegant Serif',
    category: 'title',
    sampleText: 'A Summer in Paris',
    fontFamily: 'Playfair Display, serif',
    fontSize: 36,
    fontWeight: 'bold',
    fill: '#f472b6',
    letterSpacing: 1,
    textAlign: 'center',
    description: 'Charming literary typography for contemporary romance & romcoms',
  },
  {
    id: 'title-minimal-gold',
    title: 'Luxury Gold Minimalist',
    category: 'title',
    sampleText: 'THE ART OF STILLNESS',
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: 34,
    fontWeight: 'bold',
    fill: '#eab308',
    letterSpacing: 6,
    textAlign: 'center',
    description: 'Refined luxury typography for poetry, philosophy & memoirs',
  },

  // 2. SUBTITLES & TAGLINES
  {
    id: 'sub-exploratory',
    title: 'Clear Book Subtitle',
    category: 'subtitle',
    sampleText: 'How to Build Unstoppable Momentum in Life & Work',
    fontFamily: 'Inter, sans-serif',
    fontSize: 15,
    fontWeight: '600',
    fill: '#cbd5e1',
    letterSpacing: 1,
    lineHeight: 1.3,
    textAlign: 'center',
    description: 'Clean readable subtitle for non-fiction guidebooks',
  },
  {
    id: 'sub-tagline-quote',
    title: 'Dramatic Hook Tagline',
    category: 'subtitle',
    sampleText: '"Some secrets should stay buried beneath the ice."',
    fontFamily: 'Playfair Display, Georgia, serif',
    fontSize: 14,
    fontWeight: 'normal',
    fill: '#94a3b8',
    textAlign: 'center',
    description: 'Suspenseful book hook positioned above main title',
  },

  // 3. AUTHOR NAMES
  {
    id: 'author-nyt-bestseller',
    title: 'Bestselling Author Header',
    category: 'author',
    sampleText: '#1 NEW YORK TIMES BESTSELLING AUTHOR\nSARAH J. MAAS',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 14,
    fontWeight: 'bold',
    fill: '#fcd34d',
    letterSpacing: 3,
    lineHeight: 1.4,
    textAlign: 'center',
    description: 'Prestige author block with credential header',
  },
  {
    id: 'author-classic-serif',
    title: 'Classic Editorial Author',
    category: 'author',
    sampleText: 'JAMES PATTERSON',
    fontFamily: 'Georgia, serif',
    fontSize: 18,
    fontWeight: 'bold',
    fill: '#ffffff',
    letterSpacing: 4,
    textAlign: 'center',
    description: 'Timeless bold author name for fiction covers',
  },
  {
    id: 'author-minimal-badge',
    title: 'Modern Framed Author',
    category: 'author',
    sampleText: 'BY ARTHUR CONAN DOYLE',
    fontFamily: 'Inter, sans-serif',
    fontSize: 12,
    fontWeight: 'bold',
    fill: '#ffffff',
    letterSpacing: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
    textAlign: 'center',
    description: 'Dark translucent backdrop pill for busy cover art',
  },

  // 4. SPINE TEXT
  {
    id: 'spine-vertical-title',
    title: 'Vertical Spine Title & Author',
    category: 'spine',
    sampleText: 'THE LOST HORIZON  ·  SAMUEL REED',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    fontWeight: 'bold',
    fill: '#ffffff',
    letterSpacing: 2,
    angle: 90,
    isSpine: true,
    description: 'Auto-rotated 90° spine text aligned to KDP spine safe-zone',
  },

  // 5. REVIEW QUOTES
  {
    id: 'review-5star-box',
    title: '5-Star Critical Acclaim',
    category: 'review',
    sampleText: '★★★★★\n"An unputdownable, masterfully crafted triumph."\n— THE GUARDIAN',
    fontFamily: 'Georgia, serif',
    fontSize: 11,
    fontWeight: 'normal',
    fill: '#e2e8f0',
    lineHeight: 1.4,
    textAlign: 'center',
    description: 'Gold stars + editorial review quote for back cover or top banner',
  },

  // 6. SERIES HEADERS
  {
    id: 'series-volume-pill',
    title: 'Series & Volume Banner',
    category: 'series',
    sampleText: 'BOOK ONE OF THE CELESTIAL CHRONICLES',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 10,
    fontWeight: 'bold',
    fill: '#fcd34d',
    letterSpacing: 4,
    textAlign: 'center',
    description: 'Series identification kicker for multi-book franchises',
  },
];

interface CoverTextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTextToCanvas: (preset: TextPresetItem) => void;
}

export const CoverTextDrawer: React.FC<CoverTextDrawerProps> = ({
  isOpen,
  onClose,
  onAddTextToCanvas,
}) => {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'All', label: 'All Styles' },
    { id: 'title', label: 'Titles' },
    { id: 'subtitle', label: 'Subtitles' },
    { id: 'author', label: 'Authors' },
    { id: 'spine', label: 'Spine' },
    { id: 'review', label: 'Reviews' },
    { id: 'series', label: 'Series' },
  ];

  const filtered = TEXT_PRESETS.filter((item) => {
    const matchesTab = activeTab === 'All' || item.category === activeTab;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sampleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="fixed inset-y-0 left-20 w-84 bg-white border-r border-slate-200 shadow-2xl z-40 flex flex-col animate-in slide-in-from-left duration-200 text-slate-900 select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Typography Presets</h3>
            <p className="text-[11px] text-slate-500 font-medium">Bestseller Titles, Authors &amp; Spine</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-900 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Filter */}
      <div className="p-3 border-b border-slate-100 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, author, spine..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 cursor-pointer ${
                activeTab === cat.id
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preset List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onAddTextToCanvas(preset)}
            className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-purple-500 bg-slate-900 hover:bg-slate-950 text-white flex flex-col justify-between transition-all cursor-pointer shadow-xs hover:shadow-md group relative overflow-hidden"
          >
            {/* Visual Header Tag */}
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                {preset.title}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                {preset.fontFamily.split(',')[0]}
              </span>
            </div>

            {/* Rendered Text Preview Box */}
            <div className="w-full py-2.5 px-2 bg-black/40 rounded-lg flex items-center justify-center text-center overflow-hidden min-h-[50px]">
              <span
                style={{
                  fontFamily: preset.fontFamily,
                  color: preset.fill,
                  fontWeight: preset.fontWeight as any,
                  letterSpacing: preset.letterSpacing ? `${preset.letterSpacing}px` : undefined,
                  lineHeight: preset.lineHeight || 1.2,
                }}
                className="text-sm select-none break-words max-w-full"
              >
                {preset.sampleText}
              </span>
            </div>

            {/* Description */}
            <p className="text-[10px] text-slate-400 mt-2 truncate w-full group-hover:text-purple-300 transition-colors">
              {preset.description}
            </p>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            No typography presets matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};
