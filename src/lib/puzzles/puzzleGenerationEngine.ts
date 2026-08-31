/**
 * Pure Client-Side Production Puzzle Generation Engine
 * Handles algorithmic word search, word fit, coloring, and color-by-number generation.
 * Generates genuine puzzles, answer keys, and updates Firestore / localStorage in real time.
 */

import { PuzzleBook, PuzzleBookSettings, PuzzlePage, WordSearchSettings, WordFitSettings, ColoringSettings, ColorByNumberSettings } from '../../types/puzzle';
import { generateWordSearchGrid, generateAnswerGrid, WordSearchResult } from './wordSearch';
import { generateWordFitGrid, groupWordsByLength, WordFitResult } from './wordFit';
import { generateFallbackColorByNumberScene, generateColorByNumberSvg, generateAnswerSvg, ColorByNumberPageData } from './colorByNumber';
import { generateColoringLineArtFallback } from './coloringHelper';
import { updatePuzzleBook } from '../puzzleService';
import { callGemini } from '../gemini';

export interface GenerationProgressUpdate {
  progress: number;
  currentAction: string;
  completedCount: number;
  totalCount: number;
  status: 'generating' | 'complete' | 'error';
  errorMessage?: string;
}

// Curated thematic word pools for instant offline / fallback generation
const THEMATIC_WORD_POOLS: Record<string, string[]> = {
  animals: ['ELEPHANT', 'GIRAFFE', 'DOLPHIN', 'PENGUIN', 'LEOPARD', 'KANGAROO', 'OCTOPUS', 'CHEETAH', 'GORILLA', 'FLAMINGO', 'ZEBRA', 'PANTHER', 'BUFFALO', 'GAZELLE', 'BADGER', 'FALCON', 'IGUANA', 'MEERKAT', 'WALRUS', 'OTTER'],
  space: ['GALAXY', 'NEBULA', 'ASTRONOMY', 'COSMOS', 'METEOR', 'JUPITER', 'TELESCOPE', 'ASTEROID', 'PLANET', 'ORBIT', 'SUPERNOVA', 'ECLIPSE', 'SATELLITE', 'SOLAR', 'GRAVITY', 'COMET', 'ROCKET', 'AURORA', 'LUNAR', 'COSMIC'],
  nature: ['WATERFALL', 'MOUNTAIN', 'RAINFOREST', 'BLOSSOM', 'MEADOW', 'CANYON', 'GLACIER', 'SUNLIGHT', 'STREAM', 'FOREST', 'VALLEY', 'SUNSET', 'ISLAND', 'WILDLIFE', 'FOLIAGE', 'LAGOON', 'SUMMIT', 'BREEZE', 'RIVER', 'DESERT'],
  travel: ['PASSPORT', 'AIRPORT', 'ADVENTURE', 'LUGGAGE', 'JOURNEY', 'DESTINATION', 'HOTEL', 'EXPLORE', 'CRUISE', 'LANDMARK', 'BACKPACK', 'TICKET', 'VOYAGE', 'ISLAND', 'COMPASS', 'TOURIST', 'HIGHWAY', 'SCENERY', 'EXCURSION', 'RESORT'],
  science: ['MOLECULE', 'QUANTUM', 'GENOME', 'ELEMENT', 'CELLULAR', 'GRAVITY', 'HYPOTHESIS', 'CHEMICAL', 'REACTION', 'VELOCITY', 'ELECTRON', 'NUCLEUS', 'ORGANISM', 'SPECTRUM', 'DYNAMIC', 'PHOTON', 'KINETIC', 'ENERGY', 'RESEARCH', 'LABORATORY'],
  literature: ['PROTAGONIST', 'METAPHOR', 'CHAPTER', 'AUTHOR', 'NOVEL', 'NARRATIVE', 'POETRY', 'LIBRARY', 'ANTHOLOGY', 'EPILOGUE', 'PARAGRAPH', 'DIALOGUE', 'CHARACTER', 'ALLEGORY', 'FICTION', 'MANUSCRIPT', 'FOLKLORE', 'SYMBOLISM', 'IMAGERY', 'CLIMAX'],
  food: ['CHOCOLATE', 'CINNAMON', 'VANILLA', 'ESPRESSO', 'CROISSANT', 'BAGUETTE', 'CARAMEL', 'AVOCADO', 'ROASTED', 'SMOOTHIE', 'PANCAKE', 'PARMESAN', 'TRUFFLE', 'NUTMEG', 'PISTACHIO', 'SAFFRON', 'TIRAMISU', 'GELATO', 'BASIL', 'BERRIES'],
  history: ['DYNASTY', 'EMPIRE', 'ARTIFACT', 'MONARCHY', 'ANCIENT', 'PAPYRUS', 'TEMPLE', 'CASTLE', 'WARRIOR', 'CITADEL', 'HERITAGE', 'CHRONICLE', 'CONQUEST', 'KNIGHT', 'PHARAOH', 'CENTURY', 'COLISEUM', 'FORTRESS', 'PIONEER', 'TREATY'],
  ocean: ['CORAL', 'ANEMONE', 'SEAHORSE', 'BARRACUDA', 'STINGRAY', 'JELLYFISH', 'NAUTILUS', 'TRENCH', 'ABYSS', 'TIDEPOOL', 'MARLIN', 'MANTA', 'LOBSTER', 'CURRENT', 'REEF', 'SUBMARINE', 'URCHIN', 'PELICAN', 'BARNACLE', 'DOLPHIN'],
};

