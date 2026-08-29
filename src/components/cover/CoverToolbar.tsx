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
} from 'lucide-react';

export type CoverToolType = 'select' | 'text' | 'shape' | 'image' | 'ai' | 'template';

interface CoverToolbarProps {
  activeTool: CoverToolType;
  setActiveTool: (tool: CoverToolType) => void;
  onAddText: (type: 'title' | 'subtitle' | 'author' | 'spine' | 'body') => void;
  onAddShape: (type: 'rect' | 'circle' | 'line' | 'barcode_placeholder') => void;
  onTriggerImageUpload: () => void;
  onOpenAiDrawer: () => void;
  onApplyKdpTemplate: () => void;
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
  onApplyKdpTemplate,
  onApplyBrandKit,
  onOpenSetupModal,
}) => {
  const [textMenuOpen, setTextMenuOpen] = React.useState(false);
  const [shapeMenuOpen, setShapeMenuOpen] = React.useState(false);

  return (
    <aside
      id="cover-left-toolbar"
      className="w-20 bg-white dark:bg-[#131320] border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-2 z-30 select-none shrink-0"
    >
      {/* Select Tool */}
      <button
        type="button"
        id="tool-btn-select"
        onClick={() => {
          setActiveTool('select');
          setTextMenuOpen(false);
          setShapeMenuOpen(false);
        }}
        title="Select & Move Objects (V)"
        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
          activeTool === 'select'
            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <MousePointer className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Select</span>
      </button>

      {/* Text Tool with Submenu */}
      <div className="relative">
        <button
          type="button"
          id="tool-btn-text"
          onClick={() => {
            setActiveTool('text');
            setTextMenuOpen(!textMenuOpen);
            setShapeMenuOpen(false);
          }}
          title="Add Text Elements (T)"
          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
            activeTool === 'text'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Type className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Text</span>
        </button>

        {textMenuOpen && (
          <div className="absolute left-16 top-0 ml-2 w-48 bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
            <div className="text-[10px] font-bold uppercase text-gray-400 px-2 py-1">Add Typography</div>
            <button
              type="button"
              onClick={() => {
                onAddText('title');
                setTextMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"
            >
              <Type className="w-4 h-4 text-purple-600" />
              <span>Book Title (Cover)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAddText('subtitle');
                setTextMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2"
            >
              <BookText className="w-4 h-4 text-purple-500" />
              <span>Subtitle</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAddText('author');
                setTextMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2"
            >
              <Type className="w-3.5 h-3.5 text-purple-400" />
              <span>Author Name</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAddText('spine');
                setTextMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-bold text-purple-600 dark:text-purple-300 flex items-center gap-2"
            >
              <AlignVerticalSpaceAround className="w-4 h-4 text-purple-600" />
              <span>Spine Title (Rotated)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAddText('body');
                setTextMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-normal text-gray-600 dark:text-gray-300 flex items-center gap-2"
            >
              <Type className="w-3 h-3 text-gray-400" />
              <span>Back Cover Blurb</span>
            </button>
          </div>
        )}
      </div>

      {/* Shape Tool with Submenu */}
      <div className="relative">
        <button
          type="button"
          id="tool-btn-shape"
          onClick={() => {
            setActiveTool('shape');
            setShapeMenuOpen(!shapeMenuOpen);
            setTextMenuOpen(false);
          }}
          title="Add Geometric Shapes (S)"
          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
            activeTool === 'shape'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Square className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Shapes</span>
        </button>

        {shapeMenuOpen && (
          <div className="absolute left-16 top-0 ml-2 w-48 bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
            <div className="text-[10px] font-bold uppercase text-gray-400 px-2 py-1">Shapes & Badges</div>
            <button
              type="button"
              onClick={() => {
                onAddShape('rect');
                setShapeMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2"
            >
              <Square className="w-4 h-4 text-purple-600" />
              <span>Rectangle / Card</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAddShape('circle');
                setShapeMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2"
            >
              <Circle className="w-4 h-4 text-purple-600" />
              <span>Circle / Badge</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAddShape('line');
                setShapeMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2"
            >
              <Minus className="w-4 h-4 text-purple-600" />
              <span>Divider Line</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAddShape('barcode_placeholder');
                setShapeMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-medium text-amber-600 dark:text-amber-300 flex items-center gap-2"
            >
              <LayoutTemplate className="w-4 h-4 text-amber-500" />
              <span>KDP Barcode Box</span>
            </button>
          </div>
        )}
      </div>

      {/* Image Upload */}
      <button
        type="button"
        id="tool-btn-image-upload"
        onClick={() => {
          onTriggerImageUpload();
          setTextMenuOpen(false);
          setShapeMenuOpen(false);
        }}
        title="Upload Image from Computer (I)"
        className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white transition-all"
      >
        <ImageIcon className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Image</span>
      </button>

      {/* AI Cover Generation */}
      <button
        type="button"
        id="tool-btn-ai-drawer"
        onClick={() => {
          onOpenAiDrawer();
          setTextMenuOpen(false);
          setShapeMenuOpen(false);
        }}
        title="Generate AI Art with Imagen / Gemini"
        className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-purple-500/10 to-amber-500/10 text-purple-600 dark:text-purple-300 hover:from-purple-500/20 hover:to-amber-500/20 border border-purple-200/50 dark:border-purple-800/50 transition-all shadow-xs"
      >
        <Sparkles className="w-5 h-5 text-purple-500" />
        <span className="text-[10px] font-bold">AI Cover</span>
      </button>

      {/* Divider */}
      <div className="w-8 h-[1px] bg-gray-200 dark:bg-gray-800 my-1" />

      {/* KDP Template Auto-Generator */}
      <button
        type="button"
        id="tool-btn-kdp-template"
        onClick={() => {
          onApplyKdpTemplate();
          setTextMenuOpen(false);
          setShapeMenuOpen(false);
        }}
        title="Generate Complete KDP Wrap-Around Layout Template"
        className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 transition-all"
      >
        <LayoutTemplate className="w-5 h-5" />
        <span className="text-[10px] font-semibold text-center leading-tight">Template</span>
      </button>

      {/* Brand Kit Auto-Apply */}
      {onApplyBrandKit && (
        <button
          type="button"
          id="tool-btn-brand-kit"
          onClick={() => {
            onApplyBrandKit();
            setTextMenuOpen(false);
            setShapeMenuOpen(false);
          }}
          title="Apply Author Brand Kit Colors & Fonts"
          className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 transition-all"
        >
          <Palette className="w-5 h-5 text-purple-600" />
          <span className="text-[10px] font-semibold text-center leading-tight">Brand Kit</span>
        </button>
      )}

      {/* Dimensions / Cover Setup */}
      <button
        type="button"
        id="tool-btn-setup-modal"
        onClick={() => {
          onOpenSetupModal();
          setTextMenuOpen(false);
          setShapeMenuOpen(false);
        }}
        title="Adjust Trim Size, Pages & Paper Stock"
        className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white transition-all mt-auto"
      >
        <Settings2 className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Setup</span>
      </button>
    </aside>
  );
};
