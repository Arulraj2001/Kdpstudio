/**
 * API Route: /api/series/suggest-title
 * Suggests 3 catchy, high-converting book series titles based on genre & premise
 */

import { withUsageCheck } from '../../../../lib/withUsageCheck';
import { GoogleGenAI } from '@google/genai';

export async function suggestSeriesTitlesHandler(reqBody: {
  genre?: string;
  theme?: string;
  targetAudience?: string;
}): Promise<{ titles: string[] }> {
  const { genre = 'Fiction', theme = '', targetAudience = '' } = reqBody;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      titles: [
        `The Chronicles of ${theme || 'Destiny'}`,
        `The ${genre} Legacy`,
        `Tales of ${theme || 'Tomorrow'}`,
      ],
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a bestselling Amazon KDP book series naming consultant.
Suggest 3 catchy, memorable, high-converting series titles for a book series.
Genre: ${genre}
Theme/Premise: ${theme || 'Exciting multi-volume story arc'}
Target Audience: ${targetAudience || 'General readers'}

Return ONLY a JSON array of 3 strings. Example: ["The Silverwood Chronicles", "The Echoes of Time", "Crown of Thorns"]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });
    const text = response.text?.trim() || '';
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return { titles: parsed.slice(0, 3) };
    }
  } catch (err) {
    console.warn('Gemini series title suggestion error:', err);
  }

  return {
    titles: [
      `The ${genre} Chronicles`,
      `Secrets of ${theme || 'the Realm'}`,
      `The ${theme || 'Shadow'} Series`,
    ],
  };
}

export const POST = withUsageCheck('aiGenerations', async (req) => {
  try {
    const body = await req.json();
    const result = await suggestSeriesTitlesHandler(body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Suggestion failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
