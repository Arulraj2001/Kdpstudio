/**
 * API Route: /api/series/generate-description
 * Generates or improves a compelling Amazon KDP series description (under 100 words)
 */

import { withUsageCheck } from '../../../../lib/withUsageCheck';
import { GoogleGenAI } from '@google/genai';

export async function generateSeriesDescriptionHandler(reqBody: {
  title: string;
  genre?: string;
  theme?: string;
  targetAudience?: string;
  totalVolumes?: number;
}): Promise<{ description: string }> {
  const { title, genre = 'Fiction', theme = '', targetAudience = '', totalVolumes = 3 } = reqBody;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      description: `Welcome to "${title}", an epic ${totalVolumes}-part ${genre} series crafted for ${targetAudience || 'readers worldwide'}. Follow unforgettable characters through suspense, drama, and extraordinary revelations. Perfect for binge-readers seeking their next favorite collection.`,
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a master Amazon KDP copywriter. Write a compelling, binge-worthy series overview description for a ${totalVolumes}-book ${genre} collection titled "${title}".
Theme/Details: ${theme || 'High-stakes journey'}
Target Audience: ${targetAudience || 'Enthusiastic readers'}

Keep it strictly under 100 words. Hook readers in the first sentence and end with an enticing call to binge the series in order.
Return ONLY the description text without quotes or preamble.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });
    const text = response.text?.trim() || '';
    if (text) {
      return { description: text };
    }
  } catch (err) {
    console.warn('Gemini series description generator error:', err);
  }

  return {
    description: `Immerse yourself in "${title}", a captivating ${totalVolumes}-book ${genre} series. Filled with memorable characters and gripping storylines, this collection is designed to keep you hooked from Volume 1 through to the grand finale.`,
  };
}

export const POST = withUsageCheck('aiGenerations', async (req) => {
  try {
    const body = await req.json();
    const result = await generateSeriesDescriptionHandler(body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Description generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
