import { GoogleGenAI } from '@google/genai';
import { generateImageWithFallback } from '../src/lib/imageGeneration';

/**
 * Generates an image using the unified fallback cascade (Imagen 3 -> Hugging Face -> Cloudflare -> SVG)
 */
export async function generateCoverImageService(
  ai: GoogleGenAI,
  prompt: string,
  aspectRatio: string = '3:4',
  style: string = 'Digital art',
  mood: string = 'Dramatic'
): Promise<{ imageBase64: string; mimeType: string }> {
  try {
    const fullPrompt = `Book cover illustration artwork: ${prompt}. Art style: ${style}. Atmospheric mood: ${mood}. Professional publishing quality, high detail, masterpiece composition, no text, clean artwork.`;
    const result = await generateImageWithFallback(fullPrompt, aspectRatio);
    
    if (result.imageUrl && result.imageUrl.startsWith('data:image/')) {
      const match = result.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return {
          mimeType: match[1],
          imageBase64: match[2],
        };
      }
    }
  } catch (err: any) {
    console.warn('[CoverService] Image generation fallback triggered:', err.message);
  }

  // Fallback: Generate an SVG rasterized/encoded artistic backdrop
  return generateFallbackCoverArt(prompt, style, mood, aspectRatio);
}

/**
 * Suggests color palette, typography pairing, and style description
 */
export async function suggestCoverStyleService(
  ai: GoogleGenAI,
  title: string,
  genre: string,
  subtitle?: string
) {
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `As a professional book cover designer, analyze this book title and genre to suggest an ideal cover design aesthetic:
Title: "${title}"
Subtitle: "${subtitle || ''}"
Genre: "${genre}"

Return a valid JSON object with the following fields:
{
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "primaryFont": "One of (Cinzel, Playfair Display, Bebas Neue, Montserrat, Merriweather, Oswald, Lora, Alegreya, Poppins, Abril Fatface, Roboto Slab)",
  "secondaryFont": "One of (Montserrat, Lora, EB Garamond, Poppins, Roboto Slab, Raleway)",
  "styleDescription": "Brief 1-2 sentence description of the recommended visual theme",
  "backgroundColor": "#hex",
  "textColor": "#hex",
  "accentColor": "#hex"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);
      if (parsed && parsed.palette && parsed.primaryFont) {
        return parsed;
      }
    } catch (err) {
      console.warn('AI cover style suggestion fallback:', err);
    }
  }

  // Fallback styling
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

  if (g.includes('sci') || g.includes('tech')) {
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

/**
 * Generate a high quality graphic SVG encoded into Base64 for fallback preview
 */
function generateFallbackCoverArt(
  prompt: string,
  style: string,
  mood: string,
  aspectRatio: string
): { imageBase64: string; mimeType: string } {
  let width = 600;
  let height = 800;
  if (aspectRatio === '1:1') {
    width = 600;
    height = 600;
  } else if (aspectRatio === '16:9') {
    width = 800;
    height = 450;
  }

  // Generate artistic gradient & geometry based on mood
  let bgGrad1 = '#0f172a';
  let bgGrad2 = '#1e1b4b';
  let accentColor = '#818cf8';

  const m = mood.toLowerCase();
  if (m.includes('dark') || m.includes('myster')) {
    bgGrad1 = '#050811';
    bgGrad2 = '#18181b';
    accentColor = '#ef4444';
  } else if (m.includes('peace') || m.includes('bright')) {
    bgGrad1 = '#042f2e';
    bgGrad2 = '#065f46';
    accentColor = '#34d399';
  } else if (m.includes('energetic') || m.includes('dramat')) {
    bgGrad1 = '#431407';
    bgGrad2 = '#7c2d12';
    accentColor = '#fb923c';
  }

  const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGrad1}" />
      <stop offset="50%" stop-color="${bgGrad2}" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.1" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30" result="blur" />
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <circle cx="${width * 0.5}" cy="${height * 0.4}" r="${Math.min(width, height) * 0.35}" fill="${accentColor}" opacity="0.15" filter="url(#glow)" />
  <path d="M 0 ${height * 0.7} Q ${width * 0.5} ${height * 0.5} ${width} ${height * 0.75} L ${width} ${height} L 0 ${height} Z" fill="url(#accent)" opacity="0.3" />
  <path d="M 0 ${height * 0.8} Q ${width * 0.3} ${height * 0.65} ${width} ${height * 0.85} L ${width} ${height} L 0 ${height} Z" fill="${bgGrad1}" opacity="0.6" />
  <circle cx="${width * 0.75}" cy="${height * 0.25}" r="3" fill="#ffffff" opacity="0.7" />
  <circle cx="${width * 0.2}" cy="${height * 0.15}" r="2" fill="#ffffff" opacity="0.5" />
  <circle cx="${width * 0.4}" cy="${height * 0.3}" r="2.5" fill="#ffffff" opacity="0.6" />
</svg>
  `.trim();

  const base64 = Buffer.from(svg).toString('base64');
  return {
    imageBase64: `data:image/svg+xml;base64,${base64}`,
    mimeType: 'image/svg+xml',
  };
}
