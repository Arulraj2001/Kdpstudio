/**
 * KDP Studio — Standalone KDP Royalty Calculator View
 * Phase 15B
 */

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  Sparkles,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Info,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { PageRoute } from '../../types';
import { MarketPlace, RoyaltyType } from '../../types/analytics';
import {
  calculateEbookRoyalty,
  calculatePaperbackRoyalty,
  generateRoyaltyProjections,
  estimateFileSizeMB,
  MARKETPLACE_ROYALTY_RATES,
} from '../../lib/royaltyCalculator';

interface RoyaltyCalculatorViewProps {
  onNavigate?: (route: PageRoute) => void;
}

const MARKETPLACE_OPTIONS: { id: MarketPlace; name: string; flag: string; currency: string }[] = [
  { id: 'amazon-us', name: 'Amazon US (Amazon.com)', flag: '🇺🇸', currency: 'USD' },
  { id: 'amazon-uk', name: 'Amazon UK (Amazon.co.uk)', flag: '🇬🇧', currency: 'GBP' },
  { id: 'amazon-ca', name: 'Amazon Canada (Amazon.ca)', flag: '🇨🇦', currency: 'CAD' },
  { id: 'amazon-au', name: 'Amazon Australia (Amazon.com.au)', flag: '🇦🇺', currency: 'AUD' },
  { id: 'amazon-in', name: 'Amazon India (Amazon.in)', flag: '🇮🇳', currency: 'INR' },
  { id: 'amazon-de', name: 'Amazon Germany (Amazon.de)', flag: '🇩🇪', currency: 'EUR' },
  { id: 'amazon-fr', name: 'Amazon France (Amazon.fr)', flag: '🇫🇷', currency: 'EUR' },
  { id: 'amazon-es', name: 'Amazon Spain (Amazon.es)', flag: '🇪🇸', currency: 'EUR' },
  { id: 'amazon-it', name: 'Amazon Italy (Amazon.it)', flag: '🇮🇹', currency: 'EUR' },
  { id: 'amazon-jp', name: 'Amazon Japan (Amazon.co.jp)', flag: '🇯🇵', currency: 'JPY' },
  { id: 'amazon-br', name: 'Amazon Brazil (Amazon.com.br)', flag: '🇧🇷', currency: 'BRL' },
  { id: 'amazon-mx', name: 'Amazon Mexico (Amazon.com.mx)', flag: '🇲🇽', currency: 'MXN' },
];

