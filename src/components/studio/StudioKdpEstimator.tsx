import React, { useState } from 'react';
import {
  Target,
  BookOpen,
  Ruler,
} from 'lucide-react';
import { Book } from '../../types';

interface StudioKdpEstimatorProps {
  book: Book;
  totalWords: number;
}

export const StudioKdpEstimator: React.FC<StudioKdpEstimatorProps> = ({
  book,
  totalWords,
}) => {
  const [manuscriptGoal, setManuscriptGoal] = useState<number>(() => {
    if (book.genre === 'Children\'s') return 5000;
    if (book.genre === 'Non-Fiction') return 35000;
    if (book.genre === 'Fantasy' || book.genre === 'Sci-Fi') return 80000;
    return 50000;
  });

  const wordsPerPage =
    book.trimSize === '8.5x11'
      ? 450
      : book.trimSize === '5x8' || book.trimSize === '5.5x8.5'
      ? 220
      : 250;

  const estimatedPages = Math.max(24, Math.ceil(totalWords / wordsPerPage));

  const isCreamPaper = (book as any).paperType === 'cream';
  const pageMultiplier = isCreamPaper ? 0.0025 : 0.002252;
  const spineWidthInches = (estimatedPages * pageMultiplier).toFixed(3);
  const spineWidthMm = (estimatedPages * (isCreamPaper ? 0.0635 : 0.0572)).toFixed(1);

  let recommendedGutter = '0.375 in (9.6 mm)';
  if (estimatedPages > 500) recommendedGutter = '0.875 in (22.3 mm)';
  else if (estimatedPages > 300) recommendedGutter = '0.75 in (19.1 mm)';
  else if (estimatedPages > 150) recommendedGutter = '0.625 in (15.9 mm)';
  else if (estimatedPages > 100) recommendedGutter = '0.5 in (12.7 mm)';

  const manuscriptProgressPct = Math.min(100, Math.round((totalWords / manuscriptGoal) * 100));

  return (
    <div className="flex flex-col h-full bg-white text-xs text-slate-800 overflow-y-auto p-3 space-y-4">
      {/* 1. Manuscript Progress Goal */}
      <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50/60 rounded-xl border border-purple-200 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Target className="w-4 h-4 text-purple-600" />
            <span>Manuscript Target</span>
          </div>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
            {manuscriptProgressPct}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${manuscriptProgressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>{totalWords.toLocaleString()} written</span>
            <span>{manuscriptGoal.toLocaleString()} goal</span>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-[11px]">
          <span className="text-slate-600">Target Word Count:</span>
          <select
            value={manuscriptGoal}
            onChange={(e) => setManuscriptGoal(Number(e.target.value))}
            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-800 text-[11px] focus:outline-none"
          >
            <option value={10000}>10,000 (Short Story / Novella)</option>
            <option value={25000}>25,000 (Novella / Guide)</option>
            <option value={50000}>50,000 (Standard Novel / NaNoWriMo)</option>
            <option value={75000}>75,000 (Full-Length Fiction)</option>
            <option value={100000}>100,000 (Epic Fantasy / Sci-Fi)</option>
          </select>
        </div>
      </div>

      {/* 2. Amazon KDP Print Spec Calculator */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Ruler className="w-4 h-4 text-purple-600" />
            <span>Amazon KDP Print Specs</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
            {book.trimSize}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500">Est. Book Pages</div>
            <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
              ~{estimatedPages}
            </div>
            <div className="text-[9px] text-slate-400">Based on {wordsPerPage} w/page</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500">Spine Width</div>
            <div className="text-base font-bold text-purple-600 font-mono mt-0.5">
              {spineWidthInches}"
            </div>
            <div className="text-[9px] text-slate-400">{spineWidthMm} mm</div>
          </div>
        </div>

        {/* Technical Margin Specs for KDP Upload */}
        <div className="space-y-1.5 pt-1 text-[11px]">
          <div className="flex items-center justify-between text-slate-600">
            <span>Inside Gutter Margin:</span>
            <span className="font-semibold text-slate-900 font-mono">{recommendedGutter}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Outside Margin:</span>
            <span className="font-semibold text-slate-900 font-mono">0.375 in (9.6 mm)</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Minimum KDP Requirement:</span>
            <span className="font-semibold text-emerald-600">
              {estimatedPages >= 24 ? '✓ Exceeds 24 page min' : '⚠️ Under 24 page min'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Writing Pace & Reading Time */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <BookOpen className="w-4 h-4 text-purple-600" />
          <span>Reader Experience</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between text-slate-600">
            <span>Total Reading Time:</span>
            <span className="font-semibold text-slate-900 font-mono">
              ~{Math.max(1, Math.round(totalWords / 200))} mins ({((totalWords / 200) / 60).toFixed(1)} hrs)
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Average Chapter Length:</span>
            <span className="font-semibold text-slate-900 font-mono">
              {book.chapters.length > 0
                ? Math.round(totalWords / book.chapters.length).toLocaleString()
                : 0}{' '}
              words
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
