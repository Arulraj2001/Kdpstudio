import { withUsageCheck } from '../../../lib/withUsageCheck';

export const POST = withUsageCheck('pdfExports', async (req, { user }) => {
  try {
    const body = await req.json();
    return new Response(
      JSON.stringify({
        success: true,
        message: 'PDF export initialized',
        user: user.uid,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'PDF export error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
