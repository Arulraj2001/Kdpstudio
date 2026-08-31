import React, { useState } from 'react';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  BookOpen, 
  Layers, 
  Sliders, 
  Globe, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Printer,
  Copy,
  Check
} from 'lucide-react';
import { 
  KDP_MARKETPLACES, 
  Marketplace, 
  BookBinding, 
  InkType, 
  TrimCategory, 
  calculateKdpRoyalty 
} from '../../lib/kdpCalculatorEngine';
import { SEOHead } from '../seo/SEOHead';
import { PageRoute } from '../../types';

interface KdpRoyaltyCalculatorViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const KdpRoyaltyCalculatorView: React.FC<KdpRoyaltyCalculatorViewProps> = ({ onNavigate }) => {
  const [marketplace, setMarketplace] = useState<Marketplace>('US');
  const [binding, setBinding] = useState<BookBinding>('paperback');
  const [inkType, setInkType] = useState<InkType>('black_and_white');
  const [trimCategory, setTrimCategory] = useState<TrimCategory>('regular');
  const [pageCount, setPageCount] = useState<number>(120);
  const [listPrice, setListPrice] = useState<number>(9.99);
  const [expandedDistribution, setExpandedDistribution] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const calc = calculateKdpRoyalty({
    marketplace,
    binding,
    inkType,
    trimCategory,
    pageCount,
    listPrice,
    expandedDistribution
  });

