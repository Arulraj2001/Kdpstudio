import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PageRoute, TrimSize } from '../../types';
import { DashboardView } from '../dashboard/DashboardView';
import { StudioView } from '../studio/StudioView';
import { FormatterView } from '../formatter/FormatterView';
import { CoverView } from '../cover/CoverView';
import { PuzzlesDashboardView } from '../puzzles/PuzzlesDashboardView';
import { WordSearchSetupView } from '../puzzles/WordSearchSetupView';
import { WordSearchGeneratingView } from '../puzzles/WordSearchGeneratingView';
import { WordSearchDetailView } from '../puzzles/WordSearchDetailView';
import { WordFitSetupView } from '../puzzles/WordFitSetupView';
import { WordFitGeneratingView } from '../puzzles/WordFitGeneratingView';
import { WordFitDetailView } from '../puzzles/WordFitDetailView';
import { ColoringSetupView } from '../puzzles/ColoringSetupView';
import { ColoringGeneratingView } from '../puzzles/ColoringGeneratingView';
import { ColoringDetailView } from '../puzzles/ColoringDetailView';
import { ColorByNumberSetupView } from '../puzzles/ColorByNumberSetupView';
import { ColorByNumberGeneratingView } from '../puzzles/ColorByNumberGeneratingView';
import { ColorByNumberDetailView } from '../puzzles/ColorByNumberDetailView';
import { KdpAssistantView } from '../kdp/KdpAssistantView';
import { MyBooksView } from '../books/MyBooksView';
import { SeriesDashboardView } from '../series/SeriesDashboardView';
import { SeriesCreateWizardView } from '../series/SeriesCreateWizardView';
import { SeriesDetailView } from '../series/SeriesDetailView';
import { NicheResearchView } from '../research/NicheResearchView';
import { NicheDetailView } from '../research/NicheDetailView';
import { SavedNichesView } from '../research/SavedNichesView';
import { NicheResult, NicheCategory } from '../../types/niche';
import { BulkGeneratorHubView } from '../bulk/BulkGeneratorHubView';
import { BulkTemplateWizardView } from '../bulk/BulkTemplateWizardView';
import { BulkTemplateDetailView } from '../bulk/BulkTemplateDetailView';
import { BulkJobProgressView } from '../bulk/BulkJobProgressView';
import { BulkJobResultsView } from '../bulk/BulkJobResultsView';
import { BulkBookType } from '../../types/bulk';
import { AnalyticsOverviewView } from '../analytics/AnalyticsOverviewView';
import { BookDetailAnalyticsView } from '../analytics/BookDetailAnalyticsView';
import { RoyaltyCalculatorView } from '../analytics/RoyaltyCalculatorView';
import { PublishingGoalsView } from '../analytics/PublishingGoalsView';
import { PublishChecklistView } from '../publish/PublishChecklistView';
import { BrandKitView } from '../brand/BrandKitView';
import { SettingsView } from '../settings/SettingsView';
import { BillingPageView } from '../settings/BillingPageView';
import { AdminPageView } from '../admin/AdminPageView';
import { ImpersonationBanner } from '../admin/ImpersonationBanner';
import { AdminGuard } from '../admin/AdminGuard';
import { AdminLayout } from '../admin/AdminLayout';
import { AdminOverviewPage } from '../admin/overview/AdminOverviewPage';
import { AdminUsersPage } from '../admin/users/AdminUsersPage';
import { UserDetailPage } from '../admin/users/UserDetailPage';
import { RevenuePage } from '../admin/revenue/RevenuePage';
import { PaymentsPage } from '../admin/payments/PaymentsPage';
import { UpiQueuePage } from '../admin/payments/UpiQueuePage';
import { BmacQueuePage } from '../admin/payments/BmacQueuePage';
import { FeatureUsagePage } from '../admin/system/FeatureUsagePage';
import { SystemHealthPage } from '../admin/system/SystemHealthPage';
import { BroadcastEmailPage } from '../admin/system/BroadcastEmailPage';
import { AppSettingsPage } from '../admin/system/AppSettingsPage';
import { PlanLimitsAdminPage } from '../admin/system/PlanLimitsAdminPage';
import { SiteSeoAdminPage } from '../admin/system/SiteSeoAdminPage';
import { initPlanLimitsSubscription } from '../../lib/planLimits';
import { initSEOSubscription } from '../../lib/seoService';
import { SupportCenterPage } from '../admin/support/SupportCenterPage';
import { InstallPrompt } from '../pwa/InstallPrompt';
import { UpdatePrompt } from '../pwa/UpdatePrompt';
import { MobileBottomNav } from '../pwa/MobileBottomNav';
import { NotificationPermission } from '../pwa/NotificationPermission';
import { OfflineView } from '../pwa/OfflineView';
import { onForegroundMessage } from '../../lib/messaging';
import { trackPwaEvent } from '../../lib/pwaTracker';
import { toastStore } from '../../lib/toastStore';
import { ContentModerationPage } from '../admin/content/ContentModerationPage';
import { AuditReportsPage } from '../admin/content/AuditReportsPage';
import { BlogPostsListPage } from '../admin/blog/BlogPostsListPage';
import { BlogPostEditor } from '../admin/blog/BlogPostEditor';
import { BlogAuthorsPage } from '../admin/blog/BlogAuthorsPage';
import { BlogBulkImportPage } from '../admin/blog/BlogBulkImportPage';
import { BlogAdSettingsPage } from '../admin/blog/BlogAdSettingsPage';
import { BlogAnalyticsPage } from '../admin/blog/BlogAnalyticsPage';
import { BlogSeoToolsPage } from '../admin/blog/BlogSeoToolsPage';
import { BlogNewsletterPage } from '../admin/blog/BlogNewsletterPage';
import { GeoTestView } from '../geo/GeoTestView';
import { NewBookModal } from '../modals/NewBookModal';
import { AuthPages } from '../auth/AuthPages';
import { AuthProvider } from '../auth/AuthProvider';
import { OnboardingView } from '../onboarding/OnboardingView';
import { UsageBanner } from '../ui/UsageBanner';
import { PendingPaymentBanner } from '../ui/PendingPaymentBanner';
import { UpgradeModal } from '../ui/UpgradeModal';
import { CheckoutModal } from '../payment/CheckoutModal';
import { PaymentSuccessPageView } from '../public/PaymentSuccessPageView';
import { ToastContainer } from '../ui/ToastContainer';
import { PublicLayout } from '../public/PublicLayout';
import { HomePageView } from '../public/HomePageView';
import { FeaturesPageView } from '../public/FeaturesPageView';
import { PricingPageView } from '../public/PricingPageView';
import { AboutPageView } from '../public/AboutPageView';
import { TermsPageView } from '../public/TermsPageView';
import { PrivacyPageView } from '../public/PrivacyPageView';
import { ContactPageView } from '../public/ContactPageView';
import { ChangelogPageView } from '../public/ChangelogPageView';
import { BlogPageView } from '../public/BlogPageView';
import { BlogPostDetailView } from '../public/BlogPostDetailView';
import { LaunchPageView } from '../public/LaunchPageView';
import { KdpRoyaltyCalculatorView } from '../tools/KdpRoyaltyCalculatorView';
import { ReverseAsinSpyView } from '../tools/ReverseAsinSpyView';
import { ReviewPainPointMinerView } from '../tools/ReviewPainPointMinerView';
import { LeadMagnetQrStudioView } from '../tools/LeadMagnetQrStudioView';
import { MazeGeneratorView } from '../puzzles/MazeGeneratorView';
import { CryptogramGeneratorView } from '../puzzles/CryptogramGeneratorView';
import { useGeoStore } from '../../lib/geoStore';
import { useAuthStore } from '../../lib/authStore';
import { useBookStore } from '../../lib/store';
import { useSeriesStore } from '../../lib/seriesStore';
import { trackFeatureUse } from '../../lib/featureTracker';

