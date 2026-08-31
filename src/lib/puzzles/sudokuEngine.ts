/**
 * Pure TypeScript 9x9 Sudoku Algorithmic Engine
 * - Generates complete, valid 9x9 Sudoku solution boards via randomized backtracking
 * - Removes cells according to calibrated difficulty levels (Easy, Medium, Hard, Expert)
 * - Verifies uniqueness of solution with a backtracking counter
 * - Produces commercial KDP activity book manuscripts with solution keys
 */

export type SudokuDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface SudokuPuzzle {
  id: string;
  difficulty: SudokuDifficulty;
  clueCount: number;
  puzzleGrid: (number | null)[][]; // 9x9 grid with numbers or null
  solutionGrid: number[][];        // 9x9 complete valid grid
}

export const DIFFICULTY_CLUES: Record<SudokuDifficulty, { min: number; max: number; label: string; description: string }> = {
  easy: { min: 38, max: 42, label: 'Easy', description: 'Great for beginners and casual solvers (38-42 clues)' },
  medium: { min: 32, max: 36, label: 'Medium', description: 'Balanced logic requiring basic single and hidden pair techniques (32-36 clues)' },
  hard: { min: 28, max: 31, label: 'Hard', description: 'Advanced solving requiring pointing pairs and box-line reduction (28-31 clues)' },
  expert: { min: 24, max: 27, label: 'Expert / Extreme', description: 'Challenging puzzles requiring X-Wings and swordfish techniques (24-27 clues)' },
};

/**
 * Checks if placing a number at grid[row][col] is valid
 */
export function isValid(grid: (number | null)[][], row: number, col: number, num: number): boolean {
  // Check Row
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false;
  }

  // Check Column
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false;
  }

  // Check 3x3 Box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[startRow + r][startCol + c] === num) return false;
    }
  }

  return true;
}

/**
 * Shuffles an array randomly using Fisher-Yates
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Fills a 9x9 board with a valid complete Sudoku solution
 */
function fillBoard(grid: (number | null)[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (const num of numbers) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            if (fillBoard(grid)) return true;
            grid[row][col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/**
 * Solves the board and counts the number of solutions (stops after 2 for uniqueness test)
 */
function countSolutions(grid: (number | null)[][], count = { value: 0 }): number {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            countSolutions(grid, count);
            grid[row][col] = null;
            if (count.value >= 2) return count.value;
          }
        }
        return count.value;
      }
    }
  }
  count.value++;
  return count.value;
}

/**
 * Generates a complete Sudoku puzzle with guaranteed unique solution
 */
export function generateSudoku(difficulty: SudokuDifficulty = 'medium'): SudokuPuzzle {
  // 1. Initialize empty 9x9 grid
  const fullGrid: (number | null)[][] = Array.from({ length: 9 }, () => Array(9).fill(null));

  // 2. Fill 3 independent diagonal 3x3 boxes first for faster random generation
  for (let box = 0; box < 9; box += 3) {
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        fullGrid[box + r][box + c] = nums[idx++];
      }
    }
  }

  // 3. Solve remaining cells to create a complete board
  fillBoard(fullGrid);

  // Deep copy solution
  const solutionGrid: number[][] = fullGrid.map(row => row.map(v => v as number));
  const puzzleGrid: (number | null)[][] = fullGrid.map(row => [...row]);

  // 4. Determine target clue count
  const targetConfig = DIFFICULTY_CLUES[difficulty];
  const targetClues = Math.floor(Math.random() * (targetConfig.max - targetConfig.min + 1)) + targetConfig.min;
  const cellsToRemove = 81 - targetClues;

  // 5. Remove cells while preserving unique solution
  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  const shuffledPositions = shuffle(positions);

  let removedCount = 0;
  for (const [r, c] of shuffledPositions) {
    if (removedCount >= cellsToRemove) break;

    const temp = puzzleGrid[r][c];
    puzzleGrid[r][c] = null;

    // Check if puzzle still has exactly 1 solution
    const countCheckGrid = puzzleGrid.map(row => [...row]);
    const solutions = countSolutions(countCheckGrid, { value: 0 });

    if (solutions !== 1) {
      // Restore if removing makes it non-unique
      puzzleGrid[r][c] = temp;
    } else {
      removedCount++;
    }
  }

  // Count final clues
  let finalClueCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzleGrid[r][c] !== null) finalClueCount++;
    }
  }

  return {
    id: `sudoku-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    difficulty,
    clueCount: finalClueCount,
    puzzleGrid,
    solutionGrid,
  };
}

/**
 * Generates a batch of N Sudoku puzzles with matching solution keys
 */
export function generateSudokuBatch(count: number, difficulty: SudokuDifficulty = 'medium'): SudokuPuzzle[] {
  return Array.from({ length: count }, () => generateSudoku(difficulty));
}
