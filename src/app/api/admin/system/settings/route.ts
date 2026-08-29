/**
 * API Route: /api/admin/system/settings
 * GET: returns full app config (feature flags, maintenance, API status, pricing)
 * POST: updates feature flags, maintenance, or pricing overrides
 */

import { adminAuth } from '../../../../../lib/firebase-admin';
import {
  getAppConfig,
  updateFeatureFlags,
  updateMaintenanceConfig,
  updatePricingOverrides,
} from '../../../../../lib/adminService';

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
    const config = await getAppConfig();
    return new Response(JSON.stringify(config), {
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
    const body = await request.json();
    const { action, features, maintenance, pricing } = body;

    if (action === 'update_features' && features) {
      await updateFeatureFlags(features, adminEmail);
    } else if (action === 'update_maintenance' && maintenance) {
      await updateMaintenanceConfig(maintenance, adminEmail);
    } else if (action === 'update_pricing' && pricing) {
      await updatePricingOverrides(pricing, adminEmail);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action or payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updated = await getAppConfig();
    return new Response(JSON.stringify({ success: true, config: updated }), {
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
