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
