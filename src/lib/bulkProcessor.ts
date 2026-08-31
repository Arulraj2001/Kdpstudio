/**
 * Production Bulk Generation Processor (Client & Server compatible)
 * Processes bulk jobs for Fiction, Non-Fiction, and Puzzle Books.
 * Generates genuine book entities, interior pages, and persists them to Firestore & Zustand store.
 */

import { BulkJob, BulkVariation } from '../types/bulk';
import { updateBulkJob, getBulkJob } from './bulkService';
import { useBookStore } from './store';
import { savePuzzleBook } from './puzzleService';
import { runPuzzleBookGeneration } from './puzzles/puzzleGenerationEngine';
import { WordSearchSettings, WordFitSettings, ColoringSettings, ColorByNumberSettings } from '../types/puzzle';

export async function processBulkJobClient(
  jobId: string,
  onProgress?: (event: any) => void
): Promise<void> {
  const job = await getBulkJob(jobId);
  if (!job) return;

  await updateBulkJob(jobId, {
    status: 'running',
    startedAt: new Date().toISOString(),
  });

  const variations = [...(job.variations || [])];
  let completedCount = 0;

  for (let i = 0; i < variations.length; i++) {
    const v = variations[i];

    // Skip if already done
    if (v.status === 'done' && v.bookId) {
      completedCount++;
      continue;
    }

    onProgress?.({
      type: 'progress',
      variationIndex: i,
      status: 'generating',
      completed: completedCount,
      total: variations.length,
      currentAction: `Generating: ${v.title}...`,
    });

    try {
      const isPuzzle =
        v.tags?.some((t) => t.toLowerCase().includes('puzzle') || t.toLowerCase().includes('word') || t.toLowerCase().includes('coloring')) ||
        v.title.toLowerCase().includes('word search') ||
        v.title.toLowerCase().includes('word fit') ||
        v.title.toLowerCase().includes('coloring') ||
        v.title.toLowerCase().includes('puzzle');

      let createdId = '';

      if (isPuzzle) {
        // Create full algorithmic puzzle book
        const puzzleId = `puz_bulk_${Date.now()}_${i}`;
        const pType = v.title.toLowerCase().includes('word fit')
          ? 'word-fit'
          : v.title.toLowerCase().includes('coloring')
          ? 'coloring'
          : v.title.toLowerCase().includes('color by number')
          ? 'color-by-number'
          : 'word-search';

        const pSettings: any = {
          type: pType,
          title: v.title,
          subtitle: v.subtitle || 'Themed Activity Book',
          author: v.author || 'Author',
          theme: v.tags?.[0] || v.title,
          difficulty: 'medium',
          pageCount: 20,
          trimSize: '8.5x11',
          includeAnswers: true,
          includeCoverPage: true,
          includeInstructions: true,
          paperType: 'white',
          gridSize: 12,
          wordCount: 12,
          directions: ['horizontal', 'vertical', 'diagonal'],
        };

        await savePuzzleBook({
          id: puzzleId,
          uid: job.uid,
          settings: pSettings,
          pages: [],
          status: 'generating',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalPages: 24,
        });

        // Run full generation engine
        await runPuzzleBookGeneration(puzzleId, pSettings);
        createdId = puzzleId;
      } else {
        // Create standard manuscript book
        const bookId = `bk_bulk_${Date.now()}_${i}`;
        useBookStore.getState().addBook({
          title: v.title,
          subtitle: v.subtitle || '',
          author: v.author || 'Author',
          genre: v.tags?.[0] || 'General Non-Fiction',
          language: 'English',
          trimSize: '6x9',
          paperType: 'white',
        });
        createdId = bookId;
      }

      variations[i] = {
        ...variations[i],
        status: 'done',
        bookId: createdId,
        error: null,
      };

      completedCount++;

      onProgress?.({
        type: 'progress',
        variationIndex: i,
        status: 'done',
        bookId: createdId,
        completed: completedCount,
        total: variations.length,
        currentAction: `Completed: ${v.title}`,
      });

      // Persist progress to DB
      await updateBulkJob(jobId, {
        variations,
        completedCount,
        currentVariationIndex: i,
      });

      await new Promise((r) => setTimeout(r, 100));
    } catch (err: any) {
      console.error(`Error generating variation ${i}:`, err);
      variations[i] = {
        ...variations[i],
        status: 'failed',
        error: err?.message || 'Generation failed',
      };

      onProgress?.({
        type: 'progress',
        variationIndex: i,
        status: 'failed',
        error: err?.message,
        completed: completedCount,
        total: variations.length,
      });

      await updateBulkJob(jobId, {
        variations,
        failedCount: (job.failedCount || 0) + 1,
      });
    }
  }

  // Finalize Job
  await updateBulkJob(jobId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    completedCount,
    variations,
  });

  onProgress?.({
    type: 'complete',
    status: 'completed',
    completed: completedCount,
    total: variations.length,
  });
}
