import React, { useState } from 'react';
import { 
  Home, 
  BookOpen, 
  Pencil, 
  Search, 
  Menu, 
  X, 
  Layout, 
  ImageIcon, 
  Tag, 
  Puzzle, 
  Layers, 
  BarChart3, 
  Palette, 
  Settings, 
  CreditCard, 
  LogOut, 
  ShieldCheck,
  BookMarked
} from 'lucide-react';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';

interface MobileBottomNavProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentRoute, onNavigate }) => {
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);
  const { signOut, user } = useAuthStore();

  const handleItemClick = (route: PageRoute) => {
    setIsMoreOpen(false);
    onNavigate(route);
  };

  const navTabs = [
    { id: 'dashboard' as PageRoute, label: 'Home', icon: Home },
    { id: 'books' as PageRoute, label: 'Books', icon: BookOpen },
    { id: 'studio' as PageRoute, label: 'Write', icon: Pencil, highlight: true },
    { id: 'research' as PageRoute, label: 'Research', icon: Search },
    { id: 'more' as any, label: 'More', icon: Menu, isAction: true },
  ];

  const moreMenuItems = [
    { id: 'formatter' as PageRoute, label: 'Interior Formatter', icon: Layout, desc: '300 DPI layout engine' },
    { id: 'cover' as PageRoute, label: 'Cover Builder', icon: ImageIcon, desc: 'Spine & full wrap spreads' },
    { id: 'kdp' as PageRoute, label: 'KDP Assistant', icon: Tag, desc: 'Keywords, categories & metadata' },
    { id: 'puzzles' as PageRoute, label: 'Puzzles & Coloring', icon: Puzzle, desc: 'Activity book generators' },
    { id: 'series' as PageRoute, label: 'Book Series', icon: BookMarked, desc: 'Manage sequels & universes' },
    { id: 'bulk' as PageRoute, label: 'Bulk Generator', icon: Layers, desc: 'Batch produce 100+ books' },
    { id: 'analytics' as PageRoute, label: 'Analytics & Goals', icon: BarChart3, desc: 'Royalties & tracking' },
    { id: 'publish' as PageRoute, label: 'Publish Checklist', icon: ShieldCheck, desc: 'Amazon pre-flight checker' },
    { id: 'brand-kit' as PageRoute, label: 'Brand Kit', icon: Palette, desc: 'Pen names & typography' },
    { id: 'billing' as PageRoute, label: 'Billing & Plans', icon: CreditCard, desc: 'Manage your subscription' },
    { id: 'settings' as PageRoute, label: 'Account Settings', icon: Settings, desc: 'Profile & preferences' },
  ];

  return (
    <>
      {/* ── Slide-up "More" Bottom Sheet ── */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-h-[82vh] bg-[#0f0c24] border-t border-purple-500/40 rounded-t-[28px] text-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 70px)' }}
          >
            {/* Sheet Header */}
            <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-purple-500/40 p-1 flex items-center justify-center overflow-hidden">
                  <img src="/brand-icon.png?v=20260830" alt="KDP Studio" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">All Studio Tools</h3>
                  <p className="text-[10px] text-purple-300">Amazon Publishing Suite</p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Tool Grid */}
            <div className="p-4 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-purple-900">
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all active:scale-98 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-400/50 text-white'
                        : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-800 text-purple-300'
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-white truncate">{item.label}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.desc}</div>
                    </div>
                  </button>
                );
              })}

              {/* Sign Out Option */}
              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                    <LogOut size={18} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs text-rose-200">Sign Out</div>
                    <div className="text-[10px] text-rose-300/70">{user?.email || 'Logged in author'}</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed Mobile Bottom Nav Bar ── */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f0c24]/95 backdrop-blur-lg border-t border-slate-800/90 text-slate-400 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
        aria-label="Mobile Navigation"
      >
        <div className="h-14 grid grid-cols-5 items-center px-1 max-w-lg mx-auto">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.isAction ? isMoreOpen : currentRoute === tab.id;

            if (tab.highlight) {
              return (
                <button
                  key={tab.id}
                  onClick={() => handleItemClick(tab.id)}
                  className="flex flex-col items-center justify-center -mt-4 group active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 border-2 border-[#0f0c24]">
                    <Icon size={20} className="stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-300 mt-0.5">
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => tab.isAction ? setIsMoreOpen(!isMoreOpen) : handleItemClick(tab.id)}
                className={`flex flex-col items-center justify-center py-1 transition-colors active:scale-95 ${
                  isActive ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-purple-500/20' : ''}`}>
                  <Icon size={19} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
                </div>
                <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-purple-300' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
