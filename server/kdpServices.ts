import { GoogleGenAI, Type } from '@google/genai';

/**
 * Service for generating Amazon KDP HTML book descriptions
 */
export async function generateBookDescriptionService(
  ai: GoogleGenAI,
  params: {
    title: string;
    subtitle?: string;
    genre: string;
    author?: string;
    chapters?: string[];
    concept?: string;
    targetAudience?: string;
    tone?: string;
  }
): Promise<{ htmlDescription: string; plainDescription: string; wordCount: number; charCount: number }> {
  const { title, subtitle, genre, author, chapters, concept, targetAudience, tone } = params;

  const prompt = `You are a top Amazon KDP publishing copywriter and bestselling book marketer.
Write a high-converting, irresistible book description for an Amazon product page for this book:

Book Details:
- Title: ${title}
- Subtitle: ${subtitle || 'None'}
- Genre: ${genre}
- Author: ${author || 'Bestselling Author'}
${chapters && chapters.length > 0 ? `- Chapter outline: ${chapters.slice(0, 8).join(', ')}` : ''}
${concept ? `- Concept / Synopsis: ${concept}` : ''}
${targetAudience ? `- Target Audience: ${targetAudience}` : ''}
${tone ? `- Preferred Tone: ${tone}` : '- Tone: High-energy, captivating, professional'}

KDP Description Guidelines:
1. Target length: ~350 - 450 words (well under the 4000 character limit).
2. Amazon KDP allows and prioritizes standard HTML formatting tags: <h2>, <b>, <strong>, <i>, <em>, <p>, <ul>, <li>, <br>.
3. Structure:
   - Attention-grabbing bold <h2> headline hook.
   - 2-3 engaging body paragraphs establishing emotional resonance, high stakes, or core transformation.
   - A bulleted list of 3-5 key takeaways, plot twists, or benefits introduced by <b>Inside, you will discover:</b> or similar.
   - A final call-to-action urging readers to buy or read now (e.g. <b>Scroll up and click "Buy Now" to start your journey today!</b>).
4. Do NOT use markdown (use HTML tags directly).
5. Output ONLY the raw HTML description without backticks or markdown code blocks.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert Amazon Kindle Direct Publishing (KDP) marketing strategist and copywriter. Output valid, clean HTML accepted by Amazon KDP.',
      },
    });

    let html = (response.text || '').trim();
    // Strip markdown code fences if model enclosed it
    html = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    const plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = plain.split(/\s+/).filter(Boolean).length;
    const charCount = html.length;

    return {
      htmlDescription: html,
      plainDescription: plain,
      wordCount,
      charCount,
    };
  } catch (error: any) {
    console.error('generateBookDescriptionService error:', error);
    throw error;
  }
}

/**
 * Service for generating 20 Amazon KDP keyword recommendations
 */
export async function suggestKeywordsService(
  ai: GoogleGenAI,
  params: {
    title: string;
    subtitle?: string;
    genre: string;
    description?: string;
  }
): Promise<Array<{
  keyword: string;
  searchIntent: 'Commercial' | 'Transactional' | 'Informational' | 'Navigational';
  competition: 'Low' | 'Medium' | 'High';
  relevanceScore: number;
  explanation: string;
}>> {
  const { title, subtitle, genre, description } = params;

  const prompt = `You are an Amazon KDP SEO & algorithm optimization expert.
Analyze this book and suggest 20 high-converting, high-relevance backend search keyword phrases that readers use on Amazon to find books like this.

Book Details:
- Title: ${title}
- Subtitle: ${subtitle || ''}
- Genre: ${genre}
- Overview: ${description || 'An engaging narrative designed for Amazon readers'}

Amazon KDP Keyword Rules:
- Amazon gives publishers 7 keyword boxes, each with a 50-character limit.
- Keyword phrases should be 2 to 5 words long.
- Do NOT include the author name or exact book title in the keywords (Amazon already indexes those).
- Avoid subjective claims like "bestseller" or "free".
- Focus on real customer search queries, tropes, niches, comparable themes, and sub-genres.

Return a JSON array of 20 keywords following this exact schema:
[
  {
    "keyword": "string (under 50 chars)",
    "searchIntent": "Commercial" | "Transactional" | "Informational" | "Navigational",
    "competition": "Low" | "Medium" | "High",
    "relevanceScore": number (80 to 99),
    "explanation": "short rationale"
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              searchIntent: { type: Type.STRING, enum: ['Commercial', 'Transactional', 'Informational', 'Navigational'] },
              competition: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
              relevanceScore: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
            },
            required: ['keyword', 'searchIntent', 'competition', 'relevanceScore', 'explanation'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    return parsed;
  } catch (error: any) {
    console.error('suggestKeywordsService error:', error);
    throw error;
  }
}

/**
 * Service for suggesting best BISAC & Amazon Browse Categories
 */
export async function suggestCategoriesService(
  ai: GoogleGenAI,
  params: {
    title: string;
    subtitle?: string;
    genre: string;
    description?: string;
  }
): Promise<Array<{
  bisacCode: string;
  categoryName: string;
  amazonBrowsePath: string;
  competitionLevel: 'Low' | 'Medium' | 'High';
  rankingViability: string;
  reason: string;
}>> {
  const { title, subtitle, genre, description } = params;

  const prompt = `You are an Amazon KDP category researcher and bestseller placement expert.
Recommend the top 5 high-potential BISAC categories and Amazon browse node paths for this book to help it rank #1 in less saturated sub-niches.

Book Details:
- Title: ${title}
- Subtitle: ${subtitle || ''}
- Genre: ${genre}
- Description: ${description || 'Book for publication'}

Provide 5 detailed category recommendations. Return a JSON array with schema:
[
  {
    "bisacCode": "e.g. FIC009020",
    "categoryName": "Fiction / Fantasy / Epic",
    "amazonBrowsePath": "Books > Science Fiction & Fantasy > Fantasy > Epic",
    "competitionLevel": "Low" | "Medium" | "High",
    "rankingViability": "High (#1 New Release possible with ~15 sales/day)",
    "reason": "Why this category fits and how easy it is to rank."
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              bisacCode: { type: Type.STRING },
              categoryName: { type: Type.STRING },
              amazonBrowsePath: { type: Type.STRING },
              competitionLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
              rankingViability: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ['bisacCode', 'categoryName', 'amazonBrowsePath', 'competitionLevel', 'rankingViability', 'reason'],
          },
        },
      },
    });

    return JSON.parse(response.text || '[]');
  } catch (error: any) {
    console.error('suggestCategoriesService error:', error);
    throw error;
  }
}

/**
 * Service for Back Cover Blurb generation
 */
export async function generateBackCoverBlurbService(
  ai: GoogleGenAI,
  params: {
    title: string;
    subtitle?: string;
    genre: string;
    summary?: string;
    targetReader?: string;
    problemOrConflict?: string;
    benefits?: string[];
    authorBio?: string;
    styleModifier?: 'default' | 'shorter' | 'punchier';
  }
): Promise<{
  headline: string;
  hookParagraph: string;
  bulletPoints: string[];
  callToAction: string;
  authorBioSnippet: string;
  fullBlurbFormatted: string;
  wordCount: number;
}> {
  const { title, subtitle, genre, summary, targetReader, problemOrConflict, benefits, authorBio, styleModifier = 'default' } = params;

  let modifierInstruction = '';
  if (styleModifier === 'shorter') {
    modifierInstruction = 'Keep the blurb ultra-concise, under 140 words total, perfect for small trim size back covers.';
  } else if (styleModifier === 'punchier') {
    modifierInstruction = 'Use intense emotional urgency, short visceral sentences, high-stakes power verbs, and dramatic cadence.';
  } else {
    modifierInstruction = 'Aim for 180-220 words, perfectly balanced for physical paperback back covers.';
  }

  const prompt = `You are a legendary book cover copywriter specializing in paperback back cover blurbs that convert store browsers into buyers.
Create a structured 5-part back cover blurb for this book.

Book Information:
- Title: ${title}
- Subtitle: ${subtitle || ''}
- Genre: ${genre}
- Story/Content Hook: ${summary || 'An extraordinary journey of discovery and resilience.'}
- Target Reader: ${targetReader || 'Avid readers of this genre'}
- Core Stakes / Problem: ${problemOrConflict || 'Overcoming impossible odds before time runs out.'}
- Key Highlights / Benefits: ${benefits ? benefits.join(' | ') : 'Unforgettable twists, deep worldbuilding, relatable characters'}
- Author Bio: ${authorBio || 'An accomplished storyteller and creator.'}

Tone & Length Guidelines:
${modifierInstruction}

Format your output as a JSON object with:
- headline: Bold, all-caps or impactful opening phrase (e.g. "AN ANCIENT CURSE. A FORGOTTEN HERO. ONE FINAL CHANCE.")
- hookParagraph: 1-2 gripping paragraphs setting up the premise, conflict, and irresistible mystery/transformation.
- bulletPoints: Array of 3 short, punchy benefit/plot bullet points.
- callToAction: 1 sentence closing prompt (e.g. "Pick up your copy today and uncover the truth.")
- authorBioSnippet: 1-2 sentence author credential snippet.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            hookParagraph: { type: Type.STRING },
            bulletPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            callToAction: { type: Type.STRING },
            authorBioSnippet: { type: Type.STRING },
          },
          required: ['headline', 'hookParagraph', 'bulletPoints', 'callToAction', 'authorBioSnippet'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const fullBlurbFormatted = `${parsed.headline}

${parsed.hookParagraph}

${(parsed.bulletPoints || []).map((b: string) => `• ${b}`).join('\n')}

${parsed.callToAction}

About the Author:
${parsed.authorBioSnippet}`;

    const wordCount = fullBlurbFormatted.split(/\s+/).filter(Boolean).length;

    return {
      headline: parsed.headline || '',
      hookParagraph: parsed.hookParagraph || '',
      bulletPoints: parsed.bulletPoints || [],
      callToAction: parsed.callToAction || '',
      authorBioSnippet: parsed.authorBioSnippet || '',
      fullBlurbFormatted,
      wordCount,
    };
  } catch (error: any) {
    console.error('generateBackCoverBlurbService error:', error);
    throw error;
  }
}

