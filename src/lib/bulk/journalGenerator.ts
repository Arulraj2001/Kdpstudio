/**
 * KDP Studio — Bulk Journal & Planner Template Generator
 * Phase 14A
 */

export interface JournalPage {
  pageNumber: number;
  type: 'lined' | 'dotted' | 'blank' | 'prompted' | 'planner';
  promptText?: string;
  dateField?: boolean;
}

export interface JournalBookData {
  title: string;
  subtitle?: string;
  author: string;
  trimSize: string;
  pageCount: number;
  pages: JournalPage[];
  coverHtml: string;
  interiorHtml: string;
}

export interface JournalSettings {
  title: string;
  subtitle?: string;
  author: string;
  trimSize?: string;
  pageCount?: number;
  promptStyle?: 'lined' | 'dotted' | 'blank' | 'prompted';
  promptTheme?: string;
  prompts?: string[];
  coverColor?: string;
  includeDate?: boolean;
  includePageNumbers?: boolean;
}

export interface PlannerSettings {
  title: string;
  subtitle?: string;
  author: string;
  trimSize?: string;
  pageCount?: number;
  coverColor?: string;
  includeDate?: boolean;
  includePageNumbers?: boolean;
}

const DEFAULT_PROMPTS = [
  'What are three things you are deeply grateful for today?',
  'What is the single most important intention for today?',
  'Describe a moment today that made you feel peaceful or inspired.',
  'What challenge did you navigate today, and what did you learn from it?',
  'Who inspired you recently and what quality of theirs did you admire?',
  'Write down one fear or hesitation you are ready to let go of.',
  'What is a small victory or milestone you reached this week?',
  'How did you show yourself compassion or care today?',
  'What is one boundary you are honoring for your mental energy?',
  'Describe your ideal morning routine and how it makes you feel.',
  'What is a belief about yourself that you want to strengthen?',
  'What simple pleasure brought a smile to your face today?',
];

/**
 * Generate a complete lined, dotted, blank, or prompted journal
 */
export function generateJournalBook(settings: JournalSettings): JournalBookData {
  const trimSize = settings.trimSize || '6x9';
  const pageCount = Math.max(24, Math.min(400, settings.pageCount || 100));
  const promptStyle = settings.promptStyle || 'lined';
  const coverColor = settings.coverColor || '#4f46e5';
  const includeDate = settings.includeDate ?? true;
  const includePageNumbers = settings.includePageNumbers ?? true;
  const prompts = settings.prompts?.length ? settings.prompts : DEFAULT_PROMPTS;

  const pages: JournalPage[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const promptText =
      promptStyle === 'prompted' ? prompts[(i - 1) % prompts.length] : undefined;

    pages.push({
      pageNumber: i,
      type: promptStyle,
      promptText,
      dateField: includeDate,
    });
  }

  const coverHtml = generateJournalCoverHtml(settings.title, settings.subtitle, settings.author, coverColor, trimSize);
  const interiorHtml = generateJournalHtml(pages, trimSize, includePageNumbers);

  return {
    title: settings.title,
    subtitle: settings.subtitle,
    author: settings.author,
    trimSize,
    pageCount,
    pages,
    coverHtml,
    interiorHtml,
  };
}

/**
 * Generate a daily productivity planner book
 */
export function generatePlannerBook(settings: PlannerSettings): JournalBookData {
  const trimSize = settings.trimSize || '8.5x11';
  const pageCount = Math.max(24, Math.min(365, settings.pageCount || 90));
  const coverColor = settings.coverColor || '#059669';
  const includePageNumbers = settings.includePageNumbers ?? true;

  const pages: JournalPage[] = [];

  for (let i = 1; i <= pageCount; i++) {
    pages.push({
      pageNumber: i,
      type: 'planner',
      dateField: true,
    });
  }

  const coverHtml = generateJournalCoverHtml(settings.title, settings.subtitle, settings.author, coverColor, trimSize);
  const interiorHtml = generateJournalHtml(pages, trimSize, includePageNumbers);

  return {
    title: settings.title,
    subtitle: settings.subtitle,
    author: settings.author,
    trimSize,
    pageCount,
    pages,
    coverHtml,
    interiorHtml,
  };
}

/**
 * Generates print-ready HTML for covers
 */
