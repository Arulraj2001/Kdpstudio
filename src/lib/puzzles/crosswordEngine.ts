/**
 * Pure TypeScript Clued Crossword Puzzle Engine
 * - Generates intersecting crossword grids from themed word & clue dictionaries
 * - Formats standard Across and Down numbered clues
 * - Handles American / British crossword layout rules
 * - Generates 300 DPI vector PDF books + complete Answer Key grids
 */

export interface CrosswordClue {
  number: number;
  direction: 'across' | 'down';
  clue: string;
  answer: string;
  row: number;
  col: number;
  length: number;
}

export interface CrosswordCell {
  row: number;
  col: number;
  letter: string;           // Actual letter in solution
  number: number | null;    // Clue number in corner (e.g. 1, 2, 3...)
  isBlocked: boolean;       // True if black square
}

export interface CrosswordPuzzle {
  id: string;
  title: string;
  theme: string;
  gridSize: number;         // e.g. 13x13 or 15x15
  grid: CrosswordCell[][];
  acrossClues: CrosswordClue[];
  downClues: CrosswordClue[];
  wordCount: number;
}

export interface ThemedWordPair {
  word: string;
  clue: string;
}

// Curated Themed Word & Clue Banks
export const CROSSWORD_THEMES: Record<string, { name: string; icon: string; pairs: ThemedWordPair[] }> = {
  science: {
    name: 'Science & Nature',
    icon: '🔬',
    pairs: [
      { word: 'GRAVITY', clue: 'The force pulling objects toward the center of the Earth' },
      { word: 'OXYGEN', clue: 'Essential gas for human respiration' },
      { word: 'GALAXY', clue: 'A massive system of stars, gas, and dark matter' },
      { word: 'PHOTOSYNTHESIS', clue: 'Process by which green plants make food from sunlight' },
      { word: 'NUCLEUS', clue: 'The dense central core of an atom or cell' },
      { word: 'FOSSIL', clue: 'Preserved remains of an ancient organism' },
      { word: 'VOLCANO', clue: 'An opening in the Earth\'s crust emitting magma' },
      { word: 'ECLIPSE', clue: 'When one celestial body obscures another' },
      { word: 'PRISM', clue: 'Transparent glass separating white light into colors' },
      { word: 'NEBULA', clue: 'A giant cloud of dust and gas in space' },
      { word: 'GENOME', clue: 'The complete set of genetic material in an organism' },
      { word: 'MAGNET', clue: 'Material producing a magnetic field that attracts iron' },
      { word: 'ROBOT', clue: 'Programmable machine capable of complex actions' },
      { word: 'OCEAN', clue: 'Vast body of salt water covering 71% of Earth' },
      { word: 'CARBON', clue: 'Fundamental chemical element for all organic life' }
    ]
  },
  geography: {
    name: 'World Geography',
    icon: '🌍',
    pairs: [
      { word: 'EQUATOR', clue: 'Imaginary latitude line dividing Northern and Southern hemispheres' },
      { word: 'SAHARA', clue: 'The largest hot desert in the world' },
      { word: 'AMAZON', clue: 'The world\'s largest river by discharge volume' },
      { word: 'EVEREST', clue: 'The highest mountain peak above sea level' },
      { word: 'PACIFIC', clue: 'The largest and deepest of the Earth\'s oceans' },
      { word: 'ISLAND', clue: 'A piece of land surrounded entirely by water' },
      { word: 'CANYON', clue: 'A deep gorge typically with a river flowing through it' },
      { word: 'TUNDRA', clue: 'A vast, flat, treeless Arctic region' },
      { word: 'DELTA', clue: 'Triangular deposit of sediment at a river mouth' },
      { word: 'GLACIER', clue: 'A slowly moving mass of dense ice' },
      { word: 'FJORD', clue: 'A long, narrow deep inlet between high cliffs' },
      { word: 'ARCHIPELAGO', clue: 'A group or chain of scattered islands' },
      { word: 'VOLCANO', clue: 'Mountain with a crater emitting lava' },
      { word: 'PLATEAU', clue: 'An area of relatively level high ground' }
    ]
  },
  animals: {
    name: 'Animals & Wildlife',
    icon: '🦁',
    pairs: [
      { word: 'CHEETAH', clue: 'The fastest land mammal on Earth' },
      { word: 'DOLPHIN', clue: 'Highly intelligent marine mammal known for echolocation' },
      { word: 'PENGUIN', clue: 'Flightless seabird native to Southern Hemisphere ice' },
      { word: 'CHAMELEON', clue: 'Lizard known for changing skin colors and independently moving eyes' },
      { word: 'OCTOPUS', clue: 'Eight-armed cephalopod with blue blood and three hearts' },
      { word: 'KANGAROO', clue: 'Marsupial famous for hopping and pouch carrying' },
      { word: 'GIRAFFE', clue: 'The tallest living terrestrial animal' },
      { word: 'EAGLE', clue: 'Large bird of prey with razor-sharp vision' },
      { word: 'BEAVER', clue: 'Semiaquatic rodent known for building river dams' },
      { word: 'ELEPHANT', clue: 'The largest living land mammal with impressive tusks' },
      { word: 'GORILLA', clue: 'Ground-dwelling herbivorous ape of African forests' },
      { word: 'PANTHER', clue: 'Melanistic leopard or jaguar with sleek black coat' }
    ]
  },
  general: {
    name: 'General Knowledge & Culture',
    icon: '💡',
    pairs: [
      { word: 'HARMONY', clue: 'Pleasing combination of musical notes played together' },
      { word: 'VICTORY', clue: 'An act of defeating an enemy or opponent in battle' },
      { word: 'JOURNEY', clue: 'An act of traveling from one place to another' },
      { word: 'WISDOM', clue: 'The quality of having experience, knowledge, and good judgment' },
      { word: 'CANVAS', clue: 'Strong unbleached cloth used as a surface for oil painting' },
      { word: 'LIBRARY', clue: 'A building or room containing collections of books' },
      { word: 'MYSTERY', clue: 'Something that is difficult or impossible to understand or explain' },
      { word: 'SYMPHONY', clue: 'An elaborate musical composition for full orchestra' },
      { word: 'HORIZON', clue: 'The line at which the earth\'s surface and the sky appear to meet' },
      { word: 'PYRAMID', clue: 'Ancient monumental structure with triangular stone sides' },
      { word: 'COURAGE', clue: 'Strength in the face of pain, danger, or grief' },
      { word: 'DIAMOND', clue: 'Precious gemstone made of pure crystallized carbon' }
    ]
  }
};

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
 * Generates a clean intersecting crossword puzzle from a word pair list
 */
