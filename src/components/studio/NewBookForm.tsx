import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Check, 
  ArrowRight, 
  Layers, 
  Feather, 
  HelpCircle,
  Loader2,
  X,
  BookMarked
} from 'lucide-react';
import { TrimSize, PaperType } from '../../types/index';
import { useBookStore } from '../../lib/store';
import { generateTitleIdeas } from '../../lib/gemini';

interface NewBookFormProps {
  onBookCreated: (bookId: string) => void;
}

const TRIM_SIZES: Array<{
  id: TrimSize;
  dimensions: string;
  name: string;
  useCase: string;
  aspectRatio: string; // for visual comparison card
}> = [
  {
    id: '5x8',
    dimensions: '5" × 8"',
    name: 'Compact Trade',
    useCase: 'Pocket fiction, novellas & poetry collections',
    aspectRatio: 'h-24 w-15',
  },
  {
    id: '5.5x8.5',
    dimensions: '5.5" × 8.5"',
    name: 'Standard Fiction',
    useCase: 'Standard trade paperbacks, memoirs & biographies',
    aspectRatio: 'h-25 w-16',
  },
  {
    id: '6x9',
    dimensions: '6" × 9"',
    name: 'Standard Non-Fiction',
    useCase: 'Most popular for non-fiction, business & self-help',
    aspectRatio: 'h-26 w-17',
  },
  {
    id: '8.5x11',
    dimensions: '8.5" × 11"',
    name: 'Workbook / Manual',
    useCase: 'Workbooks, journals, planners, cookbooks & manuals',
    aspectRatio: 'h-28 w-22',
  },
];

const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Self-Help',
  "Children's",
  'Journal/Planner',
  'Activity Book',
  'Cookbook',
  'Business & Money',
  'Health & Wellness',
  'Sci-Fi & Fantasy',
  'Romance',
  'Other',
];

const LANGUAGES = [
  'English',
  'Tamil',
  'Hindi',
  'Telugu',
  'Spanish',
  'French',
  'German',
  'Other',
];

