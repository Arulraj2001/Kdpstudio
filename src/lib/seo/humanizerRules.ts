/**
 * KDP Studio — AI Content Humanizer & Anti-Detection Engine
 * 
 * Enforces strict humanized writing principles:
 * 1. Zero tolerance for robotic AI filler words and cliches.
 * 2. Natural sentence burstiness and perplexity (varied sentence lengths).
 * 3. Publisher-to-publisher conversational authority with authentic friction.
 */

// Comprehensive ban-list of overused AI generative words and phrases
export const BANNED_AI_CLICHES = [
  'delve',
  'delve into',
  'delving',
  'tapestry',
  'testament',
  'a testament to',
  'landscape',
  'digital landscape',
  'ever-evolving landscape',
  'paramount',
  'is of paramount importance',
  'crucial',
  'it is crucial to',
  'beacon',
  'beacon of',
  'unlock',
  'unlocking',
  'unlock the power of',
  'harness the power of',
  'revolutionary',
  'revolutionize',
  'game-changer',
  'game changer',
  'seamless',
  'seamlessly',
  'bespoke',
  'embark',
  'embark on a journey',
  'vibrant',
  'foster',
  'plethora',
  'a plethora of',
  'in conclusion',
  'in summary',
  'to sum up',
  'in a world where',
  'in today\'s world',
  'in today\'s fast-paced world',
  'in today\'s digital era',
  'fast-paced world',
  'it is important to remember',
  'it is worth noting that',
  'furthermore',
  'moreover',
  'nestled',
  'dive deep',
  'dive into',
  'navigating the',
  'demystifying',
  'shed light on',
  'realm',
  'in the realm of',
] as const;

export interface HumanizerScanResult {
  hasViolations: boolean;
  violations: { phrase: string; count: number }[];
  totalViolations: number;
  clicheDensity: number; // violations per 1,000 words
}

export interface BurstinessResult {
  totalSentences: number;
  averageSentenceLength: number; // in words
  shortestSentenceLength: number;
  longestSentenceLength: number;
  standardDeviation: number;
  isBurstinessHealthy: boolean; // healthy if standard deviation >= 3.8
}

/**
 * Scans text or HTML for banned AI cliches
 */
export function scanAiCliches(content: string): HumanizerScanResult {
  if (!content) {
    return {
      hasViolations: false,
      violations: [],
      totalViolations: 0,
      clicheDensity: 0,
    };
  }

  // Strip HTML tags for clean phrase scanning
  const plainText = content.replace(/<[^>]*>?/gm, ' ').toLowerCase();
  const words = plainText.split(/\s+/).filter(Boolean);
  const totalWords = words.length || 1;

  const foundViolations: { phrase: string; count: number }[] = [];
  let totalViolations = 0;

  for (const phrase of BANNED_AI_CLICHES) {
    // Escape regex characters
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = plainText.match(regex);
    if (matches && matches.length > 0) {
      foundViolations.push({
        phrase,
        count: matches.length,
      });
      totalViolations += matches.length;
    }
  }

  const clicheDensity = Number(((totalViolations / totalWords) * 1000).toFixed(2));

  return {
    hasViolations: foundViolations.length > 0,
    violations: foundViolations,
    totalViolations,
    clicheDensity,
  };
}

/**
 * Calculates sentence burstiness (variation in sentence length).
 * Human writing has high burstiness (combines 4-word punchy sentences with 25-word explanations).
 * Robotic AI writing has low burstiness (uniform 14-18 word sentences).
 */