/**
 * Service for analyzing title, subtitle & hook
 */
export async function analyzeTitleService(
  ai: GoogleGenAI,
  params: {
    title: string;
    subtitle?: string;
    genre: string;
  }
): Promise<{
  overallScore: number;
  scores: {
    memorability: number;
    searchability: number;
    genreClarity: number;
    emotionalAppeal: number;
  };
  verdict: string;
  strengths: string[];
  improvements: string[];
  suggestedAlternatives: Array<{
    title: string;
    subtitle: string;
    rationale: string;
    conversionFactor: string;
  }>;
}> {
  const { title, subtitle, genre } = params;

  const prompt = `You are a publishing title consultant and Amazon KDP search algorithm specialist.
Analyze this book title and subtitle:

Title: "${title}"
Subtitle: "${subtitle || ''}"
Genre: "${genre}"

Evaluate its marketability, Amazon search click-through rate (CTR), genre signaling, and memorability.
Provide scores from 0-100 and generate 4 high-converting alternative title options.

Return a JSON object with this schema:
{
  "overallScore": number (0-100),
  "scores": {
    "memorability": number (0-100),
    "searchability": number (0-100),
    "genreClarity": number (0-100),
    "emotionalAppeal": number (0-100)
  },
  "verdict": "string summarizing overall effectiveness",
  "strengths": ["string", "string"],
  "improvements": ["string", "string", "string"],
  "suggestedAlternatives": [
    {
      "title": "string",
      "subtitle": "string",
      "rationale": "string",
      "conversionFactor": "string"
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            scores: {
              type: Type.OBJECT,
              properties: {
                memorability: { type: Type.NUMBER },
                searchability: { type: Type.NUMBER },
                genreClarity: { type: Type.NUMBER },
                emotionalAppeal: { type: Type.NUMBER },
              },
              required: ['memorability', 'searchability', 'genreClarity', 'emotionalAppeal'],
            },
            verdict: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedAlternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  conversionFactor: { type: Type.STRING },
                },
                required: ['title', 'subtitle', 'rationale', 'conversionFactor'],
              },
            },
          },
          required: ['overallScore', 'scores', 'verdict', 'strengths', 'improvements', 'suggestedAlternatives'],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error: any) {
    console.error('analyzeTitleService error:', error);
    throw error;
  }
}
