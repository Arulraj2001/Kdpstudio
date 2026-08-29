import { withUsageCheck } from '../../../../../lib/withUsageCheck';
import { generateWordsHandler } from '../../generate-words/route';
import { generateWordSearchGrid, generateAnswerGrid } from '../../../../../lib/puzzles/wordSearch';
import { WordSearchSettings, PuzzlePage, PuzzleBook } from '../../../../../types/puzzle';
import { getPuzzleBook, updatePuzzleBook, updatePuzzlePage, savePuzzleBook } from '../../../../../lib/puzzleService';

// In-memory progress tracking for Server-Sent Events
export const activeGenerationProgress = new Map<string, {
  progress: number;
  currentAction: string;
  completedCount: number;
  totalCount: number;
  lastPage?: PuzzlePage;
  status: 'generating' | 'complete' | 'error';
}>();

export function generatePuzzleTitle(theme: string, index: number): string {
  const cleanTheme = theme.trim() || 'Themed';
  const patterns = [
    `Puzzle #${index}`,
    `Word Search #${index}`,
    `${cleanTheme} Challenge #${index}`,
    `${cleanTheme} Quest #${index}`,
    `Puzzle #${index}: ${cleanTheme}`,
  ];
  return patterns[(index - 1) % patterns.length];
}

export async function runWordSearchGeneration(
  bookId: string,
  settings: WordSearchSettings,
  userId?: string
): Promise<{ success: boolean; bookId: string }> {
  const totalPuzzles = Math.max(5, Math.min(50, settings.pageCount || 25));
  const wordsPerPuzzle = Math.max(8, Math.min(20, settings.wordCount || 12));
  const gridSize = settings.gridSize || 12;
  const directions = settings.directions || ['horizontal', 'vertical', 'diagonal'];

  activeGenerationProgress.set(bookId, {
    progress: 0.05,
    currentAction: 'Initializing book and puzzle settings...',
    completedCount: 0,
    totalCount: totalPuzzles,
    status: 'generating',
  });

  const usedWords = new Set<string>();
  const pages: PuzzlePage[] = [];

  // If user provided a custom word pool
  const userWordPool = (settings.wordList || [])
    .map((w) => w.trim().toUpperCase().replace(/[^A-Z]/g, ''))
    .filter((w) => w.length >= 3);

  for (let i = 1; i <= totalPuzzles; i++) {
    activeGenerationProgress.set(bookId, {
      progress: i / (totalPuzzles + 1),
      currentAction: `Generating puzzle #${i} words...`,
      completedCount: i - 1,
      totalCount: totalPuzzles,
      status: 'generating',
    });

    let puzzleWords: string[] = [];

    if (settings.aiGenerateWords !== false || userWordPool.length < wordsPerPuzzle) {
      const generated = await generateWordsHandler({
        theme: settings.theme,
        count: wordsPerPuzzle + 4,
        existingWords: Array.from(usedWords),
      });

      puzzleWords = generated.slice(0, wordsPerPuzzle);
      puzzleWords.forEach((w) => usedWords.add(w));
    } else {
      // Pick randomly from user pool
      const shuffled = [...userWordPool].sort(() => Math.random() - 0.5);
      puzzleWords = shuffled.slice(0, wordsPerPuzzle);
    }

    activeGenerationProgress.set(bookId, {
      progress: (i + 0.5) / (totalPuzzles + 1),
      currentAction: `Building grid for puzzle #${i}...`,
      completedCount: i - 1,
      totalCount: totalPuzzles,
      status: 'generating',
    });

    let result = generateWordSearchGrid(puzzleWords, gridSize, directions);

    // Retry if too few placed
    if (result.placedWords.length < Math.min(8, wordsPerPuzzle)) {
      result = generateWordSearchGrid(puzzleWords, gridSize + 2, directions);
    }

    const answerGrid = generateAnswerGrid(result.grid, result.placedWords);

    const page: PuzzlePage = {
      id: `page_${i}_${Date.now()}`,
      pageNumber: i,
      type: 'word-search',
      title: generatePuzzleTitle(settings.theme, i),
      puzzleData: result,
      answerData: answerGrid,
      status: 'done',
    };

    pages.push(page);

    activeGenerationProgress.set(bookId, {
      progress: i / totalPuzzles,
      currentAction: `Puzzle #${i} complete ✓`,
      completedCount: i,
      totalCount: totalPuzzles,
      lastPage: page,
      status: 'generating',
    });

    // Small delay to simulate smooth progress and avoid API spikes
    await new Promise((r) => setTimeout(r, 60));
  }

  // Calculate total book pages (cover + instructions + puzzles + answer key)
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

  activeGenerationProgress.set(bookId, {
    progress: 1.0,
    currentAction: 'Book generation complete! 🎉',
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

    const safeBookId = bookId || `puz_ws_${Date.now()}`;
    const result = await runWordSearchGeneration(safeBookId, settings);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Word search generation failed:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
