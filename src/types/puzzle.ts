/**
 * Puzzle & Activity Book Generator Types
 * Phase 11 — KDP Studio
 */

export type PuzzleBookType = 
  | 'word-search' 
  | 'word-fit' 
  | 'coloring' 
  | 'color-by-number';

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';

export type PuzzleTrimSize = '6x9' | '8x5' | '8x8' | '8.5x8.5' | '8.5x11';

export interface PuzzleBookSettings {
  type: PuzzleBookType;
  title: string;
  subtitle: string;
  author: string;
  theme: string;
  difficulty: PuzzleDifficulty;
  pageCount: number;      // number of puzzle pages
  trimSize: PuzzleTrimSize;
  includeAnswers: boolean;
  includeCoverPage: boolean;
  includeInstructions: boolean;
  paperType: 'white' | 'cream';
}

export interface WordSearchSettings extends PuzzleBookSettings {
  type: 'word-search';
  gridSize: 10 | 12 | 15 | 20;
  wordCount: number;      // words per puzzle (10-20)
  directions: ('horizontal' | 'vertical' | 'diagonal' | 'reverse')[];
  wordList?: string[];     // optional: user provides words
  aiGenerateWords?: boolean;
}

export interface WordFitSettings extends PuzzleBookSettings {
  type: 'word-fit';
  gridSize: 13 | 15 | 17;
  wordCount: number;
  wordList?: string[];
  aiGenerateWords?: boolean;
}

export interface ColoringSettings extends PuzzleBookSettings {
  type: 'coloring';
  style?: 'simple' | 'detailed' | 'mandala' | 'character' | 'animals' | 'nature' | 'geometric';
  illustrationStyle?: 'simple' | 'detailed' | 'mandala' | 'character';
  targetAge: 'kids' | 'older-kids' | 'adults' | 'all-ages' | string;
  imagePrompts?: string[];  // AI generates if empty
  lineThickness: 'thin' | 'medium' | 'thick';
}

export interface ColorByNumberSettings extends PuzzleBookSettings {
  type: 'color-by-number';
  complexity: 'simple' | 'medium' | 'complex';
  colorsCount: 5 | 8 | 12 | 16;
  theme: string;
  imagePrompts?: string[];
}

export type AnyPuzzleBookSettings = 
  | WordSearchSettings 
  | WordFitSettings 
  | ColoringSettings 
  | ColorByNumberSettings 
  | PuzzleBookSettings;

export interface PuzzlePage {
  id: string;
  pageNumber: number;
  type: PuzzleBookType;
  title: string;          // e.g. "Puzzle #1: Ocean Animals"
  puzzleData: any;        // grid/image specific to type
  answerData?: any;       // answer grid for word puzzles
  status: 'pending' | 'generating' | 'done' | 'error';
  imageUrl?: string;      // for coloring/CBN pages
  errorMessage?: string;
}

export interface PuzzleBook {
  id: string;
  uid: string;
  settings: AnyPuzzleBookSettings;
  pages: PuzzlePage[];
  status: 'setup' | 'generating' | 'complete' | 'error';
  createdAt: any;
  updatedAt: any;
  pdfUrl?: string;
  totalPages: number;     // includes cover + answers
}
