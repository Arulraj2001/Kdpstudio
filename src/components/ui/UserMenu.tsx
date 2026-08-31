import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Settings, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  ChevronDown, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink,
  LogIn,
  UserPlus,
  Home
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { PageRoute } from '../../types';

interface UserMenuProps {
  onNavigate: (route: PageRoute) => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Logged out buttons
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          id="nav-login-btn"
          type="button"
          onClick={() => onNavigate('login')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
        >
          <LogIn size={13} />
          <span>Log In</span>
        </button>

        <button
          id="nav-signup-btn"
          type="button"
          onClick={() => onNavigate('signup')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white text-xs font-bold shadow-xs shadow-purple-500/20 transition-all cursor-pointer"
        >
          <UserPlus size={13} />
          <span>Get Started</span>
        </button>
      </div>
    );
  }

  // Get user initials
  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() || 'AU';

  // Plan badge styling
  const planConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    free: { label: 'Free Tier', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    starter: { label: 'Starter', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    pro: { label: 'Pro Author', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    agency: { label: 'Agency', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    lifetime: { label: 'Lifetime Pass', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  };

  const planStyle = planConfig[user.plan] || planConfig.free;

  const handleMenuClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div id="user-menu-container" className="relative inline-block text-left" ref={menuRef}>
      {/* Avatar Button */}
      <button
        id="user-menu-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-2xl hover:bg-slate-100/80 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User profile'}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
        )}

        <span className="hidden sm:inline-block max-w-[100px] truncate text-xs font-bold text-slate-800 text-left">
          {user.displayName || user.email.split('@')[0]}
        </span>

        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="user-account-dropdown"
          className="absolute right-0 mt-1.5 w-64 rounded-2xl bg-white shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 focus:outline-none"
        >
          {/* User Profile Header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold text-sm flex items-center justify-center">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user.displayName || 'Author'}
                </p>
                <p className="text-[11px] text-slate-500 truncate" title={user.email}>
                  {user.email}
                </p>
              </div>
            </div>

            {/* Plan Badge */}
            <div className="mt-2.5 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${planStyle.bg} ${planStyle.text} ${planStyle.border}`}>
                <Sparkles size={10} />
                <span>{planStyle.label}</span>
              </span>

              <span className="text-[10px] text-slate-400 font-mono">
                {user.country} · {user.currency}
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <div className="py-1">
            <button
              onClick={() => handleMenuClick(() => onNavigate('home'))}
              className="w-full px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Home size={15} className="text-purple-600" />
              <span>Public Homepage</span>
            </button>

            <button
              onClick={() => handleMenuClick(() => onNavigate('settings'))}
              className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <User size={15} className="text-slate-400" />
              <span>My Account & Profile</span>
            </button>

            <button
              onClick={() => handleMenuClick(() => onNavigate('billing'))}
              className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            >
              <CreditCard size={15} className="text-slate-400" />
              <span>Billing & Subscription</span>
            </button>

            <button
              onClick={() => handleMenuClick(() => onNavigate('publish'))}
              className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            >
              <ShieldCheck size={15} className="text-slate-400" />
              <span>KDP Pre-flight Checklist</span>
            </button>

            <a
              href="https://kdp.amazon.com/help"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle size={15} className="text-slate-400" />
                <span>Help & KDP Guidelines</span>
              </div>
              <ExternalLink size={12} className="text-slate-400" />
            </a>
          </div>

          {/* Divider & Sign Out */}
          <div className="pt-1 border-t border-slate-100">
            <button
              id="sign-out-btn"
              onClick={() => handleMenuClick(() => signOut())}
              className="w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
            >
              <LogOut size={15} className="text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
