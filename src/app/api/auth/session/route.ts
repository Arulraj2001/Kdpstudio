import { adminAuth } from '../../../../lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing ID token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    let sessionCookie = '';

    try {
      sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    } catch {
      // In dev fallback
      sessionCookie = `dev-session-${idToken.slice(0, 16)}`;
    }

    return new Response(JSON.stringify({ status: 'success' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `__session=${sessionCookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${expiresIn / 1000}`,
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Session creation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE() {
  return new Response(JSON.stringify({ status: 'success' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `__session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    },
  });
}