export function generateJournalCoverHtml(
  title: string,
  subtitle: string | undefined,
  author: string,
  coverColor: string,
  trimSize: string
): string {
  const dims = getTrimDimensionsCss(trimSize);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: ${dims.width} ${dims.height};
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      width: ${dims.width};
      height: ${dims.height};
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: ${coverColor};
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      box-sizing: border-box;
      padding: 2in 1in;
      position: relative;
      overflow: hidden;
    }
    .accent-border {
      position: absolute;
      top: 0.5in;
      left: 0.5in;
      right: 0.5in;
      bottom: 0.5in;
      border: 2px solid rgba(255, 255, 255, 0.4);
      pointer-events: none;
    }
    .inner-border {
      position: absolute;
      top: 0.6in;
      left: 0.6in;
      right: 0.6in;
      bottom: 0.6in;
      border: 1px solid rgba(255, 255, 255, 0.2);
      pointer-events: none;
    }
    h1 {
      font-size: 32pt;
      font-weight: 800;
      letter-spacing: 1px;
      margin: 0 0 12pt 0;
      text-transform: uppercase;
      line-height: 1.2;
    }
    h2 {
      font-size: 16pt;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 40pt 0;
      font-style: italic;
      line-height: 1.3;
    }
    .divider {
      width: 60px;
      height: 3px;
      background-color: #ffffff;
      margin: 20pt auto;
    }
    .author {
      font-size: 14pt;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: auto;
    }
  </style>
</head>
<body>
  <div class="accent-border"></div>
  <div class="inner-border"></div>
  <h1>${escapeHtml(title)}</h1>
  ${subtitle ? `<h2>${escapeHtml(subtitle)}</h2>` : ''}
  <div class="divider"></div>
  <div class="author">${escapeHtml(author || 'KDP Studio')}</div>