/**
 * Returns a thematic list of words for a specific puzzle page
 */
export async function getWordsForPage(
  theme: string,
  pageIndex: number,
  wordCount: number,
  userWordList?: string[]
): Promise<{ title: string; words: string[] }> {
  // If user provided custom words, partition or sample them
  if (userWordList && userWordList.length >= wordCount) {
    const start = (pageIndex * wordCount) % userWordList.length;
    const sliced = userWordList.slice(start, start + wordCount);
    if (sliced.length >= wordCount) {
      return {
        title: `${theme} #${pageIndex + 1}`,
        words: sliced,
      };
    }
  }

  // Attempt AI generation with Gemini
  try {
    const prompt = `Generate exactly ${wordCount} unique uppercase English words (4-10 letters each) related to the subtopic "${theme}" for Puzzle #${pageIndex + 1}. Also give a 2-4 word puzzle subtopic title. Format output as:
TITLE: <Subtopic Title>
WORDS: <WORD1>, <WORD2>, <WORD3>, ...`;

    const raw = await callGemini(prompt);
    const titleMatch = raw.match(/TITLE:\s*([^\n\r]+)/i);
    const wordsMatch = raw.match(/WORDS:\s*([^\n\r]+)/i);

    if (wordsMatch && wordsMatch[1]) {
      const parsedWords = wordsMatch[1]
        .split(/[,]+/)
        .map((w) => w.trim().toUpperCase().replace(/[^A-Z]/g, ''))
        .filter((w) => w.length >= 3 && w.length <= 15);

      if (parsedWords.length >= Math.min(8, wordCount)) {
        return {
          title: titleMatch?.[1]?.trim() || `${theme} #${pageIndex + 1}`,
          words: parsedWords.slice(0, wordCount),
        };
      }
    }
  } catch (err) {
    console.warn(`AI word generation fallback for page ${pageIndex + 1}:`, err);
  }

  // Fallback to robust curated thematic word pools
  const themeLower = theme.toLowerCase();
  const matchedKey = Object.keys(THEMATIC_WORD_POOLS).find((k) => themeLower.includes(k)) || 'animals';
  const pool = THEMATIC_WORD_POOLS[matchedKey] || THEMATIC_WORD_POOLS.animals;

  // Shuffle pool deterministically based on page index
  const shuffled = [...pool].sort((a, b) => {
    const hashA = (a.charCodeAt(0) + pageIndex * 7) % 13;
    const hashB = (b.charCodeAt(0) + pageIndex * 7) % 13;
    return hashA - hashB;
  });

  return {
    title: `${theme.charAt(0).toUpperCase() + theme.slice(1)}: Part ${pageIndex + 1}`,
    words: shuffled.slice(0, wordCount),
  };
}

/**
 * Executes complete algorithmic generation of all puzzle book pages
 */
