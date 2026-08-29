/**
 * Pure JavaScript Word Fit / Fill-in Puzzle Generator
 * Phase 11 — KDP Studio
 */

export interface WordFitCell {
  letter: string | null;     // null = black / blocked cell
  isBlocked: boolean;
  slotId: string | null;
  number?: number;          // Crossword grid cell number (e.g. 1, 2, 3...)
}

export interface WordFitSlot {
  id: string;
  number: number;
  direction: 'across' | 'down';
  startRow: number;
  startCol: number;
  length: number;
  word?: string;             // Stored for answer key
}

export interface WordFitResult {
  grid: WordFitCell[][];
  placedWords: string[];
  unplacedWords: string[];
  slots: WordFitSlot[];
}

/**
 * Checks if a word can intersect or be placed horizontally (across)
 */
function canPlaceAcross(
  grid: (string | null)[][],
  size: number,
  word: string,
  row: number,
  col: number
): boolean {
  if (col + word.length > size) return false;

  // Check left and right boundary buffers
  if (col > 0 && grid[row][col - 1] !== null) return false;
  if (col + word.length < size && grid[row][col + word.length] !== null) return false;

  let hasIntersection = false;

  for (let i = 0; i < word.length; i++) {
    const c = col + i;
    const current = grid[row][c];

    if (current !== null) {
      if (current !== word[i]) return false;
      hasIntersection = true;
    } else {
      // Check top and bottom neighbors to prevent accidental parallel merging
      if (row > 0 && grid[row - 1][c] !== null) return false;
      if (row < size - 1 && grid[row + 1][c] !== null) return false;
    }
  }

  return hasIntersection || grid.every((r) => r.every((cell) => cell === null));
}

/**
 * Checks if a word can intersect or be placed vertically (down)
 */
function canPlaceDown(
  grid: (string | null)[][],
  size: number,
  word: string,
  row: number,
  col: number
): boolean {
  if (row + word.length > size) return false;

  // Check top and bottom boundary buffers
  if (row > 0 && grid[row - 1][col] !== null) return false;
  if (row + word.length < size && grid[row + word.length][col] !== null) return false;

  let hasIntersection = false;

  for (let i = 0; i < word.length; i++) {
    const r = row + i;
    const current = grid[r][col];

    if (current !== null) {
      if (current !== word[i]) return false;
      hasIntersection = true;
    } else {
      // Check left and right neighbors to prevent parallel merging
      if (col > 0 && grid[r][col - 1] !== null) return false;
      if (col < size - 1 && grid[r][col + 1] !== null) return false;
    }
  }

  return hasIntersection || grid.every((r) => r.every((cell) => cell === null));
}

/**
 * Generates an interlocking Word Fit puzzle grid from an input word list
 */
