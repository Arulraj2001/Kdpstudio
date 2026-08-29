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
import { PricingPageView } from '../public/PricingPageView';
import { AboutPageView } from '../public/AboutPageView';
import { TermsPageView } from '../public/TermsPageView';
import { PrivacyPageView } from '../public/PrivacyPageView';
import { ContactPageView } from '../public/ContactPageView';
import { ChangelogPageView } from '../public/ChangelogPageView';
import { BlogPageView } from '../public/BlogPageView';
import { useGeoStore } from '../../lib/geoStore';
import { useAuthStore } from '../../lib/authStore';
import { useBookStore } from '../../lib/store';
import { useSeriesStore } from '../../lib/seriesStore';

export const AppShell: React.FC = () => {
  // Determine initial route based on URL pathname/hash if present
  const getInitialRoute = (): PageRoute => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      if (path === 'payment/success' || path === 'payment-success') return 'payment-success';
      if (path === 'pricing') return 'pricing';
      if (path === 'about') return 'about';
      if (path === 'terms') return 'terms';
      if (path === 'privacy') return 'privacy';
      if (path === 'contact') return 'contact';
      if (path === 'changelog') return 'changelog';
      if (path === 'blog') return 'blog';
      if (path === 'login') return 'login';
      if (path === 'signup') return 'signup';
      if (path === 'forgot-password') return 'forgot-password';
      if (path === 'verify-email') return 'verify-email';
      if (path === 'onboarding') return 'onboarding';
      if (path === 'dashboard') return 'dashboard';
      if (path === 'studio') return 'studio';
      if (path === 'formatter') return 'formatter';
      if (path === 'cover') return 'cover';
      if (path === 'puzzles') return 'puzzles';
      if (path === 'puzzles/word-search' || path === 'word-search') return 'word-search';
      if (path === 'puzzles/word-fit' || path === 'word-fit') return 'word-fit';
      if (path === 'puzzles/coloring' || path === 'coloring') return 'coloring';
      if (path === 'puzzles/color-by-number' || path === 'color-by-number') return 'color-by-number';
      if (path === 'kdp') return 'kdp';
      if (path === 'research') return 'research';
      if (path === 'research/saved' || path === 'research-saved') return 'research-saved';
      if (path.startsWith('research/niche/') || path === 'research-detail') return 'research-detail';
      if (path === 'bulk') return 'bulk';
      if (path === 'bulk/new' || path === 'bulk-template-new') return 'bulk-template-new';
      if (path.startsWith('bulk/template/')) return 'bulk-template-detail';
      if (path.startsWith('bulk/job/') && path.endsWith('/results')) return 'bulk-job-results';
      if (path.startsWith('bulk/job/')) return 'bulk-job-detail';
      if (path === 'books') return 'books';
      if (path === 'series') return 'series';
      if (path === 'series/new') return 'series-new';
      if (path.startsWith('series/')) return 'series-detail';
      if (path === 'brand-kit' || path === 'brand' || path === 'settings/brand') return 'brand-kit';
      if (path === 'settings') return 'settings';
      if (path === 'billing') return 'billing';
      if (path === 'admin') return 'admin';
      if (path === 'admin/revenue') return 'admin-revenue';
      if (path === 'admin/payments/upi' || path === 'admin/upi') return 'admin-payments-upi';
      if (path === 'admin/payments/bmac' || path === 'admin/bmac') return 'admin-payments-bmac';
      if (path === 'admin/payments') return 'admin-payments';
      if (path.startsWith('admin/users/') && path.split('/').length >= 3) return 'admin-user-detail';
      if (path === 'admin/users') return 'admin-users';
      if (path === 'geo-test') return 'geo-test';
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
  const [selectedSavedNicheId, setSelectedSavedNicheId] = useState<string | undefined>(undefined);
  const [researchInitialQuery, setResearchInitialQuery] = useState<string>('');
  const [researchInitialCategory, setResearchInitialCategory] = useState<NicheCategory | 'all'>('all');
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
    }
  }, []);

  // Automatic onboarding redirection logic + guard auth routes for authenticated users
  useEffect(() => {
    if (!isInitialized) return;

    const isPublicMarketingRoute = [
      'home', 'pricing', 'about', 'terms', 'privacy', 'contact', 'changelog', 'blog', 'payment-success'
    ].includes(currentRoute);

    const isAuth = ['login', 'signup', 'forgot-password', 'verify-email'].includes(currentRoute);

    if (user && userDoc) {
      // BUG 1 & 7: Redirect authenticated users away from auth routes immediately
      if (isAuth) {
        setCurrentRoute(userDoc.onboardingComplete === false ? 'onboarding' : 'dashboard');
        return;
      }

      // Onboarding guard for protected routes
      if (userDoc.onboardingComplete === false && !isAuth && currentRoute !== 'onboarding' && !isPublicMarketingRoute) {
        setCurrentRoute('onboarding');
      } else if (userDoc.onboardingComplete === true && currentRoute === 'onboarding') {
        setCurrentRoute('dashboard');
      }
    }
  }, [user, userDoc, currentRoute, isInitialized]);

  const handleNavigate = (route: PageRoute, params?: Record<string, string>) => {
    if (params?.id && (route === 'series-detail' || route === 'series')) {
      setSelectedSeriesId(params.id);
    }
    if (params?.q) {
      setResearchInitialQuery(params.q);
    }
    if (params?.category) {
      setResearchInitialCategory(params.category as any);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setCurrentRoute('studio');
  };

  const handleOpenPublishChecklist = (bookId: string) => {
    setSelectedPublishBookId(bookId);
    setCurrentRoute('publish');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isPublicMarketingRoute = [
    'home', 'pricing', 'about', 'terms', 'privacy', 'contact', 'changelog', 'blog', 'payment-success'
  ].includes(currentRoute);

  const isAuthRoute = ['login', 'signup', 'forgot-password', 'verify-email'].includes(currentRoute);
  const isOnboardingRoute = currentRoute === 'onboarding';

  return (
    <AuthProvider>
      {/* ─────────────────────────────────────────
          1. Public Marketing Route Group
         ───────────────────────────────────────── */}
      {isPublicMarketingRoute ? (
        <PublicLayout currentRoute={currentRoute} onNavigate={handleNavigate}>
          {currentRoute === 'home' && <HomePageView onNavigate={handleNavigate} />}
          {currentRoute === 'pricing' && <PricingPageView onNavigate={handleNavigate} />}
          {currentRoute === 'about' && <AboutPageView onNavigate={handleNavigate} />}
          {currentRoute === 'terms' && <TermsPageView onNavigate={handleNavigate} />}
          {currentRoute === 'privacy' && <PrivacyPageView onNavigate={handleNavigate} />}
          {currentRoute === 'contact' && <ContactPageView onNavigate={handleNavigate} />}
          {currentRoute === 'changelog' && <ChangelogPageView onNavigate={handleNavigate} />}
          {currentRoute === 'blog' && <BlogPageView onNavigate={handleNavigate} />}
          {currentRoute === 'payment-success' && <PaymentSuccessPageView onNavigate={handleNavigate} />}
        </PublicLayout>
      ) : isOnboardingRoute ? (
        /* ─────────────────────────────────────────
            2. Onboarding Flow
           ───────────────────────────────────────── */
        <OnboardingView onNavigate={handleNavigate} />
      ) : isAuthRoute ? (
        /* ─────────────────────────────────────────
            3. Auth Route Group
           ───────────────────────────────────────── */
        <AuthPages
          initialView={currentRoute as any}
          onNavigate={handleNavigate}
          onSuccess={() => {
            // BUG 5: Read fresh userDoc from store at call-time, not stale closure
            const freshDoc = useAuthStore.getState().userDoc;
            handleNavigate(freshDoc?.onboardingComplete === false ? 'onboarding' : 'dashboard');
          }}
        />
      ) : (
        /* ─────────────────────────────────────────
            4. Protected App Route Group
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
              onNewBook={() => setIsNewBookModalOpen(true)}
              onNavigate={handleNavigate}
              isSidebarCollapsed={isSidebarCollapsed}
            />

            {/* Pending Payment & Usage Warning Banners */}
            <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
              <PendingPaymentBanner onContactSupport={() => handleNavigate('contact')} />
              <UsageBanner onNavigateToPricing={() => handleNavigate('pricing')} />
            </div>

            {/* Page Content Viewport */}
            <main
              id="main-content"
              className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8
                ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
              `}
            >
              {currentRoute === 'dashboard' && (
                <DashboardView
                  onNavigate={handleNavigate}
                  onNewBook={() => setIsNewBookModalOpen(true)}
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
                  onNewBook={() => setIsNewBookModalOpen(true)}
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

              {currentRoute === 'billing' && <BillingPageView onNavigate={handleNavigate} />}

              {currentRoute === 'admin' && (
                <AdminGuard>
                  <AdminLayout pageTitle="Dashboard">
                    <AdminOverviewPage />
                  </AdminLayout>
                </AdminGuard>
              )}

              {currentRoute === 'admin-users' && (
                <AdminGuard>
                  <AdminLayout pageTitle="All Users">
                    <AdminUsersPage />
                  </AdminLayout>
                </AdminGuard>
              )}

              {currentRoute === 'admin-user-detail' && (
                <AdminGuard>
                  <AdminLayout pageTitle="User Detail">
                    <UserDetailPage
                      uid={typeof window !== 'undefined'
                        ? window.location.pathname.split('/').pop() || ''
                        : ''}
                    />
                  </AdminLayout>
                </AdminGuard>
              )}

              {currentRoute === 'admin-revenue' && (
                <AdminGuard>
                  <AdminLayout pageTitle="Revenue & MRR Analytics">
                    <RevenuePage />
                  </AdminLayout>
                </AdminGuard>
              )}

              {currentRoute === 'admin-payments' && (
                <AdminGuard>
                  <AdminLayout pageTitle="Payment History">
                    <PaymentsPage />
                  </AdminLayout>
                </AdminGuard>
              )}

              {currentRoute === 'admin-payments-upi' && (
                <AdminGuard>
                  <AdminLayout pageTitle="UPI Pending Verification">
                    <UpiQueuePage />
                  </AdminLayout>
                </AdminGuard>
              )}

              {currentRoute === 'admin-payments-bmac' && (
                <AdminGuard>
                  <AdminLayout pageTitle="Buy Me a Coffee Queue">
                    <BmacQueuePage />
                  </AdminLayout>
                </AdminGuard>
              )}

              {currentRoute === 'geo-test' && <GeoTestView />}
            </main>
          </div>

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
    </AuthProvider>
  );
};
