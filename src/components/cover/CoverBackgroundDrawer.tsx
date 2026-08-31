import React, { useState } from 'react';
import {
  Palette,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';
import { MESH_GRADIENTS, MeshGradient } from '../../lib/coverTemplates';

interface CoverBackgroundDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGradient: (gradient: MeshGradient) => void;
  onApplySolidColor: (color: string) => void;
  currentBgColor: string;
}

const SOLID_PALETTES = [
  { name: 'Pitch Black', hex: '#000000' },
  { name: 'Deep Midnight', hex: '#0f172a' },
  { name: 'Abyssal Blue', hex: '#030712' },
  { name: 'Royal Indigo', hex: '#1e1b4b' },
  { name: 'Deep Purple', hex: '#2e1065' },
  { name: 'Crimson Velvet', hex: '#450a0a' },
  { name: 'Dark Maroon', hex: '#4c0519' },
  { name: 'Dark Emerald', hex: '#022c22' },
  { name: 'Deep Teal', hex: '#042f2e' },
  { name: 'Warm Espresso', hex: '#1c1917' },
  { name: 'Parchment Bone', hex: '#fdfbf7' },
  { name: 'Crisp White', hex: '#ffffff' },
];

export const CoverBackgroundDrawer: React.FC<CoverBackgroundDrawerProps> = ({
  isOpen,
  onClose,
  onApplyGradient,
  onApplySolidColor,
  currentBgColor,
}) => {
  const [activeTab, setActiveTab] = useState<'gradient' | 'solid'>('gradient');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Dark', 'Warm', 'Vibrant', 'Aesthetic'];

  const filteredGradients = MESH_GRADIENTS.filter(
    (g) => categoryFilter === 'All' || g.category === categoryFilter
  );

  return (
    <div className="fixed inset-y-0 left-20 w-80 bg-white border-r border-slate-200 shadow-2xl z-40 flex flex-col animate-in slide-in-from-left duration-200 text-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cover Backgrounds</h3>
            <p className="text-[11px] text-slate-500 font-medium">Mesh Gradients & Solid Palettes</p>
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 p-1 m-3 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('gradient')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'gradient'
              ? 'bg-white text-purple-700 font-bold shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mesh Gradients</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('solid')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'solid'
              ? 'bg-white text-purple-700 font-bold shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Solids & Palettes</span>
        </button>
      </div>

      {activeTab === 'gradient' ? (
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Gradients Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {filteredGradients.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onApplyGradient(g)}
                className="group p-2 rounded-xl border border-slate-200 hover:border-purple-500 bg-white flex flex-col items-center justify-between text-center transition-all cursor-pointer shadow-2xs hover:shadow-md"
              >
                <div
                  className="w-full h-16 rounded-lg shadow-inner border border-black/10 transition-transform group-hover:scale-102"
                  style={{
                    background: `linear-gradient(${g.angle}deg, ${g.stops.join(', ')})`,
                  }}
                />
                <span className="text-[11px] font-bold text-slate-800 group-hover:text-purple-700 mt-2 truncate w-full">
                  {g.name}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">{g.category}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
          {/* Custom Color Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Custom Hex Color
            </label>
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="color"
                value={currentBgColor}
                onChange={(e) => onApplySolidColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
              />
              <input
                type="text"
                value={currentBgColor}
                onChange={(e) => onApplySolidColor(e.target.value)}
                className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Curated Solid Swatches */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              KDP Best-Selling Base Tones
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SOLID_PALETTES.map((s) => (
                <button
                  key={s.hex}
                  type="button"
                  onClick={() => onApplySolidColor(s.hex)}
                  className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:border-purple-500 bg-white hover:bg-slate-50 text-left transition-all cursor-pointer shadow-2xs"
                >
                  <div
                    className="w-6 h-6 rounded-lg border border-black/15 shrink-0 shadow-2xs"
                    style={{ backgroundColor: s.hex }}
                  />
                  <div className="truncate">
                    <div className="text-[11px] font-bold text-slate-800 truncate">{s.name}</div>
                    <div className="text-[9px] font-mono text-slate-400">{s.hex}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
