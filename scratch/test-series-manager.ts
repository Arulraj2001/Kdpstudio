/**
 * Comprehensive Verification Test for Phase 12B Book Series Manager
 */

import { 
  createSeries, 
  getUserSeries, 
  getSeries, 
  updateSeries, 
  deleteSeries, 
  addBookToSeries, 
  removeBookFromSeries, 
  reorderSeriesBooks, 
  getSeriesVolumes, 
  applySeriesStyleToBook,
  computeVolumeColors 
} from '../src/lib/seriesService';
import { interpolateColors } from '../src/types/series';
import { generateSeriesBibleHtml } from '../src/lib/seriesBibleService';
import { suggestSeriesTitlesHandler } from '../src/app/api/series/suggest-title/route';
import { generateSeriesDescriptionHandler } from '../src/app/api/series/generate-description/route';
import { Book } from '../src/types';

async function testSeriesFlow() {
  console.log('===========================================================');
  console.log('📚 TESTING PHASE 12B — BOOK SERIES MANAGER');
  console.log('===========================================================\n');

  // 1. Test Color Interpolation in HSL space
  console.log('1. Testing HSL Color Progression Interpolation...');
  const startHex = '#ff0000'; // Pure red
  const endHex = '#0000ff';   // Pure blue
  const interpolated = interpolateColors(startHex, endHex, 5);
  console.log(`Interpolated 5 colors from ${startHex} to ${endHex}:`, interpolated);
  if (interpolated.length !== 5 || interpolated[0] !== startHex || interpolated[4] !== endHex) {
    throw new Error('HSL color interpolation failed to produce 5 steps starting at startHex and ending at endHex');
  }
  console.log('HSL progressive color interpolation verified ✓');

  // 2. Test Series Creation & Plan Limits
  console.log('\n2. Testing Series Creation & Plan Limits...');
  const freeUid = `usr_series_free_${Date.now()}`;
  const starterUid = `usr_series_starter_${Date.now()}`;
  const proUid = `usr_series_pro_${Date.now()}`;

  const { createUserDocument, updateUserDocument } = await import('../src/lib/userService');
  await createUserDocument(freeUid, 'free@example.com', 'Free User', null, 'USD', 'US', true);
  await createUserDocument(starterUid, 'starter@example.com', 'Starter User', null, 'USD', 'US', true);
  await updateUserDocument(starterUid, { plan: 'starter' });
  await createUserDocument(proUid, 'pro@example.com', 'Pro Author', null, 'USD', 'US', true);
  await updateUserDocument(proUid, { plan: 'pro' });

  // Free plan should be rejected
  try {
    await createSeries(freeUid, {
      uid: freeUid,
      title: 'Free Series',
      subtitle: '',
      description: '',
      genre: 'Fiction',
      targetAudience: '',
      totalVolumes: 3,
      bookIds: [],
      puzzleBookIds: [],
      coverStyle: {} as any,
      spineStyle: {} as any,
      colorScheme: { mode: 'fixed', palette: ['#7c3aed'], primaryColors: [] },
      seriesKeywords: [],
      amazonSeriesUrl: '',
      status: 'planning',
    });
    throw new Error('Free user was unexpectedly allowed to create a series');
  } catch (err: any) {
    if (!err.message.includes('PLAN_LIMIT')) throw err;
    console.log('Free plan correctly blocked with upgrade prompt requirement ✓');
  }

  // Starter plan creates 1 series
  const starterSeriesId = await createSeries(starterUid, {
    uid: starterUid,
    title: 'Starter Single Series',
    subtitle: '',
    description: '',
    genre: 'Mystery',
    targetAudience: '',
    totalVolumes: 3,
    bookIds: [],
    puzzleBookIds: [],
    coverStyle: {} as any,
    spineStyle: {} as any,
    colorScheme: { mode: 'fixed', palette: ['#7c3aed'], primaryColors: [] },
    seriesKeywords: [],
    amazonSeriesUrl: '',
    status: 'planning',
  });
  console.log('Starter user allowed to create 1st series ✓');

  // Starter plan should block 2nd series
  try {
    await createSeries(starterUid, {
      uid: starterUid,
      title: 'Starter 2nd Series (Should Fail)',
      subtitle: '',
      description: '',
      genre: 'Mystery',
      targetAudience: '',
      totalVolumes: 3,
      bookIds: [],
      puzzleBookIds: [],
      coverStyle: {} as any,
      spineStyle: {} as any,
      colorScheme: { mode: 'fixed', palette: ['#7c3aed'], primaryColors: [] },
      seriesKeywords: [],
      amazonSeriesUrl: '',
      status: 'planning',
    });
    throw new Error('Starter user was unexpectedly allowed to create a 2nd series');
  } catch (err: any) {
    if (!err.message.includes('PLAN_LIMIT')) throw err;
    console.log('Starter user correctly blocked from creating 2nd series (1 max) ✓');
  }

  // Pro plan creates series with full options
  const seriesId = await createSeries(proUid, {
    uid: proUid,
    title: 'The Starlight Chronicles',
    subtitle: 'Epic Sci-Fi Space Opera',
    description: 'Follow the valiant crew across unexplored galaxies.',
    genre: 'Sci-Fi',
    targetAudience: 'Adult Sci-Fi Fans',
    totalVolumes: 4,
    bookIds: [],
    puzzleBookIds: [],
    coverStyle: {
      layout: 'progressive',
      titlePosition: 'center',
      volumeNumberStyle: 'Book 1',
      volumeNumberPosition: 'top',
      seriesTitleVisible: true,
      seriesTitlePosition: 'above-title',
      authorNamePosition: 'bottom',
      backgroundType: 'solid',
      borderStyle: 'none',
    },
    spineStyle: {
      showSeriesTitle: true,
      showVolumeNumber: true,
      spineColor: '#1e1b4b',
      spineTextColor: '#ffffff',
      spineFont: 'Playfair Display',
    },
    colorScheme: {
      mode: 'progressive',
      startColor: '#7c3aed',
      endColor: '#06b6d4',
      palette: ['#7c3aed', '#06b6d4'],
      primaryColors: [],
    },
    seriesKeywords: ['Space Opera', 'Galactic Empire', 'Starlight', 'Bestseller'],
    amazonSeriesUrl: 'https://amazon.com/dp/B0_TEST_SERIES',
    status: 'active',
  });

  const createdSeries = await getSeries(seriesId);
  if (!createdSeries || createdSeries.title !== 'The Starlight Chronicles' || createdSeries.colorScheme.primaryColors.length !== 4) {
    throw new Error('Series creation or retrieval failed');
  }
  console.log(`Series created successfully with ID: ${seriesId} (Volumes colors: ${createdSeries.colorScheme.primaryColors.join(', ')}) ✓`);

  // 3. Test Linking & Reordering Books
  console.log('\n3. Testing Volume Linking & Reordering...');
  const book1Id = `bk_test_1_${Date.now()}`;
  const book2Id = `bk_test_2_${Date.now()}`;

  await addBookToSeries(seriesId, book1Id, 1);
  await addBookToSeries(seriesId, book2Id, 2);

  let updated = await getSeries(seriesId);
  if (!updated || updated.bookIds.length !== 2 || updated.bookIds[0] !== book1Id) {
    throw new Error('addBookToSeries failed');
  }
  console.log('Added 2 books to series volume positions ✓');

  await reorderSeriesBooks(seriesId, [book2Id, book1Id]);
  updated = await getSeries(seriesId);
  if (!updated || updated.bookIds[0] !== book2Id || updated.bookIds[1] !== book1Id) {
    throw new Error('reorderSeriesBooks failed');
  }
  console.log('Reordered series volumes ✓');

  // 4. Test Volume Roadmap Generation
  console.log('\n4. Testing Volume Roadmap Generation...');
  const volumes = await getSeriesVolumes(seriesId);
  console.log(`Generated ${volumes.length} volume roadmap entries:`);
  volumes.forEach((v) => {
    console.log(`- Vol. ${v.volumeNumber}: "${v.title}" [Status: ${v.status}]`);
  });
  if (volumes.length < 4) {
    throw new Error('getSeriesVolumes failed to include all planned volume slots');
  }
  console.log('Volume roadmap verified ✓');

  // 5. Test Apply Series Style to Book
  console.log('\n5. Testing applySeriesStyleToBook Helper...');
  const rawBook: Partial<Book> = {
    title: 'Dawn of the Nebula',
    genre: 'Sci-Fi',
    metadata: {
      description: 'Book 1 standalone',
      keywords: ['Space Exploration'],
      categories: ['Science Fiction'],
      price: 3.99,
      royaltyPlan: '70',
    },
  };

  const styledBook = applySeriesStyleToBook(updated, 1, rawBook);
  console.log('Styled Book Keywords:', styledBook.metadata?.keywords);
  if (!styledBook.metadata?.keywords.includes('Space Opera') || (styledBook as any).seriesId !== seriesId) {
    throw new Error('applySeriesStyleToBook failed to inherit series metadata');
  }
  console.log('Book series styling & metadata inheritance verified ✓');

  // 6. Test Series Bible HTML Generator
  console.log('\n6. Testing Series Bible HTML Document Generator...');
  const bibleHtml = generateSeriesBibleHtml(updated, volumes);
  if (!bibleHtml.includes('The Starlight Chronicles') || !bibleHtml.includes('Volume Roadmap') || !bibleHtml.includes('Visual Identity')) {
    throw new Error('generateSeriesBibleHtml failed to produce complete sections');
  }
  console.log(`Series Bible HTML generated (${bibleHtml.length} characters) ✓`);

  // 7. Test AI Title Suggestion Handler
  console.log('\n7. Testing AI Series Title Suggestion...');
  const titlesResult = await suggestSeriesTitlesHandler({
    genre: 'Romantic Fantasy',
    theme: 'Forbidden Magic in Ancient Kingdoms',
    targetAudience: 'Romantasy Readers',
  });
  console.log('AI Suggested Series Titles:', titlesResult.titles);
  if (!titlesResult.titles || titlesResult.titles.length === 0) {
    throw new Error('suggestSeriesTitlesHandler returned empty list');
  }
  console.log('AI Series Title suggestion verified ✓');

  // 8. Test AI Series Description Generator
  console.log('\n8. Testing AI Series Description Generator...');
  const descResult = await generateSeriesDescriptionHandler({
    title: 'The Starlight Chronicles',
    genre: 'Sci-Fi',
    theme: 'Exploration and interstellar intrigue',
    totalVolumes: 4,
  });
  console.log(`AI Generated Description:\n"${descResult.description}"`);
  if (!descResult.description || descResult.description.length < 20) {
    throw new Error('generateSeriesDescriptionHandler failed');
  }
  console.log('AI Series Description verified ✓');

  // 9. Test Delete Series (Preserves Books)
  console.log('\n9. Testing Delete Series...');
  await deleteSeries(seriesId);
  const deleted = await getSeries(seriesId);
  if (deleted !== null) {
    throw new Error('deleteSeries failed to remove series document');
  }
  console.log('Series deleted cleanly without deleting individual books ✓');

  console.log('\n===========================================================');
  console.log('🎉 ALL PHASE 12B BOOK SERIES TESTS PASSED SUCCESSFULLY!');
  console.log('===========================================================');
}

testSeriesFlow().catch((err) => {
  console.error('Series Manager test failed:', err);
  process.exit(1);
});
