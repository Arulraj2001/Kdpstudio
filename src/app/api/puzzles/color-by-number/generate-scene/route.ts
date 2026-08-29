import { GoogleGenAI } from '@google/genai';
import { withUsageCheck } from '../../../../../lib/withUsageCheck';
import { 
  ColorByNumberPageData, 
  ColorRegion, 
  extractColorKey, 
  generateFallbackColorByNumberScene 
} from '../../../../../lib/puzzles/colorByNumber';

const SYSTEM_PROMPT = `You are a professional color-by-number puzzle designer.
Design clean, printable scenes made of simple geometric shapes (rect, circle, polygon) that can be rendered as crisp SVG vectors.

Rules:
- Use only simple geometric shapes: "circle", "rect", "polygon"
- Each shape must be large enough to hold a centered number (minimum width/height 35px in a 500x650 viewBox)
- Coordinates must stay within x: 0..500, y: 0..650
- Order shapes back-to-front (background layers first, then foreground details)
- Use distinct, printer-friendly hex colors
- Assign region id as 1, 2, 3... corresponding to the colors

Return ONLY valid JSON. No preamble, no markdown, no backticks.
Format:
{
  "title": "Sunset by the Lighthouse",
  "description": "A peaceful coastal lighthouse on grassy cliff",
  "viewBox": "0 0 500 650",
  "regions": [
    {
      "id": 1,
      "shape": "rect",
      "x": 20,
      "y": 20,
      "width": 460,
      "height": 340,
      "colorName": "Sky Blue",
      "colorHex": "#38BDF8",
      "label": "sky"
    },
    {
      "id": 2,
      "shape": "circle",
      "cx": 250,
      "cy": 160,
      "r": 50,
      "colorName": "Sun Gold",
      "colorHex": "#FACC15",
      "label": "sun"
    }
  ]
}`;

export async function generateSceneHandler(params: {
  theme: string;
  complexity?: 'simple' | 'medium' | 'complex';
  colorsCount?: number;
  sceneDescription?: string;
  pageNum?: number;
}): Promise<ColorByNumberPageData> {
  const {
    theme = 'Landscape',
    complexity = 'medium',
    colorsCount = 8,
    sceneDescription = '',
    pageNum = 1,
  } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('REPLACE')) {
    return generateFallbackColorByNumberScene(theme, pageNum, complexity);
  }

  const ai = new GoogleGenAI({ apiKey });
  const userPrompt = `Theme: ${theme}
Complexity: ${complexity} (${complexity === 'simple' ? '5-8 regions' : complexity === 'medium' ? '8-12 regions' : '12-16 regions'})
Colors count: ${colorsCount}
${sceneDescription ? `Scene focus: ${sceneDescription}` : ''}
Page number: ${pageNum}

Design a complete color-by-number vector scene now.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.6,
      },
    });

    const rawText = response.text || '';
    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(cleanJson);
    if (parsed && Array.isArray(parsed.regions) && parsed.regions.length >= 4) {
      const validRegions: ColorRegion[] = parsed.regions
        .filter((r: any) => r && typeof r.id === 'number' && ['circle', 'rect', 'polygon', 'path'].includes(r.shape))
        .map((r: any, idx: number) => ({
          ...r,
          id: r.id || idx + 1,
          colorHex: r.colorHex || '#38bdf8',
          colorName: r.colorName || `Color ${r.id || idx + 1}`,
          label: r.label || `Region ${idx + 1}`,
        }));

      if (validRegions.length >= 4) {
        return {
          title: parsed.title || `${theme} Plate #${pageNum}`,
          description: parsed.description || `Color by number scene for ${theme}`,
          viewBox: parsed.viewBox || '0 0 500 650',
          regions: validRegions,
          colorKey: extractColorKey(validRegions),
        };
      }
    }
  } catch (err) {
    console.warn('Gemini scene generation notice:', err);
  }

  return generateFallbackColorByNumberScene(theme, pageNum, complexity);
}

export const POST = withUsageCheck('aiGenerations', async (req) => {
  try {
    const body = await req.json();
    const scene = await generateSceneHandler(body);
    return new Response(JSON.stringify({ success: true, scene }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