export const ROUTE_PATH_MAP: Record<PageRoute, string> = {
  home: '/',
  features: '/features',
  pricing: '/pricing',
  about: '/about',
  terms: '/terms',
  privacy: '/privacy',
  contact: '/contact',
  changelog: '/changelog',
  blog: '/blog',
  'blog-detail': '/blog',
  launch: '/launch',
  login: '/login',
  signup: '/signup',
  'forgot-password': '/forgot-password',
  'verify-email': '/verify-email',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
  studio: '/studio',
  formatter: '/formatter',
  cover: '/cover',
  puzzles: '/puzzles',
  'maze-generator': '/puzzles/mazes',
  'cryptogram-generator': '/puzzles/cryptograms',
  'word-search': '/word-search',
  'word-search-generating': '/word-search-generating',
  'word-search-detail': '/word-search-detail',
  'word-fit': '/word-fit',
  'word-fit-generating': '/word-fit-generating',
  'word-fit-detail': '/word-fit-detail',
  coloring: '/coloring',
  'coloring-generating': '/coloring-generating',
  'coloring-detail': '/coloring-detail',
  'color-by-number': '/color-by-number',
  'color-by-number-generating': '/color-by-number-generating',
  'color-by-number-detail': '/color-by-number-detail',
  'royalty-calculator': '/tools/royalty-calculator',
  'asin-spy': '/tools/asin-spy',
  'review-miner': '/tools/review-miner',
  'lead-magnet': '/tools/lead-magnet',
  kdp: '/kdp',
  research: '/research',
  'research-detail': '/research-detail',
  'research-saved': '/research-saved',
  bulk: '/bulk',
  'bulk-template-new': '/bulk/new',
  'bulk-template-detail': '/bulk/template',
  'bulk-job-detail': '/bulk/job',
  'bulk-job-results': '/bulk/results',
  analytics: '/analytics',
  'analytics-calculator': '/analytics-calculator',
  'analytics-goals': '/analytics-goals',
  'analytics-books': '/analytics-books',
  books: '/books',
  series: '/series',
  'series-new': '/series/new',
  'series-detail': '/series/detail',
  publish: '/publish',
  'brand-kit': '/brand-kit',
  settings: '/settings',
  billing: '/billing',
  admin: '/admin',
  'admin-users': '/admin/users',
  'admin-user-detail': '/admin/users/detail',
  'admin-revenue': '/admin/revenue',
  'admin-payments': '/admin/payments',
  'admin-payments-upi': '/admin/payments/upi',
  'admin-payments-bmac': '/admin/payments/bmac',
  'admin-usage': '/admin/system/usage',
  'admin-health': '/admin/system/health',
  'admin-broadcast': '/admin/system/broadcast',
  'admin-settings': '/admin/system/settings',
  'admin-support': '/admin/support',
  'admin-content': '/admin/content',
  'admin-content-audits': '/admin/content/audits',
  'admin-blog': '/admin/blog',
  'admin-blog-new': '/admin/blog/new',
  'admin-blog-edit': '/admin/blog/edit',
  'admin-blog-authors': '/admin/blog/authors',
  'admin-blog-import': '/admin/blog/import',
  'admin-blog-ads': '/admin/blog/ads',
  'admin-blog-analytics': '/admin/blog/analytics',
  'admin-blog-seo': '/admin/blog/seo',
  'admin-blog-newsletter': '/admin/blog/newsletter',
  'geo-test': '/geo-test',
  'payment-success': '/payment-success',
};

