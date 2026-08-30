import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Layers, 
  Palette, 
  Puzzle, 
  BookMarked, 
  Rocket, 
  TrendingUp, 
  Gift, 
  Compass, 
  Smile, 
  CheckCircle2, 
  ChevronRight,
  Globe,
  FileType,
  User,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { updateUserDocument } from '../../lib/userService';
import { PageRoute } from '../../types';

interface OnboardingViewProps {
  onNavigate: (route: PageRoute) => void;
}

const STORAGE_KEY = 'kdp_onboarding_progress';

const BOOK_TYPES = [
  {
    id: 'non-fiction',
    icon: '📖',
    title: 'Non-Fiction Guides',
    desc: 'How-to books, educational content, guides',
    badge: 'Popular',
  },
  {
    id: 'childrens',
    icon: '🧒',
    title: "Children's Books",
    desc: 'Illustrated storybooks for kids',
  },
  {
    id: 'coloring',
    icon: '🎨',
    title: 'Coloring Books',
    desc: 'Line art, adult coloring, activity pages',
  },
  {
    id: 'puzzle',
    icon: '🧩',
    title: 'Puzzle Books',
    desc: 'Word search, crossword, activity books',
  },
  {
    id: 'journals',
    icon: '📓',
    title: 'Journals & Planners',
    desc: 'Daily planners, gratitude journals, trackers',
  },
  {
    id: 'fiction',
    icon: '📚',
    title: 'Fiction',
    desc: 'Novels, short stories, fantasy',
  },
];

const PUBLISHING_GOALS = [
  {
    id: 'business',
    icon: '🚀',
    title: 'Build a publishing business',
    desc: 'I want to publish many books and create passive income',
    recommended: true,
  },
  {
    id: 'authority',
    icon: '📈',
    title: 'Grow my authority',
    desc: 'I want to establish expertise with a professional book',
  },
  {
    id: 'personal',
    icon: '🎁',
    title: 'Create something personal',
    desc: 'A gift, family book, or passion project',
  },
  {
    id: 'exploring',
    icon: '🔍',
    title: 'Just exploring',
    desc: "I'm curious about AI book creation",
  },
];

const LANGUAGES = [
  'English',
  'Tamil',
  'Hindi',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Others',
];

