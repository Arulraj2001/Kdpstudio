/**
 * IP Geolocation + Currency Detection System for KDP Studio
 */

export type Currency = 'INR' | 'USD' | 'GBP' | 'EUR' | 'CAD' | 'AUD';
export type PlanName = 'free' | 'starter' | 'pro' | 'agency' | 'lifetime';
export type PaymentMethod = 'razorpay' | 'upi' | 'paypal' | 'bmac';

export interface LocationData {
  country: string;
  countryName: string;
  currency: string;
  timezone: string;
  ip: string;
}

export const SUPPORTED_CURRENCIES: { code: Currency; label: string; flag: string; symbol: string }[] = [
  { code: 'INR', label: 'INR (₹)', flag: '🇮🇳', symbol: '₹' },
  { code: 'USD', label: 'USD ($)', flag: '🇺🇸', symbol: '$' },
  { code: 'GBP', label: 'GBP (£)', flag: '🇬🇧', symbol: '£' },
  { code: 'EUR', label: 'EUR (€)', flag: '🇪🇺', symbol: '€' },
  { code: 'CAD', label: 'CAD (CA$)', flag: '🇨🇦', symbol: 'CA$' },
  { code: 'AUD', label: 'AUD (A$)', flag: '🇦🇺', symbol: 'A$' },
];

export type PricingMatrix = Record<Currency, number>;
export type PricingTable = Record<PlanName, PricingMatrix>;

export const PRICING_TABLE = {
  free: { INR: 0, USD: 0, GBP: 0, EUR: 0, CAD: 0, AUD: 0 },
  starter: { INR: 499, USD: 6, GBP: 5, EUR: 6, CAD: 8, AUD: 9 },
  pro: { INR: 1499, USD: 18, GBP: 15, EUR: 17, CAD: 22, AUD: 27 },
  agency: { INR: 3999, USD: 49, GBP: 39, EUR: 45, CAD: 60, AUD: 75 },
  lifetime: { INR: 9999, USD: 129, GBP: 99, EUR: 119, CAD: 159, AUD: 189 },
} as const;

export interface PlanPricingOverrides {
  starterMonthly?: number;
  starterAnnual?: number;
  proMonthly?: number;
  proAnnual?: number;
  agencyMonthly?: number;
  agencyAnnual?: number;
  lifetime?: number;
}

/**
 * Computes dynamic pricing table with fallback to static PRICING_TABLE.
 * If USD price is overridden, applies proportional scaling to other supported currencies.
 */
export function computeDynamicPricingTable(overrides?: PlanPricingOverrides | null): PricingTable {
  const base: PricingTable = {
    free: { INR: 0, USD: 0, GBP: 0, EUR: 0, CAD: 0, AUD: 0 },
    starter: { ...PRICING_TABLE.starter },
    pro: { ...PRICING_TABLE.pro },
    agency: { ...PRICING_TABLE.agency },
    lifetime: { ...PRICING_TABLE.lifetime },
  };

  if (!overrides) return base;

  // Starter override
  if (typeof overrides.starterMonthly === 'number' && overrides.starterMonthly > 0) {
    const newUsd = overrides.starterMonthly;
    const ratio = newUsd / PRICING_TABLE.starter.USD;
    base.starter = {
      USD: newUsd,
      INR: Math.round(PRICING_TABLE.starter.INR * ratio),
      GBP: Math.round(PRICING_TABLE.starter.GBP * ratio),
      EUR: Math.round(PRICING_TABLE.starter.EUR * ratio),
      CAD: Math.round(PRICING_TABLE.starter.CAD * ratio),
      AUD: Math.round(PRICING_TABLE.starter.AUD * ratio),
    };
  }

  // Pro override
  if (typeof overrides.proMonthly === 'number' && overrides.proMonthly > 0) {
    const newUsd = overrides.proMonthly;
    const ratio = newUsd / PRICING_TABLE.pro.USD;
    base.pro = {
      USD: newUsd,
      INR: Math.round(PRICING_TABLE.pro.INR * ratio),
      GBP: Math.round(PRICING_TABLE.pro.GBP * ratio),
      EUR: Math.round(PRICING_TABLE.pro.EUR * ratio),
      CAD: Math.round(PRICING_TABLE.pro.CAD * ratio),
      AUD: Math.round(PRICING_TABLE.pro.AUD * ratio),
    };
  }

  // Agency override
  if (typeof overrides.agencyMonthly === 'number' && overrides.agencyMonthly > 0) {
    const newUsd = overrides.agencyMonthly;
    const ratio = newUsd / PRICING_TABLE.agency.USD;
    base.agency = {
      USD: newUsd,
      INR: Math.round(PRICING_TABLE.agency.INR * ratio),
      GBP: Math.round(PRICING_TABLE.agency.GBP * ratio),
      EUR: Math.round(PRICING_TABLE.agency.EUR * ratio),
      CAD: Math.round(PRICING_TABLE.agency.CAD * ratio),
      AUD: Math.round(PRICING_TABLE.agency.AUD * ratio),
    };
  }

  // Lifetime override
  if (typeof overrides.lifetime === 'number' && overrides.lifetime > 0) {
    const newUsd = overrides.lifetime;
    const ratio = newUsd / PRICING_TABLE.lifetime.USD;
    base.lifetime = {
      USD: newUsd,
      INR: Math.round(PRICING_TABLE.lifetime.INR * ratio),
      GBP: Math.round(PRICING_TABLE.lifetime.GBP * ratio),
      EUR: Math.round(PRICING_TABLE.lifetime.EUR * ratio),
      CAD: Math.round(PRICING_TABLE.lifetime.CAD * ratio),
      AUD: Math.round(PRICING_TABLE.lifetime.AUD * ratio),
    };
  }

  return base;
}