export async function runPuzzleBookGeneration(
  bookId: string,
  settings: PuzzleBookSettings,
  onProgress?: (update: GenerationProgressUpdate) => void
): Promise<PuzzlePage[]> {
  const pageCount = settings.pageCount || 25;
  const pages: PuzzlePage[] = [];

  onProgress?.({
    progress: 0.05,
    currentAction: `Initializing ${settings.type} generation engine...`,
    completedCount: 0,
    totalCount: pageCount,
    status: 'generating',
  });

  for (let i = 0; i < pageCount; i++) {
    const pageNumber = i + 1;
    onProgress?.({
      progress: 0.05 + (i / pageCount) * 0.85,
      currentAction: `Crafting Puzzle #${pageNumber} of ${pageCount}...`,
      completedCount: i,
      totalCount: pageCount,
      status: 'generating',
    });

    try {
      if (settings.type === 'word-search') {
        const wsSettings = settings as WordSearchSettings;
        const { title, words } = await getWordsForPage(
          wsSettings.theme || 'Themed Puzzle',
          i,
          wsSettings.wordCount || 12,
          wsSettings.wordList
        );

        const result: WordSearchResult = generateWordSearchGrid(
          words,
          wsSettings.gridSize || 12,
          wsSettings.directions || ['horizontal', 'vertical', 'diagonal']
        );

        const answerGrid = generateAnswerGrid(result.grid, result.placedWords);

        pages.push({
          id: `page_${bookId}_${pageNumber}`,
          pageNumber,
          type: 'word-search',
          title,
          puzzleData: result,
          answerData: answerGrid,
          status: 'done',
        });
      } else if (settings.type === 'word-fit') {
        const wfSettings = settings as WordFitSettings;
        const { title, words } = await getWordsForPage(
          wfSettings.theme || 'Word Fit',
          i,
          wfSettings.wordCount || 15,
          wfSettings.wordList
        );

        const result: WordFitResult = generateWordFitGrid(words, wfSettings.gridSize || 15);
        const lengthGroups = groupWordsByLength(result.placedWords.map((p) => p.word));

        pages.push({
          id: `page_${bookId}_${pageNumber}`,
          pageNumber,
          type: 'word-fit',
          title,
          puzzleData: {
            ...result,
            lengthGroups,
          },
          answerData: result.grid,
          status: 'done',
        });
      } else if (settings.type === 'color-by-number') {
        const cbnSettings = settings as ColorByNumberSettings;
        const pageData: ColorByNumberPageData = generateFallbackColorByNumberScene(
          cbnSettings.theme || 'Wildlife',
          pageNumber,
          cbnSettings.complexity || 'medium'
        );
        const puzzleSvg = generateColorByNumberSvg(pageData);
        const answerSvg = generateAnswerSvg(pageData);

        pages.push({
          id: `page_${bookId}_${pageNumber}`,
          pageNumber,
          type: 'color-by-number',
          title: `${cbnSettings.theme || 'Color By Number'} #${pageNumber}`,
          puzzleData: {
            ...pageData,
            puzzleSvg,
          },
          answerData: answerSvg,
          imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent(puzzleSvg)}`,
          status: 'done',
        });
      } else if (settings.type === 'coloring') {
        const clSettings = settings as ColoringSettings;
        const pageTitle = `${clSettings.theme || 'Coloring Page'} #${pageNumber}`;
        const dataUrl = generateColoringLineArtFallback(
          pageTitle,
          clSettings.theme || 'Botanical Garden',
          pageNumber
        );

        pages.push({
          id: `page_${bookId}_${pageNumber}`,
          pageNumber,
          type: 'coloring',
          title: pageTitle,
          puzzleData: { dataUrl },
          imageUrl: dataUrl,
          status: 'done',
        });
      }

      // Briefly yield to UI loop for smooth animations
      await new Promise((r) => setTimeout(r, 60));
    } catch (pageErr: any) {
      console.error(`Error generating page ${pageNumber}:`, pageErr);
      pages.push({
        id: `page_${bookId}_${pageNumber}`,
        pageNumber,
        type: settings.type,
        title: `Puzzle #${pageNumber}`,
        puzzleData: null,
        status: 'error',
        errorMessage: pageErr?.message || 'Page generation failed',
      });
    }
  }

  onProgress?.({
    progress: 0.95,
    currentAction: 'Calculating solution pages & KDP margins...',
    completedCount: pageCount,
    totalCount: pageCount,
    status: 'generating',
  });

  // Calculate total pages including cover + instructions + answers
  const totalPages = pageCount + (settings.includeCoverPage ? 1 : 0) + (settings.includeInstructions ? 1 : 0) + Math.ceil(pageCount / 4);

  // Persist completed book
  await updatePuzzleBook(bookId, {
    pages,
    status: 'complete',
    totalPages,
    updatedAt: new Date().toISOString(),
  });

  onProgress?.({
    progress: 1.0,
    currentAction: 'Your book is ready! 🎉',
    completedCount: pageCount,
    totalCount: pageCount,
    status: 'complete',
  });

  return pages;
}
