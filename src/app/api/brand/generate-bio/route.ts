import { GoogleGenAI } from '@google/genai';
import { withUsageCheck } from '../../../../lib/withUsageCheck';

const SYSTEM_PROMPT = `You are a professional author bio writer.
Write author bios that are warm, credible, and engaging.

Rules:
- Write in third person ('John Smith is...')
- Include relevant credentials or background if mentioned
- Warm and approachable tone
- End with something personal or relatable
- Stay strictly within the requested word count:
  - short = 40-50 words
  - medium = 80-100 words
  - long = 180-200 words
- Do not invent fake specific awards
- Return ONLY the clean bio text. No headers, no labels, no quotes.`;

export async function generateBioHandler(params: {
  authorName: string;
  genre?: string;
  existingBio?: string;
  targetLength?: 'short' | 'medium' | 'long';
}): Promise<{ bio: string }> {
  const {
    authorName = 'The Author',
    genre = 'Fiction',
    existingBio = '',
    targetLength = 'medium',
  } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('REPLACE')) {
    const wordCounts = { short: 45, medium: 90, long: 185 };
    const targetWords = wordCounts[targetLength] || 90;
    return {
      bio: `${authorName} is an accomplished author specializing in ${genre.toLowerCase()} literature. With a passion for immersive storytelling and relatable characters, ${authorName} crafts books that entertain and inspire readers around the world. When not writing at a cozy desk with a fresh cup of coffee, ${authorName} enjoys reading, exploring nature, and spending time with family and pets. Connect with ${authorName} online to discover upcoming releases and special bonus content.`,
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const userPrompt = `Author name: ${authorName}
Primary genre: ${genre}
Existing notes/background: ${existingBio || 'None provided'}
Target length: ${targetLength}

Write the author bio now.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    const bio = (response.text || '').trim();
    if (bio) {
      return { bio };
    }
  } catch (err) {
    console.warn('Gemini generateBio error, using fallback:', err);
  }

  return {
    bio: `${authorName} is a dedicated ${genre.toLowerCase()} writer whose passion is bringing compelling ideas and memorable characters to life. When away from the keyboard, ${authorName} can be found exploring local bookstores and enjoying the outdoors.`,
  };
}

export const POST = withUsageCheck('aiGenerations', async (req) => {
  try {
    const body = await req.json();
    const result = await generateBioHandler(body);
    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
