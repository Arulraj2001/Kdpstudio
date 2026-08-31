'use client';

import React from 'react';
import { PageRoute } from '../../types';
import { CurrencySelector } from '../ui/CurrencySelector';

interface FooterProps {
  onNavigate?: (route: PageRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (route: PageRoute, hash?: string) => {
    if (onNavigate) {
      onNavigate(route);
      if (hash) {
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.location.href = `/${route === 'home' ? '' : route}${hash ? `#${hash}` : ''}`;
    }
  };

  return (
    <footer id="public-footer" className="bg-[#0f0f1a] text-[#9ca3af] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        
        {/* Row 1: 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14">
          
          {/* Column 1 — Brand (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <div 
              onClick={() => handleNav('home')}
              className="flex items-center gap-2.5 cursor-pointer select-none group inline-flex"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-purple-500/40 p-1 flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform overflow-hidden">
                <img
                  src="/brand-icon.png?v=20260830"
                  alt="KDP Studio Logo"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white leading-tight">
                  KDP<span className="text-purple-400">Studio</span>
                </span>
                <span className="text-[8px] font-bold text-purple-400 tracking-[0.2em] uppercase leading-none">
                  PUBLISHING SUITE
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs">
              The complete AI publishing suite for Amazon KDP authors. Write, format, design and publish — all in one place.
            </p>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/90 text-slate-300 border border-slate-700/60">
                <span>🇮🇳</span> Made in India · Powered by Google AI
              </span>
            </div>

            {/* Social Icons Row (Pure SVG, no external library) */}
            <div className="flex items-center gap-4 pt-2">
              {/* Twitter / X */}
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noreferrer" 
                className="text-slate-400 hover:text-white transition-colors" 
                aria-label="Twitter"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer" 
                className="text-slate-400 hover:text-white transition-colors" 
                aria-label="YouTube"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer" 
                className="text-slate-400 hover:text-white transition-colors" 
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="text-slate-400 hover:text-white transition-colors" 
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2 — Product (3 cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <button
                  onClick={() => handleNav('features')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('pricing')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('puzzles')}
                  className="hover:text-white transition-colors text-left cursor-pointer flex items-center gap-1.5"
                >
                  <span>Puzzle Generator</span>
                  <span className="text-[9px] bg-purple-900/80 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/50">New</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('home', 'book-types')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Book Types
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('changelog')}
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Changelog</span>
                  <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.2 rounded border border-purple-700/50">v2.4</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3 — Resources (3 cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <button
                  onClick={() => handleNav('blog')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Blog & Articles
                </button>
              </li>
              <li>
                <a
                  href="https://kdp.amazon.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors text-left block"
                >
                  KDP Publishing Guide ↗
                </a>
              </li>
              <li>
                <button
                  onClick={() => handleNav('home', 'how-it-works')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('contact')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  API & Developer Docs
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('contact')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Affiliate Program
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4 — Company (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <button
                  onClick={() => handleNav('about')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('contact')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Contact & Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('terms')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('privacy')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('privacy', 'cookies')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Cookie Policy
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Row 2: Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 KDP Studio. All rights reserved.
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <span>Made with</span>
            <span className="text-red-500">❤️</span>
            <span>using Google AI</span>
          </div>

          <div className="flex items-center gap-2">
            <CurrencySelector />
          </div>
        </div>

      </div>
    </footer>
  );
};
