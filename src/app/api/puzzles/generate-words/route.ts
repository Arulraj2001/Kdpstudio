import { withUsageCheck } from '../../../../lib/withUsageCheck';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are a word puzzle creator generating themed word lists for word search puzzles.

Rules:
- All words must relate to the theme
- No spaces in words (compound words use no hyphen or space)
- Minimum 3 letters, maximum 15 letters
- No duplicate words
- No offensive or inappropriate words
- Words should be recognizable and interesting
- Mix of word lengths for variety

Return ONLY a JSON array of uppercase strings.
No explanation. No markdown. No preamble.
Example: ["OCEAN","WAVE","CORAL","DOLPHIN","SEAWEED"]`;

export async function generateWordsHandler(params: {
  theme: string;
  count: number;
  wordLength?: string;
  includeProperNouns?: boolean;
  existingWords?: string[];
}): Promise<string[]> {
  const {
    theme,
    count = 15,
    wordLength = 'Mixed',
    includeProperNouns = true,
    existingWords = [],
  } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('REPLACE')) {
    // Fallback theme words generator for offline / test mode
    const fallbackList = [
      'AMAZON', 'AUTHOR', 'CHAPTER', 'PUBLISH', 'MANUSCRIPT',
      'PAPERBACK', 'FORMAT', 'COVER', 'PRINT', 'ROYALTY',
      'BESTSELLER', 'KEYWORD', 'FICTION', 'STORY', 'CHARACTER',
      'EDITOR', 'NOVEL', 'SERIES', 'READER', 'BOOKMARK',
      'CREATIVE', 'PAGE', 'TITLE', 'GENRE', 'VOLUME'
    ];
    return fallbackList.slice(0, count);
  }

  const ai = new GoogleGenAI({ apiKey });

  const userPrompt = `Theme: ${theme || 'General Knowledge'}
Number of words needed: ${count}
Word length preference: ${wordLength}
Include proper nouns: ${includeProperNouns ? 'Yes' : 'No'}
${existingWords.length > 0 ? `Avoid these words (already used): ${existingWords.slice(0, 50).join(', ')}` : ''}

Generate the word list now.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    const rawText = response.text || '';
    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        return parsed
          .map((w: any) => String(w).trim().toUpperCase().replace(/[^A-Z]/g, ''))
          .filter((w: string) => w.length >= 3 && w.length <= 15);
      }
    } catch {
      // Regex extraction fallback
      const matches = cleanJson.match(/"[A-Z]{3,15}"/g);
      if (matches) {
        return matches.map((m) => m.replace(/"/g, '').toUpperCase());
      }
    }

    throw new Error('Could not parse word list from Gemini response');
  } catch (err: any) {
    console.error('generateWordsHandler Gemini error:', err);
    // Return safe deterministic theme words
    return ['OCEAN', 'COAST', 'CORAL', 'WAVE', 'DOLPHIN', 'SHARK', 'REEF', 'TIDE', 'BEACH', 'ISLAND'].slice(0, count);
  }
}

export const POST = withUsageCheck('aiGenerations', async (req) => {
  try {
    const body = await req.json();
    const words = await generateWordsHandler(body);
    return new Response(JSON.stringify({ success: true, words }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
