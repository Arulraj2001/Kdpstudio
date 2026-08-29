/**
 * KDP Studio — Bulk Book Generator Types
 * Phase 14A
 */

export type BulkJobStatus =
  | 'draft'
  | 'queued'
  | 'running'
  | 'paused'
  | 'complete'
  | 'failed'
  | 'cancelled';

export type BulkBookType =
  | 'word-search'
  | 'word-fit'
  | 'coloring-book'
  | 'color-by-number'
  | 'journal'
  | 'planner'
  | 'non-fiction'
  | 'activity-book';

export type BulkVariableType =
  | 'text'
  | 'color'
  | 'number'
  | 'select'
  | 'ai-generate';

export interface BulkVariable {
  id: string;
  name: string; // e.g. "theme", "color", "topic"
  label: string; // display label for UI
  type: BulkVariableType;

  // For 'text' type
  values?: string[]; // one value per book variation

  // For 'color' type
  colors?: string[]; // hex colors, one per variation

  // For 'number' type
  startValue?: number;
  endValue?: number;
  step?: number;

  // For 'select' type
  options?: string[]; // predefined choices
  selectedValues?: string[];

  // For 'ai-generate' type
  aiPrompt?: string; // Gemini prompt
  aiCount?: number; // how many variations to generate
  generatedValues?: string[]; // filled after generation
}

export interface BulkTemplateSharedSettings {
  author?: string;
  trimSize?: string;
  paperType?: string;
  language?: string;
  genre?: string;

  // For puzzle books
  gridSize?: number;
  pageCount?: number;
  difficulty?: string;
  includeAnswers?: boolean;
  style?: string;
  targetAge?: string;
  lineThickness?: string;

  // For content / non-fiction books
  chapterCount?: number;
  targetWordCount?: number;
  tone?: string;

  // For journal & planner books
  promptStyle?: 'lined' | 'dotted' | 'blank' | 'prompted';
  promptTheme?: string;
  includeDate?: boolean;
  includePageNumbers?: boolean;
  coverColor?: string;
}

export interface BulkTemplate {
  id: string;
  uid: string;
  name: string; // template name
  description: string;
  bookType: BulkBookType;

  // Template Settings (shared across all variations)
  sharedSettings: BulkTemplateSharedSettings;

  // Variable Fields (change per variation)
  variables: BulkVariable[];

  // Title & Subtitle Template
  titleTemplate: string; // e.g. "{theme} Word Search Book"
  subtitleTemplate: string; // e.g. "{pageCount} Puzzles for {audience}"

  // Variation Count
  variationCount: number; // auto-calculated from variables

  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface BulkVariation {
  variationIndex: number; // 0-based
  resolvedVariables: Record<string, string>; // key = variable.name, value = resolved value
  resolvedTitle: string;
  resolvedSubtitle: string;
  bookId: string | null; // created book / puzzle ID
  status: 'pending' | 'generating' | 'complete' | 'failed' | 'skipped';
  error: string | null;
  startedAt: string | Date | null;
  completedAt: string | Date | null;
  pdfUrl: string | null;
}

export interface BulkJob {
  id: string;
  uid: string;
  templateId: string;
  templateName: string;
  bookType: BulkBookType;

  status: BulkJobStatus;

  variations: BulkVariation[];
  totalVariations: number;

  completedCount: number;
  failedCount: number;
  skippedCount: number;

  currentVariationIndex: number;

  estimatedTimeSeconds: number;
  startedAt: string | Date | null;
  completedAt: string | Date | null;

  // Export
  zipUrl: string | null; // download URL for ZIP of all PDFs

  createdAt: string | Date;
  updatedAt: string | Date;
}

export const BULK_BOOK_TYPE_METADATA: Record<
  BulkBookType,
  { label: string; description: string; iconName: string; defaultTrim: string; estimatedSecondsPerBook: number }
> = {
  'word-search': {
    label: 'Word Search Book',
    description: 'Auto-generate themed word search grids, solution keys, and printable layouts',
    iconName: 'Grid',
    defaultTrim: '8.5x11',
    estimatedSecondsPerBook: 45,
  },
  'word-fit': {
    label: 'Word Fit / Fill-In Book',
    description: 'Calculate crossword intersections, word pools, and puzzle layouts',
    iconName: 'LayoutGrid',
    defaultTrim: '8.5x11',
    estimatedSecondsPerBook: 60,
  },
  'coloring-book': {
    label: 'Coloring Book',
    description: 'Synthesize high-contrast themed line art coloring plates',
    iconName: 'Palette',
    defaultTrim: '8.5x11',
    estimatedSecondsPerBook: 120,
  },
  'color-by-number': {
    label: 'Color by Number',
    description: 'Segmented vector mosaics with numeric color keys',
    iconName: 'Paintbrush',
    defaultTrim: '8.5x11',
    estimatedSecondsPerBook: 90,
  },
  journal: {
    label: 'Guided / Lined Journal',
    description: 'Template-based interior lined, dotted, or daily prompt layouts',
    iconName: 'BookHeart',
    defaultTrim: '6x9',
    estimatedSecondsPerBook: 30,
  },
  planner: {
    label: 'Daily / Weekly Planner',
    description: 'Structured productivity agendas, schedule grids, and priority blocks',
    iconName: 'Calendar',
    defaultTrim: '8.5x11',
    estimatedSecondsPerBook: 30,
  },
  'non-fiction': {
    label: 'Non-Fiction Outline & Draft',
    description: 'AI-structured chapters, outlines, and manuscript skeletons',
    iconName: 'FileText',
    defaultTrim: '6x9',
    estimatedSecondsPerBook: 180,
  },
  'activity-book': {
    label: 'Mixed Activity Book',
    description: 'Combination of puzzles, mazes, and creative activities',
    iconName: 'Sparkles',
    defaultTrim: '8.5x11',
    estimatedSecondsPerBook: 60,
  },
};
