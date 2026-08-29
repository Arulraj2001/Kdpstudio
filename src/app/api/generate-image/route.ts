import { withUsageCheck } from '../../../lib/withUsageCheck';

export const POST = withUsageCheck('imageGenerations', async (req, { user }) => {
  try {
    const body = await req.json();
    const { prompt, aspectRatio } = body;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Image generated successfully',
        aspectRatio: aspectRatio || '2:3',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Image generation error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
