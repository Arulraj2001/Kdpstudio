/**
 * Pure JavaScript Word Search Puzzle Generator
 * Phase 11 — KDP Studio
 */

export interface PlacedWord {
  word: string;
  startRow: number;
  startCol: number;
  direction: string;
  endRow: number;
  endCol: number;
}

export interface WordSearchResult {
  grid: string[][];
  placedWords: PlacedWord[];
  unplacedWords: string[];
}

/**
 * Common English letter frequency weighted list
 */
const WEIGHTED_LETTERS = [
  'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', // 13%
  'T', 'T', 'T', 'T', 'T', 'T', 'T', 'T', 'T',                     // 9%
  'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A',                          // 8%
  'O', 'O', 'O', 'O', 'O', 'O', 'O',                               // 7%
  'I', 'I', 'I', 'I', 'I', 'I', 'I',                               // 7%
  'N', 'N', 'N', 'N', 'N', 'N', 'N',                               // 7%
  'S', 'S', 'S', 'S', 'S', 'S',                                    // 6%
  'R', 'R', 'R', 'R', 'R', 'R',                                    // 6%
  'H', 'H', 'H', 'H', 'H', 'H',                                    // 6%
  'L', 'L', 'L', 'L',                                              // 4%
  'D', 'D', 'D', 'D',                                              // 4%
  'C', 'C', 'C',                                                   // 3%
  'U', 'U', 'U', 'M', 'M', 'M', 'W', 'W', 'F', 'F', 'G', 'G',      // 2-3%
  'Y', 'Y', 'P', 'P', 'B', 'B', 'V', 'K', 'J', 'X', 'Q', 'Z'       // 1-2%
];

/**
 * Returns a weighted random uppercase letter
 */
export function getRandomFillerLetter(): string {
  const index = Math.floor(Math.random() * WEIGHTED_LETTERS.length);
  return WEIGHTED_LETTERS[index] || 'E';
}

/**
 * Direction vectors for word placement
 */
export function getDirectionDelta(direction: string): { dr: number; dc: number } {
  switch (direction) {
    case 'horizontal':
      return { dr: 0, dc: 1 };
    case 'vertical':
      return { dr: 1, dc: 0 };
    case 'diagonal':
      return { dr: 1, dc: 1 };
    case 'reverse':
      return { dr: 0, dc: -1 };
    case 'diagonal-up':
      return { dr: -1, dc: 1 };
    case 'vertical-up':
      return { dr: -1, dc: 0 };
    case 'diagonal-reverse':
      return { dr: -1, dc: -1 };
    default:
      return { dr: 0, dc: 1 };
  }
}

/**
 * Checks whether a word can be placed at the given row/col in the chosen direction
 */
export function canPlaceWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: string
): boolean {
  const gridSize = grid.length;
  const { dr, dc } = getDirectionDelta(direction);
  const cleanWord = word.toUpperCase().replace(/[^A-Z]/g, '');

  if (!cleanWord) return false;

  const endRow = row + (cleanWord.length - 1) * dr;
  const endCol = col + (cleanWord.length - 1) * dc;

  // Check grid boundaries
  if (endRow < 0 || endRow >= gridSize || endCol < 0 || endCol >= gridSize) {
    return false;
  }

  // Check each cell for conflicts
  for (let i = 0; i < cleanWord.length; i++) {
    const r = row + i * dr;
    const c = col + i * dc;
    const currentCell = grid[r][c];
    if (currentCell !== '' && currentCell !== cleanWord[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Places word onto grid
 */
export function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: string
): void {
  const { dr, dc } = getDirectionDelta(direction);
  const cleanWord = word.toUpperCase().replace(/[^A-Z]/g, '');

  for (let i = 0; i < cleanWord.length; i++) {
    const r = row + i * dr;
    const c = col + i * dc;
    grid[r][c] = cleanWord[i];
  }
}

/**
 * Generates a complete Word Search grid from a list of words
 */
export function generateWordSearchGrid(
  words: string[],
  gridSize: number = 15,
  allowedDirections: string[] = ['horizontal', 'vertical', 'diagonal', 'reverse']
): WordSearchResult {
  const size = Math.max(8, Math.min(30, gridSize));
  const dirs = allowedDirections.length > 0 ? allowedDirections : ['horizontal', 'vertical', 'diagonal'];

  // 1. Create empty grid
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const placedWords: PlacedWord[] = [];
  const unplacedWords: string[] = [];

  // 2. Clean and sort words (longer words first for better density)
  const cleanedWords = words
    .map((w) => w.trim().toUpperCase().replace(/[^A-Z]/g, ''))
    .filter((w) => w.length > 1 && w.length <= size);

  // Shuffle slightly but keep bias towards longer words
  cleanedWords.sort((a, b) => b.length - a.length || Math.random() - 0.5);

  // 3. Place each word
  for (const word of cleanedWords) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 120;

    while (!placed && attempts < maxAttempts) {
      attempts++;
      const direction = dirs[Math.floor(Math.random() * dirs.length)];
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);

      if (canPlaceWord(grid, word, row, col, direction)) {
        placeWord(grid, word, row, col, direction);
        const { dr, dc } = getDirectionDelta(direction);
        placedWords.push({
          word,
          startRow: row,
          startCol: col,
          direction,
          endRow: row + (word.length - 1) * dr,
          endCol: col + (word.length - 1) * dc,
        });
        placed = true;
      }
    }

    if (!placed) {
      unplacedWords.push(word);
    }
  }

  // 4. Fill remaining empty cells with weighted random English letters
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = getRandomFillerLetter();
      }
    }
  }

  return {
    grid,
    placedWords,
    unplacedWords,
  };
}

/**
 * Generates an answer key grid showing only the placed words and dots for background
 */
export function generateAnswerGrid(
  grid: string[][],
  placedWords: PlacedWord[]
): string[][] {
  const size = grid.length;
  const answerGrid: string[][] = Array.from({ length: size }, () => Array(size).fill('·'));

  for (const placed of placedWords) {
    const { dr, dc } = getDirectionDelta(placed.direction);
    for (let i = 0; i < placed.word.length; i++) {
      const r = placed.startRow + i * dr;
      const c = placed.startCol + i * dc;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        answerGrid[r][c] = placed.word[i];
      }
    }
  }

  return answerGrid;
}
