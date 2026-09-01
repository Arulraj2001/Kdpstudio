import React, { useState } from 'react';
import {
  KdpFormatSettings,
  TrimSizeOption,
  FontOption,
  HeadingFontOption,
  FontSizeOption,
  LineSpacingOption,
  MarginPresetOption,
  PaperColorOption,
  InteriorColorOption,
  BleedOption,
  BindingTypeOption,
  AccentThemeOption,
  FormatterStats,
  ChapterNavNode,
} from '../../types/formatter';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronDown,
  Info,
  Zap,
  Palette,
  Calculator,
  Compass,
} from 'lucide-react';

interface FormatterSettingsPanelProps {
  settings: KdpFormatSettings;
  onUpdateSettings: (newPartial: Partial<KdpFormatSettings>) => void;
  stats: FormatterStats;
  chapterNodes: ChapterNavNode[];
  onSelectChapter: (blockIndex: number) => void;
}

export const FormatterSettingsPanel: React.FC<FormatterSettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  stats,
  chapterNodes,
  onSelectChapter,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTrimChange = (val: TrimSizeOption) => {
    if (val === 'custom') {
      onUpdateSettings({
        trimSize: 'custom',
        isCustomTrim: true,
      });
      return;
    }
    let width = 7;
    let height = 10;
    if (val === '6x9') {
      width = 6;
      height = 9;
    } else if (val === '5.5x8.5') {
      width = 5.5;
      height = 8.5;
    } else if (val === '8.5x11') {
      width = 8.5;
      height = 11;
    }
    onUpdateSettings({ trimSize: val, trimWidth: width, trimHeight: height, isCustomTrim: false });
  };

  const handleFontSizeChange = (val: FontSizeOption) => {
    const halfPoints = val === '10pt' ? 20 : val === '12pt' ? 24 : 22;
    onUpdateSettings({ fontSizeLabel: val, fontSize: halfPoints });
  };

  const handleLineSpacingChange = (val: LineSpacingOption) => {
    const value = val === '1.0' ? 240 : val === '1.2' ? 288 : val === '1.5' ? 360 : 276;
    onUpdateSettings({ lineSpacing: val, lineSpacingValue: value });
  };

  const handleMarginPresetChange = (val: MarginPresetOption) => {
    if (val === 'workbook') {
      onUpdateSettings({
        marginPreset: val,
        margins: { inside: 0.75, outside: 0.625, top: 0.75, bottom: 0.75 },
      });
    } else if (val === 'standard') {
      onUpdateSettings({
        marginPreset: val,
        margins: { inside: 0.75, outside: 0.5, top: 0.75, bottom: 0.75 },
      });
    } else if (val === 'minimal') {
      onUpdateSettings({
        marginPreset: val,
        margins: { inside: 0.625, outside: 0.5, top: 0.5, bottom: 0.5 },
      });
    } else if (val === 'custom') {
      onUpdateSettings({ marginPreset: 'custom' });
    }
  };

  // Spine and Cover Spread Math calculations per official Amazon KDP formulas
  const pages = Math.max(24, stats.estimatedPages || 185);
  const paperMultiplier = settings.paperColor === 'cream' ? 0.0025 : 0.002252;
  const hardcoverWrap = settings.bindingType === 'hardcover' ? 0.06 : 0;
  const spineWidthInches = Number((pages * paperMultiplier + hardcoverWrap).toFixed(3));
  const bleedAllowance = settings.bleed === '0.125' ? 0.125 : 0;
  const fullCoverWidth = Number((2 * settings.trimWidth + spineWidthInches + 2 * bleedAllowance).toFixed(3));
  const fullCoverHeight = Number((settings.trimHeight + 2 * bleedAllowance).toFixed(3));

  return (
    <aside className="w-full lg:w-[280px] shrink-0 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-purple-600" />
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            KDP Print Settings
          </h2>
        </div>
      </div>

      {/* 2. Format Selectors */}
      <div className="space-y-3.5 text-xs">
        {/* Trim Size */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center justify-between">
            <span>Trim Size</span>
            <span className="text-[10px] text-purple-600 font-mono font-bold">
              {settings.trimWidth}" × {settings.trimHeight}"
            </span>
          </label>
          <select
            value={settings.trimSize}
            onChange={(e) => handleTrimChange(e.target.value as TrimSizeOption)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
          >
            <option value="7x10">7" × 10" (Workbook / Standard)</option>
            <option value="6x9">6" × 9" (Trade Paperback)</option>
            <option value="5.5x8.5">5.5" × 8.5" (Fiction / Digest)</option>
            <option value="8.5x11">8.5" × 11" (Large Manual / Ledger)</option>
            <option value="custom">Custom Dimensions...</option>
          </select>
        </div>

        {/* Custom Trim Width / Height if selected */}
        {settings.trimSize === 'custom' && (
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-purple-50/60 border border-purple-200">
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-purple-950">Width (in)</label>
              <input
                type="number"
                step="0.125"
                min="4"
                max="12"
                value={settings.trimWidth}
                onChange={(e) => onUpdateSettings({ trimWidth: parseFloat(e.target.value) || 7 })}
                className="w-full px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs font-mono font-bold text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-purple-950">Height (in)</label>
              <input
                type="number"
                step="0.125"
                min="6"
                max="14"
                value={settings.trimHeight}
                onChange={(e) => onUpdateSettings({ trimHeight: parseFloat(e.target.value) || 10 })}
                className="w-full px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs font-mono font-bold text-slate-800"
              />
            </div>
          </div>
        )}

        {/* Font Family Pairing */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700">Body Font</label>
          <select
            value={settings.font}
            onChange={(e) => onUpdateSettings({ font: e.target.value as FontOption })}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
          >
            <option value="Garamond">Garamond (Classic Editorial)</option>
            <option value="Georgia">Georgia (Clean Serif)</option>
            <option value="Times New Roman">Times New Roman (Academic)</option>
            <option value="Palatino">Palatino (High Legibility)</option>
          </select>
        </div>

        {/* Heading Font Pairing */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700">Heading Font</label>
          <select
            value={settings.headingFont || 'Cinzel'}
            onChange={(e) => onUpdateSettings({ headingFont: e.target.value as HeadingFontOption })}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
          >
            <option value="Cinzel">Cinzel (Regal Display)</option>
            <option value="Playfair Display">Playfair Display (Editorial Serif)</option>
            <option value="Montserrat">Montserrat (Clean Modern Sans)</option>
            <option value="Georgia">Georgia (Serif)</option>
          </select>
        </div>

        {/* Font Size & Line Spacing Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Font Size</label>
            <select
              value={settings.fontSizeLabel}
              onChange={(e) => handleFontSizeChange(e.target.value as FontSizeOption)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              <option value="10pt">10pt</option>
              <option value="11pt">11pt (Recommended)</option>
              <option value="12pt">12pt</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Line Spacing</label>
            <select
              value={settings.lineSpacing}
              onChange={(e) => handleLineSpacingChange(e.target.value as LineSpacingOption)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              <option value="1.0">1.0 (Compact)</option>
              <option value="1.15">1.15 (Standard)</option>
              <option value="1.2">1.2 (Relaxed)</option>
              <option value="1.5">1.5 (Large Print)</option>
            </select>
          </div>
        </div>

        {/* Margin Preset */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700">Margin Preset</label>
          <select
            value={settings.marginPreset}
            onChange={(e) => handleMarginPresetChange(e.target.value as MarginPresetOption)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
          >
            <option value="workbook">KDP Workbook (Inside 0.75", Out 0.625")</option>
            <option value="standard">KDP Standard (Inside 0.75", Out 0.50")</option>
            <option value="minimal">KDP Minimal (Inside 0.625", Out 0.50")</option>
            <option value="custom">Custom Precision Margins...</option>
          </select>
        </div>

        {/* Custom Precision Margins Inputs */}
        {settings.marginPreset === 'custom' && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-[11px]">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700">Inside (Gutter)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.375"
                  max="1.5"
                  value={settings.margins.inside}
                  onChange={(e) =>
                    onUpdateSettings({
                      margins: { ...settings.margins, inside: parseFloat(e.target.value) || 0.75 },
                    })
                  }
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Outside</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.25"
                  max="1.5"
                  value={settings.margins.outside}
                  onChange={(e) =>
                    onUpdateSettings({
                      margins: { ...settings.margins, outside: parseFloat(e.target.value) || 0.625 },
                    })
                  }
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700">Top</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.375"
                  max="1.5"
                  value={settings.margins.top}
                  onChange={(e) =>
                    onUpdateSettings({
                      margins: { ...settings.margins, top: parseFloat(e.target.value) || 0.75 },
                    })
                  }
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Bottom</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.375"
                  max="1.5"
                  value={settings.margins.bottom}
                  onChange={(e) =>
                    onUpdateSettings({
                      margins: { ...settings.margins, bottom: parseFloat(e.target.value) || 0.75 },
                    })
                  }
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Paper & Interior Color */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Paper Color</label>
            <select
              value={settings.paperColor}
              onChange={(e) => onUpdateSettings({ paperColor: e.target.value as PaperColorOption })}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              <option value="white">White</option>
              <option value="cream">Cream</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Interior Ink</label>
            <select
              value={settings.interiorColor}
              onChange={(e) => onUpdateSettings({ interiorColor: e.target.value as InteriorColorOption })}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              <option value="bw">Black & White</option>
              <option value="color">Standard Color</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Advanced KDP Print Settings (Collapsible) */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between py-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-purple-600" />
            <span>Advanced KDP Settings &amp; Spine</span>
          </div>
          {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {showAdvanced && (
          <div className="mt-2.5 space-y-3 p-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs">
            {/* Bleed & Binding */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bleed</label>
                <select
                  value={settings.bleed || 'none'}
                  onChange={(e) => onUpdateSettings({ bleed: e.target.value as BleedOption })}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 text-[11px]"
                >
                  <option value="none">No Bleed</option>
                  <option value="0.125">Bleed (+0.125")</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Binding</label>
                <select
                  value={settings.bindingType || 'paperback'}
                  onChange={(e) => onUpdateSettings({ bindingType: e.target.value as BindingTypeOption })}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 text-[11px]"
                >
                  <option value="paperback">Paperback</option>
                  <option value="hardcover">Hardcover (+0.06")</option>
                </select>
              </div>
            </div>

            {/* Brand Accent Palette */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Palette size={12} className="text-purple-600" />
                <span>Box Accent Theme</span>
              </label>
              <select
                value={settings.accentTheme || 'teal'}
                onChange={(e) => onUpdateSettings({ accentTheme: e.target.value as AccentThemeOption })}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 text-[11px]"
              >
                <option value="teal">Deep Teal (#0F766E - Clinical / Workbook)</option>
                <option value="purple">Royal Purple (#7C3AED - KDP Brand)</option>
                <option value="navy">Navy Slate (#1E3A8A - Academic / Business)</option>
                <option value="burgundy">Burgundy (#991B1B - Editorial)</option>
                <option value="charcoal">Executive Charcoal (#334155)</option>
                <option value="green">Forest Green (#166534 - Health)</option>
              </select>
            </div>

            {/* Live KDP Spine & Cover Spread Math Widget */}
            <div className="pt-2 border-t border-purple-200/80 space-y-1 text-[10.5px]">
              <div className="font-bold text-purple-900 flex items-center gap-1">
                <Calculator size={12} />
                <span>KDP Cover Spread Dimensions</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-purple-200 font-mono space-y-0.5 text-slate-700">
                <div>Spine Width: <strong className="text-purple-700">{spineWidthInches}"</strong> ({(spineWidthInches * 25.4).toFixed(1)}mm)</div>
                <div>Full Cover: <strong className="text-slate-900">{fullCoverWidth}" × {fullCoverHeight}"</strong></div>
                <div className="text-[9.5px] text-slate-500 font-sans mt-1">
                  Barcode zone: 2.0" × 1.2" on lower right back.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Content Feature Toggles (Categorized) */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
          Workbook &amp; Style Toggles
        </h3>

        {/* Group A: Container Elements */}
        <div className="space-y-2 text-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
            Workbook Elements
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.formatExerciseBoxes}
              onChange={(e) => onUpdateSettings({ formatExerciseBoxes: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">Exercise boxes (EXERCISE X.X:)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.formatScenarioBlocks}
              onChange={(e) => onUpdateSettings({ formatScenarioBlocks: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">Scenario blocks (SCENARIO A/B:)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.formatModelResponses}
              onChange={(e) => onUpdateSettings({ formatModelResponses: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">Model responses (MODEL RESPONSE:)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.formatDebriefBlocks}
              onChange={(e) => onUpdateSettings({ formatDebriefBlocks: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">Debrief blocks (DEBRIEF:)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.formatReflectionPrompts}
              onChange={(e) => onUpdateSettings({ formatReflectionPrompts: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">Reflection prompts (REFLECTION PROMPT:)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.formatActionPlans ?? true}
              onChange={(e) => onUpdateSettings({ formatActionPlans: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">Action plans &amp; checklists (ACTION PLAN:)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.formatKeyTakeaways ?? true}
              onChange={(e) => onUpdateSettings({ formatKeyTakeaways: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">Key takeaways (KEY TAKEAWAYS:)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.formatCalloutBoxes ?? true}
              onChange={(e) => onUpdateSettings({ formatCalloutBoxes: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">Pull quotes &amp; blockquotes (&gt; quote)</span>
          </label>
        </div>

        {/* Group B: Typesetting & Layout */}
        <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
            Typesetting &amp; Layout
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.addWritingLines}
              onChange={(e) => onUpdateSettings({ addWritingLines: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">Add writing lines to blank spaces</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.chapterPageBreaks}
              onChange={(e) => onUpdateSettings({ chapterPageBreaks: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">New page for each chapter (H2)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.generateTocPlaceholder}
              onChange={(e) => onUpdateSettings({ generateTocPlaceholder: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">Generate table of contents placeholder</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.headerFooterFolios ?? true}
              onChange={(e) => onUpdateSettings({ headerFooterFolios: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">Running headers &amp; page folios</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.ornamentalDividers ?? false}
              onChange={(e) => onUpdateSettings({ ornamentalDividers: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">Ornamental dividers (✦ ✦ ✦)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.paragraphIndent ?? false}
              onChange={(e) => onUpdateSettings({ paragraphIndent: e.target.checked })}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-700 font-medium">First-line paragraph indent (0.25")</span>
          </label>
        </div>
      </div>

      {/* 5. KDP Metadata */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
          KDP Metadata
        </h3>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600">Title</label>
          <input
            type="text"
            value={settings.title}
            onChange={(e) => onUpdateSettings({ title: e.target.value })}
            placeholder="Book Title"
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-1 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600">Subtitle</label>
          <input
            type="text"
            value={settings.subtitle}
            onChange={(e) => onUpdateSettings({ subtitle: e.target.value })}
            placeholder="Book Subtitle (Optional)"
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600">Author Name</label>
          <input
            type="text"
            value={settings.author}
            onChange={(e) => onUpdateSettings({ author: e.target.value })}
            placeholder="Author / Pen Name"
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 6. KDP Compliance Checklist */}
      {(() => {
        const requiredGutter =
          stats.estimatedPages > 500
            ? 0.875
            : stats.estimatedPages > 300
            ? 0.75
            : stats.estimatedPages > 150
            ? 0.625
            : 0.5;
        const isGutterValid = settings.margins.inside >= requiredGutter;

        return (
          <div className="pt-3 border-t border-slate-100 space-y-2 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-[11px]">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>KDP Compliance Checklist</span>
            </h3>

            <ul className="space-y-1 text-slate-600">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Trim size: {settings.trimSize} ({settings.trimWidth}" × {settings.trimHeight}")</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className={isGutterValid ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                  {isGutterValid ? '✓' : '⚠'}
                </span>
                <span>
                  Inside gutter: {settings.margins.inside}" (≥ {requiredGutter}" required)
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Font: {settings.font} (100% embeddable)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-amber-600 font-bold">⚠</span>
                <span>
                  Pages: ~{stats.estimatedPages} (Spine width: {spineWidthInches}" on {settings.paperColor})
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{settings.interiorColor === 'bw' ? 'B&W Interior' : 'Color Interior'} selected</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>File size within KDP 650MB limit</span>
              </li>
            </ul>
          </div>
        );
      })()}

      {/* 7. Chapter Quick Navigator */}
      {chapterNodes.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={13} className="text-purple-600" />
              <span>Chapter Navigator</span>
            </h3>
            <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded">
              {chapterNodes.length}
            </span>
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-1">
            {chapterNodes.map((node) => (
              <button
                key={node.id}
                onClick={() => onSelectChapter(node.blockIndex)}
                className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-purple-50 text-slate-700 hover:text-purple-900 flex items-center justify-between group transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded shrink-0 ${
                      node.type === 'part'
                        ? 'bg-purple-100 text-purple-800'
                        : node.type === 'front_matter'
                        ? 'bg-slate-200/70 text-slate-600'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    {node.type === 'part' ? 'PART' : node.type === 'front_matter' ? 'FM' : 'CH'}
                  </span>
                  <span className="truncate font-medium">{node.title}</span>
                </div>
                <ChevronRight size={12} className="text-slate-400 group-hover:text-purple-600 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
