/**
 * Public API Route: /api/config/pricing
 * Returns active pricing overrides and dynamic pricing table.
 * Fully public with caching and Firestore Admin SDK fallback.
 */

import { getAdminDb } from '../../../../lib/firebase-admin';
import { PRICING_TABLE, computeDynamicPricingTable } from '../../../../lib/geo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let pricingData = null;
    const db = getAdminDb();
    if (db) {
      const snap = await db.collection('appConfig').doc('pricing').get();
      if (snap.exists) {
        pricingData = snap.data();
      }
    }

    const dynamicTable = computeDynamicPricingTable(pricingData as any);

    return new Response(
      JSON.stringify({
        success: true,
        pricing: pricingData,
        pricingTable: dynamicTable,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('[Public Pricing API] Error:', error);
    return new Response(
      JSON.stringify({
        success: true,
        pricing: null,
        pricingTable: computeDynamicPricingTable(null),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
