import { adminAuth, getAdminDb } from '../../../../lib/firebase-admin';

/**
 * User Email Preferences API Route
 * PUT: Updates email notification opt-in/opt-out settings
 * GET: Retrieves current email preferences
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    let uid = request.headers.get('x-user-id') || '';

    if (token) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch (e) {}
    }

    if (!uid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const adminDb = getAdminDb();
    let preferences = {
      weeklyDigest: true,
      usageWarnings: true,
      marketing: true,
      billing: true,
      security: true,
    };

    if (adminDb && uid !== 'demo-user-123') {
      const snap = await adminDb.collection('users').doc(uid).get();
      if (snap.exists) {
        const data = snap.data();
        if (data?.settings?.emailPreferences) {
          preferences = {
            ...preferences,
            ...data.settings.emailPreferences,
            billing: true,
            security: true,
          };
        }
      }
    }

    return new Response(JSON.stringify({ success: true, preferences }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch preferences' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    let uid = request.headers.get('x-user-id') || '';

    if (token) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch (e) {}
    }

    const body = await request.json().catch(() => ({}));
    if (!uid && body.uid) {
      uid = body.uid;
    }

    if (!uid) {
      return new Response(JSON.stringify({ error: 'Unauthorized: User identifier required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { weeklyDigest = true, usageWarnings = true, marketing = true } = body;

    const emailPreferences = {
      weeklyDigest: Boolean(weeklyDigest),
      usageWarnings: Boolean(usageWarnings),
      marketing: Boolean(marketing),
      billing: true,
      security: true,
    };

    const adminDb = getAdminDb();
    if (adminDb && uid !== 'demo-user-123') {
      await adminDb.collection('users').doc(uid).set(
        {
          settings: {
            emailPreferences,
            weeklyDigest: Boolean(weeklyDigest),
          },
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return new Response(JSON.stringify({ success: true, emailPreferences }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API email-preferences PUT] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to update preferences' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
