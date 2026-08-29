import React, { useState, useMemo, useEffect } from 'react';
import { useBookStore } from '../../lib/store';
import { FormatterSettingsPanel } from './FormatterSettingsPanel';
import { FormatterLivePreview } from './FormatterLivePreview';
import { FormatterExportBar } from './FormatterExportBar';
import {
  getMargins,
  getSpineWidth,
  getCoverDimensions,
  getTrimDimensions,
  estimatePageCount,
} from '../../lib/kdp';
import {
  Book,
  TrimSize,
  PaperType,
  FormatterSettings,
  Margins,
  TrimDimensions,
} from '../../types/index';
import { Sliders, Eye, FileSpreadsheet, Sparkles } from 'lucide-react';

export const FormatterView: React.FC = () => {
  const books = useBookStore((state) => state.books);
  const currentBook = useBookStore((state) => state.currentBook);
  const setCurrentBook = useBookStore((state) => state.setCurrentBook);

  // Selected book state
  const [selectedBookId, setSelectedBookId] = useState<string | null>(() => {
    if (currentBook) return currentBook.id;
    if (books.length > 0) return books[0].id;
    return null;
  });

  const activeBook = books.find((b) => b.id === selectedBookId) || currentBook || books[0] || null;

  // Custom text mode state
  const [isCustomTextMode, setIsCustomTextMode] = useState(false);
  const [customText, setCustomText] = useState(
    `Chapter 1: The First Steps\n\nThe morning light broke across the distant valley, casting long golden silhouettes against the ancient stone walls. Every detail seemed sharper today, as if the entire world had been waiting for this exact moment.\n\nHe stepped forward, checking his notes one final time. There was no turning back now. The path ahead would test every assumption he had carried for the past decade.\n\nDeep within the archive, the faint scent of aged parchment lingered. It was a reminder of all the scholars who had stood in this exact chamber before him, searching for answers to the very same mystery.`
  );

  // Formatter Settings State
  const [settings, setSettings] = useState<FormatterSettings>(() => ({
    fontFamily: 'Garamond',
    fontSize: '11pt',
    lineSpacing: '1.5',
    paragraphIndent: '0.25in',
    dropCaps: true,
    trimSize: activeBook?.trimSize || '6x9',
    paperType: activeBook?.paperType || 'white',
    pageNumberPosition: 'bottom-center',
    chapterStart: 'always-new-page',
    runningHeader: 'book-title',
    includedSections: {
      titlePage: activeBook?.frontMatter?.titlePage ?? true,
      copyright: activeBook?.frontMatter?.copyrightPage ?? true,
      dedication: !!activeBook?.frontMatter?.dedication,
      toc: activeBook?.frontMatter?.tableOfContents ?? true,
      preface: !!activeBook?.frontMatter?.preface,
      chapters: true,
      aboutAuthor: !!activeBook?.backMatter?.aboutAuthor,
    },
  }));

  // Sync settings when active book changes
  useEffect(() => {
    if (activeBook) {
      setSettings((prev) => ({
        ...prev,
        trimSize: activeBook.trimSize || prev.trimSize,
        paperType: activeBook.paperType || prev.paperType,
        includedSections: {
          ...prev.includedSections,
          titlePage: activeBook.frontMatter?.titlePage ?? true,
          copyright: activeBook.frontMatter?.copyrightPage ?? true,
          dedication: !!activeBook.frontMatter?.dedication,
          toc: activeBook.frontMatter?.tableOfContents ?? true,
          preface: !!activeBook.frontMatter?.preface,
          aboutAuthor: !!activeBook.backMatter?.aboutAuthor,
        },
      }));
    }
  }, [activeBook?.id]);

  const handleSelectBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setCurrentBook(bookId);
  };

  const handleUpdateSettings = (newPartial: Partial<FormatterSettings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }));
  };

  // Calculate total words in current book or custom text
  const totalWordCount = useMemo(() => {
    if (isCustomTextMode) {
      return customText.split(/\s+/).filter(Boolean).length;
    }
    if (!activeBook) return 1000;
    const chaptersWordCount = activeBook.chapters.reduce(
      (sum, c) => sum + (c.wordCount || c.content.split(/\s+/).filter(Boolean).length),
      0
    );
    const prefaceWords = activeBook.frontMatter?.preface
      ? activeBook.frontMatter.preface.split(/\s+/).filter(Boolean).length
      : 0;
    const authorWords = activeBook.backMatter?.aboutAuthor
      ? activeBook.backMatter.aboutAuthor.split(/\s+/).filter(Boolean).length
      : 0;
    return Math.max(500, chaptersWordCount + prefaceWords + authorWords);
  }, [isCustomTextMode, customText, activeBook]);

  // Recalculate KDP specifications
  const estimatedPages = useMemo(() => {
    return estimatePageCount(totalWordCount, settings.trimSize, settings.fontSize);
  }, [totalWordCount, settings.trimSize, settings.fontSize]);

  const calculatedMargins: Margins = useMemo(() => {
    return getMargins(
      settings.trimSize,
      estimatedPages,
      settings.pageNumberPosition !== 'none'
    );
  }, [settings.trimSize, estimatedPages, settings.pageNumberPosition]);

  const calculatedSpine = useMemo(() => {
    return getSpineWidth(estimatedPages, settings.paperType);
  }, [estimatedPages, settings.paperType]);

  const coverDimensions = useMemo(() => {
    return getCoverDimensions(settings.trimSize, estimatedPages, settings.paperType);
  }, [settings.trimSize, estimatedPages, settings.paperType]);

  const trimDimensions: TrimDimensions = useMemo(() => {
    return getTrimDimensions(settings.trimSize);
  }, [settings.trimSize]);

  // Combined Book representation with custom text if applicable
  const previewBook: Book | null = useMemo(() => {
    if (!activeBook) return null;
    if (isCustomTextMode) {
      return {
        ...activeBook,
        chapters: [
          {
            id: 'custom-preview',
            title: activeBook.title || 'Manuscript',
            content: customText,
            order: 0,
            wordCount: totalWordCount,
          },
        ],
      };
    }
    return activeBook;
  }, [activeBook, isCustomTextMode, customText, totalWordCount]);

  return (
    <div id="interior-formatter-view" className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1a1a2e] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
              Interior Formatter
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              KDP Print Layout & Typesetting
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Format your manuscript for Amazon KDP paperback distribution with exact spine, gutter margins, running headers, and drop caps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-xs font-semibold text-gray-900 dark:text-white">
              {activeBook?.title || 'Selected Project'}
            </div>
            <div className="text-[11px] text-gray-400 font-mono">
              {settings.trimSize} • {settings.paperType.toUpperCase()} • ~{estimatedPages} pages
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Panel Layout: Left 35% Settings | Right 65% Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[750px]">
        {/* Left Settings Panel (35% -> lg:col-span-4 or 5) */}
        <aside className="lg:col-span-5 xl:col-span-4 h-full">
          <FormatterSettingsPanel
            books={books}
            selectedBookId={selectedBookId}
            onSelectBook={handleSelectBook}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            isCustomTextMode={isCustomTextMode}
            setIsCustomTextMode={setIsCustomTextMode}
            customText={customText}
            setCustomText={setCustomText}
            calculatedMargins={calculatedMargins}
            estimatedPages={estimatedPages}
            calculatedSpine={calculatedSpine}
            coverDimensions={coverDimensions}
            onRecalculate={() => {}}
          />
        </aside>

        {/* Right Live Preview (65% -> lg:col-span-7 or 8) */}
        <main className="lg:col-span-7 xl:col-span-8 min-h-[650px] flex flex-col">
          <FormatterLivePreview
            book={previewBook}
            settings={{
              ...settings,
              customText: isCustomTextMode ? customText : undefined,
            }}
            margins={calculatedMargins}
            trimDimensions={trimDimensions}
            estimatedPages={estimatedPages}
          />
        </main>
      </div>

      {/* Bottom Export Bar */}
      <footer className="pt-2">
        <FormatterExportBar
          book={previewBook}
          settings={{
            ...settings,
            customText: isCustomTextMode ? customText : undefined,
          }}
          margins={calculatedMargins}
          trimDimensions={trimDimensions}
          estimatedPages={estimatedPages}
        />
      </footer>
    </div>
  );
};
