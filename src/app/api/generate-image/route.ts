/**
 * KDP Studio — AI Cover Image Generation Route
 *
 * Cascade: Imagen 3 → Hugging Face FLUX.1-schnell → Cloudflare FLUX.1-schnell → error
 * Configure via .env.local:
 *   GEMINI_API_KEY   → Imagen 3 (billing required)
 *   HF_API_KEY       → Hugging Face free tier
 *   CF_API_TOKEN     → Cloudflare Workers AI free tier
 *   CF_ACCOUNT_ID    → Cloudflare Account ID
 */

import { withUsageCheck } from '../../../lib/withUsageCheck';
import { generateImageWithFallback } from '../../../lib/imageGeneration';

export const POST = withUsageCheck('imageGenerations', async (req) => {
  let body: { prompt?: string; aspectRatio?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    prompt = 'Professional book cover, dramatic lighting, vivid colors, high quality',
    aspectRatio = '2:3',
  } = body;

  const result = await generateImageWithFallback(prompt, aspectRatio);

  if (result.fallback) {
    return new Response(
      JSON.stringify({
        success: false,
        fallback: true,
        message: result.message,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      imageUrl: result.imageUrl,
      source: result.source,
      aspectRatio,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
