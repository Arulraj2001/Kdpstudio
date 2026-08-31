'use client';

import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  ArrowRight, 
  Sparkles
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
          onClick={() => handleNav('puzzles')}
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
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-purple-500/40 p-1 flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
              <img
                src="/brand-icon.png?v=20260830"
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
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <button
              onClick={() => handleNav('home', 'features')}
              className="hover:text-purple-600 transition-colors cursor-pointer"
            >
              Features
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
            <button
              onClick={() => handleNav('about')}
              className={`hover:text-purple-600 transition-colors cursor-pointer ${
                currentRoute === 'about' ? 'text-purple-600 font-bold' : ''
              }`}
            >
              About
            </button>
            <button
              onClick={() => handleNav('contact')}
              className={`hover:text-purple-600 transition-colors cursor-pointer ${
                currentRoute === 'contact' ? 'text-purple-600 font-bold' : ''
              }`}
            >
              Contact
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
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-purple-500/40 p-1 flex items-center justify-center shadow-md overflow-hidden">
                <img
                  src="/brand-icon.png?v=20260830"
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
          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            <button
              onClick={() => handleNav('home', 'features')}
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
              onClick={() => handleNav('puzzles')}
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
