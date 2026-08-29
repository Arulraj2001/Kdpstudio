export function buildBookHtml(
  book: any,
  settings: any,
  margins: { top: number; bottom: number; inside: number; outside: number },
  trimSize: { width: number; height: number }
): string {
  const font = settings.fontFamily || 'Garamond';
  const fontSize = settings.fontSize || '11pt';
  const lineSpacing = settings.lineSpacing || '1.5';
  const indent = settings.paragraphIndent === '0.5in' ? '0.5in' : settings.paragraphIndent === '0.25in' ? '0.25in' : '0';

  const fontStack =
    font === 'Times New Roman'
      ? '"Times New Roman", Times, serif'
      : font === 'Georgia'
      ? 'Georgia, serif'
      : font === 'Palatino'
      ? '"Palatino Linotype", "Book Antiqua", Palatino, serif'
      : font === 'Book Antiqua'
      ? '"Book Antiqua", Palatino, serif'
      : '"EB Garamond", Garamond, Baskerville, serif';

  const { top, bottom, inside, outside } = margins;
  const { width, height } = trimSize;

  let sectionsHtml = '';

  // 1. Title page
  if (settings.includedSections?.titlePage) {
    sectionsHtml += `
      <div class="page title-page">
        <h1 class="title-display">${escapeHtml(book.title)}</h1>
        ${book.subtitle ? `<h2 class="subtitle-display">${escapeHtml(book.subtitle)}</h2>` : ''}
        <div class="author-display">by ${escapeHtml(book.author || 'Anonymous')}</div>
      </div>
    `;
  }

  // 2. Copyright page
  if (settings.includedSections?.copyright) {
    const year = new Date().getFullYear();
    sectionsHtml += `
      <div class="page copyright-page">
        <p><strong>${escapeHtml(book.title)}</strong></p>
        ${book.subtitle ? `<p>${escapeHtml(book.subtitle)}</p>` : ''}
        <p>Copyright © ${year} ${escapeHtml(book.author || 'Author')}. All rights reserved.</p>
        <p>No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without prior written permission.</p>
        <p>First Edition: ${year}</p>
        <p>Published in the United States of America</p>
      </div>
    `;
  }

  // 3. Dedication
  if (settings.includedSections?.dedication && book.frontMatter?.dedication) {
    sectionsHtml += `
      <div class="page dedication-page">
        <p class="dedication-text"><em>${escapeHtml(book.frontMatter.dedication)}</em></p>
      </div>
    `;
  }

  // 4. TOC
  if (settings.includedSections?.toc && book.chapters?.length > 0) {
    sectionsHtml += `
      <div class="page toc-page">
        <h2 class="section-heading">Contents</h2>
        <ul class="toc-list">
          ${book.chapters
            .map(
              (c: any, i: number) => `
            <li class="toc-item">
              <span>${escapeHtml(c.title || `Chapter ${i + 1}`)}</span>
              <span class="toc-dots"></span>
              <span>${i + 1}</span>
            </li>
          `
            )
            .join('')}
        </ul>
      </div>
    `;
  }

  // 5. Preface
  if (settings.includedSections?.preface && book.frontMatter?.preface) {
    sectionsHtml += `
      <div class="page preface-page">
        <h2 class="section-heading">Preface</h2>
        <div class="body-content">
          ${formatBodyContent(book.frontMatter.preface, settings.dropCaps, indent)}
        </div>
      </div>
    `;
  }

  // 6. Chapters (or custom text)
  if (settings.includedSections?.chapters) {
    if (settings.customText && settings.customText.trim()) {
      sectionsHtml += `
        <div class="page chapter-page">
          <h2 class="chapter-title">${escapeHtml(book.title || 'Manuscript')}</h2>
          <div class="body-content">
            ${formatBodyContent(settings.customText, settings.dropCaps, indent)}
          </div>
        </div>
      `;
    } else if (book.chapters && book.chapters.length > 0) {
      book.chapters.forEach((chap: any, idx: number) => {
        sectionsHtml += `
          <div class="page chapter-page ${settings.chapterStart === 'always-new-page' ? 'break-before' : ''}">
            <div class="chapter-num">CHAPTER ${idx + 1}</div>
            <h1 class="chapter-title">${escapeHtml(chap.title || `Chapter ${idx + 1}`)}</h1>
            <div class="body-content">
              ${formatBodyContent(chap.content, settings.dropCaps, indent)}
            </div>
          </div>
        `;
      });
    }
  }

  // 7. About the author
  if (settings.includedSections?.aboutAuthor && book.backMatter?.aboutAuthor) {
    sectionsHtml += `
      <div class="page about-author-page break-before">
        <h2 class="section-heading">About the Author</h2>
        <div class="body-content">
          ${formatBodyContent(book.backMatter.aboutAuthor, false, indent)}
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(book.title)}</title>
  <style>
    @page {
      size: ${width}in ${height}in;
      margin: ${top}in ${outside}in ${bottom}in ${inside}in;
    }
    @page :left {
      margin-left: ${outside}in;
      margin-right: ${inside}in;
    }
    @page :right {
      margin-left: ${inside}in;
      margin-right: ${outside}in;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
    }
    body {
      font-family: ${fontStack};
      font-size: ${fontSize};
      line-height: ${lineSpacing};
      color: #000;
      margin: 0;
      padding: 0;
    }
    .page {
      position: relative;
    }
    .break-before {
      page-break-before: always;
      break-before: page;
    }
    p {
      margin-top: 0;
      margin-bottom: 0;
      text-align: justify;
      text-indent: ${indent};
    }
    p:first-of-type, .no-indent {
      text-indent: 0 !important;
    }
    ${
      settings.dropCaps
        ? `
    .body-content > p:first-child::first-letter, p.has-drop-cap::first-letter {
      float: left;
      font-size: 3.2em;
      line-height: 0.8;
      padding-top: 4px;
      padding-right: 6px;
      font-weight: bold;
    }
    `
        : ''
    }
    .title-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 80vh;
      page-break-after: always;
    }
    .title-display {
      font-size: 2.2em;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 0.2em;
      letter-spacing: 0.05em;
    }
    .subtitle-display {
      font-size: 1.2em;
      font-style: italic;
      margin-bottom: 2em;
      color: #333;
    }
    .author-display {
      font-size: 1.1em;
      text-transform: uppercase;
      font-weight: 600;
    }
    .copyright-page {
      font-size: 8.5pt;
      line-height: 1.4;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      min-height: 80vh;
      page-break-after: always;
    }
    .copyright-page p {
      text-indent: 0 !important;
      margin-bottom: 0.8em;
    }
    .dedication-page {
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 70vh;
      page-break-after: always;
    }
    .chapter-num {
      text-align: center;
      font-size: 0.85em;
      letter-spacing: 0.15em;
      color: #555;
      margin-top: 1in;
      margin-bottom: 0.3em;
    }
    .chapter-title, .section-heading {
      text-align: center;
      font-size: 1.8em;
      font-weight: bold;
      margin-bottom: 1.5em;
    }
    .toc-list {
      list-style: none;
      padding: 0;
    }
    .toc-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5em;
    }
    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted #888;
      margin: 0 0.5em;
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
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBodyContent(content: string, dropCaps: boolean, indent: string): string {
  if (!content) return '<p></p>';
  if (content.includes('<p>') || content.includes('</p>')) {
    return content;
  }
  const paras = content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return paras
    .map((p, idx) => {
      const cls = idx === 0 && dropCaps ? 'class="has-drop-cap"' : '';
      return `<p ${cls}>${escapeHtml(p)}</p>`;
    })
    .join('\n');
}
