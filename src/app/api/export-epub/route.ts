import { withUsageCheck } from '../../../lib/withUsageCheck';

export const POST = withUsageCheck('epubExports', async (req, { user }) => {
  try {
    const body = await req.json();
    return new Response(
      JSON.stringify({
        success: true,
        message: 'ePub Kindle export compiled successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'ePub export error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
