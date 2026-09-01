/**
 * Enterprise Import Engine Unit & Integration Tests
 * Run with: npm test (or node --import tsx --test tests/import-engine.test.ts)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { analyzeManuscriptStructure } from '../src/lib/manuscriptImport/structureEngine';
import { sanitizeManuscriptHtml } from '../src/lib/manuscriptImport/sanitizer';
import { parseKdpRoyaltyReport, parseKdpExcelReport, normalizeMarketplace, normalizeRoyaltyType } from '../src/lib/kdpCsvParser';
import { formatCopyrightText } from '../src/lib/brandService';

// ─── 1. Structure & Chapter Detection Engine ──────────────────────────────

test('structureEngine: splits chapters by Roman numerals (Chapter I, Chapter IV)', () => {
  const text = `
Chapter I
It was the best of times, it was the worst of times.

Chapter II
A wonderful fact to reflect upon, that every human creature is constituted to be that profound secret.

Chapter IV: The Shadow of the Past
The sun rose high above the ancient ruins.
  `;

  const parsed = analyzeManuscriptStructure(text, 'Tale of Two Cities');
  assert.equal(parsed.chapters.length, 3);
  assert.equal(parsed.chapters[0].title, 'Chapter I');
  assert.equal(parsed.chapters[1].title, 'Chapter II');
  assert.equal(parsed.chapters[2].title, 'Chapter IV: The Shadow of the Past');
  assert.ok(parsed.totalWordCount > 20);
});

test('structureEngine: detects Prologue, Epilogue, and named numbered headings', () => {
  const text = `
PROLOGUE
Before the world was shattered, there was only silence.

1. The Awakening
Elena opened her eyes to darkness.

2. The Broken Compass
The road ahead was fraught with danger.

EPILOGUE
Ten years later, the bells chimed across the valley.
  `;

  const parsed = analyzeManuscriptStructure(text, 'The Horizon');
  assert.equal(parsed.chapters.length, 4);
  assert.match(parsed.chapters[0].title, /prologue/i);
  assert.match(parsed.chapters[1].title, /1\.\s+The Awakening/i);
  assert.match(parsed.chapters[2].title, /2\.\s+The Broken Compass/i);
  assert.match(parsed.chapters[3].title, /epilogue/i);
});

test('structureEngine: identifies Dedication and Copyright as Front Matter', () => {
  const text = `
Dedication
To all the dreamers and storytellers who bring magic into the physical world.

Copyright
Copyright 2026 Alex Rivers. All rights reserved.

Chapter 1: The Gate
The heavy oak doors creaked open.
  `;

  const parsed = analyzeManuscriptStructure(text, 'Fantasy Novel');
  assert.ok(parsed.frontMatter.dedication?.includes('dreamers'));
  assert.ok(parsed.frontMatter.copyrightText?.includes('Alex Rivers'));
  assert.ok(parsed.chapters.some((c) => c.title.includes('Chapter 1')));
});

test('structureEngine: splits HTML with <h1> and <h2> tags', () => {
  const html = `
<h1>Chapter 1: In the Beginning</h1>
<p>The dawn broke over the mountains with <strong>golden radiance</strong>.</p>
<h1>Chapter 2: The Journey</h1>
<p>They traveled for three days through the <em>dense wilderness</em>.</p>
  `;

  const parsed = analyzeManuscriptStructure(html, 'Epic Journey');
  assert.equal(parsed.chapters.length, 2);
  assert.equal(parsed.chapters[0].title, 'Chapter 1: In the Beginning');
  assert.ok(parsed.chapters[0].content.includes('<strong>golden radiance</strong>'));
  assert.equal(parsed.chapters[1].title, 'Chapter 2: The Journey');
  assert.ok(parsed.chapters[1].content.includes('<em>dense wilderness</em>'));
});

// ─── 2. HTML Sanitization Engine ──────────────────────────────────────────

test('sanitizer: preserves semantic formatting while removing unsafe scripts and handlers', () => {
  const dirty = `
<p>Safe paragraph with <strong>bold</strong> and <em>italics</em> and <hr class="scene-break" /></p>
<script>alert("xss")</script>
<img src="x" onerror="alert(1)" />
<a href="javascript:alert(1)">Link</a>
  `;

  const clean = sanitizeManuscriptHtml(dirty);
  assert.ok(clean.includes('<strong>bold</strong>'));
  assert.ok(clean.includes('<em>italics</em>'));
  assert.ok(!clean.includes('<script'));
  assert.ok(!clean.includes('onerror'));
  assert.ok(!clean.includes('javascript:'));
});

// ─── 3. KDP Royalty Parser & Normalization ────────────────────────────────

test('kdpCsvParser: normalizes marketplaces and formats correctly', () => {
  assert.equal(normalizeMarketplace('Amazon.co.uk'), 'amazon-uk');
  assert.equal(normalizeMarketplace('Amazon.de'), 'amazon-de');
  assert.equal(normalizeMarketplace('Amazon.in'), 'amazon-in');
  assert.equal(normalizeMarketplace('Amazon.com.au'), 'amazon-au');
  assert.equal(normalizeMarketplace('Unknown'), 'amazon-us');

  assert.equal(normalizeRoyaltyType('Paperback'), 'paperback');
  assert.equal(normalizeRoyaltyType('Hardcover'), 'hardcover');
  assert.equal(normalizeRoyaltyType('eBook'), 'ebook');
});

test('kdpCsvParser: parses Amazon KDP CSV report and calculates totals', () => {
  const csv = `
Title,ASIN/ISBN,Date,Marketplace,Royalty Type,Units Sold,Units Refunded,Royalty,Currency,KENP Read,KENP Royalty
"The Lost Horizon",B001234567,2026-08-15,Amazon.com,Paperback,25,1,120.50,USD,0,0
"The Lost Horizon",B001234567,2026-08-16,Amazon.co.uk,eBook,10,0,35.00,GBP,500,2.50
  `;

  const report = parseKdpRoyaltyReport(csv.trim());
  assert.equal(report.entries.length, 2);
  assert.equal(report.bookTitles.length, 1);
  assert.equal(report.bookTitles[0], 'The Lost Horizon');
  assert.equal(report.entries[0].unitsSold, 25);
  assert.equal(report.entries[0].netUnitsSold, 24);
  assert.equal(report.entries[1].marketplace, 'amazon-uk');
  assert.ok(report.totalRevenue > 100);
});

test('kdpCsvParser: parses Amazon KDP Excel (.xlsx) report', () => {
  const workbook = XLSX.utils.book_new();
  const data = [
    { Title: 'Kindle Millionaire', 'Royalty Type': 'eBook', Date: '2026-08-01', Marketplace: 'Amazon.com', 'Units Sold': 50, Royalty: 175.0, Currency: 'USD' },
    { Title: 'Kindle Millionaire', 'Royalty Type': 'Paperback', Date: '2026-08-02', Marketplace: 'Amazon.com', 'Units Sold': 15, Royalty: 60.0, Currency: 'USD' }
  ];
  const sheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Combined Royalties');
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

  const report = parseKdpExcelReport(buffer);
  assert.equal(report.entries.length, 2);
  assert.equal(report.bookTitles[0], 'Kindle Millionaire');
  assert.equal(report.totalUnits, 65);
  assert.equal(report.totalRevenue, 235);
});

// ─── 4. Workbook & Multi-Part Markdown Parsing ────────────────────────────

test('markdownParser & structureEngine: parses full Assertive Nurse workbook with tables and exercises', async () => {
  const { importManuscriptString } = await import('../src/lib/manuscriptImport/index');
  
  const sampleMd = `
# THE ASSERTIVE NURSE
## A Practical Workbook for Difficult Conversations with Patients, Families, and Your Team

---

*[Author Name]*

---

## COPYRIGHT PAGE

Copyright © 2026 by Author Name. All rights reserved.

---

## DISCLAIMER

This workbook is intended for educational purposes only.

---

## A NOTE TO THE READER

There is a specific feeling that most nurses recognize.

---

## INTRODUCTION: WHAT NURSING SCHOOL DIDN'T TEACH YOU

Communication gets a different treatment in nursing schools.

---

# PART ONE: THE FOUNDATION

## CHAPTER 1: KNOW YOUR COMMUNICATION PATTERN

Every nurse has a default response pattern.

### The Three Default Patterns
1. Over-Accommodator
2. Avoider
3. Over-Reactor

### EXERCISE 1.1: THE PATTERN INVENTORY
Describe your situation:
\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_

### EXERCISE 1.3: MY TRIGGER LIST

| Situation Type | Difficulty (1–5) | My Typical First Response |
|----------------|-----------------|--------------------------|
| An angry patient | 4 | Pause and listen |
| A dismissive physician | 5 | State the observation |

---

## CHAPTER 2: THE CLEAR METHOD — ONE FRAMEWORK FOR EVERY HARD CONVERSATION

The CLEAR method has 5 steps: Compose, Listen, Empathise, Address, Resolve.

| Step | Question | What You Do |
|------|----------|-------------|
| C - Compose | What is happening? | Orient yourself |
| L - Listen | What are they saying? | Create space |

---

## CHAPTER 3: WHAT HAPPENS TO YOU UNDER PRESSURE — AND HOW TO STAY FUNCTIONAL

Understanding neurological stress response.
  `;

  const parsed = await importManuscriptString(sampleMd, 'md');
  assert.equal(parsed.title, 'THE ASSERTIVE NURSE');
  assert.equal(parsed.subtitle, 'A Practical Workbook for Difficult Conversations with Patients, Families, and Your Team');
  assert.equal(parsed.author, 'Author Name');
  assert.ok(parsed.frontMatter.copyrightText?.includes('Copyright © 2026'));
  
  // Verify chapters
  const titles = parsed.chapters.map(c => c.title);
  assert.ok(titles.some(t => t.includes('COPYRIGHT') || t.includes('Copyright')));
  assert.ok(titles.some(t => t.includes('DISCLAIMER') || t.includes('Disclaimer')));
  assert.ok(titles.some(t => t.includes('INTRODUCTION')));
  assert.ok(titles.some(t => t.includes('CHAPTER 1')));
  assert.ok(titles.some(t => t.includes('CHAPTER 2')));
  assert.ok(titles.some(t => t.includes('CHAPTER 3')));

  // Check that Chapter 1 contains GFM table and fill-in line
  const chap1 = parsed.chapters.find(c => c.title.includes('CHAPTER 1'));
  assert.ok(chap1, 'Chapter 1 must exist');
  assert.ok(chap1.content.includes('<table') || chap1.content.includes('Situation Type'), 'Chapter 1 must render tables');
  assert.ok(chap1.content.includes('workbook-line'), 'Chapter 1 must convert fill-in blanks');
  assert.ok(chap1.content.includes('The Three Default Patterns'), 'Chapter 1 must retain subheadings');
});

// ─── 5. Chapter Bulk Deletion, Clear All & Rollback ────────────────────────

test('useBookStore: handles bulk chapter deletion, replacement, and rollback', async () => {
  const { useBookStore } = await import('../src/lib/store');
  const store = useBookStore.getState();

  const testBook = store.addBook({
    title: 'Rollback Test Book',
    author: 'Test Author',
    genre: 'Thriller',
    trimSize: '6x9',
    paperType: 'white',
  });

  // Add 4 chapters (in addition to initial Chapter 1: Untitled, making 5 total)
  const c1 = store.addChapter(testBook.id, 'Chapter 2: Start', '<p>First</p>');
  const c2 = store.addChapter(testBook.id, 'Chapter 3: Middle', '<p>Second</p>');
  const c3 = store.addChapter(testBook.id, 'Chapter 4: Climax', '<p>Third</p>');
  const c4 = store.addChapter(testBook.id, 'Chapter 5: Ending', '<p>Fourth</p>');

  let current = useBookStore.getState().books.find(b => b.id === testBook.id);
  assert.equal(current?.chapters.length, 5);

  // 1. Test deleteMultipleChapters
  useBookStore.getState().deleteMultipleChapters(testBook.id, [c2.id, c3.id]);
  current = useBookStore.getState().books.find(b => b.id === testBook.id);
  assert.equal(current?.chapters.length, 3);
  assert.equal(current?.chapters[0].title, 'Chapter 1: The Beginning');
  assert.equal(current?.chapters[1].title, 'Chapter 2: Start');
  assert.equal(current?.chapters[2].title, 'Chapter 5: Ending');

  // 2. Test replaceAllChapters
  const importedNew = [
    { id: 'imp_1', title: 'Imported Part 1', content: '<p>New 1</p>', wordCount: 100, order: 1 },
    { id: 'imp_2', title: 'Imported Part 2', content: '<p>New 2</p>', wordCount: 200, order: 2 },
  ];
  useBookStore.getState().replaceAllChapters(testBook.id, importedNew);
  current = useBookStore.getState().books.find(b => b.id === testBook.id);
  assert.equal(current?.chapters.length, 2);
  assert.equal(current?.chapters[0].title, 'Imported Part 1');

  // 3. Test clearAllChapters (resets to 1 empty chapter)
  useBookStore.getState().clearAllChapters(testBook.id);
  current = useBookStore.getState().books.find(b => b.id === testBook.id);
  assert.equal(current?.chapters.length, 1);
  assert.equal(current?.chapters[0].title, 'Chapter 1: The Beginning');

  // Cleanup test book
  useBookStore.getState().deleteBook(testBook.id);
});

test('brandService: formatCopyrightText injects viral KDP Studio imprint line', () => {
  const renderedWithImprint = formatCopyrightText('Copyright {year} by {author}. All rights reserved.', {
    year: 2026,
    author: 'Jane Austen',
    includeImprint: true,
  });

  assert.ok(renderedWithImprint.includes('Copyright 2026 by Jane Austen.'));
  assert.ok(renderedWithImprint.includes('Typeset and formatted using KDP Studio'));
  assert.ok(renderedWithImprint.includes('https://kdpstudio.com'));

  const renderedWithoutImprint = formatCopyrightText('Copyright {year} by {author}. All rights reserved.', {
    year: 2026,
    author: 'Jane Austen',
    includeImprint: false,
  });
  assert.ok(!renderedWithoutImprint.includes('Typeset and formatted using KDP Studio'));
});
