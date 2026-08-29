/**
 * Comprehensive Test Suite for Phase 12A Brand Kit
 */
import { 
  getBrandKit, 
  saveBrandKit, 
  formatCopyrightText, 
  applyBrandKitToBook, 
  getBrandKitForCover 
} from '../src/lib/brandService';
import { generateBioHandler } from '../src/app/api/brand/generate-bio/route';
import { generatePaletteHandler } from '../src/app/api/brand/generate-palette/route';
import { DEFAULT_BRAND_KIT, BrandKit } from '../src/types/brand';
import { Book } from '../src/types';

async function testBrandKitFlow() {
  console.log('===========================================================');
  console.log('🧪 TESTING PHASE 12A — AUTHOR BRAND KIT SYSTEM');
  console.log('===========================================================\n');

  const testUid = `usr_brand_test_${Date.now()}`;

  // 1. Test Save and Retrieve Brand Kit
  console.log('1. Testing Brand Kit Persistence CRUD...');
  const sampleKit: BrandKit = {
    ...DEFAULT_BRAND_KIT,
    uid: testUid,
    authorName: 'Evelyn Sterling',
    penNames: [
      { name: 'E. S. Rivers', genre: 'Sci-Fi Thriller', bio: 'Speculative fiction pseudonym', isDefault: false },
      { name: 'Eva Moon', genre: 'Dark Romance', bio: 'Romance author persona', isDefault: true }
    ],
    activePenName: 'Eva Moon',
    authorBioShort: 'Evelyn Sterling writes international bestselling speculative romance.',
    authorBioMedium: 'Evelyn Sterling is a bestselling author whose novels have captivated readers worldwide. When not penning high-concept adventures, Evelyn enjoys vintage tea and mountain hikes.',
    authorBioLong: 'Evelyn Sterling is an acclaimed novelist whose works blend intricate worlds with passionate characters.',
    primaryColor: '#8b5cf6',
    secondaryColor: '#ec4899',
    accentColor: '#f59e0b',
    textColor: '#1e1b4b',
    backgroundColor: '#fdf4ff',
    headingFont: 'Playfair Display',
    bodyFont: 'Lora',
    accentFont: 'Montserrat',
    logoUrl: 'https://example.com/logo.png',
    logoText: 'Sterling Books',
    publisherName: 'Silverleaf Publishing',
    authorWebsite: 'https://evelynsterling.com',
    authorEmail: 'contact@evelynsterling.com',
    amazonAuthorUrl: 'https://amazon.com/author/evelynsterling',
    goodreadsUrl: 'https://goodreads.com/author/show/evelynsterling',
    instagramHandle: '@evelynsterlingbooks',
    facebookPage: 'https://facebook.com/evelynsterlingauthor',
    twitterHandle: '@evelyn_author',
    youtubeChannelUrl: 'https://youtube.com/@evelynsterling',
    tiktokHandle: '@evelynsterlingauthor',
    defaultTrimSize: '5.5x8.5',
    defaultPaperType: 'cream',
    defaultLanguage: 'English',
    defaultGenre: 'Romance',
    autoApplyToNewBooks: true,
    copyrightTemplate: 'Copyright © {year} {author}. Published by {publisher}. Website: {website}. All rights reserved.',
    disclaimer: 'This is a work of romantic fiction.',
    defaultCoverStyle: 'Romantic Minimalist',
    defaultCoverFont: 'Playfair Display',
    defaultCoverPrimaryColor: '#8b5cf6',
    defaultCoverPattern: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveBrandKit(testUid, sampleKit);
  const retrieved = await getBrandKit(testUid);
  if (!retrieved || retrieved.authorName !== 'Evelyn Sterling' || retrieved.penNames.length !== 2) {
    throw new Error('Brand Kit save or get operation failed');
  }
  console.log(`Saved and retrieved Brand Kit for author: "${retrieved.authorName}" (Active Pen Name: "${retrieved.activePenName}") ✓`);

  // 2. Test Copyright Variable Substitution
  console.log('\n2. Testing Copyright Template Variable Formatting...');
  const formattedCopyright = formatCopyrightText(retrieved.copyrightTemplate, {
    year: 2026,
    author: retrieved.activePenName,
    publisher: retrieved.publisherName,
    website: retrieved.authorWebsite,
  });

  console.log(`Rendered Copyright:\n"${formattedCopyright}"`);
  if (!formattedCopyright.includes('2026') || !formattedCopyright.includes('Eva Moon') || !formattedCopyright.includes('Silverleaf Publishing')) {
    throw new Error('Copyright template variable replacement failed');
  }
  console.log('Copyright formatting verified ✓');

  // 3. Test Auto-Apply Brand Kit to Book
  console.log('\n3. Testing Brand Kit Auto-Apply to Book Manuscript...');
  const rawBook: Partial<Book> = {
    title: 'Echoes of the Starlit Valley',
  };

  const brandedBook = await applyBrandKitToBook(testUid, rawBook);
  console.log('Branded Book details:');
  console.log(`- Author: ${brandedBook.author}`);
  console.log(`- Trim Size: ${brandedBook.trimSize}`);
  console.log(`- Paper: ${brandedBook.paperType}`);
  console.log(`- Copyright Page: ${brandedBook.frontMatter?.copyrightText?.slice(0, 50)}...`);
  console.log(`- About Author: ${brandedBook.backMatter?.aboutAuthorText?.slice(0, 50)}...`);

  if (brandedBook.author !== 'Eva Moon' || brandedBook.trimSize !== '5.5x8.5' || !brandedBook.backMatter?.aboutAuthorText) {
    throw new Error('Auto-apply brand kit failed to populate book fields correctly');
  }
  console.log('Auto-apply to new book verified ✓');

  // 4. Test Cover Builder Brand Tokens Helper
  console.log('\n4. Testing Cover Builder Brand Kit Helper...');
  const coverTokens = await getBrandKitForCover(testUid);
  if (coverTokens.colors.primary !== '#8b5cf6' || coverTokens.fonts.heading !== 'Playfair Display' || coverTokens.authorName !== 'Eva Moon') {
    throw new Error('Cover brand tokens failed to extract properly');
  }
  console.log('Cover tokens extracted: Primary color', coverTokens.colors.primary, '| Heading font', coverTokens.fonts.heading, '✓');

  // 5. Test AI Bio Generator Handler
  console.log('\n5. Testing AI Bio Generator Handler...');
  const bioResult = await generateBioHandler({
    authorName: 'Evelyn Sterling',
    genre: 'Romantic Fantasy',
    existingBio: 'Former historian who loves ancient castles',
    targetLength: 'medium',
  });
  console.log(`Generated Bio:\n"${bioResult.bio}"`);
  if (!bioResult.bio || bioResult.bio.length < 20) {
    throw new Error('AI Bio generator returned empty or invalid text');
  }
  console.log('AI Bio Generator verified ✓');

  // 6. Test AI Palette Generator Handler
  console.log('\n6. Testing AI Color Palette Generator Handler...');
  const paletteResult = await generatePaletteHandler({
    vibe: 'Mystical Twilight Forest',
    genre: 'Fantasy',
  });
  console.log('Generated Palette:', paletteResult);
  if (!paletteResult.primaryColor || !paletteResult.secondaryColor || !paletteResult.accentColor) {
    throw new Error('AI Palette generator returned invalid colors');
  }
  console.log('AI Palette Generator verified ✓');

  console.log('\n===========================================================');
  console.log('🎉 ALL PHASE 12A BRAND KIT TESTS PASSED SUCCESSFULLY!');
  console.log('===========================================================');
}

testBrandKitFlow().catch((err) => {
  console.error('Brand Kit test failed:', err);
  process.exit(1);
});
