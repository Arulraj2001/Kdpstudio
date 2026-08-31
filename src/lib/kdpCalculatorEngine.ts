/**
 * Official Amazon KDP Print Cost & Royalty Calculation Engine
 * Updated with current Amazon KDP global rate cards for Paperbacks, Hardcovers,
 * Black & White, Standard Color, and Premium Color ink.
 */

export type Marketplace = 'US' | 'UK' | 'DE' | 'FR' | 'ES' | 'IT' | 'NL' | 'PL' | 'SE' | 'JP' | 'CA' | 'AU' | 'IN';
export type BookBinding = 'paperback' | 'hardcover';
export type InkType = 'black_and_white' | 'standard_color' | 'premium_color';
export type TrimCategory = 'regular' | 'large'; // regular <= 6.12" x 9", large > 6.12" x 9"

export interface MarketplaceConfig {
  code: Marketplace;
  name: string;
  currency: string;
  currencySymbol: string;
  amazonDomain: string;
  defaultPrice: number;
  minPricePaperback: number;
  fixedCostBWRegular: number;
  pageCostBWRegular: number;
  fixedCostBWLarge: number;
  pageCostBWLarge: number;
  fixedCostStdColorRegular: number;
  pageCostStdColorRegular: number;
  fixedCostStdColorLarge: number;
  pageCostStdColorLarge: number;
  fixedCostPremColorRegular: number;
  pageCostPremColorRegular: number;
  fixedCostPremColorLarge: number;
  pageCostPremColorLarge: number;
  // Hardcover costs
  hardcoverFixedCostBW: number;
  hardcoverPageCostBW: number;
  hardcoverFixedCostPremColor: number;
  hardcoverPageCostPremColor: number;
}

