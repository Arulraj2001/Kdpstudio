import React, { useState } from 'react';
import {
  FileText,
  Tag,
  Layers,
  Calculator,
  BookOpen,
  Type,
  BookMarked,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useBookStore } from '../../lib/store';
import { PageRoute } from '../../types';
import { DescriptionTab } from './DescriptionTab';
import { KeywordsTab } from './KeywordsTab';
import { CategoriesTab } from './CategoriesTab';
import { RoyaltyCalculatorTab } from './RoyaltyCalculatorTab';
import { BackCoverBlurbTab } from './BackCoverBlurbTab';
import { TitleAnalyzerTab } from './TitleAnalyzerTab';

interface KdpAssistantViewProps {
  onNavigate?: (route: PageRoute) => void;
}

type TabType = 'description' | 'keywords' | 'categories' | 'pricing' | 'blurb' | 'title';

export const KdpAssistantView: React.FC<KdpAssistantViewProps> = ({ onNavigate }) => {
  const { books, currentBook, setCurrentBook } = useBookStore();
  const [activeTab, setActiveTab] = useState<TabType>('description');

  const tabs: Array<{ id: TabType; label: string; icon: React.ComponentType<{ size: number; className?: string }> }> = [
    { id: 'description', label: 'Book Description', icon: FileText },
    { id: 'keywords', label: '7 KDP Keywords', icon: Tag },
    { id: 'categories', label: 'BISAC Categories', icon: Layers },
    { id: 'pricing', label: 'Pricing & Royalties', icon: Calculator },
    { id: 'blurb', label: 'Back Cover Blurb', icon: BookOpen },
    { id: 'title', label: 'Title & Hook Analyzer', icon: Type },
  ];

  return (
    <div id="kdp-assistant-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card & Active Book Switcher */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} />
              Amazon Publishing Suite
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            KDP Assistant & Metadata Optimization
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Engineer bestselling HTML descriptions, discover top-ranking search keywords, locate low-competition BISAC
            categories, simulate royalties, and craft high-converting cover blurbs.
          </p>
        </div>

        {/* Book Selector */}
        {books.length > 0 && (
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-3 self-start lg:self-center">
            <BookMarked size={16} className="text-purple-600 ml-1 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500">Active Working Book</span>
              <select
                value={currentBook?.id || ''}
                onChange={(e) => setCurrentBook(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 border-0 p-0 focus:ring-0 cursor-pointer pr-4"
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.genre})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="transition-all duration-200">
        {activeTab === 'description' && <DescriptionTab />}
        {activeTab === 'keywords' && <KeywordsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'pricing' && <RoyaltyCalculatorTab />}
        {activeTab === 'blurb' && (
          <BackCoverBlurbTab
            onNavigateToCoverBuilder={() => {
              if (onNavigate) onNavigate('cover');
            }}
          />
        )}
        {activeTab === 'title' && <TitleAnalyzerTab />}
      </div>
    </div>
  );
};
