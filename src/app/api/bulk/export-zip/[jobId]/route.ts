/**
 * KDP Studio — Bulk ZIP Export API Route
 * Phase 14A
 */

import { exportZipHandler } from '../../../../../lib/bulk/zipService';

export async function POST(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    const uid = req.headers.get('x-user-id') || 'demo-user-123';
    const result = await exportZipHandler(jobId, { uid });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in /api/bulk/export-zip:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to generate ZIP' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
