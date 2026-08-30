import React from 'react';
import { Menu, Plus, Sparkles, BookOpen, Layers, Home, ArrowLeft } from 'lucide-react';
import { PageRoute } from '../../types';
import { CurrencySelector } from '../ui/CurrencySelector';
import { UserMenu } from '../ui/UserMenu';

interface TopBarProps {
  currentRoute: PageRoute;
  onOpenMobileMenu: () => void;
  onNewBook: () => void;
  onNavigate: (route: PageRoute) => void;
  isSidebarCollapsed: boolean;
}

const ROUTE_TITLES: Record<PageRoute, { title: string; subtitle: string }> = {
  home: { title: 'Home', subtitle: 'Self-publishing suite for Amazon KDP' },
  pricing: { title: 'Pricing Plans', subtitle: 'Simple, transparent creator pricing' },
  about: { title: 'About KDP Studio', subtitle: 'Empowering indie authors worldwide' },
  terms: { title: 'Terms of Service', subtitle: 'Platform terms and usage agreement' },
  privacy: { title: 'Privacy Policy', subtitle: 'Data handling, protection and security' },
  contact: { title: 'Contact Us', subtitle: 'Support, questions, and team inquiries' },
  changelog: { title: 'Changelog', subtitle: 'Product updates and version history' },
  blog: { title: 'Author Academy', subtitle: 'Self-publishing tips, guides, and masterclasses' },
  dashboard: { title: 'Dashboard', subtitle: 'Overview & quick actions' },
  studio: { title: 'Book Studio', subtitle: 'Write and organize book chapters' },
  formatter: { title: 'Interior Formatter', subtitle: 'Trim sizes, margins & PDF print layouts' },
  cover: { title: 'Cover Builder', subtitle: 'Design front, spine & back full covers' },
  puzzles: { title: 'Puzzle & Activity Books', subtitle: 'Generate KDP-ready puzzle books in minutes' },
  'word-search': { title: 'Word Search Studio', subtitle: 'Design & generate multi-page word search puzzle books' },
  'word-search-generating': { title: 'Generating Book', subtitle: 'Compiling grids, solutions & print layouts' },
  'word-search-detail': { title: 'Word Search Editor', subtitle: 'Preview, customize words, and export PDF' },
  'word-fit': { title: 'Word Fit Studio', subtitle: 'Design & generate multi-page fill-in crossword books' },
  'word-fit-generating': { title: 'Generating Crosswords', subtitle: 'Calculating intersections, clues & print layouts' },
  'word-fit-detail': { title: 'Word Fit Editor', subtitle: 'Preview, customize words, and export PDF' },
  coloring: { title: 'Coloring Book Studio', subtitle: 'AI line art & coloring book generator' },
  'coloring-generating': { title: 'Synthesizing Artwork', subtitle: 'Generating high-contrast printable line art illustrations' },
  'coloring-detail': { title: 'Coloring Book Editor', subtitle: 'Inspect plates, edit prompts, and export KDP PDF' },
  'color-by-number': { title: 'Color by Number Studio', subtitle: 'Design & generate pre-segmented geometric mosaic activity books' },
  'color-by-number-generating': { title: 'Mapping Palette Regions', subtitle: 'Segmenting vector shapes and numbering color key regions' },
  'color-by-number-detail': { title: 'Color by Number Editor', subtitle: 'Preview interactive vector scenes, color keys, and export PDF' },
  kdp: { title: 'KDP Assistant', subtitle: 'Amazon keyword & metadata optimization' },
  research: { title: 'Niche Research', subtitle: 'AI-powered Amazon KDP niche & keyword discovery' },
  'research-detail': { title: 'Niche Analysis Report', subtitle: 'Opportunity scoring, demand velocity & competitor breakdown' },
  'research-saved': { title: 'Saved Niches', subtitle: 'Curate and organize your book concepts pipeline' },
  bulk: { title: 'Bulk Book Generator', subtitle: 'Generate 5–20 book variations simultaneously from a single template' },
  'bulk-template-new': { title: 'Create Bulk Template', subtitle: 'Define dynamic variables, shared trim specs, and cover palettes' },
  'bulk-template-detail': { title: 'Bulk Template Overview', subtitle: 'Inspect template specifications, variables breakdown, and batch run history' },
  'bulk-job-detail': { title: 'Bulk Job Progress', subtitle: 'Live sequential batch processing, progress stream, and ZIP export' },
  'bulk-job-results': { title: 'Batch Results', subtitle: 'Completed book variations, previews, and master ZIP bundle download' },
  analytics: { title: 'Analytics & Royalties', subtitle: 'Publishing performance, royalty tracker, BSR trends & AI insights' },
  'analytics-calculator': { title: 'Royalty Calculator', subtitle: 'Calculate net royalties, print costs, and sales volume forecasts' },
  'analytics-goals': { title: 'Publishing Goals', subtitle: 'Track your annual revenue, books published, and royalty targets' },
  'analytics-books': { title: 'Published Book Catalog', subtitle: 'Track performance, ASINs, and sales entries per book' },
  books: { title: 'My Books', subtitle: 'Manage your library of manuscripts' },
  series: { title: 'Book Series Manager', subtitle: 'Organize your books into series for consistent branding and discovery' },
  'series-new': { title: 'New Book Series', subtitle: '4-step series wizard: identity, cover style, color schemes & volumes' },
  'series-detail': { title: 'Manage Series', subtitle: 'Volume timeline, shared KDP metadata & Series Bible export' },
  publish: { title: 'Publish Checklist', subtitle: 'Amazon KDP pre-flight validation & readiness inspector' },
  'brand-kit': { title: 'Author Brand Kit', subtitle: 'Store your author identity, typography, palettes & legal templates' },
  settings: { title: 'Settings', subtitle: 'Preferences, API keys & export options' },
  billing: { title: 'Billing & Subscriptions', subtitle: 'Manage your subscription and invoices' },
  admin: { title: 'Admin Console', subtitle: 'User management and system analytics' },
  'admin-users': { title: 'All Users', subtitle: 'Search, filter and manage user accounts' },
  'admin-user-detail': { title: 'User Detail', subtitle: 'Full user profile, history, and actions' },
  'admin-revenue': { title: 'Revenue & MRR Analytics', subtitle: 'Recurring revenue, ARPU, churn, and financial charts' },
  'admin-payments': { title: 'Payment History', subtitle: 'Unified ledger across Razorpay, PayPal, UPI, and BMaC' },
  'admin-payments-upi': { title: 'UPI Pending Queue', subtitle: 'Verify UTR transfer numbers and activate subscriptions' },
  'admin-payments-bmac': { title: 'Buy Me a Coffee Queue', subtitle: 'Match supporter tips and donations to user accounts' },
  'admin-usage': { title: 'Feature Usage Analytics', subtitle: 'User engagement, feature funnels, and plan adoption metrics' },
  'admin-health': { title: 'System Health & Probes', subtitle: 'Service status, latency probes, cron jobs, and error logs' },
  'admin-broadcast': { title: 'Broadcast Email', subtitle: 'Dispatch announcements and updates to authors' },
  'admin-settings': { title: 'App Configuration', subtitle: 'Feature kill switches, maintenance mode, and pricing overrides' },
  'admin-support': { title: 'Support Center', subtitle: 'Contact inquiries, ticket management, and email replies' },
  'admin-content': { title: 'Content Moderation', subtitle: 'Review queue for flagged KDP policy concerns' },
  'admin-content-audits': { title: 'Audit Reports', subtitle: 'Quality and compliance audit logs across manuscripts' },
  'admin-blog': { title: 'Blog CMS', subtitle: 'Manage articles, SEO content & EEAT metadata' },
  'admin-blog-new': { title: 'New Article', subtitle: 'Write and publish SEO optimized articles' },
  'admin-blog-edit': { title: 'Edit Article', subtitle: 'Update content, images & metadata' },
  'admin-blog-authors': { title: 'Author Profiles', subtitle: 'Manage EEAT author credentials & bios' },
  'admin-blog-import': { title: 'Bulk Ingestion', subtitle: 'Batch import articles from Markdown and CSV' },
  'admin-blog-ads': { title: 'Ad Placements', subtitle: 'Google AdSense configuration and toggles' },
  'admin-blog-analytics': { title: 'Content Analytics', subtitle: 'Article views, search impressions & CTR' },
  'admin-blog-seo': { title: 'SEO Audit Tools', subtitle: 'Schema markup, sitemap health & keyword analysis' },
  'admin-blog-newsletter': { title: 'Blog Newsletter', subtitle: 'Dispatch digest emails to subscribers' },
  'blog-detail': { title: 'Article Reader', subtitle: 'Academy guides & publishing strategies' },
  launch: { title: 'Creator Launch', subtitle: 'KDP Studio launch specials & features' },
  'geo-test': { title: 'Geo & Currency Test', subtitle: 'Diagnostics & test suite for IP detection and currency' },
  login: { title: 'Sign In', subtitle: 'Access your account and manuscripts' },
  signup: { title: 'Create Account', subtitle: 'Join KDP Studio author platform' },
  'forgot-password': { title: 'Reset Password', subtitle: 'Account recovery' },
  'verify-email': { title: 'Verify Email', subtitle: 'Email confirmation step' },
  onboarding: { title: 'Welcome', subtitle: 'Account setup' },
  'payment-success': { title: 'Payment Success', subtitle: 'Your account has been upgraded' },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentRoute,
  onOpenMobileMenu,
  onNewBook,
  onNavigate,
  isSidebarCollapsed,
}) => {
  const info = ROUTE_TITLES[currentRoute] || { title: 'Dashboard', subtitle: '' };

  return (
    <header
      id="top-bar"
      className={`sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300 px-4 sm:px-6 lg:px-8 flex items-center justify-between
        ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
      `}
    >
      {/* Left: Mobile Back/hamburger & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {currentRoute !== 'dashboard' && (
          <button
            id="mobile-back-btn"
            onClick={() => onNavigate('dashboard')}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-purple-600 hover:bg-purple-50 md:hidden transition-colors flex items-center justify-center"
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <ArrowLeft size={20} className="stroke-[2.5]" />
          </button>
        )}

        <button
          id="open-mobile-menu-btn"
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {info.title}
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
              KDP Ready
            </span>
          </div>
          <span className="hidden sm:block text-xs text-slate-500 font-medium">
            {info.subtitle}
          </span>
        </div>
      </div>

      {/* Right: Currency, Homepage, New Book Button & User Avatar Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          id="topbar-home-btn"
          type="button"
          onClick={() => onNavigate('home')}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-purple-700 text-xs font-semibold transition-all cursor-pointer"
          title="Return to Public Homepage"
        >
          <Home size={14} className="text-purple-600" />
          <span>Home</span>
        </button>

        <CurrencySelector />

        <button
          id="topbar-new-book-btn"
          onClick={onNewBook}
          className="hidden sm:inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md shadow-purple-500/20 transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Plus size={16} className="stroke-[2.5]" />
          <span>New Book</span>
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <UserMenu onNavigate={onNavigate} />
      </div>
    </header>
  );
};

