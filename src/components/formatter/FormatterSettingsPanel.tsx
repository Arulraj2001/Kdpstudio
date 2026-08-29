import React from 'react';
import {
  BookOpen,
  Type,
  LayoutGrid,
  CheckSquare,
  Calculator,
  FileText,
  Sliders,
  AlignLeft,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Book,
  TrimSize,
  PaperType,
  FormatterFontFamily,
  FormatterFontSize,
  FormatterLineSpacing,
  FormatterParagraphIndent,
  PageNumberPosition,
  ChapterStart,
  RunningHeaderType,
  FormatterSettings,
  Margins,
} from '../../types/index';

interface FormatterSettingsPanelProps {
  books: Book[];
  selectedBookId: string | null;
  onSelectBook: (bookId: string) => void;
  settings: FormatterSettings;
  onUpdateSettings: (newSettings: Partial<FormatterSettings>) => void;
  isCustomTextMode: boolean;
  setIsCustomTextMode: (val: boolean) => void;
  customText: string;
  setCustomText: (text: string) => void;
  calculatedMargins: Margins;
  estimatedPages: number;
  calculatedSpine: number;
  coverDimensions: {
    totalWidth: number;
    totalHeight: number;
    spineWidth: number;
    bleed: number;
  };
  onRecalculate: () => void;
}

