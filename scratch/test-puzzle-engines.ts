/**
 * Verification script for Phase 11A Word Search, Word Fit, and PDF Renderer
 */
import { generateWordSearchGrid, generateAnswerGrid } from '../src/lib/puzzles/wordSearch';
import { generateWordFitGrid, groupWordsByLength } from '../src/lib/puzzles/wordFit';
import { generatePuzzleBookHtml } from '../src/lib/puzzles/puzzlePdfRenderer';
import { PuzzleBook } from '../src/types/puzzle';

async function testPuzzleEngines() {
  console.log('--- TESTING PHASE 11A PUZZLE ENGINES ---\n');

  // 1. Test Word Search Engine
  const wsWords = ['GALAXY', 'PLANET', 'ROCKET', 'COMET', 'ASTEROID', 'NEBULA', 'COSMOS', 'ORBIT', 'STAR', 'MOON'];
  const wsResult = generateWordSearchGrid(wsWords, 12);
  console.log(`Word Search: Placed ${wsResult.placedWords.length}/${wsWords.length} words in 12x12 grid.`);
  console.log('Sample Grid row 0:', wsResult.grid[0].join(' '));

  const answerGrid = generateAnswerGrid(wsResult.grid, wsResult.placedWords);
  console.log('Sample Answer row 0:', answerGrid[0].join(' '));

  if (wsResult.placedWords.length === 0) throw new Error('Word Search placement failed');

  // 2. Test Word Fit Engine
  const wfWords = ['SOLAR', 'EARTH', 'MARS', 'VENUS', 'JUPITER', 'SATURN', 'URANUS', 'NEPTUNE', 'PLUTO', 'SUN'];
  const wfResult = generateWordFitGrid(wfWords, 15);
  console.log(`Word Fit: Placed ${wfResult.placedWords.length}/${wfWords.length} words in 15x15 grid.`);
  console.log(`Word Fit slots: ${wfResult.slots.length} crossword slots created.`);

  const grouped = groupWordsByLength(wfResult.placedWords);
  console.log('Word Fit grouped by length:', Object.keys(grouped).map(k => `${k}-letter: ${grouped[Number(k)].length}`).join(', '));

  // 3. Test PDF HTML Renderer
  const mockBook: PuzzleBook = {
    id: 'test_book_1',
    uid: 'user_1',
    settings: {
      type: 'word-search',
      title: 'Solar System Word Search',
      subtitle: 'Space Adventures for Kids',
      author: 'Space Author',
      theme: 'Astronomy',
      difficulty: 'medium',
      pageCount: 2,
      trimSize: '8.5x11',
      includeAnswers: true,
      includeCoverPage: true,
      includeInstructions: true,
      paperType: 'white',
    },
    pages: [
      {
        id: 'p_1',
        pageNumber: 1,
        type: 'word-search',
        title: 'Planets of the Galaxy',
        puzzleData: wsResult,
        answerData: answerGrid,
        status: 'done',
      },
      {
        id: 'p_2',
        pageNumber: 2,
        type: 'word-fit',
        title: 'Space Fit Crossword',
        puzzleData: wfResult,
        status: 'done',
      },
    ],
    status: 'complete',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalPages: 5,
  };

  const html = generatePuzzleBookHtml(mockBook, mockBook.settings, mockBook.pages);
  console.log(`\nGenerated PDF HTML string length: ${html.length} bytes.`);
  if (!html.includes('Solar System Word Search') || !html.includes('ANSWER KEY')) {
    throw new Error('PDF HTML missing essential sections');
  }

  console.log('\n--- ALL PHASE 11A TESTS PASSED SUCCESSFULLY ---');
}

testPuzzleEngines().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
