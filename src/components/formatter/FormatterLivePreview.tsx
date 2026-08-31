import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookOpen,
  Eye,
  FileText,
  Columns,
  Square,
} from 'lucide-react';
import { Book, FormatterSettings, Margins, TrimDimensions } from '../../types/index';
import { getFontFamilyStack } from '../../lib/bookHtmlGenerator';

interface FormatterLivePreviewProps {
  book: Book | null;
  settings: FormatterSettings;
  margins: Margins;
  trimDimensions: TrimDimensions;
  estimatedPages: number;
}

export const FormatterLivePreview: React.FC<FormatterLivePreviewProps> = ({
  book,
  settings,
  margins,
  trimDimensions,
  estimatedPages,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'single' | 'spread'>('single');
  const [zoomLevel, setZoomLevel] = useState(100);

  if (!book) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gray-100 dark:bg-[#0f0f17] rounded-xl border border-gray-200 dark:border-gray-800 text-center">
        <div>
          <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">No Book Loaded</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1">
            Select a manuscript project from the left panel to generate a live formatted KDP preview.
          </p>
        </div>
      </div>
    );
  }

  // Generate simulated pages from the book's sections
  interface PreviewPage {
    pageNumber: number;
    type: 'title' | 'copyright' | 'dedication' | 'toc' | 'preface' | 'chapter_start' | 'chapter_body' | 'about';
    title?: string;
    chapterNumber?: number;
    headerText?: string;
    content: string[];
    isFirstParagraph?: boolean;
  }

  const pages: PreviewPage[] = [];
  let pageCounter = 1;

  // 1. Title Page
  if (settings.includedSections.titlePage) {
    pages.push({
      pageNumber: pageCounter++,
      type: 'title',
      content: [],
    });
  }

  // 2. Copyright Page
  if (settings.includedSections.copyright) {
    pages.push({
      pageNumber: pageCounter++,
      type: 'copyright',
      content: [],
    });
  }

  // 3. Dedication Page
  if (settings.includedSections.dedication && book.frontMatter?.dedication) {
    pages.push({
      pageNumber: pageCounter++,
      type: 'dedication',
      content: [book.frontMatter.dedication],
    });
  }

  // 4. TOC Page
  if (settings.includedSections.toc && book.chapters.length > 0) {
    pages.push({
      pageNumber: pageCounter++,
      type: 'toc',
      content: book.chapters.map((c, i) => `${c.title || `Chapter ${i + 1}`}`),
    });
  }

  // 5. Preface
  if (settings.includedSections.preface && book.frontMatter?.preface) {
    const prefaceParas = book.frontMatter.preface
      .replace(/<[^>]*>/g, '')
      .split(/\n\s*\n/)
      .filter(Boolean);

    pages.push({
      pageNumber: pageCounter++,
      type: 'preface',
      headerText: settings.runningHeader === 'book-title' ? book.title : 'PREFACE',
      content: prefaceParas.slice(0, 4),
      isFirstParagraph: true,
    });
  }

  // 6. Chapters (or custom text)
  if (settings.includedSections.chapters) {
    if (settings.customText && settings.customText.trim()) {
      const paras = settings.customText.split(/\n\s*\n/).filter(Boolean);
      // Split into 2-3 preview pages
      const perPage = 3;
      for (let i = 0; i < paras.length && pages.length < 15; i += perPage) {
        pages.push({
          pageNumber: pageCounter++,
          type: i === 0 ? 'chapter_start' : 'chapter_body',
          chapterNumber: 1,
          title: book.title || 'Manuscript',
          headerText: settings.runningHeader === 'book-title' ? book.title : 'MANUSCRIPT',
          content: paras.slice(i, i + perPage),
          isFirstParagraph: i === 0,
        });
      }
    } else if (book.chapters && book.chapters.length > 0) {
      book.chapters.forEach((chap, idx) => {
        const cleanContent = chap.content
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<[^>]*>/g, '')
          .trim();

        const paras = cleanContent.split(/\n\s*\n/).filter(Boolean);
        const chapterParas = paras.length > 0 ? paras : [
          'The morning sunlight filtered through the sheer curtains, casting a pattern of soft geometric shadows against the wooden floorboards. Every detail seemed sharper today, as if the room itself were holding its breath in anticipation.',
          'He sat at the desk, reviewing the notes one final time before making the decision. There had been months of planning, countless revisions, and late evenings spent perfecting every single passage.',
          'Outside, the gentle hum of the coastal breeze stirred the leaves of the old oak tree. It was the kind of stillness that precedes a monumental transition—a moment frozen between intention and execution.',
        ];

        // Page 1 of this chapter: Chapter Title & opening paragraphs
        pages.push({
          pageNumber: pageCounter++,
          type: 'chapter_start',
          chapterNumber: idx + 1,
          title: chap.title || `Chapter ${idx + 1}`,
          headerText: settings.runningHeader === 'book-title' ? book.title : (chap.title || `Chapter ${idx + 1}`),
          content: chapterParas.slice(0, 3),
          isFirstParagraph: true,
        });

        // If there are more paragraphs, add continuation page
        if (chapterParas.length > 3) {
          pages.push({
            pageNumber: pageCounter++,
            type: 'chapter_body',
            chapterNumber: idx + 1,
            title: chap.title || `Chapter ${idx + 1}`,
            headerText: settings.runningHeader === 'book-title' ? book.title : (chap.title || `Chapter ${idx + 1}`),
            content: chapterParas.slice(3, 7),
            isFirstParagraph: false,
          });
        }
      });
    }
  }

  // 7. About the Author
  if (settings.includedSections.aboutAuthor && book.backMatter?.aboutAuthor) {
    const authorParas = book.backMatter.aboutAuthor
      .replace(/<[^>]*>/g, '')
      .split(/\n\s*\n/)
      .filter(Boolean);

    pages.push({
      pageNumber: pageCounter++,
      type: 'about',
      headerText: 'ABOUT THE AUTHOR',
      content: authorParas,
    });
  }

  const totalPreviewPages = Math.max(1, pages.length);
  const safePageIdx = Math.min(currentPage, totalPreviewPages) - 1;
  const activePage = pages[safePageIdx] || pages[0];
  const secondPage = viewMode === 'spread' && safePageIdx + 1 < totalPreviewPages ? pages[safePageIdx + 1] : null;

  // Aspect ratio calculation for realistic book proportions
  const widthRatio = trimDimensions.width;
  const heightRatio = trimDimensions.height;
  const aspectRatio = `${widthRatio} / ${heightRatio}`;

  // Font stack
  const fontCss = getFontFamilyStack(settings.fontFamily);
  const fontSizePx = settings.fontSize === '10pt' ? '13px' : settings.fontSize === '11pt' ? '14px' : '15px';
  const lineHeightNum = parseFloat(settings.lineSpacing || '1.5');
  const indentPx = settings.paragraphIndent === '0.5in' ? '28px' : settings.paragraphIndent === '0.25in' ? '16px' : '0px';

  // Render a single simulated book page
  const renderSingleBookPage = (pageData: PreviewPage, isRightSide: boolean) => {
    const isCream = settings.paperType === 'cream';
    const isEven = pageData.pageNumber % 2 === 0;

    // Gutter margin is inside
    const gutterOnLeft = isRightSide || !isEven;
    const paddingLeft = gutterOnLeft ? `${margins.inside * 60}px` : `${margins.outside * 60}px`;
    const paddingRight = gutterOnLeft ? `${margins.outside * 60}px` : `${margins.inside * 60}px`;
    const paddingTop = `${margins.top * 50}px`;
    const paddingBottom = `${margins.bottom * 50}px`;

    return (
      <div
        id={`preview-book-page-${pageData.pageNumber}`}
        style={{
          aspectRatio,
          fontFamily: fontCss,
          fontSize: fontSizePx,
          lineHeight: lineHeightNum,
          paddingLeft,
          paddingRight,
          paddingTop,
          paddingBottom,
        }}
        className={`w-full ${viewMode === 'spread' ? 'max-w-[280px]' : 'max-w-[340px]'} h-auto rounded-sm shadow-md flex flex-col justify-between relative transition-all select-none border ${
          isCream
            ? 'bg-[#fbf7ee] text-[#1c1813] border-amber-200/70 shadow-amber-950/10'
            : 'bg-white text-slate-900 border-slate-200 shadow-slate-400/20'
        }`}
      >
        {/* Running Header (Odd/Even header) */}
        <div className="h-6 flex items-center justify-between text-[10px] tracking-widest text-gray-500 uppercase border-b border-gray-300/40 pb-1 mb-2">
          {pageData.type !== 'title' && pageData.type !== 'copyright' && (
            <>
              <span className="truncate">
                {settings.runningHeader === 'book-title'
                  ? book.title
                  : settings.runningHeader === 'chapter-name'
                  ? pageData.headerText || ''
                  : ''}
              </span>
              {settings.pageNumberPosition === 'bottom-outer' && (
                <span className="font-mono text-[9px]">{pageData.pageNumber}</span>
              )}
            </>
          )}
        </div>

        {/* Page Content Body */}
        <div className="flex-1 flex flex-col justify-start overflow-hidden">
          {pageData.type === 'title' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-8">
              <h1 className="text-xl font-bold tracking-wider uppercase mb-1">{book.title}</h1>
              {book.subtitle && <h2 className="text-xs italic text-gray-600 mb-6">{book.subtitle}</h2>}
              <div className="text-xs font-semibold uppercase tracking-widest mt-auto">
                By {book.author || 'Author'}
              </div>
            </div>
          )}

          {pageData.type === 'copyright' && (
            <div className="flex-1 flex flex-col justify-end text-[9px] text-gray-700 leading-normal pb-4">
              <p className="font-bold mb-1">{book.title}</p>
              <p className="mb-2">Copyright © {new Date().getFullYear()} {book.author || 'Author'}. All rights reserved.</p>
              <p className="mb-2">No part of this publication may be reproduced or transmitted without written permission from the publisher.</p>
              <p>Published in the United States of America.</p>
            </div>
          )}

          {pageData.type === 'dedication' && (
            <div className="flex-1 flex items-center justify-center text-center py-12 px-4">
              <p className="italic text-sm text-gray-800">
                "{pageData.content[0] || 'Dedicated to seekers of truth and timeless stories.'}"
              </p>
            </div>
          )}

          {pageData.type === 'toc' && (
            <div className="py-4">
              <h2 className="text-center font-bold tracking-widest text-sm uppercase mb-4">Contents</h2>
              <div className="space-y-1.5 text-[11px]">
                {pageData.content.map((item, idx) => (
                  <div key={idx} className="flex items-baseline justify-between">
                    <span className="font-medium">{item}</span>
                    <span className="flex-1 mx-2 border-b border-dotted border-gray-400"></span>
                    <span className="font-mono text-[10px]">{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(pageData.type === 'chapter_start' || pageData.type === 'preface' || pageData.type === 'about') && (
            <div className="text-center mb-4 pt-2">
              {pageData.chapterNumber && (
                <div className="text-[10px] tracking-widest text-gray-500 font-semibold uppercase mb-0.5">
                  CHAPTER {pageData.chapterNumber}
                </div>
              )}
              <h2 className="text-base font-bold tracking-wide uppercase">
                {pageData.title || (pageData.type === 'preface' ? 'Preface' : 'About the Author')}
              </h2>
            </div>
          )}

          {/* Body Paragraphs */}
          {pageData.content.length > 0 && pageData.type !== 'dedication' && pageData.type !== 'toc' && (
            <div className="space-y-0 text-justify hyphens-auto">
              {pageData.content.map((p, pIdx) => {
                const isFirst = pIdx === 0 && pageData.isFirstParagraph;
                const hasDropCap = isFirst && settings.dropCaps;

                if (hasDropCap) {
                  const firstLetter = p.charAt(0);
                  const restOfPara = p.slice(1);

                  return (
                    <p key={pIdx} className="mb-0 text-justify" style={{ textIndent: '0px' }}>
                      <span
                        className="float-left text-3xl font-bold leading-none pr-1.5 pt-0.5"
                        style={{ color: '#1a1a1a' }}
                      >
                        {firstLetter}
                      </span>
                      {restOfPara}
                    </p>
                  );
                }

                return (
                  <p
                    key={pIdx}
                    className="mb-0 text-justify"
                    style={{ textIndent: isFirst ? '0px' : indentPx }}
                  >
                    {p}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Page Number */}
        <div className="h-6 flex items-center justify-center text-[10px] font-mono text-gray-600">
          {settings.pageNumberPosition === 'bottom-center' && pageData.type !== 'title' && pageData.type !== 'copyright' && (
            <span>{pageData.pageNumber}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[720px] max-h-[82vh] bg-slate-100/80 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Preview Control Bar */}
      <div className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-10 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            <span>Interactive KDP Preview</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">
            ({trimDimensions.width}" × {trimDimensions.height}", {settings.paperType})
          </span>
        </div>

        {/* View Mode & Zoom controls */}
        <div className="flex items-center gap-2">
          {/* Spread toggle */}
          <div className="hidden sm:flex rounded-lg bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-2 py-1 rounded-md flex items-center gap-1 ${
                viewMode === 'single'
                  ? 'bg-white text-purple-700 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Single Page View"
            >
              <Square className="w-3 h-3" />
              <span>Single</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('spread')}
              className={`px-2 py-1 rounded-md flex items-center gap-1 ${
                viewMode === 'spread'
                  ? 'bg-white text-purple-700 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Two-Page Spread View"
            >
              <Columns className="w-3 h-3" />
              <span>Spread</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(75, prev - 15))}
              className="p-1 text-slate-500 hover:text-slate-900 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 font-semibold text-slate-700">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(130, prev + 15))}
              className="p-1 text-slate-500 hover:text-slate-900 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Canvas */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center relative bg-slate-100/60">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
          className="flex items-center justify-center gap-6 transition-transform duration-150 py-2"
        >
          {/* Left Page (in spread mode, or single active page) */}
          {renderSingleBookPage(activePage, false)}

          {/* Right Page (if in spread mode and available) */}
          {secondPage && renderSingleBookPage(secondPage, true)}
        </div>
      </div>

      {/* Bottom Page Navigation Bar */}
      <div className="h-12 bg-white border-t border-slate-200 px-4 flex items-center justify-between shrink-0">
        <button
          type="button"
          id="btn-preview-prev-page"
          onClick={() => setCurrentPage((prev) => Math.max(1, viewMode === 'spread' ? prev - 2 : prev - 1))}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous Page</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="font-bold text-slate-900">
            Page {viewMode === 'spread' && secondPage ? `${activePage.pageNumber}–${secondPage.pageNumber}` : activePage.pageNumber}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500">
            {totalPreviewPages} preview pages ({estimatedPages} estimated total)
          </span>
        </div>

        <button
          type="button"
          id="btn-preview-next-page"
          onClick={() =>
            setCurrentPage((prev) =>
              Math.min(totalPreviewPages, viewMode === 'spread' ? prev + 2 : prev + 1)
            )
          }
          disabled={currentPage >= totalPreviewPages || (viewMode === 'spread' && !secondPage)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
        >
          <span>Next Page</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