export const FormatterSettingsPanel: React.FC<FormatterSettingsPanelProps> = ({
  books,
  selectedBookId,
  onSelectBook,
  settings,
  onUpdateSettings,
  isCustomTextMode,
  setIsCustomTextMode,
  customText,
  setCustomText,
  calculatedMargins,
  estimatedPages,
  calculatedSpine,
  coverDimensions,
  onRecalculate,
}) => {
  const fontFamilies: FormatterFontFamily[] = [
    'Garamond',
    'Times New Roman',
    'Georgia',
    'Palatino',
    'Book Antiqua',
  ];

  const fontSizes: FormatterFontSize[] = ['10pt', '11pt', '12pt'];
  const lineSpacings: FormatterLineSpacing[] = ['1.0', '1.15', '1.5', '2.0'];
  const indents: { value: FormatterParagraphIndent; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: '0.25in', label: '0.25"' },
    { value: '0.5in', label: '0.5"' },
  ];

  const trimSizes: { value: TrimSize; label: string; desc: string }[] = [
    { value: '5x8', label: '5" × 8"', desc: 'Fiction / Novellas' },
    { value: '5.5x8.5', label: '5.5" × 8.5"', desc: 'Memoirs & Trade' },
    { value: '6x9', label: '6" × 9"', desc: 'Standard Non-Fiction' },
    { value: '8.5x11', label: '8.5" × 11"', desc: 'Workbooks / Manuals' },
  ];

  return (
    <div className="space-y-6 text-sm text-gray-800 dark:text-gray-200">
      {/* SECTION 1: BOOK SELECTION */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-900 dark:text-white">
          <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>1. Book Selection</span>
        </div>

        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800/80 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setIsCustomTextMode(false)}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              !isCustomTextMode
                ? 'bg-white dark:bg-[#131320] text-purple-600 dark:text-purple-300 font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            From Manuscript Store
          </button>
          <button
            type="button"
            onClick={() => setIsCustomTextMode(true)}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              isCustomTextMode
                ? 'bg-white dark:bg-[#131320] text-purple-600 dark:text-purple-300 font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            Paste Raw Text
          </button>
        </div>

        {!isCustomTextMode ? (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Select Book Project
            </label>
            <div className="relative">
              <select
                id="select-book-project"
                value={selectedBookId || ''}
                onChange={(e) => onSelectBook(e.target.value)}
                className="w-full appearance-none px-3 py-2 bg-gray-50 dark:bg-[#131320] border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.trimSize} ({b.chapters.length} chapters)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Paste Raw Book Content
            </label>
            <textarea
              id="textarea-custom-content"
              rows={4}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste raw chapter text or sample prose here..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#131320] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 resize-y"
            />
          </div>
        )}
      </div>

      {/* SECTION 2: TYPOGRAPHY */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-900 dark:text-white">
          <Type className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>2. Typography</span>
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Book Font Family
          </label>
          <div className="relative">
            <select
              id="select-font-family"
              value={settings.fontFamily}
              onChange={(e) =>
                onUpdateSettings({ fontFamily: e.target.value as FormatterFontFamily })
              }
              className="w-full appearance-none px-3 py-2 bg-gray-50 dark:bg-[#131320] border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              {fontFamilies.map((font) => (
                <option key={font} value={font}>
                  {font} (Classic Serif)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Font Size (Radio Group) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Body Font Size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {fontSizes.map((size) => (
              <button
                key={size}
                type="button"
                id={`btn-size-${size}`}
                onClick={() => onUpdateSettings({ fontSize: size })}
                className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                  settings.fontSize === size
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Line Spacing (Radio Group) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Line Spacing (Leading)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {lineSpacings.map((spacing) => (
              <button
                key={spacing}
                type="button"
                id={`btn-spacing-${spacing}`}
                onClick={() => onUpdateSettings({ lineSpacing: spacing })}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                  settings.lineSpacing === spacing
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {spacing}x
              </button>
            ))}
          </div>
        </div>

        {/* Paragraph Indentation */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            First-Line Paragraph Indent
          </label>
          <div className="grid grid-cols-3 gap-2">
            {indents.map((indent) => (
              <button
                key={indent.value}
                type="button"
                id={`btn-indent-${indent.value}`}
                onClick={() => onUpdateSettings({ paragraphIndent: indent.value })}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                  settings.paragraphIndent === indent.value
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {indent.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drop Caps Toggle */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-xs font-semibold text-gray-900 dark:text-white">
              Drop Caps on Chapter Opening
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">
              Large decorative initial letter for chapter first paragraphs
            </div>
          </div>
          <button
            type="button"
            id="toggle-drop-caps"
            onClick={() => onUpdateSettings({ dropCaps: !settings.dropCaps })}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              settings.dropCaps ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                settings.dropCaps ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* SECTION 3: LAYOUT */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-900 dark:text-white">
          <LayoutGrid className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>3. Trim Size & Layout</span>
        </div>

        {/* Trim Size */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Trim Size (Inches)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {trimSizes.map((t) => (
              <button
                key={t.value}
                type="button"
                id={`btn-trim-${t.value}`}
                onClick={() => onUpdateSettings({ trimSize: t.value })}
                className={`p-2 rounded-lg border text-left transition-all ${
                  settings.trimSize === t.value
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="text-xs font-bold">{t.label}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  {t.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Paper Type */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Interior Paper Stock
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="btn-paper-white"
              onClick={() => onUpdateSettings({ paperType: 'white' })}
              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                settings.paperType === 'white'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white border border-gray-300 shadow-xs shrink-0" />
              <div>
                <div className="text-xs font-semibold">White Paper</div>
                <div className="text-[10px] text-gray-500">Standard crisp</div>
              </div>
            </button>

            <button
              type="button"
              id="btn-paper-cream"
              onClick={() => onUpdateSettings({ paperType: 'cream' })}
              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                settings.paperType === 'cream'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-[#fbf7ee] border border-amber-300 shadow-xs shrink-0" />
              <div>
                <div className="text-xs font-semibold">Cream Paper</div>
                <div className="text-[10px] text-gray-500">Fiction favorite</div>
              </div>
            </button>
          </div>
        </div>

        {/* Page Numbers Position */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Page Numbers Position
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'bottom-center' as PageNumberPosition, label: 'Bottom Center' },
              { value: 'bottom-outer' as PageNumberPosition, label: 'Bottom Outer' },
              { value: 'none' as PageNumberPosition, label: 'None' },
            ].map((p) => (
              <button
                key={p.value}
                type="button"
                id={`btn-pagenum-${p.value}`}
                onClick={() => onUpdateSettings({ pageNumberPosition: p.value })}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                  settings.pageNumberPosition === p.value
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chapter Start */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Chapter Start
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'always-new-page' as ChapterStart, label: 'Always New Page' },
              { value: 'same-page' as ChapterStart, label: 'Continuous' },
            ].map((c) => (
              <button
                key={c.value}
                type="button"
                id={`btn-chapterstart-${c.value}`}
                onClick={() => onUpdateSettings({ chapterStart: c.value })}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                  settings.chapterStart === c.value
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Running Header */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Running Header (Top of Page)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'none' as RunningHeaderType, label: 'None' },
              { value: 'book-title' as RunningHeaderType, label: 'Book Title' },
              { value: 'chapter-name' as RunningHeaderType, label: 'Chapter Name' },
            ].map((h) => (
              <button
                key={h.value}
                type="button"
                id={`btn-header-${h.value}`}
                onClick={() => onUpdateSettings({ runningHeader: h.value })}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                  settings.runningHeader === h.value
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: SECTIONS TO INCLUDE */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-900 dark:text-white">
          <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>4. Sections to Include</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { key: 'titlePage', label: 'Title Page' },
            { key: 'copyright', label: 'Copyright Page' },
            { key: 'dedication', label: 'Dedication' },
            { key: 'toc', label: 'Table of Contents' },
            { key: 'preface', label: 'Preface' },
            { key: 'chapters', label: 'Chapters / Body' },
            { key: 'aboutAuthor', label: 'About Author' },
          ].map((sec) => (
            <label
              key={sec.key}
              className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer"
            >
              <input
                type="checkbox"
                id={`check-section-${sec.key}`}
                checked={
                  settings.includedSections[sec.key as keyof typeof settings.includedSections]
                }
                onChange={(e) =>
                  onUpdateSettings({
                    includedSections: {
                      ...settings.includedSections,
                      [sec.key]: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              />
              <span className="font-medium text-gray-700 dark:text-gray-300">{sec.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* CALCULATE LAYOUT & SPEC SUMMARY */}
      <div className="bg-purple-50/60 dark:bg-purple-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800/50 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-purple-900 dark:text-purple-200 text-xs uppercase tracking-wider">
            <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>KDP Layout Spec Sheet</span>
          </div>

          <button
            type="button"
            onClick={onRecalculate}
            className="px-2.5 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-xs transition-colors"
          >
            Recalculate
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-white dark:bg-[#131320] rounded-lg border border-purple-100 dark:border-purple-900/40">
            <div className="text-gray-500 dark:text-gray-400 text-[11px]">Estimated Pages</div>
            <div className="text-base font-bold text-gray-900 dark:text-white font-mono">
              {estimatedPages} pages
            </div>
            <div className="text-[10px] text-gray-400">Min 24 for KDP paperback</div>
          </div>

          <div className="p-2.5 bg-white dark:bg-[#131320] rounded-lg border border-purple-100 dark:border-purple-900/40">
            <div className="text-gray-500 dark:text-gray-400 text-[11px]">Spine Width</div>
            <div className="text-base font-bold text-purple-700 dark:text-purple-300 font-mono">
              {calculatedSpine}"
            </div>
            <div className="text-[10px] text-gray-400">
              {settings.paperType === 'cream' ? '0.0025"/page' : '0.002252"/page'}
            </div>
          </div>

          <div className="p-2.5 bg-white dark:bg-[#131320] rounded-lg border border-purple-100 dark:border-purple-900/40">
            <div className="text-gray-500 dark:text-gray-400 text-[11px]">Gutter (Inside) Margin</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white font-mono">
              {calculatedMargins.inside}"
            </div>
            <div className="text-[10px] text-gray-400">
              Out: {calculatedMargins.outside}" | Top/Bot: {calculatedMargins.top}" / {calculatedMargins.bottom}"
            </div>
          </div>

          <div className="p-2.5 bg-white dark:bg-[#131320] rounded-lg border border-purple-100 dark:border-purple-900/40">
            <div className="text-gray-500 dark:text-gray-400 text-[11px]">Cover Dimensions</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white font-mono">
              {coverDimensions.totalWidth}" × {coverDimensions.totalHeight}"
            </div>
            <div className="text-[10px] text-gray-400">Includes 0.125" bleed</div>
          </div>
        </div>
      </div>
    </div>
  );
};
