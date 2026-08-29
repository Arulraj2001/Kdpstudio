/**
 * KDP Studio — Add Sales Data Entry Modal
 * Phase 15B
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  TrendingUp,
  BookOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  PublishedBook,
  MarketPlace,
  RoyaltyType,
  BookPerformanceEntry,
} from '../../types/analytics';
import {
  addPerformanceEntry,
  convertToUSD,
  EXCHANGE_RATES,
} from '../../lib/analyticsService';
import {
  calculateEbookRoyalty,
  calculatePaperbackRoyalty,
  MARKETPLACE_ROYALTY_RATES,
} from '../../lib/royaltyCalculator';
import { useToastStore } from '../../lib/toastStore';

interface AddEntryModalProps {
  book: PublishedBook;
  uid: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
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

export const AddEntryModal: React.FC<AddEntryModalProps> = ({
  book,
  uid,
  isOpen,
  onClose,
  onSaved,
}) => {
  // Default to yesterday
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().substring(0, 10);
  }, []);

  const [date, setDate] = useState(yesterdayStr);
  const [marketplace, setMarketplace] = useState<MarketPlace>(book.marketplace || 'amazon-us');
  const [royaltyType, setRoyaltyType] = useState<RoyaltyType>(book.royaltyType || 'paperback');

  const [unitsSold, setUnitsSold] = useState<number | ''>(1);
  const [unitsReturned, setUnitsReturned] = useState<number | ''>(0);

  const [listPrice, setListPrice] = useState<number | ''>(book.listPrice || 9.99);
  const [royaltyEarned, setRoyaltyEarned] = useState<number | ''>('');
  const [currency, setCurrency] = useState(book.currency || 'USD');

  // Collapsible sections
  const [showRankings, setShowRankings] = useState(false);
  const [bsr, setBsr] = useState<number | ''>('');
  const [categoryRank, setCategoryRank] = useState<number | ''>('');
  const [categoryName, setCategoryName] = useState('');

  const [showKenp, setShowKenp] = useState(false);
  const [kenpPageReads, setKenpPageReads] = useState<number | ''>('');
  const [kenpRoyalty, setKenpRoyalty] = useState<number | ''>('');

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Auto-calculated helpers
  const numSold = Number(unitsSold) || 0;
  const numReturned = Number(unitsReturned) || 0;
  const netUnits = Math.max(0, numSold - numReturned);

  const numRoyaltyEarned = Number(royaltyEarned) || 0;
  const revenueUSD = convertToUSD(numRoyaltyEarned, currency);
  const numListPrice = Number(listPrice) || 0;
  const grossRevenue = Number((numSold * numListPrice).toFixed(2));

  // Live estimated royalty preview
  const estimatedRoyaltyPerSale = useMemo(() => {
    if (royaltyType === 'ebook') {
      return calculateEbookRoyalty(numListPrice, book.royaltyPlan || '70', marketplace).royaltyPerSale;
    }
    return calculatePaperbackRoyalty(
      numListPrice,
      book.pageCount || 100,
      marketplace,
      false,
      royaltyType === 'hardcover'
    ).royaltyPerSale;
  }, [numListPrice, book.royaltyPlan, book.pageCount, marketplace, royaltyType]);

  const estimatedTotalRoyalty = Number((netUnits * estimatedRoyaltyPerSale).toFixed(2));

  const handleMarketplaceChange = (newMkt: MarketPlace) => {
    setMarketplace(newMkt);
    const mktDef = MARKETPLACE_OPTIONS.find((m) => m.id === newMkt);
    if (mktDef) {
      setCurrency(mktDef.currency);
    }
  };

  const handleApplyEstimate = () => {
    setRoyaltyEarned(estimatedTotalRoyalty);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      alert('Please select a date');
      return;
    }

    setIsSubmitting(true);
    try {
      const dateObj = new Date(date);
      const year = isNaN(dateObj.getFullYear()) ? new Date().getFullYear() : dateObj.getFullYear();
      const month = date.substring(0, 7);
      const week = `${year}-W${Math.ceil((dateObj.getDate() + dateObj.getDay()) / 7)}`;

      await addPerformanceEntry(uid, {
        uid,
        bookId: book.id,
        date,
        week,
        month,
        year,
        marketplace,
        royaltyType,
        unitsSold: numSold,
        unitsReturned: numReturned,
        grossRevenue,
        royaltyEarned: numRoyaltyEarned,
        currency,
        bsr: bsr ? Number(bsr) : null,
        categoryRank: categoryRank ? Number(categoryRank) : null,
        categoryName: categoryName.trim() || null,
        kenpPageReads: Number(kenpPageReads) || 0,
        kenpRoyalty: Number(kenpRoyalty) || 0,
        entryMethod: 'manual',
        notes: notes.trim(),
      });

      useToastStore.getState().addToast({
        message: `Sales entry recorded for "${book.title}"! 📈`,
        type: 'success',
      });

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save performance entry:', err);
      useToastStore.getState().addToast({
        message: err.message || 'Failed to save entry',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60">
                Data Entry
              </span>
              <span className="text-xs text-slate-400">· KDP Sales Logger</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 line-clamp-1">
              Add Sales Data — {book.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Disclaimer Ribbon */}
        <div className="bg-slate-950/80 px-6 py-2 border-b border-slate-850 flex items-center gap-2 text-[11px] text-slate-400">
          <Info size={13} className="text-purple-400 shrink-0" />
          <span>Entries can be edited within 24 hours of recording.</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* SECTION 1: PERIOD & MARKETPLACE */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar size={13} className="text-purple-400" />
              <span>Period &amp; Marketplace</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Sales Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Amazon Marketplace
                </label>
                <select
                  value={marketplace}
                  onChange={(e) => handleMarketplaceChange(e.target.value as MarketPlace)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                >
                  {MARKETPLACE_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.flag} {m.name} ({m.currency})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Royalty Format Type */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Book Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['paperback', 'ebook', 'hardcover'] as RoyaltyType[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setRoyaltyType(fmt)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                      royaltyType === fmt
                        ? 'bg-purple-600 border-purple-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fmt === 'ebook' ? '📱 eBook' : fmt === 'paperback' ? '📖 Paperback' : '📚 Hardcover'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: SALES QUANTITIES */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-emerald-400" />
              <span>Units &amp; Orders</span>
            </h3>

            <div className="grid grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Units Sold
                </label>
                <input
                  type="number"
                  min="0"
                  value={unitsSold}
                  onChange={(e) => setUnitsSold(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Returns
                </label>
                <input
                  type="number"
                  min="0"
                  value={unitsReturned}
                  onChange={(e) => setUnitsReturned(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Net Sold</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">
                  {netUnits} units
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: REVENUE & ROYALTIES */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <DollarSign size={13} className="text-amber-400" />
                <span>Revenue &amp; Royalties</span>
              </h3>
              {estimatedTotalRoyalty > 0 && (
                <button
                  type="button"
                  onClick={handleApplyEstimate}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={11} />
                  <span>Auto-fill ~{currency} {estimatedTotalRoyalty}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  List Price ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="9.99"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Royalty Earned ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={royaltyEarned}
                  onChange={(e) => setRoyaltyEarned(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">USD Value (~Totals)</span>
                <span className="text-sm font-extrabold text-white font-mono">
                  ${revenueUSD} USD
                </span>
              </div>
            </div>

            {/* Live KDP Estimate Callout */}
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400 shrink-0" />
                <span>
                  Expected standard KDP rate: <strong>~${estimatedRoyaltyPerSale}</strong> / sale
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {netUnits} units = ~${estimatedTotalRoyalty}
              </span>
            </div>
          </div>

          {/* SECTION 4: BSR RANKINGS (COLLAPSIBLE) */}
          <div className="pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowRankings(!showRankings)}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <BookOpen size={13} className="text-blue-400" />
                <span>Amazon Best Seller Rank (Optional)</span>
              </div>
              {showRankings ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {showRankings && (
              <div className="mt-3 space-y-3 p-3 rounded-2xl bg-slate-950 border border-slate-850">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Best Seller Rank (BSR)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bsr}
                      onChange={(e) => setBsr(e.target.value === '' ? '' : parseInt(e.target.value))}
                      placeholder="e.g. 45200"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Lower BSR = more sales. Find on your Amazon product details.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Category Rank
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={categoryRank}
                      onChange={(e) => setCategoryRank(e.target.value === '' ? '' : parseInt(e.target.value))}
                      placeholder="e.g. #12 in Puzzle Books"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. Books > Puzzles & Games > Word Search"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: KINDLE UNLIMITED (COLLAPSIBLE) */}
          <div className="pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowKenp(!showKenp)}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <BookOpen size={13} className="text-pink-400" />
                <span>Kindle Unlimited / KENP Pages (Optional)</span>
              </div>
              {showKenp ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {showKenp && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-850">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    KENP Pages Read
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={kenpPageReads}
                    onChange={(e) => setKenpPageReads(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="e.g. 350"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    KENP Royalty ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={kenpRoyalty}
                    onChange={(e) => setKenpRoyalty(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="e.g. 1.45"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: NOTES */}
          <div className="pt-3 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ran Free Promo Day / Price change to $7.99 / Mother's Day spike"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Recording Entry...</span>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Save Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
