/**
 * Cryptogram & Cipher Puzzle Engine
 * Generates monoalphabetic substitution ciphers with letter frequency analysis,
 * custom themes, automatic hint assignment, and matching solution keys.
 */

export interface CryptogramPuzzle {
  id: string;
  originalText: string;
  authorOrSource: string;
  category: string;
  cipherText: string;
  cipherMap: Record<string, string>; // original letter -> cipher letter
  reverseMap: Record<string, string>; // cipher letter -> original letter
  hints: { original: string; cipher: string }[];
  letterFrequencies: Record<string, number>;
}

export const CRYPTOGRAM_QUOTE_BANKS: { text: string; author: string; category: string }[] = [
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "Motivation"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "Inspiration"
  },
  {
    text: "Do not go where the path may lead, go instead where there is no path and leave a trail.",
    author: "Ralph Waldo Emerson",
    category: "Wisdom"
  },
  {
    text: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein",
    category: "Science & Philosophy"
  },
  {
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
    category: "Ancient Wisdom"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    category: "Dreams & Goals"
  },
  {
    text: "You must be the change you wish to see in the world.",
    author: "Mahatma Gandhi",
    category: "Peace & Leadership"
  },
  {
    text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    author: "Henry David Thoreau",
    category: "Introspection"
  },
  {
    text: "Happiness is not something ready made. It comes from your own actions.",
    author: "Dalai Lama",
    category: "Mindfulness"
  },
  {
    text: "Believe you can and you are halfway there.",
    author: "Theodore Roosevelt",
    category: "Confidence"
  }
];

export function generateCryptogram(
  customText?: string,
  author: string = 'Anonymous',
  category: string = 'General',
  hintCount: number = 2
): CryptogramPuzzle {
  const quote = customText && customText.trim().length > 10
    ? { text: customText.trim(), author, category }
    : CRYPTOGRAM_QUOTE_BANKS[Math.floor(Math.random() * CRYPTOGRAM_QUOTE_BANKS.length)];

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  // Derangement / Shuffle algorithm ensuring no letter maps to itself
  let shuffled: string[] = [];
  let isDeranged = false;

  while (!isDeranged) {
    shuffled = [...alphabet].sort(() => Math.random() - 0.5);
    isDeranged = alphabet.every((letter, idx) => letter !== shuffled[idx]);
  }

  const cipherMap: Record<string, string> = {};
  const reverseMap: Record<string, string> = {};

  alphabet.forEach((letter, idx) => {
    cipherMap[letter] = shuffled[idx];
    reverseMap[shuffled[idx]] = letter;
  });

  // Calculate letter frequencies in original text
  const uppercaseText = quote.text.toUpperCase();
  const letterFrequencies: Record<string, number> = {};

  for (const char of uppercaseText) {
    if (alphabet.includes(char)) {
      letterFrequencies[char] = (letterFrequencies[char] || 0) + 1;
    }
  }

  // Generate Cipher Text
  let cipherText = '';
  for (const char of uppercaseText) {
    if (alphabet.includes(char)) {
      cipherText += cipherMap[char];
    } else {
      cipherText += char;
    }
  }

  // Pick high/medium frequency letters as hints
  const sortedLetters = Object.keys(letterFrequencies).sort(
    (a, b) => letterFrequencies[b] - letterFrequencies[a]
  );

  const hints: { original: string; cipher: string }[] = [];
  const selectedHintLetters = sortedLetters.slice(0, Math.min(hintCount, sortedLetters.length));

  selectedHintLetters.forEach(letter => {
    hints.push({
      original: letter,
      cipher: cipherMap[letter]
    });
  });

  return {
    id: `crypto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    originalText: quote.text,
    authorOrSource: quote.author,
    category: quote.category,
    cipherText,
    cipherMap,
    reverseMap,
    hints,
    letterFrequencies
  };
}
