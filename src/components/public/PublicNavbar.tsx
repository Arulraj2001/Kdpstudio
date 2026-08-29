import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Menu, 
  X, 
  ArrowRight, 
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { CurrencySelector } from '../ui/CurrencySelector';
import { PageRoute } from '../../types';

interface PublicNavbarProps {
  currentRoute?: PageRoute;
  onNavigate: (route: PageRoute) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ currentRoute = 'home', onNavigate }) => {
  const { user } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header
      id="public-navbar"
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200/80 py-3' 
          : 'bg-white border-b border-slate-100 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <div 
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <BookOpen size={20} className="stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900">
                KDP<span className="text-purple-600">Studio</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/60">
                AI
              </span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <button
            onClick={() => handleNav('home', 'features')}
            className="hover:text-purple-600 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => handleNav('home', 'how-it-works')}
            className="hover:text-purple-600 transition-colors cursor-pointer"
          >
            How It Works
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
        </nav>

        {/* Right: Actions & Auth */}
        <div className="hidden sm:flex items-center gap-3">
          <CurrencySelector />

          {user ? (
            <button
              id="nav-goto-dashboard-btn"
              onClick={() => handleNav('dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 transition-all"
            >
              <LayoutDashboard size={15} />
              <span>Go to Dashboard</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                id="nav-login-btn"
                onClick={() => handleNav('login')}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Log In
              </button>
              <button
                id="nav-signup-btn"
                onClick={() => handleNav('signup')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 transition-all"
              >
                <Sparkles size={14} />
                <span>Get Started</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <CurrencySelector />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-3 font-semibold text-slate-700 text-sm">
            <button
              onClick={() => handleNav('home', 'features')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => handleNav('home', 'how-it-works')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => handleNav('pricing')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => handleNav('about')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => handleNav('contact')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors"
            >
              Contact
            </button>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            {user ? (
              <button
                onClick={() => handleNav('dashboard')}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <LayoutDashboard size={16} />
                <span>Go to Dashboard</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleNav('signup')}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <Sparkles size={16} />
                  <span>Get Started Free</span>
                </button>
                <button
                  onClick={() => handleNav('login')}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
                >
                  Log In
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
