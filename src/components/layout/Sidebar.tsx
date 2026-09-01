import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  ShieldCheck,
  CreditCard,
  Puzzle,
  Palette,
  BarChart3,
  ShieldAlert,
  Calculator,
  Compass,
  AlertOctagon,
  QrCode,
  Baby,
  UtensilsCrossed,
  Calendar,
  Briefcase,
  FileText,
  Users,
  Sparkles,
  Layers
} from 'lucide-react';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';

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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  description?: string;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  subGroups?: {
    id: string;
    title: string;
    items: NavItem[];
  }[];
}

const SearchChartIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
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
    <path d="M11 8v6M8 12h6" />
  </svg>
);

const BatchLayersIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
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

// ── Chronological 5-Stage Publishing Pipeline Architecture ──
const NAV_SECTIONS: NavSection[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'books', label: 'My Books', icon: BookOpen },
      { id: 'series', label: 'Series Manager', icon: BookMarked },
      { id: 'analytics', label: 'Analytics & Royalties', icon: BarChart3, badge: 'Pro' },
    ],
  },
  {
    id: 'draft',
    title: '1. Draft & Write',
    items: [
      { id: 'studio', label: 'Book Studio', icon: Pencil, badge: 'Claude AI' },
      { id: 'brand-kit', label: 'Brand Kit & Pen Names', icon: Palette },
    ],
    subGroups: [
      {
        id: 'specialized-studios',
        title: 'Specialized Studios',
        items: [
          { id: 'fiction-studio', label: 'Fiction Studio', icon: BookOpen, badge: 'Genre' },
          { id: 'nonfiction-studio', label: 'Non-Fiction Studio', icon: Briefcase, badge: 'Guide' },
          { id: 'workbook-studio', label: 'Workbook Studio', icon: FileText, badge: 'Framework' },
          { id: 'childrens-book-studio', label: 'Children\'s Books', icon: Baby, badge: 'Illustrated' },
          { id: 'cookbook-studio', label: 'Cookbook Studio', icon: UtensilsCrossed, badge: 'Recipes' },
          { id: 'planner-studio', label: 'Planner Studio', icon: Calendar, badge: 'Journal' },
        ],
      },
    ],
  },
  {
    id: 'format',
    title: '2. Format & Design',
    items: [
      { id: 'formatter', label: 'Interior Formatter', icon: Layout, badge: '300 DPI' },
      { id: 'cover', label: 'Wrap Cover Builder', icon: ImageIcon, badge: 'Spine Math' },
      { id: 'puzzles', label: 'Puzzle & Activity Suite', icon: Puzzle, badge: 'Updated' },
      { id: 'bulk', label: 'Bulk Series Generator', icon: BatchLayersIcon, badge: 'Agency' },
    ],
  },
  {
    id: 'publish',
    title: '3. Validate & Publish',
    items: [
      { id: 'kdp', label: 'KDP Assistant & Keywords', icon: Tag },
      { id: 'publish', label: 'Publishing Checklist', icon: ShieldCheck, badge: 'Pre-Flight' },
    ],
  },
  {
    id: 'promote',
    title: '4. Promote & Scale',
    items: [
      { id: 'arc-manager', label: 'ARC Campaigns', icon: Users, badge: 'Compliant' },
      { id: 'newsletter-swaps', label: 'Newsletter Cross-Promos', icon: Sparkles, badge: 'New' },
      { id: 'lead-magnet', label: 'Lead Magnet & Reader QR', icon: QrCode },
    ],
    subGroups: [
      {
        id: 'market-intel',
        title: 'Market Intelligence',
        items: [
          { id: 'research', label: 'Niche Research', icon: SearchChartIcon, badge: 'Pro' },
          { id: 'asin-spy', label: 'Reverse ASIN Spy', icon: Compass, badge: 'Pro' },
          { id: 'review-miner', label: 'Review Miner', icon: AlertOctagon, badge: 'Pro' },
          { id: 'royalty-calculator', label: 'Royalty Calculator', icon: Calculator, badge: 'Free' },
        ],
      },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { user } = useAuthStore();
  const adminEmail = (import.meta as any).env?.VITE_ADMIN_EMAIL || 'arulraj8637@gmail.com';
  const isAdmin = user?.email?.toLowerCase() === adminEmail.toLowerCase();

  // Collapsible sub-sections state
  const isRouteInSpecialized = ['fiction-studio', 'nonfiction-studio', 'workbook-studio', 'childrens-book-studio', 'cookbook-studio', 'planner-studio'].includes(currentRoute);
  const isRouteInMarketIntel = ['research', 'asin-spy', 'review-miner', 'royalty-calculator'].includes(currentRoute);

  const [openSpecialized, setOpenSpecialized] = useState(isRouteInSpecialized);
  const [openMarketIntel, setOpenMarketIntel] = useState(isRouteInMarketIntel);

  // Auto-expand section when user navigates into it
  useEffect(() => {
    if (isRouteInSpecialized) setOpenSpecialized(true);
  }, [isRouteInSpecialized]);

  useEffect(() => {
    if (isRouteInMarketIntel) setOpenMarketIntel(true);
  }, [isRouteInMarketIntel]);

  const handleNavClick = (route: PageRoute) => {
    onRouteChange(route);
    onCloseMobile();
  };

  const renderNavItem = (item: NavItem, isNested = false) => {
    const Icon = item.icon;
    const isActive = currentRoute === item.id;

    return (
      <button
        key={item.id}
        id={`nav-item-${item.id}`}
        onClick={() => handleNavClick(item.id)}
        title={isCollapsed ? item.label : undefined}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-150 group relative cursor-pointer border
          ${isActive 
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25 border-purple-500 font-bold' 
            : 'bg-white border-slate-200/90 text-slate-700 hover:text-purple-950 hover:bg-purple-50/70 hover:border-purple-300 shadow-2xs'
          }
          ${isNested ? 'pl-3.5 text-[12px] bg-white/90 border-slate-200' : ''}
          ${isCollapsed && !isOpenMobile ? 'justify-center px-2' : ''}
        `}
      >
        <Icon 
          size={isNested ? 15 : 17} 
          className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-600'}`} 
        />
        
        {(!isCollapsed || isOpenMobile) && (
          <span className="truncate flex-1 text-left flex items-center justify-between">
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span
                className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 border ${
                  item.badge === 'Agency'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : item.badge === 'Pro' || item.badge === 'Claude AI'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : item.badge === 'Admin'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : item.badge === 'New' || item.badge === 'Compliant'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {item.badge}
              </span>
            )}
          </span>
        )}

        {/* Floating tooltip for collapsed desktop mode */}
        {isCollapsed && !isOpenMobile && (
          <div className="hidden group-hover:block absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-lg border border-slate-700 whitespace-nowrap z-50 pointer-events-none">
            {item.label} {item.badge ? `(${item.badge})` : ''}
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          id="mobile-sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container with prominent outline border */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white text-slate-800 border-r-2 border-slate-200 shadow-md shadow-slate-200/30 transition-all duration-300 ease-in-out
          ${isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Brand Header with outline border */}
        <div className="h-16 flex items-center justify-between px-4 border-b-2 border-slate-200 shrink-0 bg-white">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-300 p-0.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
              <img
                src="/brand-icon.png?v=20260831"
                alt="KDP Studio"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            {(!isCollapsed || isOpenMobile) && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base text-slate-900 tracking-tight leading-tight truncate">
                  KDP Studio
                </span>
                <span className="text-[9px] text-purple-600 font-bold tracking-widest uppercase">
                  Publishing Suite
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            id="close-mobile-sidebar-btn"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 md:hidden transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Pipeline List with Card Section Blocks */}
        <div className="flex-1 py-3 px-3 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
          {NAV_SECTIONS.map((section) => (
            <div 
              key={section.id} 
              className={`space-y-1.5 ${
                (!isCollapsed || isOpenMobile) 
                  ? 'p-2 rounded-2xl bg-slate-50/60 border border-slate-200/90 shadow-2xs' 
                  : 'space-y-1'
              }`}
            >
              {/* Section Header Divider */}
              {(!isCollapsed || isOpenMobile) ? (
                <div className="px-1.5 pt-0.5 pb-1 text-[10px] font-black tracking-wider text-slate-400 uppercase flex items-center justify-between">
                  <span>{section.title}</span>
                </div>
              ) : (
                <div className="my-1.5 border-t-2 border-slate-200 mx-1" />
              )}

              {/* Main Section Items */}
              {section.items.map((item) => renderNavItem(item))}

              {/* Sub-Groups (Collapsible Studios & Intelligence) */}
              {section.subGroups?.map((subGroup) => {
                const isSpecialized = subGroup.id === 'specialized-studios';
                const isOpen = isSpecialized ? openSpecialized : openMarketIntel;
                const setOpen = isSpecialized ? setOpenSpecialized : setOpenMarketIntel;

                if (isCollapsed && !isOpenMobile) {
                  // In collapsed mode, render icons directly with tooltips
                  return (
                    <div key={subGroup.id} className="space-y-1">
                      {subGroup.items.map((item) => renderNavItem(item))}
                    </div>
                  );
                }

                return (
                  <div key={subGroup.id} className="pt-0.5">
                    <div className="p-1 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                      <button
                        onClick={() => setOpen(!isOpen)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer rounded-lg hover:bg-purple-50/50"
                      >
                        <span className="flex items-center gap-1.5">
                          <Layers size={13} className="text-purple-600" />
                          <span>{subGroup.title}</span>
                        </span>
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-600' : 'text-slate-400'}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="space-y-1 pt-1 border-t border-slate-100">
                          {subGroup.items.map((item) => renderNavItem(item, true))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Admin Console Entry if logged in as admin */}
          {isAdmin && (
            <div className="p-2 rounded-2xl bg-rose-50/40 border border-rose-200/80 shadow-2xs space-y-1">
              {(!isCollapsed || isOpenMobile) && (
                <div className="px-1.5 pt-0.5 pb-1 text-[10px] font-black tracking-wider text-rose-600 uppercase">
                  Administration
                </div>
              )}
              {renderNavItem({
                id: 'admin',
                label: 'Admin Console',
                icon: ShieldAlert,
                badge: 'Admin',
              })}
            </div>
          )}
        </div>

        {/* Footer with outline border */}
        <div className="p-3 border-t-2 border-slate-200 hidden md:flex flex-col gap-2 shrink-0 bg-slate-50/90">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 pt-0.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-slate-600 font-medium">KDP Studio v1.2</span>
              </div>
              <span className="text-[9px] text-purple-700 font-bold uppercase tracking-wider bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                Cloud Synced
              </span>
            </div>
          )}
          <button
            id="toggle-sidebar-collapse-btn"
            onClick={onToggleCollapse}
            className={`p-2 rounded-xl text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/90 shadow-2xs transition-colors cursor-pointer ${isCollapsed ? 'mx-auto' : 'self-end'}`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

      </aside>
    </>
  );
};
