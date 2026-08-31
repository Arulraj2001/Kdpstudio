import React from 'react';
import {
  MousePointer,
  Type,
  Square,
  Circle,
  Minus,
  Image as ImageIcon,
  Sparkles,
  LayoutTemplate,
  Palette,
  Settings2,
  BookText,
  AlignVerticalSpaceAround,
  Award,
  Box,
  ShieldCheck,
} from 'lucide-react';

export type CoverToolType = 'select' | 'text' | 'shape' | 'image' | 'ai' | 'template' | 'elements' | 'backgrounds';

interface CoverToolbarProps {
  activeTool: CoverToolType;
  setActiveTool: (tool: CoverToolType) => void;
  onAddText: (type: 'title' | 'subtitle' | 'author' | 'spine' | 'body') => void;
  onAddShape: (type: 'rect' | 'circle' | 'line' | 'barcode_placeholder') => void;
  onTriggerImageUpload: () => void;
  onOpenAiDrawer: () => void;
  onOpenTemplatesDrawer: () => void;
  onOpenTextDrawer: () => void;
  onOpenShapesDrawer: () => void;
  onOpenElementsDrawer: () => void;
  onOpenBackgroundDrawer: () => void;
  onOpen3DMockupModal: () => void;
  onOpenPreflightModal: () => void;
  onApplyBrandKit?: () => void;
  onOpenSetupModal: () => void;
}

export const CoverToolbar: React.FC<CoverToolbarProps> = ({
  activeTool,
  setActiveTool,
  onAddText,
  onAddShape,
  onTriggerImageUpload,
  onOpenAiDrawer,
  onOpenTemplatesDrawer,
  onOpenTextDrawer,
  onOpenShapesDrawer,
  onOpenElementsDrawer,
  onOpenBackgroundDrawer,
  onOpen3DMockupModal,
  onOpenPreflightModal,
  onApplyBrandKit,
  onOpenSetupModal,
}) => {
  return (
    <aside
      id="cover-left-toolbar"
      className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-3 gap-1.5 z-30 select-none shrink-0 shadow-2xs overflow-y-auto"
    >
      {/* 1. Select Tool */}
      <button
        type="button"
        id="tool-btn-select"
        onClick={() => {
          setActiveTool('select');
        }}
        title="Select & Move Objects (V)"
        className={`w-14 h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
          activeTool === 'select'
            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 font-bold'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <MousePointer className="w-4 h-4" />
        <span className="text-[10px] font-semibold">Select</span>
      </button>

      {/* 2. Genre Templates / Presets */}
      <button
        type="button"
        id="tool-btn-templates-drawer"
        onClick={() => {
          onOpenTemplatesDrawer();
        }}
        title="Browse 1-Click KDP Genre Cover Presets"
        className="w-14 h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-600 hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer"
      >
        <LayoutTemplate className="w-4 h-4 text-purple-600" />
        <span className="text-[10px] font-semibold text-center leading-tight">Presets</span>
      </button>

      {/* 3. Text Presets Drawer */}
      <button
        type="button"
        id="tool-btn-text"
        onClick={() => {
          onOpenTextDrawer();
        }}
        title="Typography & Text Presets (Titles, Subtitles, Author, Spine)"
        className="w-14 h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-600 hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer"
      >
        <Type className="w-4 h-4 text-purple-600" />
        <span className="text-[10px] font-semibold">Text</span>
      </button>

      {/* 4. Shapes & Badges Drawer */}
      <button
        type="button"
        id="tool-btn-shape"
        onClick={() => {
          onOpenShapesDrawer();
        }}
        title="Shapes, Badges, Dividers & Frames"
        className="w-14 h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer"
      >
        <Square className="w-4 h-4 text-blue-600" />
        <span className="text-[10px] font-semibold">Shapes</span>
      </button>

      {/* 5. Elements & Badges Library */}
      <button
        type="button"
        id="tool-btn-elements-drawer"
        onClick={() => {
          onOpenElementsDrawer();
        }}
        title="Bestseller Badges, Ornaments & Silhouettes"
        className="w-14 h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-all cursor-pointer"
      >
        <Award className="w-4 h-4 text-amber-600" />
        <span className="text-[10px] font-semibold">Elements</span>
      </button>

      {/* 6. Backgrounds & Mesh Gradients */}
      <button
        type="button"
        id="tool-btn-backgrounds"
        onClick={() => {
          onOpenBackgroundDrawer();
        }}
        title="Mesh Gradients & Solid Palettes"
        className="w-14 h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer"
      >
        <Palette className="w-4 h-4 text-blue-600" />
        <span className="text-[10px] font-semibold">Gradients</span>
      </button>

      {/* 7. Image Upload */}
      <button
        type="button"
        id="tool-btn-image-upload"
        onClick={() => {
          onTriggerImageUpload();
        }}
        title="Upload Image from Computer (I)"
        className="w-14 h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
      >
        <ImageIcon className="w-4 h-4" />
        <span className="text-[10px] font-semibold">Image</span>
      </button>

      {/* 8. AI Cover Generation */}
      <button
        type="button"
        id="tool-btn-ai-drawer"
        onClick={() => {
          onOpenAiDrawer();
        }}
        title="Generate AI Art with Imagen / Gemini"
        className="w-14 h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 bg-gradient-to-br from-purple-50 to-indigo-50 text-purple-700 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 transition-all shadow-2xs cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-purple-600" />
        <span className="text-[10px] font-bold">AI Cover</span>
      </button>

      {/* Divider */}
      <div className="w-8 h-[1px] bg-slate-200 my-0.5" />

      {/* 9. 3D Book Mockup Studio */}
      <button
        type="button"
        id="tool-btn-3d-mockup"
        onClick={() => {
          onOpen3DMockupModal();
        }}
        title="Generate Photorealistic 3D Paperback Mockups"
        className="w-14 h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 transition-all shadow-2xs cursor-pointer"
      >
        <Box className="w-4 h-4 text-emerald-600" />
        <span className="text-[10px] font-bold">3D View</span>
      </button>

      {/* 10. KDP Barcode & Pre-Flight Inspector */}
      <button
        type="button"
        id="tool-btn-preflight-audit"
        onClick={() => {
          onOpenPreflightModal();
        }}
        title="KDP ISBN Barcode & Pre-Flight Compliance Inspector"
        className="w-14 h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all cursor-pointer"
      >
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span className="text-[10px] font-semibold text-center leading-tight">Barcode</span>
      </button>

      {/* Brand Kit Auto-Apply */}
      {onApplyBrandKit && (
        <button
          type="button"
          id="tool-btn-brand-kit"
          onClick={() => {
            onApplyBrandKit();
          }}
          title="Apply Author Brand Kit Colors & Fonts"
          className="w-14 h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-600 hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer"
        >
          <Palette className="w-4 h-4 text-purple-600" />
          <span className="text-[10px] font-semibold text-center leading-tight">Brand</span>
        </button>
      )}

      {/* 11. Dimensions / Cover Setup */}
      <button
        type="button"
        id="tool-btn-setup-modal"
        onClick={() => {
          onOpenSetupModal();
        }}
        title="Adjust Trim Size, Pages & Paper Stock"
        className="w-14 h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer mt-auto"
      >
        <Settings2 className="w-4 h-4" />
        <span className="text-[10px] font-semibold">Setup</span>
      </button>
    </aside>
  );
};
