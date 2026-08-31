import { withUsageCheck } from '../../../../../lib/withUsageCheck';
import { ColoringSettings, PuzzlePage, PuzzleBook } from '../../../../../types/puzzle';
import { getPuzzleBook, savePuzzleBook } from '../../../../../lib/puzzleService';
import { generateColoringLineArtFallback } from '../../../../../lib/puzzles/coloringHelper';
import { generateImageWithFallback } from '../../../../../lib/imageGeneration';

// Progress tracking for Server-Sent Events
export const activeColoringGenerationProgress = new Map<string, {
  progress: number;
  currentAction: string;
  completedCount: number;
  totalCount: number;
  lastPage?: PuzzlePage;
  status: 'generating' | 'complete' | 'error';
}>();

export async function runColoringBookGeneration(
  bookId: string,
  prompts: string[],
  settings: ColoringSettings,
  userId?: string
): Promise<{ success: boolean; bookId: string; usedFallback?: boolean }> {
  const pageCount = Math.max(5, Math.min(40, settings.pageCount || prompts.length || 20));
  const cleanPrompts = prompts.length > 0
    ? prompts
    : Array.from({ length: pageCount }, (_, i) => `${settings.theme || 'Nature'} illustration #${i + 1}`);

  activeColoringGenerationProgress.set(bookId, {
    progress: 0.05,
    currentAction: 'Initializing AI illustration engine...',
    completedCount: 0,
    totalCount: pageCount,
    status: 'generating',
  });

  const pages: PuzzlePage[] = [];
  let usedFallback = false;

  for (let i = 0; i < pageCount; i++) {
    const pageNum = i + 1;
    const basePrompt = cleanPrompts[i % cleanPrompts.length];

    activeColoringGenerationProgress.set(bookId, {
      progress: (i + 0.2) / pageCount,
      currentAction: `Synthesizing illustration #${pageNum}: ${basePrompt.slice(0, 40)}...`,
      completedCount: i,
      totalCount: pageCount,
      status: 'generating',
    });

    // 1. Build style & line thickness modifiers
    let styleModifier = '+ intricate fine line art, adult coloring book, detailed patterns';
    if (settings.illustrationStyle === 'simple') {
      styleModifier = '+ thick bold black outlines, simple coloring book, kids illustration';
    } else if (settings.illustrationStyle === 'mandala') {
      styleModifier = '+ mandala design, geometric, circular symmetry, zentangle style';
    } else if (settings.illustrationStyle === 'character') {
      styleModifier = '+ cute cartoon character, bold outlines, kawaii style';
    }

    let lineModifier = ', medium balanced lines';
    if (settings.lineThickness === 'thin') lineModifier = ', thin delicate lines';
    if (settings.lineThickness === 'thick') lineModifier = ', very thick bold black lines';

    const finalPrompt = `${basePrompt} ${styleModifier} ${lineModifier}, black and white only, coloring book page, white background, no color, no shading, high contrast line art, printable`;

    let imageUrl = '';

    // 2. Try AI image generation (Imagen → HuggingFace → Cloudflare cascade)
    const aiResult = await generateImageWithFallback(finalPrompt, settings.trimSize === '8.5x11' || settings.trimSize === '6x9' ? '3:4' : '1:1');
    if (!aiResult.fallback && aiResult.imageUrl) {
      imageUrl = aiResult.imageUrl;
    }

    // 3. SVG fallback if all AI providers failed
    if (!imageUrl) {
      imageUrl = generateColoringLineArtFallback(basePrompt, settings.theme, pageNum);
      usedFallback = true;
    }

    const page: PuzzlePage = {
      id: `page_col_${pageNum}_${Date.now()}`,
      pageNumber: pageNum,
      type: 'coloring',
      title: basePrompt.slice(0, 60),
      imageUrl,
      puzzleData: {
        imageUrl,
        prompt: finalPrompt,
        basePrompt,
      },
      status: 'done',
    };

    pages.push(page);

    activeColoringGenerationProgress.set(bookId, {
      progress: (i + 1) / pageCount,
      currentAction: `Illustration #${pageNum} complete ✓`,
      completedCount: pageNum,
      totalCount: pageCount,
      lastPage: page,
      status: 'generating',
    });

    // 2-second rate limit pause between generations
    if (i < pageCount - 1) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  // Calculate total pages: cover + instructions + 2 pages per coloring sheet (with blank backs)
  const totalPages = pages.length * 2 + (settings.includeCoverPage ? 1 : 0) + (settings.includeInstructions ? 1 : 0);

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

  activeColoringGenerationProgress.set(bookId, {
    progress: 1.0,
    currentAction: 'Coloring Book generation complete! 🎉',
    completedCount: pageCount,
    totalCount: pageCount,
    status: 'complete',
  });

  return { success: true, bookId, usedFallback };
}

export const POST = withUsageCheck('imageGenerations', async (req) => {
  try {
    const body = await req.json();
    const { bookId, prompts, settings } = body;

    if (!settings) {
      return new Response(JSON.stringify({ success: false, error: 'Missing coloring settings' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const safeBookId = bookId || `puz_col_${Date.now()}`;
    const result = await runColoringBookGeneration(safeBookId, prompts || [], settings);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Coloring book generation error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
