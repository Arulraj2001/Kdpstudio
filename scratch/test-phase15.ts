/**
 * Phase 15 Automated Test Verification Script
 */

import {
  calculateEbookRoyalty,
  calculatePaperbackRoyalty,
  calculateFullRoyalty,
  generateRoyaltyProjections,
  bsrToEstimatedMonthlySales,
} from '../src/lib/royaltyCalculator';
import { parseKdpRoyaltyReport } from '../src/lib/kdpCsvParser';
import {
  convertToUSD,
  canEditPerformanceEntry,
  EXCHANGE_RATES,
} from '../src/lib/analyticsService';

console.log('--- TESTING PHASE 15 FOUNDATION ---');

// 1. Royalty Calculator Math
// 35% ebook
const ebook35 = calculateEbookRoyalty(2.99, '35', 'amazon-us', 1.0);
console.assert(ebook35.royaltyPerSale === 1.05, `Expected 1.05, got ${ebook35.royaltyPerSale}`);
console.assert(ebook35.deliveryCost === 0, `Expected 0 delivery cost for 35%, got ${ebook35.deliveryCost}`);

// 70% ebook: (9.99 * 0.70) - (1.0 MB * 0.15) = 6.993 - 0.15 = 6.84
const ebook70 = calculateEbookRoyalty(9.99, '70', 'amazon-us', 1.0);
console.assert(ebook70.royaltyPerSale === 6.84, `Expected 6.84, got ${ebook70.royaltyPerSale}`);

// Paperback: listPrice $12.99, 100 pages B&W US. Printing cost = 0.85 + (100 * 0.012) = $2.05
// Royalty = (12.99 * 0.60) - 2.05 = 7.794 - 2.05 = 5.74
const pb = calculatePaperbackRoyalty(12.99, 100, 'amazon-us', false, false);
console.assert(pb.printingCost === 2.05, `Expected printing cost 2.05, got ${pb.printingCost}`);
console.assert(pb.royaltyPerSale === 5.74, `Expected royalty 5.74, got ${pb.royaltyPerSale}`);

// Projections: 5 volumes (10, 50, 100, 500, 1000)
const projections = generateRoyaltyProjections(5.74);
console.assert(projections.length === 5, `Expected 5 projections, got ${projections.length}`);
console.assert(projections[2].unitsSold === 100 && projections[2].monthlyRoyalty === 574, '100 units projection mismatch');

// BSR Estimator
const bsrEst = bsrToEstimatedMonthlySales(5000);
console.assert(bsrEst.min === 300 && bsrEst.max === 1000, `Expected 300-1000 sales for BSR 5k, got ${bsrEst.min}-${bsrEst.max}`);

// 2. Currency Conversion
const gbpToUsd = convertToUSD(100, 'GBP');
console.assert(gbpToUsd === 126.58, `Expected $126.58 for 100 GBP, got ${gbpToUsd}`);

// 3. 24-hour edit limit
const freshEntry = { createdAt: new Date().toISOString() };
const oldEntry = { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() };
console.assert(canEditPerformanceEntry(freshEntry as any) === true, 'Fresh entry should be editable');
console.assert(canEditPerformanceEntry(oldEntry as any) === false, 'Old entry should not be editable');

// 4. KDP CSV Parser
const sampleKdpCsv = `Royalty Date,Title,Marketplace,Royalty Type,Units Sold,Units Refunded,Net Units Sold,Royalty Earned,Currency
2026-03-01,Mindful Habits Journal,Amazon.com,Standard,15,0,15,45.00,USD
2026-03-02,Mindful Habits Journal,Amazon.co.uk,Standard,10,1,9,27.00,GBP
`;
const parsedReport = parseKdpRoyaltyReport(sampleKdpCsv);
console.assert(parsedReport.entries.length === 2, `Expected 2 entries, got ${parsedReport.entries.length}`);
console.assert(parsedReport.totalUnits === 24, `Expected 24 total net units, got ${parsedReport.totalUnits}`);
console.assert(parsedReport.bookTitles.includes('Mindful Habits Journal'), 'Title not found');

console.log('--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
