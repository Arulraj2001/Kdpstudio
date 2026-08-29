/**
 * Comprehensive Phase 11B Word Search Generator Flow Test
 */
import { generateWordsHandler } from '../src/app/api/puzzles/generate-words/route';
import { runWordSearchGeneration } from '../src/app/api/puzzles/word-search/generate/route';
import { getPuzzleBook } from '../src/lib/puzzleService';
import { generatePuzzleBookHtml } from '../src/lib/puzzles/puzzlePdfRenderer';

async function testWordSearchFlow() {
  console.log('--- STARTING PHASE 11B WORD SEARCH VERIFICATION ---\n');

  // 1. Test word generator handler
  console.log('1. Testing Word Generator Handler...');
  const words = await generateWordsHandler({
    theme: 'Space Exploration',
    count: 14,
    wordLength: 'Mixed',
    includeProperNouns: true,
  });
  console.log(`Generated ${words.length} theme words:`, words.slice(0, 8).join(', '));
  if (words.length < 8) throw new Error('Word generation returned too few words');

  // 2. Test Full Book Generation Pipeline
  console.log('\n2. Testing Full Book Generation Pipeline...');
  const bookId = `test_ws_book_${Date.now()}`;
  const genResult = await runWordSearchGeneration(bookId, {
    type: 'word-search',
    title: 'Galactic Word Searches',
    subtitle: '50 Cosmic Puzzles for Stargazers',
    author: 'Astronomy Club',
    theme: 'Planets and Stars',
    difficulty: 'medium',
    pageCount: 5,
    trimSize: '8.5x11',
    gridSize: 12,
    wordCount: 12,
    directions: ['horizontal', 'vertical', 'diagonal'],
    includeAnswers: true,
    includeCoverPage: true,
    includeInstructions: true,
    paperType: 'white',
    aiGenerateWords: true,
  });

  console.log('Generation result:', genResult);
  if (!genResult.success) throw new Error('Full book generation failed');

  // 3. Fetch generated book from storage
  console.log('\n3. Verifying Saved PuzzleBook Document...');
  const savedBook = await getPuzzleBook(bookId);
  if (!savedBook) throw new Error('Could not find saved puzzle book in storage');

  console.log(`Book ID: ${savedBook.id}`);
  console.log(`Title: ${savedBook.settings.title}`);
  console.log(`Pages Count: ${savedBook.pages.length}`);
  console.log(`Total Book Pages: ${savedBook.totalPages}`);

  savedBook.pages.forEach((page, i) => {
    const pw = page.puzzleData?.placedWords?.length || 0;
    console.log(`  - Page ${page.pageNumber}: "${page.title}" (${pw} placed words)`);
    if (pw < 8) {
      throw new Error(`Page ${page.pageNumber} placed too few words: ${pw}`);
    }
  });

  // 4. Test PDF HTML compilation
  console.log('\n4. Verifying PDF HTML Compilation...');
  const html = generatePuzzleBookHtml(savedBook, savedBook.settings, savedBook.pages);
  console.log(`Compiled HTML length: ${html.length} bytes`);
  if (!html.includes('Galactic Word Searches') || !html.includes('ANSWER KEY')) {
    throw new Error('Compiled HTML is missing book title or answer key');
  }

  console.log('\n--- ALL PHASE 11B WORD SEARCH TESTS PASSED! ---');
}

testWordSearchFlow().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
