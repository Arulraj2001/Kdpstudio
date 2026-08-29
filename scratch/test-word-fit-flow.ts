/**
 * Comprehensive Phase 11C Word Fit Generator Flow Test
 */
import { runWordFitGeneration } from '../src/app/api/puzzles/word-fit/generate/route';
import { getPuzzleBook } from '../src/lib/puzzleService';
import { generatePuzzleBookHtml } from '../src/lib/puzzles/puzzlePdfRenderer';
import { WordFitResult } from '../src/lib/puzzles/wordFit';

async function testWordFitFlow() {
  console.log('--- STARTING PHASE 11C WORD FIT VERIFICATION ---\n');

  const bookId = `test_wf_book_${Date.now()}`;
  console.log('1. Testing Full Word Fit Book Generation Pipeline...');

  const genResult = await runWordFitGeneration(bookId, {
    type: 'word-fit',
    title: 'Ocean Life Word Fit',
    subtitle: '50 Themed Fill-In Crossword Puzzles with Solutions',
    author: 'Marine Press',
    theme: 'Ocean Creatures & Habitats',
    difficulty: 'medium',
    pageCount: 5,
    trimSize: '8.5x11',
    gridSize: 15,
    wordCount: 16,
    includeAnswers: true,
    includeCoverPage: true,
    includeInstructions: true,
    paperType: 'white',
    aiGenerateWords: true,
  });

  console.log('Generation result:', genResult);
  if (!genResult.success) throw new Error('Word Fit book generation failed');

  // 2. Verify saved book
  console.log('\n2. Verifying Saved PuzzleBook Document...');
  const savedBook = await getPuzzleBook(bookId);
  if (!savedBook) throw new Error('Could not find saved Word Fit puzzle book in storage');

  console.log(`Book ID: ${savedBook.id}`);
  console.log(`Title: ${savedBook.settings.title}`);
  console.log(`Pages Count: ${savedBook.pages.length}`);
  console.log(`Total Book Pages: ${savedBook.totalPages}`);

  savedBook.pages.forEach((page) => {
    const data = page.puzzleData as WordFitResult;
    const pw = data?.placedWords?.length || 0;
    const slots = data?.slots?.length || 0;
    console.log(`  - Page ${page.pageNumber}: "${page.title}" (${pw} placed words, ${slots} numbered slots)`);
    if (pw < 8) {
      throw new Error(`Page ${page.pageNumber} placed too few words: ${pw}`);
    }
  });

  // 3. Verify PDF HTML compilation
  console.log('\n3. Verifying Word Fit PDF HTML Compilation...');
  const html = generatePuzzleBookHtml(savedBook, savedBook.settings, savedBook.pages);
  console.log(`Compiled HTML length: ${html.length} bytes`);
  if (!html.includes('Ocean Life Word Fit') || !html.includes('wf-table') || !html.includes('Letters')) {
    throw new Error('Compiled HTML is missing Word Fit table or grouped length titles');
  }

  console.log('\n--- ALL PHASE 11C WORD FIT TESTS PASSED! ---');
}

testWordFitFlow().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