const TRIM_SIZES = [
  { id: '5x8', label: '5" × 8"', sub: 'Standard Pocket' },
  { id: '6x9', label: '6" × 9"', sub: 'Amazon Recommended', recommended: true },
  { id: '8.5x11', label: '8.5" × 11"', sub: 'Coloring & Workbooks' },
];

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onNavigate }) => {
  const { user, userDoc, completeOnboarding } = useAuthStore();

  // Step state (1 to 4, or 5 for completion)
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [selectedBookTypes, setSelectedBookTypes] = useState<string[]>(['non-fiction']);
  const [publishingGoal, setPublishingGoal] = useState<string>('business');
  const [defaultAuthorName, setDefaultAuthorName] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState('English');
  const [defaultTrimSize, setDefaultTrimSize] = useState('6x9');

  // Hydrate initial data from user profile and local storage
  useEffect(() => {
    // 1. Initial name defaults
    const initialName = user?.displayName || userDoc?.name || (user?.email ? user.email.split('@')[0] : 'Kindle Author');
    setName((prev) => prev || initialName);
    setDefaultAuthorName((prev) => prev || initialName);

    // 2. Hydrate from localStorage for progressive saving
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('onboarding-progress') || localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.step) setStep(parsed.step);
          if (parsed.name) setName(parsed.name);
          if (parsed.selectedBookTypes?.length) setSelectedBookTypes(parsed.selectedBookTypes);
          if (parsed.publishingGoal) setPublishingGoal(parsed.publishingGoal);
          if (parsed.defaultAuthorName) setDefaultAuthorName(parsed.defaultAuthorName);
          if (parsed.defaultLanguage) setDefaultLanguage(parsed.defaultLanguage);
          if (parsed.defaultTrimSize) setDefaultTrimSize(parsed.defaultTrimSize);
        }
      } catch (e) {
        console.warn('Failed to parse onboarding progress cache:', e);
      }
    }
  }, [user, userDoc]);

  // Save progressive state whenever inputs change
  useEffect(() => {
    if (typeof window !== 'undefined' && step < 5) {
      try {
        const payload = JSON.stringify({
          step,
          name,
          selectedBookTypes,
          publishingGoal,
          defaultAuthorName,
          defaultLanguage,
          defaultTrimSize,
        });
        localStorage.setItem('onboarding-progress', payload);
        localStorage.setItem(STORAGE_KEY, payload);
      } catch {}
    }
  }, [step, name, selectedBookTypes, publishingGoal, defaultAuthorName, defaultLanguage, defaultTrimSize]);

  // Progressive Firestore background sync
  const saveProgressToFirestore = async (patch: any) => {
    if (user?.uid) {
      try {
        await updateUserDocument(user.uid, patch);
      } catch (err) {
        console.debug('Progressive sync background notice:', err);
      }
    }
  };

  // Toggle book type selection
  const toggleBookType = (typeId: string) => {
    if (selectedBookTypes.includes(typeId)) {
      if (selectedBookTypes.length > 1) {
        setSelectedBookTypes(selectedBookTypes.filter((t) => t !== typeId));
      }
    } else {
      setSelectedBookTypes([...selectedBookTypes, typeId]);
    }
  };

  // Handle Next
  const handleNext = async () => {
    if (step === 1) {
      if (!name.trim()) return;
      if (!defaultAuthorName) setDefaultAuthorName(name);
      saveProgressToFirestore({ name });
      setStep(2);
    } else if (step === 2) {
      if (selectedBookTypes.length === 0) return;
      saveProgressToFirestore({ 'settings.bookTypes': selectedBookTypes });
      setStep(3);
    } else if (step === 3) {
      saveProgressToFirestore({ 'settings.publishingGoal': publishingGoal });
      setStep(4);
    } else if (step === 4) {
      saveProgressToFirestore({
        'settings.defaultAuthorName': defaultAuthorName || name,
        'settings.defaultLanguage': defaultLanguage,
        'settings.defaultTrimSize': defaultTrimSize,
      });
      setStep(5); // Completion screen
    }
  };

  // Skip straight to completion screen
  const handleSkip = () => {
    setStep(5);
  };

  // Final completion handler
  const handleFinish = async (targetRoute: PageRoute = 'dashboard') => {
    setIsSubmitting(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('onboarding-progress');
        localStorage.removeItem(STORAGE_KEY);
      }
      await completeOnboarding({
        name: name || user?.displayName || 'Author',
        bookTypes: selectedBookTypes,
        publishingGoal,
        defaultAuthorName: defaultAuthorName || name || 'Author',
        defaultLanguage,
        defaultTrimSize,
      });
      onNavigate(targetRoute);
    } catch (err) {
      console.error('Error completing onboarding:', err);
      onNavigate('dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  // User initials
  const firstName = name.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Author';
  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'AU';

  // Build dynamic suggestion cards based on selected book types
  const getSuggestions = () => {
    const suggestions = [];

    if (selectedBookTypes.includes('non-fiction') || selectedBookTypes.length === 0) {
      suggestions.push({
        id: 'studio-nonfiction',
        title: 'Write your first chapter with AI',
        desc: 'Generate a structured outline and draft Chapter 1 with Gemini 2.5',
        actionText: 'Open Writing Studio',
        icon: '✍️',
        route: 'studio' as PageRoute,
        badge: 'Recommended',
      });
    }

    if (selectedBookTypes.includes('coloring')) {
      suggestions.push({
        id: 'studio-coloring',
        title: 'Generate a coloring book',
        desc: 'Prompt high-contrast line art interiors with Imagen 3',
        actionText: 'Open Studio',
        icon: '🎨',
        route: 'studio' as PageRoute,
      });
    } else if (selectedBookTypes.includes('childrens')) {
      suggestions.push({
        id: 'studio-kids',
        title: "Create a children's story",
        desc: 'Generate illustrated storybook pages and rhyming text',
        actionText: 'Start Story',
        icon: '🧒',
        route: 'studio' as PageRoute,
      });
    } else if (selectedBookTypes.includes('puzzle')) {
      suggestions.push({
        id: 'studio-puzzle',
        title: 'Create puzzle activity pages',
        desc: 'Generate print-ready word searches, crosswords & grids',
        actionText: 'Build Puzzles',
        icon: '🧩',
        route: 'formatter' as PageRoute,
      });
    } else if (selectedBookTypes.includes('fiction')) {
      suggestions.push({
        id: 'studio-fiction',
        title: 'Draft story outline & chapters',
        desc: 'Build deep character arcs and multi-chapter plots with AI',
        actionText: 'Write Fiction',
        icon: '📚',
        route: 'studio' as PageRoute,
      });
    } else {
      suggestions.push({
        id: 'cover-builder',
        title: 'Design your 300 DPI book cover',
        desc: 'Create KDP-ready spine, front, and back covers with barcode',
        actionText: 'Open Cover Designer',
        icon: '🖼️',
        route: 'cover' as PageRoute,
      });
    }

    // Always include dashboard
    suggestions.push({
      id: 'dashboard',
      title: 'Explore your dashboard',
      desc: 'View book status, quick actions, analytics and tools',
      actionText: 'Go to Dashboard',
      icon: '📊',
      route: 'dashboard' as PageRoute,
    });

    return suggestions.slice(0, 3);
  };

  return (
    <div id="onboarding-page-container" className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      
      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-600/20 text-white">
            <BookOpen size={18} />
          </div>
          <div>
            <span className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              KDP Studio
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Setup
              </span>
            </span>
          </div>
        </div>

        {/* Step Progress Tracker (Steps 1-4) */}
        {step <= 4 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">
              Step {step} of 4
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-7 bg-purple-600 shadow-sm shadow-purple-500/40'
                      : i < step
                      ? 'w-2.5 bg-purple-400'
                      : 'w-2.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Authenticated User Status Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Author'}
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
              {initials}
            </div>
          )}
          <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate">
            {user?.displayName || user?.email?.split('@')[0] || 'Author'}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-10 transition-all duration-300">
          
          {/* ================= STEP 1: WELCOME & NAME ================= */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in zoom-in-98 duration-200">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 text-2xl shadow-inner">
                  👋
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome to KDP Studio!
                </h1>
                <p className="text-sm text-slate-500 mt-2">
                  Let's personalize your experience in 4 quick steps.
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    What should we call you?
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="onboarding-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alexander Vance"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none shadow-xs"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    This will be used for your account greeting and author defaults.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: WHAT WILL YOU CREATE ================= */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in zoom-in-98 duration-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  What kind of books will you create?
                </h1>
                <p className="text-sm text-slate-500 mt-1.5">
                  Select all that apply — this helps us customize your dashboard & AI prompts.
                </p>
              </div>

              {/* 2x3 Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {BOOK_TYPES.map((bt) => {
                  const isSelected = selectedBookTypes.includes(bt.id);
                  return (
                    <button
                      key={bt.id}
                      type="button"
                      onClick={() => toggleBookType(bt.id)}
                      className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-150 flex items-start gap-3.5 group ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/60 shadow-sm shadow-purple-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <span className="text-2xl shrink-0 mt-0.5">{bt.icon}</span>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-purple-950' : 'text-slate-800'}`}>
                            {bt.title}
                          </h3>
                          {bt.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-purple-200 text-purple-800">
                              {bt.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                          {bt.desc}
                        </p>
                      </div>

                      {/* Top Right Checkmark */}
                      <div
                        className={`absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'border border-slate-300 bg-white group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check size={12} className="stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 text-right">
                Selected: {selectedBookTypes.length} book types
              </p>
            </div>
          )}

          {/* ================= STEP 3: PUBLISHING GOAL ================= */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in zoom-in-98 duration-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  What's your publishing goal?
                </h1>
                <p className="text-sm text-slate-500 mt-1.5">
                  We'll show you the most relevant features and pre-flight tools first.
                </p>
              </div>

              {/* 4 Radio Cards */}
              <div className="space-y-3 pt-2">
                {PUBLISHING_GOALS.map((goal) => {
                  const isSelected = publishingGoal === goal.id;
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setPublishingGoal(goal.id)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 flex items-center gap-4 ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 shadow-sm shadow-purple-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xl shrink-0 shadow-xs">
                        {goal.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-bold ${isSelected ? 'text-purple-950' : 'text-slate-800'}`}>
                            {goal.title}
                          </h3>
                          {goal.recommended && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Popular Goal
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {goal.desc}
                        </p>
                      </div>

                      {/* Radio button circle */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 4: QUICK SETUP ================= */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in zoom-in-98 duration-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Almost done! Set your defaults.
                </h1>
                <p className="text-sm text-slate-500 mt-1.5">
                  You can always customize or change these anytime in Settings.
                </p>
              </div>

              <div className="space-y-5 pt-2">
                {/* 1. Default Author Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    1. Default Author Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={defaultAuthorName}
                      onChange={(e) => setDefaultAuthorName(e.target.value)}
                      placeholder="e.g. Alexander Vance"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    This appears on your book covers and copyright pages.
                  </p>
                </div>

                {/* 2. Default Language */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    2. Default Language
                  </label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={defaultLanguage}
                      onChange={(e) => setDefaultLanguage(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-purple-400 outline-none appearance-none cursor-pointer"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Default Trim Size */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    3. Default Trim Size
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TRIM_SIZES.map((ts) => {
                      const isSelected = defaultTrimSize === ts.id;
                      return (
                        <button
                          key={ts.id}
                          type="button"
                          onClick={() => setDefaultTrimSize(ts.id)}
                          className={`p-3.5 rounded-xl border-2 text-center transition-all ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50/70 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <span className={`block text-xs font-bold ${isSelected ? 'text-purple-950' : 'text-slate-800'}`}>
                            {ts.label}
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            {ts.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 5: COMPLETION / SUCCESS SCREEN ================= */}
          {step === 5 && (
            <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-300 py-2">
              
              {/* Animated Success Checkmark */}
              <div className="relative inline-flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
                  <Check size={38} className="stroke-[3]" />
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  You're all set, {firstName}! 🎉
                </h1>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  Your publishing workspace has been tailored to your preferences. Here is where you can start:
                </p>
              </div>

              {/* 3 Action Suggestion Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-left pt-2">
                {getSuggestions().map((sugg) => (
                  <button
                    key={sugg.id}
                    onClick={() => handleFinish(sugg.route)}
                    disabled={isSubmitting}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 bg-white shadow-xs hover:shadow-md transition-all duration-150 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{sugg.icon}</span>
                        {sugg.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                            {sugg.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
                        {sugg.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {sugg.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-100 flex items-center text-[11px] font-bold text-purple-600 group-hover:text-purple-700">
                      <span>{sugg.actionText}</span>
                      <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Primary Go to Dashboard Button */}
              <div className="pt-4">
                <button
                  id="onboarding-finish-btn"
                  onClick={() => handleFinish('dashboard')}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white text-sm font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-60"
                >
                  <Sparkles size={16} />
                  <span>Go to Dashboard</span>
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>
          )}

          {/* ================= STEP NAVIGATION FOOTER (Steps 1-4) ================= */}
          {step <= 4 && (
            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
              {/* Back button */}
              <div>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}
              </div>

              {/* Skip & Next */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
                >
                  Skip for now
                </button>

                <button
                  id="onboarding-next-btn"
                  type="button"
                  onClick={handleNext}
                  disabled={(step === 1 && !name.trim()) || (step === 2 && selectedBookTypes.length === 0)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{step === 4 ? 'Complete Setup' : 'Next'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="py-4 text-center text-[11px] text-slate-400">
        © {new Date().getFullYear()} KDP Studio. Amazon & Kindle Direct Publishing are trademarks of Amazon.com, Inc.
      </footer>
    </div>
  );
};

export default OnboardingView;
