import { withUsageCheck } from '../../../../../lib/withUsageCheck';
import { generateSceneHandler } from '../generate-scene/route';
import { 
  generateColorByNumberSvg, 
  generateAnswerSvg, 
  ColorByNumberPageData 
} from '../../../../../lib/puzzles/colorByNumber';
import { ColorByNumberSettings, PuzzlePage, PuzzleBook } from '../../../../../types/puzzle';
import { getPuzzleBook, savePuzzleBook } from '../../../../../lib/puzzleService';

// Progress tracking for Server-Sent Events
export const activeColorByNumberGenerationProgress = new Map<string, {
  progress: number;
  currentAction: string;
  completedCount: number;
  totalCount: number;
  lastPage?: PuzzlePage;
  status: 'generating' | 'complete' | 'error';
}>();

export async function runColorByNumberBookGeneration(
  bookId: string,
  settings: ColorByNumberSettings,
  sceneDescriptions: string[] = [],
  userId?: string
): Promise<{ success: boolean; bookId: string }> {
  const pageCount = Math.max(5, Math.min(30, settings.pageCount || 20));

  activeColorByNumberGenerationProgress.set(bookId, {
    progress: 0.05,
    currentAction: 'Initializing Color by Number vector engine...',
    completedCount: 0,
    totalCount: pageCount,
    status: 'generating',
  });

  const pages: PuzzlePage[] = [];

  for (let i = 0; i < pageCount; i++) {
    const pageNum = i + 1;
    const sceneDesc = sceneDescriptions[i] || '';

    activeColorByNumberGenerationProgress.set(bookId, {
      progress: (i + 0.3) / pageCount,
      currentAction: `Designing geometric vector scene #${pageNum}...`,
      completedCount: i,
      totalCount: pageCount,
      status: 'generating',
    });

    const sceneData: ColorByNumberPageData = await generateSceneHandler({
      theme: settings.theme,
      complexity: (settings.complexity || 'medium') as any,
      colorsCount: settings.colorsCount || 8,
      sceneDescription: sceneDesc,
      pageNum,
    });

    const puzzleSvg = generateColorByNumberSvg(sceneData);
    const answerSvg = generateAnswerSvg(sceneData);
    const puzzleDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(puzzleSvg)}`;
    const answerDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(answerSvg)}`;

    const page: PuzzlePage = {
      id: `page_cbn_${pageNum}_${Date.now()}`,
      pageNumber: pageNum,
      type: 'color-by-number',
      title: sceneData.title || `Scene #${pageNum}`,
      imageUrl: puzzleDataUrl,
      puzzleData: {
        scene: sceneData,
        svg: puzzleSvg,
        answerSvg: answerSvg,
        imageUrl: puzzleDataUrl,
        answerImageUrl: answerDataUrl,
        palette: sceneData.colorKey,
      },
      answerData: {
        palette: sceneData.colorKey,
        svg: answerSvg,
        imageUrl: answerDataUrl,
      },
      status: 'done',
    };

    pages.push(page);

    activeColorByNumberGenerationProgress.set(bookId, {
      progress: (i + 1) / pageCount,
      currentAction: `Scene #${pageNum} mapped & numbered ✓`,
      completedCount: pageNum,
      totalCount: pageCount,
      lastPage: page,
      status: 'generating',
    });

    await new Promise((r) => setTimeout(r, 60));
  }

  // Calculate total pages (including single-sided blank backs and answer section)
  const totalPages = pages.length * 2 + (settings.includeCoverPage ? 1 : 0) + (settings.includeInstructions ? 1 : 0) + (settings.includeAnswers ? Math.ceil(pages.length / 4) : 0);

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

  activeColorByNumberGenerationProgress.set(bookId, {
    progress: 1.0,
    currentAction: 'Color by Number Book generation complete! 🎉',
    completedCount: pageCount,
    totalCount: pageCount,
    status: 'complete',
  });

  return { success: true, bookId };
}

export const POST = withUsageCheck('puzzleGenerations', async (req) => {
  try {
    const body = await req.json();
    const { bookId, settings, sceneDescriptions } = body;

    if (!settings) {
      return new Response(JSON.stringify({ success: false, error: 'Missing settings' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const safeBookId = bookId || `puz_cbn_${Date.now()}`;
    const result = await runColorByNumberBookGeneration(safeBookId, settings, sceneDescriptions || []);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Color by Number generation error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
