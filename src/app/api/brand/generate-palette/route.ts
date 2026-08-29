import { GoogleGenAI } from '@google/genai';
import { withUsageCheck } from '../../../../lib/withUsageCheck';

export async function generatePaletteHandler(params: {
  vibe: string;
  genre?: string;
}): Promise<{
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
}> {
  const { vibe = 'Modern & Elegant', genre = 'Non-Fiction' } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('REPLACE')) {
    return {
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      accentColor: '#f59e0b',
      textColor: '#0f172a',
      backgroundColor: '#ffffff',
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are an expert book designer and brand colorist.
Design a cohesive 5-color hex palette for an author brand with the following vibe:
Vibe / Style: "${vibe}"
Genre: "${genre}"

Requirements:
- primaryColor: Strong main brand color (for titles, spines, headers)
- secondaryColor: Harmonious supporting shade
- accentColor: High-contrast vibrant call-to-action color
- textColor: High contrast readable dark text (e.g. #0f172a or #1e293b)
- backgroundColor: Clean light background (e.g. #ffffff or #f8fafc or #fefaf3)

Return ONLY valid JSON. No markdown, no backticks.
Format:
{
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "accentColor": "#hex",
  "textColor": "#hex",
  "backgroundColor": "#hex"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
      },
    });

    const text = (response.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);
    if (parsed.primaryColor && parsed.secondaryColor && parsed.accentColor) {
      return {
        primaryColor: parsed.primaryColor,
        secondaryColor: parsed.secondaryColor,
        accentColor: parsed.accentColor,
        textColor: parsed.textColor || '#0f172a',
        backgroundColor: parsed.backgroundColor || '#ffffff',
      };
    }
  } catch (err) {
    console.warn('Palette AI generation error, using fallback:', err);
  }

  return {
    primaryColor: '#7c3aed',
    secondaryColor: '#4f46e5',
    accentColor: '#f59e0b',
    textColor: '#0f172a',
    backgroundColor: '#ffffff',
  };
}

export const POST = withUsageCheck('aiGenerations', async (req) => {
  try {
    const body = await req.json();
    const result = await generatePaletteHandler(body);
    return new Response(JSON.stringify({ success: true, palette: result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
