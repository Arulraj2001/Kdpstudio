import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Trash2, 
  Plus, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  ShieldCheck, 
  Share2, 
  User, 
  Check, 
  AlertTriangle, 
  Lock, 
  Zap,
  RefreshCw,
  Eye,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { useBrandStore } from '../../lib/brandStore';
import { uploadAuthorPhoto, uploadLogo, formatCopyrightText } from '../../lib/brandService';
import { PenName } from '../../types/brand';

// Curated Google Fonts List
const GOOGLE_FONTS = [
  // Serif
  { name: 'Playfair Display', category: 'Serif' },
  { name: 'Crimson Text', category: 'Serif' },
  { name: 'Libre Baskerville', category: 'Serif' },
  { name: 'EB Garamond', category: 'Serif' },
  { name: 'Lora', category: 'Serif' },
  { name: 'Merriweather', category: 'Serif' },
  { name: 'PT Serif', category: 'Serif' },
  { name: 'Cinzel', category: 'Serif' },
  { name: 'Cormorant Garamond', category: 'Serif' },

  // Sans-Serif
  { name: 'Inter', category: 'Sans-Serif' },
  { name: 'Nunito', category: 'Sans-Serif' },
  { name: 'Raleway', category: 'Sans-Serif' },
  { name: 'Montserrat', category: 'Sans-Serif' },
  { name: 'Poppins', category: 'Sans-Serif' },
  { name: 'Open Sans', category: 'Sans-Serif' },
  { name: 'Lato', category: 'Sans-Serif' },
  { name: 'Roboto', category: 'Sans-Serif' },

  // Display
  { name: 'Oswald', category: 'Display' },
  { name: 'Abril Fatface', category: 'Display' },
  { name: 'Bebas Neue', category: 'Display' },
  { name: 'Righteous', category: 'Display' },
  { name: 'Almendra Display', category: 'Display' },

  // Handwriting
  { name: 'Dancing Script', category: 'Handwriting' },
  { name: 'Pacifico', category: 'Handwriting' },
  { name: 'Sacramento', category: 'Handwriting' },
  { name: 'Satisfy', category: 'Handwriting' },
  { name: 'Great Vibes', category: 'Handwriting' },
];

const PALETTE_PRESETS = [
  {
    name: 'Professional',
    primary: '#1e3a8a',
    secondary: '#3b82f6',
    accent: '#d97706',
    text: '#0f172a',
    background: '#ffffff',
  },
  {
    name: 'Creative',
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#f59e0b',
    text: '#0f172a',
    background: '#fdf4ff',
  },
  {
    name: 'Nature & Botanical',
    primary: '#15803d',
    secondary: '#84cc16',
    accent: '#b45309',
    text: '#0f172a',
    background: '#f0fdf4',
  },
  {
    name: 'Modern Minimal',
    primary: '#0f172a',
    secondary: '#475569',
    accent: '#6366f1',
    text: '#0f172a',
    background: '#ffffff',
  },
  {
    name: 'Warm Literary',
    primary: '#991b1b',
    secondary: '#d97706',
    accent: '#b45309',
    text: '#1c1917',
    background: '#fefaf3',
  },
  {
    name: 'Cool Tech & Sci-Fi',
    primary: '#0e7490',
    secondary: '#4338ca',
    accent: '#06b6d4',
    text: '#0f172a',
    background: '#f8fafc',
  },
];

const FONT_PAIRINGS = [
  { name: 'Classic Elegance', heading: 'Playfair Display', body: 'EB Garamond', accent: 'Montserrat' },
  { name: 'Modern Clean', heading: 'Montserrat', body: 'Open Sans', accent: 'Poppins' },
  { name: 'Timeless Literary', heading: 'Cormorant Garamond', body: 'Lora', accent: 'Raleway' },
  { name: 'Bold Impact', heading: 'Bebas Neue', body: 'Lato', accent: 'Cinzel' },
];

