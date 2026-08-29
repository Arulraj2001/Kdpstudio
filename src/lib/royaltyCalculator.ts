/**
 * KDP Studio — Royalty Calculator Engine
 * Phase 15A
 * Pure functions — no API calls, no Firestore
 */

import { MarketPlace, RoyaltyType, RoyaltyProjection, RoyaltyCalculation } from '../types/analytics';

export const DELIVERY_COST_PER_MB = 0.15; // USD per MB for Kindle eBooks

export const MARKETPLACE_ROYALTY_RATES: Record<MarketPlace, { rate35: number; rate70: number; currency: string }> = {
  'amazon-us': { rate35: 0.35, rate70: 0.70, currency: 'USD' },
  'amazon-uk': { rate35: 0.35, rate70: 0.70, currency: 'GBP' },
  'amazon-ca': { rate35: 0.35, rate70: 0.70, currency: 'CAD' },
  'amazon-au': { rate35: 0.35, rate70: 0.70, currency: 'AUD' },
  'amazon-in': { rate35: 0.35, rate70: 0.70, currency: 'INR' },
  'amazon-de': { rate35: 0.35, rate70: 0.70, currency: 'EUR' },
  'amazon-fr': { rate35: 0.35, rate70: 0.70, currency: 'EUR' },
  'amazon-es': { rate35: 0.35, rate70: 0.70, currency: 'EUR' },
  'amazon-it': { rate35: 0.35, rate70: 0.70, currency: 'EUR' },
  'amazon-jp': { rate35: 0.35, rate70: 0.70, currency: 'JPY' },
  'amazon-br': { rate35: 0.35, rate70: 0.70, currency: 'BRL' },
  'amazon-mx': { rate35: 0.35, rate70: 0.70, currency: 'MXN' },
};

export const PAPERBACK_PRINTING_COSTS: Record<MarketPlace, { blackAndWhite: number; color: number }> = {
  'amazon-us': { blackAndWhite: 0.012, color: 0.07 },
  'amazon-uk': { blackAndWhite: 0.010, color: 0.065 },
  'amazon-ca': { blackAndWhite: 0.013, color: 0.075 },
  'amazon-au': { blackAndWhite: 0.013, color: 0.075 },
  'amazon-in': { blackAndWhite: 0.009, color: 0.065 },
  'amazon-de': { blackAndWhite: 0.012, color: 0.07 },
  'amazon-fr': { blackAndWhite: 0.012, color: 0.07 },
  'amazon-es': { blackAndWhite: 0.012, color: 0.07 },
  'amazon-it': { blackAndWhite: 0.012, color: 0.07 },
  'amazon-jp': { blackAndWhite: 0.012, color: 0.07 },
  'amazon-br': { blackAndWhite: 0.012, color: 0.07 },
  'amazon-mx': { blackAndWhite: 0.012, color: 0.07 },
};

export const FIXED_PRINTING_COST: Record<MarketPlace, number> = {
  'amazon-us': 0.85,
  'amazon-uk': 0.85,
  'amazon-ca': 0.85,
  'amazon-au': 0.85,
  'amazon-in': 0.85,
  'amazon-de': 0.85,
  'amazon-fr': 0.85,
  'amazon-es': 0.85,
  'amazon-it': 0.85,
  'amazon-jp': 0.85,
  'amazon-br': 0.85,
  'amazon-mx': 0.85,
};

/**
 * Calculates eBook royalty breakdown
 */
export function calculateEbookRoyalty(
  listPrice: number,
  royaltyPlan: '35' | '70',
  marketplace: MarketPlace = 'amazon-us',
  fileSizeMB: number = 1.5
): {
  royaltyPerSale: number;
  deliveryCost: number;
  netRoyalty: number;
  isEligibleFor70: boolean;
  royaltyPercentage: number;
  minimumPrice: number;
} {
  const isEligibleFor70 = listPrice >= 2.99 && listPrice <= 9.99;
  let deliveryCost = 0;
  let netRoyalty = 0;
  let royaltyPercentage = 35;

  if (royaltyPlan === '70') {
    deliveryCost = Number((fileSizeMB * DELIVERY_COST_PER_MB).toFixed(2));
    const grossRoyalty = listPrice * 0.70;
    netRoyalty = Math.max(0, Number((grossRoyalty - deliveryCost).toFixed(2)));
    royaltyPercentage = 70;
  } else {
    deliveryCost = 0;
    netRoyalty = Math.max(0, Number((listPrice * 0.35).toFixed(2)));
    royaltyPercentage = 35;
  }

  return {
    royaltyPerSale: netRoyalty,
    deliveryCost,
    netRoyalty,
    isEligibleFor70,
    royaltyPercentage,
    minimumPrice: royaltyPlan === '70' ? 2.99 : 0.99,
  };
}

/**
 * Calculates Paperback/Hardcover royalty breakdown
 */
