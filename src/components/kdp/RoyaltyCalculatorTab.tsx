import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, AlertTriangle, CheckCircle2, Sliders, Info } from 'lucide-react';
import { useBookStore } from '../../lib/store';
import { TrimSize, PaperType } from '../../types';
import { calculateCoverDimensions } from '../../lib/kdp';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const RoyaltyCalculatorTab: React.FC = () => {
  const { currentBook } = useBookStore();

  // Book parameters
  const [format, setFormat] = useState<'paperback' | 'ebook' | 'hardcover'>('paperback');
  const [listPrice, setListPrice] = useState<number>(14.99);
  const [pageCount, setPageCount] = useState<number>(
    currentBook?.chapters?.reduce((acc, c) => acc + Math.ceil(c.wordCount / 300), 24) || 240
  );
  const [trimSize, setTrimSize] = useState<TrimSize>(currentBook?.trimSize || '6x9');
  const [paperType, setPaperType] = useState<PaperType>(currentBook?.paperType || 'cream');
  const [ebookPlan, setEbookPlan] = useState<'70' | '35'>('70');
  const [ebookFileSizeMb, setEbookFileSizeMb] = useState<number>(1.5);
  const [monthlySalesEst, setMonthlySalesEst] = useState<number>(100);

  // KDP Paperback & Hardcover printing formulas
  const calculatePrintingCost = (pages: number, paper: PaperType, fmt: 'paperback' | 'ebook' | 'hardcover') => {
    if (fmt === 'ebook') return 0;

    const pageRate = paper === 'cream' ? 0.0125 : 0.012;
    if (fmt === 'hardcover') {
      const baseFixed = 5.65;
      return Number(Math.max(6.5, baseFixed + pages * pageRate).toFixed(2));
    }

    // Paperback
    const baseFixed = 1.0;
    const raw = baseFixed + Math.max(24, pages) * pageRate;
    return Number(Math.max(2.15, raw).toFixed(2));
  };

  const printingCost = calculatePrintingCost(pageCount, paperType, format);

  // Delivery fee for eBook 70% plan: $0.15/MB in US
  const deliveryFee = format === 'ebook' && ebookPlan === '70' ? Number((ebookFileSizeMb * 0.15).toFixed(2)) : 0;

  // Minimum required price
  const minPaperbackPrice = Number((printingCost / 0.6).toFixed(2));
  const minExpandedPrice = Number((printingCost / 0.4).toFixed(2));

  // Royalties calculation
  let authorRoyalty = 0;
  let amazonCut = 0;
  let expandedRoyalty = 0;

  if (format === 'paperback' || format === 'hardcover') {
    const rawRoyalty = listPrice * 0.6 - printingCost;
    authorRoyalty = Math.max(0, Number(rawRoyalty.toFixed(2)));
    expandedRoyalty = Math.max(0, Number((listPrice * 0.4 - printingCost).toFixed(2)));
    amazonCut = Number((listPrice - authorRoyalty - printingCost).toFixed(2));
  } else {
    // eBook
    if (ebookPlan === '70') {
      const raw = listPrice * 0.7 - deliveryFee;
      authorRoyalty = Math.max(0, Number(raw.toFixed(2)));
      amazonCut = Number((listPrice - authorRoyalty).toFixed(2));
    } else {
      authorRoyalty = Number((listPrice * 0.35).toFixed(2));
      amazonCut = Number((listPrice * 0.65).toFixed(2));
    }
  }

  const profitMargin = listPrice > 0 ? Number(((authorRoyalty / listPrice) * 100).toFixed(1)) : 0;
  const monthlyEarnings = Number((authorRoyalty * monthlySalesEst).toFixed(2));
  const annualEarnings = Number((monthlyEarnings * 12).toFixed(2));

  // Chart data comparing price points
  const pricePoints = [4.99, 7.99, 9.99, 12.99, 14.99, 17.99, 19.99, 24.99];
  const chartData = pricePoints.map((p) => {
    let author = 0;
    let amazon = 0;
    let print = 0;

    if (format === 'paperback' || format === 'hardcover') {
      print = printingCost;
      author = Math.max(0, Number((p * 0.6 - print).toFixed(2)));
      amazon = Number(Math.max(0, p - author - print).toFixed(2));
    } else {
      if (p >= 2.99 && p <= 9.99) {
        author = Math.max(0, Number((p * 0.7 - deliveryFee).toFixed(2)));
        amazon = Number((p - author).toFixed(2));
      } else {
        author = Number((p * 0.35).toFixed(2));
        amazon = Number((p * 0.65).toFixed(2));
      }
    }

    return {
      price: `$${p}`,
      authorRoyalty: author,
      amazonShare: amazon,
      printingCost: print,
      isCurrent: Math.abs(p - listPrice) < 1.0,
    };
  });

  return (
    <div id="kdp-royalty-calculator-tab" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calculator size={18} className="text-purple-600" />
            <span>Official Amazon KDP Royalty & Printing Cost Calculator</span>
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Calculates exact author take-home profit, Amazon 60%/70% cuts, delivery fees, and page manufacturing costs
            aligned with 2025 Amazon KDP rate sheets.
          </p>
        </div>

        {/* Format Selector Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl self-start md:self-center">
          <button
            onClick={() => setFormat('paperback')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              format === 'paperback' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paperback (60%)
          </button>
          <button
            onClick={() => setFormat('ebook')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              format === 'ebook' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kindle eBook (70%/35%)
          </button>
          <button
            onClick={() => setFormat('hardcover')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              format === 'hardcover' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hardcover
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs + Financial Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Book Pricing Parameters
          </h4>

          {/* List Price Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              List Price ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0.99"
                max="250.00"
                value={listPrice}
                onChange={(e) => setListPrice(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 text-sm font-bold text-slate-900 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {format !== 'ebook' && listPrice < minPaperbackPrice && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 font-semibold">
                <AlertTriangle size={12} />
                <span>Price must be at least ${minPaperbackPrice} to cover printing.</span>
              </div>
            )}
          </div>

          {/* Page Count */}
          {format !== 'ebook' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Total Page Count</label>
                <span className="text-[11px] text-slate-500 font-medium">{pageCount} pages</span>
              </div>
              <input
                type="number"
                min={24}
                max={828}
                value={pageCount}
                onChange={(e) => setPageCount(parseInt(e.target.value) || 24)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Trim Size */}
          {format !== 'ebook' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Trim Size</label>
              <select
                value={trimSize}
                onChange={(e) => setTrimSize(e.target.value as TrimSize)}
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="5x8">5" × 8" (Pocket Fiction)</option>
                <option value="5.5x8.5">5.5" × 8.5" (Trade Paperback)</option>
                <option value="6x9">6" × 9" (Industry Standard Standard)</option>
                <option value="8.5x11">8.5" × 11" (Workbook / Manual)</option>
              </select>
            </div>
          )}

          {/* Paper Type */}
          {format !== 'ebook' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Interior Paper</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperType('white')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    paperType === 'white'
                      ? 'bg-purple-50 border-purple-300 text-purple-800 ring-1 ring-purple-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  White Paper (50#)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperType('cream')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    paperType === 'cream'
                      ? 'bg-amber-50/80 border-amber-300 text-amber-900 ring-1 ring-amber-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  Cream Paper (Fiction)
                </button>
              </div>
            </div>
          )}

          {/* eBook Specifics */}
          {format === 'ebook' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">eBook Royalty Plan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEbookPlan('70')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                      ebookPlan === '70'
                        ? 'bg-purple-50 border-purple-300 text-purple-800 ring-1 ring-purple-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    70% Plan ($2.99–$9.99)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEbookPlan('35')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                      ebookPlan === '35'
                        ? 'bg-purple-50 border-purple-300 text-purple-800 ring-1 ring-purple-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    35% Plan (All Prices)
                  </button>
                </div>
              </div>

              {ebookPlan === '70' && (
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>eBook File Size (MB)</span>
                    <span className="text-slate-500 font-normal">{ebookFileSizeMb} MB (${deliveryFee} fee)</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="10.0"
                    step="0.1"
                    value={ebookFileSizeMb}
                    onChange={(e) => setEbookFileSizeMb(parseFloat(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Financial Results & Projections (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Key Metrics Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Author Net Royalty */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Your Royalty / Copy
              </span>
              <div className="text-2xl font-black text-emerald-700">${authorRoyalty.toFixed(2)}</div>
              <div className="text-[11px] text-emerald-700 font-medium">
                Profit Margin: <strong>{profitMargin}%</strong>
              </div>
            </div>

            {/* Printing / Delivery Cost */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {format === 'ebook' ? 'eBook Delivery Cost' : 'KDP Printing Cost'}
              </span>
              <div className="text-2xl font-black text-slate-800">
                ${format === 'ebook' ? deliveryFee.toFixed(2) : printingCost.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500">
                {format === 'ebook' ? '$0.15 per megabyte' : `Base $1.00 + ${pageCount} pp`}
              </div>
            </div>

            {/* Amazon Platform Cut */}
            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
                Amazon Marketplace Share
              </span>
              <div className="text-2xl font-black text-purple-900">${amazonCut.toFixed(2)}</div>
              <div className="text-[11px] text-purple-700">
                {format === 'paperback' ? 'Amazon 40% distribution' : 'Platform fee'}
              </div>
            </div>
          </div>

          {/* Recharts Royalty Comparison Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Author Royalty Comparison Across List Prices
                </h4>
                <p className="text-[11px] text-slate-500">
                  See how changing your retail list price dramatically multiplies your net royalties per unit.
                </p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="price" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [`$${value}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="authorRoyalty" name="Your Net Royalty ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="amazonShare" name="Amazon Share ($)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  {format !== 'ebook' && (
                    <Bar dataKey="printingCost" name="Printing Cost ($)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Sales & Earnings Simulator */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-600" />
                <span>Monthly Author Earnings Simulator</span>
              </h4>
              <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                {monthlySalesEst} Copies / Month
              </span>
            </div>

            <div>
              <input
                type="range"
                min="10"
                max="2000"
                step="10"
                value={monthlySalesEst}
                onChange={(e) => setMonthlySalesEst(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>10 copies/mo</span>
                <span>500 copies/mo</span>
                <span>1,000 copies/mo</span>
                <span>2,000+ copies/mo</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-800">Projected Monthly Revenue</span>
                <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                  ${monthlyEarnings.toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                <span className="text-[10px] uppercase font-bold text-purple-800">Projected Annual Net Profit</span>
                <div className="text-xl font-extrabold text-purple-900 mt-0.5">
                  ${annualEarnings.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
