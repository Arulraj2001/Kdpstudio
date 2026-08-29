/**
 * Series Create Wizard — 4-Step Series Setup
 * Phase 12B — KDP Studio
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Palette, 
  BookOpen, 
  Check, 
  Plus, 
  Trash2, 
  Sliders, 
  Layout, 
  BookMarked,
  HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useSeriesStore } from '../../lib/seriesStore';
import { useBookStore } from '../../lib/store';
import { useToastStore } from '../../lib/toastStore';
import { 
  BookSeries, 
  SeriesCoverStyle, 
  SeriesColorScheme, 
  DEFAULT_SERIES_COVER_STYLE, 
  DEFAULT_SERIES_SPINE_STYLE, 
  DEFAULT_SERIES_COLOR_SCHEME,
  computeVolumeColors,
  interpolateColors
} from '../../types/series';
import { PageRoute } from '../../types';

const GENRES = [
  'Fiction', 'Fantasy', 'Sci-Fi', 'Romance', 'Mystery & Thriller', 
  'Historical Fiction', 'Young Adult', 'Children\'s Books', 'Non-Fiction', 
  'Self-Help & Personal Growth', 'Business & Money', 'Health & Fitness', 'Poetry'
];

interface SeriesCreateWizardViewProps {
  onNavigate: (route: PageRoute, params?: Record<string, string>) => void;
}

export const SeriesCreateWizardView: React.FC<SeriesCreateWizardViewProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const { createSeries, isSaving } = useSeriesStore();
  const { books: userBooks } = useBookStore();
  const { addToast } = useToastStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Identity
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [genre, setGenre] = useState('Fantasy');
  const [targetAudience, setTargetAudience] = useState('');
  const [totalVolumes, setTotalVolumes] = useState(3);
  const [description, setDescription] = useState('');
  const [isSuggestingTitle, setIsSuggestingTitle] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  // Step 2: Cover Style
  const [coverStyle, setCoverStyle] = useState<SeriesCoverStyle>(DEFAULT_SERIES_COVER_STYLE);

  // Step 3: Color Scheme
  const [colorMode, setColorMode] = useState<'fixed' | 'rotating' | 'progressive'>('progressive');
  const [palette, setPalette] = useState<string[]>(['#7c3aed', '#4f46e5', '#3b82f6', '#06b6d4', '#10b981']);
  const [startColor, setStartColor] = useState('#7c3aed');
  const [endColor, setEndColor] = useState('#06b6d4');
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);

  // Step 4: Existing Books
  const [selectedBookIds, setSelectedBookIds] = useState<{ bookId: string; volumeNumber: number }[]>([]);
  const [plannedVolumes, setPlannedVolumes] = useState<{ volumeNumber: number; title: string }[]>([]);

  // Calculate live volume colors
  const activeColorScheme: SeriesColorScheme = {
    mode: colorMode,
    palette,
    startColor,
    endColor,
    primaryColors: computeVolumeColors({ mode: colorMode, palette, startColor, endColor, primaryColors: [] }, totalVolumes),
  };

  const getScopeLabel = (vols: number) => {
    if (vols === 2) return 'Duology (2 Books)';
    if (vols === 3) return 'Trilogy (3 Books)';
    if (vols <= 6) return `Series (${vols} Books)`;
    return `Extended Epic (${vols} Books)`;
  };

  // AI Suggest Series Titles
  const handleSuggestTitles = async () => {
    setIsSuggestingTitle(true);
    try {
      const res = await fetch('/api/series/suggest-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, targetAudience, theme: subtitle }),
      });
      const data = await res.json();
      if (data.titles && data.titles.length > 0) {
        setTitle(data.titles[0]);
        addToast({
          type: 'success',
          title: 'AI Title Suggested',
          message: `Suggested: "${data.titles[0]}" (Other options: ${data.titles.slice(1).join(', ')})`,
        });
      }
    } catch {
      setTitle(`The ${genre} Chronicles`);
    } finally {
      setIsSuggestingTitle(false);
    }
  };

  // AI Generate Series Description
  const handleGenerateDesc = async () => {
    if (!title.trim()) {
      addToast({ type: 'warning', title: 'Enter a Title', message: 'Please enter a series title first.' });
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const res = await fetch('/api/series/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, genre, targetAudience, totalVolumes, theme: subtitle }),
      });
      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
      }
    } catch {
      setDescription(`Follow the thrilling ${totalVolumes}-book ${genre} collection "${title}".`);
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  // AI Generate Palette
  const handleGenerateAiPalette = async () => {
    setIsGeneratingPalette(true);
    try {
      const res = await fetch('/api/brand/generate-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vibe: `${genre} series about ${title || 'epic journeys'}`, genre }),
      });
      const data = await res.json();
      if (data.primaryColor && data.secondaryColor) {
        setStartColor(data.primaryColor);
        setEndColor(data.secondaryColor);
        setPalette([data.primaryColor, data.secondaryColor, data.accentColor, '#0f172a', '#f8fafc']);
        addToast({ type: 'success', title: 'Palette Generated', message: 'Harmonious series colors created.' });
      }
    } catch {
      setStartColor('#6366f1');
      setEndColor('#ec4899');
    } finally {
      setIsGeneratingPalette(false);
    }
  };

  // Handle Book Selection toggle in Step 4
  const toggleBookSelection = (bookId: string) => {
    if (selectedBookIds.some((b) => b.bookId === bookId)) {
      setSelectedBookIds(selectedBookIds.filter((b) => b.bookId !== bookId));
    } else {
      const nextVol = selectedBookIds.length + 1;
      setSelectedBookIds([...selectedBookIds, { bookId, volumeNumber: nextVol }]);
    }
  };

  const updateBookVolumeNumber = (bookId: string, volumeNumber: number) => {
    setSelectedBookIds(
      selectedBookIds.map((b) => (b.bookId === bookId ? { ...b, volumeNumber } : b))
    );
  };

  // Final Submit
  const handleCreateSeries = async () => {
    if (!user?.uid) return;
    if (!title.trim()) {
      addToast({ type: 'error', title: 'Title Required', message: 'Please enter a series title.' });
      setCurrentStep(1);
      return;
    }

    try {
      // Build ordered book IDs
      const sortedSelected = [...selectedBookIds].sort((a, b) => a.volumeNumber - b.volumeNumber);
      const bookIds = sortedSelected.map((s) => s.bookId);

      const seriesId = await createSeries(user.uid, {
        uid: user.uid,
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        genre,
        targetAudience: targetAudience.trim(),
        totalVolumes,
        bookIds,
        puzzleBookIds: [],
        volumes: plannedVolumes.map((p) => ({
          volumeNumber: p.volumeNumber,
          bookId: null,
          title: p.title || `Volume ${p.volumeNumber}`,
          subtitle: '',
          status: 'planned',
          publishedDate: null,
          amazonUrl: null,
          coverImageUrl: null,
          pageCount: null,
          price: null,
        })),
        coverStyle,
        spineStyle: DEFAULT_SERIES_SPINE_STYLE,
        colorScheme: activeColorScheme,
        seriesKeywords: [genre, title, 'Bestselling Series', 'Kindle Series'],
        amazonSeriesUrl: '',
        status: 'active',
      });

      onNavigate('series-detail', { id: seriesId });
    } catch (err: any) {
      // Toast already shown in seriesStore
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('series')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to All Series</span>
        </button>
        <span className="text-xs font-semibold text-slate-400">Step {currentStep} of 4</span>
      </div>

      {/* Step Indicator Wizard Bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, label: 'Identity', icon: BookMarked },
          { num: 2, label: 'Cover Style', icon: Layout },
          { num: 3, label: 'Color Scheme', icon: Palette },
          { num: 4, label: 'Add Books', icon: BookOpen },
        ].map((step) => {
          const isDone = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          const Icon = step.icon;

          return (
            <div
              key={step.num}
              onClick={() => isDone && setCurrentStep(step.num as any)}
              className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center gap-1.5 ${
                isCurrent
                  ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold shadow-xs'
                  : isDone
                  ? 'bg-white border-emerald-200 text-emerald-700 cursor-pointer hover:bg-emerald-50/50'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                {isDone ? <Check size={14} className="text-emerald-600" /> : <Icon size={14} />}
                <span>{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN WIZARD CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        {/* STEP 1: SERIES IDENTITY */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Step 1: Series Identity</h2>
              <p className="text-xs text-slate-500 mt-1">
                Define the name, genre, scope, and premise of your book collection.
              </p>
            </div>

            {/* Title with AI Suggest */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Series Title *</label>
                <button
                  type="button"
                  onClick={handleSuggestTitles}
                  disabled={isSuggestingTitle}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={12} />
                  <span>{isSuggestingTitle ? 'Suggesting...' : 'AI Suggest'}</span>
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Mindful Living Series, Crown of Shadows"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Series Subtitle (Optional)</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Practical Guides for Everyday High Performance"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Genre & Target Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Working professionals aged 25-45"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Total Planned Volumes Slider */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800">Total Planned Volumes</label>
                  <p className="text-[11px] text-slate-500">How many books do you plan in this series?</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-600 text-white font-black text-xs">
                  {getScopeLabel(totalVolumes)}
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                value={totalVolumes}
                onChange={(e) => setTotalVolumes(parseInt(e.target.value, 10))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>2 (Duology)</span>
                <span>3 (Trilogy)</span>
                <span>5 (Series)</span>
                <span>8+ (Epic)</span>
                <span>12 Max</span>
              </div>
            </div>

            {/* Series Description with AI */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Series Premise & Description (Under 100 words)</label>
                <button
                  type="button"
                  onClick={handleGenerateDesc}
                  disabled={isGeneratingDesc}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={12} />
                  <span>{isGeneratingDesc ? 'Writing...' : 'AI Generate'}</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a captivating overview that will be printed on back covers and linked in KDP series metadata..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 2: COVER STYLE */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Step 2: Cover Continuity Style</h2>
              <p className="text-xs text-slate-500 mt-1">
                Define how visual layout and volume badges will appear across all books in the series.
              </p>
            </div>

            {/* Layout Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'uniform',
                  title: 'Uniform Layout',
                  desc: 'All covers share the same layout template. Only the central image & title change.',
                  badge: 'Standard Bestseller',
                },
                {
                  id: 'progressive',
                  title: 'Progressive Layout',
                  desc: 'Covers tell a continuous visual story — colors shift gradually from book to book.',
                  badge: 'Epic Series',
                },
                {
                  id: 'themed',
                  title: 'Themed Layout',
                  desc: 'Consistent visual elements (borders, fonts, badges) with unique illustrative styles.',
                  badge: 'Creative & YA',
                },
              ].map((opt) => {
                const isSelected = coverStyle.layout === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setCoverStyle({ ...coverStyle, layout: opt.id as any })}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {opt.badge}
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'}`}>
                          {isSelected && <Check size={10} />}
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{opt.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
                    </div>

                    {/* Small visual thumbnail representation */}
                    <div className="mt-4 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-100/70">
                      {[1, 2, 3].map((v) => (
                        <div
                          key={v}
                          className="w-10 h-14 rounded-md border border-slate-300 bg-white flex flex-col items-center justify-between p-1 text-[8px] shadow-2xs"
                        >
                          <span className="font-bold text-slate-400">V{v}</span>
                          <div className={`w-6 h-1 rounded-full ${opt.id === 'progressive' ? (v === 1 ? 'bg-purple-400' : v === 2 ? 'bg-indigo-400' : 'bg-blue-400') : 'bg-purple-500'}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Volume Number Style & Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Volume Number Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Book 1', 'Vol. 1', 'Part 1', '#1', 'I'] as const).map((styleOpt) => (
                    <button
                      key={styleOpt}
                      type="button"
                      onClick={() => setCoverStyle({ ...coverStyle, volumeNumberStyle: styleOpt })}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        coverStyle.volumeNumberStyle === styleOpt
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {styleOpt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Volume Number Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['top', 'bottom', 'spine'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setCoverStyle({ ...coverStyle, volumeNumberPosition: pos })}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        coverStyle.volumeNumberPosition === pos
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pos === 'spine' ? 'Spine Only' : `${pos} of Cover`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Series Title on Cover Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">Print Series Name on Book Covers</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Display "{title || 'Series Name'}" prominently on the front cover of each volume.
                </div>
              </div>
              <input
                type="checkbox"
                checked={coverStyle.seriesTitleVisible}
                onChange={(e) => setCoverStyle({ ...coverStyle, seriesTitleVisible: e.target.checked })}
                className="w-5 h-5 accent-purple-600 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* STEP 3: COLOR SCHEME */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">Step 3: Series Color Scheme</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose how colors transition or rotate across the {totalVolumes} planned books.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateAiPalette}
                disabled={isGeneratingPalette}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <Sparkles size={14} />
                <span>{isGeneratingPalette ? 'Generating...' : 'AI Generate Palette'}</span>
              </button>
            </div>

            {/* Mode Radios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'fixed', label: '🎨 Fixed', desc: 'All books use the same uniform primary color.' },
                { id: 'rotating', label: '🔄 Rotating', desc: 'Each volume cycles sequentially through your palette.' },
                { id: 'progressive', label: '📈 Progressive', desc: 'Colors smoothly interpolate across all volumes in HSL space.' },
              ].map((modeOpt) => (
                <div
                  key={modeOpt.id}
                  onClick={() => setColorMode(modeOpt.id as any)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    colorMode === modeOpt.id
                      ? 'border-purple-600 bg-purple-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900">{modeOpt.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{modeOpt.desc}</div>
                </div>
              ))}
            </div>

            {/* Progressive Color Pickers */}
            {colorMode === 'progressive' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Start Color (Volume 1)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={startColor}
                      onChange={(e) => setStartColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={startColor}
                      onChange={(e) => setStartColor(e.target.value)}
                      className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">End Color (Volume {totalVolumes})</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={endColor}
                      onChange={(e) => setEndColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={endColor}
                      onChange={(e) => setEndColor(e.target.value)}
                      className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Rotating / Fixed Palette Builder */}
            {colorMode !== 'progressive' && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">Series Color Swatches</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {palette.map((hex, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                      <input
                        type="color"
                        value={hex}
                        onChange={(e) => {
                          const updated = [...palette];
                          updated[idx] = e.target.value;
                          setPalette(updated);
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <span className="text-[11px] font-mono text-slate-600 px-1">{hex}</span>
                      {palette.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPalette(palette.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {palette.length < 10 && (
                    <button
                      type="button"
                      onClick={() => setPalette([...palette, '#f59e0b'])}
                      className="px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-purple-500 text-slate-500 hover:text-purple-600 text-xs font-bold transition-all cursor-pointer"
                    >
                      + Add Color
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Live Volume Color Preview Strip */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Calculated Volume Colors ({totalVolumes} Volumes)
              </label>
              <div className="flex items-center gap-2 flex-wrap p-4 bg-slate-900 rounded-2xl shadow-inner">
                {activeColorScheme.primaryColors.map((color, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div
                      className="w-12 h-16 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-md border border-white/20 transition-all hover:scale-105"
                      style={{ backgroundColor: color }}
                    >
                      B{idx + 1}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: ADD EXISTING BOOKS */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Step 4: Link Books & Placeholders</h2>
              <p className="text-xs text-slate-500 mt-1">
                Attach existing books from your library or leave blank slots for future planned volumes.
              </p>
            </div>

            {/* Existing User Books List */}
            {userBooks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                No existing books found in your library. All {totalVolumes} volumes will be initialized as planned slots.
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Select Existing Books to Assign</label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {userBooks.map((b) => {
                    const match = selectedBookIds.find((s) => s.bookId === b.id);
                    const isSelected = Boolean(match);

                    return (
                      <div
                        key={b.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                          isSelected ? 'border-purple-500 bg-purple-50/50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleBookSelection(b.id)}
                            className="w-4 h-4 accent-purple-600 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{b.title}</div>
                            <div className="text-[11px] text-slate-400">{b.genre || 'General'} · {b.chapters?.length || 0} Chapters</div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-purple-900">Volume #:</span>
                            <select
                              value={match?.volumeNumber || 1}
                              onChange={(e) => updateBookVolumeNumber(b.id, parseInt(e.target.value, 10))}
                              className="px-2.5 py-1 rounded-lg border border-purple-300 text-xs font-bold text-purple-900 bg-white"
                            >
                              {Array.from({ length: totalVolumes }).map((_, i) => (
                                <option key={i + 1} value={i + 1}>Vol. {i + 1}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary Review Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300">
                  Ready to Publish
                </span>
                <span className="text-xs font-bold text-purple-200">{genre}</span>
              </div>
              <h3 className="text-lg font-black text-white">{title || 'Untitled Series'}</h3>
              <p className="text-xs text-purple-200 line-clamp-2">
                {description || 'Comprehensive multi-volume author series collection.'}
              </p>
              <div className="pt-2 border-t border-purple-800 flex items-center justify-between text-xs text-purple-300">
                <span>{selectedBookIds.length} existing books linked</span>
                <span>{totalVolumes - selectedBookIds.length} planned placeholder volumes</span>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION ACTIONS */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((currentStep - 1) as any)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : <div />}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1 && !title.trim()) {
                  addToast({ type: 'error', title: 'Title Required', message: 'Please enter a series title to proceed.' });
                  return;
                }
                setCurrentStep((currentStep + 1) as any);
              }}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateSeries}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm shadow-md shadow-purple-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Sparkles size={16} />
              <span>{isSaving ? 'Creating Series...' : 'Create Series →'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
