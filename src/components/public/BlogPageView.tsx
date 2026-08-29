import React from 'react';
import { BookOpen, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { PageRoute } from '../../types';

interface BlogPageViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const BlogPageView: React.FC<BlogPageViewProps> = ({ onNavigate }) => {
  const articles = [
    {
      title: 'How to Publish a 6×9 Non-Fiction Book on Amazon KDP in 2026',
      desc: 'Complete walkthrough on calculating gutter margins, bleed settings, spine width, and writing converting metadata.',
      readTime: '6 min read',
      tag: 'KDP Publishing Guide',
      date: 'August 2026',
    },
    {
      title: 'The 7 Backend Keywords Secret: Rank #1 in Amazon Kindle Categories',
      desc: 'Learn how to construct non-repetitive search strings that maximize organic visibility without keyword stuffing.',
      readTime: '4 min read',
      tag: 'Amazon SEO',
      date: 'August 2026',
    },
    {
      title: 'Low-Content Goldmine: Word Search & Puzzle Books on KDP',
      desc: 'Step-by-step methodology for launching high-volume activity books with automated grid generation and answer keys.',
      readTime: '5 min read',
      tag: 'Low Content',
      date: 'July 2026',
    }
  ];

  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Author Resource Hub
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            KDP Publishing Guides & Insights
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Actionable strategies, margin calculations, and AI publishing tutorials for self-publishers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {articles.map((art, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-purple-300 hover:shadow-lg transition-all space-y-4">
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded border border-purple-100">
                  {art.tag}
                </span>
                <h3 className="font-bold text-base text-slate-900 leading-snug">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {art.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  <span>{art.readTime}</span>
                </span>
                <span className="font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer">
                  <span>Read Guide</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
