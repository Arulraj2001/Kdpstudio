import React, { useState } from 'react';
import {
  Shapes,
  X,
  Search,
  Square,
  Circle,
  Triangle,
  Minus,
  Sparkles,
  Award,
  Frame,
  Bookmark,
  Shield,
  Layers,
  Plus,
} from 'lucide-react';

export interface ShapePresetItem {
  id: string;
  title: string;
  category: 'basic' | 'badge' | 'divider' | 'frame';
  type: 'rect' | 'circle' | 'triangle' | 'polygon' | 'line' | 'barcode_placeholder' | 'svg';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDashArray?: number[];
  width: number;
  height: number;
  rx?: number;
  ry?: number;
  points?: { x: number; y: number }[];
  svgString?: string;
  opacity?: number;
  description: string;
}

export const SHAPE_PRESETS: ShapePresetItem[] = [
  // 1. BASIC GEOMETRY
  {
    id: 'shape-gold-box',
    title: 'Gold Trim Rectangle',
    category: 'basic',
    type: 'rect',
    fill: 'transparent',
    stroke: '#eab308',
    strokeWidth: 2,
    width: 260,
    height: 140,
    rx: 0,
    description: 'Gold framed box for framing titles or author name blocks',
  },
  {
    id: 'shape-dark-overlay',
    title: 'Dark Translucent Backing',
    category: 'basic',
    type: 'rect',
    fill: '#000000',
    opacity: 0.6,
    width: 280,
    height: 180,
    rx: 12,
    description: 'Rounded dark translucent pill to enhance text legibility over busy art',
  },
  {
    id: 'shape-circle-pill',
    title: 'Circular Sun / Disc',
    category: 'basic',
    type: 'circle',
    fill: '#fcd34d',
    width: 140,
    height: 140,
    description: 'Warm golden sun disk for minimalist and fantasy covers',
  },
  {
    id: 'shape-diamond',
    title: 'Geometric Diamond Frame',
    category: 'basic',
    type: 'polygon',
    fill: 'transparent',
    stroke: '#a855f7',
    strokeWidth: 3,
    width: 160,
    height: 160,
    points: [
      { x: 80, y: 0 },
      { x: 160, y: 80 },
      { x: 80, y: 160 },
      { x: 0, y: 80 },
    ],
    description: 'Modern rotated diamond outline for title framing',
  },
  {
    id: 'shape-triangle',
    title: 'Ascending Triangle',
    category: 'basic',
    type: 'triangle',
    fill: '#38bdf8',
    opacity: 0.8,
    width: 150,
    height: 130,
    description: 'Modern sci-fi and thriller geometric vector shape',
  },

  // 2. BADGES & SEALS
  {
    id: 'shape-seal-16star',
    title: '16-Point Starburst Seal',
    category: 'badge',
    type: 'svg',
    fill: '#eab308',
    width: 120,
    height: 120,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <circle cx="60" cy="60" r="54" fill="#ca8a04" stroke="#fef08a" stroke-width="2"/>
      <circle cx="60" cy="60" r="46" fill="#a16207" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="4,2"/>
      <text x="60" y="55" font-family="Montserrat, sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">#1 BESTSELLER</text>
      <text x="60" y="70" font-family="Montserrat, sans-serif" font-size="8" font-weight="bold" fill="#fef08a" text-anchor="middle">OVER 1M COPIES</text>
    </svg>`,
    description: 'Gold foil Bestseller rosette seal for top-right cover placement',
  },
  {
    id: 'shape-ribbon-bookmark',
    title: 'Hanging Ribbon Banner',
    category: 'badge',
    type: 'svg',
    fill: '#dc2626',
    width: 60,
    height: 130,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 130" width="60" height="130">
      <polygon points="0,0 60,0 60,110 30,95 0,110" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
      <text x="30" y="45" font-family="Montserrat, sans-serif" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle" transform="rotate(-90 30 45)">SPECIAL EDITION</text>
    </svg>`,
    description: 'Crimson bookmark ribbon hanging from top border',
  },
  {
    id: 'shape-shield-badge',
    title: 'Heraldic Shield Crest',
    category: 'badge',
    type: 'svg',
    fill: '#7c3aed',
    width: 100,
    height: 120,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
      <path d="M50,5 L90,20 L90,65 C90,95 50,115 50,115 C50,115 10,95 10,65 L10,20 Z" fill="#6d28d9" stroke="#fbbf24" stroke-width="3"/>
      <path d="M50,15 L80,26 L80,62 C80,85 50,102 50,102 C50,102 20,85 20,62 L20,26 Z" fill="none" stroke="#fbbf24" stroke-width="1" stroke-dasharray="3,2"/>
    </svg>`,
    description: 'Medieval heraldic shield for epic fantasy & gaming covers',
  },

  // 3. DIVIDERS & RULES
  {
    id: 'shape-divider-gold-line',
    title: 'Refined Gold Rule',
    category: 'divider',
    type: 'line',
    fill: 'transparent',
    stroke: '#eab308',
    strokeWidth: 2,
    width: 240,
    height: 4,
    description: 'Clean gold separator line for subtitles and author names',
  },
  {
    id: 'shape-divider-diamond-trio',
    title: 'Diamond Trio Ornament',
    category: 'divider',
    type: 'svg',
    fill: '#cbd5e1',
    width: 280,
    height: 24,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 24" width="280" height="24">
      <line x1="10" y1="12" x2="110" y2="12" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="170" y1="12" x2="270" y2="12" stroke="#e2e8f0" stroke-width="1.5"/>
      <rect x="134" y="6" width="12" height="12" transform="rotate(45 140 12)" fill="#ca8a04"/>
      <rect x="116" y="8" width="8" height="8" transform="rotate(45 120 12)" fill="#94a3b8"/>
      <rect x="156" y="8" width="8" height="8" transform="rotate(45 160 12)" fill="#94a3b8"/>
    </svg>`,
    description: 'Triple-diamond ornate scene break and title separator',
  },
  {
    id: 'shape-divider-double-rule',
    title: 'Classic Double Rule Line',
    category: 'divider',
    type: 'svg',
    fill: '#ffffff',
    width: 260,
    height: 12,
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 12" width="260" height="12">
      <line x1="0" y1="3" x2="260" y2="3" stroke="#eab308" stroke-width="2"/>
      <line x1="30" y1="9" x2="230" y2="9" stroke="#ca8a04" stroke-width="1"/>
    </svg>`,
    description: 'Thick-thin double rule for vintage and classical typography',
  },

  // 4. FRAMES & BORDERS
  {
    id: 'shape-frame-kdp-inset',
    title: 'Clean Inset Border Frame',
    category: 'frame',
    type: 'rect',
    fill: 'transparent',
    stroke: '#ffffff',
    strokeWidth: 2,
    width: 280,
    height: 420,
    rx: 0,
    description: 'Full front cover border inset within KDP safe-margin',
  },
  {
    id: 'shape-frame-dashed-vintage',
    title: 'Vintage Double Dashed Frame',
    category: 'frame',
    type: 'rect',
    fill: 'transparent',
    stroke: '#ca8a04',
    strokeWidth: 1.5,
    strokeDashArray: [6, 4],
    width: 270,
    height: 400,
    rx: 4,
    description: 'Classical dashed frame for period novels and historical guides',
  },
];

interface CoverShapesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddShapeToCanvas: (preset: ShapePresetItem) => void;
}

export const CoverShapesDrawer: React.FC<CoverShapesDrawerProps> = ({
  isOpen,
  onClose,
  onAddShapeToCanvas,
}) => {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'All', label: 'All Shapes' },
    { id: 'basic', label: 'Geometry' },
    { id: 'badge', label: 'Badges' },
    { id: 'divider', label: 'Dividers' },
    { id: 'frame', label: 'Frames' },
  ];

  const filtered = SHAPE_PRESETS.filter((item) => {
    const matchesTab = activeTab === 'All' || item.category === activeTab;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="fixed inset-y-0 left-20 w-84 bg-white border-r border-slate-200 shadow-2xl z-40 flex flex-col animate-in slide-in-from-left duration-200 text-slate-900 select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
            <Shapes className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Shapes &amp; Badges</h3>
            <p className="text-[11px] text-slate-500 font-medium">Banners, Seals, Borders &amp; Rules</p>
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
            placeholder="Search shapes, banners, frames..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shape Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          {filtered.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onAddShapeToCanvas(preset)}
              className="group p-3 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-900 hover:bg-slate-950 flex flex-col items-center justify-between text-center transition-all cursor-pointer shadow-2xs hover:shadow-md relative overflow-hidden"
            >
              {/* Preview Thumbnail */}
              <div className="w-full h-20 flex items-center justify-center p-2 bg-black/40 rounded-lg overflow-hidden">
                {preset.svgString ? (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: preset.svgString }}
                  />
                ) : preset.type === 'rect' ? (
                  <div
                    className="border-2 rounded-sm"
                    style={{
                      borderColor: preset.stroke || '#38bdf8',
                      backgroundColor: preset.fill === 'transparent' ? 'transparent' : preset.fill,
                      width: '70%',
                      height: '50%',
                    }}
                  />
                ) : preset.type === 'circle' ? (
                  <div
                    className="rounded-full"
                    style={{
                      backgroundColor: preset.fill,
                      borderColor: preset.stroke,
                      width: '40px',
                      height: '40px',
                    }}
                  />
                ) : preset.type === 'polygon' || preset.type === 'triangle' ? (
                  <div
                    className="w-8 h-8 border-2 rotate-45"
                    style={{ borderColor: preset.stroke || '#a855f7' }}
                  />
                ) : (
                  <div
                    className="w-full h-0.5"
                    style={{ backgroundColor: preset.stroke || '#eab308' }}
                  />
                )}
              </div>

              <span className="text-[11px] font-semibold text-slate-200 group-hover:text-blue-400 mt-2 truncate w-full">
                {preset.title}
              </span>

              <span className="text-[10px] text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-0.5">
                <Plus className="w-3 h-3" /> Place
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            No shapes matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};
