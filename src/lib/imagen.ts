/**
 * Client-side utility for AI cover image generation using server-side Gemini/Imagen API
 */

export interface GeneratedImageResult {
  imageBase64: string;
  mimeType: string;
  url: string;
}

export interface CoverStyleSuggestion {
  palette: string[];
  primaryFont: string;
  secondaryFont: string;
  styleDescription: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

export async function generateCoverImage(
  prompt: string,
  aspectRatio: 'square' | 'portrait' | 'landscape' | string = 'portrait',
  style: string = 'Digital art',
  mood: string = 'Dramatic'
): Promise<GeneratedImageResult> {
  const fullPrompt = `${prompt}. Style: ${style}, Mood/Atmosphere: ${mood}. High resolution, masterpiece book cover art, vibrant composition, detailed textures.`;

  // Map to API supported aspect ratios
  let apiAspectRatio = '3:4';
  if (aspectRatio === 'square' || aspectRatio === '1:1') apiAspectRatio = '1:1';
  else if (aspectRatio === 'landscape' || aspectRatio === '16:9') apiAspectRatio = '16:9';
  else if (aspectRatio === 'portrait' || aspectRatio === '3:4') apiAspectRatio = '3:4';

  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: fullPrompt,
      aspectRatio: apiAspectRatio,
      style,
      mood,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate cover image');
  }

  const data = await response.json();
  const mimeType = data.mimeType || 'image/png';
  const rawBase64 = data.imageBase64;
  const url = rawBase64.startsWith('data:') ? rawBase64 : `data:${mimeType};base64,${rawBase64}`;

  return {
    imageBase64: rawBase64,
    mimeType,
    url,
  };
}

export async function suggestCoverStyle(
  title: string,
  genre: string,
  subtitle?: string
): Promise<CoverStyleSuggestion> {
  const response = await fetch('/api/suggest-cover-style', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, genre, subtitle }),
  });

  if (!response.ok) {
    // Fallback styles by genre
    return getFallbackStyle(genre);
  }

  const data = await response.json();
  return data.suggestion || getFallbackStyle(genre);
}

function getFallbackStyle(genre: string): CoverStyleSuggestion {
  const g = (genre || '').toLowerCase();

  if (g.includes('thrill') || g.includes('myster') || g.includes('horror')) {
    return {
      palette: ['#0d1117', '#1f2937', '#b91c1c', '#f3f4f6', '#374151'],
      primaryFont: 'Cinzel',
      secondaryFont: 'Montserrat',
      styleDescription: 'Dark, tense, and atmospheric with high-contrast crimson accents.',
      backgroundColor: '#0f172a',
      textColor: '#f8fafc',
      accentColor: '#dc2626',
    };
  }

  if (g.includes('romance') || g.includes('memoir') || g.includes('poetry')) {
    return {
      palette: ['#2e1065', '#831843', '#f472b6', '#fdf2f8', '#fbcfe8'],
      primaryFont: 'Playfair Display',
      secondaryFont: 'Lora',
      styleDescription: 'Elegant, emotional, and warm with graceful editorial typography.',
      backgroundColor: '#3b0764',
      textColor: '#fdf4ff',
      accentColor: '#f472b6',
    };
  }

  if (g.includes('sci') || g.includes('tech') || g.includes('cyber')) {
    return {
      palette: ['#030712', '#0284c7', '#38bdf8', '#0f172a', '#e0f2fe'],
      primaryFont: 'Bebas Neue',
      secondaryFont: 'Poppins',
      styleDescription: 'Futuristic and sharp with vivid electric blue lighting.',
      backgroundColor: '#020617',
      textColor: '#f8fafc',
      accentColor: '#38bdf8',
    };
  }

  if (g.includes('business') || g.includes('self') || g.includes('finance')) {
    return {
      palette: ['#0f172a', '#1e3a8a', '#d97706', '#f8fafc', '#64748b'],
      primaryFont: 'Montserrat',
      secondaryFont: 'Roboto Slab',
      styleDescription: 'Clean, authoritative, and minimalist with gold accents.',
      backgroundColor: '#0f172a',
      textColor: '#ffffff',
      accentColor: '#f59e0b',
    };
  }

  // Default fiction / literary
  return {
    palette: ['#1c1917', '#44403c', '#b45309', '#fef3c7', '#f5f5f4'],
    primaryFont: 'Playfair Display',
    secondaryFont: 'EB Garamond',
    styleDescription: 'Timeless literary aesthetic with refined golden serif highlights.',
    backgroundColor: '#1c1917',
    textColor: '#fafaf9',
    accentColor: '#f59e0b',
  };
}
