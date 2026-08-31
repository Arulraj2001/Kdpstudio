'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Globe, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Eye, 
  Check, 
  AlertCircle, 
  Sliders, 
  ShieldCheck, 
  Download, 
  Copy, 
  ExternalLink,
  Layers,
  Code,
  Share2,
  Tag,
  Plus,
  X,
  FileText
} from 'lucide-react';
import { 
  GlobalSEOConfig, 
  PageSEOConfig, 
  CANONICAL_DEFAULT_SEO, 
  getLiveGlobalSEO, 
  saveGlobalSEOConfig,
  generateSitemapXml 
} from '../../../lib/seoService';
import { useAuthStore } from '../../../lib/authStore';

export const SiteSeoAdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<GlobalSEOConfig>(() => getLiveGlobalSEO());
  const [activeTab, setActiveTab] = useState<'marketing' | 'tools' | 'global' | 'sitemap'>('marketing');
  const [selectedPageKey, setSelectedPageKey] = useState<string>('home');
  const [keywordInput, setKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSitemap, setCopiedSitemap] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    setConfig(getLiveGlobalSEO());
  }, []);

  const currentPage: PageSEOConfig = config.pages[selectedPageKey] || CANONICAL_DEFAULT_SEO.pages.home;

  const handlePageFieldChange = <K extends keyof PageSEOConfig>(field: K, value: PageSEOConfig[K]) => {
    setConfig((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [selectedPageKey]: {
          ...(prev.pages[selectedPageKey] || CANONICAL_DEFAULT_SEO.pages.home),
          [field]: value
        }
      }
    }));
  };

  const handleGlobalFieldChange = <K extends keyof GlobalSEOConfig>(field: K, value: GlobalSEOConfig[K]) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddKeyword = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const trimmed = keywordInput.trim().replace(/^,+|,+$/g, '');
    if (!trimmed) return;

    const currentKeywords = currentPage.keywords || [];
    if (!currentKeywords.includes(trimmed)) {
      handlePageFieldChange('keywords', [...currentKeywords, trimmed]);
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    const currentKeywords = currentPage.keywords || [];
    handlePageFieldChange('keywords', currentKeywords.filter((k) => k !== kwToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveGlobalSEOConfig(config, user?.email || 'admin');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save SEO config:', err);
      alert('Failed to save SEO configuration. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all SEO tags and metadata to canonical defaults?')) {
      setConfig(CANONICAL_DEFAULT_SEO);
    }
  };

  const handleCopySitemap = () => {
    const xml = generateSitemapXml();
    navigator.clipboard.writeText(xml);
    setCopiedSitemap(true);
    setTimeout(() => setCopiedSitemap(false), 2500);
  };

  const marketingPageKeys = Object.keys(config.pages).filter(
    (k) => config.pages[k].category === 'marketing' || config.pages[k].category === 'content' || config.pages[k].category === 'legal'
  );

  const toolPageKeys = Object.keys(config.pages).filter(
    (k) => config.pages[k].category === 'tool'
  );

  const titleLength = currentPage.title.length;
  const descLength = currentPage.description.length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Header & Save Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Search size={22} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Site-Wide SEO & Meta Manager
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              v{config.version || 1} • Live Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage Google SERP snippets, OpenGraph social cards, target keywords, and sitemap priorities across all pages in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-900/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span className="animate-spin">⏳</span>
            ) : saveSuccess ? (
              <Check size={16} className="text-emerald-300" />
            ) : (
              <Save size={16} />
            )}
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved Live!' : 'Save SEO Config'}</span>
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs sm:text-sm font-bold text-slate-600">
        <button
          onClick={() => {
            setActiveTab('marketing');
            if (!marketingPageKeys.includes(selectedPageKey)) setSelectedPageKey('home');
          }}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'marketing' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-100'
          }`}
        >
          Marketing & Public Pages ({marketingPageKeys.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('tools');
            if (!toolPageKeys.includes(selectedPageKey)) setSelectedPageKey('dashboard');
          }}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'tools' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-100'
          }`}
        >
          Dashboard & Tool Pages ({toolPageKeys.length})
        </button>

        <button
          onClick={() => setActiveTab('global')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'global' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-100'
          }`}
        >
          Global Head & Verification
        </button>

        <button
          onClick={() => setActiveTab('sitemap')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'sitemap' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-100'
          }`}
        >
          Sitemap & Robots.txt
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          PAGE EDITOR VIEW (Marketing & Tool Tabs)
         ───────────────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'marketing' || activeTab === 'tools') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Page Selector Sidebar (3 cols) */}
          <div className="lg:col-span-3 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block px-1">
              Select Page to Edit
            </label>
            <div className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1 shadow-xs max-h-[600px] overflow-y-auto">
              {(activeTab === 'marketing' ? marketingPageKeys : toolPageKeys).map((key) => {
                const p = config.pages[key];
                const isSelected = selectedPageKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPageKey(key)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="truncate">
                      <div className="text-xs truncate">{p.pageName || key}</div>
                      <div className="text-[10px] font-mono text-slate-400">{p.route}</div>
                    </div>
                    {p.noindex && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">
                        noindex
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Column: Field Inputs (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{currentPage.pageName}</h2>
                  <span className="text-xs font-mono text-slate-400">{currentPage.route}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentPage.noindex}
                      onChange={(e) => handlePageFieldChange('noindex', e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                    />
                    <span>NoIndex (Hide from Google)</span>
                  </label>
                </div>
              </div>

              {/* Page Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">Page Title (&lt;title&gt;)</label>
                  <span className={`font-mono text-[11px] ${titleLength > 60 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                    {titleLength} / 60 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={currentPage.title}
                  onChange={(e) => handlePageFieldChange('title', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-xs sm:text-sm font-medium outline-none"
                  placeholder="e.g. KDP Studio — The Complete AI Self-Publishing Suite"
                />
              </div>

              {/* Meta Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">Meta Description</label>
                  <span className={`font-mono text-[11px] ${descLength > 160 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                    {descLength} / 158 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={currentPage.description}
                  onChange={(e) => handlePageFieldChange('description', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-xs sm:text-sm font-medium outline-none resize-none"
                  placeholder="Concise 140-155 character overview of the page content and target keywords..."
                />
              </div>

              {/* Keyword Tag Manager */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Target Search Keywords
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleAddKeyword}
                    placeholder="Type keyword and press Enter..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleAddKeyword}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(currentPage.keywords || []).map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-semibold"
                    >
                      <span>{kw}</span>
                      <X
                        size={12}
                        className="cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => handleRemoveKeyword(kw)}
                      />
                    </span>
                  ))}
                </div>
              </div>

              {/* OpenGraph Image URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Social Share Image URL (og:image / Twitter Card)
                </label>
                <input
                  type="text"
                  value={currentPage.ogImage}
                  onChange={(e) => handlePageFieldChange('ogImage', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-purple-500"
                  placeholder="https://images.unsplash.com/... or /og-image.png"
                />
              </div>

              {/* Sitemap Priority & Frequency */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Sitemap Priority</span>
                    <span className="font-mono text-purple-700">{currentPage.sitemapPriority.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={currentPage.sitemapPriority}
                    onChange={(e) => handlePageFieldChange('sitemapPriority', parseFloat(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Change Frequency
                  </label>
                  <select
                    value={currentPage.sitemapChangeFreq}
                    onChange={(e) => handlePageFieldChange('sitemapChangeFreq', e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none bg-white"
                  >
                    <option value="always">Always</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Live Google & Social Preview Simulators (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Google SERP Preview */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <Search size={16} className="text-purple-600" />
                  <span className="text-xs font-bold text-slate-900">Google SERP Snippet Preview</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2 py-0.5 rounded ${previewDevice === 'desktop' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2 py-0.5 rounded ${previewDevice === 'mobile' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              {/* SERP Mockup Box */}
              <div className={`p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-1.5 ${previewDevice === 'mobile' ? 'max-w-[280px] mx-auto' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center p-0.5 shadow-2xs">
                    <img src="/brand-icon.png?v=20260831" alt="icon" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="truncate">
                    <div className="text-[11px] text-slate-800 font-semibold leading-none">KDP Studio</div>
                    <div className="text-[9px] text-slate-400 font-mono leading-none truncate">
                      https://kdpstudio-aio.web.app{currentPage.canonicalPath || currentPage.route}
                    </div>
                  </div>
                </div>

                <div className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-2">
                  {currentPage.title || 'Page Title'}
                </div>

                <div className="text-xs text-[#4d5156] leading-relaxed line-clamp-3">
                  {currentPage.description || 'Page meta description will appear here in Google search results...'}
                </div>
              </div>
            </div>

            {/* Social Share Card Preview (OpenGraph / Twitter) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Share2 size={16} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">Social Share Card Preview (OpenGraph)</span>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-white space-y-2">
                <div className="aspect-[1.91/1] w-full bg-slate-950 overflow-hidden relative">
                  <img
                    src={currentPage.ogImage || config.defaultOgImage}
                    alt="og preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-mono text-purple-300">
                    kdpstudio-aio.web.app
                  </div>
                </div>
                <div className="p-3 pt-1 space-y-1">
                  <div className="text-xs font-black truncate">{currentPage.title}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {currentPage.description}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          GLOBAL HEAD & SEARCH VERIFICATION TAB
         ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'global' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-4xl mx-auto space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Global Head Settings & Search Verifications</h2>
            <p className="text-xs text-slate-500">
              Configure site-wide defaults, domain verification codes, and tracking tags across all pages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Site Name</label>
              <input
                type="text"
                value={config.siteName}
                onChange={(e) => handleGlobalFieldChange('siteName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Twitter Creator Handle</label>
              <input
                type="text"
                value={config.twitterHandle}
                onChange={(e) => handleGlobalFieldChange('twitterHandle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-purple-500"
                placeholder="@kdpstudio"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Google Search Console Verification Code</label>
              <input
                type="text"
                value={config.googleSiteVerification || ''}
                onChange={(e) => handleGlobalFieldChange('googleSiteVerification', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-purple-500"
                placeholder="google-site-verification token..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Bing Webmaster Verification Code</label>
              <input
                type="text"
                value={config.bingSiteVerification || ''}
                onChange={(e) => handleGlobalFieldChange('bingSiteVerification', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-purple-500"
                placeholder="msvalidate.01 token..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Default Social Share Image (Fallback)</label>
            <input
              type="text"
              value={config.defaultOgImage}
              onChange={(e) => handleGlobalFieldChange('defaultOgImage', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Global Custom Head Scripts (Google Analytics GA4, Meta Pixel, GTM)
            </label>
            <textarea
              rows={4}
              value={config.globalHeadScripts || ''}
              onChange={(e) => handleGlobalFieldChange('globalHeadScripts', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-purple-500 resize-none"
              placeholder="<!-- Injected into <head> -->"
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          SITEMAP & ROBOTS.TXT TAB
         ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'sitemap' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-4xl mx-auto space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">XML Sitemap & Robots.txt Generator</h2>
              <p className="text-xs text-slate-500">
                Preview and copy the live sitemap.xml dynamically generated from your active page priorities.
              </p>
            </div>
            <button
              onClick={handleCopySitemap}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {copiedSitemap ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedSitemap ? 'Copied to Clipboard!' : 'Copy Sitemap XML'}</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Dynamic Sitemap Preview</label>
            <pre className="p-4 rounded-2xl bg-slate-950 text-purple-300 font-mono text-xs overflow-x-auto max-h-[400px]">
              {generateSitemapXml()}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
};