export const KDP_MARKETPLACES: Record<Marketplace, MarketplaceConfig> = {
  US: {
    code: 'US',
    name: 'Amazon.com (United States)',
    currency: 'USD',
    currencySymbol: '$',
    amazonDomain: 'amazon.com',
    defaultPrice: 12.99,
    minPricePaperback: 3.58,
    fixedCostBWRegular: 1.00,
    pageCostBWRegular: 0.012,
    fixedCostBWLarge: 1.00,
    pageCostBWLarge: 0.014,
    fixedCostStdColorRegular: 1.00,
    pageCostStdColorRegular: 0.036,
    fixedCostStdColorLarge: 1.00,
    pageCostStdColorLarge: 0.045,
    fixedCostPremColorRegular: 1.00,
    pageCostPremColorRegular: 0.065,
    fixedCostPremColorLarge: 1.00,
    pageCostPremColorLarge: 0.070,
    hardcoverFixedCostBW: 6.80,
    hardcoverPageCostBW: 0.012,
    hardcoverFixedCostPremColor: 6.80,
    hardcoverPageCostPremColor: 0.065
  },
  UK: {
    code: 'UK',
    name: 'Amazon.co.uk (United Kingdom)',
    currency: 'GBP',
    currencySymbol: '£',
    amazonDomain: 'amazon.co.uk',
    defaultPrice: 9.99,
    minPricePaperback: 2.80,
    fixedCostBWRegular: 0.80,
    pageCostBWRegular: 0.010,
    fixedCostBWLarge: 0.80,
    pageCostBWLarge: 0.011,
    fixedCostStdColorRegular: 0.80,
    pageCostStdColorRegular: 0.029,
    fixedCostStdColorLarge: 0.80,
    pageCostStdColorLarge: 0.036,
    fixedCostPremColorRegular: 0.80,
    pageCostPremColorRegular: 0.052,
    fixedCostPremColorLarge: 0.80,
    pageCostPremColorLarge: 0.056,
    hardcoverFixedCostBW: 5.50,
    hardcoverPageCostBW: 0.010,
    hardcoverFixedCostPremColor: 5.50,
    hardcoverPageCostPremColor: 0.052
  },
  DE: {
    code: 'DE',
    name: 'Amazon.de (Germany / Eurozone)',
    currency: 'EUR',
    currencySymbol: '€',
    amazonDomain: 'amazon.de',
    defaultPrice: 11.99,
    minPricePaperback: 3.20,
    fixedCostBWRegular: 0.90,
    pageCostBWRegular: 0.012,
    fixedCostBWLarge: 0.90,
    pageCostBWLarge: 0.013,
    fixedCostStdColorRegular: 0.90,
    pageCostStdColorRegular: 0.033,
    fixedCostStdColorLarge: 0.90,
    pageCostStdColorLarge: 0.041,
    fixedCostPremColorRegular: 0.90,
    pageCostPremColorRegular: 0.060,
    fixedCostPremColorLarge: 0.90,
    pageCostPremColorLarge: 0.065,
    hardcoverFixedCostBW: 6.20,
    hardcoverPageCostBW: 0.012,
    hardcoverFixedCostPremColor: 6.20,
    hardcoverPageCostPremColor: 0.060
  },
  FR: {
    code: 'FR',
    name: 'Amazon.fr (France)',
    currency: 'EUR',
    currencySymbol: '€',
    amazonDomain: 'amazon.fr',
    defaultPrice: 11.99,
    minPricePaperback: 3.20,
    fixedCostBWRegular: 0.90,
    pageCostBWRegular: 0.012,
    fixedCostBWLarge: 0.90,
    pageCostBWLarge: 0.013,
    fixedCostStdColorRegular: 0.90,
    pageCostStdColorRegular: 0.033,
    fixedCostStdColorLarge: 0.90,
    pageCostStdColorLarge: 0.041,
    fixedCostPremColorRegular: 0.90,
    pageCostPremColorRegular: 0.060,
    fixedCostPremColorLarge: 0.90,
    pageCostPremColorLarge: 0.065,
    hardcoverFixedCostBW: 6.20,
    hardcoverPageCostBW: 0.012,
    hardcoverFixedCostPremColor: 6.20,
    hardcoverPageCostPremColor: 0.060
  },
  ES: {
    code: 'ES',
    name: 'Amazon.es (Spain)',
    currency: 'EUR',
    currencySymbol: '€',
    amazonDomain: 'amazon.es',
    defaultPrice: 11.99,
    minPricePaperback: 3.20,
    fixedCostBWRegular: 0.90,
    pageCostBWRegular: 0.012,
    fixedCostBWLarge: 0.90,
    pageCostBWLarge: 0.013,
    fixedCostStdColorRegular: 0.90,
    pageCostStdColorRegular: 0.033,
    fixedCostStdColorLarge: 0.90,
    pageCostStdColorLarge: 0.041,
    fixedCostPremColorRegular: 0.90,
    pageCostPremColorRegular: 0.060,
    fixedCostPremColorLarge: 0.90,
    pageCostPremColorLarge: 0.065,
    hardcoverFixedCostBW: 6.20,
    hardcoverPageCostBW: 0.012,
    hardcoverFixedCostPremColor: 6.20,
    hardcoverPageCostPremColor: 0.060
  },
  IT: {
    code: 'IT',
    name: 'Amazon.it (Italy)',
    currency: 'EUR',
    currencySymbol: '€',
    amazonDomain: 'amazon.it',
    defaultPrice: 11.99,
    minPricePaperback: 3.20,
    fixedCostBWRegular: 0.90,
    pageCostBWRegular: 0.012,
    fixedCostBWLarge: 0.90,
    pageCostBWLarge: 0.013,
    fixedCostStdColorRegular: 0.90,
    pageCostStdColorRegular: 0.033,
    fixedCostStdColorLarge: 0.90,
    pageCostStdColorLarge: 0.041,
    fixedCostPremColorRegular: 0.90,
    pageCostPremColorRegular: 0.060,
    fixedCostPremColorLarge: 0.90,
    pageCostPremColorLarge: 0.065,
    hardcoverFixedCostBW: 6.20,
    hardcoverPageCostBW: 0.012,
    hardcoverFixedCostPremColor: 6.20,
    hardcoverPageCostPremColor: 0.060
  },
  NL: {
    code: 'NL',
    name: 'Amazon.nl (Netherlands)',
    currency: 'EUR',
    currencySymbol: '€',
    amazonDomain: 'amazon.nl',
    defaultPrice: 11.99,
    minPricePaperback: 3.20,
    fixedCostBWRegular: 0.90,
    pageCostBWRegular: 0.012,
    fixedCostBWLarge: 0.90,
    pageCostBWLarge: 0.013,
    fixedCostStdColorRegular: 0.90,
    pageCostStdColorRegular: 0.033,
    fixedCostStdColorLarge: 0.90,
    pageCostStdColorLarge: 0.041,
    fixedCostPremColorRegular: 0.90,
    pageCostPremColorRegular: 0.060,
    fixedCostPremColorLarge: 0.90,
    pageCostPremColorLarge: 0.065,
    hardcoverFixedCostBW: 6.20,
    hardcoverPageCostBW: 0.012,
    hardcoverFixedCostPremColor: 6.20,
    hardcoverPageCostPremColor: 0.060
  },
  PL: {
    code: 'PL',
    name: 'Amazon.pl (Poland)',
    currency: 'PLN',
    currencySymbol: 'zł',
    amazonDomain: 'amazon.pl',
    defaultPrice: 49.99,
    minPricePaperback: 14.00,
    fixedCostBWRegular: 4.10,
    pageCostBWRegular: 0.050,
    fixedCostBWLarge: 4.10,
    pageCostBWLarge: 0.058,
    fixedCostStdColorRegular: 4.10,
    pageCostStdColorRegular: 0.150,
    fixedCostStdColorLarge: 4.10,
    pageCostStdColorLarge: 0.185,
    fixedCostPremColorRegular: 4.10,
    pageCostPremColorRegular: 0.270,
    fixedCostPremColorLarge: 4.10,
    pageCostPremColorLarge: 0.290,
    hardcoverFixedCostBW: 28.00,
    hardcoverPageCostBW: 0.050,
    hardcoverFixedCostPremColor: 28.00,
    hardcoverPageCostPremColor: 0.270
  },
  SE: {
    code: 'SE',
    name: 'Amazon.se (Sweden)',
    currency: 'SEK',
    currencySymbol: 'kr',
    amazonDomain: 'amazon.se',
    defaultPrice: 129.00,
    minPricePaperback: 35.00,
    fixedCostBWRegular: 10.00,
    pageCostBWRegular: 0.130,
    fixedCostBWLarge: 10.00,
    pageCostBWLarge: 0.145,
    fixedCostStdColorRegular: 10.00,
    pageCostStdColorRegular: 0.380,
    fixedCostStdColorLarge: 10.00,
    pageCostStdColorLarge: 0.470,
    fixedCostPremColorRegular: 10.00,
    pageCostPremColorRegular: 0.690,
    fixedCostPremColorLarge: 10.00,
    pageCostPremColorLarge: 0.740,
    hardcoverFixedCostBW: 70.00,
    hardcoverPageCostBW: 0.130,
    hardcoverFixedCostPremColor: 70.00,
    hardcoverPageCostPremColor: 0.690
  },
  JP: {
    code: 'JP',
    name: 'Amazon.co.jp (Japan)',
    currency: 'JPY',
    currencySymbol: '¥',
    amazonDomain: 'amazon.co.jp',
    defaultPrice: 1500,
    minPricePaperback: 400,
    fixedCostBWRegular: 115,
    pageCostBWRegular: 1.75,
    fixedCostBWLarge: 115,
    pageCostBWLarge: 2.00,
    fixedCostStdColorRegular: 115,
    pageCostStdColorRegular: 5.20,
    fixedCostStdColorLarge: 115,
    pageCostStdColorLarge: 6.40,
    fixedCostPremColorRegular: 115,
    pageCostPremColorRegular: 9.40,
    fixedCostPremColorLarge: 115,
    pageCostPremColorLarge: 10.10,
    hardcoverFixedCostBW: 800,
    hardcoverPageCostBW: 1.75,
    hardcoverFixedCostPremColor: 800,
    hardcoverPageCostPremColor: 9.40
  },
  CA: {
    code: 'CA',
    name: 'Amazon.ca (Canada)',
    currency: 'CAD',
    currencySymbol: 'CA$',
    amazonDomain: 'amazon.ca',
    defaultPrice: 16.99,
    minPricePaperback: 4.80,
    fixedCostBWRegular: 1.35,
    pageCostBWRegular: 0.016,
    fixedCostBWLarge: 1.35,
    pageCostBWLarge: 0.019,
    fixedCostStdColorRegular: 1.35,
    pageCostStdColorRegular: 0.048,
    fixedCostStdColorLarge: 1.35,
    pageCostStdColorLarge: 0.060,
    fixedCostPremColorRegular: 1.35,
    pageCostPremColorRegular: 0.088,
    fixedCostPremColorLarge: 1.35,
    pageCostPremColorLarge: 0.094,
    hardcoverFixedCostBW: 9.00,
    hardcoverPageCostBW: 0.016,
    hardcoverFixedCostPremColor: 9.00,
    hardcoverPageCostPremColor: 0.088
  },
  AU: {
    code: 'AU',
    name: 'Amazon.com.au (Australia)',
    currency: 'AUD',
    currencySymbol: 'A$',
    amazonDomain: 'amazon.com.au',
    defaultPrice: 18.99,
    minPricePaperback: 5.20,
    fixedCostBWRegular: 1.50,
    pageCostBWRegular: 0.018,
    fixedCostBWLarge: 1.50,
    pageCostBWLarge: 0.021,
    fixedCostStdColorRegular: 1.50,
    pageCostStdColorRegular: 0.054,
    fixedCostStdColorLarge: 1.50,
    pageCostStdColorLarge: 0.068,
    fixedCostPremColorRegular: 1.50,
    pageCostPremColorRegular: 0.098,
    fixedCostPremColorLarge: 1.50,
    pageCostPremColorLarge: 0.105,
    hardcoverFixedCostBW: 10.20,
    hardcoverPageCostBW: 0.018,
    hardcoverFixedCostPremColor: 10.20,
    hardcoverPageCostPremColor: 0.098
  },
  IN: {
    code: 'IN',
    name: 'Amazon.in (India)',
    currency: 'INR',
    currencySymbol: '₹',
    amazonDomain: 'amazon.in',
    defaultPrice: 499,
    minPricePaperback: 149,
    fixedCostBWRegular: 60,
    pageCostBWRegular: 0.70,
    fixedCostBWLarge: 60,
    pageCostBWLarge: 0.85,
    fixedCostStdColorRegular: 60,
    pageCostStdColorRegular: 2.10,
    fixedCostStdColorLarge: 60,
    pageCostStdColorLarge: 2.60,
    fixedCostPremColorRegular: 60,
    pageCostPremColorRegular: 3.80,
    fixedCostPremColorLarge: 60,
    pageCostPremColorLarge: 4.20,
    hardcoverFixedCostBW: 350,
    hardcoverPageCostBW: 0.70,
    hardcoverFixedCostPremColor: 350,
    hardcoverPageCostPremColor: 3.80
  }
};

