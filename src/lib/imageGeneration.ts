/**
 * KDP Studio — Unified Image Generation with Fallback Chain
 *
 * Priority cascade:
 *   1. Imagen 3      (best quality — requires billing-enabled Gemini key)
 *   2. Hugging Face  (FLUX.1-schnell — free, requires HF_API_KEY)
 *   3. Cloudflare    (FLUX.1-schnell — free, requires CF_API_TOKEN + CF_ACCOUNT_ID)
 *   4. SVG fallback  (always works — local vector art)
 *
 * Add to .env.local:
 *   HF_API_KEY       → Hugging Face token (https://huggingface.co/settings/tokens)
 *   CF_API_TOKEN     → Cloudflare API token with AI:Run permission
 *   CF_ACCOUNT_ID    → Cloudflare Account ID (from dashboard URL)
 */

import { GoogleGenAI } from '@google/genai';

export type ImageSource = 'imagen' | 'huggingface' | 'cloudflare' | 'svg-fallback';

export interface ImageGenerationResult {
  imageUrl: string;        // data:image/png;base64,... or empty string for svg-fallback
  source: ImageSource;
  fallback: boolean;       // true only when no configured provider succeeded
  message?: string;        // user-facing info when fallback is used
}

// ── Aspect ratio → pixel size (FLUX.1-schnell sweet spots) ────────────────────
const ASPECT_SIZE_MAP: Record<string, { width: number; height: number }> = {
  '1:1':  { width: 512,  height: 512 },
  '2:3':  { width: 512,  height: 768 },
  '3:2':  { width: 768,  height: 512 },
  '3:4':  { width: 576,  height: 768 },
  '4:3':  { width: 768,  height: 576 },
  '9:16': { width: 576,  height: 1024 },
  '16:9': { width: 1024, height: 576 },
};

function getSize(ratio: string) {
  return ASPECT_SIZE_MAP[ratio] || { width: 512, height: 768 };
}

function bufferToDataUrl(buffer: ArrayBuffer, contentType: string): string {
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${contentType};base64,${base64}`;
}

// ── Provider 1: Google Imagen 3 ───────────────────────────────────────────────
async function tryImagen(prompt: string, aspectRatio: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('REPLACE') || apiKey === 'MY_GEMINI_API_KEY') return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio as '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9',
        outputMimeType: 'image/png',
      },
    });

    const bytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (bytes) {
      return `data:image/png;base64,${bytes}`;
    }
    return null;
  } catch (err: any) {
    // Only warn on non-billing errors (billing 403 is expected on free tier)
    const isBillingError =
      err?.status === 403 ||
      err?.message?.includes('PERMISSION_DENIED') ||
      err?.message?.includes('billing');
    if (!isBillingError) {
      console.warn('[ImageGen] Imagen error:', err.message);
    }
    return null;
  }
}

// ── Provider 2: Hugging Face FLUX.1-schnell ────────────────────────────────────
async function tryHuggingFace(prompt: string, aspectRatio: string): Promise<string | null> {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) return null;

  const { width, height } = getSize(aspectRatio);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50_000); // 50s timeout for cold start

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width, height, num_inference_steps: 4 },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (response.status === 503) {
      // Model loading — don't warn, just fall through
      return null;
    }

    if (!response.ok) {
      console.warn('[ImageGen] Hugging Face error:', response.status, await response.text());
      return null;
    }

    const buffer = await response.arrayBuffer();
    const ct = response.headers.get('content-type') || 'image/jpeg';
    return bufferToDataUrl(buffer, ct);
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name !== 'AbortError') {
      console.warn('[ImageGen] Hugging Face request failed:', err.message);
    }
    return null;
  }
}

// ── Provider 3: Cloudflare Workers AI FLUX.1-schnell ──────────────────────────
async function tryCloudflare(prompt: string, aspectRatio: string): Promise<string | null> {
  const apiToken = process.env.CF_API_TOKEN;
  const accountId = process.env.CF_ACCOUNT_ID;
  if (!apiToken || !accountId) return null;

  const { width, height } = getSize(aspectRatio);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // 30s timeout

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, steps: 4 }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn('[ImageGen] Cloudflare error:', response.status, await response.text());
      return null;
    }

    const ct = response.headers.get('content-type') || '';

    // Cloudflare wraps image in JSON: { result: { image: "<base64>" }, success: true }
    if (ct.includes('application/json')) {
      const json = await response.json() as any;
      const b64 = json?.result?.image;
      if (b64) return `data:image/jpeg;base64,${b64}`;
      console.warn('[ImageGen] Cloudflare: unexpected JSON shape', JSON.stringify(json).slice(0, 200));
      return null;
    }

    // Fallback: raw binary response
    const buffer = await response.arrayBuffer();
    return bufferToDataUrl(buffer, ct || 'image/png');
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name !== 'AbortError') {
      console.warn('[ImageGen] Cloudflare request failed:', err.message);
    }
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────
export async function generateImageWithFallback(
  prompt: string,
  aspectRatio: string = '16:9'
): Promise<ImageGenerationResult> {
  // 1. Cloudflare Workers AI FLUX.1-schnell — fast (~8s), verified & 10k free daily neurons
  const cfUrl = await tryCloudflare(prompt, aspectRatio);
  if (cfUrl) {
    return { imageUrl: cfUrl, source: 'cloudflare', fallback: false };
  }

  // 2. Google Imagen 3 (with 12s safety timeout race to prevent SDK hanging on free keys)
  try {
    const imagenPromise = tryImagen(prompt, aspectRatio);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000));
    const imagenUrl = await Promise.race([imagenPromise, timeoutPromise]);
    if (imagenUrl) {
      return { imageUrl: imagenUrl, source: 'imagen', fallback: false };
    }
  } catch {}

  // 3. Hugging Face fallback
  const hfUrl = await tryHuggingFace(prompt, aspectRatio);
  if (hfUrl) {
    return { imageUrl: hfUrl, source: 'huggingface', fallback: false };
  }

  // 4. No provider succeeded — caller handles SVG fallback
  return {
    imageUrl: '',
    source: 'svg-fallback',
    fallback: true,
    message:
      'AI image generation is not configured. ' +
      'Add HF_API_KEY (Hugging Face) or CF_API_TOKEN + CF_ACCOUNT_ID (Cloudflare) to enable free image generation.',
  };
}
