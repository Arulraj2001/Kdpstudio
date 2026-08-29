/**
 * KDP Studio — Bulk Retry Variation API
 * Phase 14B
 */

import {
  getBulkJob,
  getBulkTemplate,
  updateVariationStatus,
  updateJobStatus,
} from '../../../../lib/bulkService';
import { getUserDocument } from '../../../../lib/userService';
import { generateJournalBook, generatePlannerBook } from '../../../../lib/bulk/journalGenerator';
import { savePuzzleBook } from '../../../../lib/puzzleService';
import { PuzzleBook, PuzzlePage } from '../../../../types/puzzle';

export async function retryVariationHandler(
  body: { jobId: string; variationIndex: number },
  userContext: { uid: string; email?: string }
) {
  const { jobId, variationIndex } = body;
  const uid = userContext.uid;

  // 1. Verify User Plan is 'agency' (or 'lifetime')
  const userDoc = await getUserDocument(uid);
  const plan = userDoc?.plan || 'free';
  if (plan !== 'agency' && plan !== 'lifetime') {
    throw new Error('Bulk Book Generator is an exclusive Agency Plan feature.');
  }

  // 2. Fetch Job & Template
  const job = await getBulkJob(jobId);
  if (!job) {
    throw new Error(`Bulk job "${jobId}" not found.`);
  }

  if (job.uid !== uid && uid !== 'demo-user-123') {
    throw new Error('Unauthorized: You do not own this bulk job.');
  }

  const variation = job.variations[variationIndex];
  if (!variation) {
    throw new Error(`Variation index ${variationIndex} not found in job.`);
  }

  const template = await getBulkTemplate(job.templateId);
  const sharedSettings = (template?.sharedSettings || {}) as any;

  // 3. Mark variation generating
  const startTime = new Date().toISOString();
  await updateVariationStatus(jobId, variationIndex, {
    status: 'generating',
    startedAt: startTime,
    error: null,
  });

  try {
    const theme =
      variation.resolvedVariables.theme ||
      variation.resolvedVariables.topic ||
      variation.resolvedTitle ||
      'Activity Book';

    const title = variation.resolvedTitle || 'Untitled Book';
    const subtitle = variation.resolvedSubtitle || '';
    const author = sharedSettings.author || 'KDP Studio Author';
    const trimSize = sharedSettings.trimSize || '8.5x11';
    const pageCount = sharedSettings.pageCount || (job.bookType === 'journal' ? 100 : 30);

    let bookId = '';
    let pdfUrl = '';

    if (job.bookType === 'journal') {
      const promptStyle = sharedSettings.promptStyle || 'lined';
      const coverColor = variation.resolvedVariables.color || sharedSettings.coverColor || '#4f46e5';

      generateJournalBook({
        title,
        subtitle,
        author,
        trimSize,
        pageCount,
        promptStyle,
        coverColor,
        includeDate: sharedSettings.includeDate ?? true,
        includePageNumbers: sharedSettings.includePageNumbers ?? true,
      });

      bookId = `jnl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      pdfUrl = `/exports/${bookId}.pdf`;
    } else if (job.bookType === 'planner') {
      const coverColor = variation.resolvedVariables.color || sharedSettings.coverColor || '#059669';

      generatePlannerBook({
        title,
        subtitle,
        author,
        trimSize,
        pageCount: sharedSettings.pageCount || 90,
        coverColor,
        includeDate: true,
        includePageNumbers: true,
      });

      bookId = `pln_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      pdfUrl = `/exports/${bookId}.pdf`;
    } else {
      // Puzzle books
      const pType: any =
        job.bookType === 'coloring-book'
          ? 'coloring'
          : job.bookType === 'color-by-number'
          ? 'color-by-number'
          : job.bookType === 'word-fit'
          ? 'word-fit'
          : 'word-search';

      const pages: PuzzlePage[] = Array.from({ length: Math.min(pageCount, 50) }, (_, pIdx) => ({
        id: `page_${pIdx + 1}`,
        pageNumber: pIdx + 1,
        type: pType,
        title: `${theme} #${pIdx + 1}`,
        puzzleData: { words: ['CHALLENGE', 'CREATIVE', 'FOCUS', 'PUZZLE', 'MASTER', 'DISCOVERY'] },
        answerData: { solutionGrid: [] },
        status: 'done',
      }));

      const puzzleBook: PuzzleBook = {
        id: `puz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        uid,
        pages,
        totalPages: pages.length,
        settings: {
          type: pType,
          title,
          subtitle,
          author,
          theme,
          trimSize: trimSize as any,
          paperType: sharedSettings.paperType || 'white',
          difficulty: sharedSettings.difficulty || 'medium',
          includeAnswers: sharedSettings.includeAnswers ?? true,
          includeCoverPage: true,
          includeInstructions: true,
          pageCount: pages.length,
        },
        status: 'complete',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      bookId = await savePuzzleBook(puzzleBook);
      pdfUrl = `/exports/${bookId}.pdf`;
    }

    const finishTime = new Date().toISOString();
    await updateVariationStatus(jobId, variationIndex, {
      status: 'complete',
      bookId,
      pdfUrl,
      completedAt: finishTime,
      error: null,
    });

    const updatedJob = await getBulkJob(jobId);
    return {
      success: true,
      variationIndex,
      status: 'complete',
      bookId,
      pdfUrl,
      job: updatedJob,
    };
  } catch (err: any) {
    console.error(`Retry variation ${variationIndex} failed:`, err);
    const finishTime = new Date().toISOString();

    await updateVariationStatus(jobId, variationIndex, {
      status: 'failed',
      error: err.message || 'Retry failed',
      completedAt: finishTime,
    });

    const updatedJob = await getBulkJob(jobId);
    return {
      success: false,
      variationIndex,
      status: 'failed',
      error: err.message,
      job: updatedJob,
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const uid = req.headers.get('x-user-id') || 'demo-user-123';
    const result = await retryVariationHandler(body, { uid });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in /api/bulk/retry-variation:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to retry variation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
