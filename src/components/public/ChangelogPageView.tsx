import React from 'react';
import { Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import { PageRoute } from '../../types';

interface ChangelogPageViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const ChangelogPageView: React.FC<ChangelogPageViewProps> = ({ onNavigate }) => {
  const releases = [
    {
      version: 'v2.4.0',
      date: 'August 2026',
      badge: 'Latest Release',
      items: [
        'Integrated Google Gemini 2.0 Flash & Imagen 3 models for ultra-fast chapter writing and cover art.',
        'Added dynamic IP Geolocation and localized currency pricing for India (INR), US, UK, EU, CA, and AU.',
        'Introduced live KDP pre-flight inspection checklist and auto-gutter calculation.',
        'Created high-speed EPUB 3 and 300 DPI CMYK PDF export pipelines.'
      ]
    },
    {
      version: 'v2.1.0',
      date: 'July 2026',
      badge: 'Major Update',
      items: [
        'Added multi-chapter Studio editor with auto-save and rich typography.',
        'Launched Puzzle Generator with automated Word Search and Sudoku solution appendices.',
        'Added 4-step onboarding wizard for personalized author workflows.'
      ]
    },
    {
      version: 'v1.5.0',
      date: 'June 2026',
      badge: 'Initial Launch',
      items: [
        'Core Amazon KDP Interior Formatter supporting 5×8, 6×9, and 8.5×11 trim sizes.',
        'Full spread Cover Builder with spine thickness math.'
      ]
    }
  ];

  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Product Updates
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Changelog & Releases
          </h1>
          <p className="text-sm text-slate-600">
            Stay up to date with new features, AI models, and publishing enhancements.
          </p>
        </div>

        <div className="space-y-8 border-t border-slate-200 pt-8">
          {releases.map((rel, idx) => (
            <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-slate-900 font-mono">{rel.version}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-md">
                    {rel.badge}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">{rel.date}</span>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                {rel.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-purple-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
