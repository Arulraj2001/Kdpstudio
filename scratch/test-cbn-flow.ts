/**
 * Comprehensive Phase 11E Color by Number Generator Flow Test
 */
import { generateSceneHandler } from '../src/app/api/puzzles/color-by-number/generate-scene/route';
import { runColorByNumberBookGeneration } from '../src/app/api/puzzles/color-by-number/generate/route';
import { getPuzzleBook } from '../src/lib/puzzleService';
import { generatePuzzleBookHtml } from '../src/lib/puzzles/puzzlePdfRenderer';
import { 
  generateFallbackColorByNumberScene, 
  generateColorByNumberSvg, 
  generateAnswerSvg 
} from '../src/lib/puzzles/colorByNumber';

async function testColorByNumberFlow() {
  console.log('--- STARTING PHASE 11E COLOR BY NUMBER VERIFICATION ---\n');

  // 1. Test Pure Engine
  console.log('1. Testing Color by Number Pure SVG Engine...');
  const sampleScene = generateFallbackColorByNumberScene('Ocean Animals', 1, 'medium');
  console.log(`Scene title: "${sampleScene.title}"`);
  console.log(`Regions count: ${sampleScene.regions.length}`);
  console.log(`Color palette key items: ${sampleScene.colorKey.length}`);

  const puzzleSvg = generateColorByNumberSvg(sampleScene);
  const answerSvg = generateAnswerSvg(sampleScene);

  if (!puzzleSvg.includes('<svg') || !puzzleSvg.includes('cbn-region')) {
    throw new Error('Puzzle SVG failed to render properly');
  }
  if (!answerSvg.includes('<svg') || !answerSvg.includes('fill="#')) {
    throw new Error('Answer SVG failed to render with colors');
  }
  console.log('Engine SVG and answer SVG generation verified ✓');

  // 2. Test Scene Generation Handler
  console.log('\n2. Testing Color by Number Scene API Handler...');
  const sceneResult = await generateSceneHandler({
    theme: 'Tropical Wildlife',
    complexity: 'medium',
    colorsCount: 8,
    pageNum: 1,
  });

  console.log(`Generated Scene: "${sceneResult.title}" with ${sceneResult.regions.length} regions`);
  if (!sceneResult.regions || sceneResult.regions.length < 4) {
    throw new Error('Scene generation produced too few regions');
  }

  // 3. Test Full Book Generation
  console.log('\n3. Testing Full Color by Number Book Generation Pipeline...');
  const bookId = `test_cbn_book_${Date.now()}`;
  const genResult = await runColorByNumberBookGeneration(
    bookId,
    {
      type: 'color-by-number',
      title: 'Tropical Wildlife Color by Number',
      subtitle: '20 Geometric Mosaic Scenes with Numbered Palettes',
      author: 'Kindle Activity Studio',
      theme: 'Tropical Wildlife',
      difficulty: 'medium',
      complexity: 'medium',
      colorsCount: 8,
      pageCount: 5,
      trimSize: '8.5x11',
      includeAnswers: true,
      includeCoverPage: true,
      includeInstructions: true,
      paperType: 'white',
    },
    [
      'Toucan perched on rainforest branch',
      'Sea turtle swimming over coral reef',
      'Jaguar resting near jungle waterfall',
      'Parrot flock in sunlit canopy',
      'Chameleon camouflaged among tropical orchids'
    ]
  );

  console.log('Generation result:', genResult);
  if (!genResult.success) throw new Error('Color by number book generation failed');

  // 4. Verify Saved Book Document
  console.log('\n4. Verifying Saved PuzzleBook Document...');
  const savedBook = await getPuzzleBook(bookId);
  if (!savedBook) throw new Error('Could not find saved Color by Number book in storage');

  console.log(`Book ID: ${savedBook.id}`);
  console.log(`Title: ${savedBook.settings.title}`);
  console.log(`Scenes Count: ${savedBook.pages.length}`);
  console.log(`Total Book Pages: ${savedBook.totalPages}`);

  savedBook.pages.forEach((page) => {
    console.log(`  - Scene #${page.pageNumber}: "${page.title}" (Palette: ${page.puzzleData?.palette?.length || 0} colors, SVG: ✓ Ready)`);
    if (!page.imageUrl || !page.puzzleData?.svg) {
      throw new Error(`Scene #${page.pageNumber} missing SVG puzzle data`);
    }
  });

  // 5. Test PDF HTML Compilation
  console.log('\n5. Verifying PDF HTML Compilation & Answer Section...');
  const html = generatePuzzleBookHtml(savedBook, savedBook.settings, savedBook.pages);
  console.log(`Compiled HTML length: ${html.length} bytes`);

  if (!html.includes('Tropical Wildlife') || !html.includes('COLOR PALETTE KEY') || !html.includes('ANSWERS — DO NOT PEEK!')) {
    throw new Error('Compiled HTML is missing title, palette key, or answer section');
  }

  console.log('\n--- ALL PHASE 11E COLOR BY NUMBER TESTS PASSED! ---');
}

testColorByNumberFlow().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