  const handleCopySummary = () => {
    const summary = `KDP Royalty Calculation:
Marketplace: ${calc.marketplace.name}
Binding: ${binding.toUpperCase()} | Ink: ${inkType.replace('_', ' ').toUpperCase()} | Pages: ${pageCount}
List Price: ${calc.marketplace.currencySymbol}${listPrice}
Amazon Print Cost: ${calc.marketplace.currencySymbol}${calc.printingCost}
Net Royalty / Sale: ${calc.marketplace.currencySymbol}${calc.royaltyPerSale} (${calc.profitMarginPercent}% Margin)
Amazon Cut: ${calc.marketplace.currencySymbol}${calc.amazonCut}
Calculated with KDP Studio Royalty Engine (https://kdpstudio-aio.web.app/tools/royalty-calculator)`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20">
      <SEOHead
        pageKey="pricing"
        title="Amazon KDP Royalty & Print Cost Calculator — KDP Studio"
        description="Calculate exact Amazon KDP print costs, royalties, and profit margins for paperbacks and hardcovers across all global Amazon marketplaces."
        canonicalPath="/tools/royalty-calculator"
      />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Calculator size={14} className="text-purple-400" />
            <span>Official Amazon KDP Math Engine</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Amazon KDP <span className="font-serif italic font-normal text-purple-400">Royalty &amp; Print Cost Calculator</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Input your page count, trim size, and list price to instantly compute exact Amazon print costs, net profit margins, and royalties across 13 global Amazon marketplaces.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ── LEFT COLUMN: INPUT CONTROLS ── */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Sliders size={18} className="text-purple-600" />
              <span>Book Specifications</span>
            </h2>

            {/* Marketplace Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={14} className="text-purple-600" />
                <span>Primary Amazon Marketplace</span>
              </label>
              <select
                value={marketplace}
                onChange={(e) => {
                  const newMp = e.target.value as Marketplace;
                  setMarketplace(newMp);
                  setListPrice(KDP_MARKETPLACES[newMp].defaultPrice);
                }}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all cursor-pointer"
              >
                {Object.values(KDP_MARKETPLACES).map((mp) => (
                  <option key={mp.code} value={mp.code}>
                    {mp.name} ({mp.currencySymbol} {mp.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Binding Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={14} className="text-purple-600" />
                <span>Book Binding</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBinding('paperback')}
                  className={`py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    binding === 'paperback'
                      ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>📖 Paperback</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBinding('hardcover')}
                  className={`py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    binding === 'hardcover'
                      ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>📚 Hardcover</span>
                </button>
              </div>
            </div>

            {/* Ink Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Printer size={14} className="text-purple-600" />
                <span>Interior Ink &amp; Paper</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'black_and_white', label: 'Black & White', desc: 'Standard 55# white/cream' },
                  { key: 'standard_color', label: 'Standard Color', desc: 'Budget color (Paperback only)' },
                  { key: 'premium_color', label: 'Premium Color', desc: '70# vibrant photo/art' }
                ].map((item) => {
                  const isDisabled = binding === 'hardcover' && item.key === 'standard_color';
                  return (
                    <button
                      key={item.key}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setInkType(item.key as InkType)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        inkType === item.key
                          ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm'
                          : isDisabled
                          ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-100'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trim Size Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-purple-600" />
                <span>Trim Size Format</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTrimCategory('regular')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    trimCategory === 'regular'
                      ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Standard Trim (≤ 6.12" × 9")</div>
                  <div className="text-[10px] text-slate-500">5×8", 5.25×8", 5.5×8.5", 6×9"</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTrimCategory('large')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    trimCategory === 'large'
                      ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Large Trim (&gt; 6.12" × 9")</div>
                  <div className="text-[10px] text-slate-500">7×10", 8×10", 8.5×8.5", 8.5×11"</div>
                </button>
              </div>
            </div>

            {/* Page Count Slider */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="uppercase tracking-wider">Page Count</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-900 rounded-full font-black text-sm">
                  {pageCount} Pages
                </span>
              </div>
              <input
                type="range"
                min={24}
                max={600}
                step={2}
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                <span>24 pages (Min)</span>
                <span>120 (Standard)</span>
                <span>300 (Thick)</span>
                <span>600 pages (Max)</span>
              </div>
            </div>

            {/* List Price Input */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="uppercase tracking-wider">Your Retail List Price</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Min required: <strong className="text-slate-800">{calc.marketplace.currencySymbol}{calc.minListPrice}</strong>
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                  {calc.marketplace.currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.50"
                  min={calc.minListPrice}
                  max={250}
                  value={listPrice}
                  onChange={(e) => setListPrice(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-black text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Expanded Distribution Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={expandedDistribution}
                  onChange={(e) => setExpandedDistribution(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Enable Amazon Expanded Distribution (40% rate)</span>
                  <p className="text-slate-500 text-[11px]">Distributes paperback to libraries and bookstores outside Amazon.</p>
                </div>
              </label>
            </div>

          </div>

          {/* ── RIGHT COLUMN: RESULTS & MARGIN DASHBOARD ── */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Main Profit Card */}
            <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-purple-800/40 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-purple-300">
                    Net Profit per Copy
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-emerald-400 mt-1 font-display">
                    {calc.marketplace.currencySymbol}{calc.royaltyPerSale}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Margin
                  </span>
                  <div className="text-2xl font-black text-purple-200 mt-1">
                    {calc.profitMarginPercent}%
                  </div>
                </div>
              </div>

              {/* Breakdown Rows */}
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-slate-300">Amazon Print Cost:</span>
                  <span className="font-bold text-rose-300">
                    - {calc.marketplace.currencySymbol}{calc.printingCost}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-slate-300">Amazon Marketplace Fee:</span>
                  <span className="font-bold text-amber-300">
                    - {calc.marketplace.currencySymbol}{calc.amazonCut}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-slate-300">Your List Price:</span>
                  <span className="font-bold text-white">
                    {calc.marketplace.currencySymbol}{listPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Status Alert */}
              {calc.isProfitable ? (
                <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>
                    <strong>Profitable!</strong> Sell <strong>{calc.breakEvenCopiesFor1000Revenue} copies</strong> to earn {calc.marketplace.currencySymbol}1,000 in royalties.
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
                  <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                  <span>
                    <strong>Unprofitable.</strong> Increase list price to at least {calc.marketplace.currencySymbol}{calc.minListPrice} to earn positive royalties.
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Summary Copied!' : 'Copy Summary'}</span>
                </button>
              </div>

            </div>

            {/* Quick Recommendation Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg space-y-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-black text-slate-900">
                <TrendingUp size={16} className="text-purple-600" />
                <span>Pricing Strategy Tips</span>
              </div>
              <ul className="space-y-2.5 text-slate-600 text-xs leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Sweet Spot:</strong> 6×9" paperbacks with 100–140 pages price best between <strong>$8.99 and $12.99</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Standard vs Premium Color:</strong> Standard Color cuts printing costs by ~45%, ideal for charts and recipe books.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Format in KDP Studio:</strong> Ready to typeset this book? Use our 1-click interior generator.</span>
                </li>
              </ul>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>Build Book in KDP Studio</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
