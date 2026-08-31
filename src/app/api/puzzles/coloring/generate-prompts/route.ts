import { GoogleGenAI } from '@google/genai';
import { withUsageCheck } from '../../../../../lib/withUsageCheck';

const SYSTEM_PROMPT = `You are an expert at writing prompts for AI image generation tools that create coloring book pages.

Your prompts must produce:
- Black and white line art ONLY
- Clear bold outlines with NO color or shading
- Clean white background
- No text in the image
- Coloring book style illustration

Style guide:
- Simple: thick bold outlines, large areas to color, no fine detail, great for young kids
- Detailed: thin lines, intricate patterns, many small areas, great for adults
- Mandala: circular symmetrical geometric patterns, relaxing zentangle style
- Character: cute cartoon-style characters with personality and clean contours

Each prompt must be unique — no repetition. Vary the composition: some close-up portrait, some full wide scene.

Return ONLY a JSON array of strings.
Each string is one image prompt.
No explanation. No markdown. No preamble.
Example: ["A peaceful sea turtle swimming near coral reef, black outline only, coloring book page", "A smiling dolphin jumping out of calm waves with seagulls in distance, coloring book style"]`;

export async function generateColoringPromptsHandler(params: {
  theme: string;
  style?: string;
  targetAge?: string;
  pageCount?: number;
  lineThickness?: string;
}): Promise<string[]> {
  const {
    theme,
    style = 'detailed',
    targetAge = 'All Ages',
    pageCount = 20,
    lineThickness = 'medium',
  } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('REPLACE')) {
    // Fallback dynamic coloring prompts for offline / test mode
    return Array.from({ length: pageCount }, (_, i) => {
      const idx = i + 1;
      const subjects = [
        'Majestic centerpiece illustration featuring',
        'Close-up detailed focus on',
        'Wide scenic landscape showing',
        'Whimsical ornate composition of',
        'Geometric bordered artwork displaying',
      ];
      const prefix = subjects[i % subjects.length];
      return `${prefix} ${theme || 'Nature & Wildlife'} illustration #${idx}, clean black line art, coloring book page, white background, no shading`;
    });
  }

  const ai = new GoogleGenAI({ apiKey });

  const userPrompt = `Theme: ${theme || 'General Coloring'}
Style: ${style}
Target age: ${targetAge}
Line thickness: ${lineThickness}
Number of prompts needed: ${pageCount}

Generate ${pageCount} unique, distinct coloring page prompt descriptions.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => String(p).trim()).filter(Boolean);
      }
    } catch {}

    const lines = rawText
      .split('\n')
      .map((l) => l.replace(/^[\d\-*.•\])\s"]+|["\s,]+$/g, '').trim())
      .filter((l) => l.length > 10);

    if (lines.length >= 5) {
      return lines.slice(0, pageCount);
    }
  } catch (err) {
    console.warn('Gemini coloring prompt generation notice:', err);
  }

  return Array.from({ length: pageCount }, (_, i) => {
    return `Beautiful ${theme || 'Themed'} coloring illustration #${i + 1}, crisp black outlines, coloring book style, white background`;
  });
}

export const POST = withUsageCheck('aiGenerations', async (req) => {
  try {
    const body = await req.json();
    const prompts = await generateColoringPromptsHandler(body);
    return new Response(JSON.stringify({ success: true, prompts }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
