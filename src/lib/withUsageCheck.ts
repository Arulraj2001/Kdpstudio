/**
 * API Route & Express Usage Check Middleware
 */

import { checkAndIncrementUsage, UsageCheckResult } from './usageService';
import { adminAuth } from './firebase-admin';
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

      let uid = 'demo-user-123';
      let email = 'author@kdpstudio.com';

      if (token) {
        try {
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded && decoded.uid) {
            uid = decoded.uid;
            email = decoded.email || email;
          }
        } catch (authErr) {
          // In development or demo mode, parse or allow preview uid
          if (req.headers['x-user-id']) {
            uid = String(req.headers['x-user-id']);
          }
        }
      } else if (req.headers['x-user-id']) {
        uid = String(req.headers['x-user-id']);
      }

      // 2. Fetch user plan
      let plan = 'free';
      try {
        const doc = await getUserDocument(uid);
        if (doc?.plan) {
          plan = doc.plan;
        }
      } catch (docErr) {
        // fail open with free plan limits
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
      // Fail open to avoid blocking legitimate users during transient issues
      next();
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
      const authHeader = req.headers.get('authorization') || '';
      let token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      let uid = req.headers.get('x-user-id') || 'demo-user-123';
      let email = 'author@kdpstudio.com';

      if (token) {
        try {
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded?.uid) {
            uid = decoded.uid;
            email = decoded.email || email;
          }
        } catch {
          // ignore
        }
      }

      let plan = 'free';
      try {
        const doc = await getUserDocument(uid);
        if (doc?.plan) plan = doc.plan;
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
