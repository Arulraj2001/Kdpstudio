import React, { useState } from 'react';
import {
  Type,
  Square,
  Image as ImageIcon,
  Layers,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sliders,
  Palette,
  Sparkles,
} from 'lucide-react';
import { CoverConfig } from '../../types/index';

const GOOGLE_FONTS = [
  'Playfair Display',
  'Cinzel',
  'Cinzel Decorative',
  'Montserrat',
  'Bebas Neue',
  'Merriweather',
  'Oswald',
  'Lora',
  'Poppins',
  'Roboto Slab',
  'Alegreya',
  'Cormorant Garamond',
  'EB Garamond',
  'Abril Fatface',
  'Anton',
  'Raleway',
  'Great Vibes',
  'UnifrakturMaguntia',
  'Georgia',
  'Times New Roman',
  'Helvetica',
  'Courier New',
];

const PRESET_COLORS = [
  '#000000',
  '#1c1917',
  '#0f172a',
  '#1e1b4b',
  '#3b0764',
  '#4c0519',
  '#7f1d1d',
  '#78350f',
  '#14532d',
  '#0e7490',
  '#ffffff',
  '#f8fafc',
  '#e2e8f0',
  '#fbbf24',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
];

interface LayerItem {
  id: string;
  type: string;
  name: string;
  visible: boolean;
  selected: boolean;
  rawObject: any;
}

interface CoverPropertiesPanelProps {
  selectedObject: any | null;
  canvasBgColor: string;
  onSetCanvasBgColor: (color: string) => void;
  onUpdateObject: (props: Record<string, any>) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onReorderObject: (direction: 'up' | 'down' | 'front' | 'back') => void;
  onRotateSpine: () => void;
  layers: LayerItem[];
  onSelectLayer: (layer: LayerItem) => void;
  onToggleLayerVisibility: (layer: LayerItem) => void;
  onDeleteLayer: (layer: LayerItem) => void;
  coverDimensions: {
    totalWidth: number;
    totalHeight: number;
    spineWidth: number;
    trimSize: string;
    pageCount: number;
    paperType: string;
  };
  onQuickAdd: (type: 'title' | 'subtitle' | 'author' | 'spine' | 'barcode') => void;
}