</body>
</html>`;
}

/**
 * Returns complete printable HTML for all interior pages
 */
export function generateJournalHtml(
  pages: JournalPage[],
  trimSize: string,
  includePageNumbers: boolean
): string {
  const dims = getTrimDimensionsCss(trimSize);

  const pagesHtml = pages
    .map((p) => {
      if (p.type === 'planner') {
        return renderPlannerPage(p, includePageNumbers);
      } else if (p.type === 'prompted') {
        return renderPromptedPage(p, includePageNumbers);
      } else if (p.type === 'dotted') {
        return renderDottedPage(p, includePageNumbers);
      } else if (p.type === 'blank') {
        return renderBlankPage(p, includePageNumbers);
      } else {
        return renderLinedPage(p, includePageNumbers);
      }
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: ${dims.width} ${dims.height};
      margin: 0.6in 0.5in 0.6in 0.6in;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      page-break-after: always;
      position: relative;
      height: 100%;
      min-height: calc(${dims.height} - 1.2in);
      display: flex;
      flex-direction: column;
    }
    .page-number {
      position: absolute;
      bottom: -0.3in;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 8pt;
      color: #94a3b8;
    }
    .date-box {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      font-size: 9pt;
      color: #64748b;
      margin-bottom: 12pt;
      padding-bottom: 6pt;
      border-bottom: 1px dashed #cbd5e1;
    }
    .lined-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin-top: 8pt;
    }
    .line {
      width: 100%;
      height: 0.35in;
      border-bottom: 1px solid #cbd5e1;
    }
    .dotted-container {
      flex: 1;
      background-image: radial-gradient(#94a3b8 1px, transparent 1px);
      background-size: 0.2in 0.2in;
      margin-top: 10pt;
    }
    .prompt-box {
      padding: 10pt 12pt;
      background-color: #f8fafc;
      border-left: 3px solid #6366f1;
      border-radius: 4px;
      font-size: 10.5pt;
      font-style: italic;
      color: #334155;
      margin-bottom: 12pt;
      line-height: 1.4;
    }
    /* Planner Styles */
    .planner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 6pt;
      margin-bottom: 10pt;
    }
    .planner-title {
      font-size: 12pt;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .planner-grid {
      display: grid;
      grid-template-columns: 1fr 1.3fr;
      gap: 12pt;
      flex: 1;
    }
    .planner-col {
      display: flex;
      flex-direction: column;
      gap: 8pt;
    }
    .section-title {
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2pt;
    }
    .schedule-row {
      display: flex;
      align-items: center;
      height: 0.22in;
      border-bottom: 1px solid #e2e8f0;
      font-size: 7.5pt;
      color: #64748b;
    }
    .schedule-time {
      width: 45px;
      font-weight: 600;
    }
    .priority-item {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 0.28in;
      border-bottom: 1px solid #cbd5e1;
    }
    .checkbox-square {
      width: 11px;
      height: 11px;
      border: 1.5px solid #64748b;
      border-radius: 2px;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}

function renderLinedPage(p: JournalPage, includePageNumbers: boolean): string {
  const lineCount = 24;
  const lines = Array(lineCount)
    .fill(0)
    .map(() => '<div class="line"></div>')
    .join('');

  return `
  <div class="page">
    ${p.dateField ? '<div class="date-box"><span>Date: _______________</span></div>' : ''}
    <div class="lined-container">
      ${lines}
    </div>
    ${includePageNumbers ? `<div class="page-number">${p.pageNumber}</div>` : ''}
  </div>`;
}

function renderPromptedPage(p: JournalPage, includePageNumbers: boolean): string {
  const lineCount = 20;
  const lines = Array(lineCount)
    .fill(0)
    .map(() => '<div class="line"></div>')
    .join('');

  return `
  <div class="page">
    ${p.dateField ? '<div class="date-box"><span>Date: _______________</span></div>' : ''}
    ${p.promptText ? `<div class="prompt-box">"${escapeHtml(p.promptText)}"</div>` : ''}
    <div class="lined-container">
      ${lines}
    </div>
    ${includePageNumbers ? `<div class="page-number">${p.pageNumber}</div>` : ''}
  </div>`;
}

function renderDottedPage(p: JournalPage, includePageNumbers: boolean): string {
  return `
  <div class="page">
    ${p.dateField ? '<div class="date-box"><span>Date: _______________</span></div>' : ''}
    <div class="dotted-container"></div>
    ${includePageNumbers ? `<div class="page-number">${p.pageNumber}</div>` : ''}
  </div>`;
}

function renderBlankPage(p: JournalPage, includePageNumbers: boolean): string {
  return `
  <div class="page">
    <div style="flex: 1;"></div>
    ${includePageNumbers ? `<div class="page-number">${p.pageNumber}</div>` : ''}
  </div>`;
}

function renderPlannerPage(p: JournalPage, includePageNumbers: boolean): string {
  const hours = [
    '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM',
    '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM'
  ];

  const scheduleRows = hours
    .map((h) => `<div class="schedule-row"><span class="schedule-time">${h}</span><span style="flex:1;"></span></div>`)
    .join('');

  return `
  <div class="page">
    <div class="planner-header">
      <span class="planner-title">Daily Focus & Plan</span>
      <span style="font-size: 8.5pt; color: #64748b;">Date: _______________</span>
    </div>

    <div class="planner-grid">
      <!-- Left Column: Hourly Schedule -->
      <div class="planner-col">
        <div class="section-title">Schedule & Appointments</div>
        ${scheduleRows}
      </div>

      <!-- Right Column: Priorities, Notes & Evening Reflection -->
      <div class="planner-col">
        <div class="section-title">Top 3 Priorities Today</div>
        <div class="priority-item"><div class="checkbox-square"></div><span style="flex:1;"></span></div>
        <div class="priority-item"><div class="checkbox-square"></div><span style="flex:1;"></span></div>
        <div class="priority-item"><div class="checkbox-square"></div><span style="flex:1;"></span></div>

        <div class="section-title" style="margin-top: 10pt;">To-Do Checklist</div>
        <div class="priority-item"><div class="checkbox-square"></div><span style="flex:1;"></span></div>
        <div class="priority-item"><div class="checkbox-square"></div><span style="flex:1;"></span></div>
        <div class="priority-item"><div class="checkbox-square"></div><span style="flex:1;"></span></div>
        <div class="priority-item"><div class="checkbox-square"></div><span style="flex:1;"></span></div>

        <div class="section-title" style="margin-top: 10pt;">Ideas & Notes</div>
        <div style="flex: 1; min-height: 80px; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4pt;"></div>

        <div class="section-title" style="margin-top: 8pt;">Evening Reflection</div>
        <div style="font-size: 7.5pt; font-style: italic; color: #64748b; margin-top: 2pt;">What went well today?</div>
        <div class="line" style="height: 0.25in;"></div>
      </div>
    </div>

    ${includePageNumbers ? `<div class="page-number">${p.pageNumber}</div>` : ''}
  </div>`;
}

function getTrimDimensionsCss(trimSize: string): { width: string; height: string } {
  switch (trimSize) {
    case '5x8':
      return { width: '5in', height: '8in' };
    case '5.5x8.5':
      return { width: '5.5in', height: '8.5in' };
    case '6x9':
      return { width: '6in', height: '9in' };
    case '8.5x11':
    default:
      return { width: '8.5in', height: '11in' };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