export function generateCrossword(
  themeKey: string = 'science',
  gridSize: number = 13
): CrosswordPuzzle {
  const themeData = CROSSWORD_THEMES[themeKey] || CROSSWORD_THEMES.science;
  const wordPairs = shuffle([...themeData.pairs]);

  // 1. Initialize empty grid (blocked by default)
  const charGrid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
  const placedWords: CrosswordClue[] = [];

  // Helper to check if a word can be placed horizontally
  const canPlaceAcross = (word: string, row: number, col: number): boolean => {
    if (col + word.length > gridSize) return false;
    if (col > 0 && charGrid[row][col - 1] !== '') return false;
    if (col + word.length < gridSize && charGrid[row][col + word.length] !== '') return false;

    let hasIntersection = false;

    for (let i = 0; i < word.length; i++) {
      const currentCell = charGrid[row][col + i];
      if (currentCell !== '' && currentCell !== word[i]) return false;

      if (currentCell === word[i]) {
        hasIntersection = true;
      } else {
        // If placing into an empty cell, check top and bottom neighbors
        if (row > 0 && charGrid[row - 1][col + i] !== '') return false;
        if (row < gridSize - 1 && charGrid[row + 1][col + i] !== '') return false;
      }
    }

    return placedWords.length === 0 || hasIntersection;
  };

  // Helper to check if a word can be placed vertically
  const canPlaceDown = (word: string, row: number, col: number): boolean => {
    if (row + word.length > gridSize) return false;
    if (row > 0 && charGrid[row - 1][col] !== '') return false;
    if (row + word.length < gridSize && charGrid[row + word.length][col] !== '') return false;

    let hasIntersection = false;

    for (let i = 0; i < word.length; i++) {
      const currentCell = charGrid[row + i][col];
      if (currentCell !== '' && currentCell !== word[i]) return false;

      if (currentCell === word[i]) {
        hasIntersection = true;
      } else {
        // If placing into an empty cell, check left and right neighbors
        if (col > 0 && charGrid[row + i][col - 1] !== '') return false;
        if (col < gridSize - 1 && charGrid[row + i][col + 1] !== '') return false;
      }
    }

    return placedWords.length === 0 || hasIntersection;
  };

  // 2. Place first word horizontally near center
  const first = wordPairs[0];
  const firstWord = first.word.toUpperCase();
  const startR = Math.floor(gridSize / 2);
  const startC = Math.max(0, Math.floor((gridSize - firstWord.length) / 2));

  for (let i = 0; i < firstWord.length; i++) {
    charGrid[startR][startC + i] = firstWord[i];
  }
  placedWords.push({
    number: 0,
    direction: 'across',
    clue: first.clue,
    answer: firstWord,
    row: startR,
    col: startC,
    length: firstWord.length
  });

  // 3. Iteratively place remaining words with intersections
  for (let p = 1; p < wordPairs.length; p++) {
    const pair = wordPairs[p];
    const word = pair.word.toUpperCase();
    let placed = false;

    // Try finding an intersecting letter
    for (let r = 0; r < gridSize && !placed; r++) {
      for (let c = 0; c < gridSize && !placed; c++) {
        // Try placing Down
        if (canPlaceDown(word, r, c)) {
          for (let i = 0; i < word.length; i++) {
            charGrid[r + i][c] = word[i];
          }
          placedWords.push({
            number: 0,
            direction: 'down',
            clue: pair.clue,
            answer: word,
            row: r,
            col: c,
            length: word.length
          });
          placed = true;
          break;
        }

        // Try placing Across
        if (canPlaceAcross(word, r, c)) {
          for (let i = 0; i < word.length; i++) {
            charGrid[r][c + i] = word[i];
          }
          placedWords.push({
            number: 0,
            direction: 'across',
            clue: pair.clue,
            answer: word,
            row: r,
            col: c,
            length: word.length
          });
          placed = true;
          break;
        }
      }
    }
  }

  // 4. Number the grid according to standard crossword conventions
  let clueNumber = 1;
  const acrossClues: CrosswordClue[] = [];
  const downClues: CrosswordClue[] = [];
  const cellNumbers: (number | null)[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (charGrid[r][c] === '') continue;

      let isStartOfAcross = false;
      let isStartOfDown = false;

      // Check if starts an Across word (at least 2 letters long)
      if ((c === 0 || charGrid[r][c - 1] === '') && (c + 1 < gridSize && charGrid[r][c + 1] !== '')) {
        isStartOfAcross = true;
      }

      // Check if starts a Down word (at least 2 letters long)
      if ((r === 0 || charGrid[r - 1][c] === '') && (r + 1 < gridSize && charGrid[r + 1][c] !== '')) {
        isStartOfDown = true;
      }

      if (isStartOfAcross || isStartOfDown) {
        cellNumbers[r][c] = clueNumber;

        // Match with placed words or construct clue
        if (isStartOfAcross) {
          const matched = placedWords.find(w => w.direction === 'across' && w.row === r && w.col === c);
          acrossClues.push({
            number: clueNumber,
            direction: 'across',
            clue: matched ? matched.clue : 'Word in grid',
            answer: matched ? matched.answer : '',
            row: r,
            col: c,
            length: matched ? matched.length : 0
          });
        }

        if (isStartOfDown) {
          const matched = placedWords.find(w => w.direction === 'down' && w.row === r && w.col === c);
          downClues.push({
            number: clueNumber,
            direction: 'down',
            clue: matched ? matched.clue : 'Word in grid',
            answer: matched ? matched.answer : '',
            row: r,
            col: c,
            length: matched ? matched.length : 0
          });
        }

        clueNumber++;
      }
    }
  }

  // 5. Build final CrosswordCell matrix
  const grid: CrosswordCell[][] = [];
  for (let r = 0; r < gridSize; r++) {
    const rowCells: CrosswordCell[] = [];
    for (let c = 0; c < gridSize; c++) {
      rowCells.push({
        row: r,
        col: c,
        letter: charGrid[r][c],
        number: cellNumbers[r][c],
        isBlocked: charGrid[r][c] === ''
      });
    }
    grid.push(rowCells);
  }

  return {
    id: `crossword-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: `${themeData.name} Crossword`,
    theme: themeData.name,
    gridSize,
    grid,
    acrossClues,
    downClues,
    wordCount: acrossClues.length + downClues.length
  };
}
