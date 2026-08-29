/**
 * KDP Studio — Public Royalty Calculator API
 * Phase 15A
 * No authentication required
 */

import { calculateFullRoyalty } from '../../../../lib/royaltyCalculator';
import { MarketPlace, RoyaltyType } from '../../../../types/analytics';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      royaltyType = 'paperback',
      listPrice = 9.99,
      marketplace = 'amazon-us',
      royaltyPlan = '70',
      pageCount = 100,
      isColorInterior = false,
      fileSizeMB,
    } = body || {};

    const calculation = calculateFullRoyalty({
      royaltyType: royaltyType as RoyaltyType,
      listPrice: Number(listPrice) || 9.99,
      marketplace: marketplace as MarketPlace,
      royaltyPlan: (royaltyPlan === '35' ? '35' : '70') as '35' | '70',
      pageCount: Number(pageCount) || 100,
      isColorInterior: Boolean(isColorInterior),
      fileSizeMB: fileSizeMB ? Number(fileSizeMB) : undefined,
    });

    return new Response(
      JSON.stringify({
        success: true,
        calculation,
        disclaimer: 'Estimates only. Actual KDP royalties may vary based on printing specifications, distribution channels, and delivery fees.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Calculate royalty API error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Failed to calculate royalty' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
