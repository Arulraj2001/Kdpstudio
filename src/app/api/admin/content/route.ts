/**
 * API Route: /api/admin/content
 * GET: returns flagged content items for review
 * POST: records admin verdict (false positive, minor concern, policy violation, serious ban)
 */

import { adminAuth } from '../../../../lib/firebase-admin';
import { getFlaggedContent, reviewFlaggedContent } from '../../../../lib/adminService';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'arulraj8637@gmail.com';

async function verifyAdmin(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email || '';
    if (!ADMIN_EMAIL || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return email;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const adminEmail = await verifyAdmin(request);
  if (!adminEmail) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const reviewedParam = url.searchParams.get('reviewed');
    const reviewed = reviewedParam !== null ? reviewedParam === 'true' : undefined;

    const items = await getFlaggedContent(reviewed);
    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: Request) {
  const adminEmail = await verifyAdmin(request);
  if (!adminEmail) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { flagId, verdict, noteToUser } = await request.json();
    if (!flagId || !verdict) {
      return new Response(
        JSON.stringify({ error: 'flagId and verdict are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await reviewFlaggedContent(flagId, verdict, noteToUser || '', adminEmail);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
