/**
 * KDP Studio — New Publishing Goal Modal
 * Phase 15B
 */

import React, { useState } from 'react';
import {
  X,
  Target,
  DollarSign,
  Package,
  BookOpen,
  Trophy,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { PublishedBook, PublishingGoal } from '../../types/analytics';
import { createGoal } from '../../lib/analyticsService';
import { useToastStore } from '../../lib/toastStore';

interface NewGoalModalProps {
  uid: string;
  publishedBooks: PublishedBook[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type GoalType = PublishingGoal['type'];

export const NewGoalModal: React.FC<NewGoalModalProps> = ({
  uid,
  publishedBooks,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [type, setType] = useState<GoalType>('royalties');
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState<number | ''>(500);
  const [unit, setUnit] = useState('$');
  const [period, setPeriod] = useState<PublishingGoal['period']>('monthly');
  const [targetDate, setTargetDate] = useState('');
  const [linkedBookIds, setLinkedBookIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTypeChange = (newType: GoalType) => {
    setType(newType);
    if (newType === 'revenue' || newType === 'royalties') {
      setUnit('$');
      setTargetValue(500);
      setTitle(newType === 'royalties' ? 'Earn $500 in Royalties This Month' : 'Generate $1,000 in Revenue This Month');
    } else if (newType === 'units') {
      setUnit('books');
      setTargetValue(100);
      setTitle('Sell 100 Books This Month');
    } else if (newType === 'books-published') {
      setUnit('books');
      setTargetValue(5);
      setTitle('Publish 5 New Titles This Month');
    } else if (newType === 'bsr') {
      setUnit('BSR');
      setTargetValue(25000);
      setTitle('Reach BSR #25,000 or Better');
    }
  };

  const handleToggleBook = (bookId: string) => {
    setLinkedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetValue || Number(targetValue) <= 0) {
      alert('Please enter a valid target number');
      return;
    }

    setIsSubmitting(true);
    try {
      const defaultTitle =
        type === 'royalties'
          ? `Earn ${unit}${targetValue} in Royalties`
          : type === 'revenue'
          ? `Earn ${unit}${targetValue} in Revenue`
          : type === 'units'
          ? `Sell ${targetValue} Books`
          : type === 'books-published'
          ? `Publish ${targetValue} Books`
          : `Reach BSR #${targetValue}`;

      await createGoal(uid, {
        uid,
        type,
        title: title.trim() || defaultTitle,
        targetValue: Number(targetValue),
        unit,
        period,
        targetDate: targetDate || null,
        linkedBookIds,
      });

      useToastStore.getState().addToast({
        message: `New Publishing Goal created! 🎯`,
        type: 'success',
      });

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to create goal:', err);
      useToastStore.getState().addToast({
        message: err.message || 'Failed to create goal',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950 border border-purple-800/60 text-purple-400 flex items-center justify-center">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Set Publishing Goal</h2>
              <p className="text-xs text-slate-400">Define milestone targets for your KDP catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Goal Type Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Select Goal Objective
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('royalties')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  type === 'royalties'
                    ? 'bg-purple-950/80 border-purple-500 text-white shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign size={16} className="text-purple-400 mb-1" />
                <div className="text-xs font-bold text-white">💰 Royalties Target</div>
                <div className="text-[10px] text-slate-400">Net earnings received</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('units')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  type === 'units'
                    ? 'bg-purple-950/80 border-purple-500 text-white shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package size={16} className="text-emerald-400 mb-1" />
                <div className="text-xs font-bold text-white">📦 Units Sold</div>
                <div className="text-[10px] text-slate-400">Total books sold</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('books-published')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  type === 'books-published'
                    ? 'bg-purple-950/80 border-purple-500 text-white shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen size={16} className="text-blue-400 mb-1" />
                <div className="text-xs font-bold text-white">📚 Books Published</div>
                <div className="text-[10px] text-slate-400">Catalog expansion</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('bsr')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  type === 'bsr'
                    ? 'bg-purple-950/80 border-purple-500 text-white shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy size={16} className="text-amber-400 mb-1" />
                <div className="text-xs font-bold text-white">🏆 BSR Ranking</div>
                <div className="text-[10px] text-slate-400">Reach top rank</div>
              </button>
            </div>
          </div>

          {/* Goal Title */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Goal Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Earn $1,000 in Royalties This Month"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Target Value & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target Metric Value *
              </label>
              <input
                type="number"
                min="1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="500"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Unit / Currency
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="$">$ USD</option>
                <option value="₹">₹ INR</option>
                <option value="£">£ GBP</option>
                <option value="€">€ EUR</option>
                <option value="books">Books / Units</option>
                <option value="BSR">BSR Rank</option>
              </select>
            </div>
          </div>

          {/* Timeframe Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Timeframe
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="monthly">Monthly Recurring</option>
                <option value="yearly">Yearly Target</option>
                <option value="total">Cumulative / All Time</option>
                <option value="one-time">One-time Sprint</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target Deadline (Optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Linked Books (Multi-select) */}
          {publishedBooks.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Count Specific Books Only (Optional)
              </label>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 max-h-36 overflow-y-auto space-y-1.5">
                <div className="text-[11px] text-slate-400 mb-1">
                  {linkedBookIds.length === 0
                    ? 'All published books currently count toward this goal.'
                    : `${linkedBookIds.length} book(s) selected.`}
                </div>
                {publishedBooks.map((b) => {
                  const isChecked = linkedBookIds.includes(b.id);
                  return (
                    <label
                      key={b.id}
                      className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleBook(b.id)}
                        className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                      />
                      <span className="line-clamp-1">{b.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

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
                <span>Creating Goal...</span>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Create Goal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
