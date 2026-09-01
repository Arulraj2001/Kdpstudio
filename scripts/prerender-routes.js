import fs from 'fs';
import path from 'path';

/**
 * KDP Studio — Static Pre-Rendering Engine (Phase 1: Search Authority)
 * Generates pre-rendered static HTML files for all public marketing,
 * tool, and discovery routes so Googlebot indexes full semantic content instantly.
 */

const BASE_URL = 'https://kdpstudio-aio.web.app';

const PUBLIC_ROUTES = [
  {
    path: '/features',
    title: 'KDP Studio Features — AI Chapter Writing, 300 DPI Formatter & Cover Builder',
    description: 'Explore the complete Amazon KDP self-publishing suite. Write books with AI, format interiors with 300 DPI accuracy, design covers, and create puzzles in minutes.',
    keywords: 'KDP publishing features, book interior formatter, 300 DPI book layout, AI chapter writing, KDP cover builder',
    h1: 'Everything You Need to Publish Bestselling Books on Amazon KDP',
    subtitle: 'From initial manuscript outline to 300 DPI print-ready interior and cover design — all in one cloud workspace.',
    highlights: [
      'AI-Powered Chapter Studio with beat sheets and consistent author tone',
      'Automated 300 DPI PDF & EPUB interior formatting for 16 trim sizes',
      'Spine-calculated wrap cover builder with barcode safe areas',
      'Algorithmic puzzle generation suite for low-content publishing',
      '100% KDP & FTC compliant ARC Reader Lounge for early book discovery',
      'Author Newsletter Cross-Promotion Hub with click attribution tracking',
      'Multi-Format Manuscript Importer (.docx, .epub, .md, .txt) with chapter detection',
      '100% Author IP Guarantee with Zero AI Training on manuscripts',
    ],
  },
  {
    path: '/pricing',
    title: 'KDP Studio Pricing — Free Plan, Pro Author & Publisher Tiers',
    description: 'Simple, transparent pricing for Amazon KDP self-publishers. Start for free with daily quota resets or upgrade to Pro for unlimited exports and 300 DPI printing.',
    keywords: 'KDP studio pricing, self publishing software cost, free book formatter, Kindle publishing tools',
    h1: 'Transparent Pricing for Indie Authors & Publishers',
    subtitle: 'Start free with daily quota resets. Upgrade when you are ready to publish at scale.',
    highlights: [
      'Always Free Tier with daily resets and interior formatting',
      'Pro Plan with unlimited exports, AI writing, and high-speed generation',
      'Secure global payments via Credit Card, UPI, and Buy Me a Coffee',
      'Zero royalties taken: You keep 100% of your Amazon earnings',
    ],
  },
  {
    path: '/arc-lounge',
    title: 'ARC Reader Lounge — Free Advance Review Copies for Amazon KDP',
    description: 'Discover and download free advance reader copies (ARCs) from indie authors. Read early manuscripts and share voluntary, compliant reviews on Amazon.',
    keywords: 'ARC reader lounge, advance review copy, free book reviews, KDP ARC service, book review copies',
    h1: 'Advance Review Copies (ARCs) & Reader Discovery Lounge',
    subtitle: '100% Amazon KDP & FTC compliant reader community. Claim free early proofs and support independent authors.',
    highlights: [
      'Browse unreleased books across Romance, Thriller, Non-Fiction, and Sci-Fi',
      'Direct instant EPUB and PDF proof copy downloads',
      'Strictly voluntary reviews: zero forced ratings or quid pro quo',
      'Automated FTC & Amazon compliance disclosure text copying',
    ],
  },
  {
    path: '/tools',
    title: 'KDP Creator Tools Hub — Royalty Calculators, ASIN Spy & Puzzle Generators',
    description: 'Free Amazon KDP publishing utilities. Calculate printing costs and royalties, mine customer review pain points, and generate algorithmic puzzle interiors.',
    keywords: 'KDP tools, Amazon royalty calculator, KDP ASIN spy, puzzle book generator, lead magnet QR',
    h1: 'Amazon KDP Creator Power Tools Hub',
    subtitle: 'Algorithmic calculators, competitor research engines, and interior generators designed for self-publishers.',
    highlights: [
      'Amazon Printing Cost & Royalty Calculator across 13 marketplaces',
      'Reverse ASIN Spy & Competitor Sales Estimator',
      'Customer Review Pain-Point Miner for book angle validation',
      'Lead Magnet QR code generator for reader email list building',
    ],
  },
  {
    path: '/tools/royalty-calculator',
    title: 'Amazon KDP Royalty Calculator — Printing Costs for 13 Global Marketplaces',
    description: 'Calculate exact Amazon KDP paperback and hardcover printing costs, distribution fees, and net royalties across US, UK, Germany, India, and 9 other marketplaces.',
    keywords: 'KDP royalty calculator, Amazon book printing cost, KDP profit estimator, paperback royalty calculator',
    h1: 'Amazon KDP Printing Cost & Net Royalty Calculator',
    subtitle: 'Real-time profit calculations across all 13 global Amazon marketplaces for color, black & white, paperback, and hardcover books.',
    highlights: [
      'Exact page-count printing formulas updated for 2026',
      'Compare 60% standard distribution vs 40% expanded distribution',
      'Supports USD, GBP, EUR, CAD, AUD, JPY, and INR',
      'Instant profit margin visualization before publishing',
    ],
  },
  {
    path: '/puzzles/mazes',
    title: 'KDP Maze Puzzle Book Generator — Algorithmic Print-Ready PDF Interiors',
    description: 'Create unique commercial maze activity books for Amazon KDP. Generate circular, rectangular, and honeycomb mazes with automated solutions.',
    keywords: 'maze book generator, KDP puzzle book software, activity book creator, low content book maker',
    h1: 'Algorithmic Maze Puzzle Book Generator',
    subtitle: 'Generate high-resolution vector maze books with automated back-of-book solution answer keys.',
    highlights: [
      'Multiple algorithm styles: Recursive Backtracking, Prim’s, and Eller’s',
      'Circular, rectangular, and hexagonal maze geometry',
      '300 DPI vector PDF export ready for Amazon KDP upload',
      '100% commercial usage rights included',
    ],
  },
  {
    path: '/puzzles/sudoku',
    title: 'KDP Sudoku Generator — Unique 9x9 Commercial Puzzle Books with Solutions',
    description: 'Generate complete Sudoku books for Amazon KDP. Create Easy, Medium, Hard, and Expert 9x9 puzzles with 4-per-page answer keys in 300 DPI.',
    keywords: 'sudoku generator KDP, sudoku puzzle book maker, print on demand sudoku, low content publishing',
    h1: 'Commercial Sudoku Puzzle Book Generator',
    subtitle: 'Generate publication-ready 9×9 Sudoku books with verified unique solutions and customizable layout grids.',
    highlights: [
      'Calibrated difficulty levels from Beginner to Master',
      'Customizable 1, 2, or 4 puzzles per page layouts',
      'Automatic back-matter solution answer key generation',
      '100% unique seed generation with zero duplicate puzzles',
    ],
  },
  {
    path: '/studios/non-fiction',
    title: 'Non-Fiction Book Studio — Outlines, Case Studies & Frameworks for KDP',
    description: 'Write and format authority non-fiction books on Amazon KDP. Built-in templates for callout boxes, key takeaways, chapter summaries, and citations.',
    keywords: 'non-fiction book template, KDP non-fiction writing, self-help book formatter, business book publisher',
    h1: 'Non-Fiction Authority Book Studio',
    subtitle: 'Structure, write, and format high-impact business, self-help, and educational books for Amazon KDP.',
    highlights: [
      'Built-in frameworks for case studies, exercises, and takeaways',
      'Semantic heading hierarchy with auto-generated table of contents',
      'Clean typography with custom drop-caps and header ornaments',
      'Instant export to Kindle EPUB and print-ready PDF',
    ],
  },
  {
    path: '/about',
    title: 'About KDP Studio — The All-in-One Cloud Publishing Platform',
    description: 'Learn about KDP Studio, the modern cloud publishing platform designed to empower independent authors, low-content publishers, and book creators globally.',
    keywords: 'about KDP studio, self publishing company, indie author software mission',
    h1: 'Democratizing Self-Publishing for Indie Authors Everywhere',
    subtitle: 'We believe creating and publishing a beautiful book should be fast, accessible, and delightful.',
    highlights: [
      'Founded to eliminate complex formatting headaches for independent authors',
      'Empowering creators across 80+ countries with localized publishing tools',
      'Strict author data privacy and intellectual property guarantees',
      'Constantly evolving with cutting-edge AI and typographic layout engines',
    ],
  },
];