export function generateWordFitGrid(
  words: string[],
  gridSize: number = 15
): WordFitResult {
  const size = Math.max(11, Math.min(25, gridSize));
  const rawGrid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  const placedWords: string[] = [];
  const unplacedWords: string[] = [];
  const rawSlots: { direction: 'across' | 'down'; row: number; col: number; word: string }[] = [];

  // 1. Clean and sort words (longest first for central anchor)
  const cleanWords = Array.from(
    new Set(
      words
        .map((w) => w.trim().toUpperCase().replace(/[^A-Z]/g, ''))
        .filter((w) => w.length >= 3 && w.length <= size)
    )
  ).sort((a, b) => b.length - a.length);

  if (cleanWords.length === 0) {
    return {
      grid: Array.from({ length: size }, () =>
        Array.from({ length: size }, () => ({ letter: null, isBlocked: true, slotId: null }))
      ),
      placedWords: [],
      unplacedWords: [],
      slots: [],
    };
  }

  // 2. Place first longest word in horizontal center
  const firstWord = cleanWords[0];
  const startRow = Math.floor(size / 2);
  const startCol = Math.max(0, Math.floor((size - firstWord.length) / 2));

  for (let i = 0; i < firstWord.length; i++) {
    rawGrid[startRow][startCol + i] = firstWord[i];
  }
  placedWords.push(firstWord);
  rawSlots.push({ direction: 'across', row: startRow, col: startCol, word: firstWord });

  // 3. Iteratively place remaining words using shared letter intersections
  for (let wIdx = 1; wIdx < cleanWords.length; wIdx++) {
    const word = cleanWords[wIdx];
    let placed = false;

    // Search existing grid for matching letters
    const candidateIntersections: { dir: 'across' | 'down'; r: number; c: number }[] = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const letterOnGrid = rawGrid[r][c];
        if (letterOnGrid) {
          // Find all occurrences of letterOnGrid in candidate word
          for (let i = 0; i < word.length; i++) {
            if (word[i] === letterOnGrid) {
              // Option A: place across intersecting this down/letter
              const acrossCol = c - i;
              if (acrossCol >= 0 && canPlaceAcross(rawGrid, size, word, r, acrossCol)) {
                candidateIntersections.push({ dir: 'across', r, c: acrossCol });
              }

              // Option B: place down intersecting this across/letter
              const downRow = r - i;
              if (downRow >= 0 && canPlaceDown(rawGrid, size, word, downRow, c)) {
                candidateIntersections.push({ dir: 'down', r: downRow, c });
              }
            }
          }
        }
      }
    }

    if (candidateIntersections.length > 0) {
      // Pick random valid intersection candidate
      const chosen = candidateIntersections[Math.floor(Math.random() * candidateIntersections.length)];
      if (chosen.dir === 'across') {
        for (let i = 0; i < word.length; i++) {
          rawGrid[chosen.r][chosen.c + i] = word[i];
        }
        rawSlots.push({ direction: 'across', row: chosen.r, col: chosen.c, word });
      } else {
        for (let i = 0; i < word.length; i++) {
          rawGrid[chosen.r + i][chosen.c] = word[i];
        }
        rawSlots.push({ direction: 'down', row: chosen.r, col: chosen.c, word });
      }
      placedWords.push(word);
      placed = true;
    }

    if (!placed) {
      unplacedWords.push(word);
    }
  }

  // 4. Assign standard crossword cell numbers and build slot metadata
  let nextNumber = 1;
  const numberMap: Record<string, number> = {};
  const formattedSlots: WordFitSlot[] = [];

  // Sort slots in reading order (row first, then col)
  rawSlots.sort((a, b) => a.row - b.row || a.col - b.col);

  for (const s of rawSlots) {
    const key = `${s.row},${s.col}`;
    if (!numberMap[key]) {
      numberMap[key] = nextNumber++;
    }

    formattedSlots.push({
      id: `slot_${s.direction}_${s.row}_${s.col}`,
      number: numberMap[key],
      direction: s.direction,
      startRow: s.row,
      startCol: s.col,
      length: s.word.length,
      word: s.word,
    });
  }

  // 5. Build final WordFitCell grid
  const finalGrid: WordFitCell[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      const letter = rawGrid[r][c];
      const isBlocked = letter === null;
      const num = numberMap[`${r},${c}`];
      return {
        letter,
        isBlocked,
        slotId: isBlocked ? null : `cell_${r}_${c}`,
        number: num,
      };
    })
  );

  return {
    grid: finalGrid,
    placedWords,
    unplacedWords,
    slots: formattedSlots,
  };
}

/**
 * Returns slots stripped of answers, organized by word length for puzzle display
 */
export function generateWordFitPuzzle(slots: WordFitSlot[]): WordFitSlot[] {
  return slots.map((s) => ({
    ...s,
    word: undefined,
  }));
}

/**
 * Groups a word list by character length for Word Fit puzzle footer
 */
export function groupWordsByLength(words: string[]): Record<number, string[]> {
  const groups: Record<number, string[]> = {};
  for (const w of words) {
    const len = w.length;
    if (!groups[len]) groups[len] = [];
    groups[len].push(w.toUpperCase());
  }
  for (const len in groups) {
    groups[len].sort();
  }
  return groups;
}