export const NewBookForm: React.FC<NewBookFormProps> = ({ onBookCreated }) => {
  const addBook = useBookStore((state) => state.addBook);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState('English');
  const [genre, setGenre] = useState('Non-Fiction');
  const [trimSize, setTrimSize] = useState<TrimSize>('6x9');
  const [paperType, setPaperType] = useState<PaperType>('white');
  const [errors, setErrors] = useState<{ title?: string; author?: string }>({});

  // AI Title Generator Modal State
  const [isAiTitleModalOpen, setIsAiTitleModalOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiGenre, setAiGenre] = useState('Non-Fiction');
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [suggestedTitles, setSuggestedTitles] = useState<Array<{ title: string; subtitle: string }>>([]);

  const handleGenerateTitles = async () => {
    setIsGeneratingTitles(true);
    try {
      const results = await generateTitleIdeas(aiGenre, aiDescription);
      setSuggestedTitles(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTitles(false);
    }
  };

  const handleSelectTitle = (selectedTitle: string, selectedSubtitle: string) => {
    setTitle(selectedTitle);
    setSubtitle(selectedSubtitle);
    setIsAiTitleModalOpen(false);
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; author?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Book Title is required to start formatting';
    }
    if (!author.trim()) {
      newErrors.author = 'Author name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const createdBook = addBook({
      title: title.trim(),
      subtitle: subtitle.trim(),
      author: author.trim(),
      language,
      genre,
      trimSize,
      paperType,
    });

    onBookCreated(createdBook.id);
  };

  return (
    <div id="new-book-setup-container" className="max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2">
          <BookMarked className="w-4 h-4" />
          <span>Step 1 of 3 · Manuscript Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Create New Book Project
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Set up your publication dimensions and metadata. You can fine-tune chapters, formatting, and KDP covers next.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Book Essentials */}
        <div className="bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Feather className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Book Details & Identity
          </h2>

          <div className="space-y-5">
            {/* Title with AI button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Book Title <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  id="btn-open-ai-title"
                  onClick={() => {
                    setAiGenre(genre);
                    setIsAiTitleModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 px-2.5 py-1 rounded-md transition-colors border border-purple-200/60 dark:border-purple-800/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate title ideas with AI
                </button>
              </div>
              <input
                id="input-book-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder="e.g. Master the Code: From Novice to Architect"
                className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white dark:bg-[#131320] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.title
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500'
                }`}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Subtitle <span className="text-xs text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                id="input-book-subtitle"
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. A Practical Blueprint for Clean Architecture and Real-World Impact"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Author, Language, Genre */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Author Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-book-author"
                  type="text"
                  value={author}
                  onChange={(e) => {
                    setAuthor(e.target.value);
                    if (errors.author) setErrors((prev) => ({ ...prev, author: undefined }));
                  }}
                  placeholder="e.g. J. K. Vance"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white dark:bg-[#131320] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.author
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500'
                  }`}
                />
                {errors.author && <p className="mt-1 text-xs text-red-500">{errors.author}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Language
                </label>
                <select
                  id="select-book-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Genre / Category
                </label>
                <select
                  id="select-book-genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Print Specifications & Visual Trim Size Cards */}
        <div className="bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Amazon KDP Trim Size & Dimensions
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Select your industry-standard paperback trim size. Auto-scales margins and PDF pages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
            {TRIM_SIZES.map((item) => {
              const isSelected = trimSize === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  id={`trim-card-${item.id}`}
                  onClick={() => setTrimSize(item.id)}
                  className={`relative flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-600 dark:ring-purple-500'
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#131320] hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.dimensions}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Visual representation card */}
                  <div className="w-full h-16 bg-white dark:bg-[#1a1a2e] rounded border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center my-1.5">
                    <div className={`border-2 border-purple-500/80 rounded-sm bg-purple-100/50 dark:bg-purple-900/30 flex items-center justify-center text-[10px] font-mono text-purple-700 dark:text-purple-300 ${
                      item.id === '5x8' ? 'w-8 h-12' :
                      item.id === '5.5x8.5' ? 'w-9 h-13' :
                      item.id === '6x9' ? 'w-10 h-14' : 'w-13 h-14'
                    }`}>
                      {item.id}
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 mt-1">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
                    {item.useCase}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Paper Type Selection */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paper Stock Color
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                  paperType === 'white'
                    ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="paperType"
                  value="white"
                  checked={paperType === 'white'}
                  onChange={() => setPaperType('white')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-white inline-block shadow-sm"></span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">White Paper</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Crisp contrast, ideal for non-fiction, workbooks & technical guides.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                  paperType === 'cream'
                    ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="paperType"
                  value="cream"
                  checked={paperType === 'cream'}
                  onChange={() => setPaperType('cream')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border border-amber-300 bg-[#fbf6ea] inline-block shadow-sm"></span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Cream Paper</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Warm, traditional finish preferred for fiction, poetry & memoirs.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            id="btn-create-book-submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-medium text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-[#0f0f17]"
          >
            <span>Proceed to Chapter Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* AI Title Ideas Modal */}
      {isAiTitleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#151525]">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Generate Bestseller Title Ideas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAiTitleModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Genre / Market Category
                </label>
                <select
                  value={aiGenre}
                  onChange={(e) => setAiGenre(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-900 dark:text-white"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Concept / What is your book about?
                </label>
                <textarea
                  rows={3}
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="e.g. A step-by-step roadmap showing freelance developers how to scale their consulting business, price on value, and land $10k+ retainers."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="button"
                id="btn-run-title-gen"
                onClick={handleGenerateTitles}
                disabled={isGeneratingTitles}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isGeneratingTitles ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Brainstorming Titles with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate 5 Title & Subtitle Pairs</span>
                  </>
                )}
              </button>

              {/* Suggestions List */}
              {suggestedTitles.length > 0 && (
                <div className="pt-2">
                  <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Click any title to select & apply:
                  </span>
                  <div className="space-y-2">
                    {suggestedTitles.map((item, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => handleSelectTitle(item.title, item.subtitle)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-[#131320] hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all group"
                      >
                        <div className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {item.subtitle}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