/**
 * Maps country codes to their primary or supported currency
 */
export function getCurrencyForCountry(countryCode: string): string {
  const code = (countryCode || '').toUpperCase().trim();

  if (code === 'IN') return 'INR';
  if (code === 'US') return 'USD';
  if (code === 'GB') return 'GBP';

  // Eurozone countries
  const euroCountries = [
    'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 
    'GR', 'LU', 'MT', 'CY', 'SK', 'SI', 'EE', 'LV', 'LT'
  ];
  if (euroCountries.includes(code)) return 'EUR';

  if (code === 'CA') return 'CAD';
  if (code === 'AU') return 'AUD';
  if (code === 'NZ') return 'NZD';
  if (code === 'SG') return 'SGD';
  if (code === 'MY') return 'MYR';
  if (code === 'PH') return 'PHP';
  if (code === 'AE') return 'AED';
  if (code === 'SA') return 'SAR';
  if (code === 'JP') return 'JPY';
  if (code === 'KR') return 'KRW';
  if (code === 'BR') return 'BRL';
  if (code === 'MX') return 'MXN';
  if (code === 'ZA') return 'ZAR';

  return 'USD';
}

/**
 * Returns supported payment gateways and methods for a given currency
 */
export function getPaymentMethods(currency: string): PaymentMethod[] {
  const curr = (currency || '').toUpperCase();
  if (curr === 'INR') {
    return ['razorpay', 'upi', 'bmac'];
  }
  if (['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'NZD'].includes(curr)) {
    return ['paypal', 'bmac'];
  }
  return ['paypal', 'bmac'];
}

/**
 * Formats pricing number into proper localized currency string
 */
export function formatPrice(amount: number, currency: string): string {
  const curr = (currency || 'USD').toUpperCase();
  
  if (amount === 0) {
    return curr === 'INR' ? '₹0' : '$0.00';
  }

  switch (curr) {
    case 'INR':
      return `₹${amount.toLocaleString('en-IN')}`;
    case 'USD':
      return `$${amount.toFixed(2)}`;
    case 'GBP':
      return `£${amount.toFixed(2)}`;
    case 'EUR':
      return `€${amount.toFixed(2)}`;
    case 'CAD':
      return `CA$${amount.toFixed(2)}`;
    case 'AUD':
      return `A$${amount.toFixed(2)}`;
    default:
      return `$${amount.toFixed(2)}`;
  }
}

/**
 * Normalizes any detected currency code to one of our supported pricing currencies
 */
export function normalizeToSupportedCurrency(detectedCurrency: string, countryCode: string): Currency {
  const mapped = getCurrencyForCountry(countryCode);
  if (['INR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD'].includes(mapped)) {
    return mapped as Currency;
  }
  if (['INR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD'].includes(detectedCurrency)) {
    return detectedCurrency as Currency;
  }
  return 'USD';
}

const DEFAULT_LOCATION: LocationData = {
  country: 'US',
  countryName: 'United States',
  currency: 'USD',
  timezone: 'UTC',
  ip: '',
};

/**
 * Calls ipapi.co to detect client location, country, and currency.
 * Fails safely with US/USD default.
 */
export async function detectUserLocation(): Promise<LocationData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[Geo] ipapi.co returned status:', response.status);
      return DEFAULT_LOCATION;
    }

    const data = await response.json();
    if (data && data.country_code) {
      const country = data.country_code || 'US';
      const countryName = data.country_name || 'United States';
      const rawCurrency = data.currency || getCurrencyForCountry(country);
      const timezone = data.timezone || 'UTC';
      const ip = data.ip || '';

      const detectedLocation: LocationData = {
        country,
        countryName,
        currency: rawCurrency,
        timezone,
        ip,
      };

      console.log('[Geo] Successfully detected location:', detectedLocation);
      return detectedLocation;
    }

    return DEFAULT_LOCATION;
  } catch (error) {
    console.warn('[Geo] Location detection fallback activated:', error);
    return DEFAULT_LOCATION;
  }
}