export async function prerenderPublicRoutes() {
  const distDir = path.resolve('dist');
  const baseHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(baseHtmlPath)) {
    console.warn('Cannot prerender: dist/index.html does not exist. Run viteBuild first.');
    return;
  }

  const baseHtml = fs.readFileSync(baseHtmlPath, 'utf8');
  console.log(`Pre-rendering ${PUBLIC_ROUTES.length} static public routes for Google Search Authority...`);

  for (const route of PUBLIC_ROUTES) {
    const routeDir = path.join(distDir, route.path.replace(/^\//, ''));
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }

    const fullUrl = `${BASE_URL}${route.path}`;

    // Replace Meta tags in <head>
    let html = baseHtml
      .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`)
      .replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${escapeHtml(route.title)}" />`)
      .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeHtml(route.description)}" />`)
      .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeHtml(route.title)}" />`)
      .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeHtml(route.description)}" />`)
      .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${fullUrl}" />`)
      .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${fullUrl}" />`)
      .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`)
      .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`)
      .replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${fullUrl}" />`);

    // Pre-inject semantic HTML inside <div id="root"> for crawlers
    const semanticContent = `
      <div id="root">
        <main class="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 sm:p-12 max-w-5xl mx-auto space-y-8">
          <header class="space-y-4 text-center">
            <div class="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
              KDP Studio • Publishing Platform
            </div>
            <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              ${escapeHtml(route.h1)}
            </h1>
            <p class="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto">
              ${escapeHtml(route.subtitle)}
            </p>
          </header>

          <section class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            ${route.highlights
              .map(
                (h) => `
              <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
                <span class="text-purple-600 font-bold text-lg leading-none">✓</span>
                <span class="text-sm font-semibold text-slate-800">${escapeHtml(h)}</span>
              </div>
            `
              )
              .join('')}
          </section>

          <div class="text-center pt-8">
            <a href="/signup" class="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all">
              Start Creating for Free on KDP Studio →
            </a>
          </div>
        </main>
      </div>
    `;

    html = html.replace('<div id="root"></div>', semanticContent);

    const outPath = path.join(routeDir, 'index.html');
    fs.writeFileSync(outPath, html, 'utf8');
  }

  console.log(`Pre-rendering completed! Generated ${PUBLIC_ROUTES.length} static HTML route pages.`);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Allow direct CLI invocation
if (process.argv[1]?.includes('prerender-routes')) {
  prerenderPublicRoutes().catch((err) => {
    console.error('Pre-rendering error:', err);
    process.exit(1);
  });
}