export function parsePathToRoute(pathname: string): PageRoute | null {
  const clean = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean) return null;

  if (clean === '' || clean === 'home') return 'home';
  if (clean === 'features') return 'features';
  if (clean === 'payment/success' || clean === 'payment-success') return 'payment-success';
  if (clean === 'pricing') return 'pricing';
  if (clean === 'about') return 'about';
  if (clean === 'terms') return 'terms';
  if (clean === 'privacy') return 'privacy';
  if (clean === 'contact') return 'contact';
  if (clean === 'changelog') return 'changelog';
  if (clean === 'blog' || clean === 'blog/') return 'blog';
  if (clean.startsWith('blog/')) return 'blog-detail';
  if (clean === 'launch') return 'launch';
  if (clean === 'login') return 'login';
  if (clean === 'signup') return 'signup';
  if (clean === 'forgot-password') return 'forgot-password';
  if (clean === 'verify-email') return 'verify-email';
  if (clean === 'onboarding') return 'onboarding';
  if (clean === 'dashboard') return 'dashboard';
  if (clean === 'studio') return 'studio';
  if (clean === 'formatter') return 'formatter';
  if (clean === 'cover') return 'cover';
  if (clean === 'puzzles') return 'puzzles';
  if (clean === 'puzzles/word-search' || clean === 'word-search') return 'word-search';
  if (clean === 'puzzles/word-search/generating' || clean === 'word-search-generating') return 'word-search-generating';
  if (clean === 'puzzles/word-search/detail' || clean === 'word-search-detail') return 'word-search-detail';
  if (clean === 'puzzles/word-fit' || clean === 'word-fit') return 'word-fit';
  if (clean === 'puzzles/word-fit/generating' || clean === 'word-fit-generating') return 'word-fit-generating';
  if (clean === 'puzzles/word-fit/detail' || clean === 'word-fit-detail') return 'word-fit-detail';
  if (clean === 'puzzles/coloring' || clean === 'coloring') return 'coloring';
  if (clean === 'puzzles/coloring/generating' || clean === 'coloring-generating') return 'coloring-generating';
  if (clean === 'puzzles/coloring/detail' || clean === 'coloring-detail') return 'coloring-detail';
  if (clean === 'puzzles/color-by-number' || clean === 'color-by-number') return 'color-by-number';
  if (clean === 'puzzles/color-by-number/generating' || clean === 'color-by-number-generating') return 'color-by-number-generating';
  if (clean === 'puzzles/mazes' || clean === 'puzzles/maze' || clean === 'maze-generator' || clean === 'mazes') return 'maze-generator';
  if (clean === 'puzzles/cryptograms' || clean === 'puzzles/cryptogram' || clean === 'cryptogram-generator' || clean === 'cryptograms') return 'cryptogram-generator';
  if (clean === 'tools/royalty-calculator' || clean === 'royalty-calculator' || clean === 'calculator') return 'royalty-calculator';
  if (clean === 'tools/asin-spy' || clean === 'asin-spy' || clean === 'spy') return 'asin-spy';
  if (clean === 'tools/review-miner' || clean === 'review-miner' || clean === 'miner') return 'review-miner';
  if (clean === 'tools/lead-magnet' || clean === 'lead-magnet' || clean === 'qr-studio' || clean === 'qr') return 'lead-magnet';
  if (clean === 'kdp') return 'kdp';
  if (clean === 'research') return 'research';
  if (clean === 'research/saved' || clean === 'research-saved') return 'research-saved';
  if (clean.startsWith('research/niche/') || clean === 'research/detail' || clean === 'research-detail') return 'research-detail';
  if (clean === 'bulk') return 'bulk';
  if (clean === 'bulk/new' || clean === 'bulk/template/new' || clean === 'bulk-template-new') return 'bulk-template-new';
  if (clean.startsWith('bulk/template') || clean === 'bulk-template-detail') return 'bulk-template-detail';
  if (clean.endsWith('/results') || clean === 'bulk/job/results' || clean === 'bulk-job-results') return 'bulk-job-results';
  if (clean.startsWith('bulk/job') || clean === 'bulk-job-detail') return 'bulk-job-detail';
  if (clean === 'analytics') return 'analytics';
  if (clean === 'analytics/books' || clean === 'analytics-books') return 'analytics-books';
  if (clean === 'analytics/calculator' || clean === 'analytics-calculator') return 'analytics-calculator';
  if (clean === 'analytics/goals' || clean === 'analytics-goals') return 'analytics-goals';
  if (clean === 'books') return 'books';
  if (clean === 'series') return 'series';
  if (clean === 'series/new' || clean === 'series-new') return 'series-new';
  if (clean.startsWith('series/') || clean === 'series-detail') return 'series-detail';
  if (clean === 'publish') return 'publish';
  if (clean === 'brand-kit' || clean === 'brand' || clean === 'settings/brand') return 'brand-kit';
  if (clean === 'settings') return 'settings';
  if (clean === 'billing') return 'billing';
  if (clean === 'admin/blog/new') return 'admin-blog-new';
  if (clean.startsWith('admin/blog/') && clean.endsWith('/edit')) return 'admin-blog-edit';
  if (clean === 'admin/blog/authors') return 'admin-blog-authors';
  if (clean === 'admin/blog/import') return 'admin-blog-import';
  if (clean === 'admin/blog/ads') return 'admin-blog-ads';
  if (clean === 'admin/blog/analytics') return 'admin-blog-analytics';
  if (clean === 'admin/blog/seo') return 'admin-blog-seo';
  if (clean === 'admin/blog/newsletter') return 'admin-blog-newsletter';
  if (clean === 'admin/blog') return 'admin-blog';
  if (clean === 'admin/system/seo' || clean === 'admin/seo' || clean === 'admin-seo') return 'admin-seo';
  if (clean === 'admin/system/limits' || clean === 'admin/limits' || clean === 'admin-limits') return 'admin-limits';
  if (clean === 'admin/system/usage' || clean === 'admin/usage') return 'admin-usage';
  if (clean === 'admin/system/health' || clean === 'admin/health') return 'admin-health';
  if (clean === 'admin/system/broadcast' || clean === 'admin/broadcast') return 'admin-broadcast';
  if (clean === 'admin/system/settings' || clean === 'admin/settings') return 'admin-settings';
  if (clean === 'admin/support') return 'admin-support';
  if (clean === 'admin/content/audits') return 'admin-content-audits';
  if (clean === 'admin/content') return 'admin-content';
  if (clean === 'admin/revenue') return 'admin-revenue';
  if (clean === 'admin/payments/upi' || clean === 'admin/upi') return 'admin-payments-upi';
  if (clean === 'admin/payments/bmac' || clean === 'admin/bmac') return 'admin-payments-bmac';
  if (clean === 'admin/payments') return 'admin-payments';
  if (clean.startsWith('admin/users/') && clean.split('/').length >= 3) return 'admin-user-detail';
  if (clean === 'admin/users') return 'admin-users';
  if (clean === 'admin') return 'admin';
  if (clean === 'geo-test') return 'geo-test';

  return null;
}

