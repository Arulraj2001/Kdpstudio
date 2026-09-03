import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scanAiCliches,
  humanizeContent,
  calculateBurstiness,
  BANNED_AI_CLICHES,
} from '../src/lib/seo/humanizerRules';
import {
  KDP_KEYWORD_REPOSITORY,
  getNextUnwrittenKeyword,
} from '../src/lib/seo/kdpKeywordRepository';
import { validatePostQuality } from '../src/lib/aiBlogGenerator';

test('Humanizer Engine: accurately detects banned AI cliches', () => {
  const sampleRoboticAiText = `
    In today's fast-paced world, it is crucial to delve into the tapestry of Amazon KDP publishing.
    This platform is a testament to the digital landscape where authors can unlock the power of books.
    Furthermore, this revolutionary guide will demystify everything. In conclusion, publish now.
  `;

  const scan = scanAiCliches(sampleRoboticAiText);
  assert.equal(scan.hasViolations, true);
  assert.ok(scan.totalViolations >= 6, `Expected at least 6 violations, got ${scan.totalViolations}`);
  
  const foundPhrases = scan.violations.map(v => v.phrase);
  assert.ok(foundPhrases.includes("in today's fast-paced world"));
  assert.ok(foundPhrases.includes('crucial'));
  assert.ok(foundPhrases.includes('delve into'));
  assert.ok(foundPhrases.includes('tapestry'));
  assert.ok(foundPhrases.includes('a testament to') || foundPhrases.includes('testament'));
  assert.ok(foundPhrases.includes('in conclusion'));
});

test('Humanizer Engine: cleans and replaces AI cliches with natural publisher terms', () => {
  const dirtyText = '<p>Let us delve into how this is a testament to formatting.</p>';
  const { cleanedHtml, wasModified } = humanizeContent(dirtyText);

  assert.equal(wasModified, true);
  assert.ok(!cleanedHtml.includes('delve into'), 'delve into should be replaced');
  assert.ok(!cleanedHtml.includes('a testament to'), 'a testament to should be replaced');
  assert.ok(cleanedHtml.includes('explore'));
  assert.ok(cleanedHtml.includes('proof of') || cleanedHtml.includes('proves'));
});

test('Humanizer Engine: calculates sentence burstiness correctly', () => {
  // Diverse human writing: short punchy statements mixed with detailed explanations
  const humanProse = `
    KDP margins confuse most authors. When you upload a 150-page book to Amazon, Amazon adds a mandatory 0.375-inch gutter margin so the book spine does not pinch your text. Make sure you check this. If you ignore the gutter, your book gets rejected at review.
  `;

  const burstiness = calculateBurstiness(humanProse);
  assert.equal(burstiness.totalSentences, 4);
  assert.ok(burstiness.averageSentenceLength > 0);
  assert.ok(burstiness.shortestSentenceLength <= 6);
});

test('KDP Keyword Repository: holds valid clusters and rotates unwritten keywords', () => {
  assert.ok(KDP_KEYWORD_REPOSITORY.length >= 10, 'Should have rich repository of KDP topics');

  // Verify each cluster integrity
  for (const cluster of KDP_KEYWORD_REPOSITORY) {
    assert.ok(cluster.keyword, 'Keyword must exist');
    assert.ok(cluster.slug, 'Slug must exist');
    assert.ok(cluster.category, 'Category must exist');
    assert.ok(cluster.searchIntent, 'Search intent must exist');
  }

  // Test slug rotation
  const firstSlug = KDP_KEYWORD_REPOSITORY[0].slug;
  const next = getNextUnwrittenKeyword([firstSlug]);
  assert.ok(next);
  assert.notEqual(next.slug, firstSlug, 'Should rotate to the next unwritten slug');
});

test('Quality Gate Validator: rejects thin and low-structure content', () => {
  const thinPost = {
    title: 'Short Post',
    metaTitle: 'Short Post',
    metaDescription: 'Desc',
    focusKeyword: 'kdp',
    slug: 'short-post',
    content: '<p>Only a few words here with no headings or tables.</p>',
    faqItems: [],
  };

  const gateResult = validatePostQuality(thinPost, { minWordCount: 1600, maxClicheCount: 0, minSeoScore: 80 });
  assert.equal(gateResult.passed, false);
  assert.ok(gateResult.gateFailures.some(f => f.includes('Word count too low')));
  assert.ok(gateResult.gateFailures.some(f => f.includes('Insufficient H2 headings')));
  assert.ok(gateResult.gateFailures.some(f => f.includes('Missing comparison or data table')));
  assert.ok(gateResult.gateFailures.some(f => f.includes('Insufficient FAQ items')));
});
