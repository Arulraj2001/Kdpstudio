import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  Sparkles, 
  Download, 
  Clock, 
  Users, 
  Flame, 
  ChefHat, 
  Plus, 
  Trash2, 
  Layers, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { 
  CookbookProject, 
  SAMPLE_COOKBOOKS, 
  Recipe 
} from '../../lib/studios/cookbookEngine';
import { exportCookbookPdf } from '../../lib/toolsPdfExport';
import { SEOHead } from '../seo/SEOHead';
import { PageRoute } from '../../types';

interface CookbookStudioViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const CookbookStudioView: React.FC<CookbookStudioViewProps> = ({ onNavigate }) => {
  const [project, setProject] = useState<CookbookProject>(() => ({ ...SAMPLE_COOKBOOKS[0] }));
  const [activeRecipeIdx, setActiveRecipeIdx] = useState<number>(0);
  const [trimSize, setTrimSize] = useState<'8.5x11' | '6x9'>('8.5x11');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const activeRecipe = project.recipes[activeRecipeIdx] || project.recipes[0];

  const handleUpdateRecipeField = <K extends keyof Recipe>(field: K, value: Recipe[K]) => {
    const updated = [...project.recipes];
    updated[activeRecipeIdx] = {
      ...updated[activeRecipeIdx],
      [field]: value,
    };
    setProject({ ...project, recipes: updated });
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportCookbookPdf(project, trimSize);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20 font-sans">
      <SEOHead
        pageKey="features"
        title="Cookbook & Structured Recipe Studio — KDP Studio"
        description="Create commercial-grade recipe books and culinary manuscripts for Amazon KDP with structured ingredients, step-by-step instructions, nutrition specs, and 300 DPI PDF exports."
        canonicalPath="/studios/cookbook"
      />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <UtensilsCrossed size={14} className="text-amber-400" />
            <span>Culinary Publishing Studio</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Cookbook &amp; Recipe <span className="font-serif italic font-normal text-amber-400">Publishing Studio</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Design structured gourmet recipes with prep times, macro nutrition, structured ingredients, and chef's tips. Export ready-to-print 300 DPI cookbook manuscripts.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT: RECIPE MANAGER & PARAMETERS ── */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Recipe Editor
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {project.recipes.length} Recipes in Book
              </span>
            </div>

            {/* Recipe Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Recipe
              </label>
              <div className="space-y-1.5">
                {project.recipes.map((rec, idx) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => setActiveRecipeIdx(idx)}
                    className={`w-full py-2.5 px-3 rounded-2xl font-bold text-xs text-left transition-all cursor-pointer flex items-center justify-between border ${
                      activeRecipeIdx === idx
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{idx + 1}. {rec.title}</span>
                    <span className={`text-[10px] ${activeRecipeIdx === idx ? 'text-amber-100' : 'text-slate-400'}`}>
                      {rec.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Edit Fields */}
            <div className="space-y-4 pt-2 border-t border-slate-100 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Recipe Title</label>
                <input
                  type="text"
                  value={activeRecipe.title}
                  onChange={(e) => handleUpdateRecipeField('title', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Subtitle / Flavor Hook</label>
                <input
                  type="text"
                  value={activeRecipe.subtitle}
                  onChange={(e) => handleUpdateRecipeField('subtitle', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:border-amber-500"
                />
              </div>

              {/* Prep / Cook / Servings / Calories Grid */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500">Prep (mins)</label>
                  <input
                    type="number"
                    value={activeRecipe.prepTimeMinutes}
                    onChange={(e) => handleUpdateRecipeField('prepTimeMinutes', Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500">Cook (mins)</label>
                  <input
                    type="number"
                    value={activeRecipe.cookTimeMinutes}
                    onChange={(e) => handleUpdateRecipeField('cookTimeMinutes', Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500">Servings</label>
                  <input
                    type="number"
                    value={activeRecipe.servings}
                    onChange={(e) => handleUpdateRecipeField('servings', Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500">Calories</label>
                  <input
                    type="number"
                    value={activeRecipe.nutrition.calories}
                    onChange={(e) => handleUpdateRecipeField('nutrition', {
                      ...activeRecipe.nutrition,
                      calories: Number(e.target.value)
                    })}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Chef's Pro Tip</label>
                <textarea
                  rows={2}
                  value={activeRecipe.chefTip}
                  onChange={(e) => handleUpdateRecipeField('chefTip', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            {/* Export Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-xl shadow-amber-900/20 hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={16} />
                <span>{isExporting ? 'Generating PDF Manuscript...' : 'Export Complete Cookbook Manuscript PDF'}</span>
              </button>
            </div>

          </div>

          {/* ── RIGHT: LUXURY 2-COLUMN RECIPE PAGE PREVIEW ── */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                  {activeRecipe.category}
                </span>
                <h2 className="text-xl font-serif font-black text-slate-900">{activeRecipe.title}</h2>
                <p className="text-xs font-serif italic text-slate-500">{activeRecipe.subtitle}</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {trimSize}" Standard
              </span>
            </div>

            {/* Specs Bar */}
            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center text-xs">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Prep Time</div>
                <div className="font-bold text-slate-900">{activeRecipe.prepTimeMinutes} mins</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Cook Time</div>
                <div className="font-bold text-slate-900">{activeRecipe.cookTimeMinutes} mins</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Servings</div>
                <div className="font-bold text-slate-900">{activeRecipe.servings} People</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Calories</div>
                <div className="font-bold text-amber-600">{activeRecipe.nutrition.calories} kcal</div>
              </div>
            </div>

            {/* 2-Column: Ingredients vs Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              
              {/* Ingredients (5 Cols) */}
              <div className="md:col-span-5 space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Ingredients ({activeRecipe.ingredients.length})
                </h3>
                <ul className="space-y-2 text-xs text-slate-700">
                  {activeRecipe.ingredients.map((ing, iIdx) => (
                    <li key={iIdx} className="flex items-start gap-1.5 leading-snug">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>
                        <strong className="text-slate-900">{ing.amount}</strong> {ing.item}
                        {ing.notes && <span className="text-slate-400 italic"> ({ing.notes})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions (7 Cols) */}
              <div className="md:col-span-7 space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Step-by-Step Method
                </h3>
                <ol className="space-y-3 text-xs text-slate-700">
                  {activeRecipe.instructions.map((step, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {sIdx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

            </div>

            {/* Chef Tip Box */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
              <ChefHat size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-900 block">Chef's Pro Tip</span>
                <span className="text-amber-800 leading-relaxed">{activeRecipe.chefTip}</span>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
