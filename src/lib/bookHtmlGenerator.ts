import { Book, FormatterSettings, Margins, TrimDimensions } from '../types/index';

/**
 * Maps font family to CSS font-family stack
 */
export function getFontFamilyStack(fontFamily: string): string {
  switch (fontFamily) {
    case 'Garamond':
      return '"EB Garamond", "Garamond", "Baskerville", "Baskerville Old Face", "Hoefler Text", serif';
    case 'Times New Roman':
      return '"Times New Roman", "Times", "Liberation Serif", serif';
    case 'Georgia':
      return '"Georgia", "Cambria", "Times New Roman", serif';
    case 'Palatino':
      return '"Palatino", "Palatino Linotype", "Book Antiqua", "Georgia", serif';
    case 'Book Antiqua':
      return '"Book Antiqua", "Palatino", "Palatino Linotype", "Georgia", serif';
    default:
      return '"Garamond", "Georgia", serif';
  }
}

/**
 * Builds complete print-ready HTML with @page rules, running headers, and styled chapters
 */
export function generateBookHtml(
  book: Book,
  settings: FormatterSettings,
  margins: Margins,
  trimDimensions: TrimDimensions
): string {
  const fontStack = getFontFamilyStack(settings.fontFamily);
  const fontSize = settings.fontSize || '11pt';
  const lineSpacing = settings.lineSpacing || '1.5';
  const indent = settings.paragraphIndent === '0.5in' ? '0.5in' : settings.paragraphIndent === '0.25in' ? '0.25in' : '0';

  const { top, bottom, inside, outside } = margins;
  const { width, height } = trimDimensions;

  // Running header and page number positioning styles
  const isOuterPageNum = settings.pageNumberPosition === 'bottom-outer';
  const hasPageNum = settings.pageNumberPosition !== 'none';
  const headerContent =
    settings.runningHeader === 'book-title'
      ? book.title
      : settings.runningHeader === 'chapter-name'
      ? ''
      : '';

  // Generate sections
  let sectionsHtml = '';

  // 1. Title Page
  if (settings.includedSections.titlePage) {
    sectionsHtml += `
      <section class="page front-matter title-page">
        <div class="title-page-container">
          <h1 class="book-title-display">${escapeHtml(book.title)}</h1>
          ${book.subtitle ? `<h2 class="book-subtitle-display">${escapeHtml(book.subtitle)}</h2>` : ''}
          <div class="author-display">by ${escapeHtml(book.author || 'Anonymous')}</div>
        </div>
      </section>
    `;
  }

  // 2. Copyright Page
  if (settings.includedSections.copyright) {
    const year = new Date().getFullYear();
    sectionsHtml += `
      <section class="page front-matter copyright-page">
        <div class="copyright-container">
          <p><strong>${escapeHtml(book.title)}</strong></p>
          ${book.subtitle ? `<p>${escapeHtml(book.subtitle)}</p>` : ''}
          <p>Copyright © ${year} ${escapeHtml(book.author || 'Author')}. All rights reserved.</p>
          <p>No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the author, except in the case of brief quotations embodied in critical reviews.</p>
          <p>First Edition: ${year}</p>
          <p>Published in the United States of America</p>
        </div>
      </section>
    `;
  }

  // 3. Dedication Page
  if (settings.includedSections.dedication && book.frontMatter?.dedication) {
    sectionsHtml += `
      <section class="page front-matter dedication-page">
        <div class="dedication-container">
          <p class="dedication-text"><em>${escapeHtml(book.frontMatter.dedication)}</em></p>
        </div>
      </section>
    `;
  }

  // 4. Table of Contents
  if (settings.includedSections.toc && book.chapters.length > 0) {
    sectionsHtml += `
      <section class="page front-matter toc-page">
        <h2 class="section-title">Contents</h2>
        <ul class="toc-list">
          ${book.chapters
            .map(
              (c, idx) => `
            <li class="toc-item">
              <span class="toc-title">${escapeHtml(c.title || `Chapter ${idx + 1}`)}</span>
              <span class="toc-dots"></span>
              <span class="toc-page-num">${idx + 1}</span>
            </li>
          `
            )
            .join('')}
        </ul>
      </section>
    `;
  }

  // 5. Preface
  if (settings.includedSections.preface && book.frontMatter?.preface) {
    sectionsHtml += `
      <section class="page front-matter preface-page">
        <h2 class="section-title">Preface</h2>
        <div class="chapter-body">
          ${sanitizeAndFormatBody(book.frontMatter.preface, settings.dropCaps, indent)}
        </div>
      </section>
    `;
  }

  // 6. Chapters (or custom text)
  if (settings.includedSections.chapters) {
    if (settings.customText && settings.customText.trim()) {
      sectionsHtml += `
        <section class="page chapter-page">
          <h2 class="chapter-title">${escapeHtml(book.title || 'Manuscript')}</h2>
          <div class="chapter-body">
            ${sanitizeAndFormatBody(settings.customText, settings.dropCaps, indent)}
          </div>
        </section>
      `;
    } else if (book.chapters && book.chapters.length > 0) {
      book.chapters.forEach((chap, idx) => {
        const chapterNum = idx + 1;
        sectionsHtml += `
          <section class="page chapter-page ${settings.chapterStart === 'always-new-page' ? 'break-before' : ''}">
            <div class="chapter-header">
              <div class="chapter-number-label">CHAPTER ${chapterNum}</div>
              <h2 class="chapter-title">${escapeHtml(chap.title || `Chapter ${chapterNum}`)}</h2>
            </div>
            <div class="chapter-body">
              ${sanitizeAndFormatBody(chap.content, settings.dropCaps, indent)}
            </div>
          </section>
        `;
      });
    }
  }

  // 7. About Author
  if (settings.includedSections.aboutAuthor && book.backMatter?.aboutAuthor) {
    sectionsHtml += `
      <section class="page back-matter about-author-page break-before">
        <h2 class="section-title">About the Author</h2>
        <div class="chapter-body">
          ${sanitizeAndFormatBody(book.backMatter.aboutAuthor, false, indent)}
        </div>
      </section>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(book.title)} - Formatted Interior</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..700;1,400..700&display=swap');

    @page {
      size: ${width}in ${height}in;
      margin-top: ${top}in;
      margin-bottom: ${bottom}in;
      margin-left: ${inside}in;
      margin-right: ${outside}in;
    }

    @page :left {
      margin-left: ${outside}in;
      margin-right: ${inside}in;
      @top-left {
        content: counter(page);
        font-family: ${fontStack};
        font-size: 8pt;
      }
      @top-center {
        content: "${headerContent}";
        font-family: ${fontStack};
        font-size: 8.5pt;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
    }

    @page :right {
      margin-left: ${inside}in;
      margin-right: ${outside}in;
      @top-right {
        content: counter(page);
        font-family: ${fontStack};
        font-size: 8pt;
      }
      @top-center {
        content: "${escapeHtml(book.title)}";
        font-family: ${fontStack};
        font-size: 8.5pt;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: ${fontStack};
      font-size: ${fontSize};
      line-height: ${lineSpacing};
      color: #111111;
      background: #ffffff;
      text-rendering: optimizeLegibility;
      font-feature-settings: "kern" 1, "liga" 1;
    }

    .page {
      position: relative;
      width: 100%;
      min-height: 100%;
    }

    .break-before {
      page-break-before: always;
      break-before: page;
    }

    /* Paragraph Styling & Indentation */
    p {
      margin-top: 0;
      margin-bottom: 0;
      text-align: justify;
      hyphens: auto;
      text-indent: ${indent};
    }

    p:first-of-type,
    .chapter-body > p:first-child,
    .no-indent {
      text-indent: 0 !important;
    }

    /* Drop Caps */
    ${
      settings.dropCaps
        ? `
    .chapter-body > p:first-child::first-letter,
    p.has-drop-cap::first-letter,
    .drop-cap {
      float: left;
      font-size: 3.2em;
      line-height: 0.8;
      padding-top: 4px;
      padding-right: 8px;
      padding-bottom: 2px;
      font-weight: bold;
      color: #111827;
    }
    `
        : ''
    }

    /* Title Page Layout */
    .title-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 80vh;
      page-break-after: always;
      break-after: page;
    }

    .title-page-container {
      margin: auto 0;
      text-align: center;
      width: 100%;
    }

    .book-title-display {
      font-size: 2.2em;
      font-weight: 700;
      letter-spacing: 0.04em;
      margin-bottom: 0.3em;
      text-transform: uppercase;
    }

    .book-subtitle-display {
      font-size: 1.2em;
      font-weight: 400;
      font-style: italic;
      color: #4b5563;
      margin-bottom: 3em;
    }

    .author-display {
      font-size: 1.1em;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    /* Copyright Page */
    .copyright-page {
      font-size: 8.5pt;
      line-height: 1.4;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      min-height: 80vh;
      page-break-after: always;
      break-after: page;
    }

    .copyright-container p {
      text-indent: 0 !important;
      margin-bottom: 0.8em;
      text-align: left;
    }

    /* Dedication Page */
    .dedication-page {
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 70vh;
      page-break-after: always;
      break-after: page;
    }

    .dedication-container {
      margin: auto 0;
      max-width: 80%;
      text-align: center;
    }

    .dedication-text {
      font-size: 1.1em;
      font-style: italic;
      text-indent: 0 !important;
    }

    /* Section & Chapter Titles */
    .section-title {
      font-size: 1.6em;
      font-weight: 700;
      text-align: center;
      margin-top: 1.5in;
      margin-bottom: 1.2em;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .chapter-header {
      text-align: center;
      margin-top: 1.2in;
      margin-bottom: 1.8em;
    }

    .chapter-number-label {
      font-size: 0.85em;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 0.4em;
    }

    .chapter-title {
      font-size: 1.8em;
      font-weight: 700;
      letter-spacing: 0.03em;
      margin: 0;
      text-transform: capitalize;
    }

    .chapter-body {
      margin-top: 1.5em;
    }

    /* Table of Contents */
    .toc-list {
      list-style: none;
      padding: 0;
      margin: 1.5em 0;
    }

    .toc-item {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 0.6em;
    }

    .toc-title {
      font-weight: 500;
    }

    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted #9ca3af;
      margin: 0 0.5em;
    }

    .toc-page-num {
      font-variant-numeric: tabular-nums;
    }
  </style>
</head>
<body>
  ${sectionsHtml}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeAndFormatBody(htmlOrText: string, dropCaps: boolean, indent: string): string {
  if (!htmlOrText) return '<p></p>';

  // If already contains HTML paragraph tags
  if (htmlOrText.includes('<p>') || htmlOrText.includes('</p>')) {
    return htmlOrText;
  }

  // Convert plain text paragraphs
  const paragraphs = htmlOrText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs
    .map((p, idx) => {
      const cls = idx === 0 && dropCaps ? 'class="has-drop-cap"' : '';
      return `<p ${cls}>${escapeHtml(p)}</p>`;
    })
    .join('\n');
}
