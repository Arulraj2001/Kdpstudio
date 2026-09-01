import React from 'react';
import {
  KdpFormatSettings,
  TrimSizeOption,
  FontOption,
  FontSizeOption,
  LineSpacingOption,
  MarginPresetOption,
  PaperColorOption,
  InteriorColorOption,
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
  Info,
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
  const handleTrimChange = (val: TrimSizeOption) => {
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
    onUpdateSettings({ trimSize: val, trimWidth: width, trimHeight: height });
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
    }
  };

  return (
    <aside className="w-full lg:w-[280px] shrink-0 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
      {/* 1. Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <Sliders size={18} className="text-purple-600" />
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          KDP Print Settings
        </h2>
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
          </select>
        </div>

        {/* Font Family */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700">Body Font</label>
          <select
            value={settings.font}
            onChange={(e) => onUpdateSettings({ font: e.target.value as FontOption })}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
          >
            <option value="Georgia">Georgia (Clean Serif)</option>
            <option value="Garamond">Garamond (Classic Editorial)</option>
            <option value="Times New Roman">Times New Roman (Academic)</option>
            <option value="Palatino">Palatino (High Legibility)</option>
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
          </select>
        </div>

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

      {/* 3. Content Feature Toggles */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
          Workbook & Style Toggles
        </h3>

        <div className="space-y-2 text-xs">
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
        </div>
      </div>

      {/* 4. KDP Metadata (Auto-Extracted, Editable) */}
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

      {/* 5. KDP Compliance Checklist */}
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
        const spineMultiplier = settings.paperColor === 'cream' ? 0.0025 : 0.002252;
        const spineWidth = stats.estimatedPages > 0 ? (stats.estimatedPages * spineMultiplier).toFixed(3) : '0.000';

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
                  Pages: ~{stats.estimatedPages} (Spine width: {spineWidth}" on {settings.paperColor})
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

      {/* 6. Chapter Quick Navigator */}
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