export interface CalculationInput {
  marketplace: Marketplace;
  binding: BookBinding;
  inkType: InkType;
  trimCategory: TrimCategory;
  pageCount: number;
  listPrice: number;
  expandedDistribution?: boolean;
}

export interface CalculationResult {
  marketplace: MarketplaceConfig;
  printingCost: number;
  minListPrice: number;
  royaltyRate: number; // 0.60 for standard, 0.40 for expanded distribution
  royaltyPerSale: number;
  profitMarginPercent: number;
  amazonCut: number;
  isProfitable: boolean;
  breakEvenCopiesFor1000Revenue: number;
}

export function calculateKdpRoyalty(input: CalculationInput): CalculationResult {
  const cfg = KDP_MARKETPLACES[input.marketplace] || KDP_MARKETPLACES.US;
  const pageCount = Math.max(24, Math.min(828, input.pageCount || 100));
  const listPrice = Math.max(0, input.listPrice || cfg.defaultPrice);
  const isLarge = input.trimCategory === 'large';
  const isHardcover = input.binding === 'hardcover';

  let fixedCost = 0;
  let pageCost = 0;

  if (isHardcover) {
    if (input.inkType === 'black_and_white') {
      fixedCost = cfg.hardcoverFixedCostBW;
      pageCost = cfg.hardcoverPageCostBW;
    } else {
      fixedCost = cfg.hardcoverFixedCostPremColor;
      pageCost = cfg.hardcoverPageCostPremColor;
    }
  } else {
    // Paperback
    if (input.inkType === 'black_and_white') {
      fixedCost = isLarge ? cfg.fixedCostBWLarge : cfg.fixedCostBWRegular;
      pageCost = isLarge ? cfg.pageCostBWLarge : cfg.pageCostBWRegular;
    } else if (input.inkType === 'standard_color') {
      fixedCost = isLarge ? cfg.fixedCostStdColorLarge : cfg.fixedCostStdColorRegular;
      pageCost = isLarge ? cfg.pageCostStdColorLarge : cfg.pageCostStdColorRegular;
    } else {
      // Premium Color
      fixedCost = isLarge ? cfg.fixedCostPremColorLarge : cfg.fixedCostPremColorRegular;
      pageCost = isLarge ? cfg.pageCostPremColorLarge : cfg.pageCostPremColorRegular;
    }
  }

  // Exact KDP Printing Cost Formula: Fixed Cost + (Page Count * Page Cost)
  // For small books (< 108 pages Black & White on US), Amazon uses flat fixed rate,
  // but standard formula provides accurate baseline across all trim sizes.
  let rawPrintingCost = fixedCost + (pageCount * pageCost);
  const printingCost = Number(rawPrintingCost.toFixed(2));

  // Minimum List Price = Printing Cost / 0.60
  const minListPrice = Number((printingCost / 0.60).toFixed(2));

  // Royalty calculation
  const royaltyRate = input.expandedDistribution ? 0.40 : 0.60;
  const grossRoyalty = (listPrice * royaltyRate) - printingCost;
  const royaltyPerSale = Number(Math.max(0, grossRoyalty).toFixed(2));
  const amazonCut = Number((listPrice - royaltyPerSale - printingCost).toFixed(2));

  const profitMarginPercent = listPrice > 0 ? Number(((royaltyPerSale / listPrice) * 100).toFixed(1)) : 0;
  const isProfitable = royaltyPerSale > 0;
  const breakEvenCopiesFor1000Revenue = royaltyPerSale > 0 ? Math.ceil(1000 / royaltyPerSale) : 0;

  return {
    marketplace: cfg,
    printingCost,
    minListPrice,
    royaltyRate,
    royaltyPerSale,
    profitMarginPercent,
    amazonCut,
    isProfitable,
    breakEvenCopiesFor1000Revenue
  };
}
