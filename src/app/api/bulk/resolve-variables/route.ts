/**
 * KDP Studio — Bulk Variables AI Resolver API
 * Phase 14A
 */

import { GoogleGenAI } from '@google/genai';
import { withUsageCheck, AuthenticatedUserContext } from '../../../../lib/withUsageCheck';
import { BulkVariable } from '../../../../types/bulk';

export async function resolveVariablesHandler(
  body: { variables: BulkVariable[] },
  userContext?: { uid: string; email?: string }
) {
  const variables = body.variables || [];
  if (!variables.length) {
    return { variables: [] };
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  const updatedVariables: BulkVariable[] = [];

  for (const v of variables) {
    if (v.type === 'ai-generate') {
      const count = Math.min(20, Math.max(2, v.aiCount || 10));
      const prompt = v.aiPrompt || `Generate ${count} popular high-converting subtopics for ${v.name}`;

      let generated: string[] = [];

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `You are an expert publishing editor. Generate ${count} unique, distinct values for the book variable "${v.name}" (${v.label}).
User Instructions: ${prompt}

CRITICAL RULES:
1. Return ONLY a valid JSON array of strings: ["Item 1", "Item 2", ...]
2. Provide exactly ${count} distinct items.
3. No duplicates, no numbering in the strings, no conversational text.`,
          });

          let text = response.text || '';
          text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            generated = parsed.map((item) => String(item).trim()).filter(Boolean);
          }
        } catch (err) {
          console.warn(`Failed to generate AI values for variable ${v.name}:`, err);
        }
      }

      // Fallback if AI generation failed or returned too few items
      if (!generated.length) {
        generated = Array.from({ length: count }, (_, idx) => `${v.name || 'Theme'} Variation ${idx + 1}`);
      }

      updatedVariables.push({
        ...v,
        generatedValues: generated,
      });
    } else {
      updatedVariables.push(v);
    }
  }

  return { variables: updatedVariables };
}

export const POST = withUsageCheck(
  'aiGenerations',
  async (req: Request, { user }: { user: AuthenticatedUserContext }) => {
    try {
      const body = await req.json();
      const result = await resolveVariablesHandler(body, user);
      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      console.error('Error in /api/bulk/resolve-variables:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message || 'Failed to resolve variables' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
);
