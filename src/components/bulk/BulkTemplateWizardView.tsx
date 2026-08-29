/**
 * KDP Studio — Bulk Template Wizard Component (4-Step Builder)
 * Phase 14B
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
  Layers,
  HelpCircle,
  Play,
  RotateCcw,
  Zap,
  Grid,
  Palette,
  FileText,
  Calendar,
  BookHeart,
  Type,
  ListFilter,
} from 'lucide-react';
import {
  BulkTemplate,
  BulkBookType,
  BulkVariable,
  BulkVariableType,
  BULK_BOOK_TYPE_METADATA,
} from '../../types/bulk';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { useToastStore } from '../../lib/toastStore';
import { auth } from '../../lib/firebase';
import {
  saveBulkTemplate,
  updateBulkTemplate,
  getBulkTemplate,
  createBulkJob,
  resolveVariations,
  resolveTemplate,
  estimateJobTime,
} from '../../lib/bulkService';

interface BulkTemplateWizardViewProps {
  initialTemplateId?: string;
  initialBookType?: BulkBookType;
  onBack: () => void;
  onNavigate: (route: PageRoute, params?: Record<string, string>) => void;
  onJobCreated: (jobId: string) => void;
}

// Quick Fill Static Constants
const QUICK_FILLS: Record<string, string[]> = {
  'US States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ],
  'World Countries': [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Japan', 'Germany', 'France', 'Italy',
    'Spain', 'Brazil', 'Mexico', 'India', 'South Korea', 'Netherlands', 'Sweden', 'Switzerland',
    'Norway', 'New Zealand', 'Ireland', 'Singapore', 'Greece', 'Portugal', 'Argentina', 'Egypt'
  ],
  'Animals': [
    'Lions', 'Elephants', 'Dolphins', 'Wolves', 'Tigers', 'Horses', 'Eagles', 'Pandas',
    'Bears', 'Giraffes', 'Foxes', 'Owls', 'Penguins', 'Koalas', 'Cheetahs', 'Sea Turtles'
  ],
  'Holidays': [
    'Christmas', 'Halloween', 'Thanksgiving', 'Easter', "Valentine's Day", "St. Patrick's Day",
    'New Year', 'Summer Solstice', 'Autumn Harvest', 'Winter Holiday'
  ],
  'Seasons': ['Spring Blossoms', 'Summer Sunshine', 'Autumn Harvest', 'Winter Wonderland'],
  'Colors': ['Midnight Blue', 'Emerald Green', 'Royal Purple', 'Crimson Red', 'Sunset Gold', 'Rose Pink', 'Slate Grey', 'Teal'],
  'Numbers 1-20': Array.from({ length: 20 }, (_, i) => `Vol. ${i + 1}`),
};

const QUICK_PALETTES: Record<string, string[]> = {
  Rainbow: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
  Pastels: ['#fbcfe8', '#fef08a', '#bbf7d0', '#bfdbfe', '#ddd6fe', '#fed7aa'],
  EarthTones: ['#78350f', '#92400e', '#b45309', '#065f46', '#1e3a5f', '#44403c'],
  Neons: ['#00f5d4', '#7b2cbf', '#ff007f', '#fee440', '#00bbf9'],
  Monochromes: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'],
};

export const BulkTemplateWizardView: React.FC<BulkTemplateWizardViewProps> = ({
  initialTemplateId,
  initialBookType,
  onBack,
  onNavigate,
  onJobCreated,
}) => {
  const { user, userDoc } = useAuthStore();
  const uid = user?.uid || userDoc?.uid || 'demo-user-123';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewingAi, setIsPreviewingAi] = useState(false);

  // Template State
  const [templateName, setTemplateName] = useState('My Bulk Book Series');
  const [templateDescription, setTemplateDescription] = useState('');
  const [bookType, setBookType] = useState<BulkBookType>(initialBookType || 'word-search');

  // Shared Settings
  const [author, setAuthor] = useState('KDP Studio Author');
  const [trimSize, setTrimSize] = useState('8.5x11');
  const [paperType, setPaperType] = useState('white');
  const [language, setLanguage] = useState('English');
  const [pageCount, setPageCount] = useState(30);
  const [gridSize, setGridSize] = useState(15);
  const [difficulty, setDifficulty] = useState('medium');
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [promptStyle, setPromptStyle] = useState<'lined' | 'dotted' | 'blank' | 'prompted'>('lined');
  const [style, setStyle] = useState('clean');
  const [targetAge, setTargetAge] = useState('all-ages');
  const [lineThickness, setLineThickness] = useState('medium');
  const [chapterCount, setChapterCount] = useState(8);
  const [tone, setTone] = useState('Conversational');

  // Dynamic Variables & Titles
  const [variables, setVariables] = useState<BulkVariable[]>([
    {
      id: 'var_theme_1',
      name: 'theme',
      label: 'Book Theme',
      type: 'text',
      values: ['Ocean Animals', 'Forest Wildlife', 'Space Exploration', 'Ancient Egypt', 'Tropical Birds'],
    },
  ]);

  const [titleTemplate, setTitleTemplate] = useState('{theme} Word Search Book');
  const [subtitleTemplate, setSubtitleTemplate] = useState('Large Print Themed Puzzles for Adults');

  // Active Variable Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVarId, setEditingVarId] = useState<string | null>(null);
  const [varName, setVarName] = useState('color');
  const [varLabel, setVarLabel] = useState('Cover Color');
  const [varType, setVarType] = useState<BulkVariableType>('text');
  const [varTextLines, setVarTextLines] = useState('');
  const [varColors, setVarColors] = useState<string[]>(['#4f46e5', '#059669', '#d97706', '#dc2626']);
  const [varAiPrompt, setVarAiPrompt] = useState('Creative subtopics for mindfulness');
  const [varAiCount, setVarAiCount] = useState(10);
  const [varGeneratedValues, setVarGeneratedValues] = useState<string[]>([]);
  const [varSelectedOptions, setVarSelectedOptions] = useState<string[]>([]);

  // Load Existing Template if editing
  useEffect(() => {
    if (initialTemplateId) {
      getBulkTemplate(initialTemplateId).then((t) => {
        if (t) {
          setTemplateName(t.name);
          setTemplateDescription(t.description || '');
          setBookType(t.bookType);
          setAuthor(t.sharedSettings.author || 'KDP Studio Author');
          setTrimSize(t.sharedSettings.trimSize || '8.5x11');
          setPaperType(t.sharedSettings.paperType || 'white');
          setLanguage(t.sharedSettings.language || 'English');
          setPageCount(t.sharedSettings.pageCount || 30);
          if (t.sharedSettings.gridSize) setGridSize(t.sharedSettings.gridSize);
          if (t.sharedSettings.difficulty) setDifficulty(t.sharedSettings.difficulty);
          if (t.sharedSettings.includeAnswers !== undefined) setIncludeAnswers(t.sharedSettings.includeAnswers);
          if (t.sharedSettings.promptStyle) setPromptStyle(t.sharedSettings.promptStyle);
          setVariables(t.variables || []);
          setTitleTemplate(t.titleTemplate);
          setSubtitleTemplate(t.subtitleTemplate || '');
        }
      });
    }
  }, [initialTemplateId]);

  // Adjust defaults when bookType changes
  useEffect(() => {
    const meta = BULK_BOOK_TYPE_METADATA[bookType];
    if (meta) {
      setTrimSize(meta.defaultTrim);
      if (bookType === 'journal' || bookType === 'planner') {
        setPageCount(100);
        setTitleTemplate('{theme} Daily Journal');
      } else if (bookType === 'coloring-book') {
        setPageCount(25);
        setTitleTemplate('{theme} Coloring Book');
      } else if (bookType === 'word-fit') {
        setPageCount(30);
        setTitleTemplate('{theme} Word Fit Puzzles');
      } else {
        setTitleTemplate('{theme} Word Search Book');
      }
    }
  }, [bookType]);

  // Dynamic Variation Calculation
  const calculatedVariations = useMemo(() => {
    const fakeTemplate: BulkTemplate = {
      id: 'preview',
      uid,
      name: templateName,
      description: templateDescription,
      bookType,
      sharedSettings: {
        author,
        trimSize,
        paperType,
        language,
        pageCount,
        gridSize,
        difficulty,
        includeAnswers,
        promptStyle,
      },
      variables,
      titleTemplate,
      subtitleTemplate,
      variationCount: variables.length ? 5 : 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return resolveVariations(fakeTemplate);
  }, [variables, titleTemplate, subtitleTemplate, bookType, templateName, author, trimSize, paperType, language, pageCount, gridSize, difficulty, includeAnswers, promptStyle]);

  const variationCount = calculatedVariations.length;
  const estimatedSeconds = estimateJobTime(bookType, variationCount);

  // Drawer Open for New/Edit
  const handleOpenAddVariable = () => {
    setEditingVarId(null);
    setVarName(`var_${variables.length + 1}`);
    setVarLabel(`Variable ${variables.length + 1}`);
    setVarType('text');
    setVarTextLines('Ocean Animals\nForest Wildlife\nDesert Safari\nMountain Peaks\nTropical Birds');
    setVarColors(['#4f46e5', '#059669', '#d97706', '#dc2626']);
    setVarAiPrompt('Popular high converting book subtopics');
    setVarAiCount(10);
    setVarGeneratedValues([]);
    setVarSelectedOptions([]);
    setIsDrawerOpen(true);
  };

  const handleOpenEditVariable = (v: BulkVariable) => {
    setEditingVarId(v.id);
    setVarName(v.name);
    setVarLabel(v.label);
    setVarType(v.type);
    setVarTextLines(v.values?.join('\n') || '');
    setVarColors(v.colors || ['#4f46e5', '#059669', '#d97706']);
    setVarAiPrompt(v.aiPrompt || '');
    setVarAiCount(v.aiCount || 10);
    setVarGeneratedValues(v.generatedValues || []);
    setVarSelectedOptions(v.selectedValues || []);
    setIsDrawerOpen(true);
  };

  const handleSaveVariableFromDrawer = () => {
    const cleanName = varName.trim().replace(/\s+/g, '_').toLowerCase() || 'theme';
    const cleanLabel = varLabel.trim() || cleanName;

    let newVar: BulkVariable = {
      id: editingVarId || `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      label: cleanLabel,
      type: varType,
    };

    if (varType === 'text') {
      const lines = varTextLines
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      newVar.values = lines.length ? lines : ['Default Variation'];
    } else if (varType === 'color') {
      newVar.colors = varColors.length ? varColors : ['#4f46e5'];
    } else if (varType === 'ai-generate') {
      newVar.aiPrompt = varAiPrompt;
      newVar.aiCount = varAiCount;
      newVar.generatedValues = varGeneratedValues.length ? varGeneratedValues : ['AI Theme 1', 'AI Theme 2'];
    } else if (varType === 'select') {
      newVar.selectedValues = varSelectedOptions.length ? varSelectedOptions : ['Option 1', 'Option 2'];
    }

    if (editingVarId) {
      setVariables((prev) => prev.map((v) => (v.id === editingVarId ? newVar : v)));
    } else {
      if (variables.length >= 5) {
        useToastStore.getState().addToast({
          message: 'Maximum 5 dynamic variables per template recommended.',
          type: 'warning',
        });
      }
      setVariables((prev) => [...prev, newVar]);
    }

    setIsDrawerOpen(false);
    useToastStore.getState().addToast({ message: `Variable "${cleanName}" saved!`, type: 'success' });
  };

  const handleDeleteVariable = (id: string) => {
    setVariables((prev) => prev.filter((v) => v.id !== id));
    useToastStore.getState().addToast({ message: 'Variable removed', type: 'info' });
  };

  const handlePreviewAiValues = async () => {
    setIsPreviewingAi(true);
    try {
      const token = (await auth.currentUser?.getIdToken()) || '';
      const res = await fetch('/api/bulk/resolve-variables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-user-id': uid,
        },
        body: JSON.stringify({
          variables: [
            {
              id: 'temp_ai',
              name: varName,
              label: varLabel,
              type: 'ai-generate',
              aiPrompt: varAiPrompt,
              aiCount: varAiCount,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate AI values');
      }

      const generated = data.variables?.[0]?.generatedValues || [];
      setVarGeneratedValues(generated);
      useToastStore.getState().addToast({
        message: `Generated ${generated.length} distinct values with Gemini! 🤖`,
        type: 'success',
      });
    } catch (err: any) {
      useToastStore.getState().addToast({ message: err.message || 'AI Generation failed', type: 'error' });
    } finally {
      setIsPreviewingAi(false);
    }
  };

  const handleSaveTemplate = async (andRun: boolean = false) => {
    if (!templateName.trim()) {
      useToastStore.getState().addToast({ message: 'Please provide a template name.', type: 'warning' });
      return;
    }

    if (!variables.length) {
      useToastStore.getState().addToast({ message: 'Please add at least one dynamic variable.', type: 'warning' });
      return;
    }

    setIsSaving(true);
    try {
      const payload: Omit<BulkTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        uid,
        name: templateName.trim(),
        description: templateDescription.trim(),
        bookType,
        sharedSettings: {
          author,
          trimSize,
          paperType,
          language,
          pageCount,
          gridSize,
          difficulty,
          includeAnswers,
          promptStyle,
          style,
          targetAge,
          lineThickness,
          chapterCount,
          tone,
        },
        variables,
        titleTemplate: titleTemplate.trim(),
        subtitleTemplate: subtitleTemplate.trim(),
        variationCount,
      };

      let savedId = initialTemplateId;
      if (savedId) {
        await updateBulkTemplate(savedId, payload);
        useToastStore.getState().addToast({ message: 'Template updated successfully!', type: 'success' });
      } else {
        savedId = await saveBulkTemplate(uid, payload);
        useToastStore.getState().addToast({ message: 'Template created successfully!', type: 'success' });
      }

      if (andRun) {
        const fullTemplate: BulkTemplate = {
          ...payload,
          id: savedId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const jobId = await createBulkJob(uid, fullTemplate);
        useToastStore.getState().addToast({
          message: `Batch job initialized with ${variationCount} books! 🚀`,
          type: 'success',
        });
        onJobCreated(jobId);
      } else {
        onNavigate('bulk');
      }
    } catch (err: any) {
      useToastStore.getState().addToast({ message: err.message || 'Failed to save template', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 text-slate-100 space-y-6">
      {/* Top Header & Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Back to Bulk Generator</span>
      </button>

      {/* Progress Bar Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Step {step} of 4:
            </span>
            <span className="text-sm font-bold text-white">
              {step === 1 && 'Template Basics'}
              {step === 2 && 'Shared Book Settings'}
              {step === 3 && 'Dynamic Variables (Core Step)'}
              {step === 4 && 'Review & Execute Batch'}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {variationCount} Variations • ~{Math.ceil(estimatedSeconds / 60)} min runtime
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= step ? 'bg-gradient-to-r from-amber-500 to-purple-600 shadow-xs' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 1: TEMPLATE BASICS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              1. Name & Select Book Category
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Choose the foundational format that all generated book variations will share.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. 'Ocean Themed Puzzle Books' or 'Daily Gratitude Series'"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Select Book Type (2×4 Grid)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {(
                [
                  'word-search',
                  'word-fit',
                  'coloring-book',
                  'color-by-number',
                  'journal',
                  'planner',
                  'non-fiction',
                  'activity-book',
                ] as BulkBookType[]
              ).map((typeKey) => {
                const meta = BULK_BOOK_TYPE_METADATA[typeKey];
                const isSelected = bookType === typeKey;

                return (
                  <div
                    key={typeKey}
                    onClick={() => setBookType(typeKey)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20 shadow-md'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">
                          {typeKey === 'word-search' && '🔍'}
                          {typeKey === 'word-fit' && '🔤'}
                          {typeKey === 'coloring-book' && '🎨'}
                          {typeKey === 'color-by-number' && '🎨🔢'}
                          {typeKey === 'journal' && '📓'}
                          {typeKey === 'planner' && '📅'}
                          {typeKey === 'non-fiction' && '📚'}
                          {typeKey === 'activity-book' && '🧩'}
                        </span>
                        {isSelected && <CheckCircle2 size={16} className="text-purple-400" />}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-tight">{meta.label}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{meta.description}</p>
                    </div>

                    <span className="mt-3 text-[10px] text-slate-500 font-mono block">
                      Trim: {meta.defaultTrim}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next: Shared Settings</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 2: SHARED SETTINGS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              2. Shared Book Settings
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              These publishing dimensions and layout specs will apply consistently across every book in the batch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                KDP Trim Size
              </label>
              <select
                value={trimSize}
                onChange={(e) => setTrimSize(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="8.5x11">8.5 × 11 in (Large Print / Coloring / Puzzles)</option>
                <option value="6x9">6 × 9 in (Standard Journal / Non-Fiction)</option>
                <option value="8.5x8.5">8.5 × 8.5 in (Square)</option>
                <option value="5.5x8.5">5.5 × 8.5 in (Compact Trade)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Interior Paper Type
              </label>
              <div className="flex items-center gap-2">
                {['white', 'cream'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPaperType(p)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                      paperType === p
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-950 border border-slate-800 text-slate-400'
                    }`}
                  >
                    {p} Paper
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Page Count per Book: {pageCount} pages
              </label>
              <input
                type="range"
                min={bookType === 'journal' ? 40 : 15}
                max={bookType === 'journal' ? 200 : 50}
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full accent-purple-500 mt-2"
              />
            </div>
          </div>

          {/* Book Type Specific Section */}
          {(bookType === 'word-search' || bookType === 'word-fit') && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                Puzzle Engine Specifics
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Grid Size</label>
                  <select
                    value={gridSize}
                    onChange={(e) => setGridSize(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value={10}>10 × 10 (Easy / Kids)</option>
                    <option value={12}>12 × 12 (Medium)</option>
                    <option value={15}>15 × 15 (Standard Adult)</option>
                    <option value={20}>20 × 20 (Challenging)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white capitalize"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="answers_check"
                    checked={includeAnswers}
                    onChange={(e) => setIncludeAnswers(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="answers_check" className="text-xs text-slate-300">
                    Include Solutions Section
                  </label>
                </div>
              </div>
            </div>
          )}

          {bookType === 'journal' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                Journal Page Format
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['lined', 'dotted', 'blank', 'prompted'] as const).map((pst) => (
                  <button
                    key={pst}
                    type="button"
                    onClick={() => setPromptStyle(pst)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold capitalize transition-all cursor-pointer ${
                      promptStyle === pst
                        ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {pst}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next: Dynamic Variables</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 3: VARIABLES BUILDER (THE CORE STEP) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              3. Dynamic Variables & Title Templates
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Variables define what changes between book variations (themes, topics, colors, volume numbers).
            </p>
          </div>

          {/* Variables List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Defined Variables ({variables.length})
              </span>
              <button
                onClick={handleOpenAddVariable}
                className="px-3 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Variable</span>
              </button>
            </div>

            {variables.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No variables added yet. Click "+ Add Variable" to define dynamic themes, topics, or colors.
              </div>
            ) : (
              <div className="space-y-2">
                {variables.map((v) => {
                  const valuesCount =
                    v.type === 'text'
                      ? v.values?.length || 0
                      : v.type === 'color'
                      ? v.colors?.length || 0
                      : v.type === 'ai-generate'
                      ? v.generatedValues?.length || v.aiCount || 10
                      : v.selectedValues?.length || 0;

                  return (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/60">
                            {`{${v.name}}`}
                          </span>
                          <span className="text-xs font-bold text-white">{v.label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 capitalize">
                            {v.type} ({valuesCount} values)
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {v.type === 'color' ? (
                            v.colors?.slice(0, 6).map((c, cIdx) => (
                              <div
                                key={cIdx}
                                className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                                style={{ backgroundColor: c }}
                              />
                            ))
                          ) : (
                            (v.values || v.generatedValues || v.selectedValues || [])
                              .slice(0, 4)
                              .map((val, valIdx) => (
                                <span
                                  key={valIdx}
                                  className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono"
                                >
                                  {val}
                                </span>
                              ))
                          )}
                          {valuesCount > 4 && (
                            <span className="text-[10px] text-slate-500 py-0.5">
                              +{valuesCount - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEditVariable(v)}
                          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteVariable(v.id)}
                          className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950 text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Variation Count Meter */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                This template will create {variationCount} book variations
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Driven by the variable with the most items. (Max 20 variations per batch)
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold border uppercase tracking-wider ${
                variationCount >= 16
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : variationCount >= 10
                  ? 'bg-amber-950 text-amber-300 border-amber-700'
                  : 'bg-purple-950 text-purple-300 border-purple-700'
              }`}
            >
              {variationCount} Books Batch
            </span>
          </div>

          {/* Title & Subtitle Template Builders */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Book Title Template
                </label>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>Insert Tag:</span>
                  {variables.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setTitleTemplate((prev) => `${prev} {${v.name}}`)}
                      className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 font-mono text-[10px] hover:bg-purple-900 cursor-pointer"
                    >
                      {`{${v.name}}`}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={titleTemplate}
                onChange={(e) => setTitleTemplate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-medium focus:outline-hidden focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Subtitle Template (Optional)
              </label>
              <input
                type="text"
                value={subtitleTemplate}
                onChange={(e) => setSubtitleTemplate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
              />
            </div>

            {/* Live Title Previews */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Live Title Previews (First 3 Books):
              </span>
              {calculatedVariations.slice(0, 3).map((cv, idx) => (
                <div key={idx} className="text-xs text-purple-200 font-medium">
                  <span className="text-slate-500 font-mono mr-2">#{idx + 1}</span>
                  <span>{cv.resolvedTitle}</span>
                  {cv.resolvedSubtitle && (
                    <span className="text-slate-400 italic ml-2">— {cv.resolvedSubtitle}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next: Review & Save</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 4: REVIEW & SAVE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              4. Review Batch & Execute
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verify your template configuration and inspect all resolved book titles before saving.
            </p>
          </div>

          {/* Summary Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">Template Name:</span>
              <span className="font-bold text-white">{templateName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Book Category:</span>
              <span className="font-bold text-purple-300 capitalize">{bookType.replace('-', ' ')}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Variations:</span>
              <span className="font-bold text-emerald-400">{variationCount} books</span>
            </div>
            <div>
              <span className="text-slate-500 block">Estimated Time:</span>
              <span className="font-bold text-amber-400">~{Math.ceil(estimatedSeconds / 60)} minutes</span>
            </div>
          </div>

          {/* All Resolved Titles Scrollable List */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              All {variationCount} Book Titles to be Created:
            </span>
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {calculatedVariations.map((cv, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-950 text-purple-300 font-mono text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white">{cv.resolvedTitle}</span>
                      {cv.resolvedSubtitle && (
                        <p className="text-[11px] text-slate-400 italic">{cv.resolvedSubtitle}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-800">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
            >
              ← Back to Variables
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleSaveTemplate(false)}
                disabled={isSaving}
                className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Save Template Only
              </button>

              <button
                onClick={() => handleSaveTemplate(true)}
                disabled={isSaving}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={14} className="fill-slate-950" />
                <span>{isSaving ? 'Processing...' : 'Save & Run Batch Now 🚀'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VARIABLE BUILDER DRAWER / MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-purple-500/40 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <span>{editingVarId ? 'Edit Dynamic Variable' : 'Add Dynamic Variable'}</span>
              </h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Tag Identifier (no spaces)
                </label>
                <input
                  type="text"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value.replace(/\s+/g, '_').toLowerCase())}
                  placeholder="e.g. 'theme', 'topic'"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-purple-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Display Label
                </label>
                <input
                  type="text"
                  value={varLabel}
                  onChange={(e) => setVarLabel(e.target.value)}
                  placeholder="e.g. 'Book Theme'"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            {/* Variable Type Radio Cards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Variable Source Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: 'text', label: 'Text List', icon: '📝' },
                    { id: 'color', label: 'Color List', icon: '🎨' },
                    { id: 'ai-generate', label: 'AI Generate', icon: '🤖' },
                    { id: 'select', label: 'Options', icon: '📋' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setVarType(t.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      varType === t.id
                        ? 'bg-purple-950 border-purple-500 text-purple-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* If Text List */}
            {varType === 'text' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Enter Values (One value per line):
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {varTextLines.split('\n').filter(Boolean).length} items
                  </span>
                </div>

                <textarea
                  value={varTextLines}
                  onChange={(e) => setVarTextLines(e.target.value)}
                  rows={6}
                  placeholder="Ocean Animals&#10;Forest Wildlife&#10;Desert Safari&#10;Mountain Peaks&#10;Tropical Birds"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:border-purple-500"
                />

                {/* Quick Fills */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
                    Quick Fills:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(QUICK_FILLS).map((qf) => (
                      <button
                        key={qf}
                        type="button"
                        onClick={() => setVarTextLines(QUICK_FILLS[qf].join('\n'))}
                        className="px-2 py-1 rounded bg-slate-950 border border-slate-800 hover:border-purple-500 text-[10px] text-slate-300 transition-colors cursor-pointer"
                      >
                        {qf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* If Color List */}
            {varType === 'color' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Cover Color Palette:</label>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  {varColors.map((col, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: col }} />
                      <span className="text-[10px] font-mono text-slate-300">{col}</span>
                      <button
                        type="button"
                        onClick={() => setVarColors((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 text-xs ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick Palettes */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
                    Quick Color Palettes:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(QUICK_PALETTES).map((pal) => (
                      <button
                        key={pal}
                        type="button"
                        onClick={() => setVarColors(QUICK_PALETTES[pal])}
                        className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-purple-500 text-[10px] text-slate-300 transition-colors cursor-pointer"
                      >
                        {pal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* If AI Generate */}
            {varType === 'ai-generate' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    AI Prompt (What values should Gemini generate?):
                  </label>
                  <textarea
                    value={varAiPrompt}
                    onChange={(e) => setVarAiPrompt(e.target.value)}
                    rows={2}
                    placeholder="e.g. 'Unique beginner yoga poses with focus on breathing'"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Generate Count:</span>
                    <select
                      value={varAiCount}
                      onChange={(e) => setVarAiCount(Number(e.target.value))}
                      className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                    >
                      {[5, 10, 15, 20].map((num) => (
                        <option key={num} value={num}>
                          {num} variations
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handlePreviewAiValues}
                    disabled={isPreviewingAi}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>{isPreviewingAi ? 'Generating...' : 'Preview AI Values'}</span>
                  </button>
                </div>

                {varGeneratedValues.length > 0 && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-purple-500/40 space-y-1.5">
                    <span className="text-[10px] font-bold text-purple-300 uppercase">
                      Generated Values ({varGeneratedValues.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {varGeneratedValues.map((gv, gIdx) => (
                        <span key={gIdx} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-200">
                          {gv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If Select */}
            {varType === 'select' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Select Options:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {QUICK_FILLS['US States'].map((st) => {
                    const isPicked = varSelectedOptions.includes(st);
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() =>
                          setVarSelectedOptions((prev) =>
                            isPicked ? prev.filter((p) => p !== st) : [...prev, st]
                          )
                        }
                        className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                          isPicked
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVariableFromDrawer}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Save Variable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
