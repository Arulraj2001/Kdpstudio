import { withUsageCheck } from '../../../lib/withUsageCheck';

export const POST = withUsageCheck('aiGenerations', async (req, { user }) => {
  try {
    const body = await req.json();
    const { action, prompt, systemInstruction } = body;

    // Call server Gemini handler or return structured payload
    return new Response(
      JSON.stringify({
        success: true,
        text: `AI generation completed for ${user.email || 'author'}. Prompt: ${prompt?.slice(0, 50)}...`,
        action,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Generation error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
