import { withUsageCheck } from '../../../../../lib/withUsageCheck';
import { generateWordsHandler } from '../../generate-words/route';
import { generateWordFitGrid, WordFitResult } from '../../../../../lib/puzzles/wordFit';
import { WordFitSettings, PuzzlePage, PuzzleBook } from '../../../../../types/puzzle';
import { getPuzzleBook, savePuzzleBook } from '../../../../../lib/puzzleService';

// In-memory progress tracking for Server-Sent Events
export const activeWordFitGenerationProgress = new Map<string, {
  progress: number;
  currentAction: string;
  completedCount: number;
  totalCount: number;
  lastPage?: PuzzlePage;
  status: 'generating' | 'complete' | 'error';
}>();

export function generateWordFitTitle(theme: string, index: number): string {
  const cleanTheme = theme.trim() || 'Themed';
  const patterns = [
    `Word Fit #${index}`,
    `Fill-In #${index}: ${cleanTheme}`,
    `${cleanTheme} Crossword #${index}`,
    `Word Fit Challenge #${index}`,
    `Puzzle #${index}: ${cleanTheme}`,
  ];
  return patterns[(index - 1) % patterns.length];
}

export async function runWordFitGeneration(
  bookId: string,
  settings: WordFitSettings,
  userId?: string
): Promise<{ success: boolean; bookId: string }> {
  const totalPuzzles = Math.max(5, Math.min(50, settings.pageCount || 25));
  const gridSize = settings.gridSize || 15;
  const wordCount = Math.max(12, Math.min(25, settings.wordCount || 18));

  activeWordFitGenerationProgress.set(bookId, {
    progress: 0.05,
    currentAction: 'Initializing Word Fit crossword engine...',
    completedCount: 0,
    totalCount: totalPuzzles,
    status: 'generating',
  });

  const usedWords = new Set<string>();
  const pages: PuzzlePage[] = [];

  const userWordPool = (settings.wordList || [])
    .map((w) => w.trim().toUpperCase().replace(/[^A-Z]/g, ''))
    .filter((w) => w.length >= 3);

  for (let i = 1; i <= totalPuzzles; i++) {
    activeWordFitGenerationProgress.set(bookId, {
      progress: i / (totalPuzzles + 1),
      currentAction: `Generating vocabulary for Word Fit #${i}...`,
      completedCount: i - 1,
      totalCount: totalPuzzles,
      status: 'generating',
    });

    let puzzleWords: string[] = [];

    if (settings.aiGenerateWords !== false || userWordPool.length < wordCount) {
      const generated = await generateWordsHandler({
        theme: settings.theme,
        count: wordCount + 6,
        wordLength: 'Mixed (3-12 letters)',
        includeProperNouns: true,
        existingWords: Array.from(usedWords),
      });

      puzzleWords = generated.slice(0, wordCount);
      puzzleWords.forEach((w) => usedWords.add(w));
    } else {
      const shuffled = [...userWordPool].sort(() => Math.random() - 0.5);
      puzzleWords = shuffled.slice(0, wordCount);
    }

    activeWordFitGenerationProgress.set(bookId, {
      progress: (i + 0.5) / (totalPuzzles + 1),
      currentAction: `Calculating crossword intersections for #${i}...`,
      completedCount: i - 1,
      totalCount: totalPuzzles,
      status: 'generating',
    });

    // Generation with up to 3 retries if placed words < 75%
    let result = generateWordFitGrid(puzzleWords, gridSize);
    let attempts = 0;
    while (result.placedWords.length < Math.min(8, Math.floor(puzzleWords.length * 0.75)) && attempts < 3) {
      attempts++;
      const shuffled = [...puzzleWords].sort(() => Math.random() - 0.5);
      result = generateWordFitGrid(shuffled, gridSize);
    }

    const page: PuzzlePage = {
      id: `page_wf_${i}_${Date.now()}`,
      pageNumber: i,
      type: 'word-fit',
      title: generateWordFitTitle(settings.theme, i),
      puzzleData: {
        grid: result.grid,
        slots: result.slots,
        placedWords: result.placedWords,
        unplacedWords: result.unplacedWords,
        gridSize,
      },
      answerData: {
        grid: result.grid,
        slots: result.slots,
      },
      status: 'done',
    };

    pages.push(page);

    activeWordFitGenerationProgress.set(bookId, {
      progress: i / totalPuzzles,
      currentAction: `Word Fit #${i} complete ✓`,
      completedCount: i,
      totalCount: totalPuzzles,
      lastPage: page,
      status: 'generating',
    });

    await new Promise((r) => setTimeout(r, 60));
  }

  const totalPages = pages.length + (settings.includeCoverPage ? 1 : 0) + (settings.includeInstructions ? 1 : 0) + (settings.includeAnswers ? Math.ceil(pages.length / 4) : 0);

  const finalBook: PuzzleBook = {
    id: bookId,
    uid: userId || 'guest',
    settings,
    pages,
    status: 'complete',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalPages,
  };

  await savePuzzleBook(finalBook);

  activeWordFitGenerationProgress.set(bookId, {
    progress: 1.0,
    currentAction: 'Word Fit Book generation complete! 🎉',
    completedCount: totalPuzzles,
    totalCount: totalPuzzles,
    status: 'complete',
  });

  return { success: true, bookId };
}

export const POST = withUsageCheck('puzzleGenerations', async (req) => {
  try {
    const body = await req.json();
    const { bookId, settings } = body;

    if (!settings) {
      return new Response(JSON.stringify({ success: false, error: 'Missing puzzle settings' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const safeBookId = bookId || `puz_wf_${Date.now()}`;
    const result = await runWordFitGeneration(safeBookId, settings);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Word fit generation failed:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
