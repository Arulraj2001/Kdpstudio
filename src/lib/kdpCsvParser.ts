/**
 * KDP Studio — Amazon KDP Royalty CSV Parser
 * Phase 15A
 */

import Papa from 'papaparse';
import { BookPerformanceEntry, MarketPlace, RoyaltyType, ParsedKdpReport } from '../types/analytics';
import { convertToUSD } from './analyticsService';

/**
 * Normalizes marketplace string into standard MarketPlace enum
 */
export function normalizeMarketplace(val: string = ''): MarketPlace {
  const clean = val.toLowerCase().trim();
  if (clean.includes('.co.uk') || clean.includes('uk')) return 'amazon-uk';
  if (clean.includes('.ca') || clean.includes('canada')) return 'amazon-ca';
  if (clean.includes('.com.au') || clean.includes('australia')) return 'amazon-au';
  if (clean.includes('.in') || clean.includes('india')) return 'amazon-in';
  if (clean.includes('.de') || clean.includes('germany')) return 'amazon-de';
  if (clean.includes('.fr') || clean.includes('france')) return 'amazon-fr';
  if (clean.includes('.es') || clean.includes('spain')) return 'amazon-es';
  if (clean.includes('.it') || clean.includes('italy')) return 'amazon-it';
  if (clean.includes('.co.jp') || clean.includes('japan')) return 'amazon-jp';
  if (clean.includes('.com.br') || clean.includes('brazil')) return 'amazon-br';
  if (clean.includes('.com.mx') || clean.includes('mexico')) return 'amazon-mx';
  return 'amazon-us';
}

/**
 * Normalizes royalty/format type into standard RoyaltyType enum
 */
export function normalizeRoyaltyType(val: string = ''): RoyaltyType {
  const clean = val.toLowerCase().trim();
  if (clean.includes('paperback') || clean.includes('print')) return 'paperback';
  if (clean.includes('hardcover')) return 'hardcover';
  return 'ebook';
}

/**
 * Normalizes date string into YYYY-MM-DD format
 */
export function normalizeDate(val: string = ''): string {
  if (!val) return new Date().toISOString().substring(0, 10);
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString().substring(0, 10);
    }
  } catch {
    // fallback
  }
  // Try MM/DD/YYYY or DD/MM/YYYY
  const parts = val.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
  }
  return new Date().toISOString().substring(0, 10);
}

/**
 * Safely parses numeric value from CSV fields
 */
function parseNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const clean = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Finds value from row by checking multiple column alias variants
 */
function getColumnValue(row: Record<string, any>, aliases: string[]): any {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const aliasClean = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of keys) {
      const keyClean = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (keyClean === aliasClean || keyClean.includes(aliasClean)) {
        return row[key];
      }
    }
  }
  return undefined;
}

/**
 * Parses raw Amazon KDP royalty CSV reports
 */
export function parseKdpRoyaltyReport(csvContent: string): ParsedKdpReport {
  const result: ParsedKdpReport = {
    entries: [],
    bookTitles: [],
    dateRange: { from: '', to: '' },
    totalRevenue: 0,
    totalUnits: 0,
    errors: [],
    warnings: [],
  };

  if (!csvContent || typeof csvContent !== 'string') {
    result.errors.push('Empty CSV file provided.');
    return result;
  }

  const parsed = Papa.parse<Record<string, any>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });

  if (parsed.errors && parsed.errors.length > 0) {
    for (const err of parsed.errors.slice(0, 5)) {
      result.warnings.push(`CSV Parse warning at row ${err.row || '?'}: ${err.message}`);
    }
  }

  const rows = parsed.data || [];
  if (rows.length === 0) {
    result.errors.push('No data rows found in CSV report.');
    return result;
  }

  const uniqueTitles = new Set<string>();
  let minDate = '';
  let maxDate = '';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const title = getColumnValue(row, ['Title', 'Book Title', 'Item Name', 'Product Name']) || 'Untitled Book';
      const asin = getColumnValue(row, ['ASIN/ISBN', 'ASIN', 'ISBN', 'Product ID']) || '';
      const rawDate = getColumnValue(row, ['Date', 'Transaction Date', 'Order Date', 'Royalty Date', 'Period']) || '';
      const rawMarketplace = getColumnValue(row, ['Marketplace', 'Market Place', 'Store', 'Country']) || 'amazon-us';
      const rawRoyaltyType = getColumnValue(row, ['Royalty Type', 'Format', 'Product Type', 'Edition']) || 'ebook';
      const unitsSold = parseNumber(getColumnValue(row, ['Units Sold', 'Quantity Sold', 'Orders', 'Gross Units Sold']));
      const unitsReturned = parseNumber(getColumnValue(row, ['Units Refunded', 'Returns', 'Refunds', 'Refunded Units']));
      const netUnits = parseNumber(getColumnValue(row, ['Net Units Sold', 'Net Units', 'Total Units'])) || (unitsSold - unitsReturned);
      const royaltyEarned = parseNumber(getColumnValue(row, ['Royalty', 'Estimated Royalty', 'Total Royalty', 'Net Royalty']));
      const grossRevenue = parseNumber(getColumnValue(row, ['Gross Revenue', 'Average List Price', 'Sales Price', 'Total Sales'])) || (netUnits * 4.99);
      const currency = String(getColumnValue(row, ['Currency', 'Royalty Currency']) || 'USD').toUpperCase();
      const kenpPages = parseNumber(getColumnValue(row, ['KENP Read', 'KENP Read Pages', 'Pages Read', 'KENP']));
      const kenpRoyalty = parseNumber(getColumnValue(row, ['KENP Royalty', 'KENP Estimated Royalty']));

      const entryDate = normalizeDate(rawDate);
      const marketplace = normalizeMarketplace(rawMarketplace);
      const royaltyType = normalizeRoyaltyType(rawRoyaltyType);
      const revenueUSD = convertToUSD(royaltyEarned, currency);

      if (title) uniqueTitles.add(title);

      if (!minDate || entryDate < minDate) minDate = entryDate;
      if (!maxDate || entryDate > maxDate) maxDate = entryDate;

      result.totalRevenue += revenueUSD;
      result.totalUnits += netUnits;

      const dateObj = new Date(entryDate);
      const year = isNaN(dateObj.getFullYear()) ? new Date().getFullYear() : dateObj.getFullYear();
      const month = entryDate.substring(0, 7);

      const entry: Partial<BookPerformanceEntry> = {
        date: entryDate,
        month,
        year,
        marketplace,
        royaltyType,
        unitsSold,
        unitsReturned,
        netUnitsSold: netUnits,
        grossRevenue,
        royaltyEarned,
        currency,
        revenueUSD,
        bsr: null,
        categoryRank: null,
        categoryName: null,
        kenpPageReads: kenpPages,
        kenpRoyalty,
        entryMethod: 'import',
        notes: `Imported from KDP report (${title}${asin ? ` - ${asin}` : ''})`,
      };

      result.entries.push(entry);
    } catch (rowErr: any) {
      result.warnings.push(`Row ${i + 1} skipped: ${rowErr?.message || 'Invalid row data'}`);
    }
  }

  result.bookTitles = Array.from(uniqueTitles);
  result.dateRange = { from: minDate || 'Recent', to: maxDate || 'Recent' };
  result.totalRevenue = Number(result.totalRevenue.toFixed(2));

  return result;
}