export const RoyaltyCalculatorView: React.FC<RoyaltyCalculatorViewProps> = ({ onNavigate }) => {
  const [format, setFormat] = useState<RoyaltyType>('paperback');
  const [marketplace, setMarketplace] = useState<MarketPlace>('amazon-us');
  const [listPrice, setListPrice] = useState<number>(9.99);
  const [royaltyPlan, setRoyaltyPlan] = useState<'35' | '70'>('70');
  const [pageCount, setPageCount] = useState<number>(100);
  const [isColorInterior, setIsColorInterior] = useState<boolean>(false);
  const [fileSizeMB, setFileSizeMB] = useState<number>(1.5);
  const [trimSize, setTrimSize] = useState<string>('8.5x11');

  const selectedMkt = MARKETPLACE_OPTIONS.find((m) => m.id === marketplace) || MARKETPLACE_OPTIONS[0];
  const currency = selectedMkt.currency;

  // Calculation Results
  const calculation = useMemo(() => {
    if (format === 'ebook') {
      const eb = calculateEbookRoyalty(listPrice, royaltyPlan, marketplace, fileSizeMB);
      const projections = generateRoyaltyProjections(eb.royaltyPerSale);
      return {
        royaltyPerSale: eb.royaltyPerSale,
        deliveryCost: eb.deliveryCost,
        netRoyalty: eb.netRoyalty,
        isEligibleFor70: eb.isEligibleFor70,
        royaltyPercentage: eb.royaltyPercentage,
        minimumPrice: eb.minimumPrice,
        projections,
      };
    }

    const pb = calculatePaperbackRoyalty(listPrice, pageCount, marketplace, isColorInterior, format === 'hardcover');
    const projections = generateRoyaltyProjections(pb.royaltyPerSale);
    return {
      royaltyPerSale: pb.royaltyPerSale,
      printingCost: pb.printingCost,
      minimumPrice: pb.minimumPrice,
      profitMargin: pb.profitMargin,
      royaltyPercentage: pb.royaltyPercentage,
      projections,
    };
  }, [format, marketplace, listPrice, royaltyPlan, pageCount, isColorInterior, fileSizeMB]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-800/60 flex items-center gap-1">
            <Calculator size={12} />
            <span>KDP Economics</span>
          </span>
          <span className="text-xs text-slate-400">· 100% Free Public Tool</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Amazon KDP Royalty Calculator
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Calculate your exact net royalties per sale, analyze print-on-demand manufacturing costs, and project your monthly passive income before publishing.
        </p>
      </div>

      {/* 2-Column Calculator Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Inputs (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          {/* Format Switcher Tabs */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Book Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('paperback')}
                className={`py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  format === 'paperback'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                📖 Paperback
              </button>
              <button
                type="button"
                onClick={() => setFormat('ebook')}
                className={`py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  format === 'ebook'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                📱 Kindle eBook
              </button>
              <button
                type="button"
                onClick={() => setFormat('hardcover')}
                className={`py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  format === 'hardcover'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                📚 Hardcover
              </button>
            </div>
          </div>

          {/* Marketplace Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Target Amazon Marketplace
            </label>
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value as MarketPlace)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              {MARKETPLACE_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.flag} {m.name} ({m.currency})
                </option>
              ))}
            </select>
          </div>

          {/* List Price Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                List Price ({currency})
              </label>
              <span className="text-[11px] text-slate-400">
                Suggested: $7.99 – $14.99
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">
                {currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : currency === 'INR' ? '₹' : '$'}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.99"
                value={listPrice}
                onChange={(e) => setListPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono font-bold focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* EBOOK SPECIFIC INPUTS */}
          {format === 'ebook' ? (
            <div className="space-y-4 pt-3 border-t border-slate-800">
              {/* 35% vs 70% Plan Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Kindle Royalty Plan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setRoyaltyPlan('70')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      royaltyPlan === '70'
                        ? 'bg-purple-950/80 border-purple-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">70% Standard Plan</span>
                      {royaltyPlan === '70' && <CheckCircle2 size={14} className="text-purple-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      $2.99 – $9.99 pricing range. Amazon charges delivery fees ($0.15/MB).
                    </p>
                  </div>

                  <div
                    onClick={() => setRoyaltyPlan('35')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      royaltyPlan === '35'
                        ? 'bg-purple-950/80 border-purple-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">35% Budget Plan</span>
                      {royaltyPlan === '35' && <CheckCircle2 size={14} className="text-purple-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Available for all prices ($0.99+). Zero delivery fees deducted.
                    </p>
                  </div>
                </div>

                {royaltyPlan === '70' && (listPrice < 2.99 || listPrice > 9.99) && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-300 text-[11px] flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-amber-400 shrink-0" />
                    <span>
                      70% royalty requires a list price between $2.99 and $9.99. Amazon will default this to 35%.
                    </span>
                  </div>
                )}
              </div>

              {/* File Size Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Estimated eBook File Size: <strong className="text-purple-400">{fileSizeMB} MB</strong>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Delivery Fee: ${(fileSizeMB * 0.15).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={fileSizeMB}
                  onChange={(e) => setFileSizeMB(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Average text eBook: 1–2 MB. Picture/Coloring books: 3–5 MB.
                </p>
              </div>
            </div>
          ) : (
            /* PRINT (PAPERBACK / HARDCOVER) SPECIFIC INPUTS */
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Page Count *
                  </label>
                  <input
                    type="number"
                    min="24"
                    max="828"
                    value={pageCount}
                    onChange={(e) => setPageCount(Math.max(24, parseInt(e.target.value) || 24))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    KDP min: 24 pages.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Trim Size
                  </label>
                  <select
                    value={trimSize}
                    onChange={(e) => setTrimSize(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="8.5x11">8.5 × 11 in (Large)</option>
                    <option value="6x9">6 × 9 in (Standard)</option>
                    <option value="8.5x8.5">8.5 × 8.5 in (Square)</option>
                    <option value="5.5x8.5">5.5 × 8.5 in (Compact)</option>
                  </select>
                </div>
              </div>

              {/* Interior Color Toggle */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Interior Color &amp; Ink
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsColorInterior(false)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      !isColorInterior
                        ? 'bg-purple-950/80 border-purple-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">⚫ Black &amp; White Ink</div>
                    <div className="text-[10px] text-slate-400">~$0.012 / page (Most profitable)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsColorInterior(true)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      isColorInterior
                        ? 'bg-purple-950/80 border-purple-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">🎨 Premium Color Ink</div>
                    <div className="text-[10px] text-slate-400">~$0.070 / page</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Results & Projections (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Royalty Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Estimated Net Royalty
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl md:text-5xl font-extrabold text-purple-400 font-mono">
                  ${calculation.royaltyPerSale.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400">/ book sold</span>
              </div>
            </div>

            {/* Cost Breakdown Table */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>List Price:</span>
                <span className="font-mono font-bold text-white">${listPrice.toFixed(2)}</span>
              </div>

              {format === 'ebook' ? (
                <>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Kindle Royalty Rate:</span>
                    <span className="font-mono text-purple-300">{calculation.royaltyPercentage}%</span>
                  </div>
                  {calculation.deliveryCost !== undefined && calculation.deliveryCost > 0 && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>eBook Delivery Fee:</span>
                      <span className="font-mono text-rose-400">-${calculation.deliveryCost.toFixed(2)}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Print-on-Demand Cost:</span>
                    <span className="font-mono text-rose-400">
                      -${(calculation.printingCost || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Amazon Distribution Share (40%):</span>
                    <span className="font-mono text-slate-500">
                      -${(listPrice * 0.4).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Break-even Min Price:</span>
                    <span className="font-mono text-amber-400">
                      ${calculation.minimumPrice?.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-sm">
                <span className="text-purple-300">Your Take-Home Profit:</span>
                <span className="text-emerald-400 font-mono">
                  ${calculation.royaltyPerSale.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Monthly & Yearly Projections Table */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Sales Volume Projections
              </span>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Monthly Sales</th>
                      <th className="p-2.5 text-right">Monthly Revenue</th>
                      <th className="p-2.5 text-right">Annual Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {calculation.projections.map((p) => {
                      const isTarget = p.unitsSold === 100;
                      return (
                        <tr
                          key={p.unitsSold}
                          className={isTarget ? 'bg-purple-950/40 font-bold' : ''}
                        >
                          <td className="p-2.5 font-mono">
                            {p.unitsSold} units {isTarget && <span className="text-[9px] text-purple-400 ml-1">(Realistic)</span>}
                          </td>
                          <td className="p-2.5 text-right font-mono text-emerald-400">
                            ${p.monthlyRoyalty.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-mono text-purple-400 font-extrabold">
                            ${p.yearlyRoyalty.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Optimization Recommendation Box */}
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 space-y-1 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                <Sparkles size={13} />
                <span>Publishing Optimization Tip</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {format === 'ebook'
                  ? 'Price between $2.99 and $4.99 for maximum conversion velocity while maintaining the 70% royalty tier.'
                  : `At ${listPrice.toFixed(2)}, you keep ${calculation.profitMargin || 60}% net profit margin after Amazon print-on-demand fulfillment.`}
              </p>
            </div>

            {/* Start Book CTA */}
            <button
              onClick={() => onNavigate?.('studio')}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Writing This Book in Studio</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
