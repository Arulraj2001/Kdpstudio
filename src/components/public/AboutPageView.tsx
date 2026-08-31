import React from 'react';
import { BookOpen, Sparkles, Heart, Globe, Cpu, Award } from 'lucide-react';
import { PageRoute } from '../../types';
import { SEOHead } from '../seo/SEOHead';

interface AboutPageViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const AboutPageView: React.FC<AboutPageViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      <SEOHead
        pageKey="about"
        title="About — KDP Studio"
        description="KDP Studio is an AI-powered book publishing suite built for Amazon KDP authors and publishers. Made in India · Built for KDP Creators."
        canonicalPath="/about"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Our Mission
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
            Democratizing Amazon KDP <span className="font-serif italic font-normal text-purple-600">Self-Publishing</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            We built KDP Studio to solve the painful formatting errors, rejected covers, and complex margin calculations that keep great authors from publishing.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            <h2 className="text-2xl font-bold text-slate-900">
              Made in India · Built for KDP Creators
            </h2>
            <p>
              Self-publishing on Amazon Kindle Direct Publishing (KDP) offers unprecedented creative freedom and 70% royalties. However, the technical barriers — calculating page gutters, converting RGB images to 300 DPI CMYK, designing wrap-around covers with spine math — routinely lead to book rejections.
            </p>
            <p>
              By combining Claude AI generative intelligence with automated print layout algorithms, KDP Studio turns a multi-week technical ordeal into a joyful, 20-minute creative session.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-900 to-indigo-950 p-8 rounded-3xl text-white space-y-6 shadow-xl border border-purple-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base">Claude AI & Imagen</h3>
                <p className="text-xs text-purple-200">State of the art multimodal AI</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-purple-100/90 leading-relaxed">
              <p>• Automated Amazon KDP margin and spine formula engine</p>
              <p>• High-resolution vector PDF generation with zero compression artifacts</p>
              <p>• Built-in localized pricing in INR, USD, GBP, EUR, CAD, and AUD</p>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              100%
            </div>
            <h3 className="font-bold text-slate-900 text-base">Author Royalties</h3>
            <p className="text-xs text-slate-600">
              You own all intellectual property and retain all royalties earned on Amazon KDP.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              0%
            </div>
            <h3 className="font-bold text-slate-900 text-base">KDP Rejections</h3>
            <p className="text-xs text-slate-600">
              Guaranteed Amazon pre-flight compliance with gutter, bleed, and safe-zone validations.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              24/7
            </div>
            <h3 className="font-bold text-slate-900 text-base">Cloud Access</h3>
            <p className="text-xs text-slate-600">
              Work on your manuscripts from anywhere with encrypted cloud synchronization.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8 border-t border-slate-200">
          <button
            onClick={() => onNavigate('signup')}
            className="px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md"
          >
            Join 10,000+ Publishers
          </button>
        </div>

      </div>
    </div>
  );
};
