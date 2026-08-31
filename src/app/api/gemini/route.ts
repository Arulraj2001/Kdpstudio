/**
 * KDP Studio — Gemini AI API Route
 * Handles text generation, SSE streaming, and title idea generation
 * for all studio writing features.
 *
 * Actions:
 *   generate     → Standard text response  (callGemini / AI Continue / Audit)
 *   stream       → SSE streaming response  (streamGemini / AI Write Chapter)
 *   title_ideas  → Parsed title list       (generateTitleIdeas / New Book Form)
 */

import { GoogleGenAI } from '@google/genai';
import { withUsageCheck } from '../../../lib/withUsageCheck';

const MODEL = 'gemini-3.6-flash';

/** Parse "1. Title: Subtitle" lines from Gemini numbered-list response */
function parseTitleIdeas(text: string): Array<{ title: string; subtitle: string }> {
  const lines = text.split('\n').filter(Boolean);
  const results: Array<{ title: string; subtitle: string }> = [];
  for (const line of lines) {
    // Match: "1. Some Title: Some Subtitle"
    const match = line.match(/^\d+\.\s+(.+?):\s+(.+)$/);
    if (match) {
      results.push({ title: match[1].trim(), subtitle: match[2].trim() });
    }
  }
  return results;
}

export const POST = withUsageCheck('aiGenerations', async (req) => {
  // ── API Key guard ──────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('REPLACE') || apiKey === 'MY_GEMINI_API_KEY') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'AI service is not configured. Add a valid GEMINI_API_KEY to your environment.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { action?: string; prompt?: string; systemInstruction?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { action = 'generate', prompt = '', systemInstruction } = body;
  const ai = new GoogleGenAI({ apiKey });

  // ── Action: stream (SSE) ───────────────────────────────────────────────
  // Used by streamGemini() → AiWriteModal (AI Write Chapter)
  if (action === 'stream') {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const responseStream = await ai.models.generateContentStream({
            model: MODEL,
            contents: prompt,
            config: {
              systemInstruction: systemInstruction || undefined,
              temperature: 0.85,
            },
          });

          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              send({ text });
            }
          }

          send({ done: true });
        } catch (err: any) {
          console.error('[/api/gemini] stream error:', err);
          send({ error: err.message || 'Stream generation failed' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  // ── Action: title_ideas ────────────────────────────────────────────────
  // Used by generateTitleIdeas() → NewBookForm (AI title suggestions)
  if (action === 'title_ideas') {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { temperature: 0.9 },
      });
      const text = response.text || '';
      const titles = parseTitleIdeas(text);

      if (titles.length > 0) {
        return new Response(JSON.stringify({ success: true, titles }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Titles parsed as 0 — return empty so client fallback triggers
      console.warn('[/api/gemini] title_ideas: could not parse titles from:\n', text);
      return new Response(JSON.stringify({ success: false, titles: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      console.error('[/api/gemini] title_ideas error:', err);
      return new Response(JSON.stringify({ success: false, titles: [], error: err.message }), {
        status: 200, // Return 200 so client fallback fires rather than throwing
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ── Action: generate (default) ─────────────────────────────────────────
  // Used by callGemini() → AI Continue Writing, AI Audit, improveText, ChapterStudio
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || undefined,
        temperature: 0.75,
      },
    });
    const text = response.text || '';
    return new Response(JSON.stringify({ success: true, text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[/api/gemini] generate error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Generation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