export function calculatePaperbackRoyalty(
  listPrice: number,
  pageCount: number,
  marketplace: MarketPlace = 'amazon-us',
  isColorInterior: boolean = false,
  isHardcover: boolean = false
): {
  printingCost: number;
  royaltyPerSale: number;
  minimumPrice: number;
  profitMargin: number;
  royaltyPercentage: number;
} {
  const fixedCost = (FIXED_PRINTING_COST[marketplace] || 0.85) + (isHardcover ? 5.50 : 0);
  const costs = PAPERBACK_PRINTING_COSTS[marketplace] || PAPERBACK_PRINTING_COSTS['amazon-us'];
  const perPageCost = isColorInterior ? costs.color : costs.blackAndWhite;

  const printingCost = Number((fixedCost + pageCount * perPageCost).toFixed(2));
  const standardRoyaltyRate = 0.60; // 60% standard KDP paperback rate

  const grossRoyalty = listPrice * standardRoyaltyRate;
  const royaltyPerSale = Math.max(0, Number((grossRoyalty - printingCost).toFixed(2)));
  const minimumPrice = Number((printingCost / standardRoyaltyRate + 0.01).toFixed(2));
  const profitMargin = listPrice > 0 ? Number(((royaltyPerSale / listPrice) * 100).toFixed(1)) : 0;

  return {
    printingCost,
    royaltyPerSale,
    minimumPrice,
    profitMargin,
    royaltyPercentage: 60,
  };
}

/**
 * Generates monthly and yearly projections at various sales volume tiers
 */
export function generateRoyaltyProjections(
  royaltyPerSale: number,
  unitScenarios: number[] = [10, 50, 100, 500, 1000]
): RoyaltyProjection[] {
  return unitScenarios.map((units) => {
    const monthly = Number((units * royaltyPerSale).toFixed(2));
    const yearly = Number((monthly * 12).toFixed(2));
    return {
      unitsSold: units,
      monthlyRoyalty: monthly,
      yearlyRoyalty: yearly,
    };
  });
}

/**
 * Estimates file size in MB for eBook delivery fee calculation
 */
export function estimateFileSizeMB(pageCount: number): number {
  return Number(Math.max(0.5, pageCount / 100).toFixed(2));
}

/**
 * Calculates complete royalty breakdown object for both eBook & Print
 */
export function calculateFullRoyalty(params: {
  listPrice: number;
  marketplace: MarketPlace;
  royaltyType: RoyaltyType;
  royaltyPlan: '35' | '70';
  pageCount: number;
  isColorInterior?: boolean;
  fileSizeMB?: number;
}): RoyaltyCalculation {
  const {
    listPrice,
    marketplace,
    royaltyType,
    royaltyPlan,
    pageCount,
    isColorInterior = false,
    fileSizeMB = estimateFileSizeMB(pageCount || 100),
  } = params;

  if (royaltyType === 'ebook') {
    const eb = calculateEbookRoyalty(listPrice, royaltyPlan, marketplace, fileSizeMB);
    const projections = generateRoyaltyProjections(eb.royaltyPerSale);

    return {
      listPrice,
      marketplace,
      royaltyType,
      royaltyPlan,
      pageCount,
      fileSizeMB,
      deliveryCost: eb.deliveryCost,
      royaltyPerSale: eb.royaltyPerSale,
      royaltyPercentage: eb.royaltyPercentage,
      minimumPrice: eb.minimumPrice,
      projections,
    };
  }

  const pb = calculatePaperbackRoyalty(listPrice, pageCount, marketplace, isColorInterior, royaltyType === 'hardcover');
  const projections = generateRoyaltyProjections(pb.royaltyPerSale);

  return {
    listPrice,
    marketplace,
    royaltyType,
    royaltyPlan,
    pageCount,
    fileSizeMB: 0,
    deliveryCost: 0,
    printingCost: pb.printingCost,
    royaltyPerSale: pb.royaltyPerSale,
    royaltyPercentage: pb.royaltyPercentage,
    minimumPrice: pb.minimumPrice,
    profitMargin: pb.profitMargin,
    projections,
  };
}

/**
 * Rough BSR conversion table to estimated monthly sales volume
 */
export function bsrToEstimatedMonthlySales(
  bsr: number | null,
  category: string = 'General'
): { range: string; min: number; max: number; note: string } {
  if (!bsr || bsr <= 0) {
    return {
      range: 'No rank data available',
      min: 0,
      max: 0,
      note: 'Estimates only — actual sales vary widely.',
    };
  }

  let range = '0–5 units/month';
  let min = 0;
  let max = 5;

  if (bsr <= 100) {
    range = '10,000–50,000 units/month';
    min = 10000;
    max = 50000;
  } else if (bsr <= 1000) {
    range = '1,000–10,000 units/month';
    min = 1000;
    max = 10000;
  } else if (bsr <= 5000) {
    range = '300–1,000 units/month';
    min = 300;
    max = 1000;
  } else if (bsr <= 20000) {
    range = '100–300 units/month';
    min = 100;
    max = 300;
  } else if (bsr <= 100000) {
    range = '20–100 units/month';
    min = 20;
    max = 100;
  } else if (bsr <= 500000) {
    range = '5–20 units/month';
    min = 5;
    max = 20;
  } else {
    range = '0–5 units/month';
    min = 0;
    max = 5;
  }

  return {
    range,
    min,
    max,
    note: 'Estimates only — actual Amazon KDP sales vary widely by category and price.',
  };
}
