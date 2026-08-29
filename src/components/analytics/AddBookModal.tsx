/**
 * KDP Studio — Add Published Book Modal
 * Phase 15B
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Link as LinkIcon,
  Plus,
  ExternalLink,
  Search,
  CheckCircle2,
  Image as ImageIcon,
  DollarSign,
  Layers,
} from 'lucide-react';
import { PublishedBook, MarketPlace, RoyaltyType } from '../../types/analytics';
import { addPublishedBook } from '../../lib/analyticsService';
import { useBookStore } from '../../lib/store';
import { useToastStore } from '../../lib/toastStore';

interface AddBookModalProps {
  uid: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (bookId: string) => void;
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

export const AddBookModal: React.FC<AddBookModalProps> = ({
  uid,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { books: studioBooks } = useBookStore();
  const [activeTab, setActiveTab] = useState<'link' | 'external'>('link');

  // Selected Studio Book ID (if linking)
  const [selectedStudioBookId, setSelectedStudioBookId] = useState<string>('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [asin, setAsin] = useState('');
  const [marketplace, setMarketplace] = useState<MarketPlace>('amazon-us');
  const [royaltyType, setRoyaltyType] = useState<RoyaltyType>('paperback');
  const [royaltyPlan, setRoyaltyPlan] = useState<'35' | '70'>('70');
  const [publishedDate, setPublishedDate] = useState(new Date().toISOString().substring(0, 10));
  const [listPrice, setListPrice] = useState<number | ''>(9.99);
  const [currency, setCurrency] = useState('USD');
  const [pageCount, setPageCount] = useState<number | ''>(100);
  const [trimSize, setTrimSize] = useState('8.5x11');
  const [amazonUrl, setAmazonUrl] = useState('');
  const [kdpDashboardUrl, setKdpDashboardUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [status, setStatus] = useState<PublishedBook['status']>('live');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill from studio book selection
  useEffect(() => {
    if (activeTab === 'link' && selectedStudioBookId) {
      const b = studioBooks.find((sb) => sb.id === selectedStudioBookId);
      if (b) {
        setTitle(b.title || '');
        setSubtitle(b.subtitle || '');
        setAuthor(b.author || '');
        setTrimSize(b.trimSize || '8.5x11');
        setPageCount(b.chapters?.length ? b.chapters.length * 10 : 100);
        if (b.coverData?.frontCoverUrl) {
          setCoverImageUrl(b.coverData.frontCoverUrl);
        }
      }
    }
  }, [selectedStudioBookId, activeTab, studioBooks]);

  if (!isOpen) return null;

  const handleMarketplaceChange = (newMkt: MarketPlace) => {
    setMarketplace(newMkt);
    const mktDef = MARKETPLACE_OPTIONS.find((m) => m.id === newMkt);
    if (mktDef) {
      setCurrency(mktDef.currency);
    }
  };

  const handleLookupAsin = () => {
    if (!title) {
      alert('Please enter a book title first to look up on Amazon.');
      return;
    }
    const query = encodeURIComponent(title);
    window.open(`https://www.amazon.com/s?k=${query}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a book title');
      return;
    }

    setIsSubmitting(true);
    try {
      const newId = await addPublishedBook(uid, {
        uid,
        bookId: activeTab === 'link' && selectedStudioBookId ? selectedStudioBookId : null,
        title: title.trim(),
        subtitle: subtitle.trim(),
        author: author.trim() || 'KDP Author',
        asin: asin.trim().toUpperCase(),
        royaltyType,
        marketplace,
        publishedDate: publishedDate || new Date().toISOString().substring(0, 10),
        listPrice: Number(listPrice) || 9.99,
        currency,
        royaltyPlan,
        pageCount: Number(pageCount) || 100,
        trimSize,
        amazonUrl: amazonUrl.trim() || (asin ? `https://www.amazon.com/dp/${asin}` : ''),
        kdpDashboardUrl: kdpDashboardUrl.trim() || 'https://kdp.amazon.com',
        coverImageUrl: coverImageUrl.trim() || null,
        status,
      });

      useToastStore.getState().addToast({
        message: `Book "${title}" added to Analytics tracking! 📚`,
        type: 'success',
      });

      onSaved(newId);
      onClose();
    } catch (err: any) {
      console.error('Failed to add published book:', err);
      useToastStore.getState().addToast({
        message: err.message || 'Failed to add book',
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
                Catalog
              </span>
              <span className="text-xs text-slate-400">· Add Published Title</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Track Book in Analytics
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'link'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <LinkIcon size={14} />
            <span>Link Studio Book</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('external');
              setSelectedStudioBookId('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'external'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Plus size={14} />
            <span>Add External KDP Book</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Link Existing Studio Book Dropdown */}
          {activeTab === 'link' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Select Manuscript from Book Studio
              </label>
              <select
                value={selectedStudioBookId}
                onChange={(e) => setSelectedStudioBookId(e.target.value)}
                className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="">-- Choose a manuscript ({studioBooks.length} available) --</option>
                {studioBooks.map((sb) => (
                  <option key={sb.id} value={sb.id}>
                    {sb.title} ({sb.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Book Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Book Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Ultimate Brain Games Puzzle Book"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. 100+ Relaxing Puzzles for Adults"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Author / Pen Name
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ASIN & Search Lookup */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Amazon ASIN / ISBN-10
              </label>
              <button
                type="button"
                onClick={handleLookupAsin}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Search size={11} />
                <span>Search on Amazon ↗</span>
              </button>
            </div>
            <input
              type="text"
              value={asin}
              onChange={(e) => setAsin(e.target.value.toUpperCase())}
              placeholder="e.g. B0D123XYZ9"
              maxLength={13}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:border-purple-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              10-character code found under product details on your Amazon listing.
            </p>
          </div>

          {/* Publication Date & Marketplace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Publication Date
              </label>
              <input
                type="date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Primary Marketplace
              </label>
              <select
                value={marketplace}
                onChange={(e) => handleMarketplaceChange(e.target.value as MarketPlace)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                {MARKETPLACE_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.flag} {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Formats & Royalty Options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Format
              </label>
              <select
                value={royaltyType}
                onChange={(e) => setRoyaltyType(e.target.value as RoyaltyType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="paperback">📖 Paperback</option>
                <option value="ebook">📱 eBook</option>
                <option value="hardcover">📚 Hardcover</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Royalty Plan
              </label>
              <select
                value={royaltyPlan}
                onChange={(e) => setRoyaltyPlan(e.target.value as '35' | '70')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="70">70% Standard Plan</option>
                <option value="35">35% Budget Plan</option>
              </select>
            </div>
          </div>

          {/* Pricing & Trim Specs */}
          <div className="grid grid-cols-3 gap-3">
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
                Page Count
              </label>
              <input
                type="number"
                min="1"
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                placeholder="100"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Trim Size
              </label>
              <select
                value={trimSize}
                onChange={(e) => setTrimSize(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="8.5x11">8.5 × 11 in</option>
                <option value="6x9">6 × 9 in</option>
                <option value="8.5x8.5">8.5 × 8.5 in</option>
                <option value="5.5x8.5">5.5 × 8.5 in</option>
              </select>
            </div>
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Amazon Publishing Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="live">🟢 Live on Amazon</option>
              <option value="under-review">🟡 In Review</option>
              <option value="draft">⚪ Draft</option>
              <option value="unpublished">🔴 Unpublished</option>
            </select>
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
                <span>Adding Book...</span>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Start Tracking</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
