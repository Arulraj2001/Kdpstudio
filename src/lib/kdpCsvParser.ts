/**
 * KDP Studio — Enterprise Amazon KDP Royalty Parser (CSV & Excel .xlsx)
 * Supports Amazon KDP US/UK/DE/FR/ES/IT/JP/CA/AU/IN, paperback, hardcover, eBook, and KENP reports.
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
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
  if (clean.includes('paperback') || clean.includes('print') || clean.includes('pod')) return 'paperback';
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
  const parts = String(val).split(/[-/.]/);
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
 * Safely parses numeric value from CSV/Excel fields
 */
export function parseNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const clean = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Finds value from row by checking multiple column alias variants
 */
export function getColumnValue(row: Record<string, any>, aliases: string[]): any {
  if (!row || typeof row !== 'object') return undefined;
  const keys = Object.keys(row);

  // Pass 1: Exact matches (prevents 'Royalty Type' from matching 'Royalty')
  for (const alias of aliases) {
    const aliasClean = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of keys) {
      const keyClean = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (keyClean === aliasClean) {
        return row[key];
      }
    }
  }

  // Pass 2: Partial matches
  for (const alias of aliases) {
    const aliasClean = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of keys) {
      const keyClean = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (keyClean.includes(aliasClean)) {
        return row[key];
      }
    }
  }
  return undefined;
}

/**
 * Parses rows array into structured ParsedKdpReport
 */
export function parseKdpRows(rows: Record<string, any>[]): ParsedKdpReport {
  const result: ParsedKdpReport = {
    entries: [],
    bookTitles: [],
    dateRange: { from: '', to: '' },
    totalRevenue: 0,
    totalUnits: 0,
    errors: [],
    warnings: [],
  };

  if (!rows || rows.length === 0) {
    result.errors.push('No data rows found in report.');
    return result;
  }

  const uniqueTitles = new Set<string>();
  let minDate = '';
  let maxDate = '';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const title = String(getColumnValue(row, ['Title', 'Book Title', 'Item Name', 'Product Name', 'Publication Title']) || 'Untitled Book').trim();
      const asin = String(getColumnValue(row, ['ASIN/ISBN', 'ASIN', 'ISBN', 'Product ID', 'Item ID']) || '').trim();
      const rawDate = getColumnValue(row, ['Date', 'Transaction Date', 'Order Date', 'Royalty Date', 'Period', 'Sales Date']) || '';
      const rawMarketplace = getColumnValue(row, ['Marketplace', 'Market Place', 'Store', 'Country']) || 'amazon-us';
      const rawRoyaltyType = getColumnValue(row, ['Royalty Type', 'Format', 'Product Type', 'Edition', 'Type']) || 'ebook';
      const unitsSold = parseNumber(getColumnValue(row, ['Units Sold', 'Quantity Sold', 'Orders', 'Gross Units Sold', 'Gross Units']));
      const unitsReturned = parseNumber(getColumnValue(row, ['Units Refunded', 'Returns', 'Refunds', 'Refunded Units', 'Free Units']));
      const netUnits = parseNumber(getColumnValue(row, ['Net Units Sold', 'Net Units', 'Total Units'])) || (unitsSold - unitsReturned);
      const royaltyEarned = parseNumber(getColumnValue(row, ['Royalty', 'Estimated Royalty', 'Total Royalty', 'Net Royalty', 'Royalty (USD)']));
      const grossRevenue = parseNumber(getColumnValue(row, ['Gross Revenue', 'Average List Price', 'Sales Price', 'Total Sales', 'List Price'])) || (netUnits * 4.99);
      const currency = String(getColumnValue(row, ['Currency', 'Royalty Currency', 'Payment Currency']) || 'USD').toUpperCase();
      const kenpPages = parseNumber(getColumnValue(row, ['KENP Read', 'KENP Read Pages', 'Pages Read', 'KENP']));
      const kenpRoyalty = parseNumber(getColumnValue(row, ['KENP Royalty', 'KENP Estimated Royalty']));

      // Filter out total/header rows with 0 data
      if (unitsSold === 0 && unitsReturned === 0 && royaltyEarned === 0 && kenpPages === 0) {
        continue;
      }

      const cleanDate = normalizeDate(rawDate);
      const year = parseInt(cleanDate.substring(0, 4), 10) || new Date().getFullYear();
      const month = cleanDate.substring(0, 7);

      if (!minDate || cleanDate < minDate) minDate = cleanDate;
      if (!maxDate || cleanDate > maxDate) maxDate = cleanDate;

      if (title && title !== 'Untitled Book') {
        uniqueTitles.add(title);
      }

      result.entries.push({
        id: `kdp_row_${i + 1}`,
        uid: '',
        bookId: '',
        date: cleanDate,
        week: `${year}-W01`,
        month,
        year,
        marketplace: normalizeMarketplace(rawMarketplace),
        royaltyType: normalizeRoyaltyType(rawRoyaltyType),
        unitsSold,
        unitsReturned,
        netUnitsSold: netUnits,
        grossRevenue,
        royaltyEarned,
        currency,
        revenueUSD: convertToUSD(royaltyEarned, currency),
        bsr: null,
        categoryRank: null,
        categoryName: null,
        kenpPageReads: kenpPages,
        kenpRoyalty,
        entryMethod: 'import',
        notes: title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      result.totalRevenue += convertToUSD(royaltyEarned, currency);
      result.totalUnits += netUnits;
    } catch (err: any) {
      result.warnings.push(`Row ${i + 1}: Skipped due to format error (${err.message})`);
    }
  }

  result.bookTitles = Array.from(uniqueTitles);
  result.dateRange = { from: minDate, to: maxDate };
  result.totalRevenue = Number(result.totalRevenue.toFixed(2));

  return result;
}

/**
 * Parses raw Amazon KDP royalty CSV reports
 */
export function parseKdpRoyaltyReport(csvContent: string): ParsedKdpReport {
  if (!csvContent || typeof csvContent !== 'string' || !csvContent.trim()) {
    return {
      entries: [],
      bookTitles: [],
      dateRange: { from: '', to: '' },
      totalRevenue: 0,
      totalUnits: 0,
      errors: ['Empty CSV content provided.'],
      warnings: [],
    };
  }

  const parsed = Papa.parse<Record<string, any>>(csvContent.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });

  const rows = (parsed.data || []) as Record<string, any>[];
  return parseKdpRows(rows);
}

/**
 * Parses Excel (.xlsx / .xls) Amazon KDP Royalty Reports
 */
export function parseKdpExcelReport(buffer: ArrayBuffer | Uint8Array | Buffer): ParsedKdpReport {
  try {
    let workbook: XLSX.WorkBook;
    if (buffer instanceof ArrayBuffer) {
      workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    } else {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    }
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Excel workbook contains no sheets.');
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
    return parseKdpRows(rows);
  } catch (err: any) {
    return {
      entries: [],
      bookTitles: [],
      dateRange: { from: '', to: '' },
      totalRevenue: 0,
      totalUnits: 0,
      errors: [`Excel parse error: ${err.message || 'Failed to read workbook.'}`],
      warnings: [],
    };
  }
}

/**
 * Universal KDP Report Ingestion supporting both CSV and Excel (.xlsx) files
 */
export async function parseKdpReportFile(file: File): Promise<ParsedKdpReport> {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const arrayBuffer = await file.arrayBuffer();
    return parseKdpExcelReport(arrayBuffer);
  }

  const text = await file.text();
  return parseKdpRoyaltyReport(text);
}
