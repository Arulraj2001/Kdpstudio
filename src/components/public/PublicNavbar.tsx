'use client';

import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  ArrowRight, 
  Sparkles,
  ChevronDown,
  Calculator,
  Compass,
  AlertOctagon,
  QrCode,
  KeyRound,
  Grid3X3,
  Grid,
  Baby,
  UtensilsCrossed,
  Calendar,
  Briefcase,
  BookOpen,
  FileText
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { PageRoute } from '../../types';

interface PublicNavbarProps {
  currentRoute?: PageRoute;
  onNavigate: (route: PageRoute) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ currentRoute = 'home', onNavigate }) => {
  const { user } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('announcement-dismissed') === 'true';
      setIsAnnouncementDismissed(dismissed);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDismissAnnouncement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnnouncementDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('announcement-dismissed', 'true');
    }
  };

  const handleNav = (route: PageRoute, hash?: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(route);
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-200">
      {/* 1. Announcement Bar (Home page only, if not dismissed) */}
      {currentRoute === 'home' && !isAnnouncementDismissed && (
        <div
          id="announcement-bar"
          onClick={() => handleNav(user ? 'puzzles' : 'signup')}
          className="bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-700 text-white text-xs sm:text-sm font-semibold py-2 px-4 flex items-center justify-between cursor-pointer hover:brightness-105 transition-all shadow-xs"
        >
          <div className="flex-1 text-center flex items-center justify-center gap-1.5 truncate">
            <span>🚀</span>
            <span className="truncate">
              New: Puzzle Book Generator — Create 20 books in one click
            </span>
            <span className="font-bold underline ml-1 hidden sm:inline">Explore Now →</span>
          </div>
          <button
            onClick={handleDismissAnnouncement}
            className="p-1 hover:bg-white/20 rounded-md transition-colors shrink-0 ml-2 cursor-pointer"
            aria-label="Dismiss announcement"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Main Navigation Bar */}
      <nav
        id="public-navbar"
        className={`w-full transition-all duration-200 ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3'
            : 'bg-white border-b border-slate-100 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Subtitle */}
          <div
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
              <img
                src="/brand-icon.png?v=20260831"
                alt="KDP Studio Logo"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                KDP Studio
              </span>
              <span className="text-[9px] font-bold text-purple-600 tracking-[0.2em] uppercase leading-none mt-0.5">
                PUBLISHING SUITE
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            
            {/* Free Tools Mega-Dropdown */}
            <div className="relative group">
              <button
                onClick={() => handleNav('tools')}
                className={`hover:text-purple-600 transition-colors cursor-pointer inline-flex items-center gap-1.5 py-2 ${
                  ['tools', 'royalty-calculator', 'asin-spy', 'review-miner', 'lead-magnet', 'maze-generator', 'cryptogram-generator', 'sudoku-generator', 'crossword-generator', 'childrens-book-studio', 'cookbook-studio', 'planner-studio', 'nonfiction-studio', 'fiction-studio', 'workbook-studio'].includes(currentRoute)
                    ? 'text-purple-600 font-bold'
                    : ''
                }`}
              >
                <span>Free Tools</span>
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform text-slate-400 group-hover:text-purple-600" />
              </button>

              {/* Dropdown Menu (3-Column Architecture) */}
              <div className="absolute top-full left-0 w-[720px] -ml-28 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-purple-600" />
                      <span>Free Amazon KDP Creator Tools</span>
                    </span>
                    <button
                      onClick={() => handleNav('tools')}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                    >
                      View All Tools Hub →
                    </button>
                  </div>

                  {/* 3-Column Tool Grid inside Dropdown */}
                  <div className="grid grid-cols-3 gap-3">
                    
                    {/* Column 1: SEO & Revenue Calculators */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                        Calculators &amp; SEO
                      </div>

                      <div 
                        onClick={() => handleNav('royalty-calculator')}
                        className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 transition-all cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <Calculator size={14} className="text-emerald-600 shrink-0" />
                          <span>Royalty Calculator</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          Exact printing costs and royalties across 13 global Amazon stores.
                        </p>
                      </div>

                      <div 
                        onClick={() => handleNav('asin-spy')}
                        className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 transition-all cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <Compass size={14} className="text-purple-600 shrink-0" />
                          <span>Reverse ASIN Spy</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          Competitor BSR sales velocity and daily orders for #1 rank.
                        </p>
                      </div>

                      <div 
                        onClick={() => handleNav('review-miner')}
                        className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 transition-all cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <AlertOctagon size={14} className="text-rose-600 shrink-0" />
                          <span>Review Miner</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          Extract 1–3 star customer complaints to spot market gaps.
                        </p>
                      </div>

                      <div 
                        onClick={() => handleNav('lead-magnet')}
                        className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 transition-all cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <QrCode size={14} className="text-indigo-600 shrink-0" />
                          <span>Lead Magnet &amp; QR</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          Generate 300 DPI vector QR reader bonus pages.
                        </p>
                      </div>
                    </div>

                    {/* Column 2: Low-Content & Puzzle Studios */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                        Puzzles &amp; Activities
                      </div>

                      <div 
                        onClick={() => handleNav('sudoku-generator')}
                        className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 transition-all cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <Grid3X3 size={14} className="text-blue-600 shrink-0" />
                          <span>Classic Sudoku</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          9×9 Sudoku books with automated solution key pages.
                        </p>
                      </div>

                      <div 
                        onClick={() => handleNav('maze-generator')}
                        className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 transition-all cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <Compass size={14} className="text-emerald-600 shrink-0" />
                          <span>Algorithmic Mazes</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          100% solvable circular, diamond, and grid mazes.
                        </p>
                      </div>

                      <div 
                        onClick={() => handleNav('cryptogram-generator')}
                        className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 transition-all cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <KeyRound size={14} className="text-purple-600 shrink-0" />
                          <span>Cryptograms</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          Letter substitution cipher puzzle books with hints.
                        </p>
                      </div>

                      <div 
                        onClick={() => handleNav('crossword-generator')}
                        className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 transition-all cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <Grid size={14} className="text-indigo-600 shrink-0" />
                          <span>Clued Crosswords</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          Intersecting Across &amp; Down word puzzle books.
                        </p>
                      </div>
                    </div>

                    {/* Column 3: Category Storyboard Studios */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                        Book Studios
                      </div>

                      <div 
                        onClick={() => handleNav('fiction-studio')}
                        className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 transition-all cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <BookOpen size={14} className="text-rose-600 shrink-0" />
                          <span>Fiction Storyboard</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          15-Beat Save the Cat novel structure and arcs.
                        </p>
                      </div>

                      <div 
                        onClick={() => handleNav('nonfiction-studio')}
                        className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 transition-all cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <Briefcase size={14} className="text-indigo-600 shrink-0" />
                          <span>Non-Fiction Blueprint</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          Frameworks, step-by-step guides, and case studies.
                        </p>
                      </div>

                      <div 
                        onClick={() => handleNav('childrens-book-studio')}
                        className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 transition-all cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <Baby size={14} className="text-pink-600 shrink-0" />
                          <span>Children's Books</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          Picture books with character consistency lock.
                        </p>
                      </div>

                      <div 
                        onClick={() => handleNav('workbook-studio')}
                        className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 transition-all cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <FileText size={14} className="text-sky-600 shrink-0" />
                          <span>Interactive Workbooks</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          Fill-in exercises, tables, and reflection prompts.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleNav('features')}
              className={`hover:text-purple-600 transition-colors cursor-pointer ${
                currentRoute === 'features' ? 'text-purple-600 font-bold' : ''
              }`}
            >
              Features
            </button>

            <button
              onClick={() => handleNav('arc-lounge')}
              className={`hover:text-purple-600 transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentRoute === 'arc-lounge' ? 'text-purple-600 font-bold' : ''
              }`}
            >
              <span>ARC Lounge</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-200">
                New
              </span>
            </button>

            <button
              onClick={() => handleNav('pricing')}
              className={`hover:text-purple-600 transition-colors cursor-pointer ${
                currentRoute === 'pricing' ? 'text-purple-600 font-bold' : ''
              }`}
            >
              Pricing
            </button>

            <button
              onClick={() => handleNav('blog')}
              className={`hover:text-purple-600 transition-colors cursor-pointer ${
                currentRoute === 'blog' ? 'text-purple-600 font-bold' : ''
              }`}
            >
              Blog
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3.5">
            {user ? (
              <button
                onClick={() => handleNav('dashboard')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold shadow-md shadow-purple-900/20 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleNav('login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => handleNav('signup')}
                  className="px-5 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-bold shadow-md shadow-purple-900/20 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Start Free</span>
                  <span>→</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-1 rounded-xl text-slate-700 hover:bg-slate-100 md:hidden transition-colors"
            aria-label="Open mobile menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* 3. Full-screen Mobile Overlay Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav-overlay"
          className="fixed inset-0 z-50 bg-[#0f0f1a] text-white flex flex-col justify-between p-6 sm:p-8 animate-in fade-in duration-200"
        >
          {/* Top Bar inside Drawer */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shadow-md overflow-hidden">
                <img
                  src="/brand-icon.png?v=20260831"
                  alt="KDP Studio Logo"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white leading-tight">
                  KDP Studio
                </span>
                <span className="text-[9px] font-bold text-purple-400 tracking-[0.2em] uppercase leading-none mt-0.5">
                  PUBLISHING SUITE
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close mobile menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Centered Large Navigation Links */}
          <div className="flex flex-col items-center justify-center space-y-5 py-6">
            <button
              onClick={() => handleNav('tools')}
              className="text-2xl font-bold text-purple-400 hover:text-purple-300 transition-colors"
            >
              🛠️ Creator Tools Hub
            </button>
            <button
              onClick={() => handleNav('features')}
              className="text-2xl font-bold text-slate-200 hover:text-purple-400 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => handleNav('pricing')}
              className="text-2xl font-bold text-slate-200 hover:text-purple-400 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => handleNav('arc-lounge')}
              className="text-2xl font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              <span>📖 ARC Reader Lounge</span>
              <span className="text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded-full border border-purple-600">
                New
              </span>
            </button>
            <button
              onClick={() => handleNav('blog')}
              className="text-2xl font-bold text-slate-200 hover:text-purple-400 transition-colors"
            >
              Blog & Guides
            </button>
            <button
              onClick={() => handleNav('about')}
              className="text-2xl font-bold text-slate-200 hover:text-purple-400 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => handleNav('contact')}
              className="text-2xl font-bold text-slate-200 hover:text-purple-400 transition-colors"
            >
              Contact
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleNav(user ? 'puzzles' : 'signup');
              }}
              className="text-2xl font-bold text-purple-400 flex items-center gap-2"
            >
              <span>Puzzle Generator</span>
              <span className="text-xs bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded-full border border-purple-600">
                New
              </span>
            </button>
          </div>

          {/* Bottom CTAs */}
          <div className="pt-6 border-t border-slate-800 space-y-3">
            {user ? (
              <button
                onClick={() => handleNav('dashboard')}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-center shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleNav('signup')}
                  className="w-full py-3.5 rounded-xl bg-[#7c3aed] text-white font-bold text-center shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2"
                >
                  <span>Start Free</span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => handleNav('login')}
                  className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-center hover:text-white transition-colors"
                >
                  Log In to Existing Account
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
