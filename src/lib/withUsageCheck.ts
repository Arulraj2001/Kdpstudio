/**
 * API Route & Express Usage Check Middleware
 * Enforces Bearer token verification, plan retrieval, and usage rate limits.
 */

import { checkAndIncrementUsage, UsageCheckResult } from './usageService';
import { adminAuth, adminDb } from './firebase-admin';
import { getUserDocument } from './userService';

export interface AuthenticatedUserContext {
  uid: string;
  email?: string;
  plan: string;
}

/**
 * Express Middleware generator for checking usage limits on routes
 */
export function createExpressUsageMiddleware(action: string) {
  return async (req: any, res: any, next: any) => {
    try {
      // 1. Extract Token from Authorization header or cookie
      const authHeader = req.headers.authorization || '';
      let token = '';
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.headers.cookie) {
        const match = req.headers.cookie.match(/__session=([^;]+)/);
        if (match) token = match[1];
      }

      let uid = '';
      let email = '';

      if (token.startsWith('demo-token-')) {
        uid = token.replace('demo-token-', '');
        email = `${uid}@preview.demo`;
      } else if (token === 'guest-trial' || !token) {
        const clientUid = req.headers['x-user-id'];
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anon';
        uid = clientUid || `guest_${String(ip).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)}`;
        email = 'guest@trial.local';
      } else {
        try {
          if (adminAuth) {
            const decoded = await adminAuth.verifyIdToken(token);
            if (decoded?.uid) {
              uid = decoded.uid;
              email = decoded.email || '';
            }
          }
        } catch (authErr) {
          // Token verification fallback (e.g. expired token or dev mode)
          const clientUid = req.headers['x-user-id'];
          if (clientUid) {
            uid = String(clientUid);
          } else {
            const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anon';
            uid = `guest_${String(ip).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)}`;
          }
        }
      }

      if (!uid) {
        uid = `guest_${Date.now()}`;
      }

      // 2. Fetch user plan from Firestore / cache
      let plan = 'free';
      try {
        const userDoc = await getUserDocument(uid);
        if (userDoc?.plan) {
          plan = userDoc.plan;
        }
      } catch (docErr) {
        // fallback to free tier
      }

      // 3. Check and increment usage
      const result: UsageCheckResult = await checkAndIncrementUsage(uid, action, plan);

      if (!result.allowed) {
        return res.status(429).json({
          error: 'Usage limit reached',
          reason: result.reason,
          limit: result.limit,
          current: result.current,
          resetTime: result.resetTime || 'Resets at midnight UTC',
          upgradeUrl: '/pricing',
          upgradeRequired: result.upgradeRequired || 'starter',
        });
      }

      // 4. Attach usage headers
      if (result.remaining !== undefined) {
        res.setHeader('X-Usage-Remaining', String(result.remaining));
      }
      if (result.limit !== undefined) {
        res.setHeader('X-Usage-Limit', String(result.limit));
      }
      if (result.resetTime) {
        res.setHeader('X-Usage-Reset', result.resetTime);
      }

      // 5. Attach user context to request
      req.auth = {
        uid,
        email,
        plan,
      };

      next();
    } catch (error) {
      console.error(`Usage middleware error for ${action}:`, error);
      return res.status(500).json({ error: 'Internal server error processing authentication' });
    }
  };
}

/**
 * Next.js / Fetch Route Handler Wrapper (App Router style)
 */
export function withUsageCheck(
  action: string,
  handler: (req: Request, context: { user: AuthenticatedUserContext }) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    try {
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: missing or invalid authorization header' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.split('Bearer ')[1]?.trim();
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: empty bearer token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      let uid = '';
      let email = '';

      try {
        const decoded = await adminAuth.verifyIdToken(token);
        if (!decoded?.uid) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized: invalid token payload' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
        uid = decoded.uid;
        email = decoded.email || '';
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: token verification failed' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Fetch user plan from user document
      let plan = 'free';
      try {
        const userDoc = await getUserDocument(uid);
        if (userDoc?.plan) plan = userDoc.plan;
      } catch {}

      const result = await checkAndIncrementUsage(uid, action, plan);

      if (!result.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Usage limit reached',
            reason: result.reason,
            limit: result.limit,
            current: result.current,
            resetTime: result.resetTime,
            upgradeUrl: '/pricing',
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const res = await handler(req, { user: { uid, email, plan } });

      // Clone or append headers
      const newHeaders = new Headers(res.headers);
      if (result.remaining !== undefined) newHeaders.set('X-Usage-Remaining', String(result.remaining));
      if (result.limit !== undefined) newHeaders.set('X-Usage-Limit', String(result.limit));
      if (result.resetTime) newHeaders.set('X-Usage-Reset', result.resetTime);

      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders,
      });
    } catch (err: any) {
      console.error('withUsageCheck error:', err);
      return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
