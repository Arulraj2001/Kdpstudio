import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  CheckCircle2, 
  User, 
  Globe, 
  Shield, 
  Sparkles, 
  Download, 
  Upload, 
  RotateCcw, 
  Database, 
  Sliders, 
  Layers, 
  Check, 
  AlertTriangle,
  Info,
  Server,
  Printer,
  Mail,
  Bell,
  Lock,
  Palette,
  ArrowRight
} from 'lucide-react';
import { useSettingsStore, useBookStore } from '../../lib/store';
import { useAuthStore } from '../../lib/authStore';
import { FormatterFontFamily, PaperType, TrimSize, PageRoute } from '../../types';
import { VersionSettingsSection } from '../versions/VersionSettingsSection';

interface SettingsViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { books, importBooks, resetToDefaultBooks } = useBookStore();
  const { user, userDoc } = useAuthStore();

  // Local form state
  const [formData, setFormData] = useState(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Email Notification Preferences state
  const [emailPrefs, setEmailPrefs] = useState({
    weeklyDigest: true,
    usageWarnings: true,
    marketing: true,
  });
  const [savingEmailPrefs, setSavingEmailPrefs] = useState(false);
  const [emailPrefsSaved, setEmailPrefsSaved] = useState(false);

  useEffect(() => {
    if (userDoc?.settings?.emailPreferences) {
      setEmailPrefs({
        weeklyDigest: userDoc.settings.emailPreferences.weeklyDigest ?? true,
        usageWarnings: userDoc.settings.emailPreferences.usageWarnings ?? true,
        marketing: userDoc.settings.emailPreferences.marketing ?? true,
      });
    }
  }, [userDoc]);

  const handleTogglePref = async (key: 'weeklyDigest' | 'usageWarnings' | 'marketing') => {
    const updated = { ...emailPrefs, [key]: !emailPrefs[key] };
    setEmailPrefs(updated);
    setSavingEmailPrefs(true);
    try {
      await fetch('/api/user/email-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
        },
        body: JSON.stringify({
          ...updated,
          uid: user?.uid,
        }),
      });
      setEmailPrefsSaved(true);
      setTimeout(() => setEmailPrefsSaved(false), 2000);
    } catch (err) {
      console.warn('Failed saving email preferences:', err);
    } finally {
      setSavingEmailPrefs(false);
    }
  };


  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    setApiStatus('checking');
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setApiStatus('connected');
      } else {
        setApiStatus('error');
      }
    } catch {
      setApiStatus('error');
    }
  };

  const handleSave = () => {
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Export Library to JSON
  const handleExportBackup = () => {
    const dataStr = JSON.stringify(
      {
        version: '2.5',
        exportedAt: new Date().toISOString(),
        settings: formData,
        books: books,
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kdp_studio_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import Library from JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.books && Array.isArray(parsed.books)) {
          const success = importBooks(parsed.books);
          if (success) {
            if (parsed.settings) {
              updateSettings(parsed.settings);
            }
            setImportStatus(`Successfully imported ${parsed.books.length} book(s)!`);
          } else {
            setImportStatus('Invalid book data format.');
          }
        } else {
          setImportStatus('Invalid backup file structure.');
        }
      } catch (err) {
        setImportStatus('Failed to parse backup JSON file.');
      }
      setTimeout(() => setImportStatus(null), 3500);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
              Configuration
            </span>
            <span className="text-xs text-slate-500">· System & Author Defaults</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">KDP Studio Settings</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage author identity, default trim sizes, AI models, export preferences, and local backup files.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white text-xs font-semibold hover:bg-[#6d28d9] transition-colors shadow-xs"
        >
          {saveSuccess ? <CheckCircle2 size={16} className="text-emerald-300" /> : <Save size={16} />}
          <span>{saveSuccess ? 'Changes Saved!' : 'Save Preferences'}</span>
        </button>
      </div>

      {importStatus && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs font-medium text-purple-900 flex items-center gap-2 animate-fade-in">
          <Info size={16} className="text-purple-600 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Author Brand Kit Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-purple-500/30">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 text-purple-300">
            <Palette size={22} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-200 text-[10px] font-bold mb-1 border border-purple-400/30">
              <Sparkles size={10} />
              <span>Global Brand Identity</span>
            </div>
            <h3 className="text-base font-bold text-white">Author Brand Kit</h3>
            <p className="text-xs text-purple-200 mt-0.5 max-w-xl">
              Store your pen names, Google Fonts, 5-color palettes, logo, copyright templates, and social links once — auto-applied to all books.
            </p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('brand-kit')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-purple-950 font-extrabold text-xs shadow-md transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Open Brand Kit</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Grid of Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Author & Publishing Profile */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User size={18} className="text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Author & Publisher Profile</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Author Legal Name</label>
                <input
                  type="text"
                  value={formData.authorLegalName}
                  onChange={(e) => setFormData({ ...formData, authorLegalName: e.target.value })}
                  placeholder="e.g. Alex Rivers"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pen Name / Pseudonym</label>
                <input
                  type="text"
                  value={formData.penName}
                  onChange={(e) => setFormData({ ...formData, penName: e.target.value })}
                  placeholder="e.g. A. R. Vance"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Publisher Imprint Name</label>
                <input
                  type="text"
                  value={formData.publisherImprint}
                  onChange={(e) => setFormData({ ...formData, publisherImprint: e.target.value })}
                  placeholder="e.g. Horizon Press"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Author Website / Link</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Default Book & Formatting Preferences */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders size={18} className="text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Default Book Specifications</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Trim Size</label>
                <select
                  value={formData.defaultTrimSize}
                  onChange={(e) => setFormData({ ...formData, defaultTrimSize: e.target.value as TrimSize })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="6x9">6" × 9" (US Trade Standard - Fiction & Non-Fiction)</option>
                  <option value="5.5x8.5">5.5" × 8.5" (Standard Digest - Fiction & Memoirs)</option>
                  <option value="5x8">5" × 8" (Pocket Book - Thrillers & Sci-Fi)</option>
                  <option value="8.5x11">8.5" × 11" (Workbook & Large Format)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Paper Type</label>
                <select
                  value={formData.defaultPaperType}
                  onChange={(e) => setFormData({ ...formData, defaultPaperType: e.target.value as PaperType })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="white">White Paper (0.002252" per page)</option>
                  <option value="cream">Cream Paper (0.0025" per page - Best for Fiction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Interior Font</label>
                <select
                  value={formData.defaultFont}
                  onChange={(e) => setFormData({ ...formData, defaultFont: e.target.value as FormatterFontFamily })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="Garamond">Garamond (Classic Publishing Standard)</option>
                  <option value="Georgia">Georgia (Modern Screen-Friendly Serif)</option>
                  <option value="Palatino">Palatino (High Legibility Serif)</option>
                  <option value="Times New Roman">Times New Roman (Compact Traditional)</option>
                  <option value="Book Antiqua">Book Antiqua (Elegant Renaissance)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Primary Language</label>
                <select
                  value={formData.defaultLanguage}
                  onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Italian">Italian</option>
                  <option value="Portuguese">Portuguese</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-800">Studio Auto-Save Interval</div>
                <div className="text-[11px] text-slate-500">How frequently chapter edits sync to local storage.</div>
              </div>
              <select
                value={formData.autoSaveIntervalSec}
                onChange={(e) => setFormData({ ...formData, autoSaveIntervalSec: Number(e.target.value) })}
                className="text-xs font-semibold p-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value={5}>5 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
            </div>
          </div>

          {/* 3. Export & Print Quality Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Printer size={18} className="text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Export & Print Resolution</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="text-xs font-semibold text-slate-800">Cover Bleed Calculation</div>
                <div className="text-[11px] text-slate-600">
                  Automatically adds 0.125" (3.2mm) to top, bottom, and outside edges of full covers.
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <Check size={12} />
                    <span>Always Enabled (KDP Mandated)</span>
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="text-xs font-semibold text-slate-800">Target Export Resolution</div>
                <div className="text-[11px] text-slate-600">
                  Print-ready assets are rendered to exact physical dimensions.
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, exportDpi: 300 })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      formData.exportDpi === 300
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    300 DPI (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, exportDpi: 600 })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      formData.exportDpi === 600
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    600 DPI (High-Res)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Email Notifications Preferences */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-purple-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Email Notifications</h2>
                  <p className="text-[11px] text-slate-500">Choose which emails you receive from KDP Studio</p>
                </div>
              </div>
              {emailPrefsSaved && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-fade-in">
                  <Check size={12} />
                  <span>Preferences saved</span>
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-100 space-y-0 text-xs">
              {/* Weekly Digest */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-800">Weekly digest emails</div>
                  <div className="text-[11px] text-slate-500">A summary of your publishing activity each Monday</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('weeklyDigest')}
                  disabled={savingEmailPrefs}
                  aria-label="Toggle weekly digest"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    emailPrefs.weeklyDigest ? 'bg-purple-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      emailPrefs.weeklyDigest ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Usage Warnings */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-800">Usage warning emails</div>
                  <div className="text-[11px] text-slate-500">Alert when you reach 70% of your daily limits</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('usageWarnings')}
                  disabled={savingEmailPrefs}
                  aria-label="Toggle usage warnings"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    emailPrefs.usageWarnings ? 'bg-purple-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      emailPrefs.usageWarnings ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Marketing Emails */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-800">Marketing emails</div>
                  <div className="text-[11px] text-slate-500">Tips, feature announcements, and KDP strategies</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('marketing')}
                  disabled={savingEmailPrefs}
                  aria-label="Toggle marketing emails"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    emailPrefs.marketing ? 'bg-purple-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      emailPrefs.marketing ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Payment & Billing (Locked) */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Lock size={13} className="text-slate-400" />
                    <span>Payment &amp; billing emails</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Receipts, payment failures, and plan changes (cannot be disabled)</div>
                </div>
                <button
                  type="button"
                  disabled
                  aria-label="Payment emails locked"
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed opacity-60 rounded-full border-2 border-transparent bg-purple-600 focus:outline-hidden"
                >
                  <span className="pointer-events-none inline-block h-5 w-5 transform translate-x-5 rounded-full bg-white shadow-sm ring-0" />
                </button>
              </div>

              {/* Security Emails (Locked) */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Lock size={13} className="text-slate-400" />
                    <span>Security emails</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Password resets and account security alerts (cannot be disabled)</div>
                </div>
                <button
                  type="button"
                  disabled
                  aria-label="Security emails locked"
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed opacity-60 rounded-full border-2 border-transparent bg-purple-600 focus:outline-hidden"
                >
                  <span className="pointer-events-none inline-block h-5 w-5 transform translate-x-5 rounded-full bg-white shadow-sm ring-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Version History & Auto-Backups Settings */}
          <VersionSettingsSection />
        </div>

        {/* Right Column (1 span) */}
        <div className="space-y-6">
          {/* AI & Model Integration */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles size={18} className="text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">AI Assistant Engine</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Server size={15} className="text-slate-500" />
                  <span className="font-semibold text-slate-700">API Connection</span>
                </div>
                {apiStatus === 'connected' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check size={12} />
                    <span>Connected</span>
                  </span>
                )}
                {apiStatus === 'checking' && (
                  <span className="text-[11px] text-slate-500">Checking...</span>
                )}
                {apiStatus === 'error' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <AlertTriangle size={12} />
                    <span>Local Mode</span>
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gemini AI Model</label>
                <select
                  value={formData.geminiModel}
                  onChange={(e) => setFormData({ ...formData, geminiModel: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & Responsive)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Literary Reasoning)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={checkApiHealth}
                className="w-full py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Re-Test API Ping
              </button>
            </div>
          </div>

          {/* Backup & Data Management */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Database size={18} className="text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Data Management</h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your entire manuscript library, covers, and KDP metadata are securely stored in your browser session storage.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 px-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={14} />
                <span>Export Library Backup (JSON)</span>
              </button>

              <label className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload size={14} />
                <span>Import Backup JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setResetConfirmOpen(true)}
                className="w-full py-2 px-3 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw size={13} />
                <span>Reset Demo Library</span>
              </button>
            </div>
          </div>

          {/* Amazon KDP Specs Quickcard */}
          <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-purple-300">
              <Info size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider">KDP Paperback Specs</h3>
            </div>
            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="flex justify-between pb-1 border-b border-white/10">
                <span>Minimum Pages</span>
                <span className="font-semibold text-white">24 pages</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-white/10">
                <span>Maximum Pages</span>
                <span className="font-semibold text-white">828 pages</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-white/10">
                <span>Cover Bleed</span>
                <span className="font-semibold text-white">0.125" all sides</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-white/10">
                <span>Safe Margin</span>
                <span className="font-semibold text-white">0.25" from edge</span>
              </div>
              <div className="flex justify-between">
                <span>Resolution</span>
                <span className="font-semibold text-white">300 DPI minimum</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <RotateCcw size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Reset Demo Library?</h3>
              <p className="text-xs text-slate-600">
                This will reset your library back to the sample starter book and restore default publishing preferences.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToDefaultBooks();
                  resetSettings();
                  setResetConfirmOpen(false);
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 2500);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors shadow-xs"
              >
                Reset Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
