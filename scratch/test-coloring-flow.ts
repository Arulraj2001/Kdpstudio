/**
 * Comprehensive Phase 11D Coloring Book Generator Flow Test
 */
import { generateColoringPromptsHandler } from '../src/app/api/puzzles/coloring/generate-prompts/route';
import { runColoringBookGeneration } from '../src/app/api/puzzles/coloring/generate/route';
import { getPuzzleBook } from '../src/lib/puzzleService';
import { generatePuzzleBookHtml } from '../src/lib/puzzles/puzzlePdfRenderer';

async function testColoringFlow() {
  console.log('--- STARTING PHASE 11D COLORING BOOK VERIFICATION ---\n');

  // 1. Test Prompt Generator
  console.log('1. Testing Coloring Prompt Generator...');
  const prompts = await generateColoringPromptsHandler({
    theme: 'Enchanted Forest Animals',
    style: 'detailed',
    targetAge: 'Adults',
    pageCount: 5,
    lineThickness: 'medium',
  });

  console.log(`Generated ${prompts.length} prompt descriptions:`);
  prompts.forEach((p, i) => console.log(`  - #${i + 1}: ${p}`));
  if (prompts.length < 3) throw new Error('Too few prompts generated');

  // 2. Test Full Book Generation
  console.log('\n2. Testing Full Coloring Book Generation Pipeline...');
  const bookId = `test_col_book_${Date.now()}`;
  const genResult = await runColoringBookGeneration(
    bookId,
    prompts,
    {
      type: 'coloring',
      title: 'Enchanted Forest Animals Coloring Book',
      subtitle: '20 Intricate Line Art Designs for Mindfulness',
      author: 'Studio Artistry',
      theme: 'Enchanted Forest Animals',
      difficulty: 'medium',
      pageCount: 5,
      trimSize: '8.5x8.5',
      illustrationStyle: 'detailed',
      targetAge: 'Adults',
      lineThickness: 'medium',
      includeAnswers: false,
      includeCoverPage: true,
      includeInstructions: true,
      paperType: 'white',
    }
  );

  console.log('Generation result:', genResult);
  if (!genResult.success) throw new Error('Coloring book generation failed');

  // 3. Verify Saved Book
  console.log('\n3. Verifying Saved PuzzleBook Document...');
  const savedBook = await getPuzzleBook(bookId);
  if (!savedBook) throw new Error('Could not find saved Coloring puzzle book in storage');

  console.log(`Book ID: ${savedBook.id}`);
  console.log(`Title: ${savedBook.settings.title}`);
  console.log(`Sheets Count: ${savedBook.pages.length}`);
  console.log(`Total Book Pages (with blank backs & cover): ${savedBook.totalPages}`);

  savedBook.pages.forEach((page) => {
    console.log(`  - Sheet ${page.pageNumber}: "${page.title}" (Image: ${page.imageUrl ? '✓ Ready' : '❌ Missing'})`);
    if (!page.imageUrl) {
      throw new Error(`Sheet ${page.pageNumber} is missing imageUrl`);
    }
  });

  // 4. Test PDF HTML Compilation
  console.log('\n4. Verifying Coloring Book PDF HTML Compilation...');
  const html = generatePuzzleBookHtml(savedBook, savedBook.settings, savedBook.pages);
  console.log(`Compiled HTML length: ${html.length} bytes`);
  if (!html.includes('Enchanted Forest Animals') || !html.includes('coloring-img') || !html.includes('intentionally left blank')) {
    throw new Error('Compiled HTML is missing book title, coloring image frame, or blank back page markup');
  }

  console.log('\n--- ALL PHASE 11D COLORING BOOK TESTS PASSED! ---');
}

testColoringFlow().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
