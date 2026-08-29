import React from 'react';
import { 
  Home, 
  Pencil, 
  Layout, 
  Image as ImageIcon, 
  Tag, 
  BookOpen, 
  Settings, 
  X,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Puzzle,
  Palette,
  BarChart3
} from 'lucide-react';
import { PageRoute } from '../../types';

interface SidebarProps {
  currentRoute: PageRoute;
  onRouteChange: (route: PageRoute) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: PageRoute;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: string;
}

const SearchChartIcon: React.FC<{ className?: string; size?: number }> = ({ className, size = 18 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <polyline points="8 12 10 10 12 12 14 8" />
  </svg>
);

const BatchLayersIcon: React.FC<{ className?: string; size?: number }> = ({ className, size = 18 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'studio', label: 'Book Studio', icon: Pencil },
  { id: 'formatter', label: 'Interior Formatter', icon: Layout },
  { id: 'cover', label: 'Cover Builder', icon: ImageIcon },
  { id: 'kdp', label: 'KDP Assistant', icon: Tag },
  { id: 'research', label: 'Niche Research', icon: SearchChartIcon, badge: 'Pro' },
  { id: 'books', label: 'My Books', icon: BookOpen },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: 'Pro' },
  { id: 'series', label: 'Series', icon: BookMarked },
  { id: 'puzzles', label: 'Puzzles', icon: Puzzle, badge: 'New' },
  { id: 'bulk', label: 'Bulk Generator', icon: BatchLayersIcon, badge: 'Agency' },
  { id: 'publish', label: 'Publish Checklist', icon: ShieldCheck },
  { id: 'brand-kit', label: 'Brand Kit', icon: Palette },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const handleNavClick = (route: PageRoute) => {
    onRouteChange(route);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          id="mobile-sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#1a1a2e] text-slate-200 border-r border-slate-800/80 transition-all duration-300 ease-in-out
          ${isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-900/30 shrink-0">
              <BookMarked size={22} className="stroke-[2.2]" />
            </div>
            {(!isCollapsed || isOpenMobile) && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-lg text-white tracking-tight leading-tight truncate">
                  KDP Studio
                </span>
                <span className="text-[11px] text-purple-300/80 font-medium tracking-wide uppercase">
                  Publishing Suite
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            id="close-mobile-sidebar-btn"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          <div className={`px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase ${isCollapsed && !isOpenMobile ? 'text-center' : ''}`}>
            {isCollapsed && !isOpenMobile ? '•' : 'Main Menu'}
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 group relative cursor-pointer
                  ${isActive 
                    ? 'bg-[#7c3aed] text-white font-semibold shadow-md shadow-purple-950/40 ring-1 ring-purple-400/30' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }
                  ${isCollapsed && !isOpenMobile ? 'justify-center px-2' : ''}
                `}
              >
                <Icon 
                  size={20} 
                  className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-300'}`} 
                />
                
                {(!isCollapsed || isOpenMobile) && (
                  <span className="truncate flex-1 text-left flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                          item.badge === 'Agency'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : item.badge === 'Pro'
                            ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </span>
                )}

                {/* Floating tooltip for collapsed desktop mode */}
                {isCollapsed && !isOpenMobile && (
                  <div className="hidden group-hover:block absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 pointer-events-none">
                    {item.label} {item.badge ? `(${item.badge})` : ''}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer / User Profile & Collapse Toggle */}
        <div className="p-3 border-t border-slate-800/80 hidden md:flex flex-col gap-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-slate-400 font-medium">KDP Studio v1.2</span>
              </div>
              <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/50">
                Auth Active
              </span>
            </div>
          )}
          <button
            id="toggle-sidebar-collapse-btn"
            onClick={onToggleCollapse}
            className={`p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors ${isCollapsed ? 'mx-auto' : 'self-end'}`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

      </aside>
    </>
  );
};