export function calculateBurstiness(content: string): BurstinessResult {
  const plainText = content.replace(/<[^>]*>?/gm, ' ').trim();
  if (!plainText) {
    return {
      totalSentences: 0,
      averageSentenceLength: 0,
      shortestSentenceLength: 0,
      longestSentenceLength: 0,
      standardDeviation: 0,
      isBurstinessHealthy: false,
    };
  }

  // Split into sentences using standard punctuation boundaries
  const sentences = plainText
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  if (sentences.length === 0) {
    return {
      totalSentences: 0,
      averageSentenceLength: 0,
      shortestSentenceLength: 0,
      longestSentenceLength: 0,
      standardDeviation: 0,
      isBurstinessHealthy: false,
    };
  }

  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const totalWords = lengths.reduce((acc, len) => acc + len, 0);
  const avgLength = totalWords / lengths.length;

  const shortest = Math.min(...lengths);
  const longest = Math.max(...lengths);

  // Standard deviation
  const variance =
    lengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  return {
    totalSentences: sentences.length,
    averageSentenceLength: Number(avgLength.toFixed(1)),
    shortestSentenceLength: shortest,
    longestSentenceLength: longest,
    standardDeviation: Number(stdDev.toFixed(2)),
    isBurstinessHealthy: stdDev >= 3.8 && shortest <= 6 && longest >= 22,
  };
}

/**
 * Automated sanitization helper: cleans common AI filler patterns and replaces them
 * with clean, human-sounding publisher equivalents.
 */
export function humanizeContent(rawHtml: string): {
  cleanedHtml: string;
  violationsFound: string[];
  wasModified: boolean;
} {
  let cleaned = rawHtml;
  const replacements: [RegExp, string][] = [
    [/\bdelve into\b/gi, 'explore'],
    [/\bdelve\b/gi, 'look at'],
    [/\bis a testament to\b/gi, 'proves'],
    [/\ba testament to\b/gi, 'proof of'],
    [/\bever-evolving landscape\b/gi, 'market shifts'],
    [/\bdigital landscape\b/gi, 'online book market'],
    [/\blandscape\b/gi, 'market'],
    [/\bis of paramount importance\b/gi, 'matters most'],
    [/\bparamount\b/gi, 'essential'],
    [/\bit is crucial to\b/gi, 'make sure to'],
    [/\bcrucial\b/gi, 'vital'],
    [/\bunlock the power of\b/gi, 'use'],
    [/\bunlock\b/gi, 'access'],
    [/\bharness the power of\b/gi, 'use'],
    [/\brevolutionary\b/gi, 'powerful'],
    [/\bgame-changer\b/gi, 'major advantage'],
    [/\bseamlessly\b/gi, 'smoothly'],
    [/\bseamless\b/gi, 'direct'],
    [/\bbespoke\b/gi, 'custom'],
    [/\bembark on a journey\b/gi, 'get started'],
    [/\bembark\b/gi, 'start'],
    [/\ba plethora of\b/gi, 'many'],
    [/\bplethora\b/gi, 'variety'],
    [/\bin conclusion,\b/gi, 'In short,'],
    [/\bin conclusion\b/gi, 'To wrap up'],
    [/\bin summary,\b/gi, 'Key takeaway:'],
    [/\bin today's fast-paced world\b/gi, 'today'],
    [/\bin today's digital era\b/gi, 'today'],
    [/\bthe fast-paced world of\b/gi, 'the competitive market of'],
    [/\bit is important to remember that\b/gi, 'Remember:'],
    [/\bit is worth noting that\b/gi, 'Note:'],
    [/\bfurthermore,\b/gi, 'Also,'],
    [/\bmoreover,\b/gi, 'In addition,'],
    [/\bdive deep into\b/gi, 'examine'],
    [/\bdive deep\b/gi, 'break down'],
    [/\bnavigating the\b/gi, 'handling'],
    [/\bdemystifying\b/gi, 'explaining'],
    [/\bshed light on\b/gi, 'clarify'],
    [/\bin the realm of\b/gi, 'in'],
  ];

  const violationsFound: string[] = [];

  for (const [regex, replacement] of replacements) {
    if (regex.test(cleaned)) {
      violationsFound.push(regex.source);
      cleaned = cleaned.replace(regex, replacement);
    }
  }

  return {
    cleanedHtml: cleaned,
    violationsFound,
    wasModified: violationsFound.length > 0,
  };
}