export const CoverPropertiesPanel: React.FC<CoverPropertiesPanelProps> = ({
  selectedObject,
  canvasBgColor,
  onSetCanvasBgColor,
  onUpdateObject,
  onDeleteSelected,
  onDuplicateSelected,
  onReorderObject,
  onRotateSpine,
  layers,
  onSelectLayer,
  onToggleLayerVisibility,
  onDeleteLayer,
  coverDimensions,
  onQuickAdd,
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties');
  const isText = selectedObject?.type === 'i-text' || selectedObject?.type === 'text' || selectedObject?.type === 'textbox';
  const isImage = selectedObject?.type === 'image';
  const isShape = selectedObject?.type === 'rect' || selectedObject?.type === 'circle' || selectedObject?.type === 'line';

  // Text properties safely read
  const fontFamily = selectedObject?.fontFamily || 'Playfair Display';
  const fontSize = Math.round(selectedObject?.fontSize || 24);
  const fill = selectedObject?.fill || '#000000';
  const fontWeight = selectedObject?.fontWeight || 'normal';
  const fontStyle = selectedObject?.fontStyle || 'normal';
  const underline = Boolean(selectedObject?.underline);
  const textAlign = selectedObject?.textAlign || 'left';
  const charSpacing = selectedObject?.charSpacing || 0;
  const lineHeight = selectedObject?.lineHeight || 1.2;
  const opacity = Math.round((selectedObject?.opacity ?? 1) * 100);

  // Shape properties
  const stroke = selectedObject?.stroke || '#000000';
  const strokeWidth = selectedObject?.strokeWidth || 0;
  const rx = selectedObject?.rx || 0;

  // Text shadow
  const shadowColor = selectedObject?.shadow?.color || '#000000';
  const shadowBlur = selectedObject?.shadow?.blur || 0;
  const shadowOffsetX = selectedObject?.shadow?.offsetX || 0;
  const shadowOffsetY = selectedObject?.shadow?.offsetY || 0;
  const hasShadow = Boolean(selectedObject?.shadow && shadowBlur > 0);

  const handleToggleShadow = () => {
    if (hasShadow) {
      onUpdateObject({ shadow: null });
    } else {
      onUpdateObject({
        shadow: {
          color: 'rgba(0,0,0,0.5)',
          blur: 10,
          offsetX: 3,
          offsetY: 3,
        },
      });
    }
  };

  return (
    <aside
      id="cover-right-panel"
      className="w-72 bg-white dark:bg-[#131320] border-l border-gray-200 dark:border-gray-800 flex flex-col h-full z-30 select-none shrink-0"
    >
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 p-1 m-2 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'properties'
              ? 'bg-white dark:bg-[#1a1a2e] text-purple-600 dark:text-purple-300 shadow-xs'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Properties</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'layers'
              ? 'bg-white dark:bg-[#1a1a2e] text-purple-600 dark:text-purple-300 shadow-xs'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers ({layers.length})</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5 text-xs text-gray-700 dark:text-gray-300">
        {activeTab === 'properties' ? (
          <>
            {/* Quick Actions for Selected Object */}
            {selectedObject && (
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-800">
                <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate capitalize">
                  {selectedObject.type === 'i-text' || selectedObject.type === 'textbox'
                    ? 'Text Layer'
                    : selectedObject.type}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onReorderObject('front')}
                    title="Bring to Front"
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onReorderObject('back')}
                    title="Send to Back"
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onDuplicateSelected}
                    title="Duplicate Object"
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteSelected}
                    title="Delete Object"
                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-md text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 1. TEXT PROPERTIES */}
            {isText && (
              <div className="space-y-4">
                {/* Font Family */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Font Family
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => onUpdateObject({ fontFamily: e.target.value })}
                    className="w-full px-2.5 py-2 bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ fontFamily }}
                  >
                    {GOOGLE_FONTS.map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size & Weight */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Font Size
                    </span>
                    <span className="font-mono text-gray-900 dark:text-white font-bold">{fontSize}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={10}
                      max={180}
                      value={fontSize}
                      onChange={(e) => onUpdateObject({ fontSize: parseInt(e.target.value) })}
                      className="flex-1 accent-purple-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                    />
                    <input
                      type="number"
                      min={10}
                      max={250}
                      value={fontSize}
                      onChange={(e) => onUpdateObject({ fontSize: parseInt(e.target.value) || 24 })}
                      className="w-14 px-2 py-1 bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-lg text-center font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Style buttons: Bold, Italic, Underline & Alignment */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateObject({ fontWeight: fontWeight === 'bold' || fontWeight === 700 ? 'normal' : 'bold' })
                      }
                      className={`flex-1 p-1.5 rounded-lg flex items-center justify-center ${
                        fontWeight === 'bold' || fontWeight === 700
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateObject({ fontStyle: fontStyle === 'italic' ? 'normal' : 'italic' })
                      }
                      className={`flex-1 p-1.5 rounded-lg flex items-center justify-center ${
                        fontStyle === 'italic'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateObject({ underline: !underline })}
                      className={`flex-1 p-1.5 rounded-lg flex items-center justify-center ${
                        underline
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateObject({ textAlign: 'left' })}
                      className={`flex-1 p-1.5 rounded-lg flex items-center justify-center ${
                        textAlign === 'left'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateObject({ textAlign: 'center' })}
                      className={`flex-1 p-1.5 rounded-lg flex items-center justify-center ${
                        textAlign === 'center'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateObject({ textAlign: 'right' })}
                      className={`flex-1 p-1.5 rounded-lg flex items-center justify-center ${
                        textAlign === 'right'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Text Color
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={fill}
                        onChange={(e) => onUpdateObject({ fill: e.target.value })}
                        className="w-5 h-5 rounded-md cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="font-mono text-[11px] text-gray-600 dark:text-gray-400">{fill}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-10 gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onUpdateObject({ fill: c })}
                        className="w-5 h-5 rounded-md border border-gray-300 dark:border-gray-700 shadow-2xs hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Letter Spacing & Line Height */}
                <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <div className="flex justify-between items-center mb-1 text-[11px] text-gray-500">
                      <span>Letter Spacing</span>
                      <span className="font-mono text-gray-900 dark:text-white">{charSpacing}</span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={500}
                      value={charSpacing}
                      onChange={(e) => onUpdateObject({ charSpacing: parseInt(e.target.value) })}
                      className="w-full accent-purple-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1 text-[11px] text-gray-500">
                      <span>Line Height</span>
                      <span className="font-mono text-gray-900 dark:text-white">{lineHeight}</span>
                    </div>
                    <input
                      type="range"
                      min={0.8}
                      max={2.5}
                      step={0.1}
                      value={lineHeight}
                      onChange={(e) => onUpdateObject({ lineHeight: parseFloat(e.target.value) })}
                      className="w-full accent-purple-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Spine Alignment / Rotate Helper */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onRotateSpine}
                    className="w-full py-2 px-3 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 font-semibold flex items-center justify-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate for Spine (90° / 0°)</span>
                  </button>
                </div>

                {/* Text Shadow */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Text Shadow
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleShadow}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        hasShadow ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {hasShadow ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {hasShadow && (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span>Shadow Blur</span>
                        <input
                          type="range"
                          min={0}
                          max={30}
                          value={shadowBlur}
                          onChange={(e) =>
                            onUpdateObject({
                              shadow: { ...selectedObject.shadow, blur: parseInt(e.target.value) },
                            })
                          }
                          className="w-28 accent-purple-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. SHAPE PROPERTIES */}
            {isShape && (
              <div className="space-y-4">
                {/* Fill Color */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Shape Fill Color
                    </span>
                    <input
                      type="color"
                      value={fill || '#000000'}
                      onChange={(e) => onUpdateObject({ fill: e.target.value })}
                      className="w-5 h-5 rounded-md cursor-pointer border-0 bg-transparent p-0"
                    />
                  </div>
                  <div className="grid grid-cols-10 gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onUpdateObject({ fill: c })}
                        className="w-5 h-5 rounded-md border border-gray-300 dark:border-gray-700 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Stroke / Border */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Border / Stroke
                    </span>
                    <input
                      type="color"
                      value={stroke || '#000000'}
                      onChange={(e) => onUpdateObject({ stroke: e.target.value })}
                      className="w-5 h-5 rounded-md cursor-pointer border-0 bg-transparent p-0"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span>Stroke Width</span>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      value={strokeWidth}
                      onChange={(e) => onUpdateObject({ strokeWidth: parseInt(e.target.value) })}
                      className="w-32 accent-purple-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg"
                    />
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[11px]">
                    <span>Opacity</span>
                    <span className="font-mono">{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={opacity}
                    onChange={(e) => onUpdateObject({ opacity: parseInt(e.target.value) / 100 })}
                    className="w-full accent-purple-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* 3. IMAGE PROPERTIES */}
            {isImage && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1 text-[11px]">
                    <span>Image Opacity</span>
                    <span className="font-mono">{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={opacity}
                    onChange={(e) => onUpdateObject({ opacity: parseInt(e.target.value) / 100 })}
                    className="w-full accent-purple-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg"
                  />
                </div>

                {/* Flip Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => onUpdateObject({ flipX: !selectedObject.flipX })}
                    className="py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-center"
                  >
                    Flip Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateObject({ flipY: !selectedObject.flipY })}
                    className="py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-center"
                  >
                    Flip Vertical
                  </button>
                </div>
              </div>
            )}

            {/* 4. CANVAS / BACKGROUND PROPERTIES (when nothing selected) */}
            {!selectedObject && (
              <div className="space-y-5">
                {/* Background Color */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Cover Background Color
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={canvasBgColor}
                        onChange={(e) => onSetCanvasBgColor(e.target.value)}
                        className="w-5 h-5 rounded-md cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="font-mono text-[11px] text-gray-600 dark:text-gray-400">
                        {canvasBgColor}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-10 gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onSetCanvasBgColor(c)}
                        className="w-5 h-5 rounded-md border border-gray-300 dark:border-gray-700 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Quick Add Elements */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Quick Add to Canvas
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onQuickAdd('title')}
                      className="py-2 px-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left font-medium hover:text-purple-600 dark:hover:text-purple-300 transition-colors text-xs"
                    >
                      + Front Title
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickAdd('subtitle')}
                      className="py-2 px-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left font-medium hover:text-purple-600 dark:hover:text-purple-300 transition-colors text-xs"
                    >
                      + Subtitle
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickAdd('author')}
                      className="py-2 px-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left font-medium hover:text-purple-600 dark:hover:text-purple-300 transition-colors text-xs"
                    >
                      + Author Name
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickAdd('spine')}
                      className="py-2 px-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left font-medium hover:text-purple-600 dark:hover:text-purple-300 transition-colors text-xs"
                    >
                      + Spine Text
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickAdd('barcode')}
                      className="col-span-2 py-2 px-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-center font-bold transition-colors text-xs"
                    >
                      + KDP Barcode Box (2" × 1.2")
                    </button>
                  </div>
                </div>

                {/* KDP Dimension Specs Summary */}
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1.5 text-[11px]">
                  <div className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[10px]">
                    Current Wrap-Around Specs
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Trim Size:</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">
                      {coverDimensions.trimSize}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Pages & Stock:</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">
                      {coverDimensions.pageCount}p ({coverDimensions.paperType})
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Spine Width:</span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-300">
                      {coverDimensions.spineWidth}"
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Total Canvas:</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">
                      {coverDimensions.totalWidth}" × {coverDimensions.totalHeight}"
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* LAYERS TAB */
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">
              Canvas Objects (Top to Bottom)
            </div>
            {layers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">No objects on canvas</div>
            ) : (
              <div className="space-y-1.5">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    onClick={() => onSelectLayer(layer)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      layer.selected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold shadow-xs'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 mr-2">
                      {layer.type.includes('text') && <Type className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                      {layer.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                      {layer.type === 'rect' && <Square className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      <span className="text-xs truncate">{layer.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLayerVisibility(layer);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white"
                      >
                        {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLayer(layer);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 rounded text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