export const AppShell: React.FC = () => {
  // Determine initial route based on URL pathname/hash/storage
  const getInitialRoute = (): PageRoute => {
    if (typeof window !== 'undefined') {
      const parsed = parsePathToRoute(window.location.pathname);
      if (parsed) return parsed;

      // If at root '/' check last visited route in session
      const lastRoute = sessionStorage.getItem('kdp_current_route') || localStorage.getItem('kdp_last_route');
      if (lastRoute && lastRoute !== 'home' && lastRoute in ROUTE_PATH_MAP) {
        return lastRoute as PageRoute;
      }
    }
    return 'home';
  };

  const [currentRoute, setCurrentRoute] = useState<PageRoute>(getInitialRoute);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);
  const [selectedPublishBookId, setSelectedPublishBookId] = useState<string | undefined>(undefined);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [activeBulkJobId, setActiveBulkJobId] = useState<string>('');
  const [activeBulkTemplateId, setActiveBulkTemplateId] = useState<string>('');
  const [activeBulkBookType, setActiveBulkBookType] = useState<BulkBookType | undefined>(undefined);
  const [activeAnalyticsBookId, setActiveAnalyticsBookId] = useState<string>('');
  const [activePuzzleBookId, setActivePuzzleBookId] = useState<string>('');
  const [selectedNiche, setSelectedNiche] = useState<NicheResult | null>(null);
  const [researchInitialQuery, setResearchInitialQuery] = useState<string>('');
  const [researchInitialCategory, setResearchInitialCategory] = useState<NicheCategory | 'all'>('all');
  const [selectedSavedNicheId, setSelectedSavedNicheId] = useState<string | undefined>(undefined);
  const [selectedBlogId, setSelectedBlogId] = useState<string>('');
  const [activeBlogSlug, setActiveBlogSlug] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/blog/')) {
      return window.location.pathname.replace('/blog/', '').trim() || 'kdp-niches-2026';
    }
    return 'kdp-niches-2026';
  });
  const { user, userDoc, isInitialized } = useAuthStore();

  // Initialize IP Geolocation & URL param queries on app mount
  useEffect(() => {
    useGeoStore.getState().initLocation();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      const cat = params.get('category');
      if (q) setResearchInitialQuery(q);
      if (cat) setResearchInitialCategory(cat as any);

      // Listen to browser Back and Forward navigation buttons
      const handlePopState = () => {
        const route = parsePathToRoute(window.location.pathname) || 'home';
        if (window.location.pathname.startsWith('/blog/')) {
          const slug = window.location.pathname.replace('/blog/', '').trim();
          if (slug) setActiveBlogSlug(slug);
        }
        setCurrentRoute(route);
        sessionStorage.setItem('kdp_current_route', route);
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });

  // PWA Offline status & Foreground push message handlers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      trackPwaEvent(user?.uid, 'pwa_offline_page_shown');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Track standalone launch
    if (window.matchMedia('(display-mode: standalone)').matches) {
      trackPwaEvent(user?.uid, 'pwa_launched_standalone');
    }

    // Subscribe to Foreground FCM Messages
    let unsubscribeFCM: (() => void) | null = null;
    onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      toastStore.addToast({
        title: title || 'KDP Studio',
        message: body || 'New update available.',
        type: 'info',
        duration: 5000,
      });
    }).then((unsub) => {
      if (unsub) unsubscribeFCM = unsub;
    });

    // Initialize dynamic plan limits & SEO real-time subscriptions from Firestore
    const unsubscribePlanLimits = initPlanLimitsSubscription();
    const unsubscribeSEO = initSEOSubscription();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (unsubscribeFCM) unsubscribeFCM();
      if (unsubscribePlanLimits) unsubscribePlanLimits();
      if (unsubscribeSEO) unsubscribeSEO();
    };
  }, [user?.uid]);

  // Automatic onboarding redirection logic + guard auth routes for authenticated users
  useEffect(() => {
    if (!isInitialized) return;

    const isPublicMarketingRoute = [
      'home', 'features', 'pricing', 'about', 'terms', 'privacy', 'contact', 'changelog', 'blog', 'blog-detail', 'launch', 'payment-success',
      'royalty-calculator', 'asin-spy', 'review-miner', 'lead-magnet', 'maze-generator', 'cryptogram-generator'
    ].includes(currentRoute);

    const isAuth = ['login', 'signup', 'forgot-password', 'verify-email'].includes(currentRoute);

    if (user && userDoc) {
      if (isAuth) {
        const nextRoute = userDoc.onboardingComplete === false ? 'onboarding' : 'dashboard';
        handleNavigate(nextRoute);
        return;
      }

      // Onboarding guard for protected routes
      if (userDoc.onboardingComplete === false && !isAuth && currentRoute !== 'onboarding' && !isPublicMarketingRoute) {
        handleNavigate('onboarding');
      } else if (userDoc.onboardingComplete === true && currentRoute === 'onboarding') {
        handleNavigate('dashboard');
      }
    }
  }, [user, userDoc, currentRoute, isInitialized]);

  const handleNavigate = (route: PageRoute, params?: Record<string, string>) => {
    if (params?.id && (route === 'series-detail' || route === 'series')) {
      setSelectedSeriesId(params.id);
    }
    if (params?.id && route === 'admin-blog-edit') {
      setSelectedBlogId(params.id);
    }
    if (params?.q) {
      setResearchInitialQuery(params.q);
    }
    if (params?.category) {
      setResearchInitialCategory(params.category as any);
    }

    setCurrentRoute(route);

    // Sync browser address bar with HTML5 pushState
    if (typeof window !== 'undefined') {
      const basePath = ROUTE_PATH_MAP[route] || `/${route}`;
      let fullPath = basePath;

      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        fullPath = `${basePath}?${searchParams.toString()}`;
      }

      if (window.location.pathname !== basePath) {
        window.history.pushState({ route, params }, '', fullPath);
      }

      sessionStorage.setItem('kdp_current_route', route);
      localStorage.setItem('kdp_last_route', route);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNewBook = () => {
    if (!user) {
      handleNavigate('signup');
      return;
    }
    if (user?.isDemo) {
      useToastStore.getState().addToast({
        type: 'warning',
        title: 'Demo Mode (View-Only)',
        message: 'You are exploring in Demo Mode. Create a free account or sign in to draft and save your own books.',
        duration: 6000,
        action: {
          label: 'Sign Up Free',
          onClick: () => handleNavigate('signup'),
        },
      });
      return;
    }
    setIsNewBookModalOpen(true);
  };

  const handleCreateBook = (bookData: { 
    title: string; 
    genre: string; 
    trimSize: TrimSize;
    seriesId?: string;
    volumeNumber?: number;
  }) => {
    const newBook = useBookStore.getState().addBook({
      title: bookData.title,
      genre: bookData.genre,
      trimSize: bookData.trimSize,
      ...(bookData.seriesId ? { seriesId: bookData.seriesId, volumeNumber: bookData.volumeNumber || 1 } : {}),
    } as any);

    if (bookData.seriesId) {
      useSeriesStore.getState().addBookToSeries(bookData.seriesId, newBook.id, bookData.volumeNumber || 1);
    }
    useBookStore.getState().setCurrentBook(newBook.id);
    if (user?.uid) {
      trackFeatureUse(user.uid, 'book_created', { bookId: newBook.id, genre: bookData.genre }).catch(console.error);
    }
    setCurrentRoute('studio');
  };

  const handleOpenPublishChecklist = (bookId: string) => {
    setSelectedPublishBookId(bookId);
    setCurrentRoute('publish');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isPublicMarketingRoute = [
    'home', 'features', 'pricing', 'about', 'terms', 'privacy', 'contact', 'changelog', 'blog', 'blog-detail', 'launch', 'payment-success',
    'royalty-calculator', 'asin-spy', 'review-miner', 'lead-magnet', 'maze-generator', 'cryptogram-generator'
  ].includes(currentRoute);

  const isAuthRoute = ['login', 'signup', 'forgot-password', 'verify-email'].includes(currentRoute);
  const isOnboardingRoute = currentRoute === 'onboarding';
  const isAdminRoute = currentRoute === 'admin' || currentRoute.startsWith('admin-');

  const getAdminPageTitle = (route: PageRoute): string => {
    switch (route) {
      case 'admin-revenue': return 'Revenue & MRR Analytics';
      case 'admin-users': return 'All Users';
      case 'admin-user-detail': return 'User Detail';
      case 'admin-payments': return 'Payment Ledger';
      case 'admin-payments-upi': return 'UPI Pending Verification';
      case 'admin-payments-bmac': return 'Buy Me a Coffee Queue';
      case 'admin-usage': return 'Feature Usage Analytics';
      case 'admin-health': return 'System Health & Probes';
      case 'admin-broadcast': return 'Broadcast Email System';
      case 'admin-settings': return 'App Configuration & Feature Flags';
      case 'admin-limits': return 'Dynamic Plan Limits & Quota Manager';
      case 'admin-seo': return 'Site-Wide SEO & Meta Manager';
      case 'admin-support': return 'Support Center';
      case 'admin-content': return 'Content Moderation Review Queue';
      case 'admin-content-audits': return 'Manuscript Audit Reports';
      case 'admin-blog': return 'Blog Posts & SEO CMS';
      case 'admin-blog-new': return 'New Blog Article';
      case 'admin-blog-edit': return 'Edit Blog Article';
      case 'admin-blog-authors': return 'Author Profiles & EEAT';
      case 'admin-blog-import': return 'Bulk Article Ingestion';
      case 'admin-blog-ads': return 'AdSense Placement Controls';
      case 'admin-blog-analytics': return 'Content & Search Analytics';
      default: return 'Admin Overview';
    }
  };

  return (
    <AuthProvider>
      {/* ─────────────────────────────────────────
          1. Public Marketing Route Group
         ───────────────────────────────────────── */}
      {isPublicMarketingRoute ? (
        <PublicLayout currentRoute={currentRoute} onNavigate={handleNavigate}>
          {currentRoute === 'home' && <HomePageView onNavigate={handleNavigate} />}
          {currentRoute === 'features' && <FeaturesPageView onNavigate={handleNavigate} />}
          {currentRoute === 'pricing' && <PricingPageView onNavigate={handleNavigate} />}
          {currentRoute === 'about' && <AboutPageView onNavigate={handleNavigate} />}
          {currentRoute === 'terms' && <TermsPageView onNavigate={handleNavigate} />}
          {currentRoute === 'privacy' && <PrivacyPageView onNavigate={handleNavigate} />}
          {currentRoute === 'contact' && <ContactPageView onNavigate={handleNavigate} />}
          {currentRoute === 'changelog' && <ChangelogPageView onNavigate={handleNavigate} />}
          {currentRoute === 'blog' && (
            <BlogPageView
              onNavigate={handleNavigate}
              onSelectPost={(slug) => {
                setActiveBlogSlug(slug);
                setCurrentRoute('blog-detail');
                sessionStorage.setItem('kdp_current_route', 'blog-detail');
                window.history.pushState({ route: 'blog-detail', slug }, '', `/blog/${slug}`);
              }}
            />
          )}
          {currentRoute === 'blog-detail' && (
            <BlogPostDetailView
              slug={activeBlogSlug}
              onNavigate={handleNavigate}
              onSelectPost={(slug) => {
                setActiveBlogSlug(slug);
                setCurrentRoute('blog-detail');
                sessionStorage.setItem('kdp_current_route', 'blog-detail');
                window.history.pushState({ route: 'blog-detail', slug }, '', `/blog/${slug}`);
              }}
            />
          )}
          {currentRoute === 'launch' && <LaunchPageView onNavigate={handleNavigate} />}
          {currentRoute === 'payment-success' && <PaymentSuccessPageView onNavigate={handleNavigate} />}
          {currentRoute === 'royalty-calculator' && <KdpRoyaltyCalculatorView onNavigate={handleNavigate} />}
          {currentRoute === 'asin-spy' && <ReverseAsinSpyView onNavigate={handleNavigate} />}
          {currentRoute === 'review-miner' && <ReviewPainPointMinerView onNavigate={handleNavigate} />}
          {currentRoute === 'lead-magnet' && <LeadMagnetQrStudioView onNavigate={handleNavigate} />}
          {currentRoute === 'maze-generator' && <MazeGeneratorView onNavigate={handleNavigate} />}
          {currentRoute === 'cryptogram-generator' && <CryptogramGeneratorView onNavigate={handleNavigate} />}
        </PublicLayout>
      ) : isOnboardingRoute ? (
        /* ─────────────────────────────────────────
            2. Onboarding Flow
           ───────────────────────────────────────── */
        <OnboardingView onNavigate={handleNavigate} />
      ) : isAuthRoute ? (
        /* ─────────────────────────────────────────
            3. Auth Route Group (Overlaid on blurred website)
           ───────────────────────────────────────── */
        <div className="relative min-h-screen">
          {/* Website Content in Background (Blurred) */}
          <div className="filter blur-[5px] opacity-80 pointer-events-none select-none transition-all duration-300" aria-hidden="true">
            <PublicLayout currentRoute="home" onNavigate={() => {}}>
              <HomePageView onNavigate={() => {}} />
            </PublicLayout>
          </div>

          {/* Auth Card Overlay */}
          <div 
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleNavigate('home');
              }
            }}
          >
            <AuthPages
              initialView={currentRoute as any}
              onNavigate={handleNavigate}
              onSuccess={() => {
                // BUG 5: Read fresh userDoc from store at call-time, not stale closure
                const freshDoc = useAuthStore.getState().userDoc;
                handleNavigate(freshDoc?.onboardingComplete === false ? 'onboarding' : 'dashboard');
              }}
            />
          </div>
        </div>
      ) : isAdminRoute ? (
        /* ─────────────────────────────────────────
            4. Isolated Admin Console Command Center
           ───────────────────────────────────────── */
        <AdminGuard>
          <AdminLayout
            currentRoute={currentRoute}
            onNavigate={handleNavigate}
            pageTitle={getAdminPageTitle(currentRoute)}
          >
            {currentRoute === 'admin' && <AdminOverviewPage />}
            {currentRoute === 'admin-users' && <AdminUsersPage />}
            {currentRoute === 'admin-user-detail' && (
              <UserDetailPage
                uid={typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || '' : ''}
              />
            )}
            {currentRoute === 'admin-revenue' && <RevenuePage />}
            {currentRoute === 'admin-payments' && <PaymentsPage />}
            {currentRoute === 'admin-payments-upi' && <UpiQueuePage />}
            {currentRoute === 'admin-payments-bmac' && <BmacQueuePage />}
            {currentRoute === 'admin-usage' && <FeatureUsagePage />}
            {currentRoute === 'admin-health' && <SystemHealthPage />}
            {currentRoute === 'admin-broadcast' && <BroadcastEmailPage />}
            {currentRoute === 'admin-settings' && <AppSettingsPage />}
            {currentRoute === 'admin-limits' && <PlanLimitsAdminPage />}
            {currentRoute === 'admin-seo' && <SiteSeoAdminPage />}
            {currentRoute === 'admin-support' && <SupportCenterPage />}
            {currentRoute === 'admin-content' && <ContentModerationPage />}
            {currentRoute === 'admin-content-audits' && <AuditReportsPage />}
            {currentRoute === 'admin-blog' && (
              <BlogPostsListPage
                onNavigate={handleNavigate}
                onEditPost={(id) => {
                  setSelectedBlogId(id);
                  handleNavigate('admin-blog-edit', { id });
                }}
              />
            )}
            {currentRoute === 'admin-blog-new' && (
              <BlogPostEditor onNavigate={handleNavigate} />
            )}
            {currentRoute === 'admin-blog-edit' && (
              <BlogPostEditor
                postId={selectedBlogId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') || undefined : undefined)}
                onNavigate={handleNavigate}
              />
            )}
            {currentRoute === 'admin-blog-authors' && (
              <BlogAuthorsPage onNavigate={handleNavigate} />
            )}
            {currentRoute === 'admin-blog-import' && (
              <BlogBulkImportPage onNavigate={handleNavigate} />
            )}
            {currentRoute === 'admin-blog-ads' && (
              <BlogAdSettingsPage onNavigate={handleNavigate} />
            )}
            {currentRoute === 'admin-blog-analytics' && (
              <BlogAnalyticsPage
                onNavigate={handleNavigate}
                onEditPost={(id) => {
                  setSelectedBlogId(id);
                  handleNavigate('admin-blog-edit', { id });
                }}
              />
            )}
            {currentRoute === 'admin-blog-seo' && (
              <BlogSeoToolsPage onNavigate={handleNavigate} />
            )}
            {currentRoute === 'admin-blog-newsletter' && (
              <BlogNewsletterPage onNavigate={handleNavigate} />
            )}
          </AdminLayout>
        </AdminGuard>
      ) : (
        /* ─────────────────────────────────────────
            5. Standard User Protected App Route Group
           ───────────────────────────────────────── */
        <div id="app-shell" className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased">
          {/* Persistent Left Sidebar */}
          <Sidebar
            currentRoute={currentRoute}
            onRouteChange={handleNavigate}
            isOpenMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar Header */}
            <TopBar
              currentRoute={currentRoute}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              onNewBook={handleOpenNewBook}
              onNavigate={handleNavigate}
              isSidebarCollapsed={isSidebarCollapsed}
            />

            {/* PWA Notification Permission & System Banners */}
            <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
              {/* Demo Mode Notice Banner */}
              {user?.isDemo && (
                <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white px-4 py-2.5 sm:py-2 flex flex-wrap items-center justify-between gap-2 shadow-sm border-b border-purple-500/30 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-xs shrink-0">
                      Demo Mode (View-Only)
                    </span>
                    <span className="text-purple-200 font-medium hidden md:inline">
                      You are exploring KDP Studio in preview mode. Create a free account or sign in to draft, edit, and export your books.
                    </span>
                    <span className="text-purple-200 font-medium md:hidden">
                      Preview mode (view-only). Sign up to edit & export.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    <button
                      onClick={() => handleNavigate('signup')}
                      className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      Sign Up Free
                    </button>
                    <button
                      onClick={() => handleNavigate('login')}
                      className="px-2.5 py-1 text-purple-200 hover:text-white text-xs font-semibold rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}
              <NotificationPermission />
              <PendingPaymentBanner onContactSupport={() => handleNavigate('contact')} />
              <UsageBanner onNavigateToPricing={() => handleNavigate('pricing')} />
            </div>

            {/* Offline View or Standard Viewport */}
            {isOffline ? (
              <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                <OfflineView onRetry={() => setIsOffline(!navigator.onLine)} />
              </div>
            ) : (
              <main
                id="main-content"
                className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8
                  ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
                `}
              >
              {currentRoute === 'dashboard' && (
                <DashboardView
                  onNavigate={handleNavigate}
                  onNewBook={handleOpenNewBook}
                />
              )}

              {currentRoute === 'studio' && (
                <StudioView onNavigateToRoute={handleNavigate} />
              )}

              {currentRoute === 'formatter' && <FormatterView />}

              {currentRoute === 'cover' && <CoverView />}

              {currentRoute === 'puzzles' && (
                <PuzzlesDashboardView
                  onNavigate={handleNavigate}
                  onOpenGenerator={(type) => {
                    if (type === 'word-search') handleNavigate('word-search');
                    if (type === 'word-fit') handleNavigate('word-fit');
                    if (type === 'coloring') handleNavigate('coloring');
                    if (type === 'color-by-number') handleNavigate('color-by-number');
                  }}
                  onOpenPuzzleBook={(id, type) => {
                    setActivePuzzleBookId(id);
                    if (type === 'word-fit') handleNavigate('word-fit-detail');
                    else if (type === 'coloring') handleNavigate('coloring-detail');
                    else if (type === 'color-by-number') handleNavigate('color-by-number-detail');
                    else handleNavigate('word-search-detail');
                  }}
                />
              )}

              {currentRoute === 'word-search' && (
                <WordSearchSetupView
                  onBack={() => handleNavigate('puzzles')}
                  onStartGenerating={(id) => {
                    setActivePuzzleBookId(id);
                    handleNavigate('word-search-generating');
                  }}
                />
              )}

              {currentRoute === 'word-search-generating' && (
                <WordSearchGeneratingView
                  bookId={activePuzzleBookId}
                  onPreviewBook={(id) => {
                    setActivePuzzleBookId(id);
                    handleNavigate('word-search-detail');
                  }}
                />
              )}

              {currentRoute === 'word-search-detail' && (
                <WordSearchDetailView
                  bookId={activePuzzleBookId}
                  onBack={() => handleNavigate('puzzles')}
                  onNavigateToBooks={() => handleNavigate('books')}
                />
              )}

              {currentRoute === 'word-fit' && (
                <WordFitSetupView
                  onBack={() => handleNavigate('puzzles')}
                  onStartGenerating={(id) => {
                    setActivePuzzleBookId(id);
                    handleNavigate('word-fit-generating');
                  }}
                />
              )}

              {currentRoute === 'word-fit-generating' && (
                <WordFitGeneratingView
                  bookId={activePuzzleBookId}
                  onPreviewBook={(id) => {
                    setActivePuzzleBookId(id);
                    handleNavigate('word-fit-detail');
                  }}
                />
              )}

              {currentRoute === 'word-fit-detail' && (
                <WordFitDetailView
                  bookId={activePuzzleBookId}
                  onBack={() => handleNavigate('puzzles')}
                  onNavigateToBooks={() => handleNavigate('books')}
                />
              )}

              {currentRoute === 'coloring' && (
                <ColoringSetupView
                  onBack={() => handleNavigate('puzzles')}
                  onStartGenerating={(id) => {
                    setActivePuzzleBookId(id);
                    handleNavigate('coloring-generating');
                  }}
                />
              )}

              {currentRoute === 'coloring-generating' && (
                <ColoringGeneratingView
                  bookId={activePuzzleBookId}
                  onPreviewBook={(id) => {
                    setActivePuzzleBookId(id);
                    handleNavigate('coloring-detail');
                  }}
                />
              )}

              {currentRoute === 'coloring-detail' && (
                <ColoringDetailView
                  bookId={activePuzzleBookId}
                  onBack={() => handleNavigate('puzzles')}
                  onNavigateToBooks={() => handleNavigate('books')}
                />
              )}

              {currentRoute === 'color-by-number' && (
                <ColorByNumberSetupView
                  onBack={() => handleNavigate('puzzles')}
                  onStartGenerating={(id) => {
                    setActivePuzzleBookId(id);
                    handleNavigate('color-by-number-generating');
                  }}
                />
              )}

              {currentRoute === 'color-by-number-generating' && (
                <ColorByNumberGeneratingView
                  bookId={activePuzzleBookId}
                  onPreviewBook={(id) => {
                    setActivePuzzleBookId(id);
                    handleNavigate('color-by-number-detail');
                  }}
                />
              )}

              {currentRoute === 'color-by-number-detail' && (
                <ColorByNumberDetailView
                  bookId={activePuzzleBookId}
                  onBack={() => handleNavigate('puzzles')}
                  onNavigateToBooks={() => handleNavigate('books')}
                />
              )}

              {currentRoute === 'kdp' && <KdpAssistantView onNavigate={handleNavigate} />}

              {currentRoute === 'research' && (
                <NicheResearchView
                  onNavigate={handleNavigate}
                  initialQuery={researchInitialQuery}
                  initialCategory={researchInitialCategory}
                  onSelectNicheDetail={(niche, savedId) => {
                    setSelectedNiche(niche);
                    setSelectedSavedNicheId(savedId);
                    handleNavigate('research-detail');
                  }}
                />
              )}

              {currentRoute === 'research-detail' && (
                <NicheDetailView
                  niche={
                    selectedNiche || {
                      id: 'niche_default',
                      nicheTitle: 'Amazon KDP Market Report',
                      category: 'self-help',
                      subcategory: 'Publishing Analytics',
                      description: 'In-depth market analysis and competitive positioning data for this niche.',
                      opportunityScore: 84,
                      demandScore: 82,
                      competitionScore: 42,
                      profitScore: 78,
                      trendScore: 80,
                      estimatedMonthlySales: 'Estimated: 500-1,500 units/month',
                      averagePrice: '$11.99-$14.99',
                      topBsrRange: 'BSR 3,000-45,000',
                      estimatedMonthlyRevenue: '$3,500-$9,000',
                      difficulty: 'easy',
                      competitorCount: '120-250 books',
                      topCompetitorStrength: 'Moderate',
                      marketGap: 'High reader demand for modern structured worksheets and clear visual breakdowns.',
                      trend: 'rising',
                      trendReason: 'Consistent search expansion across self-publishing categories.',
                      seasonality: null,
                      recommendedBisacCategories: ['SELF-HELP / Personal Growth / General'],
                      suggestedKeywords: ['guided journal', 'daily workbook', 'beginner handbook'],
                      recommendedPrice: '$12.99',
                      royaltyPlan: '70%',
                      recommendedTrimSize: '6x9',
                      pageCountRange: '120-160 pages',
                      bookIdeas: [
                        {
                          title: 'The 30-Day Focus Blueprint',
                          subtitle: 'Practical Exercises and Daily Journal',
                          angle: 'Micro-prompts with accountability metrics',
                          targetReader: 'Action-driven self-learners',
                          estimatedPageCount: 140,
                          suggestedPrice: '$12.99',
                        },
                      ],
                      pros: ['Strong search intent from targeted buyers', 'Low initial production barrier'],
                      cons: ['Requires eye-catching cover typography'],
                      verdict: 'A viable and high-converting publishing opportunity on Amazon KDP.',
                      timeToFirstSale: '2-4 weeks',
                      generatedAt: new Date().toISOString(),
                      searchQuery: 'Niche Report',
                      dataSource: 'ai-analysis',
                    }
                  }
                  savedNicheId={selectedSavedNicheId}
                  onBack={() => handleNavigate('research')}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'research-saved' && (
                <SavedNichesView
                  onBack={() => handleNavigate('research')}
                  onSelectNicheDetail={(niche, savedId) => {
                    setSelectedNiche(niche);
                    setSelectedSavedNicheId(savedId);
                    handleNavigate('research-detail');
                  }}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'bulk' && (
                <BulkGeneratorHubView
                  onNavigate={(route, params) => {
                    if (params?.type) setActiveBulkBookType(params.type as BulkBookType);
                    handleNavigate(route);
                  }}
                  onSelectJob={(jobId) => {
                    setActiveBulkJobId(jobId);
                    handleNavigate('bulk-job-detail');
                  }}
                  onSelectTemplate={(templateId) => {
                    setActiveBulkTemplateId(templateId);
                    handleNavigate('bulk-template-detail');
                  }}
                  onEditTemplate={(templateId) => {
                    setActiveBulkTemplateId(templateId);
                    handleNavigate('bulk-template-new');
                  }}
                />
              )}

              {currentRoute === 'bulk-template-new' && (
                <BulkTemplateWizardView
                  initialTemplateId={activeBulkTemplateId}
                  initialBookType={activeBulkBookType}
                  onBack={() => handleNavigate('bulk')}
                  onNavigate={handleNavigate}
                  onJobCreated={(jobId) => {
                    setActiveBulkJobId(jobId);
                    handleNavigate('bulk-job-detail');
                  }}
                />
              )}

              {currentRoute === 'bulk-template-detail' && (
                <BulkTemplateDetailView
                  templateId={activeBulkTemplateId || 'btpl_demo'}
                  onBack={() => handleNavigate('bulk')}
                  onNavigate={handleNavigate}
                  onEditTemplate={(tplId) => {
                    setActiveBulkTemplateId(tplId);
                    handleNavigate('bulk-template-new');
                  }}
                  onJobCreated={(jobId) => {
                    setActiveBulkJobId(jobId);
                    handleNavigate('bulk-job-detail');
                  }}
                />
              )}

              {currentRoute === 'bulk-job-detail' && (
                <BulkJobProgressView
                  jobId={activeBulkJobId || 'bjob_demo'}
                  onBack={() => handleNavigate('bulk')}
                  onNavigate={handleNavigate}
                  onViewResults={(jobId) => {
                    setActiveBulkJobId(jobId);
                    handleNavigate('bulk-job-results');
                  }}
                />
              )}

              {currentRoute === 'bulk-job-results' && (
                <BulkJobResultsView
                  jobId={activeBulkJobId || 'bjob_demo'}
                  onBack={() => handleNavigate('bulk-job-detail')}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'analytics' && (
                <AnalyticsOverviewView
                  onNavigate={handleNavigate}
                  onSelectBook={(bookId) => {
                    setActiveAnalyticsBookId(bookId);
                    handleNavigate('analytics-books');
                  }}
                />
              )}

              {currentRoute === 'analytics-books' && (
                <BookDetailAnalyticsView
                  bookId={activeAnalyticsBookId}
                  onBack={() => handleNavigate('analytics')}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'analytics-calculator' && (
                <RoyaltyCalculatorView
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'analytics-goals' && (
                <PublishingGoalsView
                  onBack={() => handleNavigate('analytics')}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'books' && (
                <MyBooksView
                  onNewBook={handleOpenNewBook}
                  onNavigateToRoute={handleNavigate}
                  onOpenPublishChecklist={handleOpenPublishChecklist}
                />
              )}

              {currentRoute === 'series' && (
                <SeriesDashboardView onNavigate={handleNavigate} />
              )}

              {currentRoute === 'series-new' && (
                <SeriesCreateWizardView onNavigate={handleNavigate} />
              )}

              {currentRoute === 'series-detail' && (
                <SeriesDetailView seriesId={selectedSeriesId} onNavigate={handleNavigate} />
              )}

              {currentRoute === 'publish' && (
                <PublishChecklistView
                  onNavigate={handleNavigate}
                  selectedBookId={selectedPublishBookId}
                />
              )}

              {currentRoute === 'brand-kit' && <BrandKitView />}

              {currentRoute === 'settings' && <SettingsView onNavigate={handleNavigate} />}

              {currentRoute === 'royalty-calculator' && <KdpRoyaltyCalculatorView onNavigate={handleNavigate} />}
              {currentRoute === 'asin-spy' && <ReverseAsinSpyView onNavigate={handleNavigate} />}
              {currentRoute === 'review-miner' && <ReviewPainPointMinerView onNavigate={handleNavigate} />}
              {currentRoute === 'lead-magnet' && <LeadMagnetQrStudioView onNavigate={handleNavigate} />}
              {currentRoute === 'maze-generator' && <MazeGeneratorView onNavigate={handleNavigate} />}
              {currentRoute === 'cryptogram-generator' && <CryptogramGeneratorView onNavigate={handleNavigate} />}
              {currentRoute === 'billing' && <BillingPageView onNavigate={handleNavigate} />}

              {currentRoute === 'geo-test' && <GeoTestView />}
            </main>
            )}
          </div>

          {/* Mobile Bottom Navigation (Mobile & Installed PWA) */}
          <MobileBottomNav
            currentRoute={currentRoute}
            onNavigate={handleNavigate}
          />

          {/* New Book Modal */}
          <NewBookModal
            isOpen={isNewBookModalOpen}
            onClose={() => setIsNewBookModalOpen(false)}
            onCreateBook={handleCreateBook}
          />

          {/* Global Upgrade Modal */}
          <UpgradeModal onNavigateToPricing={() => handleNavigate('pricing')} />
        </div>
      )}

      {/* Global Unified Checkout Modal */}
      <CheckoutModal onNavigate={handleNavigate} />

      {/* Global Impersonation Banner — shown on ALL pages when admin is impersonating */}
      <ImpersonationBanner />

      {/* Global Notifications */}
      <ToastContainer />

      {/* PWA Prompts */}
      <InstallPrompt />
      <UpdatePrompt />
    </AuthProvider>
  );
};