export const BrandKitView: React.FC = () => {
  const { user, userDoc } = useAuthStore();
  const { open } = useCheckoutStore();
  const { 
    brandKit, 
    isSaving, 
    hasUnsavedChanges, 
    updateField, 
    updateFields, 
    saveChanges, 
    resetToSaved,
    addPenName,
    removePenName,
    setActivePenName
  } = useBrandStore();

  const isFreePlan = (userDoc?.plan || 'free') === 'free';
  const [activeTab, setActiveTab] = useState<'identity' | 'colors' | 'typography' | 'logo' | 'legal' | 'social'>('identity');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Pen Name modal
  const [showAddPenName, setShowAddPenName] = useState(false);
  const [newPenName, setNewPenName] = useState('');
  const [newPenGenre, setNewPenGenre] = useState('');
  const [newPenBio, setNewPenBio] = useState('');

  // AI palette generation
  const [paletteVibe, setPaletteVibe] = useState('');
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);

  // AI Bio Generation
  const [generatingBioType, setGeneratingBioType] = useState<'short' | 'medium' | 'long' | null>(null);

  // File upload refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Dynamic Google Fonts Loader
  useEffect(() => {
    if (!brandKit) return;
    const fontsToLoad = [brandKit.headingFont, brandKit.bodyFont, brandKit.accentFont].filter(Boolean);
    fontsToLoad.forEach((font) => {
      const id = `gfont-${font.replace(/\s+/g, '-').toLowerCase()}`;
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;900&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, [brandKit?.headingFont, brandKit?.bodyFont, brandKit?.accentFont]);

  // Word count calculation
  const getWordCount = (text: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Handle Photo Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    setIsUploadingPhoto(true);
    try {
      const url = await uploadAuthorPhoto(user.uid, file);
      updateField('authorPhotoUrl', url);
    } catch (err) {
      console.error('Photo upload error:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Logo Upload
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadLogo(user.uid, file);
      updateField('logoUrl', url);
    } catch (err) {
      console.error('Logo upload error:', err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle AI Bio Generator
  const handleGenerateBio = async (length: 'short' | 'medium' | 'long') => {
    if (!user?.uid || !brandKit) return;
    setGeneratingBioType(length);
    try {
      const authorName = brandKit.activePenName || brandKit.authorName || userDoc?.name || 'Author';
      const existingBio = brandKit.authorBioShort || brandKit.authorBioMedium || brandKit.authorBioLong || '';

      const res = await fetch('/api/brand/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName,
          genre: brandKit.defaultGenre || 'Fiction',
          existingBio,
          targetLength: length,
        }),
      });

      const data = await res.json();
      if (data.success && data.bio) {
        if (length === 'short') updateField('authorBioShort', data.bio);
        if (length === 'medium') updateField('authorBioMedium', data.bio);
        if (length === 'long') updateField('authorBioLong', data.bio);
      }
    } catch (err) {
      console.error('AI Bio generation error:', err);
    } finally {
      setGeneratingBioType(null);
    }
  };

  // Handle AI Palette Generator
  const handleGeneratePalette = async () => {
    if (!paletteVibe) return;
    setIsGeneratingPalette(true);
    try {
      const res = await fetch('/api/brand/generate-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vibe: paletteVibe,
          genre: brandKit?.defaultGenre || 'Fiction',
        }),
      });

      const data = await res.json();
      if (data.success && data.palette) {
        updateFields({
          primaryColor: data.palette.primaryColor,
          secondaryColor: data.palette.secondaryColor,
          accentColor: data.palette.accentColor,
          textColor: data.palette.textColor,
          backgroundColor: data.palette.backgroundColor,
        });
      }
    } catch (err) {
      console.error('AI Palette generation error:', err);
    } finally {
      setIsGeneratingPalette(false);
    }
  };

  // Save Brand Kit
  const handleSave = async () => {
    if (!user?.uid) return;
    try {
      await saveChanges(user.uid);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Error saving brand kit:', err);
    }
  };

  // Rendered live copyright preview
  const liveCopyright = useMemo(() => {
    if (!brandKit) return '';
    return formatCopyrightText(brandKit.copyrightTemplate, {
      author: brandKit.activePenName || brandKit.authorName || 'Author Name',
      publisher: brandKit.publisherName || 'Publishing Imprint',
      website: brandKit.authorWebsite || 'www.authorwebsite.com',
      isbn: '978-3-16-148410-0',
    });
  }, [brandKit]);

  if (!brandKit) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        Loading Author Brand Kit...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-28 animate-fade-in relative">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-purple-100 text-purple-700">
              <Sparkles size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Author Publishing System
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Author Brand Kit
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Store your author identity, typography, color palette, and legal templates once. Automatically applied to every new book, cover, and export.
          </p>
        </div>

        {/* Auto-Apply Toggle */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <label className="text-xs font-bold text-slate-700 cursor-pointer select-none">
            Auto-apply to new books
          </label>
          <input
            type="checkbox"
            checked={brandKit.autoApplyToNewBooks}
            onChange={(e) => updateField('autoApplyToNewBooks', e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Free Plan Lockout Banner */}
      {isFreePlan && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-purple-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 text-purple-300">
              <Lock size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-400/20 text-purple-200 text-[11px] font-bold mb-1.5 border border-purple-400/30">
                <Zap size={11} />
                <span>Starter Plan &amp; Above</span>
              </div>
              <h2 className="text-lg font-bold text-white">Unlock Author Brand Kit</h2>
              <p className="text-xs text-purple-200 mt-1 max-w-xl leading-relaxed">
                Save hours on every book. Auto-fill covers, copyright pages, typography, and About the Author back-matter. Upgrade to Starter to save and apply your brand.
              </p>
            </div>
          </div>
          <button
            onClick={() => open('starter')}
            className="w-full md:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-purple-900 font-extrabold text-xs shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            Upgrade to Starter ($9/mo)
          </button>
        </div>
      )}

      {/* 6 Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'identity', label: 'Author Identity', icon: User },
          { id: 'colors', label: 'Brand Colors', icon: Palette },
          { id: 'typography', label: 'Typography', icon: Type },
          { id: 'logo', label: 'Logo & Assets', icon: ImageIcon },
          { id: 'legal', label: 'Copyright & Legal', icon: ShieldCheck },
          { id: 'social', label: 'Social & Links', icon: Share2 },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: Author Identity
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'identity' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <User size={18} className="text-purple-600" />
              <span>Author Profile &amp; Pen Names</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              {/* Left Column: Names & Photo */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Primary Author Name
                  </label>
                  <input
                    type="text"
                    value={brandKit.authorName}
                    onChange={(e) => updateField('authorName', e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 outline-none"
                  />
                  <span className="text-[11px] text-slate-400">
                    Default name on copyright pages and book covers
                  </span>
                </div>

                {/* Author Photo */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700">Author Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {brandKit.authorPhotoUrl ? (
                        <img src={brandKit.authorPhotoUrl} alt="Author" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={photoInputRef}
                          onChange={handlePhotoSelect}
                          accept="image/png,image/jpeg"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                        </button>
                        {brandKit.authorPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => updateField('authorPhotoUrl', null)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove Photo"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Used in About the Author back-matter. JPG or PNG, max 5MB.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Website URL</label>
                    <input
                      type="text"
                      value={brandKit.authorWebsite}
                      onChange={(e) => updateField('authorWebsite', e.target.value)}
                      placeholder="https://authorname.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Contact Email</label>
                    <input
                      type="email"
                      value={brandKit.authorEmail}
                      onChange={(e) => updateField('authorEmail', e.target.value)}
                      placeholder="author@example.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Pen Names Manager */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Pen Names ({brandKit.penNames?.length || 0}/5)
                    </h3>
                    <p className="text-[11px] text-slate-400">Publish under multiple pseudonyms or genres</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddPenName(true)}
                    disabled={(brandKit.penNames?.length || 0) >= 5}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer disabled:opacity-40"
                  >
                    <Plus size={14} />
                    <span>Add Pen Name</span>
                  </button>
                </div>

                {/* Pen Names Radio selector for active name */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-600">Active Pen Name for New Books:</div>
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-purple-300 transition-colors">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="activePenName"
                        checked={!brandKit.activePenName || brandKit.activePenName === brandKit.authorName}
                        onChange={() => setActivePenName(brandKit.authorName)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        {brandKit.authorName || 'Primary Author Name'} (Real Name)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Default</span>
                  </label>

                  {brandKit.penNames?.map((pen) => (
                    <div
                      key={pen.name}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 transition-colors"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="radio"
                          name="activePenName"
                          checked={brandKit.activePenName === pen.name}
                          onChange={() => setActivePenName(pen.name)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800">{pen.name}</div>
                          {pen.genre && <div className="text-[10px] text-purple-600">{pen.genre}</div>}
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={() => removePenName(pen.name)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Remove Pen Name"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Mini modal / drawer to add pen name */}
                {showAddPenName && (
                  <div className="p-4 rounded-xl bg-white border border-purple-200 shadow-sm space-y-3">
                    <div className="text-xs font-bold text-purple-900">New Pen Name</div>
                    <input
                      type="text"
                      value={newPenName}
                      onChange={(e) => setNewPenName(e.target.value)}
                      placeholder="Pen Name (e.g. Scarlett Rivers)"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs outline-none"
                    />
                    <input
                      type="text"
                      value={newPenGenre}
                      onChange={(e) => setNewPenGenre(e.target.value)}
                      placeholder="Genre (e.g. Dark Romance, Sci-Fi)"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddPenName(false)}
                        className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (newPenName) {
                            addPenName({ name: newPenName, genre: newPenGenre, bio: newPenBio });
                            setNewPenName('');
                            setNewPenGenre('');
                            setNewPenBio('');
                            setShowAddPenName(false);
                          }
                        }}
                        className="px-3 py-1 rounded-lg bg-purple-600 text-white font-bold text-xs"
                      >
                        Save Pen Name
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3 Author Bio Editors */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-purple-600" />
              <span>Author Bios &amp; Back-Matter</span>
            </h2>

            {/* Short Bio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span>Short Bio</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    getWordCount(brandKit.authorBioShort) > 50 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {getWordCount(brandKit.authorBioShort)}/50 words
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => handleGenerateBio('short')}
                  disabled={generatingBioType === 'short'}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer disabled:opacity-40"
                >
                  <Sparkles size={12} />
                  <span>{generatingBioType === 'short' ? 'Writing...' : 'AI Generate Short'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={brandKit.authorBioShort}
                onChange={(e) => updateField('authorBioShort', e.target.value)}
                placeholder="Brief 40-50 word bio for back covers and book jacket flaps..."
                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-900 focus:bg-white focus:border-purple-500 outline-none"
              />
            </div>

            {/* Medium Bio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span>Medium Bio (Standard Back-Matter)</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    getWordCount(brandKit.authorBioMedium) > 100 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {getWordCount(brandKit.authorBioMedium)}/100 words
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => handleGenerateBio('medium')}
                  disabled={generatingBioType === 'medium'}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer disabled:opacity-40"
                >
                  <Sparkles size={12} />
                  <span>{generatingBioType === 'medium' ? 'Writing...' : 'AI Generate Medium'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={brandKit.authorBioMedium}
                onChange={(e) => updateField('authorBioMedium', e.target.value)}
                placeholder="Standard 80-100 word bio for About the Author sections inside manuscripts..."
                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-900 focus:bg-white focus:border-purple-500 outline-none"
              />
            </div>

            {/* Long Bio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span>Long Bio (Amazon Author Central / Website)</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    getWordCount(brandKit.authorBioLong) > 200 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {getWordCount(brandKit.authorBioLong)}/200 words
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => handleGenerateBio('long')}
                  disabled={generatingBioType === 'long'}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer disabled:opacity-40"
                >
                  <Sparkles size={12} />
                  <span>{generatingBioType === 'long' ? 'Writing...' : 'AI Generate Long'}</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={brandKit.authorBioLong}
                onChange={(e) => updateField('authorBioLong', e.target.value)}
                placeholder="Comprehensive 180-200 word biography for Amazon Author Central and press kits..."
                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-900 focus:bg-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: Brand Colors & Live Mockup
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'colors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: 5 Color Pickers & AI */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Palette size={18} className="text-purple-600" />
                <span>Brand Color Palette</span>
              </h2>

              <div className="space-y-4">
                {[
                  { field: 'primaryColor', label: 'Primary Brand Color', desc: 'Main book title, spine, and dominant brand elements' },
                  { field: 'secondaryColor', label: 'Secondary Supporting Color', desc: 'Subheadings, background accents, and divider ribbons' },
                  { field: 'accentColor', label: 'Accent Highlight Color', desc: 'Callouts, badges, buttons, and decorative ornaments' },
                  { field: 'textColor', label: 'Main Text Color', desc: 'High-contrast typography for interior reading and covers' },
                  { field: 'backgroundColor', label: 'Background / Paper Color', desc: 'Base paper shade and clean cover backgrounds' },
                ].map((item) => (
                  <div key={item.field} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{item.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="color"
                        value={(brandKit as any)[item.field] || '#7c3aed'}
                        onChange={(e) => updateField(item.field as any, e.target.value)}
                        className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={(brandKit as any)[item.field] || ''}
                        onChange={(e) => updateField(item.field as any, e.target.value)}
                        className="w-20 px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800 uppercase outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 6 Color Presets */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-700">Curated Palette Presets:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PALETTE_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => updateFields({
                        primaryColor: p.primary,
                        secondaryColor: p.secondary,
                        accentColor: p.accent,
                        textColor: p.text,
                        backgroundColor: p.background,
                      })}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 bg-white text-left transition-all cursor-pointer shadow-2xs"
                    >
                      <div className="text-[11px] font-bold text-slate-800 mb-1.5">{p.name}</div>
                      <div className="flex gap-1">
                        <span className="w-4 h-4 rounded-full border border-black/20 inline-block" style={{ backgroundColor: p.primary }} />
                        <span className="w-4 h-4 rounded-full border border-black/20 inline-block" style={{ backgroundColor: p.secondary }} />
                        <span className="w-4 h-4 rounded-full border border-black/20 inline-block" style={{ backgroundColor: p.accent }} />
                        <span className="w-4 h-4 rounded-full border border-black/20 inline-block" style={{ backgroundColor: p.text }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Palette Generator */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                  <Sparkles size={14} className="text-purple-600" />
                  <span>AI Color Palette Generator</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paletteVibe}
                    onChange={(e) => setPaletteVibe(e.target.value)}
                    placeholder="Describe your vibe (e.g. Cozy autumnal mystery, Sleek high-tech cyberpunk...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePalette}
                    disabled={isGeneratingPalette || !paletteVibe}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingPalette ? 'Generating...' : 'Generate Palette'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Live Book Cover Mockup Preview */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Live Brand Mockup
              </h3>
              <span className="text-[11px] font-bold text-purple-600">Real-Time Tokens</span>
            </div>

            {/* Virtual Book Cover Frame */}
            <div
              className="w-full aspect-[2/3] max-w-[280px] mx-auto rounded-2xl shadow-xl border border-slate-300 p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: brandKit.backgroundColor,
                color: brandKit.textColor,
                fontFamily: brandKit.bodyFont || 'sans-serif',
              }}
            >
              {/* Decorative Brand Color Top Band */}
              <div
                className="absolute top-0 left-0 right-0 h-4"
                style={{ backgroundColor: brandKit.primaryColor }}
              />

              <div className="pt-2 text-center space-y-1">
                <div
                  className="text-[10px] font-bold uppercase tracking-widest opacity-80"
                  style={{ color: brandKit.secondaryColor }}
                >
                  BESTSELLING AUTHOR
                </div>
                <h4
                  className="text-lg font-black leading-tight uppercase"
                  style={{
                    color: brandKit.primaryColor,
                    fontFamily: brandKit.headingFont || 'serif',
                  }}
                >
                  THE MASTER TITLE
                </h4>
                <div
                  className="text-[10px] font-bold italic"
                  style={{ color: brandKit.textColor }}
                >
                  An Immersive Journey
                </div>
              </div>

              {/* Center Motif / Accent Button */}
              <div className="my-auto text-center space-y-3">
                <div
                  className="w-12 h-12 mx-auto rounded-full flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: brandKit.secondaryColor }}
                >
                  <BookOpen size={20} style={{ color: '#ffffff' }} />
                </div>
                <div
                  className="inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-xs"
                  style={{
                    backgroundColor: brandKit.accentColor,
                    color: '#ffffff',
                  }}
                >
                  Special Edition
                </div>
              </div>

              {/* Author Name Footer */}
              <div className="text-center pt-3 border-t border-slate-200/50">
                <div
                  className="text-xs font-black uppercase tracking-wider"
                  style={{
                    color: brandKit.primaryColor,
                    fontFamily: brandKit.accentFont || 'sans-serif',
                  }}
                >
                  {brandKit.activePenName || brandKit.authorName || 'Author Name'}
                </div>
                <div className="text-[9px] opacity-60 mt-0.5">
                  {brandKit.publisherName || 'KDP Studio Press'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: Typography
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'typography' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Type size={18} className="text-purple-600" />
              <span>Brand Typography &amp; Google Fonts</span>
            </h2>

            {/* 3 Font Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Heading Font */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-800">Heading &amp; Title Font</label>
                  <div className="text-[11px] text-slate-400">Used on book titles and chapter headers</div>
                </div>
                <select
                  value={brandKit.headingFont}
                  onChange={(e) => updateField('headingFont', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 outline-none"
                >
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f.name} value={f.name}>{f.name} ({f.category})</option>
                  ))}
                </select>
                <div
                  className="p-3 rounded-xl bg-white border border-slate-200 text-center text-base font-bold truncate"
                  style={{ fontFamily: brandKit.headingFont }}
                >
                  The Secret Passage
                </div>
              </div>

              {/* Body Font */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-800">Body &amp; Interior Font</label>
                  <div className="text-[11px] text-slate-400">Used for book interior chapter paragraphs</div>
                </div>
                <select
                  value={brandKit.bodyFont}
                  onChange={(e) => updateField('bodyFont', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 outline-none"
                >
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f.name} value={f.name}>{f.name} ({f.category})</option>
                  ))}
                </select>
                <div
                  className="p-3 rounded-xl bg-white border border-slate-200 text-left text-xs leading-relaxed max-h-16 overflow-hidden"
                  style={{ fontFamily: brandKit.bodyFont }}
                >
                  The morning sun filtered through the canopy, illuminating the ancient path ahead.
                </div>
              </div>

              {/* Accent Font */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-800">Accent &amp; Cover Font</label>
                  <div className="text-[11px] text-slate-400">Used for author branding and callouts</div>
                </div>
                <select
                  value={brandKit.accentFont}
                  onChange={(e) => updateField('accentFont', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 outline-none"
                >
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f.name} value={f.name}>{f.name} ({f.category})</option>
                  ))}
                </select>
                <div
                  className="p-3 rounded-xl bg-white border border-slate-200 text-center text-xs font-bold uppercase tracking-widest truncate"
                  style={{ fontFamily: brandKit.accentFont }}
                >
                  {brandKit.activePenName || brandKit.authorName || 'Author Name'}
                </div>
              </div>
            </div>

            {/* 4 Recommended Pairings */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-700">Recommended Typography Pairings:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {FONT_PAIRINGS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => updateFields({
                      headingFont: p.heading,
                      bodyFont: p.body,
                      accentFont: p.accent,
                    })}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-purple-300 bg-slate-50/60 hover:bg-purple-50/40 text-left transition-all cursor-pointer"
                  >
                    <div className="font-bold text-xs text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-purple-700 mt-1">{p.heading} + {p.body}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: Logo & Imprint Assets
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'logo' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ImageIcon size={18} className="text-purple-600" />
              <span>Logo &amp; Publishing Imprint</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
              {/* Logo Upload Box */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">Author / Imprint Logo</label>
                <div className="w-full h-36 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
                  {brandKit.logoUrl ? (
                    <img src={brandKit.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="space-y-1 text-slate-400">
                      <ImageIcon size={28} className="mx-auto text-slate-300" />
                      <div className="text-xs font-bold text-slate-600">No logo uploaded</div>
                      <div className="text-[10px]">PNG or SVG with transparent background</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoSelect}
                    accept="image/png,image/svg+xml"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </button>
                  {brandKit.logoUrl && (
                    <button
                      type="button"
                      onClick={() => updateField('logoUrl', null)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>

              {/* Text Fallback & Publisher */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Logo Text Fallback
                  </label>
                  <input
                    type="text"
                    value={brandKit.logoText}
                    onChange={(e) => updateField('logoText', e.target.value)}
                    placeholder="e.g. Crescent Moon Publishing"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none"
                  />
                  <span className="text-[11px] text-slate-400">
                    Styled typography fallback printed on book spines when no image logo is uploaded
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Publisher / Imprint Name
                  </label>
                  <input
                    type="text"
                    value={brandKit.publisherName}
                    onChange={(e) => updateField('publisherName', e.target.value)}
                    placeholder="e.g. Starling Press"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none"
                  />
                  <span className="text-[11px] text-slate-400">
                    Appears on Amazon KDP metadata and interior copyright pages
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: Copyright & Legal
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'legal' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-purple-600" />
              <span>Copyright &amp; Legal Disclaimers</span>
            </h2>

            {/* Copyright Template */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Copyright Page Template
                </label>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span>Insert Variable:</span>
                  {['{year}', '{author}', '{publisher}', '{website}', '{isbn}'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateField('copyrightTemplate', brandKit.copyrightTemplate + ` ${v}`)}
                      className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 font-mono text-[10px] font-bold border border-purple-200 cursor-pointer"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={6}
                value={brandKit.copyrightTemplate}
                onChange={(e) => updateField('copyrightTemplate', e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 leading-relaxed outline-none"
              />
            </div>

            {/* Live Copyright Render */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Live Rendered Output (with current variables):
              </div>
              <div className="text-xs text-slate-800 whitespace-pre-line font-serif italic bg-white p-3 rounded-xl border border-slate-200/80">
                {liveCopyright}
              </div>
            </div>

            {/* Legal Disclaimer */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Legal Disclaimer</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('disclaimer', 'This is a work of fiction. Names, characters, businesses, places, events, and incidents are either the products of the author’s imagination or used in a fictitious manner.')}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                  >
                    Fiction Preset
                  </button>
                  <span>&bull;</span>
                  <button
                    type="button"
                    onClick={() => updateField('disclaimer', 'The information provided in this book is for educational and informational purposes only. The author and publisher make no representations or warranties regarding accuracy or completeness.')}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                  >
                    Non-Fiction Preset
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={brandKit.disclaimer}
                onChange={(e) => updateField('disclaimer', e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 6: Social & Marketing Links
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Share2 size={18} className="text-purple-600" />
                <span>Author Social &amp; Reader Links</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                These handles and links are automatically placed in the "Connect with the Author" back-matter section of your books.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Amazon Author Page URL</label>
                <input
                  type="text"
                  value={brandKit.amazonAuthorUrl}
                  onChange={(e) => updateField('amazonAuthorUrl', e.target.value)}
                  placeholder="https://amazon.com/author/yourname"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Goodreads Author URL</label>
                <input
                  type="text"
                  value={brandKit.goodreadsUrl}
                  onChange={(e) => updateField('goodreadsUrl', e.target.value)}
                  placeholder="https://goodreads.com/author/show/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Instagram Handle</label>
                <input
                  type="text"
                  value={brandKit.instagramHandle}
                  onChange={(e) => updateField('instagramHandle', e.target.value)}
                  placeholder="@authorname"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">X / Twitter Handle</label>
                <input
                  type="text"
                  value={brandKit.twitterHandle}
                  onChange={(e) => updateField('twitterHandle', e.target.value)}
                  placeholder="@authorname"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">YouTube Channel URL</label>
                <input
                  type="text"
                  value={brandKit.youtubeChannelUrl}
                  onChange={(e) => updateField('youtubeChannelUrl', e.target.value)}
                  placeholder="https://youtube.com/@authorchannel"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">TikTok Handle</label>
                <input
                  type="text"
                  value={brandKit.tiktokHandle}
                  onChange={(e) => updateField('tiktokHandle', e.target.value)}
                  placeholder="@booktokauthor"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STICKY SAVE BAR (Bottom)
         ───────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {saveSuccessMsg ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fade-in">
                <Check size={14} />
                <span>Brand Kit saved successfully!</span>
              </span>
            ) : hasUnsavedChanges ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 animate-fade-in">
                <AlertTriangle size={14} />
                <span>Unsaved changes</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Check size={14} className="text-emerald-500" />
                <span>All changes saved</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={resetToSaved}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Discard Changes
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isFreePlan}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Brand Kit</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
